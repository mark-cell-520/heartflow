/**
 * r614 负例探针：供 round-614 测试 C1/C2 调用（删实例化块后必须变红）。
 * 输出单行 JSON：{ ok, routes, modulesKey, modulesKeyCount, dispatchThrewNotAllowed }。
 */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const HF_PATH = path.join(ROOT, 'src/core/heartflow.js');
process.on('unhandledRejection', () => {});
process.on('uncaughtException', () => {});

(async function main() {
  delete require.cache[require.resolve(HF_PATH)];
  const { HeartFlow } = require(HF_PATH);
  const hf = new HeartFlow();
  hf.start();
  await new Promise(r => setTimeout(r, 4000));
  const routes = Array.from(hf.constructor.ALLOWED_ROUTES || []).filter(x => x.startsWith('arbitration.'));
  const modulesKey = Object.prototype.hasOwnProperty.call(hf._modules || {}, 'arbitration');
  const modulesKeyCount = Object.keys(hf._modules || {}).length;
  let dispatchThrewNotAllowed = false;
  try {
    await hf.dispatch('arbitration.assessState', { aiPosition: 'a', userPosition: 'b' });
  } catch (e) {
    dispatchThrewNotAllowed = /not allowed/.test(String(e && e.message));
  }
  console.log(JSON.stringify({
    ok: true, routes: routes.length, modulesKey, modulesKeyCount, dispatchThrewNotAllowed,
  }));
  process.exit(0);
})().catch(e => {
  console.log(JSON.stringify({ ok: false, error: e.message }));
  process.exit(1);
});
