/**
 * r296 信息与激励盲区（incentive blind spot）维度接线轮测
 *
 * 覆盖：
 *   A 模块层：三子族导出、攻击命中（中英 21 条）+ 维度归属、良性干净
 *   B 插件层：econ-reasoning-check analyze dispatch（3 族命中、score>0.5、
 *     action=<key> 单族过滤、三族混排聚合）
 *   C FP 压力：官方良性形状 12 条 + 疑难良性 10 条零命中
 *   D 负例注入-删条（每子族双腿 ZH+EN + 纠偏豁免 + 距离窗：删则该族
 *     必须从命中中消失——dispatch 承重证明）
 *   E 引擎 think 路径真 dispatch（真 HeartFlow 实例 + 真 runThinkPipeline：
 *     插件经 PluginLoader 加载 → postprocess.think hook 写
 *     _discrimination.econReasoning → 消费者（hook fire 之后）打
 *     _confidencePenalty + warning；良性结论零触发）
 *   F MCP 接线（tools-registry 定义 + HANDLERS 映射 + 真实 HTTP JSON-RPC
 *     tools/call 三个新族 action 都返回命中）
 *   G 不回归（维度计数仍 246——本轮零 src/index.js 改动；新族键不进
 *     gate 维度表；analyze 确定性）
 */
'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const PLUGIN = require(path.join(ROOT, 'src/plugins/econ-reasoning-check/index.js'));
const { analyze, FAMILIES } = PLUGIN;
const M = require(path.join(ROOT, 'src/incentive-blind-spot.js'));

