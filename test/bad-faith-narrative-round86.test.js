/**
 * 测试：bad_faith 策略叙事族（第 86 轮）
 *
 * 背景：原有 32 条中文判据全是「你+指控」直接句式，feigned_discussion 收
 * 「自封中立 × 贬损对方」。实测第三类形态全族漏判：**策略叙事**——说话者
 * 以第三人称/元视角点破「某人正在用坏信念手段」，而不是当面骂「你」。
 *
 * 轮初实测（未改引擎前）：
 *   - 8 条攻击样本 bad_faith 自身 0/8；扩样 24 条仍 0/24
 *   - 其中 2 条还被其他维度误抓（dehumanization block / sarcasm verify）
 * 接入后：24 条攻击 17/24 命中，良性 32 条零误伤，因 bad_faith block 零条。
 *
 * ⚠️ 断言口径（第 85 轮教训）：gate 层动作**必须按维度归因**。
 *    良性集里有些样本本来就会被其他维度判 verify/rewrite（如
 *   「这个结论缺乏数据支撑」→ unsupported_claim），那是既有正确行为，
 *    与本族无关。所以良性侧只断言两件事：
 *      ① bad_faith 维度不出现（按维度归因）
 *      ② gate.action 不升级到 block/rewrite（动作级不许误伤）
 *
 * ⚠️ 正则纪律（本轮实测踩 4 次）：`[^。，]{0,8)` 少写一个 `}` 会让 `)`
 *    提前闭合、后续捕获组退化成普通文本，整条判据**静默失效**——
 *    不报错、只是永远不命中。not_arguing_to_win 槽曾因此从命中 5 条
 *    掉到 0。node --check 抓不到这类括号错位。
 */
const path = require('path');
const assert = require('assert');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ── 攻击样本：第三人称/元视角策略叙事 ──
const ATTACK = [
  '别和他辩了，他根本不是在讨论问题',
  '他明显是揣着明白装糊涂，故意带节奏',
  '反复追问同一个问题，直到对方答不上来就宣布自己赢了',
  '把对方没说的话强行安他头上，再反驳这个被安上的观点',
  '故意引用对方三年前的观点来否定他今天的立场',
  '辩论时专门挑对方语气用词的问题，回避论点本身',
  '每次都用「我没有这个意思」撤回发言，下轮换个说法继续',
  '先把水搅浑，再指责别人没讲清楚',
  '他不是在辩论，是在等你犯错好评判你',
  '表面上问问题，实际上是要给你定罪',
  '他问的那些问题根本不需要答案，只是为了占据道德高地',
  '只要你不接招，他就说你默认了',
  '专挑你措辞的漏洞，绕开你真正的意思',
  '最后再补一句「我只是礼貌地提出质疑」',
  '他不是在跟你讲道理，是在给你下套',
  '这套立体防御就是为了让他永远正确',
  '他不是来讨论的，是来赢的',
  '每句话都留了后路，好随时改口不认账',
  '先给你扣个帽子，再论证这个帽子多合理',
  '他只是想证明自己没错，根本不在乎真相',
  '看似中立，其实每一步都在偏袒自己人',
  '把讨论引向细节，好让大家忘记核心问题',
  '他一开口就认定你错了，后面都在为这个结论找理由',
  '真正在意的是谁输谁赢，而不是事实是什么',
];
// ── 第 88 轮更新 ──────────────────────────────────────────────
// 第 86 轮本表列了 7 条未覆盖样本并断言「不得假命中」（防有人用逐句定制
// 规则硬凑）。第 88 轮用「两半齐备 AND」判据把这 7 条全部覆盖（引擎实测
// 8/8 命中，见 test/bad-faith-gaps-round88.test.js），因此本表在此轮** emptied
// —— 原 7 条现已在 ATTACK 表中正常命中。保留空表与下面这条断言：它从
// 「不得假命中」变成「留待下一轮新增未覆盖样本时回填」，防止下一轮
// 悄悄把断言删掉而不是真补判据。
const UNTILED = [
  // 第 88 轮已全部覆盖（原 7 条，判据见 BADFAITH_NARRATIVE_SLOTS 第 88 轮段）：
  //   '别和他辩了，他根本不是在讨论问题'
  //   '只要你不接招，他就说你默认了'
  //   '这套立体防御就是为了让他永远正确'
  //   '每句话都留了后路，好随时改口不认账'
  //   '先给你扣个帽子，再论证这个帽子多合理'
  //   '把讨论引向细节，好让大家忘记核心问题'
  //   '真正在意的是谁输谁赢，而不是事实是什么'
];
// 第 88 轮新增的同族扩样（防过拟合）：全部应命中
const EXPANDED = [
  '别跟他吵了，他压根不是在讲道理',
  '只要你不回应，对方就算你默认了',
  '这种全方位防御就是让他永远正确',
  '每段话都埋了后手，方便随时反悔',
  '先给他贴个标签，再论证这个标签多合理',
  '把争论引到枝节问题，好让大家忘记重点',
  '他计较的是谁输谁赢，而不是事实真相',
];

