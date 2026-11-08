/**
 * round-250-bridge-stub-revival.test.js
 *
 * r250 轮测试：bridge 交流层九个 stub 路由复活
 *
 * 轮初实测（scripts/tmp-250-probe.js）：src/core/heartflow.js 里九个内联 stub
 * 让九条已广告出去的 dispatch 路由恒返回常量——
 *   translator.entityExtractor     恒 []        （heartflow_translate 的 entities 字段）
 *   translator.responseCompressor  恒 ''
 *   agentLayer.qualityFilter       恒 {}
 *   agentLayer.followupSuggester   恒 []
 *   agentLayer.uncertaintyHandler  恒 {}
 *   agentLayer.translationPipeline 恒 ''        （runUserPipeline / runLLMPipeline）
 *   personaCore.bridgeIdentity     恒 {}        （agent_think / bridge_status 读 .type/.declaration）
 *   personaCore.judgmentInjector   恒 {}
 *   personaCore.personalityTone    恒 ''
 *
 * 本轮在 src/bridge/ 下新建九个真实实现并接线，另新增 MCP 工具
 * heartflow_llm_pipeline_check（AGENTS.md 约定 3 三处接线）。
 *
 * 运行：node test/round-250-bridge-stub-revival.test.js
 */

'use strict';

// [r249 坑①] src/mcp-server.js 加载时会把 process.stdout.write 改道 stderr
// （src/utils/stdio-guard.js），进程内 require 它会让后面的 console.log（含汇总行）
// 全流到 stderr，run-all.js 只解析 res.stdout → 判「未输出汇总行」计 1 个失败。
// 故 C 族的 MCP 端到端断言放独立子进程里跑（与 r249 D 族同款做法）。
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = path.join(__dirname, '..');
const results = [];
const asyncTests = [];
function t(name, fn) {
  const p = (async () => fn())();
  if (p && typeof p.then === 'function') {
    asyncTests.push(p.then(
      () => { results.push({ name, ok: true }); console.log(`  ✅ ${name}`); },
      (e) => { results.push({ name, ok: false, err: e.message }); console.log(`  ❌ ${name}\n     ${e.message}`); }
    ));
    return;
  }
  try {
    fn();
    results.push({ name, ok: true });
    console.log(`  ✅ ${name}`);
  } catch (e) {
    results.push({ name, ok: false, err: e.message });
    console.log(`  ❌ ${name}\n     ${e.message}`);
  }
}

// ─── 共享：一个 start 过的引擎实例 ───
let hf = null;
let dispatchError = null;
try {
  const { createHeartFlow } = require(path.join(HF, 'src/core/heartflow.js'));
  hf = createHeartFlow();
  hf.start();
} catch (e) {
  dispatchError = e.message;
}
const D = (route, ...args) => {
  if (!hf) throw new Error('引擎未启动: ' + dispatchError);
  return hf.dispatch(route, ...args);
};

const SENT_EMAIL = '请联系张三，电话 13812345678，邮箱 zhangsan@example.com，2026-11-08 下午 3:30 开会，预算 5000 元';
const SENT_PLAIN = '今天的会议改到明天，主题不变。';

console.log('\n[A 族] 九个 stub 路由从恒值变真实输出');

t('A1 entityExtractor：三类输入给出不同结果（不再是恒 []）', () => {
  const a = D('translator.entityExtractor', SENT_EMAIL);
  const b = D('translator.entityExtractor', '下载地址是 https://example.com/a.js');
  const c = D('translator.entityExtractor', SENT_PLAIN);
  assert.ok(Array.isArray(a) && a.length >= 4, `实体句只抽到 ${a && a.length} 条`);
  assert.ok(Array.isArray(b) && b.length === 1 && b[0].type === 'url', 'URL 句未抽出 url');
  assert.ok(Array.isArray(c) && c.length === 0, '纯中文句应零实体（防误报）');
  assert.notDeepStrictEqual(JSON.stringify(a), JSON.stringify(b), '两条输入结果相同——仍是 stub 常数的特征');
});

