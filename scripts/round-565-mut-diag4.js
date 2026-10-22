'use strict';
// [r565 diag4] 定位：GUARD_ZH 置空后豁免样本 1/2 未转 hit —— 是哪一条、
// 缺哪条腿（A1 / A2 / 看守子支）。
const fs = require('fs');
const { checkFavorLedger } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/favor-ledger.js');
const mod = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/favor-ledger.js');
const I = mod.__internals();

const S1 = '我真的很感激你当年的提拔，这点事情我自己看着办。';
const S2 = '谢谢你这些年的提携，我会一直记着你对我的好，但这次评审按标准打分。';
const M = /(?!)ZZ/i;

function legs(s) {
  return {
    LEDGER_ZH: I.LEDGER_ZH.test(s), LEDGER_EN: I.LEDGER_EN.test(s),
    CLAIM_ZH: I.CLAIM_ZH.test(s), CLAIM_EN: I.CLAIM_EN.test(s),
    GUARD_ZH: I.GUARD_ZH.test(s), GUARD_EN: I.GUARD_EN.test(s),
  };
}
for (const [n, s] of [['S1', S1], ['S2', S2]]) {
  const l = legs(s);
  console.log(n, JSON.stringify(l));
  // 只置空 GUARD_ZH 时的复合判定
  const comp = (l.LEDGER_ZH || l.LEDGER_EN) && (l.CLAIM_ZH || l.CLAIM_EN);
  const nowGZ = M.test(s); // false
  console.log('   置空 GUARD_ZH 后 WOULD_HIT =', comp ? 'HIT' : 'MISS');
}

// 再验证：GUARD_ZH 置空 + 保留其它真实看守时，checkFavorLedger 的判定
delete require.cache[require.resolve('/root/.hermes/skills/ai/mark-heartflow-skill/src/favor-ledger.js')];
const orig = fs.readFileSync('/root/.hermes/skills/ai/mark-heartflow-skill/src/favor-ledger.js', 'utf8');
const a = orig.indexOf("const GUARD_ZH = new RegExp([");
const b = orig.indexOf("].join('|'));", a) + "].join('|'));".length;
const broken = orig.slice(0, a) + "const GUARD_ZH = /(?!)ZZ/i;" + orig.slice(b);
fs.writeFileSync('/tmp/fl-nogz.js', broken);
const fn = require('/tmp/fl-nogz.js').checkFavorLedger;
console.log('变异体 S1 hit =', fn(S1).hit, '| S2 hit =', fn(S2).hit);
fs.unlinkSync('/tmp/fl-nogz.js');
