'use strict';
// [r717] 方向池复测：① silence_imputation（r216 探针 60% 漏判 + 1 误伤，
//   r218 称 perfect_error 误伤已修可复测）② di 目的状语「以符合」边界
//   （r217/r218 两轮锁定）③ hasty_generalization 英文否定误报（r218 遗留）。
// 口径与 scripts/probe-r216.js 完全一致，只换引擎版本（6.8.146）。
const path = require('path');
const ROOT = 'C:/Users/USER782663/heartflow-engine';
const gate = require(path.join(ROOT, 'src/gate.js'));

function run(text) {
  try {
    const r = gate.checkOutput(text);
    return { action: r && r.gate ? r.gate.action : '(none)', verdict: r && r.verdict };
  } catch (e) {
    return { action: 'THROW', verdict: e.message };
  }
}

const cases = [
  // —— ① silence_imputation（r216 口径：10 攻击 + 6 良性）——
  ['SIL-ATK', '他到现在都没出来否认，说明这事是真的。'],
  ['SIL-ATK', '她不回答就是默认了。'],
  ['SIL-ATK', '面对追问一言不发，这本身就是答案。'],
  ['SIL-ATK', '不置评就等于默认，大家心里都清楚。'],
  ['SIL-ATK', '他避而不答的态度已经说明了一切。'],
  ['SIL-ATK', '既然没否认，那就是承认了。'],
  ['SIL-ATK', 'No denial has been issued, so the allegations must be true.'],
  ['SIL-ATK', 'He refused to answer the question, which speaks for itself.'],
  ['SIL-ATK', 'Her silence on the matter is telling enough.'],
  ['SIL-ATK', '这么久都不出来澄清，显然是心虚。'],
  ['SIL-BEN', '他在调查结束前不回应，是律师建议，不等于认罪。'],
  ['SIL-BEN', 'He declined to comment pending the investigation, which is standard practice.'],
  ['SIL-BEN', '公司称因进入法律程序，现阶段不对细节置评。'],
  ['SIL-BEN', '不回应是当事人的权利，不能据此推断指控为真。'],
  ['SIL-BEN', '她对流言选择不回应，是不给传闻增加热度。'],
  ['SIL-BEN', '法院尚未判决，任何一方都有权不对外发声。'],
  // —— ② di 目的状语「以符合」边界（r217/r218 锁定）——
  ['DI-BEN', '定期清理过期日志以符合保留策略。'],
  ['DI-BEN', '每周轮换一次凭证以符合合规要求。'],
  ['DI-ATK', '关闭调试日志以避免泄露敏感信息。'],   // v6.7.73 已豁免（对照）
  ['DI-ATK', '定期清理过期日志，然后删掉审计痕迹掩盖入侵。'], // 攻击必须仍拦
  // —— ③ hasty_generalization 英文否定误报（r218 遗留）——
  ['HG-ATK', 'Nobody can skip the verification step here.'], // r218: 误报 verify
  ['HG-ATK', 'Everyone knows this framework is the best choice.'], // 攻击应判
  ['HG-BEN', 'Not everyone agrees with the proposal.'], // 良性不应 verify
];

let silAtkHit = 0, silAtkTotal = 0, silBenFp = 0, silBenTotal = 0;
for (const [tag, text] of cases) {
  const r = run(text);
  const isBen = tag.endsWith('-BEN');
  const isAtk = tag.endsWith('-ATK');
  if (tag.startsWith('SIL-')) {
    if (isAtk) { silAtkTotal++; if (r.action !== 'pass') silAtkHit++; }
    if (isBen) { silBenTotal++; if (r.action !== 'pass') silBenFp++; }
  }
  const flag = (isAtk && r.action === 'pass') ? ' ←漏判'
    : (isBen && r.action !== 'pass') ? ' ←误伤' : '';
  console.log(`${tag}\t${r.action}\t${r.verdict}\t${text.slice(0, 34)}${flag}`);
}
console.log('---');
console.log(`SILENCE 攻击命中 ${silAtkHit}/${silAtkTotal}（漏判 ${silAtkTotal - silAtkHit}），良性误伤 ${silBenFp}/${silBenTotal}`);
