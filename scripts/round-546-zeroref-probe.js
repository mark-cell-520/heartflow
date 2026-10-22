// r546 探针：zero-ref 模块接线可行性实测
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

async function probe() {
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const hf = new HeartFlow();
  await hf.start();
  const out = { pluginLoader: 'none', pluginCount: 0, blindSpotPresent: false, plugins: [] };
  if (hf._pluginLoader) {
    const loaded = hf._pluginLoader.loaded ? hf._pluginLoader.loaded() : [];
    out.pluginLoader = typeof hf._pluginLoader.loaded === 'function' ? 'has loaded()' : Object.keys(hf._pluginLoader);
    out.pluginCount = loaded.length;
    out.plugins = loaded.map(p => p.name || p.id || String(p));
  }
  const r = await hf.think('如何提高团队效率？');
  out.thinkKeys = r ? Object.keys(r).slice(0, 40) : null;
  out.blindSpotPresent = !!(r && r.blindSpotAnalysis);
  if (r && r.blindSpotAnalysis) out.blindSpotShape = Object.keys(r.blindSpotAnalysis);
  console.log(JSON.stringify(out, null, 2));
  if (hf.stop) await hf.stop();
}

probe().catch(e => console.log('ERR ' + e.message));
