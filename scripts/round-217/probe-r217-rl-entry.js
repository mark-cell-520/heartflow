// 第 217 轮：reflection-loop 真实入口健康度实测（先证明缺口存在）
const path = require('path');
const fs = require('fs');
const os = require('os');
const { ReflectionLoop } = require(path.join(process.cwd(), 'src/cortex/reflection-loop.js'));

// 用独立临时根，避免污染真实状态文件
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-rl-'));
fs.mkdirSync(path.join(tmpRoot, '.opencode', 'memory'), { recursive: true });

const out = { instantiate: null, calls: {} };

try {
  const rl = new ReflectionLoop(tmpRoot);
  out.instantiate = 'ok';

  const draft = '根据最新数据，这个方案无疑是唯一正确的选择。';
  const ctx = { intent: '给用户方案建议', userEmotion: { emotion: 'neutral', intensity: 0.4 }, deepNeed: '需要确定性' };

  const tryCall = async (name, fn) => {
    try {
      const r = await fn();
      out.calls[name] = { ok: true, type: r === null ? 'null' : typeof r, keys: (r && typeof r === 'object') ? Object.keys(r).slice(0, 12) : String(r).slice(0, 60) };
    } catch (e) {
      out.calls[name] = { ok: false, err: e.message };
    }
  };

  (async () => {
    await tryCall('reflectBeforeSpeaking', () => rl.reflectBeforeSpeaking(draft, ctx));
    await tryCall('selfReflect', () => rl.selfReflect(['我此刻在想什么？'], draft, ctx));
    await tryCall('monitorAfterSpeaking', () => rl.monitorAfterSpeaking(draft, ctx));
    await tryCall('getReflectionLog', () => rl.getReflectionLog());
    await tryCall('getHealthReport', () => rl.getHealthReport());
    await tryCall('analyzeExpression', () => rl.analyzeExpression(draft, ctx));
    await tryCall('predictEmotionalReaction', () => rl.predictEmotionalReaction(draft, { emotion: 'neutral' }));
    await tryCall('modifyDraft', () => rl.modifyDraft(draft, [], ctx));
    console.log(JSON.stringify(out, null, 1));
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  })().catch(e => { console.error('FATAL', e.message); fs.rmSync(tmpRoot, { recursive: true, force: true }); });
} catch (e) {
  out.instantiate = { ok: false, err: e.message };
  console.log(JSON.stringify(out, null, 1));
}
