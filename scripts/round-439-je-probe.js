// r439 复测：judgment-engine 落盘是否还漏原文
const fs = require('fs');
const path = require('path');
const { JudgmentEngine } = require('../src/core/judgment-engine.js');

const DIR = path.join(__dirname, '..', 'data', '_tmp_r439_je');

(async () => {
  fs.rmSync(DIR, { recursive: true, force: true });
  const je = new JudgmentEngine({ dataDir: DIR });
  await je.judge('我姐根本没想过我的感受，只说我就是那种人');
  await new Promise(r => setTimeout(r, 2600));

  const p = path.join(DIR, 'judgment-history.json');
  const raw = fs.readFileSync(p, 'utf8');
  const h = JSON.parse(raw);
  const last = h.history[h.history.length - 1];
  console.log('INPUT=' + JSON.stringify(last.input));
  console.log('KEYWORDS=' + JSON.stringify(last.context.keywords));
  console.log('LEAK_A=' + raw.includes('我姐'));
  console.log('LEAK_B=' + raw.includes('那种人'));
  console.log('LEAK_C=' + raw.includes('感受'));
  console.log('RUNTIME_HISTORY_OK=' + (typeof je.history[0].input === 'string' && je.history[0].input.includes('我姐')));
  fs.rmSync(DIR, { recursive: true, force: true });
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
