// r484 轮测（TDD：先写测试，先看到红）
// 目标维度：information_aversion 信息回避/鸵鸟效应族（provisional 第298维）
// 测试格式：module.exports = function({test}){...}（run-all 动态加载器口径）
//
// 判定结构（双腿 AND + 豁免 + 否定守卫）：
//   腿① AVAIL：有用负面信息的在场或可得性陈述
//   腿② AVOID：主动回避该信息的决定
//   同窗匹配（与 r477/r481/r482/r483 系列一致）：ZH 60 字 / EN 160 字符
//   豁免：正确信息纪律 / 成本权衡 / 委托信任 / 客观陈述 / 明确记录已知风险
//   否定守卫：NOT_AVOID（"不回避/不装作不知道"）命中即不判

const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const mod = require(path.join(HF, 'src', 'information-aversion.js'));

const fn = mod.checkInformationAversion || mod.check || mod.default;
if (typeof fn !== 'function') {
  throw new Error('information-aversion.js 未导出 checkInformationAversion()');
}

function hit(text) {
  const r = fn(text);
  return !!(r && r.hit);
}

module.exports = function ({ test }) {
  // ── A. 攻击命中：中文（腿①+腿② 同窗）──
  test('A1 已知能查清风险但不查', () => {
    if (!hit('我知道再查一轮能把风险看清楚，但还是不查了，万一查出问题反而不好收场。')) {
      throw new Error('A1 未命中');
    }
  });
  test('A2 报告已在手但不看', () => {
    if (!hit('这个尽调报告现在千万别看，知道了反而影响士气。')) {
      throw new Error('A2 未命中');
    }
  });
  test('A3 信息在手但不翻', () => {
    if (!hit('信息我已经拿到手了，但只要不看，就还能照原计划推进。')) {
      throw new Error('A3 未命中');
    }
  });
  test('A4 数据在桌上但选择不看', () => {
    if (!hit('数据明明白白摆在那里，我却选择了不看，因为看了就得改方案。')) {
      throw new Error('A4 未命中');
    }
  });
  test('A5 前置拒绝被告知', () => {
    if (!hit('先别告诉我结论，我怕知道了这个项目就推不下去了。')) {
      throw new Error('A5 未命中');
    }
  });
  test('A6 主动不想知道细节', () => {
    if (!hit('这件事我不想知道细节，知道得越少我越敢拍板。')) {
      throw new Error('A6 未命中');
    }
  });
  test('A7 倒装：结论前置', () => {
    if (!hit('不查了——查清楚了反而没法收场，就这样按原定判断往下走。')) {
      throw new Error('A7 未命中');
    }
  });
  test('A8 长句 + 修饰', () => {
    if (!hit('虽然团队已经把最新一轮的客户流失数据整理好放在我桌上，但只要我不去翻那一页，就可以理所当然地继续按原定节奏投入。')) {
      throw new Error('A8 未命中');
    }
  });

  // ── B. 攻击命中：英文 ──
  test('B1 would rather not look', () => {
    if (!hit('I know one more check would reveal the real risk, but I would rather not look.')) {
      throw new Error('B1 未命中');
    }
  });
  test('B2 report in hand but not read', () => {
    if (!hit('We have the due-diligence report in hand, but reading it now would only derail the plan.')) {
      throw new Error('B2 未命中');
    }
  });
  test('B3 do not tell me yet', () => {
    if (!hit('Do not tell me the result yet — once I know it, I will have to stop the project.')) {
      throw new Error('B3 未命中');
    }
  });
  test('B4 deliberately not opened', () => {
    if (!hit('The numbers are sitting right there in the file, but I have deliberately not opened it so I can keep going.')) {
      throw new Error('B4 未命中');
    }
  });
  test('B5 refuse to be told', () => {
    if (!hit('I would rather stay in the dark on this, because knowing the real numbers would force me to cancel it.')) {
      throw new Error('B5 未命中');
    }
  });

  // ── C. 良性 pass（含该族边缘良性）──
  test('C1 正确信息纪律', () => {
    if (hit('负面信息也是信息，回避它只会让决策建立在更差的证据上。')) {
      throw new Error('C1 误伤');
    }
  });
  test('C2 成本权衡（时间/预算理由）', () => {
    if (hit('再查一轮要两周时间和二十万预算，我们评估后决定把资源先投到更关键的环节。')) {
      throw new Error('C2 误伤');
    }
  });
  test('C3 委托信任（交给风控）', () => {
    if (hit('这个尽调报告交给风控部门审阅，他们比我有更专业的判断。')) {
      throw new Error('C3 误伤');
    }
  });
  test('C4 客观陈述（无回避断言）', () => {
    if (hit('很多人倾向于回避负面信息，这是一种常见的心理倾向。')) {
      throw new Error('C4 误伤');
    }
  });
  test('C5 边缘良性：明确记录已知风险', () => {
    if (hit('我知道再查一轮会更稳妥，但时间不允许，所以我记录了未验证的部分作为已知风险。')) {
      throw new Error('C5 误伤');
    }
  });
  test('C6 边缘良性：权限范围说明', () => {
    if (hit('报告我们决定先不看，是因为本轮评审的权限范围只覆盖已确认事项。')) {
      throw new Error('C6 误伤');
    }
  });
  test('C7 EN 正确信息纪律', () => {
    if (hit('Negative information is still information; avoiding it only weakens the decision.')) {
      throw new Error('C7 误伤');
    }
  });
  test('C8 EN 委托信任', () => {
    if (hit('Due diligence was delegated to the risk team, who have the expertise to judge it.')) {
      throw new Error('C8 误伤');
    }
  });
  test('C9 EN 客观陈述', () => {
    if (hit('Avoiding negative information is a well-documented behavioural tendency.')) {
      throw new Error('C9 误伤');
    }
  });
  test('C10 数据下月才可得', () => {
    if (hit('客户流失数据下个月才能拿到，我们先推进不依赖它的部分。')) {
      throw new Error('C10 误伤');
    }
  });

  // ── D. 缺腿不判（双腿 AND 承重证明）──
  test('D1 只有可得性无回避决定 → 不判', () => {
    if (hit('团队已经把最新一轮的客户流失数据整理好放在我桌上，我下午就逐项核对。')) {
      throw new Error('D1 误判：缺腿②不应命中');
    }
  });
  test('D2 只有回避无具体信息对象 → 不判', () => {
    if (hit('我不想再讨论这个话题了，我们说点别的吧。')) {
      throw new Error('D2 误判：缺腿①不应命中');
    }
  });
  test('D3 EN 缺腿② → 不判', () => {
    if (hit('The due-diligence report is on my desk and I will read it this afternoon.')) {
      throw new Error('D3 误判');
    }
  });

  // ── E. 否定守卫：明确拒绝回避 → 不判 ──
  test('E1 否定守卫：不回避负面信息', () => {
    if (hit('再查一轮能把风险看清楚，所以我不打算装作不知道，下午就去看。')) {
      throw new Error('E1 误判：否定语境不应命中');
    }
  });
  test('E2 否定守卫：EN not hiding from', () => {
    if (hit('I am not hiding from the report; I will read it before we decide.')) {
      throw new Error('E2 误判');
    }
  });

  // ── F. 插件层端到端（dispatch 接线证明）──
  test('F1 插件 hook 端到端：攻击被写进 _discrimination', () => {
    const plug = require(path.join(HF, 'src', 'plugins', 'information-aversion-check', 'index.js'));
    const analyze = plug.analyze || (plug.default && plug.default.analyze);
    if (typeof analyze !== 'function') {
      throw new Error('插件未导出 analyze()');
    }
    const r = analyze('我知道再查一轮能把风险看清楚，但还是不查了，万一查出问题反而不好收场。');
    if (!r || r.totalHits === 0 || !r.families || r.families.length === 0) {
      throw new Error('F1 插件层未检出');
    }
    // 模拟 postprocess.think hook 的写入口径
    const result = { output: { conclusion: '我知道再查一轮能把风险看清楚，但还是不查了，万一查出问题反而不好收场。' } };
    const rr = analyze(result.output.conclusion);
    if (rr && rr.totalHits > 0) {
      result._discrimination = result._discrimination || {};
      result._discrimination.informationAversion = rr;
    }
    const d = result._discrimination;
    if (!d || !d.informationAversion || d.informationAversion.totalHits === 0) {
      throw new Error('F1 插件层未写进 _discrimination');
    }
  });
  test('F2 插件 hook 端到端：良性零误伤', () => {
    const plug = require(path.join(HF, 'src', 'plugins', 'information-aversion-check', 'index.js'));
    const analyze = plug.analyze || (plug.default && plug.default.analyze);
    const r = analyze('这个尽调报告交给风控部门审阅，他们比我有更专业的判断。');
    if (r && r.totalHits > 0) {
      throw new Error('F2 插件层误伤');
    }
  });
  test('F3 插件层 hook 注册形状：event/priority/init', () => {
    const plug = require(path.join(HF, 'src', 'plugins', 'information-aversion-check', 'index.js'));
    const hooks = plug.hooks;
    if (!Array.isArray(hooks) || hooks.length === 0) throw new Error('hooks 缺失');
    const h = hooks[0];
    if (h.event !== 'postprocess.think') throw new Error('hook event 非 postprocess.think');
    if (typeof h.priority !== 'number' || h.priority <= 230) throw new Error('priority 未高于 r483 的 230');
    if (typeof plug.init !== 'function') throw new Error('init 缺失');
  });
};
