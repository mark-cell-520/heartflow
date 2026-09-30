/**
 * r293 探针 1：doubt-engine 15 处跨形态不对称的**函数层**实证筛选
 *
 * r292 的探针 10 是正则层差分（regex.test）。本探针升一层：
 * 对 doubt-engine 每个只列全角逗号的否定类/边界类，用该正则自身的中文片段
 * 构造候选文本，分别跑 doubt() 本体，比较 shouldStop/gate.action/doubts.length。
 * 只有函数层判词真变的分裂点才值得改——正则层变了但 doubt() 输出不变 = 空转。
 *
 * 只输出 文件:行号 / 方向 / 动作变化，不输出中文原文。
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');
const P = (...a) => console.log(...a);

const { doubt } = require(path.join(SRC, 'doubt-engine.js'));

function pipeNormalize(input) {
  if (!/[\u2018\u2019\u201C\u201D\uFF01-\uFF5E]/.test(input)) return input;
  return input.normalize('NFKC').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
}

function walk(d, acc = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.js')) acc.push(p);
  }
  return acc;
}

// 找单行的字符类
function findCharClasses(s) {
  const out = []; const n = s.length;
  for (let i = 0; i < n - 1; i++) {
    if (s[i] === '[') {
      let j = i + 1, neg = false;
      if (s[j] === '^') { neg = true; j++; }
      if (s[j] === ']') j++;
      while (j < n && s[j] !== ']') { if (s[j] === '\\') j++; j++; }
      if (j < n) { out.push({ start: i, end: j, body: s.slice(i + (neg ? 2 : 1), j), negated: neg }); i = j; }
    } else if (s[i] === '\\') i++;
  }
  return out;
}

function zhChunks(s) {
  const out = []; let cur = '';
  for (const ch of s) {
    if (/[\u4e00-\u9fff]/.test(ch)) cur += ch;
    else if (cur) { if (cur.length >= 2) out.push(cur); cur = ''; }
  }
  if (cur.length >= 2) out.push(cur);
  return out;
}

const FOLD = { '\uFF0C': ',', '\uFF01': '!', '\uFF1F': '?', '\uFF1A': ':', '\uFF1B': ';' };

const target = process.argv[2] || 'src/doubt-engine.js';
const files = target === 'ALL' ? walk(SRC) : [path.join(ROOT, target)];

const real = [];
for (const f of files) {
  let src;
  try { src = fs.readFileSync(f, 'utf8'); } catch (_) { continue; }
  const lines = src.split('\n');
  let inBlock = false;
  for (let ln = 0; ln < lines.length; ln++) {
    let line = lines[ln];
    if (inBlock) { const e = line.indexOf('*/'); if (e === -1) continue; line = line.slice(e + 2); inBlock = false; }
    const t = line.trim();
    if (t.startsWith('*') || t.startsWith('//') || t.startsWith('/*')) continue;
    if (/\/\*/.test(line)) inBlock = true;

    // 找出本行所有「否定类含全角逗号但无半角逗号」
    let hasAsym = false, asymFW = [];
    for (const cls of findCharClasses(line)) {
      if (!cls.negated) continue;
      if (!cls.body.includes('\uFF0C') || cls.body.includes(',')) continue;
      const escH = '\\u002C';
      if (cls.body.toUpperCase().includes(escH)) continue;
      hasAsym = true; asymFW.push('\uFF0C');
    }
    if (!hasAsym) continue;

    // 取本行正则，用自身中文片段构造候选，跑 doubt() 差分
    const reAll = /\/((?:[^\/\\\n]|\\.)+)\/([gimsuy]*)/g;
    let m; let confirmed = false, dir = null, detail = '';
    while ((m = reAll.exec(line)) !== null) {
      let re; try { re = new RegExp(m[1], m[2].replace('g', '')); } catch (_) { continue; }
      const chunks = zhChunks(m[1]);
      if (chunks.length < 2) continue;
      for (const [fw, half] of Object.entries(FOLD)) {
        if (!m[1].includes(fw)) continue;
        // 用全角逗号做分隔构造两版（pad 保证 >30 字符以过 checkSymmetry 门槛）
        const pad = '这是一个用于验证怀疑引擎跨标点形态判词一致性的测试句子';
        const candFW = pad + chunks.join(fw) + '\u3002';
        const candHalf = pad + chunks.join(half) + '.';
        const a = doubt(candFW), b = doubt(pipeNormalize(candHalf));
        const key = (r) => `${r.shouldStop}|${r.gate.action}|${r.doubts.length}`;
        if (key(a) !== key(b)) {
          confirmed = true;
          dir = b.doubts.length > a.doubts.length ? '折叠后更严' : 'FW更严';
          detail = `${key(a)} -> ${key(b)}`;
          break;
        }
      }
      if (confirmed) break;
    }
    if (confirmed) real.push({ file: path.relative(ROOT, f), line: ln + 1, dir, detail });
  }
}

P('══════ r293 探针 1：doubt-engine 跨形态不对称的函数层筛选 ══════');
P(`目标: ${target}`);
P(`函数层确认分裂: ${real.length} 处\n`);
for (const r of real) P(`  ${r.file}:${r.line}  ${r.dir}  [${r.detail}]`);
P('');
P(`正则层参考（r292 探针10）: ${target} 共 15 处`);
