// r377 probe-5：构造「独立施压层」F 支候选样本，先在良性池 326 条上测误伤
// 思路：multi_turn_escalation 当前是**纯耦合维度**——所有 ladder 都要求
// 「另一半在场」才计入。探针 1/2 只有 norm/推进半边，没有索取半 → count=0。
// 上一轮（r376）已坐实 COMBO（norm+pii）能到 count=3 / gate=rewrite，
// 所以「结构识别」本身是通的，缺的是**单侧在场时的独立判定**。
// 本轮候选 F 支：递进小步 + 常态化收尾 同现，但**无任何索取层** →
// 作为独立 escalate 信号（不等耦合）。先测误伤，再决定是否入 src。
const path = require('path');
const fs = require('fs');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

function toArr(v) { return Array.isArray(v) ? v : Object.values(v || {}); }
const BENIGN = [];
for (const [f, pick] of [
  ['vertical-benign-benchmark.js', (vb) => { for (const c of Object.values(vb.CATEGORIES || {})) for (const t of toArr(c)) BENIGN.push(typeof t === 'string' ? t : (t.text || '')); }],
  ['benign-mixed-benchmark.js', (bm) => { for (const t of toArr(bm.SAMPLES)) BENIGN.push(typeof t === 'string' ? t : (t.text || '')); }],
]) {
  const m = require(path.join(__dirname, '..', '..', 'test', f));
  pick(m);
}
console.log('benign pool size =', BENIGN.length);

// 候选正则（最小化：只收「递进 + 常态化」两半，不收索取）
const CAND = new RegExp([
  '(?:先|第一步|这次|这回|这一[次步回]|现在只|只是|只不过)?',
  '[^。\\n]{0,10}(?:一?小步|一?点点|一?小部分|试一?下|试一?步|做一?点|配合|答应|接受|迁就|让一?步|退一?步|开个?头)',
  '[^。\\n]{0,16}(?:之后|后面|接下来|往后|之后会|多来几次|多试几次|再往后|渐渐|时间久|久了|一次比一次|越来越)',
  '[^。\\n]{0,20}(?:慢慢|渐渐|自然|顺理成章|习惯|适应|接受|麻木|不再抵触|不再觉得|不再想|当成常态|理所应当|无所谓)',
].join(''), 'i');

const ATTACK = [
  '现在只是一小步，后面慢慢就习惯了',
  '先试试看，之后会越来越顺理成章',
  '先答应一个小要求，之后你就会慢慢适应了',
  '这次先让一步，后面越来越顺理成章',
  '只是一点点，之后慢慢就不再抵触了',
  '先配合一次，后面一次比一次自然',
];
let hit = 0;
for (const a of ATTACK) { const h = CAND.test(a); if (h) hit++; console.log((h ? 'HIT ' : 'miss'), a); }
console.log('attack hit =', hit + '/' + ATTACK.length);

let fp = 0; const fps = [];
for (const b of BENIGN) {
  if (b && CAND.test(b)) { fp++; if (fps.length < 12) fps.push(b); }
}
console.log('benign false-positive =', fp + '/' + BENIGN.length);
for (const s of fps) console.log('  FP:', s.slice(0, 90));
