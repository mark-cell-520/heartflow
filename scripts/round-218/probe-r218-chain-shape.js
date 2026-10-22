// 第 218 轮探针 10：result.chain 的真实结构（决定 reasoning 归一化策略）
const path = require('path');
const { HeartFlow } = require(path.join(process.cwd(), 'src/core/heartflow.js'));

(async () => {
  const hf = new HeartFlow();
  await hf.start();
  const r = await hf.think('帮我看看这个方案有没有什么问题', { compact: false });
  const chain = r.chain;
  const shape = (o, d) => {
    if (d > 2) return typeof o;
    if (Array.isArray(o)) return '[' + o.slice(0, 3).map(x => shape(x, d + 1)).join(',') + ']';
    if (o && typeof o === 'object') {
      return '{' + Object.keys(o).slice(0, 6).map(k => k + ':' + shape(o[k], d + 1)).join(',') + '}';
    }
    return JSON.stringify(String(o).slice(0, 40));
  };
  console.log('PROBE10-CHAIN:' + JSON.stringify({
    type: typeof chain,
    isArr: Array.isArray(chain),
    shape: chain ? shape(chain, 0) : null,
    keys: chain && typeof chain === 'object' ? Object.keys(chain).slice(0, 10) : null,
    stagesIsArr: chain && Array.isArray(chain.stages) ? chain.stages.length : null,
  }));
  console.log('PROBE10-CONCL:' + JSON.stringify({
    text: typeof r.output?.text, conclusion: typeof r.output?.conclusion,
    textLen: r.output?.text ? String(r.output.text).length : 0,
  }));
})();
