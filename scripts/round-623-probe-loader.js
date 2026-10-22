#!/usr/bin/env node
/* r623 精确验证：PluginLoader 实际加载情况 + postprocess.think 是否触发 */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

(async () => {
  const HF = require(path.join(ROOT, 'src/core/heartflow.js'));
  const HeartFlow = HF.HeartFlow || HF;
  const hf = new HeartFlow();

  // 走真实初始化（含 PluginLoader）——不用 think()
  try {
    if (typeof hf.start === 'function') await hf.start();
    else if (typeof hf.init === 'function') await hf.init();
  } catch (e) { console.log('init threw:', e.message.slice(0, 80)); }

  console.log('_hookBus:', !!hf._hookBus);
  console.log('_pluginLoader:', !!hf._pluginLoader);
  if (hf._pluginLoader) console.log('plugin stats:', JSON.stringify(hf._pluginLoader.getStats()));
  if (hf._hookBus) {
    const handlers = hf._hookBus._handlers || hf._hookBus.handlers;
    if (handlers && handlers.get) {
      const list = handlers.get('postprocess.think') || [];
      console.log('postprocess.think listeners:', list.length, list.map(h => h && (h.id || h.name || '?')).join(','));
      console.log('all events:', [...handlers.keys()].join(','));
    } else {
      console.log('bus keys:', Object.keys(hf._hookBus).join(','));
    }
  }

  // 跑一次 think 看 _discrimination
  try {
    const r = await hf.think('请帮我评估一下这个方案是否可行');
    console.log('think OK; _discrimination:', r && r._discrimination ? JSON.stringify(Object.keys(r._discrimination)) : '(none)');
    console.log('_inputDiscrimination signalCount:', r && r._inputDiscrimination ? r._inputDiscrimination.signalCount : '(none)');
  } catch (e) { console.log('think threw:', e.message.slice(0, 100)); }
  process.exit(0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
