// r218 探针：插件加载状态 + gate 路径是否经过 postprocess.think
'use strict';
const path = require('path');
const { PluginLoader } = require(path.join(__dirname, '..', '..', '..', 'src', 'loader', 'plugin-loader.js'));

const events = [];
const hookBus = { on: (e) => events.push(e), fire: async () => ({}) };
const hf = { _hookBus: hookBus };
const loader = new PluginLoader(hf);
const r = loader.loadAll();
console.log('loadAll:', JSON.stringify(r));
console.log('hooks registered:', events);
console.log('stats:', JSON.stringify(loader.getStats()));

// gate 路径是否触发 postprocess.think？检查 gate.js / index.js 是否引用 think-pipeline
const fs = require('fs');
for (const f of ['src/gate.js', 'src/index.js']) {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', '..', f), 'utf8');
  console.log(f, 'mentions think-pipeline:', src.includes('think-pipeline'), '| mentions hookBus:', src.includes('hookBus'), '| mentions postprocess.think:', src.includes('postprocess.think'));
}
