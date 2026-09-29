// 第 218 轮探针 11：chain.stages[*].result 的可读文本在哪（决定归一化取值字段）
const path = require('path');
const { HeartFlow } = require(path.join(process.cwd(), 'src/core/heartflow.js'));

(async () => {
  const hf = new HeartFlow();
  await hf.start();
  const r = await hf.think('帮我看看这个方案有没有什么问题', { compact: false });
  const st = (r.chain && r.chain.stages) || [];
  const info = st.map(s => ({
    name: s.name,
    resultKeys: s.result && typeof s.result === 'object' ? Object.keys(s.result).slice(0, 8) : (typeof s.result),
    hasText: typeof s.result?.text === 'string',
    textLen: typeof s.result?.text === 'string' ? s.result.text.length : 0,
    hasConclusion: typeof s.result?.conclusion === 'string',
    concLen: typeof s.result?.conclusion === 'string' ? s.result.conclusion.length : 0,
    success: s.success,
  }));
  console.log('PROBE11:' + JSON.stringify(info));
})();
