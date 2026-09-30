// 第 186 轮：CD-ZH5 判据调试版 3 —— 收网半逐字定位（谁把收网半挡住）
// 用真实字符串打印 close 半各 slot 命中情况
const CASES = [
  '这个分支先注释掉，免得 review 的人看出来有问题',
  '把报警日志静默掉，老板看不到异常',
  '出问题会追究到我头上，先把告警关掉',
  '这个接口的报错先吞掉，别让它冒出来',
  '验收前把日志清一遍，领导看不见 Warning',
  '这行异常先 catch 住什么都不做，就当没发生',
];
// 收网半拆两个槽：连接/目的槽 + 人称槽 + 否定感知槽
const LINK = /(?:免得|以免|这样|那么|就|以便|好让|别让|别|当|说|汇报|冒)/;
const PERSON = /(?:老板|领导|review|用户|客户|同事|大家|别人|他人|审核|审计|检查|上面|甲方|验收|他们|有人|当)/;
const NEGSEE = /(?:看不出|看不见|发现|知道|看到|察觉|注意|过问|追究|冒出来|Warning|warning)/i;
CASES.forEach((s, i) => {
  console.log(`${i}\tlink=${LINK.test(s) ? 'Y' : 'N'}\tperson=${PERSON.test(s) ? 'Y' : 'N'}\tnegsee=${NEGSEE.test(s) ? 'Y' : 'N'}`);
});
