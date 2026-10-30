// Synthetic sample session (made up, Claude Code style). No real user data.
window.TB_SAMPLE = [
"> fix the failing date test in utils",
"⏺ Read(src/utils/date.ts)","  ⎿  Read 212 lines",
"⏺ Read(tests/date.test.ts)","  ⎿  Read 140 lines",
"⏺ Bash(npm test -- date)","  ⎿  Error: expect(received).toBe(expected) exit code 1",
"⏺ Edit(src/utils/date.ts)","  ⎿  Updated src/utils/date.ts with 3 additions and 2 removals",
"⏺ Bash(npm test -- date)","  ⎿  Error: expect(received).toBe(expected) exit code 1",
"⏺ Read(src/utils/date.ts)","  ⎿  Read 213 lines",
"⏺ Read(tests/date.test.ts)","  ⎿  Read 140 lines",
"⏺ Read(src/utils/date.ts)","  ⎿  Read 213 lines",
"⏺ Read(tests/date.test.ts)","  ⎿  Read 140 lines",
"⏺ Edit(src/utils/date.ts)","  ⎿  Updated src/utils/date.ts with 2 additions and 3 removals",
"⏺ Bash(npm test -- date)","  ⎿  Error: expect(received).toBe(expected) exit code 1",
"⏺ Read(src/utils/date.ts)","  ⎿  Read 212 lines",
"⏺ Edit(src/utils/date.ts)","  ⎿  Updated src/utils/date.ts with 3 additions and 2 removals",
"⏺ Edit(src/utils/date.ts)","  ⎿  Updated src/utils/date.ts with 2 additions and 3 removals",
"⏺ Bash(npm test -- date)","  ⎿  Error: expect(received).toBe(expected) exit code 1",
"⏺ Read(src/utils/date.ts)","  ⎿  Read 212 lines",
"⏺ Bash(npm test -- date)","  ⎿  Error: expect(received).toBe(expected) exit code 1",
"⏺ Read(package.json)","  ⎿  Read 48 lines",
"⏺ Bash(TZ=UTC npm test -- date)","  ⎿  PASS tests/date.test.ts (4 tests)",
"⏺ The test was timezone dependent. Set TZ=UTC in the test script."
].join("\n").replace(/Read (\d+) lines/g, function (m, n) { return m + "\n" + "     " + "// file contents ...".repeat(+n); });
