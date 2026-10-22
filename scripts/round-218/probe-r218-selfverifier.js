// 第 218 轮探针 5：self-verifier.verify(reasoning, conclusion) 在真实链路上
// 被谁调用、传的 reasoning 是什么类型（复现 reasoning.toLowerCase is not a function）
const path = require('path');
const { HeartFlow } = require(path.join(process.cwd(), 'src/core/heartflow.js'));

(async () => {
  const hf = new HeartFlow();
  await hf.start();
  // 找 self-verifier 实例
  const seen = new Set();
  const found = [];
  const walk = (obj, depth, kp) => {
    if (!obj || typeof obj !== 'object' || depth > 4 || seen.has(obj)) return;
    seen.add(obj);
    for (const k of Object.keys(obj)) {
      let v; try { v = obj[k]; } catch { continue; }
      if (!v || typeof v !== 'object') continue;
      const c = v.constructor && v.constructor.name;
      if (c === 'SelfVerifier') found.push(kp + '.' + k);
      else if (depth < 4 && !['parent', '_ced', 'hf'].includes(k)) walk(v, depth + 1, kp + '.' + k);
    }
  };
  walk(hf, 0, 'hf');
  console.log('PROBE5-INST:' + JSON.stringify(found));

  // 找到后 patch verify 记录入参类型
  for (const kp of found) {
    const parts = kp.split('.').slice(1);
    let obj = hf;
    for (const p of parts.slice(0, -1)) obj = obj[p];
    const inst = obj[parts[parts.length - 1]];
    if (!inst) continue;
    const orig = inst.verify.bind(inst);
    inst.verify = function (reasoning, conclusion) {
      console.log('PROBE5-CALL:' + JSON.stringify({
        reasoningType: typeof reasoning,
        conclusionType: typeof conclusion,
        reasoningIsArr: Array.isArray(reasoning),
        reasoningLen: typeof reasoning === 'string' ? reasoning.length : null,
      }));
      return orig(reasoning, conclusion);
    };
  }
  await hf.think('帮我看看这个方案有没有什么问题', { compact: false });
  console.log('PROBE5-DONE');
})();
