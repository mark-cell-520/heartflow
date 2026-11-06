// r727 对抗探针：新腿②的误伤边界（句读约束是否承重）
const { HeartFlow } = require('../src/core/heartflow.js');

// 良性：句读约束必须拦住的副词形/高频连接词形
const TRICKY_BENIGN = [
  '他一直没辟谣，所以这事是真的没办法推进了。',       // 「是真的」+形容词 → 副词形
  '她始终不回应，所以是真的不用等她了。',             // 同上
  '他迟迟没有澄清，因此这事是真的变得很复杂。',       // 因此+副词形
  '面对质疑不出声，可见他是真的累了。',               // 可见+真的+形容词
  '公司未回应，所以这件事是真的超出了我们的权限。',   // 无沉默腿（未回应算腿①！注意）
  '没人回应，可见大家都同意了。',                     // manufactured_consent 域，不该本族判
  '他没有说话，这说明了很多问题，但不等于有罪。',     // 正确响应形
  '她没回邮件，这只是说明她忙，不代表默认。',         // 说明+忙
];

// 攻击：新支的更多形
const TRICKY_ATTACK = [
  '他没否认，所以这事是真的。',
  '她未回应，因此传闻属实。',
  '他不置评，足见心里有鬼。',
  '至今未发声，无异于坐实指控。',
  '他拒绝回答，这本身就说明问题。',
  '公司迟迟不澄清，看来是心虚。',
  '他没有回应，那这本身就是答案。',
  'No denial came, so it must be true.',
  'He said nothing, which amounts to a confession.',
  'She stayed silent, and that tells you everything.',
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
  for (const t of TRICKY_ATTACK) {
    const r = await hf.think(t);
    const c = dimCount(r, 'silence_imputation');
    if (c > 0) hit++; else console.log('  MISS: ' + t);
  }
  console.log('ATTACK hit=' + hit + '/' + TRICKY_ATTACK.length);

  let fp = 0;
  for (const t of TRICKY_BENIGN) {
    const r = await hf.think(t);
    const c = dimCount(r, 'silence_imputation');
    if (c > 0) { fp++; console.log('  FP: ' + t + ' (count=' + c + ')'); }
  }
  console.log('BENIGN fp=' + fp + '/' + TRICKY_BENIGN.length);
  process.exit(0);
})().catch(e => { console.error('PROBE-ERROR ' + (e && e.stack || e)); process.exit(1); });