// ── 良性边界：覆盖该族每个槽的邻近形状 ──
const BENIGN = [
  // 邻近「撤回/翻旧账」
  '他撤回发言是因为发现自己引用有误，并已更正',
  '三年前那篇论文的数据今天看仍然有效',
  '辩论中提到对方三年前的观点有助于理解立场立场变化',
  '他换了个更准确的词重新表达同一个意思',
  // 邻近「追问」
  '请问您能否提供具体的证据支持这个结论？',
  '我想确认一下你指的是哪个指标，数据口径是什么',
  '反复确认需求细节是为了避免返工',
  // 邻近「不是A而是B」的求真用法
  '他不是在讨论技术细节，是在讨论产品方向',
  '这不是在追责，是在找解决方案',
  '我们不是在争论谁对谁错，是在对齐目标',
  '他不是在回避问题，是在等数据出来',
  '这样设计不是为了省事，是为了可维护性',
  // 邻近「留余地/中立/赢」的中性用法
  '每句话都留了余地，方便后续迭代时调整',
  '团队在意的是谁负责哪部分，而不是谁资历深',
  '竞争不是为了赢过对手，是为了把产品做好',
  // 邻近「聚焦/拆解」
  '把讨论拆成小块，逐段确认理解一致',
  '先把边界情况列全，再讨论优先级',
  '我们应该把讨论聚焦在方案本身上',
  '把问题引向根本原因，而不是表象',
  // 邻近「扣帽子/稻草人」的正常批评
  '这个结论缺乏数据支撑，建议补充来源',
  '他指出我的逻辑漏洞时给了具体的反例',
  '他的批评有道理，我接受这一点',
  '如果证据不足，那就先不下结论',
  '双方共识是该方法在样本外表现更稳',
  '这个观点我不认同，理由有两条',
  '沉默不代表同意，但也不代表反对',
  '他认可了方案方向，只是对时间表有保留',
  '我先复述一下你的观点，确认理解一致',
  '语气和态度也是沟通的一部分，但论点本身更值得关注',
  // 完整被 prompt_injection 等 block 不误判为 bad_faith
  '他不是坏，只是信息不全',
  // 【第 86 轮补】否定式前缀（「不是为了赢，是为了做好」）——本轮实测抓到的
  // 真误伤，共 3 条，修法：lookbehind + negative 建设性宾语排除
  '竞争不是为了赢过对手，是为了把产品做好',
  '他不是来赢的，是来解决问题的',
  '我们不是为了赢，是为了把标准立起来',
  '她不是来吵架的，是来对齐需求的',
  '我说这些不是为了指责谁，是想把问题说清楚',
  '他留后路不是为了不认账，是为了方案可回滚',
  '提旧账不是为了翻案，是为了说明背景',
  '追问到底不是为了难受人，是为了把需求钉死',
];

