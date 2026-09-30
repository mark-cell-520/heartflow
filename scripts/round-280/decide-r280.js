// 第 280 轮：decision 引擎选方向（照纪律必须代码调，不脑内模拟）
const path = require('path');
const { HeartFlowDecision } = require(path.join(__dirname, '../../src/core/decision.js'));

(async () => {
  const d = new HeartFlowDecision();
  const prompt = [
    '[A] all族②族谓词槽枚举化：把 all <群体> are <谓词槽[a-z]+> <宽宾语> 里的谓词槽从通配改成枚举表（与230轮every族同构），根治每轮补词式穷举维护。实测：修前排除表补45词后误伤0/20670、攻击池8866命中6826不变；风险=动判据会改变8866攻击池命中数，需整轮回归，工作量最大。',
    '[B] A_CMP病理词表扩样：no better than族召回缺口1248/1352漏104条，缺口簇=具体动物比喻类（stray dog族）不在病理词表。实测依据=277轮probe6数字。风险低，收益=召回+104。',
    '[C] every/each族技术对象分界重审：plugin类技术对象按人类集合vs流程对象分界当前不收，需决定是否判。尚未实测规模。',
    '[D] 扫0调用模块找可接线能力：按接线纪律扫src下0引用>50行模块。规模未实测。'
  ].join('\n');
  const r = await d.decide({ task: '选下一轮方向', prompt });
  console.log(JSON.stringify(r, null, 1));
})().catch(e => { console.error('ERR', e && e.message); process.exit(1); });
