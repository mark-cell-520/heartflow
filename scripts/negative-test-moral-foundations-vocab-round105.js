/**
 * negative-test-moral-foundations-vocab-round105.js — 负例验证（v6.7.125 第 105 轮）
 *
 * 验证 `test/moral-foundations-vocab.test.js` 真的在守门：
 * 把第 103 轮补进 MORAL_PATTERNS 的词族逐条删掉，守卫必须变红
 * （断言失败，不能是加载崩溃）。
 *
 * 注入方式（第 105 轮修正）：按 **行号区间** 删除源码行，不手写 needle。
 * 原因：needle 里带 `\w*` / `\s+` 时，手写字符串会多写一层反斜杠，
 * 上一版 7 个注入全部「needle 未找到」假阴性。行号方式直接从磁盘读行，
 * 不存在转义层级问题；代价是源码行号变动后要更新 LINES。
 *
 * 剩余纪律（复述）：
 *   ① 不 require 正式测试文件测副本 —— __dirname 钉死真实仓库。
 *   ② 副本 VERSION 必须放项目根（src/../VERSION）。
 *   ③ 不用 `node -e` 内联跑探针——安全扫描会拦。
 *   ④ 对照副本（未注入）的 expect 样本必须全部命中，否则是测试本身写错。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = fs.readFileSync(path.join(HF, 'src', 'index.js'), 'utf8');
const LINES = SRC.split('\n');

// [startLine, endLine] 为 1-based 闭区间，删除该区间即删掉对应词族。
// 每条注入对应守卫 test/moral-foundations-vocab.test.js 里一组样本。
const INJECTIONS = [
  {
    name: '删 zh fairness 背信词族（欺骗/欺诈/撒谎/出尔反尔/不守信用…）',
    span: [2630, 2630],
    replace: "         fairness: /公平|公正|平等|正义|歧视|偏见|权利|机会均等|一视同仁|公道/i,",
    expect: ['他靠欺骗客户签下了这份合同', '这个人谎话连篇，出尔反尔', '承诺背弃、不守信用的供应商要淘汰'],
  },
  {
    name: '删 zh authority 否定形组合（不尊重/侮辱/践踏+权威/传统/长辈）',
    span: [2635, 2635],
    replace: "         authority: /服从|尊重传统|传统秩序|权威等级|等级制度|规矩纪律|遵守纪律|领导权威/i,",
    expect: ['他不尊重权威，也不把长辈放在眼里', '他们肆意侮辱传统，践踏长幼秩序'],
  },
  {
    // [v6.7.126 第 106 轮] 修正：第 2645 行原文是 `  en: { care: /...`，
    // 旧版 replace 写成 9 空格 + `care:`，把 `en: { ` 一起删掉，
    // 副本里对象字面量提前闭合 → 第 2654 行 en_trust 报
    // "Missing initializer in const declaration"，探针崩溃不计红（假阴性守卫）。
    // replace 必须原样保留 `en: { ` 前缀。
    name: '删 en care 词干变形 + 残害组合词（cruel\\w*/suffer\\w*/cold-blooded）',
    span: [2645, 2645],
    replace: "  en: { care: /\\b(protect|care|harm|hurt|compassion|empathy|kindness|gentle)\\b/i,",
    expect: ['Such cruelty cannot be justified by profit', 'They are cold-blooded exploiters of the poor'],
  },
  {
    name: '删 en fairness 欺诈词干（cheat\\w*/fraud/scam/swindl/deceiv）',
    span: [2646, 2646],
    replace: String.raw`         fairness: /\b(fair|justice|equal|rights|discriminat|prejudice|unfair|equity)\b/i,`,
    expect: ['He cheated on the audit and kept cheating', 'The scammer swindled elderly people out of their savings'],
  },
  {
    name: '删 en loyalty 词干变形（loyal\\w*/betray\\w*/patriot\\w*）',
    span: [2647, 2647],
    replace: String.raw`         loyalty: /\b(traitor|unite|solidarity|sacrifice|honor|devote)\b/i,`,
    expect: ['He betrays every partner who trusts him', 'The betrayal was documented in three reports', 'She stayed loyal while others defected'],
  },
  {
    name: '删 en sanctity 组合式（no shame / poisoning social values）',
    span: [2649, 2649],
    replace: String.raw`         sanctity: /\b(holy|pure|impure|purity|sin|sacred|sacrilege|disgust|disgusting|pollute|polluted|contaminat|decadent|corrupt|degrade|degrading|taint|filth|vermin|subhuman|parasit)\b/i,`,
    expect: ['He is a pathological liar with no shame', 'This rhetoric poisons public values'],
  },
  {
    name: '删 en sanctity 的 shameless 词（词尾追加项）',
    span: [2649, 2649],
    replace: String.raw`         sanctity: /\b(holy|pure|impure|purity|sin|sacred|sacrilege|disgust|disgusting|pollute|polluted|contaminat|decadent|corrupt|degrade|degrading|taint|filth|vermin|subhuman|parasit)\b|\b(?:no|without|lacks?\s+any)\s+shame\b|\bpoison(?:s|ing|ed)?\s+(?:social|moral|cultural|public|collective)?\s*(?:values?|morals?|discourse|culture|society|community)\b/i,`,
    expect: ['He is a shameless opportunist'],
  },
  {
    name: '删 en_trust 背信组合（lies constantly / does not deserve any trust）',
    span: [2654, 2654],
    replace: "  en_trust: /never-matches-placeholder/i,",
    expect: ['She lies constantly and never deserves any trust', 'He does not deserve any respect from the team'],
  },
];