t('A2 entityExtractor：span/置信度/sensitive 字段齐全且可回摘', () => {
  const list = D('translator.entityExtractor', SENT_EMAIL);
  for (const e of list) {
    assert.ok(typeof e.type === 'string' && e.type.length > 0, '缺 type');
    assert.ok(typeof e.value === 'string' && e.value.length > 0, '缺 value');
    assert.ok(Number.isInteger(e.start) && Number.isInteger(e.end) && e.end > e.start, `span 非法: ${JSON.stringify(e)}`);
    assert.strictEqual(SENT_EMAIL.slice(e.start, e.end).replace(/\s+/g, '').length > 0, true, 'span 回摘失败');
    assert.ok(typeof e.confidence === 'number' && e.confidence > 0 && e.confidence <= 1, 'confidence 非法');
    assert.ok(typeof e.sensitive === 'boolean', '缺 sensitive');
  }
  const phone = list.find((e) => e.type === 'phone_cn');
  const email = list.find((e) => e.type === 'email');
  assert.ok(phone && phone.sensitive === true, '手机号应标 sensitive');
  assert.ok(email && email.sensitive === true, '邮箱应标 sensitive');
});

t('A3 entityExtractor：URL 内的域名路径不重复计（跨度裁决）', () => {
  const list = D('translator.entityExtractor', '下载地址是 https://example.com/a.js 谢谢');
  assert.strictEqual(list.length, 1, `应只剩 url 一条，实际 ${JSON.stringify(list.map((e) => e.type))}`);
});

t('A4 responseCompressor：预算内原样返回 + 超预算按信息密度保留', () => {
  const short = D('translator.responseCompressor', '短句一句。', { maxLength: 120 });
  assert.strictEqual(short.text, '短句一句。', '预算内被改写了');
  assert.strictEqual(short.alreadyConcise, true, '未标 alreadyConcise');
  assert.strictEqual(short.ratio, 1, '预算内 ratio 应为 1');

  const long = '大家好，今天我来给大家讲一下这个方案。首先我们要明确目标，这一点非常重要。其实这个方案的核心就是把 A 和 B 接起来。其次，预算方面需要 5000 元，占比 12%。最后，风险是如果延迟上线，Q4 的指标就完不成了。希望对你有帮助！';
  const r = D('translator.responseCompressor', long, { maxLength: 60, maxSentences: 2 });
  assert.ok(r.text.length < long.length, '没有变短');
  assert.ok(r.kept === 2 && r.dropped === 4, `kept=${r.kept} dropped=${r.dropped}`);
  assert.ok(r.ratio > 0 && r.ratio < 1, `ratio=${r.ratio}`);
  assert.ok(/5000|12%|Q4/.test(r.text), '信息密度高的句子没被保留');
  assert.ok(!/希望对你有帮助/.test(r.text), '客套句被保留了');
  assert.ok(Array.isArray(r.sentences) && r.sentences.length === 6 && r.sentences.every((s) => s.reason), 'sentences 审计链不全');
});

t('A5 qualityFilter：未注入探针时自陈 integrated:false，注入后真集成', () => {
  const { QualityFilter } = require(path.join(HF, 'src/bridge/quality-filter.js'));
  const bare = new QualityFilter().filter('毫无疑问这是唯一正确的方案，100%有效。');
  assert.strictEqual(bare.integrated, false, '未注入探针却声称集成');
  assert.strictEqual(bare.pass, false, '绝对化+无来源数字应当不过');
  assert.ok(bare.issues.some((i) => i.rule === 'absolute_claim'), '未检出绝对化措辞');
  assert.ok(bare.issues.some((i) => i.rule === 'unsourced_number'), '未检出无来源数字');

  const wired = D('agentLayer.qualityFilter', '毫无疑问这是唯一正确的方案，100%有效。');
  assert.strictEqual(wired.integrated, true, '引擎常驻实例应注入 gate 探针');
  assert.ok(wired.issues.some((i) => String(i.rule).startsWith('gate:')), '未合并 gate findings');
  assert.ok(wired.gateAction, '缺 gateAction');
});

