// test/round-589-instruction-registry-live.test.js
// 第 589 轮守卫：InstructionRegistry 四条死指令判据补齐 + 变异注入证伪
//
// 背景（r589 实测，非照抄简报）：
//   · heartflow.js:1645 实例化 this.instructions 后，src/ + test/ 零调用点；
//   · 7 条指令里 beauty/upgrade/serve_humans/continuous_improvement 恒
//     aligned:true（原实现：beauty 只有长度腿，后三条落 default『无自动规则检查』）；
//   · 老测试 7 项无一条触碰这 4 条 → 判据改坏无人知道。
//
// 本轮守卫的硬要求：每条新腿置空（变异注入）后，命中样本必须从
// aligned:false 翻回 true —— 翻不动 = 守卫是装饰。
//
// 反 Idle 铁律：样本只以本文件内字符串出现，报告只报数字不贴原文。

const assert = require('assert');
const { InstructionRegistry } = require('../src/core/instruction-registry.js');

module.exports = function ({ test }) {

  // ─── 1. 四条此前死掉的指令，现在必须真能判 ────────────────────────
  test('r589 serve_humans：知识滞留族必须 aligned:false', () => {
    const ir = new InstructionRegistry();
    const family = [
      '这些方法我自己留着用，先不告诉别人。',
      '不外传，只有我一个人知道。',
      '把经验锁在我自己这里，没必要分享。',
      '不外传这资料，别人用不着。',
    ];
    for (const text of family) {
      const r = ir.check('serve_humans', { text, scenario: 'knowledge_sharing' });
      assert.strictEqual(r.aligned, false, `应判未命中: ${JSON.stringify(r)}`);
    }
  });

  test('r589 upgrade：无改进信号族必须 aligned:false', () => {
    const ir = new InstructionRegistry();
    const family = [
      '还是老样子，没有任何改进。',
      '跟上回一样，没什么变化。',
      '老问题还在，同样的错误又出现了。',
      '问题还是没解决，照旧。',
    ];
    for (const text of family) {
      const r = ir.check('upgrade', { text, scenario: 'reflection' });
      assert.strictEqual(r.aligned, false, `应判未命中: ${JSON.stringify(r)}`);
    }
  });

  test('r589 continuous_improvement：拒绝改进族必须 aligned:false', () => {
    const ir = new InstructionRegistry();
    const family = [
      '凑合用吧，不用优化。',
      '能用就行，没必要改。',
      '保持现状就行，先这样吧。',
      '这代码能跑就行，不用改。',
    ];
    for (const text of family) {
      const r = ir.check('continuous_improvement', { text, scenario: 'architecture' });
      assert.strictEqual(r.aligned, false, `应判未命中: ${JSON.stringify(r)}`);
    }
  });

  test('r589 beauty：混乱族必须 aligned:false（长度/杂乱/复读三腿）', () => {
    const ir = new InstructionRegistry();
    const long = '这'.repeat(5200);
    const noisy = '，，，，，，，，，，，，，，。'.repeat(40) + '、'.repeat(20);
    const repeat = '同样的段落重复同样的段落重复同样的段落重复同样的段落重复同样的段落重复'.repeat(8);
    for (const text of [long, noisy, repeat]) {
      const r = ir.check('beauty', { text, scenario: 'output_generation' });
      assert.strictEqual(r.aligned, false, `应判未命中: len=${text.length}`);
    }
  });

  // ─── 2. 良性样本零误伤（误伤会让 audit 变成噪声源）──────────────
  test('r589 良性样本：四条指令 + 老指令全部 aligned=true', () => {
    const ir = new InstructionRegistry();
    const benign = [
      '这个方法我今天写成文档分享出去，团队都能用。',
      '我把这个新经验整理成笔记，方便下次复用。',
      '相比上周，这次漏测的用例从 5 个降到 1 个。',
      '这个流程还有优化空间，我们下轮改掉重复校验那块。',
      '这是正常的短输出。',
      '基于当前数据，我倾向于选 B 方案。',
    ];
    for (const text of benign) {
      for (const id of ['truth', 'goodness', 'beauty', 'upgrade', 'reduce_errors', 'serve_humans', 'continuous_improvement']) {
        const r = ir.check(id, { text, scenario: 'output_generation', confidence: 0.8 });
        assert.strictEqual(r.aligned, true,
          `误伤: ${id} → ${JSON.stringify(r)}`);
      }
    }
  });

  // ─── 3. 变异注入：每条腿置空 → 命中必须翻回 aligned:true ────────────
  test('r589 变异反转：逐条腿置空后攻击样本翻回 aligned:true', () => {
    const ir = new InstructionRegistry();
    const cases = [
      { id: 'serve_humans', text: '这些方法我自己留着用，先不告诉别人。', code: 'knowledge_withheld_zh' },
      { id: 'upgrade', text: '还是老样子，没有任何改进。', code: 'no_improvement_zh' },
      { id: 'continuous_improvement', text: '凑合用吧，不用优化。', code: 'refuse_improvement_zh' },
      // too_long 专有样本：超长、无重复片段、无高噪声占比 —— 只命中长度腿，
      // 这样「把 too_long 置空 → 必须翻回 aligned:true」才是有效证伪。
      // 用异或取模的伪随机字填充，避免任何 ≥8 长度片段重复出现 4 次。
      { id: 'beauty', text: (() => { let s = ''; for (let i = 0; i < 20000; i++) s += String.fromCharCode(0x4e00 + (i * 7919) % 20000); return s; })(), code: 'too_long' },
    ];
    for (const c of cases) {
      // 基线：未注入时确实命中
      const base = ir.check(c.id, { text: c.text });
      assert.strictEqual(base.aligned, false, `基线未命中 ${c.id}`);
      assert.strictEqual(base.code, c.code, `基线归因错: ${base.code} != ${c.code}`);

      // 变异：把命中腿判据换成恒 false —— 必须翻回 aligned:true
      const flipped = ir.check(c.id, { text: c.text }, { [c.code]: () => false });
      assert.strictEqual(flipped.aligned, true,
        `变异未翻转（守卫是装饰）: ${c.id} → ${JSON.stringify(flipped)}`);

      // 反向变异：给非命中腿注入恒 true 判据 + 只符合该腿语义的文本 →
      // 必须命中（证明腿不是盲目恒放）。语义相反的样本原判据不命中，
      // 命中的只能是注入腿。
      const otherLeg = ir._judges[c.id].find(l => l.id !== c.code);
      const reverseText = c.id === 'serve_humans'
        ? 'I will keep this method inside the machine.'
        : 'This is a clean output with no issues at all.';
      const injectedHit = ir.check(c.id, { text: reverseText }, { [otherLeg.id]: () => true });
      assert.strictEqual(injectedHit.aligned, false,
        `反向变异未命中（判据形同虚设）: ${c.id}/${otherLeg.id}`);
      assert.strictEqual(injectedHit.code, otherLeg.id, '注入腿应被归因');
      // 同一样本不注入 → 不命中（确认原判据确实没有覆盖它）
      assert.strictEqual(ir.check(c.id, { text: reverseText }).aligned, true);
      // 恢复路径：不传 inject 仍与基线一致
      assert.strictEqual(ir.check(c.id, { text: c.text }).aligned, false);
    }
  });

  test('r589 变异反转 3：beauty 三条腿互相独立（置空命中腿后其余腿仍可命中）', () => {
    const ir = new InstructionRegistry();
    // noise_ratio 专有样本：每段标点串都不同（含自增编号），无可重复片段，
    // 只命中杂乱度腿
    const noisy = Array.from({ length: 200 }, (_, i) => `${i + 1}，，，，，`).join('');
    const base = ir.check('beauty', { text: noisy });
    assert.strictEqual(base.aligned, false);
    assert.strictEqual(base.code, 'noise_ratio', `应命中杂乱度腿: ${JSON.stringify(base)}`);
    // 只把命中腿置空，该样本其余两条腿均不命中 —— 这恰说明噪声腿的专有性：
    // noise_ratio 样本不含长文本也不含重复片段。再用 noisy 之外的样本验证剩余腿。
    // (noise_ratio 腿置空后 noisy 翻回 aligned:true 见主反转测试)。
    // repetition 专有样本：只命中复读腿，置空后翻回 true
    const repeat = '同样的片段重复了又重复同样的片段'.repeat(6);
    assert.strictEqual(ir.check('beauty', { text: repeat }).code, 'repetition');
    assert.strictEqual(ir.check('beauty', { text: repeat }, { repetition: () => false }).aligned, true);
    assert.notStrictEqual(ir.check('beauty', { text: repeat }).code, null);
    // too_long 专有样本：只命中长度腿（同样无重复无噪声问题的那份长文本在
    // 主反转测试里；这里用超长短文本验证长度阈值）
    const long = '这'.repeat(6000);
    assert.strictEqual(ir.check('beauty', { text: long }).code, 'too_long');
    // 三条腿全置空 → 翻回 aligned:true（证明三条腿共同构成该指令的守卫活性）
    const all = ir.check('beauty', { text: noisy },
      { too_long: () => false, noise_ratio: () => false, repetition: () => false });
    assert.strictEqual(all.aligned, true, '三腿全置空必须翻回 aligned:true');
  });

  // ─── 3b. 判据缺失不得静默放行（变异注入的边界）────────────────────
  test('r589 变异兜底：把某条指令所有腿都注入为「非函数非 true」不得绕过', () => {
    const ir = new InstructionRegistry();
    ir._judges.serve_humans = [];
    const r = ir.check('serve_humans', { text: '任何文本' });
    assert.strictEqual(r.aligned, false);
    assert.strictEqual(r.code, 'NO_CRITERIA');
  });

  test('r589 变异注入形态：传 unknown/undefined 值不得让守卫失效', () => {
    const ir = new InstructionRegistry();
    const sample = '这些方法我自己留着用，先不告诉别人。';
    // inject[legId] = true 表示「保留该腿」→ 仍应命中
    assert.strictEqual(ir.check('serve_humans', { text: sample }, { knowledge_withheld_zh: true }).aligned, false);
    // inject 里塞伪造腿名 —— 不得影响真实腿
    assert.strictEqual(ir.check('serve_humans', { text: sample }, { fake_leg: () => false }).aligned, false);
    // inject 为 null/无 keys —— 行为同生产
    assert.strictEqual(ir.check('serve_humans', { text: sample }, null).aligned, false);
    assert.strictEqual(ir.check('serve_humans', { text: sample }, {}).aligned, false);
  });

  // ─── 5. audit() 端到端：四条死指令进入场景审计 ─────────────────────
  test('r589 audit()：knowledge_sharing 场景覆盖 serve_humans 且拒绝放行滞留样本', () => {
    const ir = new InstructionRegistry();
    const results = ir.audit({ text: '不外传，只有我一个人知道。', scenario: 'knowledge_sharing', confidence: 0.9 });
    const sh = results.find(r => r.instruction === 'serve_humans');
    assert.ok(sh, 'audit 输出中应含 serve_humans');
    assert.strictEqual(sh.aligned, false);
    // 老测试同场景的行为不回退
    const clean = ir.audit({ text: '我写成了文档，团队都能用。', scenario: 'knowledge_sharing', confidence: 0.9 });
    assert.strictEqual(clean.every(r => r.aligned), true);
  });

  // ─── 6. 老测试口径不回退（7 项旧断言）─────────────────────────
  test('r589 兼容性：truth/goodness/reduce_errors 判定不变', () => {
    const ir = new InstructionRegistry();
    assert.strictEqual(ir.check('truth', { text: '我100%确定这个绝对没问题' }).aligned, false);
    assert.strictEqual(ir.check('goodness', { text: '你真没用，去死吧' }).aligned, false);
    assert.strictEqual(ir.check('reduce_errors', { text: '答案', confidence: 0.2 }).aligned, false);
    assert.strictEqual(ir.check('truth', { text: '基于当前数据我认为可能' }).aligned, true);
    assert.strictEqual(ir.check('truth', { text: 'x' }).reason, '通过');
    const stats0 = ir.getStats().totalChecks;
    ir.check('truth', { text: 'y' });
    assert.strictEqual(ir.getStats().totalChecks, stats0 + 1);
    assert.strictEqual(ir.check('nonexistent', {}).aligned, false);
  });

  test('r589 边界：非字符串 text / 空 context 不抛异常', () => {
    const ir = new InstructionRegistry();
    for (const id of ['truth', 'goodness', 'beauty', 'upgrade', 'serve_humans', 'continuous_improvement']) {
      assert.doesNotThrow(() => ir.check(id, {}));
      assert.doesNotThrow(() => ir.check(id, { text: null }));
      assert.doesNotThrow(() => ir.check(id, { text: 12345 }));
      assert.doesNotThrow(() => ir.check(id));
    }
  });
};

// 裸跑入口（node test/round-589-...js 直接执行）
if (require.main === module) {
  let pass = 0, fail = 0;
  const test = (name, fn) => {
    try { fn(); console.log(`✓ ${name}`); pass++; }
    catch (e) { console.log(`✗ ${name}\n   ${e.message}`); fail++; }
  };
  module.exports({ test });
  console.log(`\nround-589 instruction-registry 守卫: ${pass} 通过, ${fail} 失败`);
  if (fail > 0) process.exitCode = 1;
}
