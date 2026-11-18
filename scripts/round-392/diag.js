'use strict';
const path = require('path');
const mod = require(path.join(__dirname, '..', '..', 'src', 'per-protocol-misread.js'));
const I = mod.__internals();
const text = '按照完成试验的受试者来分析，这种疗法的真实效果无可置疑。';
function allM(re, t) {
  const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const out = []; let m;
  while ((m = reG.exec(t)) !== null) { out.push(m[0]); if (m.index === reG.lastIndex) reG.lastIndex++; }
  return out;
}
console.log('P5 :', JSON.stringify(allM(I.POP_ZH_P5, text)));
console.log('P5B:', JSON.stringify(allM(I.POP_ZH_P5B, text)));
console.log('E2 :', JSON.stringify(allM(I.EFF_ZH_E2, text)));
console.log('E1 :', JSON.stringify(allM(I.EFF_ZH_E1, text)));
console.log('CONCEPT_ZH:', I.CONCEPT_ZH.test(text));
console.log('CORRECT_ZH:', I.CORRECT_ZH.map(r => r.test(text)));
console.log('NEG1_ZH gap test:', /(?:并不|并未|并不能|绝不能|不能|不可|不应|不宜|不用|无须|无需|勿|别|没|无|非|未)/.test('，'));
// 逐腿守卫诊断：复刻 findSignatures 逻辑
const NEG_ZH = /(?:并不|并非|未必|不一|不|没|无)/;
const HEDGE_ZH = /(?:不意味着|并不意味着|并不等于|不代表|不说明|不证明|误解|错误|谬误|不对|不成立|站不住|想当然|混淆|误区|误读|简单化|一刀切|偏离|误用|偏误|偏差|非理性|不可取|不应|忽略了|跳过|绝非|并不是|不等于|并非|未必|不一定|高估|夸大|夸大其词|虚高|吹嘘|夸大疗效)/;
const effM = allM(I.EFF_ZH_E2, text);
for (const raw of effM) {
  const idx = text.indexOf(raw);
  const beforeZh = text.slice(Math.max(0, idx - 6), idx);
  const afterZh = text.slice(idx + raw.length, idx + raw.length + 20);
  console.log('eff raw=' + raw + ' before=' + JSON.stringify(beforeZh) + ' NEG=' + NEG_ZH.test(beforeZh) + ' HEDGE(before/after)=' + HEDGE_ZH.test(beforeZh) + '/' + HEDGE_ZH.test(afterZh));
}
