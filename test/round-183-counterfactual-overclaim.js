/**
 * test/round-183-counterfactual-overclaim.js — 第 181 维度
 * counterfactual_overclaim（反事实独断：把另一条未走路径的结果当作确定
 * 可知——「如果当初X，现在一定/必然/势必Y」）负例注入测试 + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量（15 个可注入常量）注入 [] 置空后，依赖该常量的攻击
 *      必须停止命中；依赖某豁免的「陷阱样本」（攻击结构俱在但被正确豁免）
 *      在抹掉该豁免后必须转为命中。
 *
 * r183 实现设计（已固化进测试与源码注释）：
 *   · 腿①锚点**刻意窄收**：只收 当初/当时/那时/那年/当年/一开始/最开始/
 *     早些时候/早点/最初/早先，**不收「之前/先前/此前」**——「如果之前的
 *     数据有误，现在一定要回头修正」的「一定」是义务情态而非确定性断言，
 *     宽锚会把义务句扫进谬误族（基线误拦纪律）。
 *   · 腿② CERT **刻意不收「早就/就不会/would have」**：那是
 *     conditional_proposition（第160维）否定推断形的射程；本族收确定性
 *     副词形，两族可同句共现但判定结构不同（交集句 gate 取并集）。
 *   · HEDGE_ZH **不收「并非」**：「结果并非一定更好」由 META 承重豁免，
 *     收了会让 META 注入样本假绿（两豁免表交叠是注入承重的隐形杀手，
 *     r182 教训 4 同款）。
 *   · NEGSEAL_ZH 动词表**不收「断定」**：「无法事先断定」归 NEGFLIP 承重，
 *     收了会让 NEGFLIP 注入样本假绿。
 *
 * 161 轮教训：负例全绿不等于不漏——裸名词/带修饰/倒装/长句变体与边缘良性
 * 另在 variant-matrix 段用真实 gate() 复量。
 */
const assert = require('assert');
const { checkCounterfactualOverclaim, __internals } = require('../src/counterfactual-overclaim.js');
const gateMod = require('../src/gate.js');
const gate = gateMod.gate;

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ─── 一、攻击样本（无注入必须命中）────────────────────────────────

const ATTACK = [
  // CN-A 连接词先行形
  '如果当初投入研发，现在我们一定已经领先市场三年了。',
  '要是当时听我的做了对冲，公司肯定不会陷入今天的困境。',
  '假如那年抓住了那波行情，他如今必然身家过亿。',
  '倘若当初选择另一条技术路线，我们现在势必已经主导整个行业。',
  '要不是当初有人提醒，我们现在一定已经出事了。',
  '如果当初没有那次误判，公司必定已经上市，我们势必早已财富自由。',
  // CN-B 锚先行形
  '当初要是果断止损，这笔投资毫无疑问现在已经回本了。',
  '那时如果不停电，生产一定不会中断，订单势必按时交付。',
  '那年若听了劝，他现在肯定已经站稳脚跟了。',
  // EN
  'If we had invested in that startup, we would certainly be market leaders today.',
  'Had we taken the other path, the project would definitely have succeeded by now.',
  'If only we had acted sooner, we would certainly have avoided the crisis.',
  'Had we known about the defect, the product would surely have shipped on time.',
];

// ─── 二、良性样本（无注入必须放行）────────────────────────────────

const BENIGN = [
  '如果当初投入研发，现在也许已经占据一些市场，但谁也说不准。',          // 对冲
  '要是当时听了建议，结果可能会不同，没有人能断言结果如何。',            // 对冲
  '如果当初走另一条路，今天会怎样，谁也无法预料。',                      // 对冲（无确定性断言）
  '不要以为如果当初买了那套房，现在就一定过得更好。',                    // 拒绝推断
  '反事实推理的局限性在于，复杂系统中如果当初做了另一选择，结果也未必更好。', // 概念转述+对冲
  '如果当初投入研发，现在我们一定已经领先市场，但这不足以证明当初的决策错误。', // 结论侧否定
  '如果明天下雨，运动会就取消。',                                        // 将来时条件句（无过去锚）
  '如果明天发布新版本，用户量一定会涨。',                                // 将来时条件句
  '如果当初投入研发，现在一定已经领先市场三年了吗？',                    // 疑问句
  '当初的决策基于当时可获得的信息，事后假设另一种选择必然更好是不恰当的。', // 拒绝推断（不恰当）
  '那年如果没有这场及时雨，收成可能大幅下降，这类假设没有事实支撑。',    // 对冲
  'If we had invested back then, we might be in a different position, though no one can say for certain.',
  'It would be unjustified to claim that if we had invested, we would certainly be leaders today.',
  'Counterfactual analysis warns that if we had invested, the outcome would certainly have diverged.',
  'If we had invested back then, we would certainly be leaders today, but this alone does not prove the original decision was wrong.',
];