t('A6 uncertaintyHandler：五档映射 + 认不出输入时不默认 0.5', () => {
  const bands = [[0.95, 'assert', 'none'], [0.72, 'qualified', 'light'], [0.5, 'hedged', 'moderate'], [0.3, 'uncertain', 'strong'], [0.05, 'unknown', 'refuse']];
  for (const [c, level, hedge] of bands) {
    const r = D('agentLayer.uncertaintyHandler', c, {});
    assert.strictEqual(r.level, level, `置信度 ${c} 应落 ${level}，实际 ${r.level}`);
    assert.strictEqual(r.hedge, hedge, `置信度 ${c} 的 hedge 应为 ${hedge}`);
    assert.ok(Array.isArray(r.phrasing) && r.phrasing.length >= 3, '缺具体措辞');
  }
  const none = D('agentLayer.uncertaintyHandler', null, {});
  assert.strictEqual(none.confidence, null, '认不出输入时不能默认一个中值');
  assert.strictEqual(none.parsedFrom, null, '不能伪造解析来源');
  assert.strictEqual(none.sayUnknown, true, '无置信度应导向「说不知道」');
  const obj = D('agentLayer.uncertaintyHandler', { overall: 0.66 }, {});
  assert.strictEqual(obj.confidence, 0.66, '未识别 {overall} 形状');
  assert.strictEqual(obj.parsedFrom, 'object.overall', '未登记解析来源');
  const forced = D('agentLayer.uncertaintyHandler', 0.85, { requireDisclosure: true });
  assert.strictEqual(forced.level, 'qualified', 'requireDisclosure 应把 assert 抬到 qualified');
});

t('A7 followupSuggester：有判定给追问、无判定不硬编、空输入诚实为空', () => {
  const withJudgment = D('agentLayer.followupSuggester', { gate: { action: 'verify' }, findings: [{ dimension: 'unsupported_claim' }], overallScore: 0.42 }, '咖啡能延寿吗？');
  assert.ok(withJudgment.count >= 2, `只给了 ${withJudgment.count} 条`);
  assert.ok(withJudgment.basedOn.includes('needs_verification'), 'verify 判定没转化为追问');
  assert.ok(withJudgment.questions.every((q) => q.reason && q.from), '追问缺审计字段');
  assert.ok(withJudgment.source === 'followup-suggester', 'source 缺失');

  const textOnly = D('agentLayer.followupSuggester', {}, '在吗？');
  assert.ok(textOnly.count >= 1 && textOnly.basedOn[0].includes('text-only'), '纯文本路径未登记判据缺失');

  const empty = D('agentLayer.followupSuggester', null, '');
  assert.strictEqual(empty.count, 0, '空输入不该硬编追问');
  assert.strictEqual(empty.source, null, '空输入不该冒充有产出');
});

t('A8 judgmentInjector：verify 给用户披露、block 只进内部笔记、无判定不编造', () => {
  const verify = D('personaCore.judgmentInjector', { gate: { action: 'verify' }, overallScore: 0.66, findings: [] });
  assert.strictEqual(verify.userFacing.length, 1, 'verify 应有 1 条用户可见披露');
  assert.strictEqual(verify.userFacing[0].kind, 'verification_notice');
  assert.ok(verify.userFacing[0].reason, '披露缺理由');

  const block = D('personaCore.judgmentInjector', { gate: { action: 'block', reason: '拦截: fallacies' }, findings: [] });
  assert.strictEqual(block.userFacing.length, 0, 'block 的消息不该发送，不该有用户可见注入');
  assert.ok(block.internalNotes[0].text.includes('block'), 'block 理由没进内部笔记');

  const none = D('personaCore.judgmentInjector', {}, 'x');
  assert.strictEqual(none.judgment, null, '无判定却报了个判定');
  assert.strictEqual(none.injectCount, 0, '无判定却报注入数');
  assert.strictEqual(none.source, null, '无判定却标了 source');

  const low = D('personaCore.judgmentInjector', { gate: { action: 'pass' }, overallScore: 0.3, findings: [] });
  assert.ok(low.userFacing.some((u) => u.kind === 'low_score_disclosure'), '低分未强制前置披露');
});

