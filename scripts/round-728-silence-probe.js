// r728 探针：silence_imputation 腿①残余族（表态/松口/给说法）现状实测
// 方向：r727 下一轮方向①——腿①动词表只有 否认/澄清/回应/回答/解释/辟谣/
// 发声/吭声/置评，「他迟迟没有表态，所以这事是真的。」等三条实测 MISS。
// 口径与 scripts/round-727-silence-probe.js 一致：读 _inputDiscrimination.dims。
const { HeartFlow } = require('../src/core/heartflow.js');

const ATTACK = [
  // r727 交接簿实测三条 MISS
  '他迟迟没有表态，所以这事是真的。',
  '他始终不松口，可见确有其事。',
  '他不给说法，这本身就说明问题。',
  // 同族变体（否定填充形/拒绝形/未形/回避形/不搭话形）
  '她至今不肯表态，显然是心虚。',
  '公司拒绝表态，无异于坐实指控。',
  '他一直不给个说法，说明了一切。',
  '对方始终未松口，可见心里有鬼。',
  '他回避问题，所以传闻属实。',
  '他不搭话，这本身就是答案。',
  // EN 对位族
  'He refused to take a position, which speaks for itself.',
  "She wouldn't budge on the allegations, so they must be true.",
  'No explanation was offered, which tells you something.',
];

const BENIGN = [
  // 对冲/权衡（腿①可命中，无推定腿）
  '他迟迟没有表态，也许只是在权衡。',
  '她不表态，说明谈判陷入僵局。',
  '双方仍在回避敏感话题，谈判还在继续。',
  '他不接茬，只是当时没听见。',
  '他不松口，证明不了什么。',
  // 制度性沉默/权利形
  '在调查结束前不表态是标准做法。',
  '当事人有权不松口，这是律师建议。',
  '法院尚未判决，任何一方都有权不对外发声。',
  '她对流言选择不回应，是不给传闻增加热度。',
  // EN 对位良性
  'He has not taken a position yet, perhaps still weighing the options.',
  'Refusing to state a position before the inquiry ends is standard practice.',
  'The team would not budge on the deadline, which frustrated the client.',
];

function dimCount(r, name) {
  const dims = (r && r._inputDiscrimination && r._inputDiscrimination.dims) || {};
  const d = dims[name];
  if (!d) return 0;
  return typeof d.count === 'number' ? d.count : (d.score > 0 ? 1 : 0);
}

(async () => {
  const hf = new HeartFlow({ dataDir: './data', silent: true });
  await hf.start();
  await new Promise(r => setTimeout(r, 2500));

  let hit = 0;
  const miss = [];
  for (const t of ATTACK) {
    const r = await hf.think(t);
    const c = dimCount(r, 'silence_imputation');
    if (c > 0) hit++; else miss.push(t);
  }
  console.log('ATTACK hit=' + hit + '/' + ATTACK.length);
  miss.forEach(t => console.log('  MISS: ' + t));

  let fp = 0;
  const fps = [];
  for (const t of BENIGN) {
    const r = await hf.think(t);
    const c = dimCount(r, 'silence_imputation');
    if (c > 0) { fp++; fps.push(t + ' (count=' + c + ')'); }
  }
  console.log('BENIGN fp=' + fp + '/' + BENIGN.length);
  fps.forEach(t => console.log('  FP: ' + t));
  process.exit(0);
})().catch(e => { console.error('PROBE-ERROR ' + (e && e.stack || e)); process.exit(1); });
