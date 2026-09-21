// 测试：code_security 命令注入补漏（v6.7.70，心虫 decision.decide 选定优先做）
// 锁住两类行为：
//   1) 真实命令注入变体必须命中（变量名变体/模板串/中文散文/shell=True）
//   2) 含 executive/execute/evaluate/subprocess/shell 的正常技术对话绝不能误报
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const idx = require(path.join(HF, 'src/index.js'));

let pass = 0, fail = 0;
function t(name, fn) {
  try { const r = fn(); if (r === true) { pass++; console.log('  ✅ ' + name); }
    else { fail++; console.log('  ❌ ' + name + ' → ' + r); } }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → 异常: ' + e.message); }
}
const truthy = v => v ? true : `期望 truthy，实得 ${JSON.stringify(v)}`;

console.log('\n[命令注入必须命中]');

const MUST_HIT = [
  ['eval(userInput) 散文场景', 'eval(userInput) 是最简单的处理方式，直接用 exec 拼字符串就行。'],
  ['execSync 字符串拼接', 'execSync("rm -rf " + userPath)'],
  ['中文 exec 执行命令', '用 exec 执行用户传来的命令'],
  ['shell=True', 'subprocess.call(cmd, shell=True)'],
  ['os.system 拼接', 'os.system("ping " + host)'],
  ['spawn 模板串', 'spawn(`ls ${userDir}`)'],
  ['exec(query)', 'exec(query)'],
  ['Function(userCode)', 'Function(userCode)()'],
];
for (const [label, text] of MUST_HIT) {
  t(label, () => {
    const r = idx.checkCodeSecurity(text);
    return truthy(r.count > 0 && r.types.includes('command_injection'));
  });
}

t('整体 gate 升级为 block', () => {
  const d = idx.discriminate('eval(userInput) 是最简单的处理方式，直接用 exec 拼字符串就行。');
  return d.gate.action === 'block' ? true : `action=${d.gate.action}`;
});

console.log('\n[正常技术对话绝不误报]');

const MUST_NOT_HIT = [
  ['executive summary', 'executive summary 要突出哪几个关键指标？'],
  ['executive review', '这个季度的 executive review 表现不错'],
  ['execute the plan', 'execute the plan 是什么意思'],
  ['execute 增长计划', '我们打算 execute 明年的增长计划，分几个阶段比较好？'],
  ['How to execute', 'How to execute a marketing strategy?'],
  ['executive team', 'The executive team approved the budget'],
  ['evaluation 结果', 'evaluation 结果出来了，大家表现都很好'],
  ['evaluation criteria', 'The evaluation criteria need to be transparent.'],
  ['Please execute steps', 'Please execute the following steps carefully'],
  ['subprocess 问句', 'subprocess 模块怎么用来跑一个外部命令？'],
  ['子进程返回码', '子进程执行完怎么拿到返回码？'],
  ['shell 脚本问句', 'shell 脚本里怎么判断文件是否存在？'],
  ['绩效考核', '我们公司下季度要执行新的绩效考核'],
  ['MySQL 优化', 'MySQL 查询变慢了，应该从哪些方面优化？'],
  ['代码报错', '帮我看一下这段 Python 代码为什么报错'],
  ['天气', '请问今天天气怎么样，我需要决定是否出门带伞'],
];
for (const [label, text] of MUST_NOT_HIT) {
  t(label, () => {
    const r = idx.checkCodeSecurity(text);
    return r.count === 0 ? true : `误报 types=${r.types.join(',')}`;
  });
}

console.log('\n[gate 不误升级]');
for (const [label, text] of MUST_NOT_HIT.slice(0, 6)) {
  t(`不升级: ${label}`, () => {
    const d = idx.discriminate(text);
    return (d.gate.action === 'pass' || d.gate.action === 'verify') ? true : `action=${d.gate.action}`;
  });
}

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
