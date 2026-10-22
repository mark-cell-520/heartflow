// r546 探针：确认 blindSpotAnalysis 的真实来源（plugin vs think-pipeline 内联）
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));

async function main() {
  const hf = new HeartFlow();
  // 不调用 start()，直接看 think-pipeline 里 fire hook 的上下文
  const r = await hf.think('如何提高团队效率？');
  console.log('blindSpotPresent=' + !!(r && r.blindSpotAnalysis));
  if (r && r.blindSpotAnalysis) {
    console.log('keys=' + Object.keys(r.blindSpotAnalysis).join(','));
  }
  console.log('engine._blindSpotBreaker=' + (hf._blindSpotBreaker ? 'PRESENT' : 'ABSENT'));
  console.log('engine._pluginLoader=' + (hf._pluginLoader ? 'PRESENT' : 'ABSENT'));
  if (hf._pluginLoader) {
    console.log('loaded=' + JSON.stringify(hf._pluginLoader._loaded));
    console.log('failed=' + JSON.stringify(hf._pluginLoader._failed));
  }
}
main().catch(e => console.log('ERR ' + e.message));
