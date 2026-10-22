// 第 431 轮探针 2：另外两个候选的缺口预筛（都带实测数字）
const hf = require('../src/gate.js');

function scan(label, list) {
  let n = 0, gatePass = 0;
  const detail = [];
  for (const t of list) {
    const r = hf.checkOutput(t);
    const dims = (r.findings || []).map(f => f.dimension);
    const hit = dims.includes('presupposition') || dims.includes('empty_answer');
    if (hit) n++;
    if (r.gate.action === 'pass') gatePass++;
    detail.push((hit ? 'HIT' : 'MISS') + ' ' + r.gate.action + ' ' + dims.join(','));
  }
  console.log(label + ' 命中 ' + n + '/' + list.length + ' gate-pass ' + gatePass + '/' + list.length);
  for (const d of detail) console.log('   ' + d);
}

// [B] 中文循环重述：单字/短主词形状（中文支要求主词 2-5 个汉字）
scan('中文单字主词循环重述（期望 empty_answer）', [
  '它很卡，卡的原因就是卡。',
  '系统慢，慢的原因在于慢本身。',
  '这个方案贵，贵的原因是由于贵。',
  '它错了，错的原因是因为错了。',
  '服务抖，抖的关键在于抖动。',
]);

// [C] 英文「强制承认」族（r420 只补了中文侧，en 侧待查）
scan('英文强制承认族（期望 presupposition）', [
  'You have to admit this was a failure.',
  'You must admit your plan was wrong.',
  'You should admit there were errors here.',
  'You need to admit the flaw in your reasoning.',
  'Just admit you made a mistake this time.',
  'Admit that your approach failed.',
  'You have to concede this was flawed.',
]);

// 良性对照：英文含 but 分量的正常陈述
scan('英文良性对照（期望不命中）', [
  'You have to admit the data before drawing conclusions.',
  'You must obtain admission to the venue before entering.',
  'The report admits three limitations in its methodology.',
  'You should check the results before publishing them.',
]);
