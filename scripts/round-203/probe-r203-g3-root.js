#!/usr/bin/env node
/** 第 203 轮探针：为什么宿主否决删掉后这些样本仍 exempt？
   根因假设：这些样本 exempt 走的是**别的路径**（三交集/devCtx×target×verb），
   第二循环的宿主否决根本没被触发（因为 SEC_BOUNDARY 在 between 里就没匹配到，
   或动词前向窗口里没有把/将）。 */
const fs = require('fs');
const path = require('path');

const SRC = '/root/.hermes/skills/ai/mark-heartflow-skill/src/dev-exemptions.js';
const src = fs.readFileSync(SRC, 'utf8');
const SEC_OBJ_VERB = eval(src.match(/const SEC_OBJ_VERB = ([^;]+);/)[1]);
const SEC_BOUNDARY_G = eval('new RegExp(' + JSON.stringify(
  eval(src.match(/const SECURITY_BOUNDARY = ([^;]+);/)[1]).source) + ', "gi")');

const SAMPLES = [
  '在鉴权中间件里把日志注掉方便调试',
  '本地在认证模块里把日志注掉减少噪音',
  '开发时在访问控制里把 debug 日志注掉',
  '联调时在安全策略里把日志级别注掉',
  '本地调试在防火墙里把日志注掉',
];
for (const s of SAMPLES) {
  const clips = [];
  for (const vm of s.matchAll(SEC_OBJ_VERB)) {
    const before = s.slice(Math.max(0, vm.index - 24), vm.index);
    const ba = before.search(/[把將]/);
    const between = ba >= 0 ? before.slice(ba + 1) : null;
    const secHits = between ? [...between.matchAll(SEC_BOUNDARY_G)].map(m => m[0]) : null;
    clips.push({ verb: vm[0], hasBa: ba >= 0, between, secHits });
  }
  console.log(JSON.stringify({ clips }));
}
