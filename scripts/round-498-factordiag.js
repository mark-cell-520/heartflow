// r498：直接测内部正则对漏检样本的命中情况（复制自模块源码）
'use strict';
const T1 = '上周跳过了权限校验也没人发现，这周继续走老流程就行。';
const T2 = 'No one ever audited this step, so just keep the old process.';

const R = {
  BASELINE_ZH: /(?:以前|以往|历来|向来|一向|一直|一贯|素来|此前|之前|过去|上(?:个|一)?(?:季度|月|周|次|回)|第一(?:次|回)|当初|早期|最初|起初|刚开始|老(?:早|以)?(?:以前|之前|时候)?|历史(?:上)?的?(?:前科|记录|案例|情况)?|同期|同期间|历年|往常|往常年份|往常时候|平常|往常也|向来都|历来都是|一直都是)/,
  DEVIATION_ZH: /(?:漏(?:报|检|了|掉|过|单|项|记|统计|填报|核对|洞)|延(?:迟|误|期|宕|后)|缺(?:口|失|陷|项|少)|越(?:界|权|级|轨)|违规|违纪|违法|误差|差错|偏差|失误|失手|疏(?:漏|忽|懈)|瑕疵|不合(?:规|格)|不合标准|未(?:能)?(?:按时|按量)?(?:达标|完成|执行|落实|整改)|故(?:障|意)|宕(?:机|率)|异(?:常|动)|偏(?:了|离)|错(?:误|漏|报|单)|少(?:报|交|销|统计)|报(?:错|漏)|漏(?:洞|洞)|虚(?:报|假)|瞒(?:报|告)|拖(?:延|欠)|欠(?:账|款|缺)|宽(?:松|纵)|放(?:松|水)|通(?:融|一下)|睁一只眼|下不为例|网开一面|特(?:批|许)|例(?:外|外处理)|破(?:例|例)|口子|空子|后门|潜规则|走过场|做样子|应(?:付|付了事)|敷(?:衍|了事)|打(?:折扣|擦边球)|擦(?:边|边球)|缩(?:减|水)|偷(?:工|工减料)|省(?:步骤|流程|环节)|跳(?:过|步骤|流程)|免(?:检|测|审)|免(?:审批|流程|检)|降(?:标|标准|要求)|降(?:配|配版)|劣(?:质|化)|豆腐渣|以(?:次|旧)(?:充|替)|不合(?:标准|规范)|不符(?:标准|规范)|不(?:按|依照)(?:流程|规范|标准|制度))/,
  EXEMPTION_ZH: /(?:不用|不必|无需|毋需|不须|不需要|没必要|用不着|不必再|不必特别|无需特别|不用特别|不(?:用|需|必)(?:再)?(?:特别|格外)?(?:处理|处置|追究|问责|整改|上报|记录|通报|处罚|处分|问责|审|检查|核查|评估|复盘|分析|根因)|一样的?(?:处理|方式|办法|做法|流程|标准)|照(?:旧|常|老|样)|按(?:往常|惯例|老例|旧例|前例)|维(?:持|持)?(?:原状|现状)|不(?:用|需|必)?(?:特别|格外)?(?:上报|通报|记录|公示|整改|复盘|追责)|不是(?:新|全)?(?:问题|新问题|这一?次?才|本次才)|不是这(?:一|个)?次(?:才|出的|出现)|不(?:是|算)?新(?:出现|发生)|惯例|常规|常规操作|常规处理|常规做法|常规做法|行(?:规|内|内做法|内操作)|业(?:内|界)?(?:惯例|常规|通例)|大家(?:都|一直)?(?:这么|如此)|向(?:来|一直)?(?:都)?(?:这么|如此)|既(?:往|定)|已成(?:(?:惯例|常态|定例|规矩))|默(?:认|许)|睁一?只眼|放(?:松|一?马)|下不为例|网开一面|通融|不必(?:小题大做|大惊小怪|过分))/,
  NO_HARM_ZH: /(?:以前|以往|历来|之前|过去|向来|一向|上(?:次|回|季度|月))(?:[^，。？！；\n]{0,30}?)(?:也|都|并|却|从)?(?:没(?:出|有)|未(?:出|发生|造成)?(?:任何|什么)?|无)(?:任何|什么|半点|丝毫)?(?:事|问题|事故|麻烦|后果|影响|状况|岔子|乱子|差错|偏差|损失|投诉|追责|问责|被(?:发现|查|抓|通报|处罚)|出事)/,
  NO_OVERSIGHT_ZH: /(?:历来|向来|一向|以前|以往|过去|一直|从来|素来|向来|历来)(?:都|也|又)?(?:没(?:有|人)|未|从无)(?:任何|什么|哪个)?(?:人|部门|单位|组|团队|主管|监管|审计|督查|领导|上级|检查|查|管|过问|督导|复核|核实|把关|抽查|通报|发现|追究|问责|问|理|睬|在意|关注)/,
  NO_OVERSIGHT_EN: /\b(?:never|has never been|has not been|nobody|no one|no team|no regulator|nobody has)\s+(?:ever\s+)?(?:checked|reviewed|audited|inspected|monitored|flagged|escalated|reported|looked at|cared about|questioned|bothered|noticed|complained|verified)\b|\b(?:no|zero)\s+(?:oversight|monitoring|supervision|review|audit|checks?|verifications?)\b/i,
  BASELINE_EN: /\b(?:always|all along|has always been|have always been|before|previously|historically|prior(?:ly)?|the last time|last (?:quarter|month|week|time)|every time before|we have (?:always|before|previously)|it has (?:always|previously)|was already|were already|all our history|as we always (?:do|did)|the only time|every (?:previous|past|prior|earlier|other) (?:release|version|build|iteration|sprint|deploy(?:ment)?|ship|patch|cycle|report|incident)|previous(?:ly)? (?:shipped|released|deployed|carried|left)|(?:the )?same (?:defect|bug|issue|gap|violation|error) (?:has been|was) (?:there|present|known) (?:since|from))\b/i,
  EXEMPTION_EN: /\b(?:no need to (?:flag|report|escalate|fix|address|investigate|do anything|treat)|nothing (?:special|new) (?:to do|about it|needed)|same (?:as|treatment) (?:before|last time|as (?:before|usual))|treat (?:it|this) (?:as|like) (?:usual|before|routine)|business as usual|routine (?:operation|handling|practice|procedure|matter)|not a (?:new|special) (?:issue|problem|case|development)|no special (?:handling|treatment|action|response)|handled? (?:the same|as usual)|we (?:always|usually) (?:handle|deal with) it (?:this|the same) way|nothing (?:new|different) (?:this time|about it)|no different (?:than|from) (?:before|usual|last time)|let (?:it|this) (?:slide|go|stand)|not (?:worth|worthwhile) (?:escalating|reporting|fixing)|minor (?:enough|enough to ignore)|ignore (?:this|it) (?:as|like) (?:before|usual)|same (?:treatment|handling) as (?:the )?(?:last time|previous))\b/i,
};

console.log('=== T1 ===', T1);
for (const [k, v] of Object.entries(R)) {
  if (v.test(T1)) console.log('  HIT', k);
}
console.log('=== T2 ===', T2);
for (const [k, v] of Object.entries(R)) {
  if (v.test(T2)) console.log('  HIT', k);
}
