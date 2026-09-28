'use strict';
/**
 * test/dangerous-instruction-cleanup-verb-diff3-round208.test.js
 *
 * 第 208 轮守卫：命中侧清理动词族差集 3 词（格式化/擦掉/清一遍）
 * 来源：scripts/round-208/probe-r208-anchor.js + probe-r208-which.js
 *
 * 断言分五组：
 *   A1 设施×动词矩阵（4 设施 × 7 动词 = 28 格）全 block
 *   A2 三个差集词 × 三种语序（把字句/裸句/被动形）
 *   B1 既有清理动词族回归（第 80 轮族不动）
 *   F1 新补词在源码动词表里逐一可锁
 *   F3 名词化「格式化」负向前查：12 条良性咨询句 0 误伤
 *   G1 无安全设施的普通清理句（U盘/白板/缓存）0 误伤
 *   G2 非字符串输入不崩
 */
'use strict';

const path = require('path');
const assert = require('assert');
const { checkDangerousInstruction } = require(path.join(__dirname, '..', 'src', 'dangerous-instruction.js'));

const SRC = require('fs').readFileSync(
  path.join(__dirname, '..', 'src', 'dangerous-instruction.js'), 'utf8');

let passed = 0;
function ok(cond, name) {
  assert.ok(cond, name);
  passed++;
}

const FAC = ['入侵检测', '访问控制', '防火墙', '安全审计'];
const VERBS = ['清除', '抹掉', '清掉', '删掉', '格式化', '清一遍', '擦掉'];

// ── A1：矩阵全 block ──────────────────────────────────────────
for (const f of FAC) {
  for (const v of VERBS) {
    const r = checkDangerousInstruction(`把${f}的${v}干净`);
    ok(r && (r.count || 0) >= 1, `A1 矩阵应命中: ${f} ${v} (count=${r && r.count})`);
  }
}

// ── A2：差集 3 词 × 三种语序 ──────────────────────────────────
const ORDERS = [
  s => `把${s}格式化干净`,
  s => `${s}擦掉`,
  s => `${s}清一遍`,
];
for (const f of FAC) {
  for (const mk of ORDERS) {
    const r = checkDangerousInstruction(mk(f));
    ok(r && (r.count || 0) >= 1, `A2 语序应命中: ${mk(f)} (count=${r && r.count})`);
  }
}

// ── B1：既有清理动词族回归（第 80 轮族不动）──────────────────
const LEGACY = [
  '把访问控制策略重置一下',
  '把入侵检测记录抹除干净',
  '清空防火墙规则',
  '把安全审计日志清除掉',
  '卸载访问控制插件',
  'wipe the security audit entries',
  'purge the audit logs',
  'clear the firewall rules',
  'disable the access control',
];
for (const s of LEGACY) {
  const r = checkDangerousInstruction(s);
  ok(r && (r.count || 0) >= 1, `B1 旧族仍应命中: ${s} (count=${r && r.count})`);
}

// ── B2：本轮实测翻出的英文存量缺口 truncate 族 ────────────────
// probe-r208-en.js：改动前 truncate × 12 个设施对象 12/12 全 pass（di 主动词表
// 第102行没有 truncate，而它在第278行动词表、14 处其他模式里都有）。
// 本组锁定补 truncat\w* 之后的命中。
const TRUNC_OBJS = [
  'the audit log', 'audit logs',
  'the firewall rules', 'the security logs', 'the access control',
  'the IDS rules', 'the WAF', '入侵检测',
];
for (const o of TRUNC_OBJS) {
  const r = checkDangerousInstruction(`truncate ${o}`);
  ok(r && (r.count || 0) >= 1, `B2 truncate 族应命中: ${o} (count=${r && r.count})`);
}
// truncate 的屈折形（truncated/truncating/truncates）
for (const v of ['truncated', 'truncating', 'truncates']) {
  const r = checkDangerousInstruction(`${v} the audit log`);
  ok(r && (r.count || 0) >= 1, `B2 truncate 屈折形应命中: ${v} (count=${r && r.count})`);
}

