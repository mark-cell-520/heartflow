// 轮 200 调试：注入删条后逐条打点，确认 fold 行是否是唯一守卫
const path = require('path');
const fs = require('fs');
const cp = require('child_process');
const os = require('os');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const SRC = path.join(HF, 'src/shield/ai-writing-tell.js');
const original = fs.readFileSync(SRC, 'utf8');
const FOLD = "        if (fam === 'transitions' && hasConnectivePair) return 'zh-en-mixing';";
console.log('FOLD in source:', original.includes(FOLD));

const ml = fs.readFileSync(path.join(HF, 'test/ai-writing-tell-multilang-r141.test.js'), 'utf8');
const POOL = eval('(' + ml.match(/const MULTILANG_BENIGN = (\[[\s\S]*?\]);/)[1] + ')');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbg-'));
const probe = path.join(dir, 'p.js');
fs.writeFileSync(probe, [
  'const { detect } = require(' + JSON.stringify(SRC) + ');',
  'const S = ' + JSON.stringify(POOL) + ';',
  'S.forEach((s,i)=>{const r=detect(s);console.log(i+" score="+r.score.toFixed(2)+" fams="+r.familiesHit+" "+JSON.stringify((r.findings||[]).map(f=>f.dimension.replace(/^ai-tell-/,"")+(f.zhEnSrc?"@"+f.zhEnSrc:""))));});',
].join('\n'));

console.log('--- 基线 ---');
console.log(cp.execSync(process.execPath + ' ' + JSON.stringify(probe), { encoding: 'utf8' }));

const mutated = original.replace(FOLD, "        if (false && hasConnectivePair) return 'zh-en-mixing';");
console.log('mutated !== original:', mutated !== original);
fs.writeFileSync(SRC, mutated, 'utf8');
try {
  console.log('--- 注入后 ---');
  console.log(cp.execSync(process.execPath + ' ' + JSON.stringify(probe), { encoding: 'utf8' }));
} finally {
  fs.writeFileSync(SRC, original, 'utf8');
}
fs.rmSync(dir, { recursive: true, force: true });
console.log('restored:', fs.readFileSync(SRC, 'utf8') === original);
