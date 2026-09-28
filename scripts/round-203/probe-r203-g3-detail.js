#!/usr/bin/env node
/** 第 203 轮探针：模拟删掉宿主否决后，哪些宿主形会从 exempt 掉回非 exempt。
   做法：按 G3 的 needle 删行到临时副本，再 require 副本。 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const SRC = '/root/.hermes/skills/ai/mark-heartflow-skill/src/dev-exemptions.js';
const orig = fs.readFileSync(SRC, 'utf8');
const needle = "    if (/[里中内上下]/.test(between)) continue;    // 宿主形，不是宾语";
console.log('needle found =', orig.includes(needle));

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'g3-'));
const tmpSrc = path.join(tmpDir, 'dev-exemptions.js');
const lines = orig.split('\n');
const li = lines.findIndex(l => l.includes(needle));
console.log('line index =', li);
const mutated = lines.slice();
mutated.splice(li, 1);
fs.writeFileSync(tmpSrc, mutated.join('\n'));

// dev-exemptions.js 无相对依赖（内部自足），可直接 require 副本
const de = require(tmpSrc);
const gate = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/gate.js');
const HOST = [
  '在鉴权中间件里把日志注掉方便调试',
  '开发时在防火墙规则里把 debug 输出注掉',
  '本地把认证模块的 console.log 注掉',
  '在防火墙规则后把请求日志注掉',
];
let stillTrue = 0;
for (const s of HOST) {
  const e = de.isDevDebugContext(s);
  if (e === true) stillTrue++;
  console.log(JSON.stringify({ exemptAfterDelete: e, act: gate.checkOutput(s).gate.action }));
}
console.log('删掉宿主否决后仍 exempt 的条数 =', stillTrue, '/', HOST.length);
console.log('(G3 判据需要: 删掉后 < 2 条仍 exempt，才说明这条否决真的在保护宿主形)');
