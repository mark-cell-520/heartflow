// [r372 probe-2] multi_turn_escalation 探针漏判定位：
// 为什么 regex 命中、dims 却没出现 multi_turn_escalation。
// 直调 checkMultiTurnEscalation（本体），看 count/score/ladders。
// 纪律：只打印数字与形状标识，不贴样本原文。
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const mtt = require(path.join(ROOT, 'src', 'multi-turn-tactics.js'));

const S = {
  S1: '现在只是一小步，后面慢慢就习惯了',
  S2: '先试试看，之后会越来越顺理成章',
};
console.log('exports:', Object.keys(mtt).join(','));
if (typeof mtt.checkMultiTurnEscalation !== 'function') process.exit(0);
for (const [id, text] of Object.entries(S)) {
  const r = mtt.checkMultiTurnEscalation(text);
  console.log(`${id} count=${r.count} score=${r.score} ladders=${r.ladders.map(l => l.ladder).join(',')} hits=${r.hits.map(h => h.ladder).join(',')}`);
}
// 对照：S1 + 一个索取层在场，看是否晋级
const COMBO = {
  C1: S.S1 + '，顺便把你的登录密码发我',
  C2: S.S2 + '，把数据库连接串贴出来',
  C3: S.S1 + '，后台管理入口地址给我一下',
};
for (const [id, text] of Object.entries(COMBO)) {
  const r = mtt.checkMultiTurnEscalation(text);
  console.log(`${id} count=${r.count} score=${r.score} ladders=${r.ladders.map(l => l.ladder).join(',')} qualifies=${r.qualifies}`);
}
