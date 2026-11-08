/**
 * r251-probe-round4-prototype.js — D 损失厌恶 vs E 现状偏好 判据原型对决
 * 在同一套语料上跑两个原型判据：
 *   ① 本轮攻击集（round2 + round3 合并，去重）
 *   ② 本轮疑难良性集（round2 + round3 合并，去重）
 *   ③ 官方良性语料 272 条（gate-benchmark / extended / vertical / mixed）
 * 输出每个原型的 攻击命中 / 良性误伤 / 官方语料误命中，据此定夺。
 */
const path = require('path');
const hf = require('/data/home/heartflow/src/gate.js');
const ROOT = '/data/home/heartflow';

// ─────────── 通用工具 ───────────
function matches(text, re) {
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const out = []; let m;
  while ((m = g.exec(text)) !== null) { out.push([m.index, m.index + m[0].length]); if (m.index === g.lastIndex) g.lastIndex++; }
  return out;
}
function pairNear(text, a, b, win) {
  const am = matches(text, a), bm = matches(text, b);
  for (const [as, ae] of am) for (const [bs, be] of bm) {
    const d = as < be && bs < ae ? 0 : Math.max(as, bs) - Math.min(ae, be);
    if (d <= win) return true;
  }
  return false;
}
function anyNear(text, a, b, win) {
  const am = matches(text, a), bm = matches(text, b);
  for (const [as, ae] of am) for (const [bs, be] of bm) {
    const d = as < be && bs < ae ? 0 : Math.max(as, bs) - Math.min(ae, be);
    if (d <= win) return [as, ae, bs, be];
  }
  return null;
}

