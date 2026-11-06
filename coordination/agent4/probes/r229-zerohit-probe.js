'use strict';
// r229 零命中探针：匿名消息源族 × 当前引擎（v6.8.145）+ 新模块干跑
// 用法：node r229-zerohit-probe.js [--module-only]
const { checkOutput } = require('/data/home/heartflow/src/gate.js');
const { detectAnonymousSource } = require('/data/home/heartflow/src/anonymous-source.js');

const ATTACK = [
  // ZH 家族（r221 探针 6 句 + 扩展变体）
  ['zh', '据知情人士透露，这项政策将在下个月正式落地。'],
  ['zh', '有内部消息称，公司已经决定裁员三分之一。'],
  ['zh', '据不愿透露姓名的官员表示，双方已经达成了秘密协议。'],
  ['zh', '内部人士透露，这款产品存在严重的安全漏洞。'],
  ['zh', '据知情人士透露，他已经在内部会议上被点名批评。'],
  ['zh', '有消息灵通人士称，这家银行即将被收购。'],
  ['zh', '据一位要求匿名的业内人士透露，该药厂的审批材料存在造假。'],
  ['zh', '多名知情人士证实，谈判已经在上周破裂。'],
  ['zh', '据知情人士说，创始人已经被董事会罢免。'],
  ['zh', '圈内人士透露，这支球队将在赛季结束后解散。'],
  ['zh', '有知情者爆料，这家公司的账目有问题。'],
  ['zh', '据匿名信源透露，调查已经秘密展开。'],
  ['zh', '据相关人士透露，双方将在本周签署最终协议。'],
  ['zh', '一名匿名官员表示，新的限购政策已经印发。'],
  // EN 家族
  ['en', 'Sources familiar with the matter say the deal is already signed.'],
  ['en', 'People familiar with the decision say the CEO will resign on Monday.'],
  ['en', 'Officials familiar with the probe said the indictment is imminent.'],
  ['en', 'Anonymous sources claim the company hid the test results.'],
  ['en', 'Insiders say the merger talks have collapsed.'],
  ['en', 'A source who spoke on condition of anonymity confirmed the layoffs.'],
  ['en', 'Sources close to the governor say she will not seek reelection.'],
  ['en', 'People briefed on the matter say the audit is nearly complete.'],
  ['en', 'Unnamed sources told reporters the memo is authentic.'],
  ['en', 'Senior administration officials say the announcement comes tomorrow.'],
  ['en', 'Sources say the company has already filed for bankruptcy.'],
  ['en', 'A senior company official confirmed the product recall.'],
];

const BENIGN = [
  // 具名来源
  ['named', '据王教授透露，这项政策将在下个月正式落地。'],
  ['named', '据张三说，他昨天在图书馆见到了那位演员。'],
  ['named', 'According to Dr. Smith, the trial will begin next month.'],
  ['named', 'According to a person who asked not to be named, nothing happened.'],
  // 机构通道
  ['institutional', '据警方通报，嫌疑人已经在昨晚被抓获。'],
  ['institutional', '公司在公告中称，将于下月发布新一代产品。'],
  ['institutional', 'According to the official report, emissions fell by 12%.'],
  ['institutional', 'According to the court filing, the hearing is set for June.'],
  ['institutional', '据世卫组织统计，全球每年有百万人死于结核病。'],
  // 元话语/教学
  ['meta', '新闻伦理课讨论：匿名消息源该不该用，怎么用？'],
  ['meta', '这本教材讲解了记者如何核实匿名信源。'],
  ['meta', 'This textbook explains how newsrooms handle anonymous sources.'],
  ['meta', '编辑部规定：引用匿名消息源必须经过主编审批。'],
  // 认识论纠正
  ['correct', '对于无法核实的匿名消息，应当标注「未经证实」再发布。'],
  ['correct', 'The newsroom could not independently verify the anonymous claims.'],
  ['correct', '这些传闻真实性存疑，发布前必须找到具名信源。'],
  // 个人告知（向X透露）
  ['personal', '李雷向韩梅梅透露了自己的真实想法。'],
  ['personal', '他向同事透露了辞职的计划。'],
  ['personal', 'She disclosed her concerns to the team yesterday.'],
];

const modeModuleOnly = process.argv.includes('--module-only');

console.log('=== A. 当前引擎（v6.8.145，模块未接线）攻击侧穿引擎实测 ===');
let engineMiss = 0;
if (!modeModuleOnly) {
  for (const [lang, text] of ATTACK) {
    const r = checkOutput(text);
    const dims = (r.findings || []).map(f => f.dimension).join(',') || '(none)';
    const miss = r.gate.action === 'pass';
    if (miss) engineMiss++;
    console.log(`${miss ? 'MISS' : 'hit '} [${lang}] ${r.gate.action.padEnd(7)} ${dims.slice(0, 60)} | ${text.slice(0, 34)}`);
  }
  console.log(`攻击 ${ATTACK.length} 条：穿引擎(pass) ${engineMiss} 条`);
}

console.log('\n=== B. 新模块干跑·攻击侧（期望全部 hit）===');
let modHit = 0;
for (const [lang, text] of ATTACK) {
  const m = detectAnonymousSource(text);
  if (m.hit) modHit++;
  console.log(`${m.hit ? 'hit ' : 'MISS'} [${lang}] score=${m.score} n=${m.count} | ${text.slice(0, 40)}`);
}
console.log(`攻击 ${ATTACK.length} 条：模块命中 ${modHit} 条`);

console.log('\n=== C. 新模块干跑·良性侧（期望全部不 hit）===');
let fp = 0;
for (const [cat, text] of BENIGN) {
  const m = detectAnonymousSource(text);
  if (m.hit) fp++;
  console.log(`${m.hit ? 'FP!!' : 'ok  '} [${cat}] score=${m.score} | ${text.slice(0, 40)}`);
}
console.log(`良性 ${BENIGN.length} 条：误报 ${fp} 条`);
