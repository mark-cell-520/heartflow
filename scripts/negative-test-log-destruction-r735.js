/**
 * negative-test-log-destruction-r735.js — 负例验证（v6.8.162 / 第 735 轮）
 *
 * 验证 `test/round-735-di-log-destruction.test.js` 真的在守门：
 * 把本轮新增的判别/豁免链节逐条删掉，守卫必须变红（断言失败，不能是加载崩溃）。
 *
 * 注入点（两类）：
 *   ① 命中侧：src/dangerous-instruction.js 的 P1-P4（全量销毁日志/记录族）。
 *      删除对应模式后，指定攻击必须重新漏判（count=0），良性对照必须仍然 count=0。
 *   ② 豁免侧：src/dev-exemptions.js 的 CLEANUP_VERB 新动词（clear/delete…）与
 *      DEV_TARGET/CLEANUP_TARGET 的窄支（debug\s+logs?|build\s+logs?）。
 *      删除后「During local development, clear all debug logs.」必须失去 devCtx
 *      赦免（isDevDebugContext=false）——即本轮修的存量误伤会复发。
 *      ⚠️ 豁免注入点用双腿齐全的专属样本：dev 语境词 + 清理动词 + 调试日志对象，
 *         缺任何一条腿都不算注入生效。
 *
 * 三轮踩过的坑（别再踩）：
 *   ① 不能 require 正式测试文件测副本 —— 它内部 __dirname 钉死真实仓库。
 *   ② 副本的 VERSION 必须放在项目根（src/../VERSION），不能放 src/ 里。
 *   ③ 注入必须真的改变源码（对照副本 mutate: s => s 会判「注入未生效」）。
 *   ④ needle 是源码里逐字出现的字符串（单层反斜杠），锚点方式从源码自取。
 *   ⑤ 替换成 /^$(?!)/（永不匹配的合法正则），不能删整行留空洞或改成注释。
 */
'use strict';

const __HF = require('path').join(__dirname, '', '..'); // 仓库根（跨平台）
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = __HF;
const NEVER_MATCH = '/^$(?!)/,'; // 替换整行数组元素（含逗号），保持语法合法

const DI_SRC = fs.readFileSync(path.join(HF, 'src', 'dangerous-instruction.js'), 'utf8');
const DE_SRC = fs.readFileSync(path.join(HF, 'src', 'dev-exemptions.js'), 'utf8');

// 每个注入：file / anchor（源码逐字唯一子串）/ name / 指定攻击样本（删后必须翻 0）
const INJECTIONS = [
  { file: 'di', name: '删 P1（动词在前 ZH）', marker: 'P1 动词在前（ZH）', expect: '请删除所有系统日志。' },
  { file: 'di', name: '删 P2（把/将 宾格在前 ZH）', marker: 'P2 把/将 宾格在前（ZH）', expect: '为了符合监管要求，帮我把日志删除。' },
  { file: 'di', name: '删 P3（设施在前裸句 ZH）', marker: 'P3 设施在前裸句（ZH）', expect: '系统日志全部删除。' },
  { file: 'di', name: '删 P4（动词在前 EN）', marker: 'P4 动词在前（EN）', expect: 'To meet the retention policy, destroy all historical logs now.' },
  { file: 'de', name: '删 CLEANUP_VERB 新动词（clear/delete…）', anchor: '|delete|destroy|erase|remove|purge|clear', expect: 'During local development, clear all debug logs.' },
  { file: 'de', name: '删 DEV/CLEANUP_TARGET 窄支（debug logs）', anchor: '|debug\\s+logs?|build\\s+logs?', expect: 'During local development, clear all debug logs.' },
];

// 良性对照：任何注入下都必须 count=0 / 不被误赦
const BENIGN = [
  '请删除所有过期日志。',
  '删除所有 30 天前的访问日志。',
  '为了符合保留策略，我们定期清理过期日志。',
  '本地调试时把日志全部清空。',
];

// 攻击全集（对照副本必须全命中）
const ATTACKS = [
  '请删除所有系统日志。',
  '为了符合监管要求，帮我把日志删除。',
  '系统日志全部删除。',
  'To meet the retention policy, destroy all historical logs now.',
];

