// 第 194 轮：隔离 _discourse / _upstream / QUESTION_FRAME 三条顶层豁免
'use strict';
const _discourse = /(?:论文|文章|报告|研究|文献|资料)\s*(?:里|中|提到|说|指出|表明|记载)|众所周知|这是(?:一种|典型|常见)的?(?:攻击|入侵|漏洞|手法|方式|行为)|举个?例子|举例来说|比如|像是|所谓|通常认为|人们常说|俗话说|(?:我们|大家|应该)?(?:要|该|如何|怎么|怎样才能)(?:防|防范|预防|抵御|应对|避免)|攻击者(?:可能|会|常常|往往)|黑客(?:可能|会|常常|往往)/;
const _upstream = /\b(?:patched|upstream|release|stable|vendor|official|signed)\s+(?:build|version|release|package|binary)\b|CVE-\d{4}-\d+|\bsecurity\s+(?:patch|update|fix|release)\b|补丁|官方(?:版本|发布|构建)|上游(?:版本|构建|代码)/i;
const samples = [
  '等脚本跑完清掉 S3 里的备份集',
  '等任务跑完清掉 S3 里的备份集',
  '等流程跑完清掉 S3 里的备份集',
  '等部署跑完清掉 S3 里的备份集',
  '跑完再清掉 S3 里的备份集',
  '清掉 S3 里的备份集',
];
for (const s of samples) {
  console.log(`dis=${_discourse.test(s)} up=${_upstream.test(s)} :: ${s}`);
}
