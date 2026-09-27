#!/usr/bin/env node
/**
 * v6.7.126 第 119 轮：src/index.js 模式表顶层 | 未分组扫描器
 *
 * 背景（第 115 轮移交）：第 117 轮曾在 patch 时把 `\\b` 双写进正则，
 * 根因是人工在多支竖线表里插行时漏了分组括号。根治手段是扫描器——
 * 找出所有正则字面量/选择分支里「顶层未分组」的 |，逐支 A/B 验证。
 *
 * 判定方法：对每个匹配到的正则字符串，用括号深度逐字符扫描。
 * 深度 0 处出现的裸 | = 顶层未分组（候选）。若整个表达式本就是
 * 单个字符类/锚点序列，可能无害；但只要存在「多 char 分支 + 顶层 |」
 * 就该人工看。
 */
'use strict';
const fs = require('fs');
const path = require('path');

const target = process.argv[2] || path.join(__dirname, '..', 'src', 'index.js');
const src = fs.readFileSync(target, 'utf8');
const lines = src.split('\n');

/** 扫描一个正则表达式字符串，返回顶层裸 | 的位置 */
function scanTopLevelPipes(expr) {
  const pos = [];
  let depth = 0;
  let inClass = false;
  for (let i = 0; i < expr.length; i++) {
    const c = expr[i];
    if (c === '\\') { i++; continue; }        // 跳过转义
    if (inClass) { if (c === ']') inClass = false; continue; }
    if (c === '[') { inClass = true; continue; }
    if (c === '(') { depth++; continue; }
    if (c === ')') { if (depth > 0) depth--; continue; }
    if (c === '|' && depth === 0) pos.push(i);
  }
  return pos;
}

/** 从一行里抽出所有 /.../flags 字面量 */
function extractRegexLiterals(line) {
  const out = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '/' && (i === 0 || /[(=,:;\s!&|?+*[-]/.test(line[i - 1]))) {
      // 尝试从这里开始解析一个正则字面量
      let j = i + 1;
      let inClass = false;
      let closed = false;
      while (j < line.length) {
        const c = line[j];
        if (c === '\\') { j += 2; continue; }
        if (inClass) { if (c === ']') inClass = false; j++; continue; }
        if (c === '[') { inClass = true; j++; continue; }
        if (c === '/') { closed = true; break; }
        j++;
      }
      if (closed) {
        const body = line.slice(i + 1, j);
        // 排除明显是除法/注释的情况：body 里不能有空或换行
        if (body.length > 0 && !/\n/.test(body)) {
          out.push({ body, col: i });
          i = j + 1;
          continue;
        }
      }
    }
    i++;
  }
  return out;
}

let found = 0;
const report = [];
for (let ln = 0; ln < lines.length; ln++) {
  const line = lines[ln];
  if (!line.includes('|')) continue;
  if (/^\s*(\/\/|\*)/.test(line)) continue;   // 注释行跳过
  for (const lit of extractRegexLiterals(line)) {
    const pipes = scanTopLevelPipes(lit.body);
    if (pipes.length > 0) {
      found++;
      report.push({
        line: ln + 1,
        col: lit.col,
        pipes: pipes.length,
        body: lit.body.length > 120 ? lit.body.slice(0, 117) + '...' : lit.body,
      });
    }
  }
}

console.log(`扫描目标: ${target}`);
console.log(`顶层未分组 | 的正则: ${found} 个\n`);
for (const r of report) {
  console.log(`  L${r.line} (${r.pipes} 支) | ${r.body}`);
}
console.log(`\n结论: ${found === 0 ? '未分组全表体检无发现' : found + ' 个候选需 A/B 人工判定'}`);
