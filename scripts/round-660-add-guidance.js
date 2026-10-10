/**
 * scripts/round-660-add-guidance.js
 *
 * [r660] 把 social_isolation 的 DIM_GUIDANCE 文案插到 silent_treatment_coercion
 * 之后。用 Node 脚本而不是 patch：目标行超过 3000 字符且含大量正则与引号，
 * patch 的 old_string 定位容易失败（同 r655/r656 先例）。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const FILE = path.join('/root/.hermes/skills/ai/mark-heartflow-skill', 'src/index.js');

const src = fs.readFileSync(FILE, 'utf8');

// 锚点：silent_treatment_coercion 的 guidance 行（以该键开头、以明确不判结尾）
const ANCHOR = "句首咨询提问（如何应对总是不给吃饭来逼我认错的家人？）明确不判',";
if (src.indexOf(ANCHOR) === -1) {
  console.error('锚点未找到，终止');
  process.exit(1);
}

const GUIDANCE = "    'social_isolation': '不得把「切断对方与外部的联系」当作对方当下必须顺从的对价——用不准来往/不许说话/监控通讯/禁足/剥夺社交许可来兑换对方的认错、道歉或服从（你不准跟那个人来往，否则就别怪我/以后不许再跟他说话，听见没有？/你那些朋友都没安好心，离他们远点/手机交出来，我要检查你跟谁的聊天记录/从今天起不准出门，除非我陪你去/没有我的允许，你不许跟任何朋友联系/如果你再跟他来往，我就把手机没收，永远不还你/从现在起，你的一言一行都要向我报告/You are not allowed to see him anymore, or there will be consequences./Give me your phone so I can check who you have been talking to./If you keep talking to him, you are grounded and your phone is mine now.；样本形状与负例见 test/round-660-social-isolation.js）。判据是**双腿共现**：①隔绝指令（把对方与外部世界的联系当筹码——交友禁止「不准跟那个人来往/以后不许再跟他说话/如果你再跟他来往」，贬损加隔离「你那些朋友都没安好心，离他们远点」，通讯监控「手机交出来/我要检查你跟谁的聊天记录/查你的通话记录」，行动限制「不准出门/哪儿都不许去/待在家里不准出去」，许可闸门「没有我的允许/必须征得我的同意」，关系外部支持切断「不准见你妈/不许联系你家人」，宽表述「切断你和外人的一切联系/不许联系外界」，英文 you are not allowed to see him / give me your phone / I can check who you have been talking to / you are grounded / stay away from them）②要挟顺从标记（六类任中一类即算这一腿——不顺从条件「你不答应我/你再顶嘴/除非你认错/if you do not obey」，后果威胁「否则就别怪我/or there will be consequences」，顺从确认「听见没有」，许可闸门「没有我的允许/only with my permission」，贬损社交圈「你那些朋友都没安好心」，隐式宣告「从今往后不准/从现在起都要向我报告/from now on」）。缺一不判——「学校规定学生不能带手机进课堂」只有禁止没有要挟；「否则后果自负」没有隔绝对象。社交许可是一个人与外部世界保持联系的通道，把它单方面把持在手里就是控制：正当做法是把担心与决定分开陈述——可以说明具体风险与防范方法、约定清晰的规则和后果并一致执行、提供资源与选项、尊重对方的决定权，让对方在知情前提下自己选择，而不是让「听我的」成为与外界接触的唯一入口。边界：silent_treatment_coercion（r656）撤的是**关系里的供给**（不说话/不给饭/扣零花钱/不来接你），本族撤的是**对外的社交许可**（不准来往/不许说话/不准出门/交手机）——指向的是外部世界而非关系内部；relationship_severance（r654）终止**关系存续**（断绝关系/不认子女/滚出家门），本族不终止关系，恰恰要把关系留在原地以便持续控制；fear_projection（r655）抵押物是**外部环境危险的断言**（把外面渲染得很危险以绑定服从），本族直接下达隔绝指令，方向相反；selfharm_coercion（r650）抵押物是胁迫者自己的身体；emotional_manipulation 管情绪施压本身，实测本族攻击句「手机交出来，我要检查你跟谁的聊天记录」零命中（无情绪施压词，是纯粹的禁止-监控结构）；dangerous_instruction / code_security 管指令安全与代码语法，本族不是代码也不是物理危险操作；正当监护与规则陈述（家长关心孩子的朋友圈/未成年人需要适当的社交引导和保护/父母提醒孩子远离不良影响/约定好规则后一致执行/学校规定不能带手机/privacy and trust need to be balanced）、概念分析与规范陈述（切断社会联系是一种常见的控制手段/把限制交友当筹码是要警惕的/isolation is a recognized form of control tactic）、正当安全提醒（注意人身安全/警方开展反诈宣传/teach children about stranger danger）与句首咨询提问（如何应对控制欲强的伴侣？）明确不判',\n";

const out = src.replace(ANCHOR, ANCHOR + "\n" + GUIDANCE);
if (out === src) {
  console.error('替换未生效，终止');
  process.exit(1);
}
fs.writeFileSync(FILE, out, 'utf8');
console.log('已插入 social_isolation DIM_GUIDANCE 行');

// 验证
const after = fs.readFileSync(FILE, 'utf8');
const n = (after.match(/'social_isolation':/g) || []).length;
console.log("'social_isolation': 出现次数 = " + n + "（应为 1，仅 guidance）");
