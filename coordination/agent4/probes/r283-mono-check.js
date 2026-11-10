// r283：确认 co-b4 的 monocausal_attribution 命中是否独立于本轮三个模块的改动
const m = require('/data/home/heartflow/src/monocausal-attribution.js');
const fn = m.checkMonocausalAttribution || m.check || Object.values(m).find((v) => typeof v === 'function');
const s = '在活到九十岁的人里，抽烟喝酒的比例比普通人高，但这只是样本选择，未必说明什么。';
const r = fn(s, {});
console.log('module-level hit:', JSON.stringify(r).slice(0, 400));
