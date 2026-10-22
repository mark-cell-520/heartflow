// r608 能力重叠实测：forgettingEngine 要接的能力 vs 已接线 memoryConsolidation / 公式库
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));

const hf = new HeartFlow();
hf.start();

const now = Date.now();
const mem = { id: 'm1', content: '测试记忆内容', timestamp: now - 86400000, accessCount: 3, referenceCount: 2, importance: 0.5, layer: 'LEARNED' };

const out = { allowedForgetting: [], hasMemConsolidation: false, memConsolidationRoutes: [], memConsolidationMethods: {} };
out.allowedForgetting = Array.from(HeartFlow.ALLOWED_ROUTES).filter(r => r.startsWith('forgetting'));
out.hasMemConsolidation = !!hf._modules['memoryConsolidation'];
if (out.hasMemConsolidation) {
  out.memConsolidationRoutes = Array.from(HeartFlow.ALLOWED_ROUTES).filter(r => r.startsWith('memoryConsolidation.'));
  const mod = hf._modules['memoryConsolidation'];
  out.memConsolidationMethods = {
    ownMethods: Object.keys(mod).filter(k => typeof mod[k] === 'function'),
    protoMethods: (() => { try { return Object.getOwnPropertyNames(Object.getPrototypeOf(mod)).filter(m => m !== 'constructor' && typeof mod[m] === 'function'); } catch (e) { return []; } })(),
  };
}

// 已接线侧：公式库的 ebbinghaus 是否可达
try {
  const FE = require(path.join(ROOT, 'src/memory/forgetting.js'));
  const fe = new FE.ForgettingEngine();
  out.forgettingEngineDirect = {
    checkForget: fe.checkForget(mem, 0.5),
    detectOscillationFresh: fe.detectOscillation(),
    ebbinghausRetention1d: fe.ebbinghausRetention(86400000, 0),
    ebbinghausRetention1d_x3: fe.ebbinghausRetention(86400000, 3),
    getForgettingProbability: fe.getForgettingProbability(86400000),
  };
} catch (e) { out.forgettingEngineDirect = { err: e.message }; }

// 公式库侧：ebbinghaus_forgetting_curve 是否已有实现
try {
  const formulaBridge = require(path.join(ROOT, 'src/core/formula-bridge.js'));
  out.formulaBridgeExports = Object.keys(formulaBridge).slice(0, 25);
} catch (e) { out.formulaBridgeExports = { err: e.message }; }

console.log(JSON.stringify(out, null, 1));
