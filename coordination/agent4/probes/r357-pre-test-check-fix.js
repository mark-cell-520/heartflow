'use strict';
// r357 三处失败修正前的实测确认。
const path = require('node:path');
const ROOT = '/data/home/heartflow';
const { checkImmortalTimeBias } = require(path.join(ROOT, 'src', 'immortal-time-bias.js'));
const hitI = (t, inj) => checkImmortalTimeBias(t, inj).hit === true;
const I0 = require(path.join(ROOT, 'src', 'immortal-time-bias.js')).__internals();
const legacyHit = (t) => I0.CASE_SURGE_ZH.some(re => { re.lastIndex = 0; return re.test(t); });

console.log('-- 井喷框架形 legacy 承重检查 --');
for (const s of [
  '筛查推广后，新增病例迎来井喷式增长，说明患病率真的在上升。',
  '筛查推广后，新增病例迎来井喷，说明患病率真的在上升。',
  '筛查推广后，新增病例出现井喷，说明患病率真的在上升。',
  '普筛开展后，新发病例陷入井喷，说明患病率真的在升高。',
]) {
  console.log((legacyHit(s) ? 'legacy-HIT ' : 'legacy-pass') + ' | ' + s.slice(0, 30) + ' | 全命中=' + hitI(s) + ' | ZH7删=' + (hitI(s, { CASE_SURGE_ZH7: [] }) ? 'HIT' : 'pass'));
}
console.log('-- 跨腿窗样本构造 --');
const filler = '这是一段完全无关的社区活动筹备说明，涵盖场地预订、桌椅数量核对、音响设备调试、志愿者排班、天气与交通提醒、为期两周的准备窗口、附件表格里的预算与物资清单、已经用邮件发出的会议通知，以及任何临时变动都会在群里同步。感谢大家的配合，期待活动顺利举行、出席率良好、现场执行顺畅。第二部分补充说明：彩排时间定在周四晚上，签到台需要两名志愿者，餐饮供应商会提前一天把食材送到现场，停车位有限请大家尽量拼车前往，现场网络由场地方提供，备用方案是移动热点。';
const s = '检查技术突飞猛进' + filler + '让更多病例被重新发现，这说明患病率真的在上升。';
console.log('腿② index=' + s.indexOf('被重新发现') + ' >160? ' + (s.indexOf('被重新发现') > 160));
console.log('全命中=' + hitI(s) + '（应 false——跨腿窗）');
console.log('-- D 段注入修正验证：r356 独担句在三新族置空下仍命中 --');
const s2 = '检查普及以来，众多隐匿病灶被陆续发现，说明患病率真的在上升。';
console.log('ZH6 置空 + 三新族置空 = ' + (hitI(s2, { DETECT_UP_ZH7: [], CASE_SURGE_ZH7: [], INCIDENCE_CLAIM_ZH4: [] }) ? 'HIT ✓' : 'pass ✗'));
