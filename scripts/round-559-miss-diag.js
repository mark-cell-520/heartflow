// r559：第 83 维度 miss 归因诊断（隔离样本，只输出形状不输出原文）
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const mod = require(path.join(ROOT, 'src/paternalistic-decide.js'));
const I = mod.__internals();

const CASES = [
  ['zh', 0, 'I decided for you, it is for your own good.'],   // placeholder replaced below
];

// 直接以 probe 的样本序号诊断，不在此重复样本原文；从 probe 反查
const probe = require(path.join(ROOT, 'scripts/round-558-wiring-probe.js'));
const src = require('fs').readFileSync(path.join(ROOT, 'scripts/round-558-wiring-probe.js'), 'utf8');
function grabArr(name) {
  const m = src.match(new RegExp('const ' + name + ' = \\[([\\s\\S]*?)\\];'));
  if (!m) return [];
  return m[1].split('\n').map(s => s.trim()).filter(s => s.startsWith("'")).map(s => s.slice(1, s.lastIndexOf("'")));
}
const ATK_ZH = grabArr('ATK_ZH'), ATK_EN = grabArr('ATK_EN'), BENIGN_ZH = grabArr('BENIGN_ZH'), BENIGN_EN = grabArr('BENIGN_EN');

function diag(t) {
  const r = mod.checkPaternalisticDecide(t);
  return {
    hit: r.hit,
    paternal: I.PATERNAL_ZH.test(t) ? 'ZH' : (I.PATERNAL_EN.test(t) ? 'EN' : '-'),
    decide: I.DECIDE_ZH.test(t) ? 'ZH' : (I.DECIDE_EN.test(t) ? 'EN' : '-'),
    silence: I.SILENCE_ZH.test(t) ? 'ZH' : (I.SILENCE_EN.test(t) ? 'EN' : '-'),
    exempt: I.EXEMPT_ZH.test(t) ? 'ZH' : (I.EXEMPT_EN.test(t) ? 'EN' : '-'),
  };
}

for (const [nm, arr] of [['ATK_ZH', ATK_ZH], ['ATK_EN', ATK_EN]]) {
  arr.forEach((t, i) => {
    const d = diag(t);
    if (!d.hit) console.log(`${nm}#${i + 1} miss → P=${d.paternal} D=${d.decide} S=${d.silence} X=${d.exempt}`);
  });
}
for (const [nm, arr] of [['BENIGN_ZH', BENIGN_ZH], ['BENIGN_EN', BENIGN_EN]]) {
  arr.forEach((t, i) => {
    const d = diag(t);
    if (d.hit || d.exempt !== '-') console.log(`${nm}#${i + 1} -> hit=${d.hit} X=${d.exempt}`);
  });
}
// 良性里若出现 P/D/S 单支在场（不豁免的），记下来看路由③的误伤面积
for (const [nm, arr] of [['BENIGN_ZH', BENIGN_ZH], ['BENIGN_EN', BENIGN_EN]]) {
  const armed = arr.filter(t => { const d = diag(t); return (d.paternal !== '-' && d.silence !== '-') || (d.decide !== '-' && d.silence !== '-'); });
  console.log(`${nm} 会被路由②/③波及的条数: ${armed.length}/${arr.length}`);
}
