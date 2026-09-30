// 轮 200：量化「double-connective ↔ transitions 同源叠票」修复的三个候选规则
// 只输出池编号 + score + families + findings 维度，不贴样本原文
const path = require('path');
const fs = require('fs');
const cp = require('child_process');
const os = require('os');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const srcPath = path.join(HF, 'src/shield/ai-writing-tell.js');
const original = fs.readFileSync(srcPath, 'utf8');

const dir = fs.mkdtempSync(path.join(HF, 'src/shield/awt-fold-'));
const probeTpl = [
  'const { detect } = require(%JSON%);',
  'const POOLS = %POOLS%;',
  'for (const [name, arr] of Object.entries(POOLS)) {',
  '  const rows = arr.map((s, i) => {',
  '    const r = detect(s);',
  '    return `${name}${i + 1}: score=${r.score.toFixed(2)} fams=${r.familiesHit} mix=${(r.findings || []).some(f => f.dimension === "ai-tell-zh-en-mixing") ? 1 : 0}`;',
  '  });',
  '  const scored = arr.filter(s => detect(s).score > 0).length;',
  '  const mixing = arr.filter(s => (detect(s).findings || []).some(f => f.dimension === "ai-tell-zh-en-mixing")).length;',
  '  console.log(rows.join("\\n"));',
  '  console.log(`## ${name}: scored=${scored}/${arr.length} mixingFindings=${mixing}/${arr.length}`);',
  '}',
].join('\n');

function runVariant(tag, mutated) {
  const p = path.join(dir, 'v-' + tag + '.js');
  fs.writeFileSync(p, mutated);
  const t = fs.readFileSync(path.join(HF, 'test/ai-writing-tell-multilang-r141.test.js'), 'utf8');
  const pools = {
    B: eval('(' + t.match(/const MULTILANG_BENIGN = (\[[\s\S]*?\]);/)[1] + ')'),
    S: eval('(' + t.match(/const DELIBERATE_SKIP = (\[[\s\S]*?\]);/)[1] + ')'),
    AI: eval('(' + t.match(/const AI_MIX = (\[[\s\S]*?\]);/)[1] + ')'),
  };
  const t50 = fs.readFileSync(path.join(HF, 'test/ai-writing-tell-zh-en-mixing-round50.test.js'), 'utf8');
  pools.ATK50 = eval('(' + t50.match(/const ALL_ATTACKS = (\[[\s\S]*?\]);/)[1].replace(/\.\.\.[A-Z_]+, \.\.\.[A-Z_]+, \.\.\.[A-Z_]+/, "0") + ')');
  // ALL_ATTACKS 用了展开运算符，改用三个池分别跑
  delete pools.ATK50;
  pools.AM = eval('(' + t50.match(/const ATTACK_ANCHOR_MIX = (\[[\s\S]*?\]);/)[1] + ')');
  pools.DC = eval('(' + t50.match(/const ATTACK_DOUBLE_CONNECTIVE = (\[[\s\S]*?\]);/)[1] + ')');
  pools.TP = eval('(' + t50.match(/const ATTACK_TIER_PHRASE = (\[[\s\S]*?\]);/)[1] + ')');
  const out = cp.spawnSync(process.execPath, ['-e', probeTpl.replace('%JSON%', JSON.stringify(p)).replace('%POOLS%', JSON.stringify(pools))], { encoding: 'utf8' });
  console.log(`\n########## 变体 ${tag} ##########`);
  console.log(out.stdout || ('ERR ' + out.stderr).slice(0, 400));
}

// R0 基线
runVariant('R0-baseline', original);

// R1：double-connective 与 transitions 同源时折叠（第 5 次同型复现的修法）
let r1 = original.replace(
  "        if (f.zhEnSrc === 'tier-attributive' && hasVocabDiscourse) return 'vocab-discourse';",
  [
    "        // [第 200 轮] double-connective 与 vocab-discourse 的 transitions 词表",
    "        // 存在字面交集（moreover/furthermore/additionally/in conclusion/in summary），",
    "        // 同一个英文词被当成两个独立证据支撑共现门槛 —— 同源叠票第 5 次同型复现。",
    "        if (f.zhEnSrc === 'tier-attributive' && hasVocabDiscourse) return 'vocab-discourse';",
    "        if (f.zhEnSrc === 'double-connective' && hasTransitionsDiscourse) return 'vocab-discourse';",
  ].join('\n')
);
r1 = r1.replace(
  "  const hasVocabDiscourse = (findings || []).some(f => /^ai-tell-(?:tier[123]|transitions)$/.test(f.dimension));",
  "  const hasVocabDiscourse = (findings || []).some(f => /^ai-tell-(?:tier[123]|transitions)$/.test(f.dimension));\n  const hasTransitionsDiscourse = (findings || []).some(f => f.dimension === 'ai-tell-transitions');"
);
runVariant('R1-dc-fold', r1);
fs.rmSync(dir, { recursive: true, force: true });