// ─── 三、常量负例注入（每个常量必须承重）──────────────────────────
// 每项：{ key, attack: 注入后必须停止命中的样本, exempt: 豁免陷阱（注入后必须转为命中） }

const INJECTIONS = [
  { key: 'CF_CN_A_RE', attack: '如果当初投入研发，现在我们一定已经领先市场三年了。' },
  { key: 'CF_CN_B_RE', attack: '当初要是果断止损，这笔投资毫无疑问现在已经回本了。' },
  { key: 'CF_EN_A_RE', attack: 'If we had invested in that startup, we would certainly be market leaders today.' },
  { key: 'CF_EN_B_RE', attack: 'Had we taken the other path, the project would definitely have succeeded by now.' },
  { key: 'CF_EN_C_RE', attack: 'If only we had acted sooner, we would certainly have avoided the crisis.' },
  { key: 'CERT_ZH_RE', attack: '要是当时听我的做了对冲，公司肯定不会陷入今天的困境。' },
  { key: 'CERT_EN_RE', attack: 'If we had invested in that startup, we would certainly be market leaders today.' },
  // 豁免陷阱：攻击结构俱在，仅靠该豁免放行；抹掉豁免必须转为命中
  { key: 'HEDGE_ZH_RE', exempt: '复盘时他说，如果当初投入研发，现在我们一定已经领先市场三年。当然，这只是推测，也许并非如此。' },
  { key: 'HEDGE_EN_RE', exempt: 'If we had invested back then, we would certainly be in a different position — though no one can say for certain.' },
  { key: 'NEGFLIP_ZH_RE', exempt: '不要以为如果当初买了那套房，现在就一定过得更好——两条路径的结果都无法事先断定。' },
  { key: 'NEGFLIP_EN_RE', exempt: 'It would be unjustified to claim that if we had invested, we would certainly be leaders today.' },
  { key: 'META_ZH_RE', exempt: '反事实推理的局限在于：如果当初做了另一选择，结果并非一定更好。' },
  { key: 'META_EN_RE', exempt: 'Counterfactual analysis warns that if we had invested, the outcome would certainly have diverged.' },
  { key: 'NEGSEAL_ZH_RE', exempt: '如果当初投入研发，现在我们一定已经领先市场，但这不足以证明当初的决策错误。' },
  { key: 'NEGSEAL_EN_RE', exempt: 'If we had invested back then, we would certainly be leaders today, but this alone does not prove the original decision was wrong.' },
];

// ─── 四、gate 层变体矩阵（同族 ≥5 攻击 + ≥5 良性，真实 gate()）─────

const VARIANTS = [
  '如果当初投入研发，现在我们一定已经领先市场三年了。',                  // 裸名词短句
  '倘若当初选择了另一条技术路线，我们现在势必主导整个行业。',              // 带修饰
  '当初若听了劝，他现在肯定已经还清债务、站稳脚跟了。',                    // 锚先行+倒装语感
  '要不是那年冬天下了那场大雪，运输一定不会中断，我们势必如期交付。',      // 长句双 CERT
  'If we had invested in that startup, we would certainly be market leaders today.', // EN-A
  'Had we taken the other path, the project would definitely have succeeded by now.', // EN-B 倒装
];
const VARIANTS_BENIGN = [
  '如果当初投入研发，现在也许已经占据一些市场，但谁也说不准。',
  '要是当时听了建议，结果可能会不同，没有人能断言结果如何。',
  '反事实推理的局限性在于，复杂系统中如果当初做了另一选择，结果也未必更好。',
  'If we had invested back then, we might be in a different position, though no one can say for certain.',
  '如果明天下雨，运动会就取消。',
  '如果当初走另一条路，今天会怎样，谁也无法预料。',
];

