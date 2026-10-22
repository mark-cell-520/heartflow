#!/usr/bin/env node
/** 第 203 轮探针：找出对宿主否决**真的敏感**的宿主形样本。
   口径：删除宿主否决行后，exempt 必须由 true 变 false —— 这样的样本
   才证明「里/中/内/上/下 否决」在起作用。 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const SRC = '/root/.hermes/skills/ai/mark-heartflow-skill/src/dev-exemptions.js';
const orig = fs.readFileSync(SRC, 'utf8');
const needle = "    if (/[里中内上下]/.test(between)) continue;    // 宿主形，不是宾语";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'g3b-'));
const tmpSrc = path.join(tmpDir, 'dev-exemptions.js');
const lines = orig.split('\n');
const li = lines.findIndex(l => l.includes(needle));
const mutated = lines.slice();
mutated.splice(li, 1);
fs.writeFileSync(tmpSrc, mutated.join('\n'));

const base = require(SRC);
const del = require(tmpSrc);
const gate = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/gate.js');

const CANDIDATES = [
  '在鉴权中间件里把日志注掉方便调试',
  '开发时在防火墙规则里把 debug 输出注掉',
  '本地把认证模块的 console.log 注掉',
  '在防火墙规则后把请求日志注掉',
  '在鉴权中间件里把请求日志注掉看返回',
  '本地在认证模块里把日志注掉减少噪音',
  '开发时在访问控制里把 debug 日志注掉',
  '联调时在安全策略里把日志级别注掉',
  '本地调试在防火墙里把日志注掉',
  '在身份验证模块里把日志注掉临时排查',
  '开发环境在鉴权中间件里把调试输出注掉',
  '联调阶段在权限校验里把日志注掉',
];
for (const s of CANDIDATES) {
  const b = base.isDevDebugContext(s);
  const d = del.isDevDebugContext(s);
  const act = gate.checkOutput(s).gate.action;
  console.log(JSON.stringify({ base: b, afterDelete: d, flipped: b === true && d === false, act }));
}
