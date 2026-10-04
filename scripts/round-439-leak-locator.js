// r439 泄漏定位：落盘文件里到底哪些字段还带原文
const path = require('path');
const fs = require('fs');
const os = require('os');
const ROOT = path.resolve(__dirname, '..');
const { JudgmentEngine } = require(path.join(ROOT, 'src/core/judgment-engine.js'));

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-je-leak-'));
const FIRST = fs.readFileSync(path.join(ROOT, 'scripts/round-439-je-sample.txt'), 'utf8').trim().split('\n')[0].trim();

(async () => {
  const je = new JudgmentEngine({ dataDir: TMP });
  await je.judge(FIRST);
  await new Promise(r => setTimeout(r, 3200));
  const p = path.join(TMP, 'judgment-history.json');
  const raw = fs.readFileSync(p, 'utf8');
  const saved = JSON.parse(raw);
  const rec = saved.history[saved.history.length - 1];

  const fragments = [FIRST, ...FIRST.split(/[，。！？、；：\s]+/).filter(s => s.length >= 3)];
  const where = [];
  const walk = (o, key) => {
    if (typeof o === 'string') {
      const hits = fragments.filter(f => o.includes(f));
      if (hits.length) where.push(key + ' => ' + JSON.stringify(o.slice(0, 90)));
      return;
    }
    if (Array.isArray(o)) { o.forEach((v, i) => walk(v, key + '[' + i + ']')); return; }
    if (o && typeof o === 'object') { for (const k of Object.keys(o)) walk(o[k], key + '.' + k); }
  };
  walk(saved, 'root');
  console.log('LEAK_PATHS=' + where.length);
  for (const w of where.slice(0, 12)) console.log('  ' + w);
  console.log('KEYS_OF_REC=' + Object.keys(rec).join(','));
  console.log('KEYS_OF_CTX=' + Object.keys(rec.context || {}).join(','));
  fs.rmSync(TMP, { recursive: true, force: true });
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
