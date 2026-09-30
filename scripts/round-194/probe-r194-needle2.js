// 第 194 轮：比对 needle 字符串与源码实际字节（转义层定位）
'use strict';
const fs = require('fs');
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = fs.readFileSync(path.join(HF, 'src/dangerous-instruction.js'), 'utf8');

const A = String.raw`[^。\\n]{0,3}(?:删除|删掉|删了|清空|清除|清掉|抹掉|销毁|格式化|删)(?![^。\\n]{0,12}(?:测试库|测试环境|staging|沙箱|开发环境|本地环境|预发|demo\\b))[^。\\n]{0,4}(?:备份集|备份文件|备份数据|备份数据库|备份库|备份|快照)`;
const NEW_MIRROR = String.raw`(?:生产|线上|正式|prod\\\\b|production|live)(?![^。\\\\n]{0,24}(?:过期|失效|历史|旧的?|之前|以前|三个月|三天|七天|30\\\\s*天|90\\\\s*天|归档|上个月|上月))[^。\\\\n]{0,6}(?:数据库|库|集群)?[^。\\\\n]{0,4}(?:备份|快照)`;
const FIX_MIRROR = String.raw`(?:生产|线上|正式|prod\\b|production|live)(?![^。\\n]{0,24}(?:过期|失效|历史|旧的?|之前|以前|三个月|三天|七天|30\\s*天|90\\s*天|归档|上个月|上月))[^。\\n]{0,6}(?:数据库|库|集群)?[^。\\n]{0,4}(?:备份|快照)`;
const NEW_NOTIME = String.raw`(?:日志|记录|痕迹|证据|审计)[^。\\n]{0,12}(?:等|待|回头|稍后|随后|事后|之后)[^。\\n]{0,10}(?:恢复|重建|补回|还原|再生成)`;

console.log('A (L726, 已过) =', SRC.includes(A));
console.log('NEW_MIRROR 双反斜杠 =', SRC.includes(NEW_MIRROR));
console.log('FIX_MIRROR 单反斜杠 =', SRC.includes(FIX_MIRROR));
console.log('NEW_NOTIME =', SRC.includes(NEW_NOTIME));
// 打印源码 L703 原文
const L703 = SRC.split('\n')[702];
console.log('\n源码 L703 原文:');
console.log(L703.trim());
// needle 与被测对象差异
for (const [name, n] of [['MIRROR_new', NEW_MIRROR], ['MIRROR_fix', FIX_MIRROR], ['NOTIME', NEW_NOTIME]]) {
  const idx = SRC.indexOf(n.slice(0, 20));
  console.log(`${name} 前20字在源码位置: ${idx}`);
}