t('A9 personalityTone：三档位给出不同修订 + alignment 可度量 + 不替调用方造词', () => {
  const src = '你必须赶紧搞定这件事。综上所述，希望对你有帮助！';
  const warm = D('personaCore.personalityTone', src, { persona: 'warm' });
  const prof = D('personaCore.personalityTone', src, { persona: 'professional' });
  const concise = D('personaCore.personalityTone', src, { persona: 'concise' });
  assert.ok(warm.text !== src, 'warm 档未做任何修订');
  assert.notStrictEqual(warm.text, prof.text, 'warm 与 professional 结果相同——档位没生效');
  assert.notStrictEqual(warm.text, concise.text, 'warm 与 concise 结果相同——档位没生效');
  assert.ok(warm.alignmentAfter < warm.alignmentBefore, `alignment 未下降: ${warm.alignmentBefore}→${warm.alignmentAfter}`);
  assert.ok(!warm.text.includes('希望对你有帮助'), '结尾客套没被砍');
  assert.ok(!/你必须/.test(warm.text), '命令式在 warm 档没被软化');
  assert.ok(/综上所述/.test(prof.text), 'professional 档不该砍书面语篇章标记');
  assert.ok(Array.isArray(warm.changes) && warm.changes.every((c) => c.rule && c.reason), '改动缺审计链');

  const noWord = D('personaCore.personalityTone', '这个方案可行。', { persona: 'warm' });
  assert.strictEqual(noWord.text, '这个方案可行。', '未提供 greeting/closing 时不应自行加词');
  const withWord = D('personaCore.personalityTone', '这个方案可行。', { greeting: '你好呀', closing: '有问题随时问。' });
  assert.ok(withWord.text.startsWith('你好呀') && withWord.text.endsWith('有问题随时问。'), '调用方提供的问候/收尾没被加上');
});

t('A10 bridgeIdentity：身份声明现场实测，探针缺席时如实标 measured:false', () => {
  const id = D('personaCore.bridgeIdentity');
  assert.strictEqual(id.type, 'heartflow-bridge', 'type 缺失——MCP 侧读出来还是 unknown');
  assert.ok(typeof id.declaration === 'string' && id.declaration.length > 20, 'declaration 缺失');
  assert.strictEqual(id.measured, true, '应注入了 listRoutes 探针');
  assert.ok(id.routeCount > 0, `routeCount=${id.routeCount}`);
  assert.ok(Array.isArray(id.capabilities) && id.capabilities.length === 3, 'capabilities 应覆盖三个子系统');
  assert.ok(id.capabilities.every((c) => c.reachable >= c.advertised), `广告了但不可达: ${JSON.stringify(id.capabilities)}`);
  assert.strictEqual(id.doesNot.length, 5, 'doesNot 应是 5 条（对应 Honest limitations）');

  const { BridgeIdentity } = require(path.join(HF, 'src/bridge/bridge-identity.js'));
  const bare = new BridgeIdentity().getIdentity();
  assert.strictEqual(bare.measured, false, '裸构造不该声称实测过');
  assert.strictEqual(bare.routeCount, 0, '裸构造不该报出路由数');
  assert.strictEqual(new BridgeIdentity().verify().ok, false, '无探针时 verify 不该报 ok');
  assert.strictEqual(new BridgeIdentity({ listRoutes: () => ({ translator: ['translator.userToLLM'] }) }).verify().ok, false, '路由不足时应报缺口');
});

