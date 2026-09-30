// 轮 200：打点三个池每条 finding 的 dimension/severity/trigger，量化同源叠票
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const { detect } = require(path.join(HF, 'src/shield/ai-writing-tell.js'));
const t = require('fs').readFileSync(path.join(HF, 'test/ai-writing-tell-multilang-r141.test.js'), 'utf8');
const pool = eval('(' + t.match(/const MULTILANG_BENIGN = (\[[\s\S]*?\]);/)[1] + ')');
const aiMix = eval('(' + t.match(/const AI_MIX = (\[[\s\S]*?\]);/)[1] + ')');
const skip = eval('(' + t.match(/const DELIBERATE_SKIP = (\[[\s\S]*?\]);/)[1] + ')');

function report(tag, arr) {
  arr.forEach((s, i) => {
    const r = detect(s);
    const rows = (r.findings || []).map(f => `${f.dimension.replace(/^ai-tell-/, '')}(${f.severity})${f.zhEnSrc ? '@' + f.zhEnSrc : ''}`);
    console.log(`${tag}${i + 1}: score=${r.score.toFixed(2)} fams=${r.familiesHit} | ${rows.join(' + ')}`);
  });
}
report('B', pool);
report('S', skip);
report('A', aiMix);
