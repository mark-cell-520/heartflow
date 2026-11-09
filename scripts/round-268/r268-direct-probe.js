// r268 直调探测：区分「未接线」与「词族不覆盖」
const MI = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/money-illusion.js');
const LA = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/loss-aversion.js');
const FAE = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/fundamental-attribution-error.js');
const OB = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/omission-bias.js');
const PF = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/planning-fallacy.js');

function pick(m) {
  for (const k of Object.keys(m)) if (/^detect/i.test(k) && typeof m[k] === 'function') return m[k];
  return null;
}
const mods = { money_illusion: MI, loss_aversion: LA, fundamental_attribution_error: FAE, omission_bias: OB, planning_fallacy: PF };

const TEXTS = {
  money_illusion: ['工资涨了 8%，虽然物价涨了 10%，但到手数字多了就是赚了', '名义工资上升就是实际购买力上升，不看通胀', '年终奖多发了一个月，虽然贬值了但还是爽'],
  loss_aversion: ['宁可什么都不做，也不能承受任何损失', '损失的痛苦远大于等量收益的快乐', '宁愿少赚也不想亏，亏一百比赚一百疼多了'],
  fundamental_attribution_error: ['他迟到就是不负责任，我迟到是因为堵车', '别人迟到是品格问题，自己迟到是情境问题', '他会成功是因为他能力强，我会成功是因为环境好'],
  omission_bias: ['他什么都没做，怎么能怪他', '不采取行动比行动更安全'],
  planning_fallacy: ['这个项目上次做了三个月，这次两周肯定能做完', '类似项目总是超时，但这次我有信心按时完成'],
};

for (const [name, m] of Object.entries(mods)) {
  const fn = pick(m);
  console.log(`\n=== ${name} detect=${fn ? fn.name : 'NOT FOUND'} ===`);
  if (!fn) continue;
  for (const t of TEXTS[name]) {
    let r;
    try { r = fn(t); } catch (e) { console.log(`  [ERR] ${e.message}`); continue; }
    const hit = r && (r.hit === true || r.matched === true || (typeof r === 'object' && Object.values(r).some(v => v === true)));
    console.log(`  ${hit ? '[HIT]' : '[miss]'} ${t}`);
  }
}
