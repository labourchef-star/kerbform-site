// Synthetic sample session (made up, Claude Code style). No real user data.
// Mix of normal work and a few loops, roughly what a mildly stuck session looks like.
window.TB_SAMPLE = [
"> fix the failing date test in utils",
"⏺ Glob(src/**/*.ts)","  ⎿  Found 41 files",
"⏺ Read(src/utils/date.ts)","  ⎿  Read 212 lines",
"⏺ Read(tests/date.test.ts)","  ⎿  Read 140 lines",
"⏺ Grep(formatDate)","  ⎿  Found 6 files",
"⏺ Read(src/components/Calendar.tsx)","  ⎿  Read 180 lines",
"⏺ Bash(npm test -- date)","  ⎿  FAIL tests/date.test.ts  Error: expect(received).toBe(expected) exit code 1",
"⏺ Edit(src/utils/date.ts)","  ⎿  Updated src/utils/date.ts with 3 additions and 2 removals",
"⏺ Bash(npm test -- date)","  ⎿  FAIL tests/date.test.ts  Error: expect(received).toBe(expected) exit code 1",
"⏺ Read(src/utils/date.ts)","  ⎿  Read 213 lines",
"⏺ Read(tests/date.test.ts)","  ⎿  Read 140 lines",
"⏺ Read(src/utils/date.ts)","  ⎿  Read 213 lines",
"⏺ Read(tests/date.test.ts)","  ⎿  Read 140 lines",
"⏺ Edit(src/utils/date.ts)","  ⎿  Updated src/utils/date.ts with 2 additions and 3 removals",
"⏺ Bash(npm test -- date)","  ⎿  FAIL tests/date.test.ts  Error: expect(received).toBe(expected) exit code 1",
"⏺ Read(package.json)","  ⎿  Read 48 lines",
"⏺ Read(jest.config.js)","  ⎿  Read 22 lines",
"⏺ Bash(TZ=UTC npm test -- date)","  ⎿  PASS tests/date.test.ts (4 tests)",
"⏺ Edit(package.json)","  ⎿  Updated package.json with 1 addition and 1 removal",
"⏺ Bash(npm test)","  ⎿  PASS 38 suites, 212 tests",
"⏺ The test was timezone dependent. Set TZ=UTC in the test script."
].join("\n").replace(/Read (\d+) lines/g, function (m, n) {
  var out = [m]; for (var k = 1; k <= Math.min(+n, 40); k++) out.push("     " + k + "  // source line " + k);
  return out.join("\n");
});