// 每个注入里的「原行内容」——用于校验源码未被前人改动过（行号对不上就报错）
const EXPECTED_LINE_SNIPPET = {
  2630: '公平|公正|平等|正义|歧视|偏见|权利|机会均等|一视同仁|公道|欺骗|欺诈|撒谎',
  2635: '服从|尊重传统|传统秩序|权威等级|等级制度|规矩纪律|遵守纪律|领导权威|(?:不尊重',
  2645: 'care: /\\b(protect|care|harm|hurt|cruel\\w*|compassion|empathy|kindness|suffer\\w*|gentle|cold-blooded|coldhearted)\\b/i',
  2646: 'fairness: /\\b(fair|justice|equal|rights|discriminat|prejudice|unfair|cheat\\w*|equity|fraud\\w*|scam\\w*|swindl\\w*|deceiv\\w*)\\b/i',
  2647: 'loyalty: /\\b(loyal\\w*|betray\\w*|patriot\\w*|traitor|unite|solidarity|sacrifice|honor|devote)\\b/i',
  2649: 'sanctity: /\\b(holy|pure|impure|purity|sin|sacred|sacrilege|disgust|disgusting|pollute|polluted|contaminat|decadent|corrupt|degrade|degrading|taint|filth|vermin|subhuman|parasit|shameless)',
  2654: 'en_trust: /\\b(?:lies?|lying)\\s+(?:constantly|habitually|repeatedly|all\\s+the\\s+time)\\b',
};

function makeCopy(dir, mutate, allowNoChange) {
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  const idx = path.join(dir, 'src', 'index.js');
  const before = fs.readFileSync(idx, 'utf8');
  const after = mutate(before.split('\n'));
  if (after === before.split('\n') && !allowNoChange) throw new Error('注入未改变源码');
  fs.writeFileSync(idx, after.join('\n'));
  return dir;
}

function runGuard(dir, expectList) {
  const probe = path.join(dir, '_probe.js');
  fs.writeFileSync(probe, [
    'const { checkMoralFoundations } = require(' + JSON.stringify(path.join(dir, 'src', 'index.js')) + ');',
    'const expected = ' + JSON.stringify(expectList) + ';',
    'let miss = 0;',
    'for (const s of expected) {',
    '  const c = checkMoralFoundations(s).count;',
    '  if (c === 0) { miss++; console.log("BROKEN " + s); }',
    '}',
    'console.log("BROKEN_FAIL=" + miss + "/" + expected.length);',
    'process.exit(miss > 0 ? 1 : 0);',
  ].join('\n'));
  try {
    return { out: execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }), code: 0 };
  } catch (e) {
    return { out: String(e.stdout || ''), code: e.status, err: String(e.stderr || '').slice(0, 200) };
  }
}

let red = 0, notRed = 0, controlBad = 0;
const results = [];

// ① 校验源码行号仍对得上（源码被改动就报错，不静默假阴性）
for (const inj of INJECTIONS) {
  const ln = inj.span[0];
  const need = EXPECTED_LINE_SNIPPET[ln];
  if (!need) continue;
  const actual = LINES[ln - 1] || '';
  if (actual.indexOf(need) < 0) {
    results.push([inj.name, '行号校验失败（第 ' + ln + ' 行不含预期片段）——源码已变动，需更新脚本']);
    notRed++;
  }
}

// ② 对照副本：未注入，expect 样本必须全部命中
for (const inj of INJECTIONS) {
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-mf105-ctl-' + Buffer.from(inj.name).toString('hex').slice(0, 10)), s => s, true);
  const r = runGuard(dir, inj.expect);
  if (r.code !== 0) {
    controlBad++;
    console.error('  对照未全命中（测试本身写错）: ' + inj.name + ' | ' + r.out.split('\n').slice(0, 3).join(' / '));
  }
}

// ③ 逐个注入：删掉该族后，守卫必须变红
for (const inj of INJECTIONS) {
  const dir = makeCopy(
    path.join(os.tmpdir(), 'hf-mf105-' + Buffer.from(inj.name).toString('hex').slice(0, 10)),
    lines => {
      const out = lines.slice();
      for (let ln = inj.span[0]; ln <= inj.span[1]; ln++) out[ln - 1] = inj.replace;
      return out;
    }
  );
  const r = runGuard(dir, inj.expect);
  if (/BROKEN_FAIL=[1-9]/.test(r.out)) {
    red++;
    const m = r.out.match(/BROKEN_FAIL=(\d+)\/(\d+)/);
    results.push([inj.name, '变红（守卫已暴露 ' + (m ? m[1] + '/' + m[2] : '?') + '）']);
  } else if (r.code === 0) {
    notRed++;
    results.push([inj.name, '未变红（守卫失守没人发现）']);
  } else {
    results.push([inj.name, '探针崩溃（不计红）: ' + (r.err || r.out).slice(0, 200)]);
  }
}

console.log('\n=== 负例验证结果（moral-foundations-vocab 第 105 轮）===');
for (const [n, r] of results) console.log('  ' + r + '  ' + n);
console.log('\n注入 ' + INJECTIONS.length + ' 个：' + red + ' 个让守卫变红，' + notRed + ' 个未变红');
console.log('对照副本异常 ' + controlBad + ' 个');
const pass = red === INJECTIONS.length && notRed === 0 && controlBad === 0;
console.log(pass ? '\n负例验证通过' : '\n负例验证未通过');
process.exit(pass ? 0 : 1);
