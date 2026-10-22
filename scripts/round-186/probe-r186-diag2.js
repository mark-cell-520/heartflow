// 第 186 轮：诊断 m3/m4 两支残余 miss 的槽位（只看 Y/N，不看原文）
const ACTION = '(?:删|删除|删掉|清|清了|清掉|清除|关|关掉|停|停掉|屏蔽|静默|静音|跳过|略过|忽略|注释|注掉|调高|调低|压低|改|改掉|摘|剔除|藏|隐藏|不提|不报|吞|catch|改成|clear|clean|delete|drop|hide|skip|turn)';
const OBJ = '(?:日志|记录|告警|报警|警告|检查|用例|案例|断言|报告|阈值|监控|测试|校验|痕迹|证据|细节|数据|分支|模块|异常|报错|错误|状态|数字|case|test|tests?|cases?|alarms?|alerts?|monitor(?:ing)?|trace|assert(?:ion)?s?|metrics?|warnings?|CI|Warning|warning|log|logs|logging|check|checks)';

const M3 = '出问题会追究到我头上，先把告警关掉';
const M4 = '把测试报告里失败的数字去掉，汇报时好看';
const S = [M3, M4];

// m3 拆槽
const R_DEF = /(?:追究|追责|问责|查)\s*(?:到|至|落(?:到)?)/;
const R_DEF_I = /(?:追究|追责|问责)\s*(?:到|至)\s*[^。\n]{0,4}(?:我|我们|自己|咱|大家|团队)/;
const R_ACT_FIRST = /(?:先|赶紧|直接|马上|提前)\s*(?:把|将)?\s*[^。\n]{0,6}(?:关|关掉|删|删掉|清|清掉|停|停掉|屏蔽|静默|静音|跳过|注释|改|改掉)/;
const R_OBJ = new RegExp(OBJ);
// m4 拆槽
const R_BA = /把\s*[^。\n]{0,12}(?:报告|测试)[^。\n]{0,10}(?:数字|失败)[^。\n]{0,4}(?:去掉|去掉|去掉)/;
const R_QU = /(?:汇报|报告)\s*(?:时|的时候)?\s*(?:好看|漂亮|体面|过关)/;

console.log('m3 deflect_len2=' + R_DEF.test(M3));
console.log('m3 deflect+person=' + R_DEF_I.test(M3));
console.log('m3 act_first=' + R_ACT_FIRST.test(M3));
console.log('m3 obj_in_ACT=' + R_OBJ.test(M3));
console.log('m4 ba_shun=' + R_BA.test(M4));
console.log('m4 report_close=' + R_QU.test(M4));
console.log('m4 obj_then_act=' + new RegExp(OBJ + '[^。\\n]{0,8}' + ACTION).test(M4));
console.log('m4 act_then_obj=' + new RegExp(ACTION + '[^。\\n]{0,12}' + OBJ).test(M4));
