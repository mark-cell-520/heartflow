/**
 * r295 经济与资源推理 + 统计素养 18 族插件层+MCP 接线轮测
 *
 * 覆盖：
 *   A 插件元数据与族表（18 族 = 13 econ + 5 stats，族键/模块路径/组归属）
 *   B 每族攻击命中（18 族全中，模块级两腿共现判据经插件聚合后仍可达）
 *   C 良性零误伤（12 条官方良性形状语料）
 *   D action=<family key> 单族过滤（MCP action 入参）
 *   E 负例注入-删条（18 个：blind inject 各模块 __internals 探针键后，
 *     该族必须从命中中消失——证明每个族的 dispatch 都是承重的，删了会红）
 *   F 引擎 think 路径真 dispatch（真 HeartFlow 实例 + 真 runThinkPipeline：
 *     插件经 PluginLoader 加载 → postprocess.think hook 写
 *     _discrimination.econReasoning → 消费者（hook fire 之后）打
 *     _confidencePenalty + warning；良性结论零触发）
 *   G MCP 接线（tools-registry 定义 + HANDLERS 映射 + 真实 HTTP JSON-RPC
 *     tools/call 两个工具都返回命中）
 *   H 不回归（维度计数仍 246——本轮零 src/index.js 改动；插件未加载时
 *     dispatch 消失）
 */

'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const PLUGIN = require(path.join(ROOT, 'src/plugins/econ-reasoning-check/index.js'));
const { analyze, FAMILIES } = PLUGIN;

