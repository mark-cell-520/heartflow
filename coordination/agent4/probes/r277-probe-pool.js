// r277 probe pool — 逻辑谬误家族 wired 维度全新措辞穿透实测
// 双口径：模块层 detect + gate 层 hf.gate()
// 穿透定义（gate 层）：gate.action === 'pass' 且目标维度零承重
const hf = require('/data/home/heartflow/src/gate.js');
const { checkAppealToTradition } = require('/data/home/heartflow/src/appeal-tradition.js');
const { checkFalseDilemma } = require('/data/home/heartflow/src/false-dilemma.js');
const { checkNoTrueScotsman } = require('/data/home/heartflow/src/no-true-scotsman.js');

const H = (fn) => (s) => { try { return fn(s).hit === true; } catch (e) { return 'ERR:' + e.message; } };

const FAMILIES = [
  {
    dim: 'appeal_to_tradition',
    mod: H(checkAppealToTradition),
    attacks: [
      // 候选新族 A：千百年来/祖祖辈辈 时间跨度新形 × 维持/反问结论
      '千百年来都是这么过来的，还能有错？',
      '几千年的传统摆在那儿，不可能有问题。',
      'These customs have been around for centuries; who are we to change them?',
      'My family has done it this way for generations, and I see no reason to stop.',
      // 候选新族 B：老法子/土方 × 别瞎折腾/不能丢（新压制形）
      '老法子传了这么多代人，别瞎折腾。',
      '古方治大病，咱们不能丢了传统。',
      '入乡随俗，老规矩还是得守。',
      'The old ways kept us fed; do not go fixing what is not broken.',
      // 候选新族 C：牌号/口碑年资（老牌子/口碑 摆在那儿）
      '这牌子立了上百年，口碑摆在那儿，照老方子来。',
      'Its reputation spans generations; keep the recipe as it has always been.',
    ],
    benign: [
      '千百年来都是这么过来的，不过时代变了，有些规矩经评估也该改。',
      '几千年的传统摆在那儿，但数据表明其中不少已经不合时宜。',
      '老法子传了这么多代人，但是否还要沿用，需要实测数据再决定。',
      '古方治大病存疑，临床对照试验才能说明问题。',
      '入乡随俗是礼貌，但违反安全的陋俗应当拒绝。',
      'These customs have been around for centuries; the evidence, however, supports reform.',
      'My family has done it this way for generations, but the data shows a better approach.',
      '这牌子立了上百年，口碑归口碑，产品力还得看检测报告。',
    ],
  },
  {
    dim: 'false_dilemma',
    mod: H(checkFalseDilemma),
    attacks: [
      // 候选新族 A：不是朋友就是敌人（定性名词新形）
      '不是朋友，就是敌人，没有第三种关系。',
      'You are either a friend or an enemy.',
      // 候选新族 B：不X就是不Y（行为污名新形：转发→爱国）
      '不转发这条，就是不爱国。',
      'If you do not share this, you do not care about the cause.',
      // 候选新族 C：灰色地带排除（no gray area）
      '这事没有灰色地带，你摆明态度吧。',
      'There is no gray area here.',
      // 候选新族 D：同意一切否则反对（agree or against me）
      '要么同意我说的每一点，要么就是跟我作对。',
      'Agree with everything I said or you are against me.',
      // 候选新族 E：骑墙/和稀泥 污名（中庸即骑墙）
      '中庸就是和稀泥，这个时候要立场鲜明。',
    ],
    benign: [
      '他不是朋友也不是敌人，只是工作关系。',
      '转发不转发是个人选择，与爱国没有必然关系。',
      '这事有灰色地带，可以先试点再推广。',
      '他同意方案的大部分，但对第三条有保留，这是正常讨论。',
      'There is a gray area here, so let us lay out the options and their trade-offs.',
      'He is neither a friend nor an enemy, just a former classmate.',
      '中庸不是和稀泥，而是权衡各方证据后的取舍。',
    ],
  },
  {
    dim: 'no_true_scotsman',
    mod: H(checkNoTrueScotsman),
    attacks: [
      // 候选新族 A：新角色名词（高手/铁粉/老玩家/甲方/爷们/骨气作者）
      '真正的高手，从来不向资本低头。',
      '铁粉从来不会只买一张票。',
      '称职的甲方不会随便改需求。',
      '有骨气的作者不会迎合流量。',
      '老玩家从来不充一分钱。',
      '是个爷们就不会食言。',
      // 候选新族 B：EN 新角色名词
      'A real gamer would never pay for skins.',
      'A legit foodie never eats at chain restaurants.',
      'Real programmers do not use IDEs.',
      'A true believer never questions the doctrine.',
    ],
    benign: [
      '真正的高手也有失手的时候，不能以一次成败论英雄。',
      '铁粉一般会买全套周边，但这只是消费偏好，不是定义问题。',
      '称职的甲方按合同变更流程走，这是规范不是驱逐。',
      '有骨气的作者也会为市场写作，这不矛盾。',
      'A real gamer may also enjoy free games; preference is not identity.',
      'Real programmers choose tools by fit, not by ideology.',
      '老玩家不少都充值，这很正常。',
    ],
  },
];

console.log('=== r277 池化探针：逻辑谬误家族各维度新措辞穿透实测 ===');
for (const fam of FAMILIES) {
  console.log('\n--- ' + fam.dim + ' ---');
  let aMod = 0, aGate = 0, aPass = 0;
  for (const s of fam.attacks) {
    let modOk = false, gateDim = false, action = '?';
    try { modOk = !!fam.mod(s); } catch (e) { modOk = 'ERR:' + e.message; }
    try {
      const g = hf.gate(s);
      action = g.gate ? g.gate.action : '?';
      gateDim = (g.findings || []).some(f => f.dimension === fam.dim);
    } catch (e) { action = 'ERR:' + e.message; }
    if (modOk === true) aMod++;
    if (gateDim) aGate++;
    if (action === 'pass') aPass++;
    console.log('  mod=' + (modOk === true ? 'HIT' : String(modOk)) + ' gate=' + action + (gateDim ? '(dim)' : '') + '  ' + s.slice(0, 44));
  }
  let bMod = 0, bGate = 0;
  for (const s of fam.benign) {
    let modOk = false, gateDim = false;
    try { modOk = !!fam.mod(s); } catch (e) {}
    try { gateDim = (hf.gate(s).findings || []).some(f => f.dimension === fam.dim); } catch (e) {}
    if (modOk) bMod++;
    if (gateDim) bGate++;
    if (modOk || gateDim) console.log('  误伤! mod=' + modOk + ' gate=' + gateDim + '  ' + s.slice(0, 44));
  }
  console.log('  ==> 攻击 ' + fam.attacks.length + ' 条：模块命中 ' + aMod + '、维度承重 ' + aGate + '、gate 全放行 ' + aPass + '；良性误伤 mod=' + bMod + ' gate=' + bGate);
}
