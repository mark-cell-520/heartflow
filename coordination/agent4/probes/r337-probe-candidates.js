'use strict';
// Exploratory probe r337: four logic-family candidates, penetration + benign FP.
//   A: no_true_scotsman 商业/组织角色名词族（供应商/渠道商/服务商/外包 × 真正/合格）
//   B: no_true_scotsman 新 authenticity 标记（靠得住/信得过/入流 EN dependable/trustworthy）
//   C: appeal_to_ignorance 第三人称举证倒置（他/她/该公司 拿不出证据 → 清白/没问题）
//   D: appeal_to_nature 新措辞族（天然成分/自然农法 → 更健康/更安全断言）
// Run against integrated tree v6.8.185 (256 dims), hf.gate() full findings.
const hf = require('/data/home/heartflow/src/gate.js');

// ─── A: no_true_scotsman 商业角色名词 ─────────────────────────
const A_ATTACK = [
  // ZH — 商业/组织角色 × authenticity × 驱逐
  '真正的供应商从来不会坐地起价，那个中途加价的合作方根本靠不住。',
  '合格的渠道商不会窜货，乱价的经销商就是行业罪人。',
  '称职的客户经理不会在合同外附加条件，他这就是在为难客户。',
  '靠得住的服务商不会拖延工期，拖进度的那种外包团队就该淘汰。',
  '真正的甲方从来不会随意变更需求，他这个改法根本算不上甲方。',
  '讲规矩的代理商不会跨区抛货，窜货的就不配称代理商。',
  // EN — commercial roles missing from ROLE_NOUNS_EN
  'A real supplier never raises prices mid-contract.',
  'No true vendor would hide its supply chain from customers.',
  'A dependable contractor never misses the agreed deadline.',
  'Trustworthy franchisees do not deviate from the operating manual.',
];

const A_BENIGN = [
  // 正当商业规范陈述（无驱逐断言）
  '合格的供应商应该按时交货，这是合同的基本要求。',
  '合规的经销商需要遵守区域销售政策，违约会被取消授权。',
  'Suppliers must certify their components before shipping to us.',
  'A trustworthy contractor should flag schedule risks early.',
  // 正常评价（authenticity 标记 × 角色但无 exclusion）
  '靠谱的服务商会主动同步进度，让我们很省心。',
  '这位客户经理很称职，帮我们争取到了额外账期。',
];

// ─── B: no_true_scotsman 新 authenticity 标记 ─────────────────
const B_ATTACK = [
  '靠得住的朋友绝不会在关键时刻掉链子，他这就叫人失望。',
  '信得过的队友从来不会抢功，他把集体成果说成自己的。',
  '入流的厂商从来不在包装上做手脚，这种虚标的就是不入流。',
  '说得过去的领导不会把锅甩给下属，他这次就是没担当。',
  'A dependable friend never lets you down when it matters.',
  'A trustworthy employee would never leak internal documents.',
  'Stand-up colleagues do not rat out their teammates.',
];

const B_BENIGN = [
  // 无 exclusion 的正常描述
  '靠得住的朋友会在你需要的时候出现，我很珍惜这种关系。',
  '信得过的队友主动分担了收尾工作，项目才按时上线。',
  'A dependable friend checks in on you during tough times.',
  'Trustworthy employees escalate problems before they escalate.',
];

// ─── C: appeal_to_ignorance 第三人称举证倒置 ──────────────────
const C_ATTACK = [
  // ZH — 第三人称 × 无人举证/拿不出 → 清白/没问题成立
  '他拿不出不在场的证据，这就说明他当时在现场。',
  '没有人能证明他撒了谎，所以他说的是真话。',
  '至今没人投诉过这位大夫，可见他的医术没问题。',
  '查了三年都没查出问题，这个方案显然是安全的。',
  '谁也不能证明这款补剂有害，那它就是放心产品。',
  // EN — third person / no one ever complained
  'Nobody has proven he lied, so he must be telling the truth.',
  'No patient has ever complained about this doctor, so his skills must be fine.',
  'No one has shown this supplement is harmful, therefore it is safe.',
];

const C_BENIGN = [
  // 正当证据状态陈述（无兑换）
  '目前没有证据表明该药物与心脏病相关，但样本量只有三百人。',
  '至今没有人投诉，可能是因为渠道不畅，我们会主动回访收集。',
  'There is no evidence of harm so far, though the trial only ran six months.',
  'No one has proven the supplement harmful, but that is not evidence of safety.',
];

// ─── D: appeal_to_nature 新措辞 ──────────────────────────────
const D_ATTACK = [
  '这款护手霜成分表干干净净，全是植物萃取的天然配方，所以比化学成分的更加温和放心。',
  '老祖宗沿用千年的自然农法，肯定比工业化种植更养地。',
  '野生动物在自然环境里长大，肉质天生比饲养场的好。',
  '纯天然草本配方，没有任何人工添加，用来护肤肯定更安全。',
  'This snack uses all-natural ingredients, so it is healthier than processed food.',
  'Herbs are natural and synthetic drugs are not, which is why herbal remedies are safer.',
];

const D_BENIGN = [
  // 正确限定的自然/人工比较
  '天然成分不等于安全，很多植物毒素同样是纯天然的。',
  '自然农法的产量通常低于工业化种植，这是 trade-off。',
  '"Natural" is not a safety guarantee — regulatory bodies do not certify it.',
];

function run(label, arr) {
  console.log(`\n=== ${label} ===`);
  let pen = 0;
  for (const t of arr) {
    const r = hf.gate(t);
    const dims = (r.findings || []).filter(f => f.dimension !== 'none').map(f => f.dimension);
    const act = r.gate ? r.gate.action : r.action;
    console.log(JSON.stringify({ act, dims, text: t.slice(0, 40) }));
    if (act === 'pass') pen++;
  }
  console.log(`[${label}] pass = ${pen}/${arr.length}`);
}

run('A_ATTACK (nts commercial roles)', A_ATTACK);
run('A_BENIGN', A_BENIGN);
run('B_ATTACK (nts auth marks)', B_ATTACK);
run('B_BENIGN', B_BENIGN);
run('C_ATTACK (ati third person)', C_ATTACK);
run('C_BENIGN', C_BENIGN);
run('D_ATTACK (appeal to nature)', D_ATTACK);
run('D_BENIGN', D_BENIGN);