t('A11 translationPipeline：runUser 五环节全ready + runLLM 置信度来源如实标注', () => {
  const u = hf.agentLayer.translationPipeline.runUserPipeline('我很着急，bug 今晚必须修好，联系 13812345678');
  assert.deepStrictEqual(u.degraded, [], `有环节缺席: ${JSON.stringify(u.degraded)}`);
  assert.strictEqual(u.ready, true, '五环节齐全却报 not ready');
  assert.ok(u.intent && u.intent.primary, 'intent 缺席');
  assert.ok(u.tone && u.tone.emotion, 'tone 缺席');
  assert.ok(Array.isArray(u.entities) && u.entities.length === 1, 'entities 缺席');
  assert.ok(u.implicitNeeds && typeof u.implicitNeeds.count === 'number', 'implicitNeeds 形状不对');
  assert.ok(u.stance && u.stance.stance, 'stance 缺席');
  assert.ok(/意图=|情绪=/.test(u.summary), `摘要没合成出来: ${u.summary}`);

  const l = hf.agentLayer.translationPipeline.runLLMPipeline('毫无疑问这是唯一正确的方案，100%有效。', { judgment: { gate: { action: 'verify' }, overallScore: 0.4, findings: [] } });
  assert.strictEqual(l.confidenceFrom, 'derived:quality', `置信度来源未标注: ${l.confidenceFrom}`);
  assert.ok(l.quality && l.quality.pass === false, '质检没拦住坏句');
  assert.ok(l.uncertainty && l.uncertainty.level, '不确定性分档缺席');
  assert.ok(Array.isArray(l.disclosure) && l.disclosure.length >= 1, '判定注入的披露缺席');
  assert.deepStrictEqual(l.degraded, [], `LLM 管线有环节缺席: ${JSON.stringify(l.degraded)}`);

  const explicit = hf.agentLayer.translationPipeline.runLLMPipeline('在数据齐全的前提下大概率可行。', { confidence: 0.85 });
  assert.strictEqual(explicit.confidenceFrom, 'ctx.confidence', '调用方显式给的置信度应优先');
});

t('A12 translationPipeline：无 dispatch 探针时逐环节降级并如实报出', () => {
  const { TranslationPipeline } = require(path.join(HF, 'src/bridge/translation-pipeline.js'));
  const bare = new TranslationPipeline();
  const u = bare.runUserPipeline('测试输入');
  assert.strictEqual(u.ready, false, '无探针却报 ready');
  assert.strictEqual(u.degraded.length, 5, `应五个环节全降级，实际 ${u.degraded.length}`);
  assert.ok(u.degraded.every((d) => d.includes('no_dispatch')), '降级原因没写清');
  assert.strictEqual(bare.runUserPipeline('').degraded[0], 'empty_input', '空输入未单独标');
  assert.strictEqual(bare.runLLMPipeline(null).degraded[0], 'empty_output', '空输出未单独标');
});

console.log('\n[B 族] 方法名一致性与防失配（r249 同款坑的回归防线）');

t('B1 translationPipeline 四个入口名都指向同一条管线', () => {
  const tp = hf.agentLayer.translationPipeline;
  for (const name of ['runUser', 'runUserPipeline']) {
    const r = tp[name]('在吗？');
    assert.ok(r && r.summary, `${name} 不可用`);
  }
  for (const name of ['runLLM', 'runLLMPipeline']) {
    const r = tp[name]('这个方案可行。');
    assert.ok(r && typeof r.ready === 'boolean', `${name} 不可用`);
  }
});

