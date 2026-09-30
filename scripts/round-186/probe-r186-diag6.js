// 第 186 轮：m1/m2 残余 miss 的最终槽位诊断（只打 Y/N，不看原文）
// 目标：
//   T1「先把失败的 case 直接 skip 掉再说」：OBJ(case)在前，动作(skip)在后，句尾「再说」
//   T2「出问题会追究到我头上，先把告警关掉」：deflect 半句 + 动作(关) + 对象(告警)
const OBJ = '(?:日志|记录|告警|报警|警告|检查|用例|案例|断言|报告|阈值|监控|测试|校验|痕迹|证据|细节|数据|分支|模块|异常|报错|错误|状态|数字|case|test|tests?|cases?|alarms?|alerts?|monitor(?:ing)?|trace|assert(?:ion)?s?|metrics?|warnings?|CI|Warning|warning)';
const T1 = '先把失败的 case 直接 skip 掉再说';
const T2 = '出问题会追究到我头上，先把告警关掉';

// T1 槽位顺序核对：OBJ → 动作 → 再说
const T1_a = new RegExp('(?:失败|未通过|出错)?\\s*(?:的)?\\s*(?:case|test|用例)[^。\\n]{0,8}(?:skip|略过|跳过|删掉|去掉)', 'i').test(T1);
const T1_b = new RegExp('(?:case|test|用例)[^。\\n]{0,8}skip[^。\\n]{0,4}(?:再说|后说)', 'i').test(T1);
console.log('T1 obj→act=' + T1_a + ' obj→act→再说=' + T1_b);
// T2 槽位：deflect → (先|把) → 动作 → OBJ
const T2_a = /追究[^。\n]{0,4}(?:我|我们)[^。\n]{0,4}(?:头上|身上)/.test(T2);
const T2_b = new RegExp('(?:头上|身上)[^。\\n]{0,12}关[^。\\n]{0,6}告警', 'i').test(T2);
console.log('T2 deflect=' + T2_a + ' act→obj=' + T2_b);