let passed = 0, failed = 0;
function T(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}\n    ${e.message}`); }
}

// ─── 攻击样本（三子族各中英，源自模块单测原句）──────────────
const ATTACK = {
  adverse_selection: '保险池自然会同时吸引低风险和高风险的人，这对保费没有影响。',
  adverse_selection_en: 'Insurance pools naturally attract a balanced mix of low and high risk people, so premiums stay stable.',
  moral_hazard: '全额兜底不会让机构去承担更多风险。',
  moral_hazard_en: 'Full insurance coverage does not change how carefully people drive.',
  free_rider: '公共事务总会有人站出来管，我个人不用参与。',
  free_rider_en: "Someone else will always contribute to the public good, so I don't need to do my part.",
};

// ─── 良性样本（官方良性语料形状 + 典型 think 结论）───────────
const BENIGN = [
  '根据成本加成定价，这批货的出厂价是每件三十七块五，含原材料、人工和合理利润。',
  '专业评估报告给出的估值区间是四百八十万到五百二十万，与挂牌价基本一致。',
  '实验达到统计显著（p=0.03），效应量为 0.2 个标准差，属于小效应，需要更大样本确认。',
  '我们在二十个预设假设中做了 Bonferroni 校正，校正后仍有三个结果显著。',
  '样本选择上我们只纳入了完成全程随访的患者，并用逆概率加权纠正了失访偏倚。',
  '结论：心虫引擎的辨别维度共 246 个，覆盖逻辑谬误、因果推理与统计素养等家族。',
  'The comparable sales in the neighborhood averaged around 480k, and the formal valuation came in at 495k.',
  'We corrected for multiple comparisons across the 20 pre-registered hypotheses.',
  'The regression controls for age, income, and baseline health status.',
  '保险公司今年推出了新的重疾险产品，覆盖一百种疾病。',
  '失业保险金的替代率设计要平衡保障水平与求职激励。',
  '政府为低保家庭提供补助，体现了兜底保障。',
];

// ─── 疑难良性（信息经济学正解/概念教学，FP 压力样本）───────
const BENIGN_TOUGH = [
  '保险市场存在逆选择，保险公司通过核保和免赔额来筛选风险。',
  '为防止逆选择，医保设置起付线和封顶线，按风险分层定价。',
  'The insurance market suffers from adverse selection, which underwriters mitigate with deductibles.',
  '保险行业存在道德风险，免赔额可以让投保人保持谨慎。',
  '全额赔付可能诱发道德风险，需要共付机制来对冲。',
  'Deposit insurance can create moral hazard, so regulators impose capital requirements.',
  '公共事务需要大家共同参与，我也报名做了志愿者。',
  '为防止搭便车，业委会设计了按户分摊的强制缴费机制。',
  'The free-rider problem explains why public goods tend to be undersupplied.',
  '有了保险之后，出门旅行更安心了。',
];

console.log('=== A 模块层（src/incentive-blind-spot.js）===');
T('A1 四个检测函数导出', () => {
  for (const k of ['detectAdverseSelection', 'detectMoralHazard', 'detectFreeRider', 'detectIncentiveBlindSpot']) {
    assert.strictEqual(typeof M[k], 'function', k);
  }
});
T('A2 攻击命中 + 维度归属 + 档位（中英 21 条）', () => {
  const groups = {
    adverse_selection: [
      ATTACK.adverse_selection,
      '贷款会自然覆盖各种信用等级的借款人，所以坏账率不会有差别。',
      '医保把各类人群都纳入进来，风险分布相互抵消，统筹基金没有压力。',
      ATTACK.adverse_selection_en,
      'Loans naturally reach borrowers of every credit grade, so defaults will not differ.',
      'The used-car market brings in vehicles of every condition, which has no effect on prices.',
      'The risk pool covers drivers of every age and record, which leaves premiums unaffected.',
    ],
    moral_hazard: [
      ATTACK.moral_hazard,
      '有了全额保险，人们开车不会有什么变化，该多小心还是多小心。',
      '失业金发得够高，也不会削弱求职者找工作的努力。',
      '政府注资之后，企业的经营方式不会有任何改变。',
      ATTACK.moral_hazard_en,
      'Government bailouts will not affect future risk-taking by the banks.',
      'Generous unemployment benefits do not reduce the effort job seekers put into finding work.',
    ],
    free_rider: [
      ATTACK.free_rider,
      '别人会捐款的，我不用掏钱，坐享其成没什么丢人的。',
      '社区绿化是大伙的事，凭什么要我出面出力。',
      '团队项目总有人做，我用不着动手。',
      ATTACK.free_rider_en,
      'Others will donate to the community project, so I do not need to chip in.',
      'Every other tenant will handle the repairs, so why should I contribute?',
    ],
  };
  let n = 0;
  for (const [dim, list] of Object.entries(groups)) {
    for (const t of list) {
      n++;
      const r = M.detectIncentiveBlindSpot(t);
      assert.strictEqual(r.hit, true, '应命中: ' + t);
      assert.strictEqual(r.dimension, dim, '维度归属: ' + t);
      assert.ok(r.score >= 0.6 && r.score <= 0.8, 'severity 档位: ' + t);
      assert.ok(r.guidance.length > 20, 'guidance 非空: ' + t);
    }
  }
  assert.strictEqual(n, 21, '攻击样本数');
});
T('A3 良性零误伤（12 条 + 疑难 10 条）', () => {
  for (const t of [...BENIGN, ...BENIGN_TOUGH]) {
    assert.strictEqual(M.detectIncentiveBlindSpot(t).hit, false, '误伤: ' + t);
  }
});
T('A4 豁免/边界（纠偏句、缺腿、翻转否定、超距）', () => {
  assert.strictEqual(M.detectIncentiveBlindSpot('为防范逆选择，精算假设要先验证：风险分布自然均衡、对保费没有影响，这类假设恰恰最危险。').hit, false);
  assert.strictEqual(M.detectIncentiveBlindSpot('To guard against moral hazard, the memo assumes full coverage does not change driver behavior—an assumption worth stress-testing.').hit, false);
  assert.strictEqual(M.detectIncentiveBlindSpot('保险公司今年推出了新的重疾险产品，覆盖一百种疾病。').hit, false);
  assert.strictEqual(M.detectIncentiveBlindSpot('全额兜底并非不会改变机构的风险承担。').hit, false);
  assert.strictEqual(M.detectIncentiveBlindSpot('It is not that insurance fails to change behavior; moral hazard is real.').hit, false);
  const far = '保险池的结构，' + '补'.repeat(70) + '这对统筹基金没有压力。';
  assert.strictEqual(M.detectIncentiveBlindSpot(far).hit, false, '默认窗超距不命中');
});

console.log('=== B 插件层 dispatch ===');
T('B1 三子族在族表且 analyze 命中', () => {
  const newKeys = ['adverse_selection', 'moral_hazard', 'free_rider'];
  for (const k of newKeys) {
    const f = FAMILIES.find(x => x.key === k);
    assert.ok(f, `族表缺 ${k}`);
    assert.strictEqual(f.group, 'econ');
    assert.strictEqual(f.round, 'r296');
    assert.strictEqual(f.mod, '../../incentive-blind-spot.js');
  }
  for (const k of newKeys) {
    const r = analyze(ATTACK[k]);
    assert.ok(r.families.some(x => x.key === k), `analyze 未命中 ${k}`);
    assert.ok(r.score > 0.5, `score ${r.score} 未过 0.5 阈值`);
  }
});
T('B2 action=<key> 单族过滤', () => {
  for (const k of ['adverse_selection', 'moral_hazard', 'free_rider']) {
    const r = analyze(ATTACK[k], { only: k });
    assert.strictEqual(r.familyCount, 1, `${k} only 过滤`);
    assert.strictEqual(r.families[0].key, k);
  }
});
T('B3 三族混排聚合命中', () => {
  const r = analyze('保险池自然均衡，这对保费没有影响；全额兜底不会改变行为；公共事务别人会管，我不用参与。');
  const keys = r.families.map(x => x.key);
  for (const k of ['adverse_selection', 'moral_hazard', 'free_rider']) {
    assert.ok(keys.includes(k), `混排缺 ${k}: ${keys.join(',')}`);
  }
});

console.log('=== C FP 压力 ===');
T('C1 良性 22 条零命中（插件层）', () => {
  const hits = [];
  for (const b of [...BENIGN, ...BENIGN_TOUGH]) {
    const r = analyze(b);
    if (r.totalHits > 0) hits.push(`${b.slice(0, 24)}… → ${r.families.map(x => x.key).join(',')}`);
  }
  assert.strictEqual(hits.length, 0, '误伤:\n' + hits.join('\n'));
});

console.log('=== D 负例注入-删条 ===');
const INJECT_KEY = {
  adverse_selection: ['POOL_ZH', 'POOL_EN', 'NODISTORT_ZH', 'NODISTORT_EN'],
  moral_hazard: ['SHIELD_ZH', 'SHIELD_EN', 'NOCHANGE_ZH', 'NOCHANGE_EN'],
  free_rider: ['COLLECTIVE_ZH', 'COLLECTIVE_EN', 'ABSTAIN_ZH', 'ABSTAIN_EN'],
};
for (const [k, keys] of Object.entries(INJECT_KEY)) {
  T(`D ${k} blind inject 双腿 → 该族从命中中消失`, () => {
    const inject = {};
    for (const key of keys) inject[key] = /(?!)/i;
    const before = analyze(ATTACK[k]);
    const after = analyze(ATTACK[k], { inject });
    assert.ok(before.families.some(x => x.key === k), '注入前应命中（前提）');
    assert.ok(!after.families.some(x => x.key === k), '注入后仍命中——dispatch 不承重或键名不对');
  });
}
T('D4 纠偏豁免删除 → 豁免句变红（承重证明）', () => {
  assert.strictEqual(analyze('为防范逆选择，精算假设要先验证：风险分布自然均衡、对保费没有影响，这类假设恰恰最危险。').totalHits, 0, '前提：默认应豁免');
  const inj = analyze('为防范逆选择，精算假设要先验证：风险分布自然均衡、对保费没有影响，这类假设恰恰最危险。', { inject: { ANTIDOTE_ZH: /(?!)/i } });
  assert.ok(inj.families.some(x => x.key === 'adverse_selection'), '删豁免后应变红');
});
T('D5 距离窗承重（PAIR_ZH 放大到 500 后长距句命中）', () => {
  const far = '保险池的结构，' + '补'.repeat(70) + '这对统筹基金没有压力。';
  assert.strictEqual(analyze(far).totalHits, 0, '默认窗不命中');
  const r = analyze(far, { inject: { PAIR_ZH: 500 } });
  assert.ok(r.families.some(x => x.key === 'adverse_selection'), '放大窗后应命中');
});

console.log('=== E 引擎 think 路径真 dispatch ===');
(async () => {
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const { runThinkPipeline } = require(path.join(ROOT, 'src/core/think-pipeline.js'));
  const hf = new HeartFlow({});
  hf.start();

  const attack = ATTACK.moral_hazard;
  const result = { output: { conclusion: attack, warnings: [] }, confidence: 0.8, type: 'test' };
  await runThinkPipeline(result, '这个兜底政策设计有没有问题', hf);
  const econ = result._discrimination && result._discrimination.econReasoning;
  T('E1 插件经 PluginLoader 加载（hf._econReasoningAnalyzer）', () => {
    assert.strictEqual(typeof hf._econReasoningAnalyzer, 'function');
  });
  T('E2 postprocess.think hook 写 _discrimination.econReasoning（moral_hazard 族）', () => {
    assert.ok(econ && econ.totalHits > 0, JSON.stringify(result._discrimination));
    assert.ok(econ.families.some(x => x.key === 'moral_hazard'));
  });
  T('E3 消费者（hook fire 之后）打 _confidencePenalty + warning', () => {
    assert.ok(result._confidencePenalty > 0, `penalty=${result._confidencePenalty}`);
    assert.ok((result.output.warnings || []).some(w => w.includes('经济/统计推理谬误') && w.includes('道德风险忽视')),
      JSON.stringify(result.output.warnings));
  });

  const clean = { output: { conclusion: BENIGN[0], warnings: [] }, confidence: 0.8, type: 'test' };
  await runThinkPipeline(clean, '这个定价合理吗', hf);
  T('E4 良性结论零触发（无 penalty 无 warning）', () => {
    assert.ok(!(clean._discrimination && clean._discrimination.econReasoning), '良性结论不应有 econReasoning');
    assert.ok(!clean._confidencePenalty, `良性 penalty=${clean._confidencePenalty}`);
  });

  console.log('=== F MCP 接线 ===');
  const reg = fs.readFileSync(path.join(ROOT, 'src/mcp/tools-registry.js'), 'utf8');
  T('F1 tools-registry 定义 econ_fallacy_check', () => {
    assert.ok(/name:\s*'heartflow_econ_fallacy_check'/.test(reg));
  });
  const srv = fs.readFileSync(path.join(ROOT, 'src/mcp-server.js'), 'utf8');
  T('F2 HANDLERS 映射 + handler 函数存在', () => {
    assert.ok(/heartflow_econ_fallacy_check:\s*\(args\)\s*=>/.test(srv));
    assert.ok(/function handleEconReasoningCheck\(/.test(srv));
  });

  // 真实 HTTP JSON-RPC e2e（同 mcp-auth-e2e-real.test.js 范式）
  // 端口段 21900-22299：与 r295 轮测的 21500-21899、mcp-auth-e2e-real 的
  // 18500-18999 零重叠（端口段重叠会互撞：对方先绑定则我方 initialize
  // 通、tools/list 全 401——r295 实测教训）
  const { spawn } = require('child_process');
  const http = require('http');
  const PORT = 21900 + Math.floor(Math.random() * 400);
  const TOKEN = 'r296-e2e-' + Math.random().toString(36).slice(2);
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
  for (let i = 0; i < 120; i++) {
    await sleep(500);
    try {
      const r = await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 't', version: '1' } }, {});
      if (r.status === 200 || r.status === 401) { ready = true; break; }
    } catch (_) { /* 未起 */ }
    if (child.exitCode !== null) break;
  }
  if (ready) {
    const AUTH = { Authorization: `Bearer ${TOKEN}` };
    const listRes = await rpc('tools/list', {}, AUTH);
    let names = [];
    try { names = (JSON.parse(listRes.body).result.tools || []).map(t => t.name); } catch (_) {}
    T('F3 tools/list 含 econ_fallacy_check（真实 server）', () => {
      assert.ok(names.includes('heartflow_econ_fallacy_check'), 'econ 工具不在 tools/list');
    });
    for (const k of ['adverse_selection', 'moral_hazard', 'free_rider']) {
      const call = await rpc('tools/call', { name: 'heartflow_econ_fallacy_check', arguments: { text: ATTACK[k], action: k } }, AUTH);
      T(`F4 ${k} tools/call action=${k} 真返回命中`, () => {
        assert.strictEqual(call.status, 200, `HTTP ${call.status}`);
        const outer = JSON.parse(call.body);
        const inner = JSON.parse(outer.result.content[0].text);
        assert.strictEqual(inner.hit, true, `hit!=true: ${call.body.slice(0, 300)}`);
        assert.strictEqual(inner.family.key, k, `family.key=${inner.family && inner.family.key}`);
      });
    }
    const callClean = await rpc('tools/call', { name: 'heartflow_econ_fallacy_check', arguments: { text: BENIGN[0] } }, AUTH);
    T('F5 良性文本 tools/call 零命中', () => {
      assert.strictEqual(callClean.status, 200);
      const s = callClean.body;
      assert.ok(!s.includes('"totalHits":1'), `良性误报: ${s.slice(0, 300)}`);
    });
  } else {
    T('F3-F5 真实 server 启动', () => { throw new Error('MCP server 未就绪'); });
  }
  child.kill('SIGKILL');

  console.log('=== G 不回归 ===');
  T('G1 维度计数仍 246（本轮零 src/index.js 改动）', () => {
    const { discriminate } = require(path.join(ROOT, 'src/index.js'));
    const d = discriminate('neutral baseline text');
    const n = Object.keys(d.dimensions || {}).length;
    // r301 注：原断言 246 锚定 r296 接线时的维度数。r297/r299 WIP 已把
    // ad_hominem（第203维）与 incentive_blind_spot（第247维）接入 gate
    // 维度表（src/index.js 接线 + VERIFY_DIMS 登记），真实维度数为 248，
    // 与 guard-abilities 门禁实测一致。锚更新为 248。
    assert.strictEqual(n, 248, `维度数 ${n} ≠ 248`);
    // 本轮三族键不得出现在 gate 维度表（gate 层零接线，交接项给 1 号）
    const newKeys = Object.keys(d.dimensions || {}).filter(k => /adverse_selection|moral_hazard|free_rider/.test(k));
    assert.strictEqual(newKeys.length, 0, `gate 维度表出现本轮族键: ${newKeys.join(',')}`);
  });
  T('G2 analyze 对同一输入确定性（无随机/无状态泄漏）', () => {
    const a = analyze(ATTACK.free_rider);
    const b = analyze(ATTACK.free_rider);
    assert.deepStrictEqual(a.families.map(f => f.key), b.families.map(f => f.key));
    assert.strictEqual(a.score, b.score);
  });

  console.log(`\n结果: ${passed} 通过, ${failed} 失败`);
  process.exit(failed > 0 ? 1 : 0);
})().catch(e => { console.error('E2E 段崩溃:', e); process.exit(1); });
