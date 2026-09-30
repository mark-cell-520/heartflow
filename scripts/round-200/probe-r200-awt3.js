// 轮 200：打点折叠后各池的 normalizedFams 明细（复现 src 内归一化逻辑，只读）
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const { detect } = require(path.join(HF, 'src/shield/ai-writing-tell.js'));
const t = require('fs').readFileSync(path.join(HF, 'test/ai-writing-tell-multilang-r141.test.js'), 'utf8');
const skip = eval('(' + t.match(/const DELIBERATE_SKIP = (\[[\s\S]*?\]);/)[1] + ')');

const vocabDiscourse = new Set(['tier1', 'tier2', 'tier3', 'transitions']);
const templatedFrames = new Set(['formulaic-openers', 'generic-conclusions']);

for (const s of skip) {
  const r = detect(s);
  const fs_ = r.findings || [];
  const hasVD = fs_.some(f => /^ai-tell-(?:tier[123]|transitions)$/.test(f.dimension));
  const hasTD = fs_.some(f => f.dimension === 'ai-tell-transitions');
  const norm = new Set(fs_.map((f) => {
    const fam = f.dimension.replace(/^ai-tell-/, '');
    if (vocabDiscourse.has(fam)) return 'vocab-discourse';
    if (templatedFrames.has(fam)) return 'templated-frames';
    if (fam === 'zh-en-mixing') {
      if (f.zhEnSrc === 'tier-attributive' && hasVD) return 'vocab-discourse';
      if (f.zhEnSrc === 'double-connective' && hasTD) return 'vocab-discourse';
      return 'zh-en-mixing';
    }
    return fam;
  }));
  console.log('S: score=' + r.score.toFixed(2) + ' fams=' + r.familiesHit + ' recomputed=' + JSON.stringify([...norm]));
}