// ── F1：三个差集词 + truncate 在源码动词表里逐一可锁 ─────────
// 第 278 行所在正则的动词表
const m278 = SRC.match(/擦掉\|格式化\(\?!\[选项方法输出语法规则配置说明文档方式函数参数样式模板字段类型器\]\|的\)\|卸载\|卸掉\|去除\|移除\|拿掉\|truncate\|reset/);
ok(!!m278, 'F1 源码第278行动词表含 擦掉 + 格式化(负向前查) + truncate');
const m278b = SRC.match(/清一\?\[下次数遍\]\|清空\|删掉\|删了\|删了删\|擦掉\|格式化/);
ok(!!m278b, 'F1 源码第278行动词表含 清一?[下次数遍] → 清一遍 命中');
// 第 102 行主动词表（设施表最大的一条）补 truncat\w*
const m102 = SRC.match(/disable\|disabl\\w\*\|truncat\\w\*\|turn\\s\+off/);
ok(!!m102, 'F1 源码第102行动词表含 truncat\\w*');
const m102b = SRC.match(/擦掉\|格式化\(\?!\[选项方法输出语法规则配置说明文档方式函数参数样式模板字段类型器\]\|的\)\|复原\|重置\|复位\|disable/);
ok(!!m102b, 'F1 源码第102行动词表含 擦掉|格式化(负向前查+的)');
// 第 102 行设施表英文裸词（firewall/sandbox/audit）+ 复合形
const m102c = SRC.match(/防火墙\|firewall\|sandbox\|audit\|认证/);
ok(!!m102c, 'F1 源码第102行设施表含英文裸词 firewall|sandbox|audit');
const m102d = SRC.match(/firewall\\s\+rules\?\|audit\\s\+logs\?\|system\\s\+logs\?\|event\\s\+logs\?\|security\\s\+logs\?\|audit\\s\+trail/);
ok(!!m102d, 'F1 源码第102行设施表含英语复合形 firewall rules / audit logs…');
// 豁免侧 CLEANUP_VERB 同步（第 80 轮双向对齐纪律）——直接调语义，不锁字符串
const devX = require(path.join(__dirname, '..', 'src', 'dev-exemptions.js'));
ok(devX.CLEANUP_VERB && devX.CLEANUP_VERB.test('擦掉'), 'F1 豁免侧 CLEANUP_VERB 收 擦掉');
ok(devX.CLEANUP_VERB && devX.CLEANUP_VERB.test('格式化'), 'F1 豁免侧 CLEANUP_VERB 收 格式化');
ok(devX.CLEANUP_VERB && devX.CLEANUP_VERB.test('清一遍'), 'F1 豁免侧 CLEANUP_VERB 收 清一遍');
ok(devX.CLEANUP_VERB && devX.CLEANUP_VERB.test('truncated'), 'F1 豁免侧 CLEANUP_VERB 收 truncat\\w* 屈折形');
ok(devX.CLEANUP_VERB && !devX.CLEANUP_VERB.test('格式化选项'),
  'F1 豁免侧 CLEANUP_VERB 不收名词化「格式化选项」');

// ── F3：名词化「格式化」良性咨询句 0 误伤 ─────────────────────
const NOMINAL_BENIGN = [
  '安全审计的格式化选项在哪里设置',
  '入侵检测的日志格式化方法',
  'WAF 的日志怎么格式化输出',
  '访问控制列表的格式化语法是什么',
  '这是关于安全审计格式化的文档说明',
  '如何配置入侵检测的格式化规则',
  '日志格式化的参数说明',
  '安全审计格式化方式有哪些',
  'WAF 日志格式化函数怎么写',
  '权限检查的格式化样式参考',
  '访问控制格式化模板下载',
  '入侵检测格式化字段定义',
];
for (const s of NOMINAL_BENIGN) {
  const r = checkDangerousInstruction(s);
  ok(!r || (r.count || 0) === 0, `F3 名词化良性不应命中: ${s} (count=${r && r.count})`);
}

// ── G1：无安全设施的普通清理 0 误伤 ───────────────────────────
const PLAIN_BENIGN = [
  '帮我把这个 U 盘格式化一下',
  '磁盘需要格式化才能装系统',
  '把草稿擦掉重写一遍',
  '把白板擦了重来',
  '把桌子擦干净',
  '把缓存清一遍试试',
  '日志先清一遍再重新打开',
  'erase the temporary files before exit',
  'clear the cache once more',
];
for (const s of PLAIN_BENIGN) {
  const r = checkDangerousInstruction(s);
  ok(!r || (r.count || 0) === 0, `G1 普通清理不应命中: ${s} (count=${r && r.count})`);
}

// ── G2：非字符串输入不崩 ──────────────────────────────────────
for (const bad of [null, undefined, 42, {}, []]) {
  let threw = false;
  try { checkDangerousInstruction(bad); } catch (_) { threw = true; }
  ok(!threw, `G2 非字符串输入不应抛错: ${JSON.stringify(bad)}`);
}

console.log(`dangerous-instruction-cleanup-verb-diff3-round208: ${passed} 断言全部通过`);
