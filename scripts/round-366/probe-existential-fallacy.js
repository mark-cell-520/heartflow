#!/usr/bin/env node
/**
 * round-366 探针：存在谬误（existential fallacy）缺口实证
 *
 * 族定义（经典三段论规则 7 违背，亚里士多德-布尔传统）：
 *   从一个不含存在承诺的前提集（全称命题、条件命题、规范命题、
 *   数学命题、虚构域命题）推出**存在性结论**（"有某个 X 存在"、
 *   "存在 X 使..."、"必然有 X"），而没有为该 X 的存在性提供任何
 *   独立证据。布尔解释下全称命题不断言任何对象存在（vacuously
 *   true），故存在结论无据。
 *
 * 高频形态：
 *   1) 「所有 A 都是 B」→「有 A」/「存在 A」（无实例列举）
 *   2) 条件句「若 P 则 Q」→「有某种情况会触发 Q」（P 的存在性未证）
 *   3) 规范/定义「X 应当 Y」→「存在一个 X 在 Y」（规范不蕴含实例）
 *   4) 数学/虚构域「独角兽有角」→「存在有角的独角兽」（虚构域无实例）
 *
 * 判据三腿（纯规则，零 LLM 依赖）：
 *   LEG1 UNIVERSAL_PREMISE: 全称前提（所有/全部/凡/every/all/no/none/each）
 *         或条件前提（如果/若/iff/whenever）或规范前提（应当/应该/必须）
 *         或定义前提（定义/规定/所谓）
 *   LEG2 NO_EXISTENTIAL_EVIDENCE: 前提侧没有任何存在承诺词
 *         （有/存在/例如/比如/someone/something/there is）
 *   LEG3 EXISTENTIAL_CONCLUSION: 结论侧出现存在断言
 *         （存在/有/必有/一定存在/there is/there exists/exists）
 *         且结论侧**不在前提侧同文出现**（防「有人存在所以有人存在」同语）
 *
 * 豁免（benign，不得命中）：
 *   - 前提本身带存在承诺（"有些/有的/some/exists"）→ 非空域，合法
 *   - 数学合法存在构造（"对每个实数 x 存在 y 使 x+y=0"）→ 数学断言
 *   - 直接观察报告（"我看到/研究发现/数据显示"）→ 经验存在证据
 *   - 定义性说明（"独角兽被定义为有角的马"）→ 元语言非断言
 *   - 否定转移（"不能推出存在"）→ 元层面正确陈述
 *   - 前提侧同文出现结论断言词 → 同语，非推论
 *
 * 输出：每条样本 { text, action, dims[] }
 */
'use strict';

const { gate } = require('../../src/gate.js');

const ATTACKS = [
  // A 族：全称前提 → 存在结论（中文）
  ['A1 全称→存在（中文标准）', '所有喝过这款茶的人都改善了睡眠，所以存在喝茶助眠的人。'],
  ['A2 全称→存在（中文倒装）', '一定有传说中的神医，因为所有难治的病最终都被他治好了。'],
  ['A3 全称→存在（中文带修饰）', '凡是通过这场考试的考生都具备扎实的专业基础，这说明社会上存在大批具备扎实专业基础的应试者。'],
  ['A4 全称→存在（中文长句）', '所有在这家机构培训过的学员都找到了理想工作，而且薪资都比原来高出不少，因此可以断定存在通过培训改变命运的人。'],
  ['A5 全称→存在（英文标准）', 'All unicorns have horns, so there exists a unicorn with a horn.'],
  ['A6 全称→存在（英文倒装）', 'There must be a perfect solution, because every problem we face can be solved in principle.'],
  ['A7 条件前提→存在（中文）', '如果按下这个按钮就能获得奖励，那么一定存在获得过奖励的人。'],
  ['A8 规范前提→存在（中文）', '每个人都应该遵守交通规则，所以存在遵守交通规则的人。'],
  ['A9 定义前提→存在（中文）', '凤凰被定义为百鸟之王，因此存在百鸟之王。'],
  ['A10 全称→必有（中文裸名词）', '所有通过筛选的候选人都很优秀，可见优秀的人大有人在。'],
];

const BENIGNS = [
  ['B1 多因正确陈述（边缘良性）', '失眠是多因共同造成的，包括压力、饮食和作息。'],
  ['B2 前提带存在承诺', '有些喝过这款茶的人反馈睡眠改善了，确实存在这样的人。'],
  ['B3 数学合法构造', '对每个实数 x 都存在 y 使 x+y=0，这是实数集的性质。'],
  ['B4 直接观察报告', '调研数据显示，有 300 名学员通过培训找到了工作。'],
  ['B5 定义性说明（元语言）', '独角兽被定义为一种神话中的马，现实中并不存在。'],
  ['B6 否定转移（元层面正确）', '从"所有天鹅都是白的"不能推出存在白色的天鹅。'],
  ['B7 同语陈述', '这项政策已经存在，而且已经存在很多年了。'],
  ['B8 中性全称无结论', '所有公民都享有法律规定的平等权利。'],
  ['B9 全称+正确多因', '所有的成功都是努力、机遇和环境共同作用的结果。'],
  ['B10 中性英文全称', 'All citizens have the right to vote in a democracy.'],
];

function run() {
  const rows = [];
  console.log('=== ATTACKS (expect: gate.action !== pass) ===');
  let aHit = 0;
  for (const [label, text] of ATTACKS) {
    let r;
    try { r = gate(text); } catch (e) { console.log(label, 'ERROR', e.message); continue; }
    const dims = (r.findings || []).map(f => f.dimension);
    const ok = r.gate.action !== 'pass';
    if (ok) aHit++;
    rows.push({ label, ok, action: r.gate.action, dims });
    console.log(`${ok ? 'HIT ' : 'MISS'} | ${label} | action=${r.gate.action} | dims=${dims.join(',') || '-'}`);
  }
  console.log(`attacks non-pass: ${aHit}/${ATTACKS.length}`);

  console.log('\n=== BENIGNS (expect: pass) ===');
  let bPass = 0;
  for (const [label, text] of BENIGNS) {
    let r;
    try { r = gate(text); } catch (e) { console.log(label, 'ERROR', e.message); continue; }
    const dims = (r.findings || []).map(f => f.dimension);
    const ef = dims.includes('existential_fallacy');
    const ok = r.gate.action === 'pass';
    if (ok) bPass++;
    rows.push({ label, ok, action: r.gate.action, dims, ef });
    console.log(`${ok ? 'PASS' : 'FAIL'} | ${label} | action=${r.gate.action} | dims=${dims.join(',') || '-'}${ef ? ' [EF-HIT!]' : ''}`);
  }
  console.log(`benigns pass: ${bPass}/${BENIGNS.length}`);
  return { aHit, total: ATTACKS.length, bPass, bTotal: BENIGNS.length, rows };
}

if (require.main === module) {
  const res = run();
  console.log('\nSUMMARY:', JSON.stringify({ aHit: res.aHit, aTotal: res.total, bPass: res.bPass, bTotal: res.bTotal }));
}
module.exports = { run, ATTACKS, BENIGNS };
