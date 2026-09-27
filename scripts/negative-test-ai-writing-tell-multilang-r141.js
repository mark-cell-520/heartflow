#!/usr/bin/env node
/**
 * scripts/negative-test-ai-writing-tell-multilang-r141.js
 * 第 141 轮负例脚本：ai_writing_tell 多语言误伤修复的**删条回退验证**。
 *
 * 用法：node scripts/negative-test-ai-writing-tell-multilang-r141.js
 *
 * 判据必须能被「移除即失效」证明有效——否则它可能只是巧合命中。
 * 本脚本依次把本轮三处修复逐一还原，确认对应误伤回退：
 *   inj1 移除同形字映射补全（п 条目）→ 俄语样本应回到误伤
 *   inj2 移除 homoglyph 自然语言放行（还原成 [^\x00-\x7F...] 排除集）
 *        → 日语/韩语/阿拉伯语样本应回到误伤
 *   inj3 移除 zh-en-mixing 状语判定折叠（全部 TIER 形态都当独立证据）
 *        → 定语形态的中英混排样本应回到误伤
 * 每次都起子进程解析 stdout（detect 被 gate 等惰性引用持有，
 * 同进程 delete require.cache 读不干净——第 139/140 轮两次实测教训）。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'shield', 'ai-writing-tell.js');
const original = fs.readFileSync(SRC, 'utf8');

// ── 三组样本（多语言候选题的子集，改一处即应让对应组回退）──
const GROUP = {
  ru: [
    'Этот сервис работает стабильно, throughput выше на 30 процентов.',
    'Мы используем robust подход к deployment.',
  ],
  other: [
    'この API は robust な設計になっており、retry 時に exponential backoff を使います。',
    '이 모듈은 seamless 하게 동작하고, latency 가 현저히 낮습니다.',
    '此服务运行 robust 且速度极快',
    'ระบบนี้มีความ robust สูง และ latency ต่ำมาก',
  ],
  zhAttributive: [
    '这个 pipeline 需要 comprehensive 的 retry 策略，覆盖 timeout 和 rate limit 两类失败。',
    '我们把 gateway 重写成 leverage 了连接池的实现，throughput 提升明显。',
  ],
};

/** 在子进程里跑指定源码版本，返回每组误伤条数 */
function runInSubprocess(srcText) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-awt-neg141-'));
  // 复制整个 src 树到临时目录，只替换被测文件（避免 require 解析到真实树）
  const tmpSrc = path.join(dir, 'src');
  fs.cpSync(path.join(ROOT, 'src'), tmpSrc, { recursive: true });
  fs.writeFileSync(path.join(tmpSrc, 'shield', 'ai-writing-tell.js'), srcText);
  const probe = path.join(dir, '_probe.js');
  fs.writeFileSync(probe, [
    'const { detect } = require(' + JSON.stringify(path.join(tmpSrc, 'shield', 'ai-writing-tell.js')) + ');',
    'const G = ' + JSON.stringify(GROUP) + ';',
    'const out = {};',
    'for (const k of Object.keys(G)) { let n = 0; G[k].forEach(s => { if (detect(s).score > 0) n++; }); out[k] = n; }',
    'console.log(JSON.stringify(out));',
  ].join('\n'));
  let out;
  try {
    out = cp.execSync(process.execPath + ' ' + JSON.stringify(probe), { encoding: 'utf8' });
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) { /* 清理失败不影响结论 */ }
  }
  return JSON.parse(out.trim());
}

// ── 注入点定义（每处都要先确认原文本里能找到，找不到立即报错）──
const INJECTIONS = [
  {
    id: 'inj1',
    desc: '移除同形字映射补全（п 条目）→ 俄语组回退',
    apply: (s) => s.replace("'\\u043f':'n',", ''),
    expectGroup: 'ru',
  },
  {
    id: 'inj2',
    desc: '还原 homoglyph 排除集为 [^\\x00-\\x7F...] → 日/韩/阿拉伯/泰组回退',
    apply: (s) => s.replace(
      /\/\[\\uE000-\\uF8FF\\uFFF0-\\uFFFF\]\/g,\n\s*\/\/ 拉丁字母间隙里的不可见\/异体字符[\s\S]*?\\u0370-\\u03FF\]\/g,/,
      '/[^\\x00-\\x7F\\u4e00-\\u9fff\\u3400-\\u4dbf\\uf900-\\ufaff\\u3000-\\u303f\\uff00-\\uffef]/g,'
    ),
    expectGroup: 'other',
  },
  {
    id: 'inj3',
    desc: '移除状语折叠（所有 TIER 形态都当独立证据）→ 定语中英混排组回退',
    apply: (s) => s.replace(
      "tierPhrase: mt.trigger.startsWith('TIER词')",
      'tierPhrase: false'
    ),
    expectGroup: 'zhAttributive',
  },
];

let fail = 0;
const baseline = runInSubprocess(original);
console.log(`基线误伤: ru=${baseline.ru} other=${baseline.other} zhAttributive=${baseline.zhAttributive}`);

for (const inj of INJECTIONS) {
  const applied = inj.apply(original);
  if (applied === original) {
    console.log(`FAIL ${inj.id}: 注入点在源码里找不到（注入无效，无法证明守卫生效）`);
    fail++;
    continue;
  }
  const after = runInSubprocess(applied);
  const n = after[inj.expectGroup];
  const ok = n > baseline[inj.expectGroup];
  console.log(`${ok ? 'PASS' : 'FAIL'} ${inj.id}: ${inj.desc} | 误伤 ${baseline[inj.expectGroup]} -> ${n}`);
  if (!ok) fail++;
}

console.log('---');
console.log(fail === 0 ? `负例删除验证通过（${INJECTIONS.length}/${INJECTIONS.length}）` : `负例删除验证失败 ${fail}/${INJECTIONS.length}`);
process.exit(fail > 0 ? 1 : 0);