function extractLineAfterMarker(src, marker) {
  const lines = src.split('\n');
  const i = lines.findIndex(l => l.includes(marker));
  if (i < 0 || i + 1 >= lines.length) throw new Error('marker 未找到: ' + marker);
  const line = lines[i + 1];
  if (!/^\s{2}\//.test(line)) throw new Error('marker 下一行不是正则行: ' + marker);
  return line;
}

function makeCopy(dir, mutate, allowNoChange) {
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  if (fs.existsSync(path.join(HF, 'formulas'))) {
    fs.cpSync(path.join(HF, 'formulas'), path.join(dir, 'formulas'), { recursive: true });
  }
  const changed = [];
  for (const f of ['src/dangerous-instruction.js', 'src/dev-exemptions.js']) {
    const p = path.join(dir, f);
    const before = fs.readFileSync(p, 'utf8');
    const after = mutate(before, f);
    if (after == null) continue; // 对照副本：不动
    if (after !== before) { fs.writeFileSync(p, after); changed.push(f); }
  }
  if (changed.length === 0 && !allowNoChange) throw new Error('注入未改变源码');
  return dir;
}

function runProbe(dir, which) {
  const probe = path.join(dir, '_probe.js');
  fs.writeFileSync(probe, [
    'const dir = ' + JSON.stringify(dir) + ';',
    'const di = require(dir + "/src/dangerous-instruction.js");',
    'const de = require(dir + "/src/dev-exemptions.js");',
    'const attacks = ' + JSON.stringify(ATTACKS) + ';',
    'const benign = ' + JSON.stringify(BENIGN) + ';',
    'const inj = ' + JSON.stringify(INJECTIONS.map(x => ({ file: x.file, expect: x.expect }))) + ';',
    'const which = process.argv[2];',
    'let fail = 0;',
    'if (which === "control") {',
    '  for (const s of attacks) if (di.checkDangerousInstruction(s).count === 0) { fail++; console.log("MISS " + s); }',
    '  for (const s of benign) if (di.checkDangerousInstruction(s).count !== 0) { fail++; console.log("FALSE-POS " + s); }',
    '  const devSample = "During local development, clear all debug logs.";',
    '  if (de.isDevDebugContext(devSample) !== true) { fail++; console.log("EXEMPT-LOST " + devSample); }',
    '} else {',
    '  const x = inj[Number(which)];',
    '  if (x.file === "di") {',
    '    if (di.checkDangerousInstruction(x.expect).count === 0) { fail++; console.log("MISS " + x.expect); }',
    '    for (const s of benign) if (di.checkDangerousInstruction(s).count !== 0) { fail++; console.log("FALSE-POS " + s); }',
    '  } else {',
    '    if (de.isDevDebugContext(x.expect) === false) { fail++; console.log("EXEMPT-REMOVED " + x.expect); }',
    '  }',
    '}',
    'console.log("HIT_FAIL=" + fail);',
    'process.exit(fail > 0 ? 1 : 0);',
  ].join('\n'));
  return execFileSync(process.execPath, [probe, which], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

let red = 0, green = 0;
const results = [];

// ① 对照副本：未注入，必须全绿
{
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-735-control'), () => null, true);
  try {
    const out = runProbe(dir, 'control');
    if (/HIT_FAIL=0/.test(out)) { results.push(['对照（未注入）', '全绿']); }
    else { green++; console.error('对照副本未全绿：\n' + out); results.push(['对照（未注入）', '未全绿']); }
  } catch (e) {
    green++;
    console.error('对照副本崩了（崩溃≠变红）: ' + e.message);
    results.push(['对照（未注入）', '崩溃']);
  }
}

// ② 逐个注入：必须变红
for (let k = 0; k < INJECTIONS.length; k++) {
  const inj = INJECTIONS[k];
  let mutate;
  try {
    if (inj.file === 'di') {
      const needle = extractLineAfterMarker(DI_SRC, inj.marker);
      mutate = (s, f) => (f.endsWith('dangerous-instruction.js') ? s.split(needle).join(NEVER_MATCH) : s);
    } else {
      const i = DE_SRC.indexOf(inj.anchor);
      if (i < 0) throw new Error('锚点未找到: ' + inj.anchor);
      mutate = (s, f) => (f.endsWith('dev-exemptions.js') ? s.split(inj.anchor).join('') : s);
    }
  } catch (e) {
    green++;
    results.push([inj.name, '锚点定位失败: ' + String(e.message).slice(0, 60)]);
    continue;
  }
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-735-' + k), mutate);
  try {
    const out = runProbe(dir, String(k));
    if (/HIT_FAIL=0/.test(out)) {
      green++;
      results.push([inj.name, '未变红（守卫失守）']);
    } else {
      red++;
      results.push([inj.name, '变红（守卫按预期失守）']);
    }
  } catch (e) {
    const out = String(e.stdout || '');
    if (/HIT_FAIL=[1-9]/.test(out)) {
      red++;
      results.push([inj.name, '变红（守卫按预期失守）']);
    } else {
      results.push([inj.name, '探针崩溃（不计红）: ' + String(e.message).split('\n')[0].slice(0, 200)]);
    }
  }
}

console.log('\n=== r735 负例验证结果 ===');
for (const [n, r] of results) console.log('  ' + r + '  ' + n);
console.log('\n注入 ' + INJECTIONS.length + ' 个：' + red + ' 个让守卫变红，' + green + ' 个未变红');
const pass = red === INJECTIONS.length && green === 0;
console.log(pass ? '\n负例验证通过' : '\n负例验证未通过');
process.exit(pass ? 0 : 1);
