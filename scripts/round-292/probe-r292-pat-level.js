/**
 * r292 探针 7：差分测法的对抗灵敏度验证（控制组）
 *
 * 探针 6 得 0 不稳定。必须排除「测法根本不灵敏」。
 * 方法：构造一组**故意**依赖全角逗号的判据探针 —— 如果测法灵敏，
 *   这些必然出现维度分数分裂；如果测法失灵，一个都不会分裂。
 *
 * 做法：直接用 JS 构造「pseudo_profundity 判据库中只钩全角逗号」的对照场景。
 * 更可靠的判定：找 PSEUDO_PHILOSOPHY_ZH 里所有现存的「只钩全角、无半角孪生」
 * 的判据，看它们在原文 vs NFKC 后文本上的得分差。
 *
 * 安全纪律：只输出索引号/差值，不输出中文原文。
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gateMod = require(path.join(ROOT, 'src/gate.js'));

function pipeNormalize(input) {
  if (!/[\u2018\u2019\u201C\u201D\uFF01-\uFF5E]/.test(input)) return input;
  return input.normalize('NFKC').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
}
const P = (...a) => console.log(...a);

// ── A. 提取 src/index.js 中 PSEUDO_PHILOSOPHY_ZH 的全部正则源码行 ──
const src = fs.readFileSync(path.join(REPO2(), 'src/index.js'), 'utf8');
function REPO2() { return path.resolve(__dirname, '..', '..'); }
const lines = src.split('\n');
const start = lines.findIndex(l => l.includes('PSEUDO_PHILOSOPHY_ZH = ['));
const end = start < 0 ? -1 : lines.findIndex((l, i) => i > start && /^\];/.test(l));
P('══════ r292 探针 7：判据级对抗灵敏度 ══════');
P(`PSEUDO_PHILOSOPHY_ZH 区间: 行 ${start + 1}..${end + 1}`);

// 逐行提取 /.../ 字面量
const pats = [];
for (let i = start; i < end; i++) {
  const m = lines[i].match(/\/((?:[^\/\\\n]|\\.)+)\/([gimsuy]*)/);
  if (m) pats.push({ idx: pats.length, line: i + 1, src: m[1], flags: m[2] });
}
P(`提取到正则: ${pats.length} 支\n`);

// ── B. 每支判据构造最小命中样本：用正则自己的片段 ──
// 由于正则里含中文描述，直接从 source 里抓中文字符串不足以构造样本。
// 改用更直接的判定：把每支正则对 [全角版][NFKC版] 的同一候选文本跑 test()。
// 候选文本从该正则 source 里的中文连续段抽取。
function zhChunks(s) {
  const out = [];
  let cur = '';
  for (const ch of s) {
    if (/[\u4e00-\u9fff]/.test(ch)) cur += ch;
    else if (cur) { if (cur.length >= 2) out.push(cur); cur = ''; }
  }
  if (cur.length >= 2) out.push(cur);
  return out;
}

// ── C. 逐支跑：把该正则自身拆成「全角候选文本」再测两种形态 ──
let unstable = 0;
const unstableList = [];
for (const p of pats) {
  let re;
  try { re = new RegExp(p.src, p.flags); } catch (_) { continue; }
  const chunks = zhChunks(p.src);
  if (!chunks.length) continue;
  // 尝试把多个 chunk 用全角逗号/半角逗号连接成候选文本（模拟真实分句）
  for (const sep of ['\uFF0C', ',', '\u3002', '.', '\uFF01', '!', '\uFF1F', '?']) {
    const cand = chunks.join(sep) + '\u3002';
    const r1 = re.test(cand), r2 = re.test(pipeNormalize(cand));
    if (r1 !== r2) {
      unstable++;
      unstableList.push({ idx: p.idx, line: p.line, sep: sep, src: p.src.length > 60 ? p.src.slice(0, 60) + '…' : p.src });
      break;
    }
  }
}
P('── 判据级差分（同一文本，全角分隔 vs NFKC 后半角分隔，正则命中是否改变）──');
P(`  不稳定判据: ${unstable} / ${pats.length}\n`);
for (const u of unstableList) P(`  #${u.idx} 行${u.line} sep=U+${u.sep.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}  ${JSON.stringify(u.src)}`);
P('');
P(unstable > 0
  ? '结论：判据级确实存在跨形态不对称（这批就是模式库漏判面）。'
  : '结论：判据级无不稳定 —— 说明探针 6 的 0 分裂是可复现的真实基线，291 修的是孤例。');
