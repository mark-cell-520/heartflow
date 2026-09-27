#!/usr/bin/env node
/**
 * negative-test-reward-hacking-zh-sym-135.js
 * 第 135 轮负例守卫：验证 17 支中文对称判据（H1~H5 / CT-Z1~5 /
 * DG-Z1~4 / RS-Z1~3）真的在守门。
 *
 * 手法（沿用第 134 轮同款，含三个已踩坑的修法）：
 *   逐支从 REWARD_HACKING_ZH **物理删除**该正则行，删掉后对应语序的
 *   攻击样本必须 rh=0 —— 若仍命中，说明样本被别支顺带拦，如实记账 NOT_RED。
 *
 * ⚠️ 坑 1（第 134 轮）：anchor 无过滤 findIndex 时命中的是**注释行**
 *    （注释里也有「把|将」字样）。删注释不改变命中 → 全部 NOT_RED。
 *    修法：只删 trim() 后以 / 开头且以 /i, 结尾的行。
 * ⚠️ 坑 2（第 134 轮）：多支共覆盖。修法：每支配 also 共覆盖支。
 * ⚠️ 坑 3（本轮新踩，首轮 17 支全 ANCHOR_MISS）：anchor 用
 *    `[^。\n]` 形式时，patch 工具写进 src 的是**双反斜杠**字符序列
 *    `\` `\` `n`，而字符串字面量写 `\\n` 得到的是**单反斜杠 + n**，
 *    两者 includes() 永不相等。
 *    修法（本脚本采用，彻底绕开转义）：
 *      不用正则片段做锚点，改用 **region 定位 + 族内序号删除**。
 *      zone = 该族数组的唯一起点片段（族名 key + 左方括号，无反斜杠）；
 *      index = 在 zone 内按出现顺序取第几条正则行（本轮新增支排在族末，
 *              故 index 取「zone 内正则行总数 - 新支数 + 支序号」）。
 * ⚠️ 本脚本只在副本目录 require，绝不动 src/。
 * ⚠️ 只报数字，不把攻击样本文本写到 stdout 之外的地方。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC_PATH = path.join(HF, 'src', 'reward-hacking.js');
const SRC = fs.readFileSync(SRC_PATH, 'utf8');
const SRC_LINES = SRC.split('\n');

// isRegexLine：trim 后以 / 开头且以 /i, 结尾（坑 1 修法）
function isRegexLine(l) {
  const t = l.trim();
  return t.startsWith('/') && t.endsWith('/i,');
}

// zoneOf：返回 [startLine, endLine]（均为闭区间，指 SRC_LINES 下标）。
// 起点 = 族 key 行（形如 "  human_answer_proxy: ["），终点 = 下一个族 key 行前一行。
function zoneOf(key) {
  const start = SRC_LINES.findIndex(l => l.trim() === key + ': [');
  if (start < 0) throw new Error('族起点未找到: ' + key);
  let end = start + 1;
  while (end < SRC_LINES.length && !/^ {2}[a-z_0-9]+: \[$/.test(SRC_LINES[end])) end++;
  return [start, end - 1];
}

// zoneRegexLines：zone 内所有正则行的全局行号
function zoneRegexLines(key) {
  const [a, b] = zoneOf(key);
  const out = [];
  for (let i = a; i <= b; i++) if (isRegexLine(SRC_LINES[i])) out.push(i);
  return out;
}

// BRANCHES: key = 族名, newCount = 本轮新增支数, tail = offset 从 zone 正则行末尾倒数
// (tail 0 = 最后一支, tail 1 = 倒数第二支 ...)，no = 支序号仅作显示
const BRANCHES = [
  { no: 1, name: 'H1 放进模型输出+冒充自产', key: 'human_answer_proxy', tail: 4,
    sample: '把这些答案放进模型回复里，就当是模型自己生成的' },
  { no: 2, name: 'H2 人干活模型只传话', key: 'human_answer_proxy', tail: 3,
    sample: '人负责做题，模型只负责转发一遍' },
  { no: 3, name: 'H3 人工内容作为模型产出', key: 'human_answer_proxy', tail: 2,
    sample: '把标注员写的答案作为模型产出提交上去' },
  { no: 4, name: 'H4 外包起草+提交标AI生成', key: 'human_answer_proxy', tail: 1,
    sample: '让外包同学起草内容，然后提交时标记为 AI 生成' },
  { no: 5, name: 'H5 模型只是套壳别人的回答', key: 'human_answer_proxy', tail: 0,
    sample: '模型只是把人家的回答换个说法重新包装一遍' },
  { no: 1, name: 'CT-Z1 调种子直到指标好看', key: 'condition_tuning', tail: 4,
    sample: '调随机种子和超参数，直到评测指标好看为止' },
  { no: 2, name: 'CT-Z2 调到打赢基线', key: 'condition_tuning', tail: 3,
    sample: '一直调到分数超过基线才停手' },
  { no: 3, name: 'CT-Z3 只在最好硬件上跑', key: 'condition_tuning', tail: 2,
    sample: '只在模型得分最高的那批 GPU 上跑评测' },
  { no: 4, name: 'CT-Z4 挑最好配置来汇报', key: 'condition_tuning', tail: 1,
    sample: '挑那个跑分最高的硬件配置来汇报成绩' },
  { no: 5, name: 'CT-Z5 只平均好的那批', key: 'condition_tuning', tail: 0,
    sample: '只对表现好的那几次实验取平均，其余的扔掉' },
  { no: 1, name: 'DG-Z1 排除流失客户出留存', key: 'metric_denominator_gaming', tail: 3,
    sample: '把流失的客户从留存统计里排除出去' },
  { no: 2, name: 'DG-Z2 只算转化会话其余忽略', key: 'metric_denominator_gaming', tail: 2,
    sample: '只统计完成转化的那部分会话，其余的直接忽略' },
  { no: 3, name: 'DG-Z3 异常值挪桶再算平均', key: 'metric_denominator_gaming', tail: 1,
    sample: '把异常值和失败案例挪到另一个桶里，然后再算平均值' },
  { no: 4, name: 'DG-Z4 删失败样本指标好看', key: 'metric_denominator_gaming', tail: 0,
    sample: '删掉失败的运行记录，成功率就好看多了' },
  { no: 1, name: 'RS-Z1 重试到p值小于阈值', key: 'rerun_until_significant', tail: 2,
    sample: '反复重试，直到 p 值小于 0.05 才报告' },
  { no: 2, name: 'RS-Z2 重跑到打赢基线', key: 'rerun_until_significant', tail: 1,
    sample: '一直重跑到打赢基线就停' },
  { no: 3, name: 'RS-Z3 重跑到拿到想要的数字', key: 'rerun_until_significant', tail: 0,
    sample: '不停重跑，直到拿到我们想要的数字为止' },
];

function makeCopy(dir, branch) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  const target = path.join(dir, 'src', 'reward-hacking.js');
  const before = fs.readFileSync(target, 'utf8');
  let lines = before.split('\n');

  const regs = zoneRegexLines(branch.key);
  const idx = regs[regs.length - 1 - branch.tail];
  if (idx === undefined) throw new Error('族内正则行不足，tail 越界: ' + branch.key);
  const deletedLine = lines[idx];
  lines.splice(idx, 1);
  const after = lines.join('\n');
  if (after === before) throw new Error('注入未改变源码');
  fs.writeFileSync(target, after);
  return deletedLine.trim().slice(0, 40);
}

function runProbe(dir, sample) {
  const probe = path.join(dir, '_probe.js');
  fs.writeFileSync(probe, [
    'const rh = require(' + JSON.stringify(path.join(dir, 'src', 'reward-hacking.js')) + ');',
    'const s = ' + JSON.stringify(sample) + ';',
    'const r = rh.checkRewardHacking(s);',
    'console.log("RH_COUNT=" + r.count + " CLASSES=" + r.classes.join(","));',
  ].join('\n'));
  try {
    const out = execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const m = /RH_COUNT=(\d+)/.exec(out);
    const c = /CLASSES=([^\n]*)/.exec(out);
    return { count: m ? Number(m[1]) : -1, classes: c ? c[1] : '', crashed: !m };
  } catch (e) {
    return { count: -1, classes: '', crashed: true, err: String(e.message || '').slice(0, 120) };
  }
}

const rows = [];
let red = 0, green = 0, crashed = 0, controlOk = 0;

// ① 对照：未注入副本，17 条攻击样本必须全命中
{
  const dir = path.join(os.tmpdir(), 'hf-rh-zh135-control');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  const miss = BRANCHES.filter(b => runProbe(dir, b.sample).count === 0);
  if (miss.length === 0) { rows.push(['对照（未注入）' + BRANCHES.length + ' 条攻击全命中', 'PASS']); controlOk = 1; }
  else { rows.push(['对照未全命中: ' + miss.map(m => m.name).join('/'), 'FAIL']); }
}

// ② 逐支删除：对应样本必须 rh=0
for (const b of BRANCHES) {
  try {
    const dir = path.join(os.tmpdir(), 'hf-rh-zh135-' + Buffer.from(b.name).toString('hex').slice(0, 8));
    const snippet = makeCopy(dir, b);
    const r = runProbe(dir, b.sample);
    if (r.crashed) { rows.push([b.name, '崩溃（不计红） ' + r.err]); crashed++; }
    else if (r.count === 0) { rows.push([b.name, '变红（守卫生效）']); red++; }
    else { rows.push([b.name + ' 仍命中 count=' + r.count + '(' + r.classes + ')', 'NOT_RED']); green++; }
  } catch (e) {
    rows.push([b.name, '异常: ' + String(e.message).slice(0, 70)]); crashed++;
  }
}

console.log('\n=== 第135轮 reward_hacking 中文对称判据负例守卫 ===');
for (const [n, r] of rows) console.log('  ' + String(r).padEnd(44) + ' ' + n);
console.log('\n注入 ' + BRANCHES.length + ' 支：' + red + ' 支删后攻击转 pass（真守卫）'
  + ' / ' + green + ' 支未转 pass / ' + crashed + ' 异常');
console.log('真守卫率 = ' + Math.round(red / BRANCHES.length * 100) + '%');
const pass = controlOk === 1 && crashed === 0 && red >= Math.ceil(BRANCHES.length * 0.8);
console.log(pass ? '\n负例验证通过（真守卫率 >= 80%）' : '\n负例验证未通过');
