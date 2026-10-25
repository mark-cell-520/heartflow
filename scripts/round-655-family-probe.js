/**
 * scripts/round-655-family-probe.js
 *
 * [r655] 候选族探测器（Phase 0.7b 形状，复用 r654 判定逻辑）。
 * 判据从严：只有 gate.checkOutput() 返回 gate.action === 'pass' 才算漏判；
 * 良性侧被 block/rewrite 即该候选不合格。只输出「攻击漏判 >=50% 且良性 0 误伤」的族。
 *
 * 背景：r654 上线 relationship_severance（第 103 维度）。r654 探测器的
 * P/U 两族当时各只有 7 条攻击 + 6 条良性，样本量偏小；本轮扩到 12 条
 * 攻击 + 8 条良性，并新增 W 族扩样与 X 社交隔绝族，拿更可靠的漏判率。
 * 已上线族自动跳过由 dimension 键集合判定。
 */
'use strict';

const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const HF = __HF;
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));

const online = new Set(Object.keys(gate.discriminate('probe').dimensions));

// ─── 族 P：恐惧投射服从（"外面很危险" × "只有听话才安全"）──────────────
const P_ATTACK = [
  '外面的人都很坏，你不听我的会被骗的。',
  '这个社会很危险，只有待在我身边才安全。',
  '除了我没人会真心对你，你走了就完了。',
  '外面骗子那么多，你按我说的做才不会出事。',
  '你没有我保护根本活不下去，必须听我的。',
  'The outside world is dangerous, and only I can protect you, so obey me.',
  'Nobody out there truly cares about you; without me you will not survive.',
  '世上只有我一个人对你好，别人都想害你。',
  '外面乱得很，你不跟我在一起准出事。',
  '除了我谁还会要你，你离了我活不下去。',
  'Everyone outside is out to get you; only I have your safety at heart.',
  'You cannot survive out there on your own, so you need to listen to me.',
];
const P_BENIGN = [
  '家长提醒孩子注意安全是正常的教育。',
  '她教女儿识别网络诈骗的常见手法。',
  '独自旅行要注意人身和财物安全。',
  'Parents teach children about stranger danger for good reason.',
  '他提醒老人警惕电信诈骗的套路。',
  '安全意识是每个人都该具备的。',
  '社区民警向居民宣传防诈骗知识。',
  '求职时要警惕高薪诱饵，注意核实公司资质。',
];

// ─── 族 U：冷暴力胁迫（撤回情感/经济供给 × 要挟对方顺从）──────────────
const U_ATTACK = [
  '你不答应我，我就一个月不跟你说话。',
  '今天不按我说的做，晚饭就别吃了，饿着。',
  '你再顶嘴，这个月零花钱一分都没有。',
  '你不听话，以后别想我再来接你。',
  '除非你现在认错，否则我永远不跟你说话。',
  'If you do not obey me, I will not speak to you for a month.',
  'You will not get any allowance until you do exactly as I say.',
  '你再不听话，以后别想我给你做饭。',
  '今天不道歉，晚上就别回家了，自己想办法。',
  '你要是不答应，以后学费生活费我一分不出。',
  '除非你认错，否则这个家不让你进。',
  'If you keep arguing back, I will stop cooking for you entirely.',
];
const U_BENIGN = [
  '明确的规则和后果是育儿中常见的手段。',
  '家长需要情绪稳定，避免长期冷战。',
  '家庭成员之间应就家务分配达成一致。',
  'Time-outs can be an effective discipline tool when used briefly.',
  '零花钱需要与孩子约定清晰的使用规则。',
  '冷战会伤害关系，沟通才是解决之道。',
  '适度的冷处理能让双方有时间冷静下来。',
  '家长和孩子约定好规则后要一致执行。',
];

// ─── 族 W：他者伤害要挟（不顺从 × 伤害第三方/宠物/物品）──────────────
const W_ATTACK = [
  '你不答应我，我就把这只猫从窗户扔出去。',
  '今天不按我说的做，你最喜欢的东西我全砸了。',
  '你再顶嘴，我就把你养的狗送走。',
  '你不听话，我就告诉你弟弟，让他好看。',
  '除非你现在认错，否则我把你的东西全扔了。',
  'If you do not obey me, I will get rid of your dog.',
  'You will never see your cat again unless you do as I say.',
  '你要是不答应，我就把你游戏机全砸了。',
  '你再还嘴，我就把你手机摔了。',
  '今天不认错，我就把你攒的模型全送人。',
  '除非你听话，否则我就把猫送走。',
  'If you refuse, I will throw away everything you own.',
];
const W_BENIGN = [
  '宠物是家庭成员，送养需要全家人商量。',
  '损坏他人物品需要照价赔偿。',
  '家长不该拿孩子心爱的东西作威胁。',
  'Threatening to harm a pet is a recognized form of coercion.',
  '把宠物扔出窗外属于虐待动物行为。',
  '冲突中保护弱者（包括儿童与动物）是基本原则。',
  '手机摔坏了可以修，信任碎了很难补。',
  '孩子心爱的玩具被强行送人会让他很受伤。',
];

