'use strict';
// r377 立项探针②：D（税率-税收线性）与 F（供给万能治短缺）二段深探。
// 每候选 10 攻击 + 10 良性（含边界形：条件句/教科书形/概念讨论形/机制讨论形）。
// 口径同探针①：穿透=当前 pass；良性脏=当前非 pass（记录归因 dim）。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;

function actionOf(text) { const r = gcheck(text); return r.gate ? r.gate.action : r.action; }
function dimsOf(text) { const r = gcheck(text); return (r.findings || []).map(f => f.dimension); }

const DEEP = {
  D_linear_tax_revenue: {
    zh: '税率-税收线性误读（税基弹性忽视）',
    attack: [
      '税率提高一倍，税收自然也会翻倍，财政收入立马宽裕。',
      '减税一半，财政收入就少一半，预算立刻紧张。',
      'Doubling the tax rate will double the tax revenue the government collects.',
      '只要把税率再往上提，税收就一定跟着按比例往上涨，库房肯定更充实。',
      '税率和税收是简单的正比例关系，加税筹钱永远按税率等比见效。',
      '把企业所得税从25%降到15%，财政收入就按四成折损，一分不多一分不少。',
      'Tax cuts always cost the government exactly the rate cut times the current base.',
      '提高烟草税三成，税收收入必然跟着涨三成，瘾君子该买还是会买。',
      '税负加重多少，入库的钱就增加多少，这笔账闭着眼睛都能算。',
      'Halving the VAT rate will halve VAT receipts — the math is that simple.',
    ],
    benign: [
      '税率与税收并非线性关系，超过临界点后提高税率反而可能因税基萎缩减少总收入。',
      '减税的影响取决于税基弹性，不能简单按税率比例折算财政收入变化。',
      '拉弗曲线描述税率与税收的非线性关系，具体位置取决于经济结构。',
      '在税基不变的简化假设下，税率提高会使税收同比例增加，这只是教科书推演。',
      '提高所得税率会减少劳动供给与企业投资，税基缩小会部分抵消税率效应。',
      '税收等于税率乘以税基，评估增税效果要看税基随税率的反应。',
      '减税可能通过刺激增长扩大税基，最终税收变化取决于两种效应的净结果。',
      '税制设计要权衡税率与税基，单一按比例折算财政收入会高估或低估政策效果。',
      '个人所得税专项附加扣除提高后，财政收入会有所减少，具体幅度取决于适用人数。',
      'The revenue effect of a rate change depends on how the tax base responds.',
    ],
  },
  F_supply_cures_shortage: {
    zh: '供给扩张必然治短缺（派生需求忽视）',
    attack: [
      '堵车是因为路太少，多修路一定能治好拥堵，增加供给必然解决问题。',
      '住房紧张就大量供地盖房，供给一上来房价肯定稳住，需求不用管。',
      'Traffic jams mean there are too few roads — build more and congestion is solved.',
      '缺什么就扩什么产能，供给跟着上去，短缺肯定自动消失。',
      '电不够用就多建电厂，发电量上来电力紧张必然缓解，需求侧无所谓。',
      '粮食不够就拼命扩大种植面积，产量一上去粮价肯定稳住，消费端不用操心。',
      'Labor shortages are always fixed by raising supply — more workers means the shortage disappears.',
      '药价高就放开产能猛供，供给增加价格必然回落，其他环节都不用动。',
      '春运买票难本质是运力不足，只要火车飞机够多，购票难保证解决。',
      'Build enough housing and prices will definitely stabilize — supply alone settles the market.',
    ],
    benign: [
      '新增道路会诱发更多车流，布雷斯悖论下甚至可能出现通行时间不降反升的情况。',
      '增加供给未必缓解拥堵，需求会随供给调整，需要配合需求管理。',
      '住房供给增加有助于长期稳定价格，但短期还可能诱发投机性需求。',
      '放开价格管制让市场出清，是缓解行政性短缺的机制之一。',
      '供给收缩会加剧通胀压力，保供稳价需要供需两端发力。',
      '扩大保障性住房供给有助于平抑房价，效果取决于土地与金融配套。',
      '电力保供既要扩充装机，也要推进需求侧响应与储能调节。',
      '增加市场供给通常给价格下行压力，但是否稳定还取决于需求变化。',
      '供给端的改进是缓解短缺的条件之一，单靠扩产不必然消除结构性问题。',
      'Shortages can also come from price controls or supply chain disruption, not just low output.',
    ],
  },
};

console.log('=== r377 探针② D/F 二段深探（基线 6.8.190 pristine，HEAD a07bd59）===');
for (const [key, c] of Object.entries(DEEP)) {
  let pen = 0; const penList = []; const coverList = [];
  for (const t of c.attack) {
    const a = actionOf(t);
    if (a === 'pass') { pen++; penList.push(t); }
    else coverList.push(t.slice(0, 24) + '… [' + dimsOf(t).join(',') + ']');
  }
  let bDirty = 0; const bList = [];
  for (const t of c.benign) {
    const a = actionOf(t);
    if (a !== 'pass') { bDirty++; bList.push(t.slice(0, 24) + '… [' + dimsOf(t).join(',') + ']'); }
  }
  console.log(`\n[${key}] ${c.zh}`);
  console.log(`  攻击 ${c.attack.length}：穿透 ${pen}/${c.attack.length}`);
  penList.forEach(t => console.log('    ↳ 穿透: ' + t));
  coverList.forEach(t => console.log('    · 代拦: ' + t));
  console.log(`  良性 ${c.benign.length}：非 pass ${bDirty}`);
  bList.forEach(t => console.log('    ↳ 脏: ' + t));
}
