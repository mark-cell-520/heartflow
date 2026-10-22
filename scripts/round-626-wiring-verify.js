// r626 接线效果验证：注入-删条-必须变红。
// 只报数字与形状，不贴任何样本原文（451 纪律）。
'use strict';
process.on('unhandledRejection', (e) => { console.error('UNHANDLED:', e && e.message); });
const path = require('path');
const { HeartFlow } = require(path.join(__dirname, '..', 'src', 'core', 'heartflow.js'));

const hf = new HeartFlow();
hf.start();

const R = {};
// ① 接线面
R.ar_keys = HeartFlow.ALLOWED_ROUTES instanceof Set ? HeartFlow.ALLOWED_ROUTES.size : -1;
R.sr_routes = [...HeartFlow.ALLOWED_ROUTES].filter((r) => r.startsWith('strategicRestraint')).length;
R.modules_key = !!hf._modules['strategicRestraint'];

// ② dispatch 逐方法可达性
const methods = ['load', 'evaluate', 'getDontList', 'addDont', 'removeDont', 'checkMission', 'getStats'];
const reach = {};
for (const m of methods) {
  try { hf.dispatch('strategicRestraint.' + m, {}); reach[m] = 'OK'; }
  catch (e) { reach[m] = 'THREW:' + String((e && e.message) || e).slice(0, 60); }
}
R.reach = reach;
R.reach_ok = Object.values(reach).filter((v) => v === 'OK').length;
R.reach_total = methods.length;

// ③ 辨别力：克制分析必须分化（restrained true / false 都要出现）
//    样文本事隔离在 test/round-626-strategic-restraint-samples.js（451 纪律：
//    原文只以文件形式存在于 test/，不进探针源码）。
const {
  StrategicRestraint,
} = require(path.join(__dirname, '..', 'src', 'cortex', 'strategic-restraint.js'));
const SAMPLES = require(path.join(__dirname, '..', 'test', 'round-626-strategic-restraint-samples.js'));
// 模块导出的键名是 CASES / BENIGN（大写），探针统一用小写视图。
const _cases = SAMPLES.CASES || SAMPLES.cases || [];
const _benign = SAMPLES.BENIGN || SAMPLES.benign || [];
const sr = hf.strategicRestraint;
sr.load();

const disc = [];
for (const s of _cases) {
  const ev = sr.evaluate(s.proposal);
  const ms = sr.checkMission(s.proposal);
  disc.push({
    id: s.id,
    expectRestrained: s.expectRestrained,
    expectMission: s.expectMission,
    restrained: !!ev.restrained,
    score: ev.score,
    matches: ev.matches.length,
    topMatch: ev.matches.length ? ev.matches[0].matchId : null,
    aligned: !!ms.aligned,
  });
}
R.disc = disc;
R.restrained_once = disc.some((d) => d.restrained);
R.pass_once = disc.some((d) => !d.restrained);
R.mission_on = disc.some((d) => d.aligned);
R.mission_off = disc.some((d) => !d.aligned);
R.disc_correct = disc.filter((d) => d.restrained === d.expectRestrained && d.aligned === d.expectMission).length;
R.disc_total = disc.length;
R.disc_wrong = disc.filter((d) => d.restrained !== d.expectRestrained || d.aligned !== d.expectMission)
  .map((d) => ({ id: d.id, restrained: d.restrained, want: d.expectRestrained, aligned: d.aligned, wantM: d.expectMission }));

// ④ 删条注入：把模块从 _modules 摘掉 → 路由必须立刻消失（证明守卫由本接线提供）
delete hf._modules['strategicRestraint'];
let gone = 0;
for (const m of methods) {
  try { hf.dispatch('strategicRestraint.' + m, {}); }
  catch (e) { if (/route not allowed/i.test(String((e && e.message) || e))) gone++; }
}
R.removed_notAllowed = gone;
R.removed_total = methods.length;

// ⑤ 单实例一致性：dispatch 拿到的就是 hf.strategicRestraint 本体
R.dispatch_is_same_instance = (function () {
  try { return hf.dispatch('strategicRestraint.getStats', {}) === hf.strategicRestraint.getStats() ? true : false; }
  catch (e) { return 'THREW:' + e.message.slice(0, 40); }
})();

// ⑥ 良性：规则引擎自身常用正当提案不应被误拦
const benignBlocked = _benign.filter((b) => sr.evaluate(b).restrained).length;
R.benign_blocked = benignBlocked;
R.benign_total = _benign.length;
R.benign_wrong = _benign.filter((b) => sr.evaluate(b).restrained);

console.log('RESULT=' + JSON.stringify(R));
process.exit(0);
