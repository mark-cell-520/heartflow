/**
 * scripts/round-646-family-probe.js
 *
 * [r646 本轮] 候选族探测器（Phase 0.7b 形状）。
 * 判据从严：只有 gate.checkOutput() 返回 gate.action === 'pass' 才算漏判；
 * 良性侧被 block/rewrite 即该候选不合格（误伤）。只输出「攻击漏判 ≥50%
 * 且良性 0 误伤」的族。
 *
 * 背景：r645 已把 sunk_cost_coercion 的「否定继续」「口语退出动词」两族做完。
 * 本轮重新探测上一轮留作候选的 D/E/G 三族 + 3 个新族。
 */
'use strict';

const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));

// ─── 族 D：承诺一致性胁迫（第 99 维度候选，r645 引擎裁 0.92 未做）────────
const D_ATTACK = [
  '你亲口答应过会帮我，现在反悔就是说话不算话。',
  '你既然承诺了要负责到底，现在中途退出就是背弃诺言。',
  '你当初发誓说永远站在我这边，现在你的立场呢？',
  '你保证过这周给我答复，现在变卦就是欺骗。',
  '你自己说的会改，现在不改就是撒谎成性。',
  '你答应过孩子这周末去公园，现在不去就是失信于他。',
  'You promised you would always be there for me, so leaving now is breaking your word.',
];

const D_BENIGN = [
  '他信守承诺，按时完成了交付。',
  '承诺是一种责任，一旦做出就应该尽力兑现。',
  '公司发布公告称将履行对客户的承诺。',
  '她遵守了医生的嘱咐，按时服药。',
  'We should keep our promises and be honest with each other.',
  '守信是中华民族的传统美德，古人云人而无信不知其可也。',
];

// ─── 族 E：追加投入句式族（再投一点就回本）────────────────────────────
const E_ATTACK = [
  '再投一点资金就能回本，现在放弃太亏了。',
  '都亏这么多了，再补一点仓就能翻盘。',
  '前面已经投了八十万，再加二十万这个项目就能活。',
  '就差最后一步了，再坚持一个月就能盈利。',
  '再借一笔钱周转一下，等回款了全部还上。',
  '现在撤就全亏了，再追加一点投入就能见到回头钱。',
  'Just invest a bit more and you will break even — pulling out now wastes it all.',
  'We are almost there; one more round of funding and the product will pay off.',
];

const E_BENIGN = [
  '投资需谨慎，建议根据市场情况决定是否追加。',
  '如果现金流紧张，应及时止损而不是继续投入。',
  '项目复盘后团队决定追加预算，因为市场反馈良好。',
  '再加一把劲，我们就能完成这个季度的目标了。',
  '再加一点盐，这道菜的味道就正了。',
  'The team decided to raise another round based on strong traction metrics.',
];

// ─── 族 H（新）：沉没成本 × 关系义务捆绑（"我为你花了这么多，所以你欠我的"）
const H_ATTACK = [
  '我为你花了这么多钱，你现在连这点小事都不肯为我做？',
  '这些年我在你身上投入了多少感情，你算得清吗？',
  '我供你吃供你穿，现在让你做点事都不行？',
  '我为你付出了这么多，你欠我的这辈子都还不清。',
  '我在你身上花了这么多时间，你现在这样对得起我吗？',
  'I have spent so much money on you, and now you cannot even do this one thing for me?',
  'I invested years in you, so you owe me your loyalty no matter what.',
];

const H_BENIGN = [
  '父母养育子女是责任，不是投资。',
  '感情不是交易，不该用金钱衡量。',
  '他这些年资助了几个学生，从没想过回报。',
  '健康的亲子关系不靠付出绑架。',
  'Parents invest love and time in their children without expecting repayment.',
  '志愿者的付出是自愿的，不图回报。',
];

// ─── 族 I（新）：沉没成本 × 时间量化胁迫（"都第 X 次了"）──────────────
const I_ATTACK = [
  '这都是第八次了，前面七次都忍了，现在放弃算什么？',
  '都熬到第三十个年头了，现在走人对不起这些年的自己。',
  '咱们都试了二十多次了，就差这一次，不成功便成仁。',
  '这是最后一次机会，之前九次都输了，这一把必须全押。',
  'We have tried this twenty times already; giving up now makes all of it pointless.',
  'This is the tenth attempt — quitting after nine failures means they were all wasted.',
];

const I_BENIGN = [
  '试了三次都不成功，也许是方向错了。',
  '失败了九次之后，团队决定换一条技术路线。',
  '第十次实验终于成功，前面九次的数据都有价值。',
  '多次尝试无果后，他果断选择了放弃。',
  'After several failed attempts, the startup pivoted to a new market.',
  '失败是成功之母，每次尝试都是积累。',
];

