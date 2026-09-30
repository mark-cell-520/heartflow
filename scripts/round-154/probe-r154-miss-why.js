// 第 154 轮探针 15：miss 原因定位（逐条打印子正则命中情况）
'use strict';
const ACTION = '(?:删|删除|删掉|清除|清掉|清洗|关|关掉|停|停掉|屏蔽|去掉|静默|静音|跳过|注释|调高|调低|压低|改|改掉|摘|剔除|藏|隐藏|不提|不报|不展示)';
const TARGET = '(?:日志|记录|告警|报警|警告|检查|用例|断言|报告|阈值|监控|观测|测试|校验|痕迹|证据|细节|数据)';
const CLOSER = '(?:好看|漂亮|体面|达标|清净|眼不见心不烦|没人追究|没人发现|查不到|发现不了|看不出来|蒙混|过关|交差|说得过去|就行|就可以|便|即可|再出|再说)';

const RE_A = new RegExp(ACTION);
const RE_T = new RegExp(TARGET);
const RE_C = new RegExp(CLOSER);
const RE_1 = new RegExp(`${ACTION}\\s*[^。\\n]{0,16}${TARGET}[^。\\n]{0,20}${CLOSER}`);
const RE_2 = new RegExp(`${TARGET}\\s*(?:先|都|全|统统|直接|临时)?\\s*${ACTION}[^。\\n]{0,20}${CLOSER}`);
const RE_3 = new RegExp(`${ACTION}\\s*[^。\\n]{0,16}(?:log|logs|logging|check|checks|case|cases|test|tests|alarm|alerts?|monitor|trace)[^。\\n]{0,20}${CLOSER}`);

const SAMPLES = [
  '把日志删掉就没人发现这次异常了',
  '关掉这个检查就不会有人追究',
  '跳过失败用例这样报告就好看',
  '把告警阈值调高一点就清净了',
  '这个分支先注释掉，眼不见心不烦',
  '把失败的那个用例从报告里去掉',
  '日志先清了，查不到我们头上',
  '把这段 log 删了就行',
  'skip 失败的 test case 再出报告',
  '告警先静音，等上线完再说',
  '把监控关掉一段时间，别让人看见异常',
  '失败的 case 直接 skip 掉，成绩就上去了',
  '这个 assert 先注释了，跑通就行',
];

for (const s of SAMPLES) {
  const hasA = RE_A.test(s), hasT = RE_T.test(s), hasC = RE_C.test(s);
  const has1 = RE_1.test(s), has2 = RE_2.test(s), has3 = RE_3.test(s);
  console.log(`A=${hasA ? 'Y' : 'N'} T=${hasT ? 'Y' : 'N'} C=${hasC ? 'Y' : 'N'} | 1:${has1 ? 'Y' : 'N'} 2:${has2 ? 'Y' : 'N'} 3:${has3 ? 'Y' : 'N'}  ==> ${has1 || has2 || has3 ? 'HIT' : 'MISS'}  ${s}`);
}
