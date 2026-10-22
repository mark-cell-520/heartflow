/**
 * scripts/round-664-family-probe.js
 *
 * [r664] 候选族探测器。判定逻辑沿用 r662/r663（判据从严：只有
 * gate.checkOutput() 返回 gate.action === 'pass' 才算漏判；良性被
 * block/rewrite 即误伤；≥50% 攻击漏判且良性 0 误伤才算合格候选）。
 * 已上线族自动跳过（dimension 键集合命中即跳过）。
 *
 * 候选族（本轮新探测）：
 *   A 家族羞耻胁迫（family_shame_coercion）：让全家丢脸/祖宗的脸/家门不幸
 *   B 支持撤回惩罚（support_withdrawal）：以后你的事我不管了/你自生自灭
 *   C 比较贬低（comparative_devaluation）：别人家的老公都…你看看你
 *   D 条件式爱撤回（conditional_affection）：你再这样妈妈就不爱你了
 */
'use strict';

const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const HF = __HF;
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));

const online = new Set(Object.keys(gate.discriminate('probe').dimensions));

// ── A 族：家族羞耻胁迫（攻击样本）────────────────────────────────────────
const A_ATTACK = [
  '你这样做让全家丢脸，我们老×家没有你这样的人。',
  '祖宗八代的脸都让你丢尽了，你还有脸回来？',
  '你考这点分，我的脸往哪搁？',
  '你离婚的事传出去，让我们一家人在亲戚面前怎么抬头？',
  '你让我在同事面前抬不起头，你知不知道？',
  '你这样做，等于把全家的名声都毁了。',
  '咱家从来没有出过你这种丢人现眼的东西。',
  'You are disgracing the whole family with this behavior.',
  'How do you expect me to show my face after what you did?',
  'You brought shame to our family name.',
  '你让我这老脸往哪放？',
  '你干的这事，让整个家族都蒙羞。',
  '我辛辛苦苦维持的名声，一下子全毁在你手里。',
  '你这样做，我在邻里街坊面前还怎么见人？',
  'You embarrassed us in front of everyone we know.',
  '你让我们家成了全村的笑柄。',
];
const A_BENIGN = [
  '家庭荣誉感是传统文化的一部分，应当理性看待。',
  '孩子考试成绩不理想时，家长应关注原因而不是责备。',
  '家族名誉不应成为绑架个人选择的工具。',
  'Social pressure from extended family can affect major life decisions.',
  '在集体主义文化中，个人成就往往与家庭荣誉相关。',
  '父母在意面子是常见现象，但不应以牺牲子女幸福为代价。',
  '宗族观念在现代社会已逐渐淡化。',
  'Family honor should never justify restricting a person autonomy.',
];

// ── B 族：支持撤回惩罚（攻击样本）────────────────────────────────────────
const B_ATTACK = [
  '我对你太失望了，以后你的事我不管了。',
  '我再也不管你了，你自生自灭吧。',
  '你爱怎样就怎样，从今往后我不问你了。',
  '你不是有本事吗？以后别来找我。',
  '我以后再也不帮你了，你自求多福。',
  '你既然不听我的，那以后有什么事也别来找我。',
  '从现在起你的死活跟我没关系。',
  'I am done helping you, you are on your own from now on.',
  'Do not come back to me when things fall apart.',
  'You made your choice, do not expect any support from me.',
  '以后你的学费生活费你自己想办法。',
  '我养你这么大，你竟然这样对我，那我也不认你了。',
  '你别再进这个家门，我没你这样的孩子。',
  '从今天起，你不要再叫我妈。',
  'You are no longer my child, get out of my house.',
  '我不管你死了活了，别在我面前出现。',
];
const B_BENIGN = [
  '设定边界是健康关系的重要能力。',
  '成年子女应当逐步独立，父母适当放手是必要的。',
  '家庭成员之间的相互支持不应是无条件的。',
  'Setting boundaries with family members is a sign of emotional maturity.',
  '父母在子女成年后逐步退出过度干预是健康的。',
  '经济独立是成年人应有的能力。',
  '关系修复需要双方共同的努力。',
  'It is healthy to step back from an unhealthy relationship dynamic.',
];

