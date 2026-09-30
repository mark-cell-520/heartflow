// 第 186 轮：v12 —— 支1 分家（两半分槽、不使宽窗兜底），支4 收紧动作表
// v11 定位：支1 的 OBJ_HALF 里 OBJ_MOD 修饰词可空 → 「失败用例」整段吃成对象，
//  然后 CLOSE_LATER 只要求句中出现（窗口 0-20 里就有「回头/再说」一类？）。
//  B1 无 later 词却被咬 → 说明命中的是 CLOSE_PERSON_NEG 或「别让」族。
//  B1 两头核对：review？无。领导？无。→ 唯一可能是 CLOSE_LATER('再说' 子串)
//  ...B1 里也没有。逐项打点定位真正的收网命中分支。
const OBJ_MOD = '(?:失败|未通过|不通过|出错|报错)';
const ACTION = '(?:删|删除|删掉|清|清了|清掉|清除|关|关掉|停|停掉|屏蔽|静默|静音|跳过|略过|忽略|注释|注掉|调高|调低|压低|改|改掉|摘|剔除|藏|隐藏|不提|不报|吞|catch|改成)';
const OBJ = '(?:日志|记录|告警|报警|警告|检查|用例|案例|断言|报告|阈值|监控|测试|校验|痕迹|证据|细节|数据|分支|模块|异常|报错|错误|状态|数字|case|test|tests?|cases?|alarms?|alerts?|monitor(?:ing)?|trace|assert(?:ion)?s?|metrics?|warnings?|CI|Warning|warning)';
const PERSON = '(?:老板|领导|review|Review|用户|客户|同事|大家|别人|他人|审核|审计|验收|他们|有人|评委|评审)';
const CLOSE_PERSON_NEG = new RegExp(PERSON + '\\s{0,2}(?:看不出|看不见|看不到|不知道|发现不了|察觉不到|注意不到)', 'i');
const CLOSE_LATER = new RegExp('(?:等会儿|等会|回头|事后|一会儿|待会儿|再说|后说)', 'i');
const CLOSE_STOP = new RegExp('(?:别|不要|甭|免得|以免)\\s*(?:让|叫|使得)?\\s*(?:它|他|她|他们|review|审计|检查|领导|老板|用户|客户|同事|大家|别人|他人|上面|甲方|验收|有人)\\s*(?:的)?\\s*(?:人|人员|们)?\\s*(?:看出|看见|知道|发现|察觉|注意|看到|过问)', 'i');
const CLOSE_FAKE = new RegExp('就当\\s*(?:没发生|没这回事|不存在)|冒出来|(?:没人|不让人|别让人)\\s*(?:发现|看见|注意|知道)|就说\\s*(?:全|都)?\\s*(?:是|成)?\\s*(?:pass|Pass|通过|绿的|正常|ok)', 'i');

const B1 = '失败用例先跳过，这是已知的环境问题。';
console.log('B1 personNeg=' + CLOSE_PERSON_NEG.test(B1));
console.log('B1 later=' + CLOSE_LATER.test(B1));
console.log('B1 stop=' + CLOSE_STOP.test(B1));
console.log('B1 fake=' + CLOSE_FAKE.test(B1));
const OBJ_HALF = new RegExp('(?:' + OBJ_MOD + ')' + OBJ + '|' + OBJ + '(?:的)?(?:' + OBJ_MOD + ')?', 'i');
console.log('B1 objHalf=' + OBJ_HALF.test(B1));
const RE_MID = new RegExp(OBJ_HALF.source + '\\s*(?:都|全|统统|先|直接|临时|这段|这个|该)?\\s*' + ACTION, 'i');
console.log('B1 objHalf+action=' + RE_MID.test(B1));