t('B2 九个 _lazy 全部接了真 bridge 模块（无一个还留内联 stub）', () => {
  const src = fs.readFileSync(path.join(HF, 'src/core/heartflow.js'), 'utf8');
  // 懒注册键是小驼峰，常量名是类名首字母大写（_EntityExtractor/_QualityFilter…）
  const keys = ['entityExtractor', 'responseCompressor', 'translationPipeline', 'qualityFilter', 'followupSuggester', 'uncertaintyHandler', 'bridgeIdentity', 'judgmentInjector', 'personalityTone'];
  for (const k of keys) {
    const cls = k[0].toUpperCase() + k.slice(1);
    const re = new RegExp(`const _${cls} = _lazy\\('${k}', \\(\\) => \\{ try \\{ return require\\('\\.\\./bridge/[a-z-]+\\.js'\\)`);
    assert.ok(re.test(src), `_${cls} 仍是内联 stub 形态（未 try{require 真模块}）`);
  }
});

t('B3 三个构造点注入了探针（dispatch / gate / version+routes）', () => {
  const src = fs.readFileSync(path.join(HF, 'src/core/heartflow.js'), 'utf8');
  assert.ok(/new \(_TranslationPipeline\(\)\.TranslationPipeline\)\(\{\s*\n?\s*dispatch:/.test(src), 'translationPipeline 未注入 dispatch 探针');
  assert.ok(/new \(_QualityFilter\(\)\.QualityFilter\)\(\{\s*\n?\s*gate:/.test(src), 'qualityFilter 未注入 gate 探针');
  assert.ok(/new \(_BridgeIdentity\(\)\.BridgeIdentity\)\(\{\s*\n?\s*version:/.test(src), 'bridgeIdentity 未注入 version 探针');
  assert.ok(/listRoutes:/.test(src), 'bridgeIdentity 未注入 listRoutes 探针');
});

t('B4 meta-position 维度数仍是探针实测（本轮没把它改成硬编码）', () => {
  const decl = D('personaCore.metaPosition');
  assert.ok(decl && typeof decl === 'object', 'metaPosition 塌了');
  const src = fs.readFileSync(path.join(HF, 'src/bridge/meta-position.js'), 'utf8');
  assert.ok(!/\b210\b/.test(src), 'meta-position.js 里出现了硬编码维度数 210');
});

console.log('\n[C 族] MCP 接线与端到端（独立子进程，避开 stdio-guard 改道）');

t('C1 MCP 三处接线齐全 + tools/list 186 + 新工具端到端跑通', () => {
  const registrySrc = fs.readFileSync(path.join(HF, 'src/mcp/tools-registry.js'), 'utf8');
  assert.ok(registrySrc.includes("name: 'heartflow_llm_pipeline_check'"), 'tools-registry 缺工具定义');
  const serverSrc = fs.readFileSync(path.join(HF, 'src/mcp-server.js'), 'utf8');
  assert.ok(/heartflow_llm_pipeline_check:\s*handleLLMPipelineCheck/.test(serverSrc), 'mcp-server 缺 handler 映射');
  assert.ok(/function handleLLMPipelineCheck\(/.test(serverSrc), 'mcp-server 缺 handler 函数');
  assert.ok(/heartflow\.agentLayer\.translationPipeline\.runLLMPipeline/.test(serverSrc), 'handler 没走引擎常驻实例');

  const serverPath = path.join(HF, 'src/mcp-server.js');
  const childFile = path.join(HF, 'scripts', 'tmp-250-mcp-child.js');
  const script = [
    "process.env.HF_KEEP_STDOUT_LOGS = '1';",
    "if (!process.env.HEARTFLOW_MCP_TOKEN) process.env.HEARTFLOW_MCP_TOKEN = 'round-250-child-token';",
    `const srv = require(${JSON.stringify(serverPath)});`,
    'srv.initHeartFlow();',
    '(async () => {',
    '  const call = (name, args) => srv.handleRequest({jsonrpc:"2.0",id:1,method:"tools/call",params:{name,arguments:args}});',
    '  const bad = await call("heartflow_llm_pipeline_check", { output: "毫无疑问这是唯一正确的方案，100%有效。" });',
    '  const b = JSON.parse(bad.content[0].text);',
    '  if (b.error) throw new Error("工具报错: " + b.error);',
    '  if (b.quality.pass !== false) throw new Error("坏句未被质检拦住");',
    '  if (b.confidenceFrom !== "derived:quality") throw new Error("置信度来源未标注: " + b.confidenceFrom);',
    '  if (!Array.isArray(b.degraded) || b.degraded.length !== 0) throw new Error("degraded=" + JSON.stringify(b.degraded));',
    '  const good = await call("heartflow_llm_pipeline_check", { output: "在数据齐全的前提下大概率可行。", confidence: 0.85, judgment: { gate: { action: "verify" }, overallScore: 0.66, findings: [] } });',
    '  const g = JSON.parse(good.content[0].text);',
    '  if (g.quality.pass !== true) throw new Error("良性句被误判: score=" + g.quality.score);',
    '  if (g.confidenceFrom !== "ctx.confidence") throw new Error("显式置信度未优先");',
    '  if (!g.disclosure.length) throw new Error("verify 判定没产生披露");',
    '  const tr = await call("heartflow_translate", { input: ' + JSON.stringify(SENT_EMAIL) + ' });',
    '  const tb = JSON.parse(tr.content[0].text);',
    '  if (!Array.isArray(tb.entities) || tb.entities.length < 3) throw new Error("translate 的 entities 仍是空: " + JSON.stringify(tb.entities));',
    '  const at = await call("heartflow_agent_think", { input: "我反对这个方案" });',
    '  const ab = JSON.parse(at.content[0].text);',
    '  if (!ab.bridge || ab.bridge.type !== "heartflow-bridge") throw new Error("agent_think 的 bridge.type 仍是 unknown");',
    '  const bs = await call("heartflow_bridge_status", {});',
    '  const bb = JSON.parse(bs.content[0].text);',
    '  if (bb.bridgeType !== "heartflow-bridge" || !bb.bridgeDeclaration) throw new Error("bridge_status 读不到真实身份");',
    '  const list = await srv.handleRequest({jsonrpc:"2.0",id:2,method:"tools/list",params:{}});',
    '  const names = (list.tools || []).map(x => x.name);',
    '  if (names.length !== 186) throw new Error("tools/list=" + names.length);',
    '  if (!names.includes("heartflow_llm_pipeline_check")) throw new Error("tools/list 缺新工具");',
    '  console.log("CHILD-OK tools=" + names.length + " entities=" + tb.entities.length);',
    '})().catch(e => { console.error("CHILD-FAIL " + e.message); process.exit(3); });',
  ].join('\n');
  fs.writeFileSync(childFile, script, 'utf8');
  let stdout = '';
  try {
    stdout = execFileSync('node', [childFile], {
      cwd: HF, encoding: 'utf8', timeout: 180000, stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (e) {
    throw new Error(`子进程失败: ${e.message}\n${(e.stdout || '').toString().slice(-600)}${(e.stderr || '').toString().slice(-600)}`);
  } finally {
    try { fs.unlinkSync(childFile); } catch (_) { /* 临时文件清理失败不影响判定 */ }
  }
  assert.ok(/CHILD-OK/.test(stdout), `子进程未报 CHILD-OK: ${stdout.slice(-300)}`);
});

console.log('\n[D 族] 回归：招牌入口、既有路由、误报控制');

t('D1 三个招牌入口行为不变', () => {
  const { checkInput, checkOutput, checkDraft } = require(path.join(HF, 'src/gate.js'));
  assert.ok(checkInput('你不同意就是自私').gate.action, 'checkInput 塌了');
  assert.ok(checkOutput('毫无疑问这是唯一正确的方案。').gate.action, 'checkOutput 塌了');
  assert.ok(checkDraft('这个方案一定可以。').gate.action, 'checkDraft 塌了');
});

t('D2 判别维度仍是 210（本轮未动判别引擎）', () => {
  const d = require(path.join(HF, 'src/gate.js')).discriminate('测试句');
  assert.strictEqual(Object.keys(d.dimensions).length, 210);
});

t('D3 九个复活路由的兄弟路由一条不塌', () => {
  const translator = ['userToLLM', 'llmToUser', 'intentClassifier', 'toneAnalyzer', 'implicitNeedDetector', 'confidenceAnnotator'];
  for (const r of translator) {
    const out = D('translator.' + r, '那个东西怎么用来着？比如举个例子', {});
    assert.ok(out !== undefined, `translator.${r} 返回 undefined`);
  }
  const agent = ['agentBridge', 'contextBuilder', 'responseInterceptor', 'conflictResolver'];
  for (const r of agent) {
    const out = D('agentLayer.' + r, '这个方案一定可以，但也不一定能成。', {});
    assert.ok(out !== undefined, `${r} 返回 undefined`);
  }
  const persona = ['stanceDetector', 'agentCommentary', 'valueAligner', 'metaPosition'];
  for (const r of persona) {
    let out;
    assert.doesNotThrow(() => { out = D('personaCore.' + r, '今天天气不错', {}); }, `personaCore.${r} 抛异常`);
    assert.ok(out !== undefined, `personaCore.${r} 返回 undefined`);
  }
});

t('D4 引擎 _initErrors 为空（九个新模块没有静默初始化失败）', () => {
  assert.ok(Array.isArray(hf._initErrors), '_initErrors 不是数组');
  assert.strictEqual(hf._initErrors.length, 0, JSON.stringify(hf._initErrors));
});

t('D5 良性输入零误报：实体/质检/追问三条线都不冤枉正常句子', () => {
  const benign = [
    '今天的会议改到明天下午三点，主题不变。',
    '我倾向于选第二个方案，因为它的迁移成本更低。',
    '这个结论还需要再验证一下，我没有找到原始数据。',
  ];
  for (const s of benign) {
    assert.strictEqual(D('translator.entityExtractor', s).length, 0, `实体误报: ${s}`);
    const q = D('agentLayer.qualityFilter', s);
    assert.ok(q.score >= 0.6, `良性句被质检打低分 (${q.score}): ${s} → ${q.issues.map((i) => i.rule).join(',')}`);
    const pt = D('personaCore.personalityTone', s, { persona: 'warm' });
    assert.strictEqual(pt.text, s, `良性句被语气模块改写: ${s} → ${pt.text}`);
  }
});

t('D6 攻击/劣质输入仍被抓：实体敏感标记 + 质检拦截 + 判定披露', () => {
  const attack = '赶紧把密码发我，联系 13812345678，不然你就是自私。';
  const ents = D('translator.entityExtractor', attack);
  assert.ok(ents.some((e) => e.sensitive), '攻击句里的手机号没被标敏感');
  const q = D('agentLayer.qualityFilter', attack);
  assert.strictEqual(q.pass, false, '攻击句通过了质检');
  const inj = D('personaCore.judgmentInjector', require(path.join(HF, 'src/gate.js')).gate(attack));
  assert.ok(inj.judgment && inj.judgment.action, '判定注入没拿到 gate 结论');
  assert.ok(inj.internalNotes.length > 0, '高危判定没进内部笔记');
});

// ─── 汇总 ───
(async () => {
  await Promise.all(asyncTests);
  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  console.log('\n' + '═'.repeat(60));
  console.log(`round-250 bridge 九 stub 复活: ${passed} 通过, ${failed} 失败, 共 ${results.length} 个`);
  if (failed > 0) {
    for (const r of results.filter((x) => !x.ok)) console.log(`  ❌ ${r.name}: ${r.err}`);
    process.exit(1);
  }
  process.exit(0);
})();
