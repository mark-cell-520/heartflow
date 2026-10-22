// r608 精确确认 forgetting.js getField 未定义 bug 的影响面（哪些路径可达）
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const FE = require(path.join(ROOT, 'src/memory/forgetting.js'));
const fe = new FE.ForgettingEngine();

const now = Date.now();
const mem = { id: 'm1', content: '测试记忆内容', timestamp: now - 86400000, accessCount: 3, referenceCount: 2, importance: 0.5, layer: 'LEARNED' };

const out = {};

function attempt(label, fn) {
  try { out[label] = { ok: true, v: fn() }; }
  catch (e) { out[label] = { ok: false, err: String(e.name) + ': ' + String(e.message).slice(0, 90) }; }
}

attempt('validateMemory_direct', () => { const r = FE.validateMemory(mem); return { valid: r.valid, err: r.error }; });
attempt('checkForget_layerLEARNED', () => fe.checkForget(mem, 0.5));
attempt('checkForget_layerCORE', () => fe.checkForget({ ...mem, layer: 'CORE' }, 0.5));
attempt('checkForget_noLayer', () => fe.checkForget({ id: 'x', content: 'y' }, 0.5));
attempt('checkForget_invalidMemory', () => fe.checkForget({}, 0.5));
attempt('compress', () => { const r = fe.compress(mem); return { err: r.error, hasCompressed: !!r.compressed }; });
attempt('consolidate', () => { const r = fe.consolidate([mem, { ...mem, id: 'm2' }]); return r ? 'object' : r; });
attempt('retrieve', () => { const r = fe.retrieve(mem); return { err: r.error }; });
attempt('compressBatch', () => fe.compressBatch([mem]));
attempt('detectOscillation_empty', () => fe.detectOscillation());
attempt('getLevel', () => fe.getLevel(now - 86400000));
attempt('abstract', () => fe.abstract('长文本内容'.repeat(20), 10));
attempt('ebbinghausRetention', () => fe.ebbinghausRetention(86400000, 0));
attempt('getForgettingProbability', () => fe.getForgettingProbability(86400000));
attempt('healthCheck', () => fe.healthCheck());
attempt('getStats', () => fe.getStats());
attempt('getConfig', () => fe.getConfig());

// detectOscillation 在 trackAccess 之后（走 thrashing 分支）是否可达 getField
attempt('detectOscillation_afterAccess', () => {
  fe.reset();
  for (let i = 0; i < 12; i++) fe.compress({ ...mem, id: 'rep' });
  return fe.detectOscillation();
});

console.log(JSON.stringify(out, null, 1));
