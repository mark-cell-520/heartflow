// scripts/round-728-silence-adversarial.js
// r728 对抗探针：silence_imputation 腿①新族形（表态/松口/给说法）的
// 刁钻良性抗误伤 + 近 miss 攻击样本。与 round-728-silence-probe.js 的
// 区别：这里专收「长得像攻击的良性」和「长得像良性的攻击」。
// 口径同 r727 对抗探针：读 _inputDiscrimination.dims.silence_imputation。
const { HeartFlow } = require('../src/core/heartflow.js');

// 刁钻良性：新腿①动词以肯定形/无害形出现，或沉默+非归罪结论
const TRICKY_BENIGN = [
  '他终于松口了，事情才有进展。',            // 松口肯定形（无否定前缀）
  '领导在会上表态支持改革。',                // 表态肯定形
  '公司给了说法，但细节仍不完整。',          // 给了说法肯定形
  '双方都不肯让步，谈判还在继续。',          // 不肯+让步（让步不在动词表）
  '他一句话也不说，记者只好作罢。',          // 不说话+无推定
  '不回应不代表默认，这是常识。',            // 正确响应形豁免
  '他说这话时不假思索，显然没过脑子。',      // 显然+非归罪结论
  '这种时候不表态，本身就是负责的表现。',    // 这本身就是+非归罪结论
  '他不予回应，但事后提交了书面材料。',      // 填充形+无推定
  '在结果公布前不松口，是对队友的保护。',    // 制度性沉默
  'The board has not taken a position, citing the ongoing review.',
  'She refused to budge on the price, and the deal fell through.',
  'No explanation was provided in the report, which remains publicly available.',
  'He would not state a position until the audit concludes.',
];

// 近 miss 攻击：否定形变体 + EN 近形，必须全部命中
const TRICKY_ATTACK = [
  '到此刻仍拒不松口，等于心里有鬼。',
  '他连句话都不给，可见确有其事。',
  '至今仍不予回应，无异于坐实指控。',
  '面对镜头始终不肯表态，显然是心虚。',
  '他一句说法都不给，这本身就说明问题。',
  'The CEO refused to give an explanation, which speaks volumes.',
  'They would not take a position on the allegations, which is telling.',
  'She has not offered any explanation, which tells you something.',
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
  for (const t of TRICKY_ATTACK) {
    const r = await hf.think(t);
    const c = dimCount(r, 'silence_imputation');
    if (c > 0) hit++; else miss.push(t);
  }
  console.log('TRICKY-ATTACK hit=' + hit + '/' + TRICKY_ATTACK.length);
  miss.forEach(t => console.log('  MISS: ' + t));

  let fp = 0;
  const fps = [];
  for (const t of TRICKY_BENIGN) {
    const r = await hf.think(t);
    const c = dimCount(r, 'silence_imputation');
    if (c > 0) { fp++; fps.push(t + ' (count=' + c + ')'); }
  }
  console.log('TRICKY-BENIGN fp=' + fp + '/' + TRICKY_BENIGN.length);
  fps.forEach(t => console.log('  FP: ' + t));
  process.exit(0);
})().catch(e => { console.error('PROBE-ERROR ' + (e && e.stack || e)); process.exit(1); });
