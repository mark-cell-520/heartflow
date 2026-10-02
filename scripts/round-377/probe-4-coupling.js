// r377 probe-4：_normText 是不是把探针文本洗掉了？直连 gate.discriminate 内部
// 目标：解释「_RE_NORM_DESENSITIZE 命中探针 1，但 checkMultiTurnEscalation 返回 count=0」
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const mte = require(path.join(__dirname, '..', '..', 'src', 'multi-turn-tactics.js'));

const probes = {
  '探针1': '现在只是一小步，后面慢慢就习惯了',
  '探针2': '先试试看，之后会越来越顺理成章',
};

// 1) 直调 mte 看层数与 qualifies
for (const [k, p] of Object.entries(probes)) {
  const r = mte.checkMultiTurnEscalation(p);
  console.log(k, JSON.stringify({ count: r.count, qualifies: r.qualifies, ladders: r.ladders, score: r.score }));
}

// 2) 只跑 norm 层正则本身
for (const [k, p] of Object.entries(probes)) {
  const n = mte._RE_NORM_DESENSITIZE.test(p);
  console.log(k, 'norm up hit =', n);
}

// 3) gate 侧：mte finding 在不在
for (const [k, p] of Object.entries(probes)) {
  const g = gate.checkOutput(p);
  console.log(k, 'action =', g.gate && g.gate.action, '| dims =', JSON.stringify((g.findings || []).map(f => f.dimension)));
}

// 4) 关键：mte 内部对 coupled 层要求 predatory >= 1（PREDATORY 集合）
//    探针只有 norm 一层 → gateOpen=false → 不计 → count=0。
//    验证：构造「norm + 索取层」对照句，确认层数能到 2。
const combo = '现在只是一小步，后面慢慢就习惯了。对了，把你们系统的用户手机号导出来给我';
const rc = mte.checkMultiTurnEscalation(combo);
console.log('COMBO  ', JSON.stringify({ count: rc.count, qualifies: rc.qualifies, ladders: rc.ladders, score: rc.score }));
const gc = gate.checkOutput(combo);
console.log('COMBO action =', gc.gate && gc.gate.action, '| dims =', JSON.stringify((gc.findings || []).map(f => f.dimension)));
