/**
 * r292 探针 8：定位 8692 判据的跨形态分裂根因
 * 只输出码位和结构，不输出中文原文。
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');

function pipeNormalize(input) {
  if (!/[\u2018\u2019\u201C\u201D\uFF01-\uFF5E]/.test(input)) return input;
  return input.normalize('NFKC').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
}
const P = (...a) => console.log(...a);

const src = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
const lines = src.split('\n');
const LINE_8692 = lines[8691];  // 0-based
P('══════ r292 探针 8：行 8692 判据根因 ══════');
P(`行8692 源: ${JSON.stringify(LINE_8692)}`);
P('');

// 从行内提取正则 source
const m = LINE_8692.match(/\/((?:[^\/\\\n]|\\.)+)\//);
if (!m) { P('未提取到正则'); process.exit(0); }
const patSrc = m[1];
P(`正则 source: ${JSON.stringify(patSrc)}`);
P('');

// 反编译：把 source 里的字符按 UTF-16 码位列出，看 UTF-16 层面
const units = [...patSrc];
P(`码位序列（截前 40 单元）:`);
P('  ' + units.slice(0, 40).map(c => {
  const cp = c.codePointAt(0);
  if (cp < 0x20) return `<${cp.toString(16)}>`;
  if (cp < 0x7f) return c;
  if (cp >= 0x4e00 && cp <= 0x9fff) return `[CJK:${cp.toString(16)}]`;
  if (cp >= 0xff00) return `<FW:${cp.toString(16)}>`;
  return `<${cp.toString(16)}>`;
}).join(' '));
P('');

// 关键检测：source 里是否有半角 ',' 或全角 '\uFF0C' 裸出现（字符类外）
const hasBareHalfComma = /(?<!\\)(,\s|,\\?[^s\S])/.test(patSrc);
P(`source 含裸半角逗号（类外）: ${/,/.test(patSrc) && !/\[[^\]]*,/.test(patSrc)}`);
P(`source 含裸全角逗号（类外）: ${patSrc.includes('\uFF0C')}`);
P(`source 含 [^。，] 否定类: ${/\^[^\]]*\uFF0C/.test(patSrc)}`);
P('');

// 构造分裂样本：让 source 里的 zhChunks 用不同分隔符连接
function zhChunks(s) {
  const out = []; let cur = '';
  for (const ch of s) {
    if (/[\u4e00-\u9fff]/.test(ch)) cur += ch;
    else if (cur) { if (cur.length >= 2) out.push(cur); cur = ''; }
  }
  if (cur.length >= 2) out.push(cur);
  return out;
}
const re = new RegExp(patSrc, '');
const chunks = zhChunks(patSrc);
P(`中文片段: ${chunks.length} 个（各 ${chunks.map(c => c.length).join('/')} 字）`);
P('');
for (const sep of ['\uFF0C', ',', '\u3002', '.', '\uFF01', '!']) {
  const cand = chunks.join(sep) + '\u3002';
  const r1 = re.test(cand);
  const r2 = re.test(pipeNormalize(cand));
  const tag = r1 === r2 ? '一致' : '★分裂';
  P(`  sep=U+${sep.codePointAt(0).toString(16).toUpperCase().padStart(4,'0')}  原文命中=${r1}  折叠后命中=${r2}  ${tag}`);
}
P('');

// 直接量测：为什么 NFKC 后反而不命中？—— 打印候选文本在两形态下的码位对比
const sepCand = chunks.join('\uFF0C') + '\u3002';
const folded = pipeNormalize(sepCand);
P('── 候选文本码位对比（前 60 单元）──');
const show = (s) => [...s].slice(0, 60).map(c => {
  const cp = c.codePointAt(0);
  if (cp < 0x7f) return c;
  if (cp >= 0x4e00 && cp <= 0x9fff) return 'C';
  return `<${cp.toString(16)}>`;
}).join('');
P(`  原文:   ${show(sepCand)}`);
P(`  折叠后: ${show(folded)}`);
P('');

// 结论推导：re 的 [^。]{0,12} 能不能吃掉半角逗号？
P('── 推理 ──');
P(`  [^。] 字符类包含半角逗号',': ${/[^。]/.test(',')}`);
P(`  [^。] 字符类包含全角逗号'，': ${/[^。]/.test(',')}`);
P('  既然两者都能被 [^。] 吃掉，分裂必然来自正则的其它约束 ——');
P('  很可能是 (?:维度|层次|境界|高度) 前的定位锚点被折叠破坏。');