let passed = 0, failed = 0;
function T(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}\n    ${e.message}`); }
}

// ─── 每族攻击样本（源自各模块单测/报告 §五 原句）──
const ATTACK = {
  budget_value_conflation: '我们预算不够，所以这件事本来就不值得做。',
  average_marginal_conflation: '单台成本已经压到这么低了，说明再生产一台更便宜。',
  mental_accounting: '这笔年终奖是意外之财，不算正经收入，所以可以放心大胆地挥霍一把。',
  perverse_incentive: '按销量发奖金最能调动积极性，员工自己进货刷单也算业绩，双赢。',
  winners_curse: '竞标赢了说明这块地就值这个价，我们的判断得到了验证。',
  tragedy_of_commons: '这片草场是公共的，每家多养几只羊自己就多挣一份，至于草场退化那是大家一起承担的。',
  illusion_of_control: '买彩票要自己选号，自己选的号码中奖率比机选高，意念是能起作用的。',
  disposition_effect: '我这只票涨了四成，先落袋为安，套牢的那只再拿拿，总能涨回来的。',
  endowment_effect: '这把吉他是我的，陪了我十年，别说三千，五千我都不卖。',
  anchoring_effect: '谈判时对方开价八千，我砍到六千五就签了，没去想这东西其实只值三千。',
  present_bias: '体检以后再说，今晚先痛快吃了，以后的事再说。',
  peak_end_rule: '全程都挺无聊的，就结尾特别惊艳，我觉得这趟旅行值了。',
  effort_justification: '我们熬了几个月做出来的方案，质量肯定没问题。',
  p_hacking: '测试了30个参数组合，有一组p值终于小于0.05，说明策略有效。',
  inverse_gamblers_fallacy: '他一上场就进球，肯定是个身经百战的老将。',
  significance_effect_size: 'p 小于 0.05，所以这个药有效，可以全面推广',
  selection_on_dependent_variable: '能活下来的公司都融过资，所以融资能救命',
  ad_hominem: '他是个骗子，所以他说的关于气候的数据全是假的。',
};

// ─── 良性样本（官方良性语料形状 + 典型 think 结论）──
const BENIGN = [
  '根据成本加成定价，这批货的出厂价是每件三十七块五，含原材料、人工和合理利润。',
  '专业评估报告给出的估值区间是四百八十万到五百二十万，与挂牌价基本一致。',
  '实验达到统计显著（p=0.03），效应量为 0.2 个标准差，属于小效应，需要更大样本确认。',
  '我们在二十个预设假设中做了 Bonferroni 校正，校正后仍有三个结果显著。',
  '心理学教科书指出，锚定效应是最稳健的认知偏误之一，Kahneman 和 Tversky 有经典实验。',
  '样本选择上我们只纳入了完成全程随访的患者，并用逆概率加权纠正了失访偏倚。',
  '结论：心虫引擎的辨别维度共 246 个，覆盖逻辑谬误、因果推理与统计素养等家族。',
  '建议下一步：补充可验证的数据来源，把无法验证的断言改为不确定表述。',
  'The comparable sales in the neighborhood averaged around 480k, and the formal valuation came in at 495k.',
  'We corrected for multiple comparisons across the 20 pre-registered hypotheses.',
  'Anchoring is one of the most robust findings in judgment and decision making research.',
  'The regression controls for age, income, and baseline health status.',
];

// 族键 → 盲注键（取自各模块 __internals() 真实暴露的探针键：r295-internals-probe 实测）
// 每族注入两条腿的 ZH+EN 键——腿被删则该族必须从命中中消失（dispatch 承重证明）
const INJECT_KEY = {
  budget_value_conflation: ['BUDGET_ZH', 'BUDGET_EN', 'WORTH_ZH', 'WORTH_EN'],
  average_marginal_conflation: ['AVG_COST_ZH', 'AVG_COST_EN', 'MARG_ZH', 'MARG_EN'],
  mental_accounting: ['SOURCE_ZH', 'SOURCE_EN', 'SPEND_ZH', 'SPEND_EN'],
  perverse_incentive: ['INCENTIVE_ZH', 'INCENTIVE_EN', 'GAMING_ZH', 'GAMING_EN'],
  winners_curse: ['WIN_ZH', 'WIN_EN', 'VALUE_ZH', 'VALUE_EN'],
  tragedy_of_commons: ['A_ZH', 'A_EN', 'B_ZH', 'B_EN'],
  illusion_of_control: ['A_ZH', 'A_EN', 'B_ZH', 'B_EN'],
  disposition_effect: ['WIN_STATE_ZH', 'WIN_STATE_EN', 'WIN_DISP_ZH', 'WIN_DISP_EN', 'LOSE_STATE_ZH', 'LOSE_STATE_EN', 'LOSE_DISP_ZH', 'LOSE_DISP_EN'],
  endowment_effect: ['OWN_ZH', 'OWN_EN', 'REFUSE_ZH', 'REFUSE_EN'],
  anchoring_effect: ['ANCHOR_ZH', 'ANCHOR_EN', 'DEAL_ZH', 'DEAL_EN'],
  present_bias: ['NOW_ZH', 'NOW_EN', 'LATER_ZH', 'LATER_EN'],
  peak_end_rule: ['PEAK_END_ZH', 'PEAK_END_EN', 'WHOLE_VERDICT_ZH', 'WHOLE_VERDICT_EN'],
  effort_justification: ['EFFORT_ZH', 'EFFORT_EN', 'QUALITY_ZH', 'QUALITY_EN'],
  p_hacking: ['SEARCH_ZH', 'SEARCH_EN', 'SIGNIF_ZH', 'SIGNIF_EN'],
  inverse_gamblers_fallacy: ['FIRST_ZH', 'FIRST_EN', 'OUTCOME_ZH', 'OUTCOME_EN', 'INFER_ZH', 'INFER_EN'],
  significance_effect_size: ['SIG_ZH', 'SIG_EN', 'IMPORTANCE_ZH', 'IMPORTANCE_EN'],
  selection_on_dependent_variable: ['SELECT_ZH', 'SELECT_EN', 'CAUSE_ZH', 'CAUSE_EN'],
  ad_hominem: ['ATTACK_ZH', 'ATTACK_EN', 'DISREGARD_ZH', 'DISREGARD_EN'],
};

console.log('=== A 插件元数据与族表 ===');
T('A1 插件导出完整（name/version/hooks/init/analyze/FAMILIES）', () => {
  assert.strictEqual(PLUGIN.name, 'econ-reasoning-check');
  assert.strictEqual(typeof PLUGIN.analyze, 'function');
  assert.ok(Array.isArray(PLUGIN.hooks) && PLUGIN.hooks.length === 1);
  assert.strictEqual(PLUGIN.hooks[0].event, 'postprocess.think');
  assert.strictEqual(typeof PLUGIN.init, 'function');
});
T('A2 族表 18 族：13 econ + 5 stats，key 唯一', () => {
  assert.strictEqual(FAMILIES.length, 18);
  const econ = FAMILIES.filter(f => f.group === 'econ');
  const stats = FAMILIES.filter(f => f.group === 'stats');
  assert.strictEqual(econ.length, 13);
  assert.strictEqual(stats.length, 5);
  const keys = FAMILIES.map(f => f.key);
  assert.strictEqual(new Set(keys).size, 18);
});
T('A3 每族都有模块路径 + 导出函数名 + 中英标签', () => {
  for (const f of FAMILIES) {
    assert.ok(/^\.\.\/\.\.\/[a-z-]+\.js$/.test(f.mod), `${f.key} mod 路径异常: ${f.mod}`);
    assert.ok(f.fn.length > 4, `${f.key} fn 异常`);
    assert.ok(f.zh && f.en, `${f.key} 缺标签`);
    assert.ok(/^r\d+$/.test(f.round), `${f.key} 起草轮次异常: ${f.round}`);
  }
});
T('A4 18 个模块文件全部存在且导出函数是函数', () => {
  for (const f of FAMILIES) {
    const p = path.join(ROOT, 'src/plugins/econ-reasoning-check', f.mod);
    assert.ok(fs.existsSync(p), `模块缺失: ${f.mod}`);
    const mod = require(p);
    assert.strictEqual(typeof mod[f.fn], 'function', `${f.mod} 无导出 ${f.fn}`);
  }
});

console.log('=== B 每族攻击命中 ===');
for (const f of FAMILIES) {
  T(`B ${f.key}（${f.group}）攻击句命中`, () => {
    const r = analyze(ATTACK[f.key]);
    assert.ok(r.families.some(x => x.key === f.key),
      `未命中；实际命中族: [${r.families.map(x => x.key).join(',')}]`);
    assert.ok(r.score > 0.5, `score ${r.score} 未过 0.5 阈值（消费者不打折）`);
  });
}

console.log('=== C 良性零误伤 ===');
T('C1 12 条良性语料零命中', () => {
  const hits = [];
  for (const b of BENIGN) {
    const r = analyze(b);
    if (r.totalHits > 0) hits.push(`${b.slice(0, 24)}… → ${r.families.map(x => x.key).join(',')}`);
  }
  assert.strictEqual(hits.length, 0, '误伤:\n' + hits.join('\n'));
});
T('C2 空/短文本守卫', () => {
  assert.strictEqual(analyze('').totalHits, 0);
  assert.strictEqual(analyze('短').totalHits, 0);
  assert.strictEqual(analyze(null).totalHits, 0);
  assert.strictEqual(analyze(undefined).score, 0);
});

console.log('=== D action=<family key> 单族过滤 ===');
T('D1 only 过滤只留目标族', () => {
  const r = analyze(ATTACK.anchoring_effect, { only: 'anchoring_effect' });
  assert.strictEqual(r.familyCount, 1);
  assert.strictEqual(r.families[0].key, 'anchoring_effect');
});
T('D2 only 非目标族 → 零命中', () => {
  const r = analyze(ATTACK.anchoring_effect, { only: 'ad_hominem' });
  assert.strictEqual(r.familyCount, 0);
});

console.log('=== E 负例注入-删条（每族一条，删则该族必须变红）===');
for (const f of FAMILIES) {
  T(`E ${f.key} blind inject → 该族从命中中消失`, () => {
    const keys = INJECT_KEY[f.key];
    const inject = {};
    for (const k of keys) inject[k] = /(?!)/i; // 永假正则替换指定常量（与各模块 inject 契约一致）
    const before = analyze(ATTACK[f.key]);
    const after = analyze(ATTACK[f.key], { inject });
    assert.ok(before.families.some(x => x.key === f.key), '注入前该族应命中（前提）');
    assert.ok(!after.families.some(x => x.key === f.key),
      '注入后该族仍命中——dispatch 不承重或注入键名不对');
  });
}

console.log('=== F 引擎 think 路径真 dispatch ===');
(async () => {
  // 同步部分已完成计数，这里追加 async 断言
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const { runThinkPipeline } = require(path.join(ROOT, 'src/core/think-pipeline.js'));
  const hf = new HeartFlow({});
  hf.start();

  const attack = ATTACK.anchoring_effect;
  const result = { output: { conclusion: attack, warnings: [] }, confidence: 0.8, type: 'test' };
  await runThinkPipeline(result, '帮我看下这个谈判过程有没有问题', hf);
  const econ = result._discrimination && result._discrimination.econReasoning;
  T('F1 插件经 PluginLoader 加载（hf._econReasoningAnalyzer）', () => {
    assert.strictEqual(typeof hf._econReasoningAnalyzer, 'function');
  });
  T('F2 postprocess.think hook 写 _discrimination.econReasoning', () => {
    assert.ok(econ && econ.totalHits > 0, JSON.stringify(result._discrimination));
    assert.ok(econ.families.some(x => x.key === 'anchoring_effect'));
  });
  T('F3 消费者（hook fire 之后）打 _confidencePenalty + warning', () => {
    assert.ok(result._confidencePenalty > 0, `penalty=${result._confidencePenalty}`);
    assert.ok((result.output.warnings || []).some(w => w.includes('经济/统计推理谬误') && w.includes('锚定效应')),
      JSON.stringify(result.output.warnings));
  });

  const clean = { output: { conclusion: BENIGN[0], warnings: [] }, confidence: 0.8, type: 'test' };
  await runThinkPipeline(clean, '这个定价合理吗', hf);
  T('F4 良性结论零触发（无 penalty 无 warning）', () => {
    assert.ok(!(clean._discrimination && clean._discrimination.econReasoning), '良性结论不应有 econReasoning');
    assert.ok(!clean._confidencePenalty, `良性 penalty=${clean._confidencePenalty}`);
    assert.ok(!(clean.output.warnings || []).some(w => w.includes('经济/统计推理谬误')));
  });

  // ─── G MCP 接线 ───
  console.log('=== G MCP 接线 ===');
  const reg = fs.readFileSync(path.join(ROOT, 'src/mcp/tools-registry.js'), 'utf8');
  T('G1 tools-registry 定义两个新工具', () => {
    assert.ok(/name:\s*'heartflow_econ_fallacy_check'/.test(reg));
    assert.ok(/name:\s*'heartflow_stats_literacy_check'/.test(reg));
  });
  const srv = fs.readFileSync(path.join(ROOT, 'src/mcp-server.js'), 'utf8');
  T('G2 HANDLERS 映射两个新工具', () => {
    assert.ok(/heartflow_econ_fallacy_check:\s*\(args\)\s*=>/.test(srv));
    assert.ok(/heartflow_stats_literacy_check:\s*\(args\)\s*=>/.test(srv));
  });
  T('G3 共用 handler 函数存在（引擎实例优先 + 回退 require 插件）', () => {
    assert.ok(/function handleEconReasoningCheck\(/.test(srv));
    assert.ok(/function _econReasoningAnalyzer\(/.test(srv));
  });

  // 真实 HTTP JSON-RPC e2e（同 mcp-auth-e2e-real.test.js 范式）
  // 端口段 21500-21899：与 mcp-auth-e2e-real 的 18500-18999 零重叠
  // （r295 池化首跑 3 条红项定位：端口段重叠 → 双方 spawn 同端口互撞，
  // 对方 server 先绑定则我方 initialize 通、tools/list 全 401）
  const { spawn } = require('child_process');
  const http = require('http');
  const PORT = 21500 + Math.floor(Math.random() * 400);
  const TOKEN = 'r295-e2e-' + Math.random().toString(36).slice(2);
  const rpc = (method, params, headers) => new Promise((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });
    const req = http.request({ host: '127.0.0.1', port: PORT, path: '/mcp', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), ...headers } }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.setTimeout(20000, () => req.destroy(new Error('rpc timeout 20s')));
    req.on('error', reject); req.write(body); req.end();
  });
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  const env = { ...process.env, MCP_HEARTFLOW_KEY: TOKEN, HF_KEEP_STDOUT_LOGS: '1' };
  delete env.NODE_ENV;
  const child = spawn(process.execPath, [path.join(ROOT, 'src/mcp-server.js'), '--port', String(PORT)], {
    cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let ready = false;
  // 就绪等待放宽到 60s（池化负载下 server 启动可能 >20s）
  for (let i = 0; i < 120; i++) {
    await sleep(500);
    try {
      const r = await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 't', version: '1' } }, {});
      if (r.status === 200 || r.status === 401) { ready = true; break; }
    } catch (_) { /* 未起 */ }
    if (child.exitCode !== null) break; // 端口被抢/启动失败：子进程已退出
  }
  if (ready) {
    const AUTH = { Authorization: `Bearer ${TOKEN}` };
    const listRes = await rpc('tools/list', {}, AUTH);
    let names = [];
    try { names = (JSON.parse(listRes.body).result.tools || []).map(t => t.name); } catch (_) {}
    T('G4 tools/list 含两个新工具（真实 server）', () => {
      assert.ok(names.includes('heartflow_econ_fallacy_check'), 'econ 工具不在 tools/list');
      assert.ok(names.includes('heartflow_stats_literacy_check'), 'stats 工具不在 tools/list');
    });
    const call1 = await rpc('tools/call', { name: 'heartflow_econ_fallacy_check', arguments: { text: ATTACK.anchoring_effect } }, AUTH);
    T('G5 econ_fallacy_check tools/call 真返回命中', () => {
      assert.strictEqual(call1.status, 200, `HTTP ${call1.status}`);
      const j = JSON.parse(call1.body);
      const text = JSON.stringify(j);
      assert.ok(text.includes('anchoring_effect'), `返回无 anchoring_effect: ${text.slice(0, 300)}`);
    });
    const call2 = await rpc('tools/call', { name: 'heartflow_stats_literacy_check', arguments: { text: ATTACK.p_hacking, action: 'p_hacking' } }, AUTH);
    T('G6 stats_literacy_check tools/call 单族 action 真返回命中', () => {
      assert.strictEqual(call2.status, 200, `HTTP ${call2.status}`);
      const j = JSON.parse(call2.body);
      assert.ok(JSON.stringify(j).includes('p_hacking'), `返回无 p_hacking: ${call2.body.slice(0, 300)}`);
    });
    const call3 = await rpc('tools/call', { name: 'heartflow_econ_fallacy_check', arguments: { text: BENIGN[0] } }, AUTH);
    T('G7 良性文本 tools/call 零命中', () => {
      const j = JSON.parse(call3.body);
      const s = JSON.stringify(j);
      assert.ok(!s.includes('"totalHits":1'), `良性误报: ${s.slice(0, 300)}`);
    });
  } else {
    T('G4-G7 真实 server 启动（跳过则记失败）', () => { throw new Error('MCP server 未就绪'); });
  }
  child.kill('SIGKILL');

  // ─── H 不回归 ───
  console.log('=== H 不回归 ===');
  T('H1 维度计数仍 246（本轮零 src/index.js 改动）', () => {
    const { discriminate } = require(path.join(ROOT, 'src/index.js'));
    const d = discriminate('neutral baseline text');
    const n = Object.keys(d.dimensions || {}).length;
    assert.strictEqual(n, 246, `维度数 ${n} ≠ 246`);
    // 本轮 18 族键不得出现在 gate 维度表（gate 层零接线，交接项给 1 号）
    const econKeys = Object.keys(d.dimensions || {}).filter(k => /anchoring|endowment|disposition|mental_accounting|perverse|winners_curse|tragedy|illusion_of_control|present_bias|peak_end|effort_justification|budget_value|average_marginal|p_hacking|inverse_gamblers|significance_effect|selection_on_dependent|ad_hominem/.test(k));
    assert.strictEqual(econKeys.length, 0, `gate 维度表出现本轮族键: ${econKeys.join(',')}`);
  });
  T('H2 analyze 对同一输入确定性（无随机/无状态泄漏）', () => {
    const a = analyze(ATTACK.mental_accounting);
    const b = analyze(ATTACK.mental_accounting);
    assert.deepStrictEqual(a.families.map(f => f.key), b.families.map(f => f.key));
    assert.strictEqual(a.score, b.score);
  });

  console.log(`\n结果: ${passed} 通过, ${failed} 失败`);
  process.exit(failed > 0 ? 1 : 0);
})().catch(e => { console.error('E2E 段崩溃:', e); process.exit(1); });
