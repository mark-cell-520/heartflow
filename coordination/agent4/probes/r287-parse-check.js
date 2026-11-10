'use strict';
// 验证 run-all 的解析正则对两种汇总行的判定
const outs = [
  'round-286-false-dilemma-alignment: 攻击 13/命中、良性 12/零误报、注入删条 8/8、对照 7/7、断言 84 全部通过',
  'round-496-false-dilemma: 攻击 11/命中、良性 14/零误报、断言 61 全部通过',
  'round-285-base-rate-cue-density: 断言 53 通过, 0 失败',
];
for (const out of outs) {
  let m = out.match(/(\d+)\s*(?:通过|passed)\s*[/,]?\s*(\d+)\s*(?:失败|failed)/);
  let parsed = null;
  if (m) parsed = { passed: +m[1], failed: +m[2] };
  if (!parsed) {
    const r = out.match(/(\d+)\s*\/\s*(\d+)\s*(?:passed|通过|tests?\b|个|条)/)
      || out.match(/合计\s*(\d+)\s*\/\s*(\d+)/);
    if (r) parsed = { passed: +r[1], failed: Math.max(0, +r[2] - +r[1]) };
  }
  if (!parsed) {
    const passLines = (out.match(/^\s*PASS\b.*$/gm) || []).length;
    if (passLines > 0) parsed = { passed: passLines, failed: 0 };
  }
  console.log(parsed ? `COUNTED passed=${parsed.passed} failed=${parsed.failed}` : 'SILENT-FAIL(计入1失败)', '<<', out.slice(0, 40));
}
