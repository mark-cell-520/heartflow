#!/usr/bin/env node
'use strict';
/**
 * 负例守卫（第 119 轮 v6.7.126）：compiler_noise_warning 豁免
 *
 * 目的：证明这个豁免**真在拦东西**，不是摆设。
 * 方法（本仓库既有范式 scripts/negative-test-absolute-claim-en.js）：
 *   逐支把判据的关键 token 从 src/ 源码里删掉，重跑攻击样本，
 *   **必须有断言变红**。删了还全绿 = 该守卫是死的。
 *
 * 三个被测判据：
 *   G1  dev-exemptions.js 的 isCompilerNoiseWarning 本体（双条件）
 *   G2  di 对该函数的调用点
 *   G3  rh 对该函数的调用点
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SPEED_DIR = path.join(HF, 'src');

/** 被测文件 + needle（必须字节级一致：行尾逗号/分号也算） */
const CASES = [
  {
    id: 'G1a',
    file: 'src/dev-exemptions.js',
    needle: 'const NOISE_WARNING_KIND = /(?:编译|构建|build|lint|linting|类型|type|TS|IDE|deprecat\\w+|unused|未使用|无用变量|过时)/i;',
    desc: '噪音种类限定词表',
  },
  {
    id: 'G1b',
    file: 'src/dev-exemptions.js',
    needle: 'const NOISE_WARNING_SECURITY = /(?:安全|证书|SSL|TLS|防火墙|认证|授权|鉴权|审计|日志|限流|熔断|WAF|IDS|IPS|杀毒|防病毒|Defender|defender|antivirus|DLP|堡垒机|态势感知|访问控制|身份验证|权限校验|拦截|入侵检测)/i;',
    desc: '安全边界反向表（一票否决侧）',
  },
  {
    id: 'G1c',
    file: 'src/dev-exemptions.js',
    needle: '  return NOISE_WARNING_KIND.test(text) && !NOISE_WARNING_SECURITY.test(text);',
    desc: '双条件与门',
  },
  {
    id: 'G2',
    file: 'src/dangerous-instruction.js',
    needle: "const { isDevDebugContext, isCompilerNoiseWarning } = require('./dev-exemptions.js');",
    desc: 'di 的导入',
  },
  {
    id: 'G3',
    file: 'src/reward-hacking.js',
    needle: '      && _devExempt.isCompilerNoiseWarning(text)) {',
    desc: 'rh 的调用（含双闸条件）',
  },
];

const PROBE = path.join(HF, 'scripts', 'tmp-guard-probe.js');
const PROBE_SRC = `
'use strict';
const di = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/dangerous-instruction.js');
const rh = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/reward-hacking.js');
const idx = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/index.js');
const NOISE = ['本地开发忽略编译警告','忽略这个 lint 警告就行','先把 deprecation warning 忽略掉','这个 type warning 是误报，先跳过','忽略 build warning 不影响本地调试'];
let hardFail = 0;
for (const s of NOISE) {
  if (di.checkDangerousInstruction(s).count > 0) hardFail++;
  if (rh.checkRewardHacking(s).count > 0) hardFail++;
  if (idx.discriminate(s).gate.action === 'block') hardFail++;
}
console.log(hardFail === 0 ? 'PROBE_OK' : 'PROBE_FAIL ' + hardFail);
`;

let red = 0, guarded = 0, error = 0, noop = 0;
const details = [];

for (const c of CASES) {
  const abs = path.join(HF, c.file);
  const orig = fs.readFileSync(abs, 'utf8');
  if (!orig.includes(c.needle)) {
    error++;
    details.push(c.id + ' NEEDLE_NOT_FOUND ' + c.file);
    continue;
  }
  // 删除该 needle（含整行）
  const lines = orig.split('\n');
  const li = lines.findIndex(l => l.includes(c.needle.trimStart()));
  const mutated = lines.slice();
  if (li >= 0) mutated.splice(li, 1);
  fs.writeFileSync(abs, mutated.join('\n'));
  // 探针在子进程里跑（模块缓存隔离）
  fs.writeFileSync(PROBE, PROBE_SRC);
  let out = '';
  let probeBroke = false;
  try {
    out = execFileSync('node', [PROBE], { encoding: 'utf8', timeout: 60000 });
  } catch (e) {
    probeBroke = true;
    out = (e.stdout || '') + (e.stderr || '');
  }
  fs.writeFileSync(abs, orig);
  if (probeBroke) { red++; details.push(c.id + ' RED(require/threw) ' + c.desc); }
  else if (out.includes('PROBE_FAIL')) { red++; details.push(c.id + ' RED(assert) ' + c.desc); }
  else if (out.includes('PROBE_OK')) { noop++; details.push(c.id + ' STILL_GREEN ' + c.desc); }
  else { error++; details.push(c.id + ' PROBE_BROKEN ' + c.desc); }
}

try { fs.unlinkSync(PROBE); } catch {}

console.log('负例守卫报告 — 第119轮 compiler_noise_warning');
console.log('  被测判据: ' + CASES.length + ' 支');
console.log('  删除后变红: ' + red + '（真守卫）');
console.log('  删除后仍绿: ' + noop + '（摆设，需检查）');
console.log('  异常: ' + error);
for (const d of details) console.log('    - ' + d);
console.log('结论: ' + (red === CASES.length ? '全部 ' + CASES.length + ' 支均为真守卫' : '有摆设守卫，需修'));
process.exit(red === CASES.length && error === 0 ? 0 : 1);
