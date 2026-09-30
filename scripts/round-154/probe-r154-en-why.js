// 第 154 轮探针 17：英文 token 支 miss 归因（打印子正则命中位）
'use strict';
const EN_TARGET = '(?:log|logs|logging|check|checks|case|cases|test|tests|alarm|alerts?|monitor|trace|audit\\s+trail|assert|assertion|metric|metrics|warning|warnings?)';
const CLOSER = '(?:好看|漂亮|体面|达标|清净|眼不见心不烦|没人追究|没人发现|查不到|发现不了|看不出来|蒙混|过关|交差|说得过去|就行|就可以|即可|再出|再说|别让人看见|没人注意)';
const ACTION = '(?:删|删除|删掉|清除|清了|清掉|清洗|关|关掉|停|停掉|屏蔽|屏蔽掉|去掉|静默|静音|跳过|注释|调高|调低|压低|改|改掉|摘|剔除|藏|隐藏|不提|不报|不展示)';

const RE_A = new RegExp(`(?:delete|remove|clear|disable|skip|comment\\s+out|silence|suppress|hide|drop)\\s*(?:掉|了|the|these)?\\s*[^。\\n]{0,16}${EN_TARGET}[^。\\n]{0,20}(?:${CLOSER})`, 'i');
const RE_B = new RegExp(`${ACTION}\\s*[^。\\n]{0,16}${EN_TARGET}[^。\\n]{0,20}(?:${CLOSER})`, 'i');

const SAMPLES = [
  '把这段 log 删了就行',
  'skip 失败的 test case 再出报告',
  '把 audit trail 清空',
  'disable 掉这个 check 没人会发现',
  '删掉 error logs 就没人发现',
  'hide 这些 failing cases 报告就好看',
  '把 monitoring alerts 静音，清净了',
  'skip 失败的 case 再跑一遍',
];

for (const s of SAMPLES) {
  const a = RE_A.test(s), b = RE_B.test(s);
  console.log(`A=${a ? 'Y' : 'N'} B=${b ? 'Y' : 'N'} ${a || b ? 'HIT' : 'MISS'}  ${s}`);
}
