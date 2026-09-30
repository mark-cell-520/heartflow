// 第 186 轮：m1 残余 miss 定位 —— v19 支2b 为何没咬「case 直接 skip 掉再说」
const OBJ_MOD = '(?:失败|未通过|不通过|出错|报错)';
const ACTION = '(?:删|删除|删掉|清|清了|清掉|清除|关|关掉|停|停掉|屏蔽|静默|静音|跳过|略过|忽略|注释|注掉|调高|调低|压低|改|改掉|摘|剔除|藏|隐藏|不提|不报|吞|catch|改成|skip)';
const OBJ = '(?:日志|记录|告警|报警|警告|检查|用例|案例|断言|报告|阈值|监控|测试|校验|痕迹|证据|细节|数据|分支|模块|异常|报错|错误|状态|数字|case|test|tests?|cases?|alarms?|alerts?|monitor(?:ing)?|trace|assert(?:ion)?s?|metrics?|warnings?|CI|Warning|warning)';
const OBJ_HALF = '(?:' + OBJ_MOD + ')?' + OBJ + '(?:里|中|的)?' + '(?:' + OBJ_MOD + ')?';
const T1 = '先把失败的 case 直接 skip 掉再说';
console.log('objHalf=' + new RegExp(OBJ_HALF, 'i').test(T1));
console.log('obj→0-6→act=' + new RegExp(OBJ_HALF + '[^。\\n]{0,6}' + ACTION, 'i').test(T1));
console.log('act+再说=' + new RegExp(ACTION + '(?:掉|了|空|完|住|out)?[，,。]?\\s*(?:再说|后说|再讲)', 'i').test(T1));
console.log('组合=' + new RegExp(OBJ_HALF + '[^。\\n]{0,6}' + ACTION + '(?:掉|了|空|完|住|out)?[，,。]?\\s*(?:再说|后说|再讲)', 'i').test(T1));
// skip 大小写
console.log('skip-sensitive=' + new RegExp('skip').test(T1) + ' insensitive=' + new RegExp('skip', 'i').test(T1));
