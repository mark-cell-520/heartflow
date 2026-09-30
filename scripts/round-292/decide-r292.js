/**
 * r292 探针 13：心虫自主选方向（decision.decide 真调用）
 * 按纪律：心虫自选方向必须用代码调 decision，不许靠读简报脑内模拟。
 */
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { HeartFlowDecision } = require(path.join(ROOT, 'src/core/decision.js'));

async function main() {
  const d = new HeartFlowDecision();
  const prompt = [
    '[A] 补 113 处否定类半角孪生：实测 gate 判词 0 影响、0 回归（只消理论不对称，无肉眼可见收益）',
    '[B] 修法 B（normalize 补全角标点折叠）：全量语料抓 10 条漏判，但引 contradiction 1 条回归，需先定位并堵回归',
    '[C] 转架构层：gate() 直调与 runPipeline() 入口归一化不一致（一个走 text-normalizer 不动中文标点、一个走 NFKC 折半角），让两条路统一',
  ].join('\n');
  const r = await d.decide({ task: '选下一轮方向', prompt });
  console.log(JSON.stringify(r, null, 2));
}
main().then(() => {}, (e) => { console.error('ERR', e && e.message); process.exit(1); });
