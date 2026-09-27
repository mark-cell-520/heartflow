/**
 * probe-cjk-wb-round128.js — 第 128 轮隔离探针
 * 逐条实测：CJK 候选在 \b(?:…)\b 下是否真的 0 命中；ASCII 候选是否仍正常命中
 * （证明 \b 是唯一变量）。样本只从本文件读，stdout 只报数字。
 */
const path = require('path');

const CASES = [
  {
    id: 'heart-logic:1531', label: '诊断标签',
    pattern: /\b(你抑郁了|你焦虑|你有心理问题|你疯了|你病了)\b/,
    cjk: ['你抑郁了怎么办', '我觉得你焦虑过度', '你有心理问题吗', '你是不是你疯了', '你病了要休息'],
    ascii: ['你病了', '你疯了'],
  },
  {
    id: 'output-checklist:135', label: '诊断标签2',
    pattern: /\b(你抑郁了|你疯了|你有病)\b/,
    cjk: ['你抑郁了', '你疯了吧', '你有病啊'],
    ascii: [],
  },
  {
    id: 'dream-loop:323', label: '矛盾关键词',
    pattern: /\b(not|never|no|cannot|wrong|false|但|不是|没有|错误|矛盾|反对|否定)\b/i,
    cjk: ['但这不是', '但是没有', '错误发生了', '矛盾出现', '反对这个', '否定它'],
    ascii: ['this is not true', 'never stop', 'absolutely wrong', 'false claim'],
  },
  {
    id: 'dream-loop:332', label: '显著关键词',
    pattern: /\b(version|error|fix|upgrade|dream|memory|logic|truth|升级|错误|修复|记忆|逻辑)\b/i,
    cjk: ['升级完成', '错误修复', '修复逻辑', '记忆升级', '逻辑错误'],
    ascii: ['version 2', 'an error', 'fix it', 'upgrade now', 'dream on'],
  },
  {
    id: 'language-honesty:349', label: '虚假二分',
    pattern: /\b(要么|或者|非此即彼|either.*or|all.*or.*nothing)\b/i,
    cjk: ['要么这样', '或者那样', '非此即彼', '要么A要么B'],
    ascii: ['either this or that', 'all or nothing'],
  },
  {
    id: 'language-honesty:350', label: '绝对词',
    pattern: /\b(通常|一般|always|never|绝对|永远)\b/i,
    cjk: ['通常是', '一般来说', '绝对正确', '永远不会'],
    ascii: ['always late', 'never mind', 'usually fine'],
  },
  {
    id: 'spontaneous-restraint:246', label: '伦理冲突',
    pattern: /\b(伤害|欺骗|操纵|撒谎|kill|deceive|manipulate|lie)\b/i,
    cjk: ['伤害别人', '欺骗他', '操纵数据', '撒谎'],
    ascii: ['kill it', 'deceive him', 'manipulate data', 'lie down'],
  },
  {
    id: 'spontaneous-restraint:247', label: '价值冲突',
    pattern: /\b(是否应该|应不应该|道德|伦理|ethic|moral)\b/i,
    cjk: ['是否应该', '道德吗', '伦理问题', '应不应该'],
    ascii: ['is it ethical', 'moral issue'],
  },
];

// 去掉全局 \b 后的对照版（模拟修复后行为）
function stripBoundaries(p) {
  return new RegExp(p.source.replace(/\\b/g, ''), p.flags);
}

let totalCjk = 0, totalCjkHit = 0, totalAscii = 0, totalAsciiHit = 0, totalFixed = 0, totalFixedHit = 0;
const rows = [];
for (const c of CASES) {
  const fixed = stripBoundaries(c.pattern);
  const cjkHit = c.cjk.filter(s => c.pattern.test(s)).length;
  const asciiHit = c.ascii.filter(s => c.pattern.test(s)).length;
  const fixedHit = c.cjk.filter(s => fixed.test(s)).length;
  totalCjk += c.cjk.length; totalCjkHit += cjkHit;
  totalAscii += c.ascii.length; totalAsciiHit += asciiHit;
  totalFixed += c.cjk.length; totalFixedHit += fixedHit;
  rows.push({
    id: c.id, label: c.label,
    cjk_before: `${cjkHit}/${c.cjk.length}`, ascii_before: `${asciiHit}/${c.ascii.length}`,
    cjk_after_strip: `${fixedHit}/${c.cjk.length}`,
  });
}
console.log(JSON.stringify({ rows, totals: {
  cjk_before: `${totalCjkHit}/${totalCjk}`, ascii_before: `${totalAsciiHit}/${totalAscii}`,
  cjk_after_strip: `${totalFixedHit}/${totalFixed}`,
} }, null, 1));