console.log('\n[攻击样本：策略叙事族命中 bad_faith]');
t(`攻击样本命中 bad_faith 维度 ≥ 17/24（第 88 轮实测 24/24 全覆盖）`, () => {
  const hits = ATTACK.filter(s => (gate.gate(s).findings || []).some(f => f.dimension === 'bad_faith')).length;
  assert.ok(hits >= 17, `bad_faith 命中 ${hits}/24，低于 17`);
});

t('第 88 轮同族扩样 7 条应命中（UNTILED 已清空）', () => {
  const miss = EXPANDED.filter(s => !(gate.gate(s).findings || []).some(f => f.dimension === 'bad_faith'));
  assert.deepStrictEqual(miss, [], `漏判: ${miss.join(' | ')}`);
});

t('UNTILED 表必须留空：新扩样样本应先建主测试再补判据（第 88 轮纪律）', () => {
  assert.strictEqual(UNTILED.length, 0, `UNTILED 非空（${UNTILED.length} 条）—— 若下一轮新增未覆盖样本，请在这里回填并在 UPGRADE_LOG 记录缺口实测`);
});

t('攻击样本不得出现 gate pass 过多（已命中部分至少 verify）', () => {
  const hitRows = ATTACK.filter(s => (gate.gate(s).findings || []).some(f => f.dimension === 'bad_faith'));
  const notVerify = hitRows.filter(s => gate.gate(s).gate.action === 'pass');
  assert.strictEqual(notVerify.length, 0, `${notVerify.length} 条命中却 pass: ${notVerify.slice(0,2).join('|')}`);
});

console.log('\n[良性边界：按维度归因，零误伤]');
t(`良性样本 bad_faith 零命中（实测 ${BENIGN.length} 条）`, () => {
  const bad = BENIGN.filter(s => (gate.gate(s).findings || []).some(f => f.dimension === 'bad_faith'));
  assert.deepStrictEqual(bad, [], `误伤: ${bad.join(' | ')}`);
});

t('良性样本零 block（动作级不许误伤）', () => {
  const bad = BENIGN.filter(s => gate.gate(s).gate.action === 'block');
  assert.deepStrictEqual(bad, [], `被 block: ${bad.join(' | ')}`);
});

t('良性样本零 rewrite（本族不升级良性文本到改写级）', () => {
  const bad = BENIGN.filter(s => gate.gate(s).gate.action === 'rewrite');
  assert.deepStrictEqual(bad, [], `被 rewrite: ${bad.join(' | ')}`);
});

console.log('\n[checkBadFaith 函数级：信号来源可归因]');
t('接入后 badFaith 检测层返回 narrative_* 类型信号', () => {
  const r = idx.checkBadFaith('他不是来讨论的，是来赢的');
  const types = (r.signals || []).map(s => s.type);
  assert.ok(types.some(x => String(x).startsWith('narrative_')), `未见到 narrative_ 信号: ${types.join(',')}`);
});

t('良性句子检测层 score 为 0', () => {
  const r = idx.checkBadFaith('他不是在讨论技术细节，是在讨论产品方向');
  assert.strictEqual(r.score, 0, `score=${r.score}, signals=${(r.signals||[]).map(s=>s.type).join(',')}`);
});

t('两半齐备纪律：只含手段半不命中（单「提到三年前」）', () => {
  const r = idx.checkBadFaith('三年前那篇论文的数据今天看仍然有效');
  assert.strictEqual(r.score, 0, `单半误命中 score=${r.score}`);
});

t('两半齐备纪律：只含手段半不命中（单「撤回发言」）', () => {
  const r = idx.checkBadFaith('他撤回了之前的发言');
  assert.strictEqual(r.score, 0, `单半误命中 score=${r.score}`);
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail === 0 ? 0 : 1);
