// 第 217 轮冒烟：反思闭环在 think() 上是否真的闭合
const path = require('path');
const { HeartFlow } = require(path.join(process.cwd(), 'src/core/heartflow.js'));

const hf = new HeartFlow();
(async () => {
  try {
    await hf.start();
    const r = await hf.think('帮我看看这个方案有没有什么问题', { compact: false });
    const closed = r && r._reflectionLoopClosed;
    const rl = hf._reflectionLoop;
    console.log('SMOKE:' + JSON.stringify({
      closed: !!closed,
      fields: closed || null,
      reflectCalled: !!(rl && rl._r217ReflectCalled),
      monitorCalled: !!(rl && rl._r217MonitorCalled),
      logLen: rl && Array.isArray(rl.reflectionLog) ? rl.reflectionLog.length : null,
      selfReflection: r && r._selfReflection ? Object.keys(r._selfReflection) : null,
      initErrors: (hf._initErrors || []).filter(e => e.module === 'optional').map(e => e.error).slice(0, 5),
    }));
  } catch (e) {
    console.log('SMOKE_ERR:' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e.message));
  }
})();