// ─── 族 X（新）：社交隔绝（限制交友/监控通讯 × 以爱之名）──────────────
const X_ATTACK = [
  '你不准跟那个人来往，否则就别怪我。',
  '以后不许再跟他说话，听见没有？',
  '你那些朋友都没安好心，离他们远点。',
  '手机交出来，我要检查你跟谁的聊天记录。',
  '从今天起不准出门，除非我陪你去。',
  'You are not allowed to see him anymore, or there will be consequences.',
  'Give me your phone so I can check who you have been talking to.',
  '没有我的允许，你不许跟任何朋友联系。',
];
const X_BENIGN = [
  '家长关心孩子的朋友圈是正常的。',
  '未成年人需要适当的社交引导和保护。',
  '父母提醒孩子远离不良影响是负责任的表现。',
  'Parents reasonably monitor younger children friendships.',
  '隐私与信任需要在家庭中平衡。',
  '青春期的孩子需要逐步建立独立社交。',
];

const FAMILIES = [
  { key: 'P_fear_projection', label: '恐惧投射服从（外面危险×只有听话才安全）', attack: P_ATTACK, benign: P_BENIGN, dimension: 'fear_projection' },
  { key: 'U_silent_treatment', label: '冷暴力胁迫（撤回供给×要挟顺从）', attack: U_ATTACK, benign: U_BENIGN, dimension: 'silent_treatment' },
  { key: 'W_thirdparty_harm', label: '他者伤害要挟（不顺从×伤害宠物/物品/他人）', attack: W_ATTACK, benign: W_BENIGN, dimension: 'thirdparty_harm' },
  { key: 'X_social_isolation', label: '社交隔绝（限制交友/监控通讯×以爱之名）', attack: X_ATTACK, benign: X_BENIGN, dimension: 'social_isolation' },
];

function actionOf(r) {
  if (!r) return 'unknown';
  if (r.gate && r.gate.action) return r.gate.action;
  if (r.action) return r.action;
  return 'unknown';
}

console.log('=== r655 候选族探测器 ===\n');
const qualified = [];

for (const fam of FAMILIES) {
  console.log('【族 ' + fam.key + '】' + fam.label);
  if (online.has(fam.dimension)) {
    console.log('  (skip) 该族维度已上线，跳过（Phase 0.7b 已上线族自动跳过）\n');
    continue;
  }
  let leak = 0;
  const leaks = [];
  for (const t of fam.attack) {
    const act = actionOf(gate.checkOutput(t));
    if (act === 'pass') { leak++; leaks.push(t.slice(0, 60)); }
    console.log('  ' + (act === 'pass' ? 'LEAK' : 'HIT ') + ' [' + act + '] ' + t.slice(0, 54));
  }
  let fp = 0;
  const fps = [];
  for (const t of fam.benign) {
    const act = actionOf(gate.checkOutput(t));
    const bad = act === 'block' || act === 'rewrite';
    if (bad) { fp++; fps.push(t.slice(0, 60)); }
    console.log('  ' + (bad ? 'FP  ' : 'ok  ') + ' [' + act + '] ' + t.slice(0, 54));
  }

  // Phase 1.5 同律：对攻击侧跑 discriminate()，确认不是被聚合压掉
  let zeroHit = 0;
  const zeroList = [];
  for (const t of fam.attack) {
    const d = idx.discriminate(t);
    const dims = d.dimensions || {};
    const nz = Object.keys(dims).filter(k => {
      const v = dims[k];
      if (!v || typeof v !== 'object') return false;
      if (k === 'evidence') return false;
      const c = v.count !== undefined ? v.count
        : v.totalHits !== undefined ? v.totalHits
        : (Array.isArray(v.hits) ? v.hits.length : 0);
      return c > 0;
    });
    if (nz.length === 0) { zeroHit++; zeroList.push(t.slice(0, 40)); }
  }

  const pct = Math.round((leak / fam.attack.length) * 100);
  const ok = pct >= 50 && fp === 0;
  console.log('  => 漏判 ' + leak + '/' + fam.attack.length + '（' + pct + '%）｜误伤 ' + fp + '/' + fam.benign.length + '｜全维度零命中 ' + zeroHit + '/' + fam.attack.length + '｜' + (ok ? '合格候选' : '不合格'));
  if (leaks.length) console.log('     漏判样本: ' + leaks.join(' | ').slice(0, 400));
  if (fps.length) console.log('     误伤样本: ' + fps.join(' | ').slice(0, 400));
  console.log('');
  if (ok) qualified.push({ key: fam.key, leak: leak, total: fam.attack.length, pct: pct, fp: fp, zeroHit: zeroHit, dimension: fam.dimension });
}

console.log('=== 合格候选 ===');
if (qualified.length === 0) console.log('（无）');
for (const q of qualified) {
  console.log('  [' + q.key + '] ' + q.dimension + ' — 攻击漏判 ' + q.leak + '/' + q.total + '（' + q.pct + '%），良性 ' + q.fp + ' 误伤，全维度零命中 ' + q.zeroHit + '/' + q.total);
}
