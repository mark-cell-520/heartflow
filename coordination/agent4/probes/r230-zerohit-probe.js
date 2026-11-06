'use strict';
// r230 零命中探针：破窗谬误族（destruction-as-stimulus / seen-vs-unseen）× 当前引擎（v6.8.145）
// 用法：node r230-zerohit-probe.js [--module-only]
// 判族定义：破坏/灾害/报废事件 × 「拉动/刺激/创造就业」类净收益断言，无视被挤占的机会成本。
const path = '/data/home/heartflow';
let modOk = true;
let detectBrokenWindow;
try {
  ({ detectBrokenWindow } = require(path + '/src/broken-window-fallacy.js'));
} catch (e) {
  modOk = false;
}
const { checkOutput } = require(path + '/src/gate.js');

const ATTACK = [
  // ZH 直述族
  ['zh', '地震摧毁了老城区，但重建工程会拉动内需、促进经济增长。'],
  ['zh', '战争虽然摧毁了大量工厂，却刺激了军工生产，创造了成千上万的就业岗位。'],
  ['zh', '台风过境后，重建需求将带动建材和家电消费，对经济反而是利好。'],
  ['zh', '这次疫情消耗了大量库存，反而刺激了企业扩大生产。'],
  ['zh', '洪水冲毁了无数房屋，灾后重建将带来新一轮投资热潮。'],
  ['zh', '窗户被砸破了必须更换，玻璃工、安装工、厂商都有了生意，这难道不是促进了经济吗？'],
  ['zh', '事故导致设备全部报废，但更新换代反而促进了产业升级。'],
  ['zh', '把旧车砸了买新车，车厂、销售、保险公司都能受益，何乐而不为？'],
  ['zh', '灾害清除了落后产能，经济将轻装上阵。'],
  ['zh', '疫情打乱了全球供应链，但重建库存将提振制造业产出。'],
  ['zh', '大火烧毁了街区，重建工程势必拉动地方 GDP。'],
  ['zh', '饥荒消耗了过量粮食储备，反而刺激了农业再生产和消费。'],
  // ZH 变体（倒装/长句/否定对冲混入）
  ['zh', '尽管战争带来了毁灭，但其对军工产业的刺激作用不容忽视，就业数据就是证明。'],
  ['zh', '与其说是灾难，不如说是机遇——重建需求将托举整个产业链。'],
  // EN 直述族
  ['en', 'The earthquake destroyed the old town, but reconstruction will stimulate demand and boost growth.'],
  ['en', 'War devastates infrastructure, yet military spending creates millions of jobs.'],
  ['en', 'The hurricane destroyed thousands of homes, but rebuilding will spur construction and consumption.'],
  ['en', 'Breaking a window creates work for the glazier — surely that is good for the economy.'],
  ['en', 'The pandemic wiped out inventories, but restocking will lift manufacturing output.'],
  ['en', 'Destroying old equipment forces replacement purchases that stimulate industry.'],
  ['en', 'The fire razed the district, yet the reconstruction boom will fuel the local economy.'],
  ['en', 'Disasters clear out obsolete capacity, leaving the economy stronger than before.'],
  ['en', 'Wartime destruction may seem bad, but it accelerates innovation and creates jobs.'],
  // EN 变体
  ['en', 'As devastating as the flood was, the recovery spending will drive GDP growth for years.'],
];

const BENIGN = [
  // 破窗效应（犯罪学理论，同名不同物）
  ['theory', '破窗效应提示我们：环境中的失序信号如果不及时处理，会诱发更多违法行为。'],
  ['theory', 'Broken windows theory holds that visible signs of disorder encourage further crime.'],
  // 认识论纠正/教科书
  ['meta', '经济学教科书用破窗谬误说明：灾后重建的可见收益掩盖了被挤占的机会成本。'],
  ['meta', 'The broken window fallacy, described by Bastiat, mistakes visible spending for net gain.'],
  ['correct', '所谓"灾害促进经济"忽略了重建资金本可用于其他投资，净效应可能为负。'],
  ['correct', 'Claiming the war stimulated the economy ignores the opportunity cost of the spending.'],
  ['correct', '认为地震有利于经济增长是典型的破窗谬误，只见重建不见代价。'],
  // 计入机会成本的正确分析
  ['tradeoff', '灾后重建能拉动短期需求，但资金本可用于基建投资，净效应取决于两者收益之差。'],
  ['tradeoff', 'Reconstruction spending may raise demand, but the funds could have built new roads instead.'],
  ['tradeoff', '战争刺激军工的说法站不住脚：同样的资源投到民用部门效率更高。'],
  // 纯破坏陈述（无收益腿）
  ['destruction', '地震摧毁了老城区，造成重大人员伤亡和财产损失。'],
  ['destruction', 'The earthquake destroyed the old town and displaced thousands of families.'],
  // 无破坏事件的一般经济表述
  ['economy', '基建投资将拉动内需，促进经济增长。'],
  ['economy', '消费券刺激了本地消费，带动了服务业复苏。'],
  ['economy', 'Government infrastructure spending will boost long-term growth.'],
  ['economy', 'Lower interest rates stimulate housing demand across the region.'],
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
    console.log(`${miss ? 'MISS' : 'hit '} [${lang}] ${r.gate.action.padEnd(7)} ${dims.slice(0, 64)} | ${text.slice(0, 36)}`);
  }
  console.log(`攻击 ${ATTACK.length} 条：穿引擎(pass) ${engineMiss} 条`);
}

if (!modOk) {
  console.log('\n（模块 src/broken-window-fallacy.js 尚未创建，跳过 B/C 段）');
  process.exit(0);
}

console.log('\n=== B. 新模块干跑·攻击侧（期望全部 hit）===');
let modHit = 0;
for (const [lang, text] of ATTACK) {
  const m = detectBrokenWindow(text);
  if (m.hit) modHit++;
  console.log(`${m.hit ? 'hit ' : 'MISS'} [${lang}] score=${m.score} n=${m.count} | ${text.slice(0, 40)}`);
}
console.log(`攻击 ${ATTACK.length} 条：模块命中 ${modHit} 条`);

console.log('\n=== C. 新模块干跑·良性侧（期望全部不 hit）===');
let fp = 0;
for (const [cat, text] of BENIGN) {
  const m = detectBrokenWindow(text);
  if (m.hit) fp++;
  console.log(`${m.hit ? 'FP!!' : 'ok  '} [${cat}] score=${m.score} | ${text.slice(0, 40)}`);
}
console.log(`良性 ${BENIGN.length} 条：误报 ${fp} 条`);
