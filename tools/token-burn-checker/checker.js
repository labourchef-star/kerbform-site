/* Agent Loop & Token Burn Checker - runs entirely in the browser. Nothing is uploaded. */
(function (root) {
  'use strict';
  function norm(s) { return String(s == null ? '' : s).trim().replace(/\s+/g, ' '); }
  function textOf(c) {
    if (c == null) return '';
    if (typeof c === 'string') return c;
    if (Array.isArray(c)) return c.map(textOf).join('\n');
    if (typeof c === 'object') return c.text != null ? String(c.text) : (c.content != null ? textOf(c.content) : JSON.stringify(c));
    return String(c);
  }
  function keyFor(name, input) {
    input = input || {};
    var n = String(name || '');
    var p = input.file_path || input.path || input.notebook_path || input.filePath;
    if (/^bash$|shell|command/i.test(n) || input.command) return { tool: 'Bash', arg: norm(input.command || input.cmd || '') };
    if (p) return { tool: /read|view|cat/i.test(n) ? 'Read' : /edit|write|replace/i.test(n) ? 'Edit' : n, arg: norm(p), input: input };
    if (input.pattern) return { tool: n, arg: norm(input.pattern) };
    return { tool: n, arg: norm(JSON.stringify(input)).slice(0, 120) };
  }
  // ---- parsing -> list of events {tool, arg, error, editOld, editNew, chars}
  function parseJSONL(lines) {
    var events = [], byId = {}, ok = 0;
    lines.forEach(function (line) {
      line = line.trim(); if (!line || line[0] !== '{') return;
      var o; try { o = JSON.parse(line); } catch (e) { return; }
      ok++;
      var msg = o.message || o, content = msg.content;
      if (!Array.isArray(content)) return;
      content.forEach(function (b) {
        if (!b || typeof b !== 'object') return;
        if (b.type === 'tool_use') {
          var k = keyFor(b.name, b.input);
          var ev = { tool: k.tool, arg: k.arg, error: false, chars: JSON.stringify(b.input || {}).length };
          if (k.tool === 'Edit' && b.input) { ev.editOld = b.input.old_string; ev.editNew = b.input.new_string; }
          events.push(ev); if (b.id) byId[b.id] = ev;
        } else if (b.type === 'tool_result') {
          var t = textOf(b.content), ev2 = byId[b.tool_use_id];
          if (ev2) { ev2.chars += t.length; ev2.error = !!b.is_error || /exit code [1-9]|command failed|^error:/im.test(t); }
        }
      });
    });
    return ok ? events : null;
  }
  var CALL_RE = /^\s*(?:[⏺●•>*-]\s*)?(Read|Bash|Edit|Write|MultiEdit|Grep|Glob|LS|WebFetch|Task|View|Update)\s*\((.*)\)\s*$/;
  function parseText(lines) {
    var events = [], last = null;
    lines.forEach(function (line) {
      var m = line.match(CALL_RE);
      if (m) {
        var tool = m[1] === 'View' ? 'Read' : (m[1] === 'Update' || m[1] === 'MultiEdit' || m[1] === 'Write') ? 'Edit' : m[1];
        last = { tool: tool, arg: norm(m[2]), error: false, chars: line.length };
        events.push(last); return;
      }
      if (last) {
        last.chars += line.length + 1;
        if (/(^|\s)(error|failed|failure|exit code [1-9]|traceback|not found|ERR!)/i.test(line)) last.error = true;
      }
    });
    return events;
  }
  function parse(raw) {
    var lines = String(raw || '').split(/\r?\n/);
    return parseJSONL(lines) || parseText(lines);
  }
  // ---- detection
  function analyze(raw) {
    raw = String(raw || '');
    var ev = parse(raw);
    var totalTokens = Math.round(raw.length / 4);
    var reads = {}, fails = {}, edits = {};
    ev.forEach(function (e, i) {
      e.tokens = Math.round(e.chars / 4); e.i = i;
      if (e.tool === 'Read') (reads[e.arg] = reads[e.arg] || []).push(e);
      if (e.tool === 'Bash' && e.error) (fails[e.arg] = fails[e.arg] || []).push(e);
      if (e.tool === 'Edit') (edits[e.arg] = edits[e.arg] || []).push(e);
    });
    var offenders = [], wastedSet = {};
    // each offender keeps the list of events it considers wasted; global total counts each event ONCE
    function mark(list) { list.forEach(function (e) { wastedSet[e.i] = e; }); return list.reduce(function (s, e) { return s + e.tokens; }, 0); }
    // repeat-read: only re-reads of a file that was NOT edited since the last read count as waste
    Object.keys(reads).forEach(function (p) {
      var l = reads[p]; if (l.length < 3) return;
      var w = [];
      for (var k = 1; k < l.length; k++) {
        var prev = l[k - 1].i, cur = l[k].i, edited = (edits[p] || []).some(function (e) { return e.i > prev && e.i < cur; });
        if (!edited) w.push(l[k]);
      }
      if (w.length) offenders.push({ type: 'repeat-read', label: 'Read the same file', target: p, count: l.length, wastedTokens: mark(w) });
    });
    Object.keys(fails).forEach(function (c) { var l = fails[c]; if (l.length >= 2) offenders.push({ type: 'repeat-fail', label: 'Re-ran the same failing command', target: c, count: l.length, wastedTokens: mark(l.slice(1)) }); });
    // edit-revert: an edit whose new_string equals an earlier edit's old_string on same file (text logs: same file edited >=4 times)
    Object.keys(edits).forEach(function (p) {
      var l = edits[p], reverts = 0, w = [];
      for (var a = 0; a < l.length; a++) for (var b = a + 1; b < l.length; b++)
        if (l[a].editOld != null && l[b].editNew === l[a].editOld && l[b].editOld === l[a].editNew) { reverts++; w.push(l[a], l[b]); break; }
      if (reverts) offenders.push({ type: 'edit-revert', label: 'Edited then reverted', target: p, count: reverts, wastedTokens: mark(w) });
      else if (l[0].editOld == null && l.length >= 4) offenders.push({ type: 'edit-churn', label: 'Edited the same file over and over', target: p, count: l.length, wastedTokens: mark(l.slice(3)) });
    });
    // ping-pong: A,B,A,B... runs of alternating signatures (length >= 4)
    var sig = ev.map(function (e) { return e.tool + ' ' + e.arg; });
    var pp = {};
    for (var i = 0; i + 3 < sig.length; ) {
      var A = sig[i], B = sig[i + 1];
      if (A !== B && sig[i + 2] === A && sig[i + 3] === B) {
        var j = i + 4; while (j < sig.length && sig[j] === (((j - i) % 2) ? B : A)) j++;
        var key = A + '  <->  ' + B;
        pp[key] = pp[key] || { type: 'ping-pong', label: 'Bounced between two steps', target: key, count: 0, wastedTokens: 0 };
        pp[key].count += Math.floor((j - i) / 2); pp[key].wastedTokens += mark(ev.slice(i + 2, j));
        i = j - 1;
      } else i++;
    }
    Object.keys(pp).forEach(function (k) { offenders.push(pp[k]); });
    offenders.sort(function (a, b) { return b.wastedTokens - a.wastedTokens || b.count - a.count; });
    // de-duplicated total: an action flagged by several loop types counts once
    var wasted = Object.keys(wastedSet).reduce(function (s, k) { return s + wastedSet[k].tokens; }, 0);
    wasted = Math.min(wasted, totalTokens);
    var share = totalTokens ? wasted / totalTokens : 0;
    var wastedCalls = Object.keys(wastedSet).length;
    // conservative score: mostly token share, small bump for number of distinct wasted calls; capped at 95
    var score = offenders.length ? Math.min(95, Math.round(share * 75 + Math.min(20, wastedCalls * 1.5))) : 0;
    return { toolCalls: ev.length, totalTokens: totalTokens, wastedTokens: wasted, wastedShare: share, wastedCalls: wastedCalls, score: score, offenders: offenders };
  }
  var api = { analyze: analyze, parse: parse };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TokenBurn = api;
})(this);
