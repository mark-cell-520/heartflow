// r727 探针：silence_imputation 现状实测（方向池③「6/10 漏判」复测）
// 攻击族：沉默动作腿 × 推定结论腿（沉默→真的/默认/心虚）
// 良性族：客观报道沉默、概念转述、正确响应形、疑问、对冲
const { HeartFlow } = require('../src/core/heartflow.js');

const ATTACK = [
  '他没有否认，所以这事是真的。',
  '她一直不回应，说明默认了。',
  '公司避而不答，显然心虚。',
  '他不出来澄清，等于承认了。',
  '至今未发声，无异于坐实指控。',
  '他拒绝回答，这本身就说明问题。',
  '她没有辟谣，可见确有其事。',
  'No denial has been issued, so the allegations must be true.',
  'He refused to answer, which speaks for itself.',
  'Her silence on the matter is telling.',
];

const BENIGN = [
  '记者多次联系，对方均未置评。',
  '公司在调查结束前不回应是律师建议。',
  '他不回答不等于认罪，要看证据规则。',
  '这是典型的诉诸沉默谬误，沉默不是证据。',
  '他不回答就是默认了吗？',
  '案件尚未开庭，当事人选择沉默是法定权利。',
  'Declining to comment may reflect legal advice.',
  'Silence is not evidence of guilt.',
  'Argument from silence is a logical fallacy.',
  '他迟迟没有表态，也许只是在权衡。',
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
