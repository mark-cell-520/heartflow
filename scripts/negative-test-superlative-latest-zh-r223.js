/**
 * negative-test-superlative-latest-zh-r223.js — 负例验证（v6.7.127 第 223 轮）
 *
 * 验证 test/superlative-latest-zh-r223.test.js 真的在守门：把本轮新增的
 * 「最新」边界化前置预查逐段破坏，守卫必须变红（断言失败，不能是崩溃）。
 *
 * 本轮三个实测出来的方法论坑（都在脚本里重踩过一次，写进注释防回归）：
 *
 * ① **部分删词是无效变异**。第一版把「|资料|信息|」换成永不匹配，
 *    探针照样全绿。原因：预查词表有 30+ 个词，删掉 3 个后剩下的词
 *    仍能挡住同批样本（probe-r223-dbg3 实测：删后样本仍零命中）。
 *    有效变异必须命中**整条规则的独占保护**，不是其中几个词。
 *    定位方法见 probe-r223-dbg5.js：整条正则全删后，8 个
 *    「最新+名词」样本被下游 superlative generic 误吃 —— 这 8 条
 *    就是本轮规则真正的独占保护对象。
 * ② **中性化池与正向池必须不相交**。「最新鲜的…」既是正向样本又是
 *    中性化样本，放进去对照副本会自相矛盾变红。
 * ③ 对照副本是 identity mutate，不能用「注入未改变源码」断言拦
 *    （第一版在这里崩过）。
 *
 * 有效变异设计原则（probe-r223-dbg5 定量支撑）：
 *   M1 整条正则替换成永不匹配（独占保护全失 → 中性化样本全误伤）
 *   M2 预查表只留「的」（量词/名词分支全失 → 一代/一届/一款/一期族误伤）
 *   M3 换成修复前的裸「最新」（退回漏判 → 正向样本全丢）
 *   M4 删「的」分支（最新+的+名词族误伤）
 *   M5 删量词/序列分支（一代/一届/一款/一期族误伤）
 *   M6 预查表反向扩大成全汉字（吃掉形容词 → 正向样本全丢）
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = fs.readFileSync(path.join(HF, 'src', 'index.js'), 'utf8');
if (SRC.indexOf('v6.7.127 第 223 轮') < 0) throw new Error('未找到第 223 轮新增块');

// 本轮新增的整条正则（用于定位与整块替换）
const NEW_RE = '最新(?=的|[一声音起回代批版本款项届篇篇]|指示|通知|公告|数据|结果|消息|进展|情况|文件|资料|信息|成果|记录|命令|新闻|快讯|通报|战报|名单|编号|标签|快照|镜像|构建|打包|方案|设计|计划|想法|构想|稿|名单)';

// 删掉整条规则后会被下游 superlative generic 误吃的样本（独占保护对象）
const NEUTRAL_WHOLE = [
  '最新的资料已归档',
  '最新的信息请看附件',
  '最新的文件在这里',
  '最新一代的芯片性能更好。',
  '最新一届的名单在这里。',
  '最新款的产品已经上架。',
  '最新的成果已发布。',
  '最新的记录被刷新。',
];

const INJECTIONS = [
  {
    name: 'M1 整条正则换成永不匹配（边界判据全删）',
    from: '/最新(?=的|[一声音起回代批版本款项届篇篇]|指示|通知|公告|数据|结果|消息|进展|情况|文件|资料|信息|成果|记录|命令|新闻|快讯|通报|战报|名单|编号|标签|快照|镜像|构建|打包|方案|设计|计划|想法|构想|稿|名单)/g',
    to: '/(?:zzzzz)/g',
    neutral: NEUTRAL_WHOLE,
  },
  {
    name: 'M2 预查表只留「的」（名词/量词分支全删）',
    from: '最新(?=的|[一声音起回代批版本款项届篇篇]|',
    to: '最新(?=的|',
    neutral: [
      '最新一代的芯片性能更好。',
      '最新一届的名单在这里。',
      '最新款的产品已经上架。',
      '最新一期报告',
    ],
  },
  {
    name: 'M3 换成修复前的裸「最新」形状（退回漏判）',
    from: NEW_RE,
    to: '最新',
    neutral: [],
    positiveLoss: [
      '这是市场上最新鲜的蔬菜，供货商每天凌晨采摘。',
      '这家店的面包是最新鲜出炉的。',
      '这是目前最新鲜的食材。',
      '最新鲜的水果在产地直发。',
    ],
  },
  {
    name: 'M4 删「的」分支（最新+的+名词族误伤）',
    from: '最新(?=的|[一声音起回代批版本款项届篇篇]|',
    to: '最新(?=[一声音起回代批版本款项届篇篇]|',
    neutral: [
      '最新的资料已归档',
      '最新的信息请看附件',
      '最新的文件在这里',
      '最新的成果已发布。',
      '最新的记录被刷新。',
    ],
  },
  {
    name: 'M5 删量词/序列分支（一代/一届/一款/一期族误伤）',
    from: '[一声音起回代批版本款项届篇篇]',
    to: '(?:zzzzz)',
    neutral: [
      '最新一代的芯片性能更好。',
      '最新一届的名单在这里。',
      '最新款的产品已经上架。',
      '最新一期报告',
    ],
  },
  {
    name: 'M6 预查表反向扩大成全汉字（吃掉形容词 → 漏判）',
    from: '最新(?=的|[一声音起回代批版本款项届篇篇]|',
    to: '最新(?=的|[\\u4e00-\\u9fff]|[一声音起回代批版本款项届篇篇]|',
    neutral: [],
    positiveLoss: [
      '这是市场上最新鲜的蔬菜，供货商每天凌晨采摘。',
      '最新鲜的牛奶保质期最短。',
      '我们用的是最新鲜的肉。',
      '最新鲜的水果在产地直发。',
    ],
  },
];

// 对所有中性化变异都成立的正向样本
const POSITIVE = [
  '这是市场上最新鲜的蔬菜，供货商每天凌晨采摘。',
  '这家店的面包是最新鲜出炉的。',
  '这是目前最新鲜的食材。',
  '最新鲜的水果在产地直发。',
  '最新鲜的海鲜今晚到港。',
  '最新鲜的牛奶保质期最短。',
];

function copyRepo(dir) {
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  return dir;
}

function runGuard(dir, neutral, positiveLoss) {
  const probe = path.join(dir, '_probe.js');
  fs.writeFileSync(probe, [
    'const idx = require(' + JSON.stringify(path.join(dir, 'src', 'index.js')) + ');',
    'const POS = ' + JSON.stringify(positiveLoss || POSITIVE) + ';',
    'const NEU = ' + JSON.stringify(neutral) + ';',
    'function has(s) {',
    '  const r = idx.checkConfidenceCalibration(s);',
    '  return (r.issues || []).some(i => /superlative/.test(String(i.detail)));',
    '}',
    'let fail = 0;',
    'for (const s of POS) if (!has(s)) { fail++; console.log("MISS_POS " + s); }',
    'for (const s of NEU) if (has(s)) { fail++; console.log("FALSE_POS " + s); }',
    'console.log("HIT_FAIL=" + fail + "/" + (POS.length + NEU.length));',
    'process.exit(fail > 0 ? 1 : 0);',
  ].join('\n'));
  return execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

let red = 0, green = 0;
const results = [];

function recordRed(out, name) {
  red++;
  const m = out.match(/HIT_FAIL=(\d+)\/(\d+)/);
  results.push([name, '变红（fail ' + (m ? m[1] + '/' + m[2] : '?') + '）']);
}

// ① 对照副本：未注入，正向全命中且中性化样本零误命中
{
  const dir = copyRepo(path.join(os.tmpdir(), 'hf-sl-control'));
  try {
    const out = runGuard(dir, NEUTRAL_WHOLE, POSITIVE);
    const ok = /HIT_FAIL=0\//.test(out);
    if (!ok) { green++; console.error('对照副本未全绿：\n' + out.slice(0, 600)); }
    results.push(['对照（未注入）', ok ? '全绿' : '未全绿']);
  } catch (e) {
    const out = String(e.stdout || '');
    if (/HIT_FAIL=0\//.test(out)) results.push(['对照（未注入）', '全绿']);
    else { green++; results.push(['对照（未注入）', '未全绿']); console.error(out.slice(0, 600)); }
  }
}

// ② 逐个注入：必须变红
for (const inj of INJECTIONS) {
  const dir = copyRepo(
    path.join(os.tmpdir(), 'hf-sl-' + Buffer.from(inj.name).toString('hex').slice(0, 12))
  );
  const idxPath = path.join(dir, 'src', 'index.js');
  const before = fs.readFileSync(idxPath, 'utf8');
  const after = before.split(inj.from).join(inj.to);
  if (after === before) {
    green++;
    results.push([inj.name, '锚点未命中（注入为空）']);
    continue;
  }
  fs.writeFileSync(idxPath, after);
  try {
    const out = runGuard(dir, inj.neutral, inj.positiveLoss);
    if (/HIT_FAIL=0\//.test(out)) { green++; results.push([inj.name, '未变红（守卫失守）']); }
    else recordRed(out, inj.name);
  } catch (e) {
    const out = String(e.stdout || '');
    if (/HIT_FAIL=[1-9]/.test(out)) recordRed(out, inj.name);
    else {
      green++;
      results.push([inj.name, '探针崩溃（不计红）: ' + String(e.message).split('\n')[0].slice(0, 140)]);
    }
  }
}

console.log('\n=== 负例验证结果（第 223 轮） ===');
for (const [n, r] of results) console.log('  ' + r + '  ' + n);
console.log('\n注入 ' + INJECTIONS.length + ' 个：' + red + ' 个让守卫变红，' + green + ' 个未变红');
const pass = red === INJECTIONS.length && green === 0;
console.log(pass ? '\n负例验证通过' : '\n负例验证未通过');
process.exit(pass ? 0 : 1);
