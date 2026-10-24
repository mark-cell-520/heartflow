/**
 * scripts/negative-test-post-hoc.js
 * [r720] post_hoc 第 151 维度负例注入测试：逐一置空各常量验证承重。
 * 纪律：置空后期望翻转（攻击从命中变零命中）；豁免注入样本必须双腿齐全，
 * 且避开其他豁免的叠加兜底（样本刻意去掉会触发其他豁免的字样）。
 */
'use strict';

const path = require('path');
const Module = require('module');
const modPath = path.join(__dirname, '..', 'src', 'post-hoc.js');

function loadWithOverrides(overrides) {
  const src = require('fs').readFileSync(modPath, 'utf8');
  let out = src;
  for (const [name, val] of Object.entries(overrides)) {
    // 把 const NAME = [...] 替换为 const NAME = <val>
    const re = new RegExp('const ' + name + ' = \\[[^\\]]*\\]');
    if (!re.test(out)) throw new Error('常量未找到: ' + name);
    out = out.replace(re, 'const ' + name + ' = ' + val);
  }
  const m = new Module(modPath, null);
  m.filename = modPath;
  m.paths = Module._nodeModulePaths(path.dirname(modPath));
  m._compile(out, modPath);
  return m.exports;
}

const base = loadWithOverrides({});

// 攻击样本（覆盖四条路由 + 口语高频形态）
const attacks = [
  // R1 时序连接 × 因果断言
  ['自从换了领导，业绩就下滑了，肯定是领导的问题', 1],
  ['上次调整了策略，之后销量就涨了，说明策略对了', 1],
  ['他来了之后团队就出问题，都是他带来的', 1],
  ['自从用了新系统，bug 就多了，新系统不行', 1],
  ['装了这个杀毒软件之后电脑就没蓝屏了，果然是它的功劳', 1],
  ['After the new manager arrived, sales dropped, so it is his fault.', 1],
  ['Since we changed the strategy, revenue went up, proving it was right.', 1],
  ['Ever since I installed this app, my phone stopped freezing — it works.', 1],
  // R2 干预 × 症状变化
  ['我吃了这个药就好了，所以这药有效', 2],
  ['换了个手机号之后孩子成绩就上去了，真是玄学', 2],
  ['I took the medicine and got better, so the medicine works.', 2],
  // R3 缺失 × 灾殃 × 规避
  ['昨天没带护身符今天就出事，以后必须带', 3],
  ['那天没去加班，第二天就出了乱子，以后我不敢缺席了', 3],
  // R4 到场 × 垮掉
  ['He sat in that chair and we lost three games; get him out of there.', 4],
  // 口语高频形态（语域真实分布补充）
  ['昨天打了补丁，今天就出故障了，补丁有问题', 2],
  ['我上次穿了这件衣服考试就考砸了，看来这件衣服晦气', 2],
  ['她开始每天跑步之后感冒就少了，跑步肯定能治感冒', 1],
  ['换了新手机之后我就没丢过钱包，这手机买对了', 2],
];

// 良性样本（调查语境 / 中性记录 / 元陈述）
const benign = [
  ['换了领导后业绩下滑，我们需要分析具体原因', 'exempt'],
  ['吃药后症状缓解，但还要看对照组数据才能确认疗效', 'exempt'],
  ['策略调整后销量上涨，可能是策略起作用，也可能是市场变化', 'exempt'],
  ['新系统上线后 bug 增多，需要排查是系统问题还是使用习惯', 'exempt'],
  ['时间上的先后不等于因果，我们要控制变量再下结论', 'exempt'],
  ['Correlation does not imply causation; we need more data.', 'exempt'],
  ['这两个事件同时发生，但可能有共同的原因', 'exempt'],
  ['业绩变化有很多因素，不能只归因于一个变量', 'exempt'],
  ['我们需要做回归分析，排除季节性因素的影响', 'exempt'],
  ['两个事情挨着发生，先记录下来再找因果机制', 'exempt'],
  ['昨天打了补丁，今天出了故障，正在排查原因', 'shape'],
  ['昨天发布了新版本，用户投诉量有变化，需要看数据', 'exempt'],
  ['This is a factual statement about the weather today.', 'clean'],
  ['I changed the deployment process and latency improved; we need to check whether it was the cache.', 'exempt'],
  ['他升职之后团队士气有波动，可能和多种因素有关', 'exempt'],
];

let pass = 0, fail = 0;
const report = [];

// 1. 基线：攻击全命中、良性 0 误伤
for (const [t, route] of attacks) {
  const r = base.checkPostHoc(t);
  const hit = r.count > 0;
  if (hit) { pass++; } else { fail++; report.push('FAIL 攻击未命中 [R' + route + '] ' + t); }
}
for (const [t, kind] of benign) {
  const r = base.checkPostHoc(t);
  const bad = r.count > 0;
  if (!bad) { pass++; } else { fail++; report.push('FAIL 良性误判 [' + kind + '] ' + t); }
}

