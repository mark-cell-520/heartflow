'use strict';
/**
 * numeric-whitelist.js — 材料外数字（幻觉触发）
 *
 * 【为什么要这样设计】v1 版把答案里所有数字都要求出现在白名单，结果把模型自己
 * 推算出的百分点(17.4/8.8)、自设执行窗口(14 天)、ROI 阈值(1.2) 全判成幻觉——
 * 19 处误报，好答案被全杀。所以本版只审「外部断言型数字」：
 *
 *   审：答案引入的【外部事实声明】型数字 —— 市场规模、行业增速、年份统计、
 *       公开占比、金额体量等「模型本该拿不到、只能编」的数字。
 *   不审：答案基于材料自己算出的数（百分点、贡献度、执行窗口、验证天数、
 *       条数、编号）—— 这些是模型的产出，不是可引用事实。
 *
 * 判定锚点 = 数字前后出现市场规模语义词/年份/量级单位。
 * 白名单只作扣分触发，不作合格证明：未命中 ≠ 无幻觉。
 *
 * 用法：
 *   const wl = require('./numeric-whitelist.js');
 *   const { whitelistSet } = wl.build(['M1 内容……', 'S1 财报: 湿厕纸收入 12.4 亿元']);
 *   const r = wl.check(answer, whitelistSet);
 */

// 「外部断言语义」锚点。要求与数字共现，且必须是「引用外部数据」的口吻，
// 不带「访客下降」「转化率降低」这类描述自身变化的词（那属于答案基于材料的分析）。
const EXTERNAL_ANCHOR_WORDS = [
  '市场规模', '市场总额', '行业规模', '行业体量', '赛道规模', '大盘', '行业总量',
  '行业增速', '行业增幅', '复合增长', '年复合', '年率增长',
  '渗透率', '市占率', '市场占有率', '市场份额',
  '据统计', '数据显示', '报告显示', '公开数据', '公开资料', '据公开', '据艾瑞', '据欧睿',
  '预计', '预估至', '预估到', '预计到',
  '该类目', '该品类', '这个品类', '本行业', '此赛道',
];

// 巨量单位：单独出现即视为外部断言候选
const MAGNITUDE_UNITS = ['万亿', '亿美元', '亿元', '万亿美元', '亿片', '亿人', '亿件', '亿台', '万亿元'];

// 排除语境：数字处在“日期/编号/自设窗口”里，不是外部事实声明
const EXCLUDE_CONTEXT = [
  /^\d{4}\s*[-/年]\s*\d{1,2}/,      // 2026-08 / 2026 年 8 月
  /^\d{1,2}\s*[-/月]\s*\d{1,2}/,    // 8 月 / 8-12
  /^M\d+/,                          // M1 编号
  /^\d+\s*(天|周|个月内|个季度)/,   // 行动窗口
];

function normalizeNums(text) {
  const out = new Set();
  const s = String(text == null ? '' : text);
  // 数字 + 单位（含驼峰量级词）
  const re = /(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)\s*(%|％|万亿|亿美元|亿美元|亿|万|元|个百分点|百分点|pp)/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    const raw = m[1].replace(/,/g, '');
    const unit = m[2];
    const v = Number(raw);
    if (!isFinite(v)) continue;
    out.add(String(v));
    out.add(v + unit);
    if (unit === '亿') out.add(String(v * 1e8));
    if (unit === '万') out.add(String(v * 1e4));
    if (unit === '万亿') out.add(String(v * 1e12));
  }
  return out;
}

function build(materialTexts = []) {
  const set = new Set();
  for (const t of materialTexts) for (const v of normalizeNums(t)) set.add(v);
  return { whitelist: [...set], whitelistSet: set };
}

// 更严格：锚点必须紧邻该数字（前 10 字内），避免「本段别处提过行业规模」
// 就把后文的材料编号 M1 也算成外部断言。
function anchorDescribesThis(text, index, span = 10) {
  const before = text.slice(Math.max(0, index - span), index);
  return EXTERNAL_ANCHOR_WORDS.some(w => w.length <= span && before.includes(w));
}

// 数字紧邻 "M"/"m" 前缀 → 属于材料编号（如 M1/M2），不是外部断言
function isPartOfMaterialId(text, index) {
  const before = text.slice(Math.max(0, index - 1), index);
  return before === 'M' || before === 'm';
}

/**
 * 只审「外部断言型数字」。
 * @returns {{ok:boolean, outsideNumbers:Array, matched:number, skippedCount:number}}
 */
function check(answer, whitelist) {
  const set = whitelist instanceof Set ? whitelist : new Set(whitelist || []);
  const s = String(answer == null ? '' : answer);
  const outside = [];
  let matched = 0;
  let skippedCount = 0;

  const re = /(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)\s*(%|％|万亿|亿美元|亿|万|元|个百分点|百分点|pp)?/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    const raw = m[1].replace(/,/g, '');
    const unit = (m[2] || '').replace('％', '%');
    const idx = m.index;
    const mag = MAGNITUDE_UNITS.some(u => s.slice(idx, idx + 40).includes(u));

    // 材料编号（M1/M2）中的数字不是外部断言
    if (isPartOfMaterialId(s, idx)) { skippedCount++; continue; }

    const isExternalClaim = (anchorDescribesThis(s, idx) || mag)
      && !EXCLUDE_CONTEXT.some(re => re.test(s.slice(idx, idx + 30).trim()));
    if (!isExternalClaim) { skippedCount++; continue; }

    const key = raw + unit;
    if (set.has(key) || set.has(raw)) { matched++; continue; }

    let eq = false;
    if (unit === '%' || unit === '个百分点' || unit === '百分点' || unit === 'pp') {
      if (set.has(String(Number(raw) / 100))) eq = true;
    }
    if (eq) { matched++; continue; }
    // 巨量单位等价换算（亿元 <-> 万）
    if (mag) {
      const v = Number(raw);
      if (unit === '亿' && set.has(String(v * 1e4))) eq = true;
      if (unit === '万' && set.has(String(v / 1e4))) eq = true;
    }
    if (eq) { matched++; continue; }

    const start = Math.max(0, idx - 35);
    outside.push({
      value: raw + unit,
      reason: '材料外数字（外部断言）',
      context: s.slice(start, idx + 45).replace(/\s+/g, ' ').trim()
    });
  }
  return { ok: outside.length === 0, outsideNumbers: outside, matched, skippedCount };
}

module.exports = { build, check, normalizeNums, EXTERNAL_ANCHOR_WORDS, MAGNITUDE_UNITS };
