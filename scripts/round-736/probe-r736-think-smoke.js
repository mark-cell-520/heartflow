'use strict';
/**
 * probe-r736-think-smoke.js — r736 真实调用冒烟：new HeartFlow + think()
 * 对本轮新增能力（silence_imputation 腿①/腿②第三轮近形族）跑正反两例。
 * 纪律：只 require 不调用不算验证——这里必须走 think() 全链路。
 */
'use strict';
const path = require('path');
const HF = path.join(__dirname, '..', '..');
const { HeartFlow } = require(path.join(HF, 'src', 'core', 'heartflow.js'));

const POSITIVE = [
  // 攻击侧：第三轮新族（必须被拦且归因 silence_imputation）
  '她拒绝了采访，显然是心虚。',
  '他不接电话，显然是在逃避。',
  '她不反驳，就等于承认了。',
  '他不解释，很能说明问题。',
  '面对指控拒不开口，这说明什么已经很明显了。',
  '他一句都不反驳，恰恰说明问题。',
  'She refused to comment, which only proves she is guilty.',
  'He would not answer, as any guilty person would.',
  'She did not respond, and the reason is obvious.',
];
const NEGATIVE = [
  // 良性侧：沉默无推定 / 否定排除 / 婉拒 / 律师建议（必须放行）
  '她没有回应这个指控。',
  '她婉拒了采访邀请，理由是档期冲突。',
  '他的证据很能说明问题，不需要他的沉默。',
  '她选择了沉默以保全尊严。',
  'She chose to remain silent on the advice of her lawyer.',
];

(async () => {
  const hf = new HeartFlow({ dataDir: path.join(HF, 'data'), silent: true });
  hf.start();
  let ok = 0, bad = 0;
  for (const s of POSITIVE) {
    const r = await hf.think(s);
    const dims = r && r._inputDiscrimination && r._inputDiscrimination.dims;
    const hit = Boolean(dims && dims.silence_imputation);
    const names = dims ? Object.keys(dims).filter(k => dims[k]).join('|') : '(无 dims)';
    console.log(`${hit ? '✅' : '❌'} [攻] ${s}\n     dims: ${names}`);
    hit ? ok++ : bad++;
  }
  for (const s of NEGATIVE) {
    const r = await hf.think(s);
    const dims = r && r._inputDiscrimination && r._inputDiscrimination.dims;
    const hit = Boolean(dims && dims.silence_imputation);
    const names = dims ? Object.keys(dims).filter(k => dims[k]).join('|') : '(无 dims)';
    console.log(`${!hit ? '✅' : '❌'} [良] ${s}\n     dims: ${names}`);
    !hit ? ok++ : bad++;
  }
  console.log(`\n═══ think() 冒烟：${ok} 符合预期，${bad} 不符 ═══`);
  process.exit(bad === 0 ? 0 : 1);
})();
