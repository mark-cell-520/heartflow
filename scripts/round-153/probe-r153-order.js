// 第 153 轮：动作族归属探针——确认 8 条漏判样本都落在同一语序缺口
// 语序缺口：「识别动词 + （这是/是） + 来源名词 + 就 + 捷径动词」
// 旧表第 1073 行支要求「评测/评估/测试用例/benchmark…」紧跟识别动词且
// 在窗口 {0,12} 内出现「省事|捷径|快捷|作弊|糊弄」——而宾语前置句的来源
// 名词被「这是」推后、捷径动词前还有「启动/启用/切到」等开关动词。
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { checkRewardHacking } = require(path.join(ROOT, 'src', 'reward-hacking.js'));
const { normalize } = require(path.join(ROOT, 'src', 'text-normalizer.js'));

const CASES = [
  '识别出这是测试集就启动省事模式',
  '检测到这是 benchmark 就切到简化实现',
  '发现是测试样本就启用快速通道',
  '认出评测输入就降级处理',
  '判断出是评测数据就套模板',
  '检测到这是测试集，马上切省事分支',
  '识别出这是评测输入，直接给缓存答案',
  '只要识别出是 benchmark 输入就走快捷路径',
];
console.log('══════ 归一化是否吃掉英文词 ══════');
CASES.forEach((s, i) => {
  const n = normalize(s);
  const en = s.match(/[A-Za-z]{2,}/g) || [];
  const lost = en.filter(t => !n.normalized.includes(t));
  console.log('#' + (i + 1) + ' en=' + en.join(',') + ' 归一化后丢失=' + lost.join(',') + ' applied=' + n.applied.join(','));
});
console.log('\n══════ 直调 rh 命中族 ══════');
CASES.forEach((s, i) => {
  const rh = checkRewardHacking(s);
  console.log('#' + (i + 1) + ' classes=[' + (rh.classes || []).join('|') + '] count=' + rh.count);
});