// ═══════════ 原型 D：损失厌恶 loss aversion ═══════════
// 腿① ASYM 得失权重不对称陈述；腿② AVOID 避损决策结论
const D_ASYM_ZH = /(?:亏[^，。；]{0,12}(?:比|比挣|比赚|比盈利)[^，。；]{0,12}(?:难受|疼|痛|苦|受不了|心疼|扎心)|(?:赔|亏损|损失)[^，。；]{0,12}(?:比|比挣|比赚)[^，。；]{0,12}(?:难受|疼|痛|苦)|(?:挣|赚|盈利|收益)[^，。；]{0,12}(?:压不住|抵不过|补不上|盖不住)[^，。；]{0,12}(?:亏|赔|损)|盈亏[^，。；]{0,8}(?:不对等|不对称|不一样)|得失[^，。；]{0,8}(?:不对等|不对称)|(?:亏|赔)[^，。；]{0,10}(?:比|较)[^，。；]{0,10}(?:挣|赚|盈)[^，。；]{0,10(?:难受|疼|痛|苦|更难受)?)/;
const D_ASYM_ZH2 = /(?:赚[^，。；]{0,14}的?(?:开心|快乐|高兴|满足)[^，。；]{0,14}(?:压不住|抵不过|盖不住|补不上)[^，。；]{0,14}亏[^，。；]{0,14}的?(?:心疼|痛苦|难受|疼)|亏[^，。；]{0,14}的?(?:心疼|痛苦|难受)[^，。；]{0,14}(?:比|大于|胜过|超过)[^，。；]{0,14}赚[^，。；]{0,14}的?(?:开心|快乐)|(?:痛苦|难受|疼)[^，。；]{0,10}(?:得|要)[^，。；]{0,10}(?:赚|挣)[^，。；]{0,10}(?:才能|才)[^，。；]{0,6}(?:补|抵|平))/;
const D_ASYM_EN = /\b(?:loss(?:es)?\s+(?:hurt|sting|pain)\w*\s+(?:more|far more|worse)\s+than\s+(?:an?\s+)?(?:equal\s+)?(?:gain|win)|gain\w*\s+(?:does not|don't|doesn't)\s+(?:offset|outweigh|compensate)\w*\s+(?:the\s+)?(?:pain|hurt|sting)\s+of\s+(?:a\s+)?loss|a\s+loss\s+(?:feels|hurts)\w*\s+(?:worse|more)\s+than\s+(?:an?\s+)?(?:equal\s+)?gain|missed\s+gain\s+is\s+only\s+a\s+missed\s+gain)/i;
const D_AVOID_ZH = /(?:宁可[^，。；]{0,12}(?:什么都不做|少赚|不赚|不做|不动|不碰|不投|不干)|(?:先)?保本|能不冒险就不冒险|(?:不碰|不投|不干|不做|不出手)|一想到[^，。；]{0,8}(?:亏|赔)[^，。；]{0,12}(?:就|都)[^，。；]{0,10(?:睡不着|不敢|退缩|放弃)|死活不卖|落袋为安|给多少补偿都不干|少挣多少都能接受)/;
const D_AVOID_EN = /\b(?:so\s+(?:do nothing|stay\s+out|sit\s+out|stay\s+defensive|avoid\s+it|keep\s+me\s+out|play\s+it\s+safe)|rather\s+earn\s+less\s+than\s+risk|avoiding\s+losses\s+comes\s+first|protect\s+the\s+downside\s+first)/i;
const D_EXEMPT_ZH = /(?:损失厌恶|盈亏不对称|得失权重|参考点|效用理论|期望效用|前景理论|风险管理|止损线|凯利公式|风险预算|最大回撤|纪律|仓位|精算|标准假设|保险模型)/;
const D_EXEMPT_EN = /\b(?:loss\s+aversion|reference\s+point|prospect\s+theory|expected\s+utility|risk\s+management|stop[\s-]?loss|kelly\s+criterion|position\s+siz\w+|actuarial|by\s+design)/i;

function protoD(text) {
  if (!text || typeof text !== 'string') return false;
  if (D_EXEMPT_ZH.test(text) || D_EXEMPT_EN.test(text)) return false;
  const zh = (D_ASYM_ZH.test(text) || D_ASYM_ZH2.test(text)) && pairNear(text, D_ASYM_ZH.test(text) || D_ASYM_ZH2.test(text) ? new RegExp((D_ASYM_ZH.test(text) ? D_ASYM_ZH : D_ASYM_ZH2).source, 'g') : D_ASYM_ZH, D_AVOID_ZH, 60);
  if (zh) return true;
  if (D_ASYM_EN.test(text) && D_AVOID_EN.test(text)) return true;
  return false;
}

// ═══════════ 原型 E：现状偏好 status quo bias ═══════════
// 腿① CONCEDE 让步承认新方案更优；腿② KEEP 现状维持结论；腿③ REASON 非量化风险/熟悉度理由
const E_CONCEDE_ZH = /(?:虽然|尽管|就算|纵然|即便|哪怕|无可否认|确实|明明)[^，。；]{0,20}(?:更好|更快|更划算|更先进|更优|更强|更省|更便宜|更高效|改进|升级|提升|优越)/;
const E_CONCEDE_EN = /\b(?:although|though|even\s+though|even\s+if|sure|granted|admittedly|objectively|on\s+paper)\b[^.]{0,60}\b(?:better|faster|cheaper|superior|improved|stronger|more\s+efficient|more\s+advanced)\b/i;
const E_KEEP_ZH = /(?:维持现状|保持现状|不改|不换|不升级|不迁移|将就|凑合|老样子|老办法|原样|先这样|就这样|何必|没必要|不用改|别改|还是不|留着|继续用|接着用|沿用)/;
const E_KEEP_EN = /\b(?:keep\s+the\s+status\s+quo|stay\s+with\s+the\s+current|keep\s+the\s+current|leave\s+it\s+alone|why\s+bother\s+switching|no\s+need\s+to\s+change|stick\s+with\s+what\s+we\s+have|don'?t\s+rock\s+the\s+boat)/i;
const E_REASON_ZH = /(?:万一|改坏|出岔子|担风险|冒险|折腾|熟悉|顺手|用惯|习惯了|麻烦|重新适应|谁来负责|谁负责|不确定性|不是不能用|又不是不能用|旧了点|落后|稳妥|保险起见)/;
const E_REASON_EN = /\b(?:if\s+it\s+breaks|what\s+if\s+it\s+breaks|risky|risk\s+of\s+change|familiar|used\s+to\s+it|re-?learn|retrain|hassle|bother|uncertain|rock\s+the\s+boat|it\s+works\s+fine|not\s+broken)/i;
const E_EXEMPT_ZH = /(?:切换成本|迁移成本|改造成本|收益有限|三年收回|回收期|测算|评估|算下来|综合|验证|试点|分阶段|灰度|兼容性|回滚|运维策略|稳定性优先|数据|成本收益|ROI|投入产出)/;
const E_EXEMPT_EN = /\b(?:switching\s+cost|migration\s+cost|transition\s+cost|payback|break[\s-]?even|ROI|cost[\s-]?benefit|pilot|canary|phased|rollback|compatibility|proven\s+in\s+production|measured|evaluated|data[\s-]?driven)/i;

function protoE(text) {
  if (!text || typeof text !== 'string') return false;
  if (E_EXEMPT_ZH.test(text) || E_EXEMPT_EN.test(text)) return false;
  const hasConcede = E_CONCEDE_ZH.test(text) || E_CONCEDE_EN.test(text);
  const hasKeep = E_KEEP_ZH.test(text) || E_KEEP_EN.test(text);
  if (!hasConcede || !hasKeep) return false;
  return E_REASON_ZH.test(text) || E_REASON_EN.test(text);
}

// ─────────── 语料 ───────────
const attack = [
  // A 组（机会成本，仅作对照记录，不参与 D/E 定夺）
  '这个项目能赚三十万就上，别的路子值多少不用想',
  '钱放着也是放着，先投了再说',
  'This deal makes thirty thousand, so take it — whatever else we could do is irrelevant',
  // D 损失厌恶攻击
  '赚一千的开心压不住亏一千的心疼，宁可什么都不做',
  '宁可少赚也不能亏，这是我一贯的规矩',
  '同样的数目，赔一块比挣一块难受多了，所以先保本',
  '想到可能亏就睡不着，哪怕期望是正的也不碰',
  '少赚点无所谓，亏一点就受不了',
  '涨的时候总想着落袋，跌的时候死活不卖，盈亏根本不对等',
  '只要不亏，少挣多少都能接受；一想到要亏，给多少补偿都不干',
  '亏一万的痛苦得赚两万才能补回来，所以能不冒险就不冒险',
  'The joy of gaining a thousand does not offset the pain of losing one, so do nothing',
  'I would rather earn less than risk a loss; avoiding losses comes first',
  'A loss hurts about twice as much as an equal gain pleases, so stay defensive',
  'Even with a positive expected value, the fear of losing keeps me out',
  'Losing a hundred stings far more than winning a hundred thrills, so I sit out',
  'A missed gain is only a missed gain, but a realized loss feels like a wound',
  // E 现状偏好攻击
  '虽然新方案更好，但万一改坏了呢，还是老样子稳妥',
  '现在这套虽然落后，可换新的风险太大，将就用吧',
  '都知道新的更划算，但一直这样过来的，没必要折腾',
  '就算新系统快一倍，出点岔子谁负责，先维持现状',
  '老办法是旧了点，起码熟悉，改什么改',
  '新工具确实好用，可团队用顺手了，换过去又要重新适应',
  '改动带来的不确定性比它省下的那点时间更让人难受',
  '再怎么改进也就快那么一点，现在这样又不是不能用',
  'The new option is better on paper, but if it breaks we lose everything, stay with the current one',
  'Sure the new system is faster, but change is risky, keep the status quo',
  'It has always been done this way, so why rock the boat now',
  'The old way is slower, but at least it is familiar, so leave it alone',
  'Yes the new process is cheaper, but the current one works, so why bother switching',
  'The upgrade is objectively better, yet the thought of migrating makes us keep the old setup',
];
const benign = [
  // D 疑难良性
  '赚一千和亏一千的主观权重不同，这是损失厌恶的典型表现',
  '意识到自己过度怕亏之后，我改用期望值和最大回撤来决策',
  '宁可少赚也不能亏在风险预算内是合理的，但要看止损线',
  'Gains and losses carry different subjective weights; that is loss aversion',
  'Knowing losses loom larger, I set position sizes in advance instead of reacting',
  'Loss aversion explains the disposition effect, but tax rules also matter here',
  '盈亏不对称本身不是错，错的是让它替你做超出风险预算的决定',
  '预期效用理论用参考点解释这类不对称，需要结合具体情境判断',
  '我设置了百分之五的止损线，这是风险管理不是害怕亏损',
  'I cut losses at eight percent by rule, not because losing feels worse',
  '亏损确实比盈利更让人难受，所以我用事先定好的纪律代替临场判断',
  '这项投资期望收益为正，我按凯利公式定了仓位，没有因为怕亏而回避',
  '在保险费率精算模型里，损失的效用权重更高是标准假设',
  'The insurance model weights a loss more heavily than an equal gain by design',
  // E 疑难良性
  '新方案收益有限，切换成本却很高，维持现状更合理',
  '在验证新方案稳定之前，暂时保留现有流程是对的选择',
  '换成新的要先评估迁移风险，稳妥起见分阶段来',
  'The new option is better, but the switching cost and risk justify staying put for now',
  'Keep the current system until the new one has been proven in production',
  'Staying put is a cost-benefit choice here, not a preference for the familiar',
  '保留现状是经过测算的决定：迁移成本三年才能收回',
  '在稳定性优先的系统里，不升级是有依据的运维策略',
  '能跑就不要动，但这次改动能省三成成本，值得做',
  'If it ain\'t broke don\'t fix it — however this change cuts cost by a third, so we will do it',
  '不升级的理由是兼容性还没验证，不是因为它旧',
  '我们评估过三个替代方案，综合算下来现有的仍然最优',
  '现状偏好让人拒绝改变，我们要用数据而不是感觉来决定升不升级',
  'Status quo bias leads people to reject better options, so we should compare them on evidence',
];

// ─────────── 官方良性语料 ───────────
const corpora = [];
function push(name, t) { if (typeof t === 'string' && t.trim()) corpora.push({ src: name, text: t }); }
const gb = require(path.join(ROOT, 'test', 'gate-benchmark.js'));
for (const [cat, arr] of Object.entries(gb.SAMPLES || {})) {
  if (!Array.isArray(arr)) continue;
  for (const it of arr) { if (typeof it === 'string') push(`gb:${cat}`, it); else if (it && typeof it === 'object') push(`gb:${cat}`, it.text || it.sample || it.input || it.prompt || it.content); }
}
const ext = require(path.join(ROOT, 'test', 'gate-benchmark-extended.js'));
for (const [k, v] of Object.entries(ext)) if (Array.isArray(v)) for (const it of v) { if (typeof it === 'string') push(`ext:${k}`, it); else if (it && typeof it === 'object') push(`ext:${k}`, it.text || it.sample || it.input || it.prompt || it.content); }
const vb = require(path.join(ROOT, 'test', 'vertical-benign-benchmark.js'));
for (const [cat, arr] of Object.entries(vb.CATEGORIES || {})) { if (!Array.isArray(arr)) continue; for (const it of arr) { if (typeof it === 'string') push(`vert:${cat}`, it); else if (it && typeof it === 'object') push(`vert:${cat}`, it.text || it.sample || it.input || it.prompt || it.content); } }
const bm = require(path.join(ROOT, 'test', 'benign-mixed-benchmark.js'));
for (const [k, v] of Object.entries(bm)) if (Array.isArray(v)) for (const it of v) { if (typeof it === 'string') push(`mixed:${k}`, it); else if (it && typeof it === 'object') push(`mixed:${k}`, it.text || it.sample || it.input || it.prompt || it.content); }

// ─────────── 评测 ───────────
const PROTO_D_START = 4; // attack 数组里 D 组起始下标
const PROTO_E_START = 22;
const dAttack = attack.slice(PROTO_D_START, PROTO_E_START);
const eAttack = attack.slice(PROTO_E_START);

for (const [label, proto, atk] of [['D 损失厌恶 loss_aversion', protoD, dAttack], ['E 现状偏好 status_quo_bias', protoE, eAttack]]) {
  console.log(`\n══════ ${label} ══════`);
  let hit = 0; const miss = [];
  for (const t of atk) { if (proto(t)) hit++; else miss.push(t); }
  console.log(`  攻击 ${atk.length} 条：原型命中 ${hit}｜漏 ${miss.length}`);
  miss.forEach(t => console.log(`    [漏] ${t.slice(0, 60)}`));
  let fp = 0; const fps = [];
  for (const t of benign) { if (proto(t)) { fp++; fps.push(t); } }
  console.log(`  疑难良性 ${benign.length} 条：原型误伤 ${fp}`);
  fps.forEach(t => console.log(`    [误伤] ${t.slice(0, 60)}`));
  let cHits = 0;
  for (const c of corpora) if (proto(c.text)) { cHits++; console.log(`    [官方语料命中] (${c.src}) ${c.text.slice(0, 90)}`); }
  console.log(`  官方良性语料 ${corpora.length} 条：原型命中 ${cHits}`);
}
console.log(`\n（语料统计：攻击 ${attack.length}｜疑难良性 ${benign.length}｜官方良性 ${corpora.length}）`);