// 2. 负例注入：置空常量后对应路由的攻击必须翻转
const injections = [
  { name: 'CONNECT_ZH', val: '[]', victims: ['自从新领导上任，业绩就下滑了，肯定是领导的问题', '上次改了策略，之后销量就涨了，说明策略对了', '她每天跑步之后感冒就少了，跑步肯定能治感冒'] },
  { name: 'ASSERT_ZH', val: '[]', victims: ['自从新领导上任，业绩就下滑了，看来是领导的功劳', '他来了之后团队就出问题，都是他带来的'] },
  { name: 'INTERVENE_ZH', val: '[]', victims: ['我吃了这个药就好了，所以这药有效', '昨天打了补丁，今天就出故障了，补丁有问题'] },
  { name: 'CHANGE_ZH', val: '[]', victims: ['我吃了这个药就好了，所以这药有效', '换了个手机号，孩子成绩就上去了'] },
  { name: 'ABSENCE_ZH', val: '[]', victims: ['昨天没带护身符今天就出事，以后必须带'] },
  { name: 'CALAMITY_ZH', val: '[]', victims: ['昨天没带护身符今天就出事，以后必须带'] },
  { name: 'AVOID_ZH', val: '[]', victims: ['昨天没带护身符今天就出事，以后必须带', '那天没去加班，第二天就出了乱子，以后我再也不敢缺席了'] },
  { name: 'CONNECT_EN', val: '[]', victims: ['After the new manager arrived, sales dropped, so it is his fault.'] },
  { name: 'ASSERT_EN', val: '[]', victims: ['After the new manager arrived, sales dropped, so it is his fault.'] },
  { name: 'INTERVENE_EN', val: '[]', victims: ['I took the medicine and got better, so the medicine works.'] },
  { name: 'CHANGE_EN', val: '[]', victims: ['I took the medicine and got better, so the medicine works.'] },
];

for (const inj of injections) {
  let mod;
  try { mod = loadWithOverrides({ [inj.name]: inj.val }); }
  catch (e) { fail++; report.push('FAIL 注入异常 ' + inj.name + ': ' + e.message); continue; }
  for (const v of inj.victims) {
    const r = mod.checkPostHoc(v);
    if (r.count === 0) { pass++; }
    else { fail++; report.push('FAIL 置空 ' + inj.name + ' 后仍命中: ' + v); }
  }
}

// 3. 豁免注入：良性样本本身零命中（已覆盖），额外验证豁免表承重
//    构造「双腿齐全但带豁免词」的样本，置空 EXEMPT_ZH 后应翻转
const exemptProbe = [
  ['换了领导后业绩就下滑，这肯定是领导的问题，但我们需要分析具体原因', 'EXEMPT_ZH'],
  ['换了领导后业绩就下滑，这肯定是领导的问题，不过不等于因果', 'EXEMPT_ZH'],
  ['After the new manager arrived sales dropped, so it is his fault, but we need more data.', 'EXEMPT_EN'],
];
for (const [t, exName] of exemptProbe) {
  const r0 = base.checkPostHoc(t);
  if (r0.count === 0) { pass++; } else { fail++; report.push('FAIL 豁免样本被误判: ' + t); }
  const m1 = loadWithOverrides({ [exName]: '[]' });
  const r1 = m1.checkPostHoc(t);
  if (r1.count > 0) { pass++; } else { fail++; report.push('FAIL 置空 ' + exName + ' 后未翻转: ' + t); }
}

// 4. __internals 导出完整性
const keys = Object.keys(base.__internals || {});
const need = ['CONNECT_ZH', 'ASSERT_ZH', 'INTERVENE_ZH', 'CHANGE_ZH', 'ABSENCE_ZH', 'CALAMITY_ZH', 'AVOID_ZH', 'CONNECT_EN', 'ASSERT_EN', 'INTERVENE_EN', 'CHANGE_EN', 'ABSENCE_EN', 'CALAMITY_EN', 'AVOID_EN', 'EXEMPT_ZH', 'EXEMPT_EN'];
for (const k of need) {
  if (keys.includes(k)) { pass++; } else { fail++; report.push('FAIL __internals 缺 ' + k); }
}

// 5. 非字符串守卫
const g = base.checkPostHoc(undefined);
if (g.count === 0) { pass++; } else { fail++; report.push('FAIL 非字符串守卫'); }
const g2 = base.checkPostHoc('');
if (g2.count === 0) { pass++; } else { fail++; report.push('FAIL 空串守卫'); }

console.log('=== negative-test-post-hoc ===');
if (report.length) console.log(report.join('\n'));
console.log(pass + ' passed, ' + fail + ' failed');
process.exit(fail === 0 ? 0 : 1);
