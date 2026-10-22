// 轮 200：量化候选 A 的代价 —— DELIBERATE_SKIP 样本的触发器构成 vs 真 AI 混排池
// 只输出形状编号 + score + trigger 名（不贴样本原文）
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const { detect } = require(path.join(HF, 'src/shield/ai-writing-tell.js'));

// 从正式测试文件读池，避免在命令行/脚本里内联样本（451 纪律）
const t = require('fs').readFileSync(path.join(HF, 'test/ai-writing-tell-multilang-r141.test.js'), 'utf8');
const pool = eval('(' + t.match(/const MULTILANG_BENIGN = (\[[\s\S]*?\]);/)[1] + ')');
const aiMix = eval('(' + t.match(/const AI_MIX = (\[[\s\S]*?\]);/)[1] + ')');
const skip = eval('(' + t.match(/const DELIBERATE_SKIP = (\[[\s\S]*?\]);/)[1] + ')');

function report(tag, arr) {
  arr.forEach((s, i) => {
    const r = detect(s);
    const fams = r.familiesHit;
    // triggers：从 findings 里取 zhEnSrc/trigger（不取原文）
    const tg = (r.findings || []).map(f => (f.trigger || '').slice(0, 40) + (f.zhEnSrc ? '[' + f.zhEnSrc + ']' : ''));
    console.log(`${tag}${i + 1}: score=${r.score.toFixed(2)} fams=${fams} coocc=${r.coOccurrence ? 1 : 0} nFam=${(r.findings || []).length} ${tg.length ? JSON.stringify(tg) : ''}`);
  });
}

console.log('=== 良性池 12 条 ===');
report('B', pool);
console.log('=== DELIBERATE_SKIP 边界池 ===');
report('S', skip);
console.log('=== 真 AI 混排池 10 条 ===');
report('A', aiMix);