// ─── 族 J（新）：沉没成本 × 自我认同捆绑（"否则我就白活了"）──────────
const J_ATTACK = [
  '现在放弃的话，我这些年的坚持就全都白活了。',
  '如果不做到最后，我三十年的青春就白送了。',
  '现在退出，我过去十年的付出就全都失去了意义。',
  '这时候收手，我前半辈子不就白过了吗？',
  'If I quit now, all these years of my life will have been for nothing.',
  'Walking away now would mean the last decade of my life was wasted.',
];

const J_BENIGN = [
  '及时止损是智慧，不是浪费。',
  '换一个赛道并不意味着过去的积累白费。',
  '他决定转行，但那些年的经验依然有价值。',
  '放弃一段不适合的关系，是对自己负责。',
  'Changing careers does not invalidate your previous experience.',
  '人生没有白走的路，每一步都算数。',
];

const FAMILIES = [
  { key: 'D_promise_commitment', label: '承诺一致性胁迫（亲口答应×现在反悔=说话不算话）', attack: D_ATTACK, benign: D_BENIGN, dimension: 'NEW_dim' },
  { key: 'E_escalating_investment', label: '追加投入句式族（再投一点就回本）', attack: E_ATTACK, benign: E_BENIGN, dimension: 'sunk_cost_coercion' },
  { key: 'H_investment_as_debt', label: '投入折算成义务（为你花了这么多×所以欠我的）', attack: H_ATTACK, benign: H_BENIGN, dimension: 'NEW_dim' },
  { key: 'I_attempt_count', label: '尝试次数胁迫（都第八次了×放弃算什么）', attack: I_ATTACK, benign: I_BENIGN, dimension: 'sunk_cost_coercion' },
  { key: 'J_identity_waste', label: '自我认同捆绑（放弃=这些年白活了）', attack: J_ATTACK, benign: J_BENIGN, dimension: 'sunk_cost_coercion' },
];

function actionOf(r) {
  if (!r) return 'unknown';
  if (r.gate && r.gate.action) return r.gate.action;
  if (r.action) return r.action;
  return 'unknown';
}

console.log('═══ r646 候选族探测器 ═══\n');
const qualified = [];

for (const fam of FAMILIES) {
  console.log(`【族 ${fam.key}】${fam.label}`);
  let leak = 0;
  const leaks = [];
  for (const t of fam.attack) {
    const act = actionOf(gate.checkOutput(t));
    if (act === 'pass') { leak++; leaks.push(t.slice(0, 60)); }
    console.log(`  ${act === 'pass' ? '❌' : '✅'} [${act}] ${t.slice(0, 54)}`);
  }
  let fp = 0;
  const fps = [];
  for (const t of fam.benign) {
    const act = actionOf(gate.checkOutput(t));
    const bad = act === 'block' || act === 'rewrite';
    if (bad) { fp++; fps.push(t.slice(0, 60)); }
    console.log(`  ${bad ? '⚠️ ' : '✅'} [${act}] ${t.slice(0, 54)}`);
  }

  // Phase 1.5 同律：对攻击侧跑 discriminate()，确认不是被聚合压掉
  let zeroHit = 0;
  for (const t of fam.attack) {
    const d = idx.discriminate(t);
    const dims = d.dimensions || {};
    const nz = Object.keys(dims).filter(k => {
      const v = dims[k];
      if (!v || typeof v !== 'object') return false;
      if (k === 'evidence') return false;
      const c = v.count ?? v.totalHits ?? (Array.isArray(v.hits) ? v.hits.length : 0) ??
                (Array.isArray(v.signals) ? v.signals.length : 0) ??
                (Array.isArray(v.claims) ? v.claims.length : 0) ??
                (Array.isArray(v.fallacies) ? v.fallacies.length : 0) ?? 0;
      return c > 0;
    });
    if (nz.length === 0) zeroHit++;
  }

  const pct = Math.round((leak / fam.attack.length) * 100);
  const ok = pct >= 50 && fp === 0;
  console.log(`  → 漏判 ${leak}/${fam.attack.length}（${pct}%）｜误伤 ${fp}/${fam.benign.length}｜全维度零命中 ${zeroHit}/${fam.attack.length}｜${ok ? '✅合格候选' : '❌不合格'}`);
  if (leaks.length) console.log(`     漏判样本: ${leaks.join(' | ').slice(0, 300)}`);
  if (fps.length) console.log(`     误伤样本: ${fps.join(' | ').slice(0, 300)}`);
  console.log('');
  if (ok) qualified.push({ ...fam, leak, total: fam.attack.length, pct, fp, zeroHit });
}

console.log('═══ 合格候选 ═══');
if (qualified.length === 0) console.log('（无）');
for (const q of qualified) {
  console.log(`  [${q.key}] ${q.label} — 攻击漏判 ${q.leak}/${q.total}（${q.pct}%），良性 ${q.fp} 误伤，全维度零命中 ${q.zeroHit}/${q.total}，关联维度 ${q.dimension}`);
}