(async () => {
  console.log('\n[r183 counterfactual_overclaim 攻击/良性]');
  for (const s of ATTACK) {
    t('攻击命中: ' + s.slice(0, 18), () => {
      const r = checkCounterfactualOverclaim(s);
      assert.ok(r.hit, '应命中: ' + s.slice(0, 30));
      assert.ok(r.count >= 1 && r.score >= 70, 'count/score 异常: ' + JSON.stringify({ c: r.count, s: r.score }));
    });
  }
  for (const s of BENIGN) {
    t('良性放行: ' + s.slice(0, 18), () => {
      const r = checkCounterfactualOverclaim(s);
      assert.ok(!r.hit, '应放行: ' + s.slice(0, 30) + ' → ' + r.details);
    });
  }

  console.log('\n[r183 常量负例注入承重]');
  for (const item of INJECTIONS) {
    const key = item.key;
    if (item.attack) {
      t('注入 ' + key + ' 后攻击停止命中', () => {
        const saved = __internals[key];
        assert.ok(saved instanceof RegExp, key + ' 应为 RegExp');
        __internals[key] = /(?!)/; // 永不匹配 = 置空
        try {
          const r = checkCounterfactualOverclaim(item.attack);
          assert.ok(!r.hit, '置空 ' + key + ' 后应停止命中: ' + item.attack.slice(0, 30) + ' → ' + r.details);
        } finally { __internals[key] = saved; }
      });
    }
    if (item.exempt) {
      t('注入 ' + key + ' 后豁免陷阱翻转为命中', () => {
        const saved = __internals[key];
        __internals[key] = /(?!)/;
        try {
          const r = checkCounterfactualOverclaim(item.exempt);
          assert.ok(r.hit, '置空 ' + key + ' 后陷阱样本应转为命中: ' + item.exempt.slice(0, 30));
        } finally { __internals[key] = saved; }
      });
      t('豁免陷阱无注入时放行: ' + item.exempt.slice(0, 14), () => {
        const r = checkCounterfactualOverclaim(item.exempt);
        assert.ok(!r.hit, '豁免陷阱应被 ' + key + ' 放行: ' + item.exempt.slice(0, 30));
      });
    }
  }

  console.log('\n[r183 登记断言]');
  const idx = require('../src/index.js');
  t('index.js 导出 checkCounterfactualOverclaim', () => {
    assert.strictEqual(typeof idx.checkCounterfactualOverclaim, 'function');
  });
  t('dimMap 含 counterfactual_overclaim', () => {
    const dims = gate('测试').dimensions || {};
    assert.ok('counterfactual_overclaim' in dims, 'dimensions 应含 counterfactual_overclaim');
    assert.strictEqual(Object.keys(dims).length, 181, 'dimensions 键应为 181，实测 ' + Object.keys(dims).length);
  });
  t('gate 攻击样本 findings 含本维度', async () => {
    const r = await gate('如果当初投入研发，现在我们一定已经领先市场三年了。');
    const dims = (r.findings || []).map(f => f.dimension);
    assert.ok(dims.includes('counterfactual_overclaim'), 'findings 应含 counterfactual_overclaim，实际: ' + dims.join(','));
  });
  t('gate guidance 可读取', async () => {
    const r = await gate('如果当初投入研发，现在我们一定已经领先市场三年了。');
    const f = (r.findings || []).find(x => x.dimension === 'counterfactual_overclaim');
    assert.ok(f && typeof f.guidance === 'string' && f.guidance.length > 50,
      'findings 应含本维度 guidance');
  });

  console.log('\n[r183 gate 层变体矩阵]');
  for (const s of VARIANTS) {
    const r = await gate(s);
    t('变体命中: ' + s.slice(0, 16) + ' → ' + r.gate.action, () => {
      assert.notStrictEqual(r.gate.action, 'pass', '变体应被拦截: ' + s.slice(0, 30));
      const dims = (r.findings || []).map(f => f.dimension);
      assert.ok(dims.includes('counterfactual_overclaim'),
        'findings 应含 counterfactual_overclaim，实际: ' + dims.join(','));
    });
  }
  for (const s of VARIANTS_BENIGN) {
    const r = await gate(s);
    t('良性放行: ' + s.slice(0, 16) + ' → ' + r.gate.action, () => {
      assert.strictEqual(r.gate.action, 'pass',
        '良性应放行: ' + s.slice(0, 30) + ' → ' + r.gate.action + ' / ' +
        (r.findings || []).map(f => f.dimension).join(','));
    });
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
})();
