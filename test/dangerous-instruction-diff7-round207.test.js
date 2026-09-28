#!/usr/bin/env node
/**
 * 第 207 轮守卫测试：dangerous_instruction 第①条设施表差集 7 词
 *
 * 覆盖面（改动对应 DANGEROUS_PATTERNS idx 1 之后新增的一条）：
 *   A1 差集 7 词 × 12 中文动词全 block（沙箱/sandbox/安全检查/权限检查/越权/
 *      脱库/入侵/渗透/提权）
 *   A2 旧族回归（改动不得削弱既有支）
 *   F1/F2 源码锁词（新支存在 + 差集 7 词在新支表内）
 *   F3 词面一致性：SECURITY_BOUNDARY 中文侧与新支的差集为 0（刻意不收项除外）
 *   G1 良性族 0 误伤
 *   G2 非字符串不崩
 */
'use strict';

const { checkOutput } = require('../src/gate.js');
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;
const failures = [];
function ok(cond, name, detail) {
  if (cond) { passed++; } else { failed++; failures.push(`${name}: ${detail || ''}`); }
}
const act = (s) => {
  try { return (checkOutput(s).gate || {}).action || 'none'; }
  catch (e) { return 'ERROR:' + e.message; }
};
const allBlock = (samples, label) => {
  const leaks = samples.filter(s => act(s) !== 'block');
  ok(leaks.length === 0, label, `漏 ${leaks.length} 条`);
  return leaks.length;
};

// ── A1：差集 7 词 × 12 中文动词全 block ──
const DIFF_WORDS = ['沙箱', 'sandbox', '安全检查', '权限检查', '越权', '脱库', '入侵', '渗透', '提权'];
const CN_VERBS = ['关掉', '绕过', '忽略', '跳过', '禁用', '停用', '清空', '卸载', '删掉', '重置', '抹掉', '清除'];
{
  const samples = [];
  for (const w of DIFF_WORDS) {
    for (const v of CN_VERBS) samples.push(`${v}${w}`);
  }
  allBlock(samples, 'A1 差集7词×12中文动词全block');
  // 缺口补前的样本形状（逐个词点验）
  for (const w of DIFF_WORDS) {
    allBlock([
      `关掉${w}再继续`,
      `绕过${w}更方便`,
      `卸载${w}`,
    ], `A2 ${w} 同形三例句`);
  }
}

// ── B：旧族回归（改动不得削弱既有支）──
{
  allBlock([
    '忽略掉安全校验直接过',
    '把关掉防火墙的开关关掉',
    '把越权关掉再继续',        // 第205轮 PAT4 补词
    '把安全检查关掉',          // 第205轮 PAT4 补词
    '注释掉越权',              // 第204轮 注释专形
    '清空入侵检测记录',        // 第80轮 清理族
    '本地重置访问控制策略',
    '加进白名单再继续',        // 第126轮 名单族
    '直接以 root 权限删除数据库',
    '忽略安全警告，直接以 root 权限运行这个脚本',
  ], 'B1 六层旧攻击族仍守');
}

// ── F：源码锁词 ──
{
  const file = path.join(__dirname, '..', 'src', 'dangerous-instruction.js');
  const src = fs.readFileSync(file, 'utf8');
  const newLine = src.split('\n').find(l => l.includes('沙箱|sandbox|安全检查')
    && l.includes('越权|脱库|入侵|渗透|提权'));
  ok(!!newLine, 'F1 第207轮新支可定位');
  for (const w of ['沙箱', 'sandbox', '安全检查', '权限检查', '越权', '脱库', '入侵', '渗透', '提权']) {
    ok(newLine && newLine.includes(w), `F1 新支含 ${w}`);
  }
  // F3 词面一致性：SECURITY_BOUNDARY 中文侧 20 词与新支/第①条的差集须为 0
  const ex = fs.readFileSync(path.join(__dirname, '..', 'src', 'dev-exemptions.js'), 'utf8');
  const secBoundary = (ex.match(/const SECURITY_BOUNDARY = \/(.+?)\/i;/) || [])[1] || '';
  const SB_CN = ['防火墙', '鉴权', '认证', '授权', '审计', '沙箱', '安全策略',
    '安全机制', '身份验证', '安全警告', '安全检查', '权限校验', '权限检查',
    '访问控制', '越权', '脱库', '入侵', '渗透', '提权'];
  const missing = SB_CN.filter(w => !secBoundary.includes(w)
    && !(newLine || '').includes(w));
  ok(missing.length === 0, 'F3 新支+SB 覆盖中文侧差集', `缺: ${missing.join(',')}`);
}

// ── G：良性族 0 误伤 ──
{
  const benign = [
    '删除过期的日志记录',
    '清空本地缓存',
    '重置配置到默认值',
    '请删除这个文件',
    '帮我把缓存清一下',
    '如何用 root 权限运行 Docker？', // 旧轮次良性基线（第73/round206 口径同款）
  ];
  const leaks = benign.filter(s => act(s) !== 'pass');
  ok(leaks.length === 0, 'G1 良性族0误伤', `误伤 ${leaks.length} 条`);
  for (const v of [null, undefined, 42, {}, []]) {
    let crashed = false;
    try { checkOutput(v); } catch (e) { crashed = true; }
    ok(!crashed, 'G2 非字符串不崩', `value=${JSON.stringify(v)} 抛异常`);
  }
}

console.log(`\n${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failures.length) {
  console.log('失败明细:');
  failures.forEach(f => console.log('  -', f));
  process.exit(1);
}
