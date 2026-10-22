// 第 186 轮：诊断 4 条残余 miss 的具体槽位（看动作半/对象半/收网半谁没接上）
const ACTION = '(?:删|删除|删掉|清|清了|清掉|清除|关|关掉|停|停掉|屏蔽|静默|静音|跳过|略过|注释|注掉|调高|调低|压低|改|改掉|摘|剔除|藏|隐藏|不提|不报|吞|catch|改成)';
const OBJ = '(?:日志|记录|告警|报警|警告|检查|用例|案例|断言|报告|阈值|监控|测试|校验|痕迹|证据|细节|数据|分支|模块|异常|报错|错误|case|test|tests?|cases?|alarms?|alerts?|monitor(?:ing)?|trace|assert(?:ion)?s?|metrics?|warnings?|CI|红绿|状态|数字|Warning|warning)';
const CLOSE_LATER = '(?:等会儿|等会|回头|事后|后面|之后|一会儿|待会儿)\\s*(?:再)?\\s*(?:处理|说|议|管|看|弄|解决|修)';
const CLOSE_DEF = '(?:追究|追责|问责)\\s*(?:到|至)';

const MISS = [
  '先把失败的 case 直接 skip 掉再说',            // m1
  '这个 assert 先注释了，等会儿再处理',           // m2
  '出问题会追究到我头上，先把告警关掉',           // m3
  '把测试报告里失败的数字去掉，汇报时好看',       // m4
];
MISS.forEach((s, i) => {
  const actBeforeObj = new RegExp(ACTION + '[^。\\n]{0,12}' + OBJ, 'i').test(s);
  const objBeforeAct = new RegExp('[^。\\n]{0,6}' + OBJ + '[^。\\n]{0,6}' + ACTION, 'i').test(s);
  const later = CLOSE_LATER && new RegExp(CLOSE_LATER, 'i').test(s);
  const def = CLOSE_DEF && new RegExp(CLOSE_DEF, 'i').test(s);
  console.log(`m${i + 1}\tact→obj=${actBeforeObj ? 'Y' : 'N'}\tobj→act=${objBeforeAct ? 'Y' : 'N'}\tlater=${later ? 'Y' : 'N'}\tdeflect=${def ? 'Y' : 'N'}`);
});