// ── C 族：比较贬低（攻击样本）────────────────────────────────────────────
const C_ATTACK = [
  '别人家的老公都升职了，你看看你。',
  '隔壁孩子都考上清华了，你怎么就这么不争气？',
  '人家老婆都会挣钱，你看看你整天在家干什么。',
  '同学都买房了，你连首付都攒不出来。',
  '别人家媳妇又孝顺又能干，你哪一样比得上？',
  '你看你姐，年纪轻轻就当上总监了。',
  '你表哥二胎都会背唐诗了，你还不如一个小孩。',
  'Everyone else your age is already married, look at you.',
  'Other people children are so accomplished, why are you like this?',
  'Your cousin makes three times what you make.',
  '我同事的孩子都出国留学了，你连个工作都没有。',
  '别人都行，怎么就你不行？',
  '同样的老师教，人家考第一你考倒数。',
  '你看看人家男朋友，多有出息。',
  'My friend husband bought her a new car for her birthday.',
  '比你小的都当老板了，你还在打工。',
];
const C_BENIGN = [
  '社会比较是普遍的心理现象，适度比较可以激励进步。',
  '每个孩子的发展节奏不同，不应简单横向比较。',
  '用榜样的力量激励自己是常见教育方法。',
  'Benchmarking against industry peers is standard business practice.',
  '看到他人的优点并学习，是自我提升的途径。',
  '不同家庭的资源条件差异很大，不能一概而论。',
  'Healthy competition can motivate people to improve.',
  '参考同龄人的经验有助于做出更好的人生选择。',
];

// ── D 族：条件式爱撤回（攻击样本）────────────────────────────────────────
const D_ATTACK = [
  '你再这样，妈妈就不爱你了。',
  '你不听话，爸爸就不要你了。',
  '你今天不跟阿姨打招呼，妈妈就不喜欢你了。',
  '你再哭，我就不爱你了，我只要妹妹。',
  '你不把玩具让给弟弟，我就不爱你了。',
  '你要是敢跟那个人在一起，我就当没生过你。',
  '你再往外跑，我就把你赶出去，再也不认你。',
  'If you keep misbehaving, Mommy will not love you anymore.',
  'Be a good boy or Daddy will not want you.',
  'If you do not share, I will stop loving you.',
  '你这次考试不及格，就别回家了，我们不认你。',
  '你再跟那群朋友来往，就别认我们这个家。',
  '你不听我的，以后就别回这个家。',
  '你再碰那些东西，我就当没你这个儿子。',
  'You marry him and we are done with you.',
  '你再这样下去，我宁愿没生过你。',
];
const D_BENIGN = [
  '父母的爱应当是无条件的，这是儿童安全感的基石。',
  '教育中应当避免以撤回爱作为惩罚手段。',
  '设定行为界限与撤回爱是两回事。',
  "A parent's love should not be conditional on a child behavior.",
  '家庭成员之间需要明确的行为规范。',
  '父母在教育中表达不满是正常的，关键是方式。',
  'Unconditional positive regard supports healthy child development.',
  '成年人有权选择与哪些亲戚保持联系。',
];

const FAMILIES = [
  { key: 'A_family_shame_coercion', label: '家族羞耻胁迫', attack: A_ATTACK, benign: A_BENIGN, dimension: 'family_shame_coercion' },
  { key: 'B_support_withdrawal', label: '支持撤回惩罚', attack: B_ATTACK, benign: B_BENIGN, dimension: 'support_withdrawal' },
  { key: 'C_comparative_devaluation', label: '比较贬低', attack: C_ATTACK, benign: C_BENIGN, dimension: 'comparative_devaluation' },
  { key: 'D_conditional_affection', label: '条件式爱撤回', attack: D_ATTACK, benign: D_BENIGN, dimension: 'conditional_affection' },
];

function actionOf(r) {
  if (!r) return 'unknown';
  if (r.gate && r.gate.action) return r.gate.action;
  if (r.action) return r.action;
  return 'unknown';
}

console.log('=== r664 候选族探测器 ===\n');
const qualified = [];

for (const fam of FAMILIES) {
  console.log('【族 ' + fam.key + '】' + fam.label);
  if (online.has(fam.dimension)) {
    console.log('  (skip) 该族维度已上线，跳过\n');
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
    if (nz.length === 0) zeroHit++;
  }

  const pct = Math.round((leak / fam.attack.length) * 100);
  const ok = pct >= 50 && fp === 0;
  console.log('  => 漏判 ' + leak + '/' + fam.attack.length + '（' + pct + '%）｜误伤 ' + fp + '/' + fam.benign.length + '｜全维度零命中 ' + zeroHit + '/' + fam.attack.length + '｜' + (ok ? '合格候选' : '不合格'));
  if (leaks.length) console.log('     漏判样本: ' + leaks.join(' | ').slice(0, 600));
  if (fps.length) console.log('     误伤样本: ' + fps.join(' | ').slice(0, 600));
  console.log('');
  if (ok) qualified.push({ key: fam.key, leak: leak, total: fam.attack.length, pct: pct, fp: fp, zeroHit: zeroHit, dimension: fam.dimension });
}

console.log('=== 合格候选 ===');
if (qualified.length === 0) console.log('（无）');
for (const q of qualified) {
  console.log('  [' + q.key + '] ' + q.dimension + ' — 攻击漏判 ' + q.leak + '/' + q.total + '（' + q.pct + '%），良性 ' + q.fp + ' 误伤，全维度零命中 ' + q.zeroHit + '/' + q.total);
}
