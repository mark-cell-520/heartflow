// r257 probe: 插件加载与 hook 事件面实测
const path = require('path');
process.chdir('/data/home/heartflow');
const hf = require('/data/home/heartflow/src/index.js');
const out = {};
out.keys = Object.keys(hf).filter(k => /plugin|hook|think|gate|checkOutput|discriminate/i.test(k));
out.hasPluginLoader = !!hf._pluginLoader;
if (hf._pluginLoader) out.stats = hf._pluginLoader.getStats();
if (hf._hookBus) {
  out.events = hf._hookBus.listEvents ? hf._hookBus.listEvents() : Object.keys(hf._hookBus._handlers || {});
  out.handlerCounts = {};
  for (const [ev, list] of (hf._hookBus._handlers || new Map())) {
    out.handlerCounts[ev] = list.map(h => h.id + '@' + h.priority);
  }
}
console.log(JSON.stringify(out, null, 2));
