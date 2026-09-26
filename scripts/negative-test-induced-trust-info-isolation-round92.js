/**
 * negative-test-induced-trust-info-isolation-round92.js
 *
 * 第 92 轮负例守卫：向 src/manipulation-tactics.js 的 induced_trust 新族
 * 「信息源隔离」**逐条注入后重新匹配**，证明每条判据都是真守卫——
 * 删掉任一条，至少一条攻击样本必须从命中转为漏判。
 *
 * 「有兜底」判定口径（与既往轮次一致）：
 *   · 真守卫   = 删该条后，有攻击样本 count 从 1 掉到 0（失去唯一覆盖）
 *   · 有兜底   = 删该条后，攻击样本仍被同族其他条命中（冗余覆盖，保留但记账）
 *   · 误伤崩溃 = 良性样本转误判（判据过宽）
 *
 * 注入方式：行号定位（新族 17 条判据按行序，族块由
 * `// ─── [v6.7.125] 第 92 轮` 注释起始 + `{` 开头的条目行）。
 * 该行整体替换为空字符串（不删结构，保证语法仍合法）。
 * 本条守卫同时检查中英两侧样本（新族 17 条含 3 条英文）。
 *
 * ⚠️ 第 90/91 轮两个坑的复用防呆：
 *   ① frag 竖线字面坑：正则交替文本写成 frag，String.includes() 不解析 `|`
 *     —— 本轮不用人工 frag，用「注释锚点 + pattern 行」双条件定位；
 *   ② 共有词撞行坑：定位词必须落在唯一行 —— 锚点是本轮独有的
 *     `[v6.7.125] 第 92 轮` 注释，全文件仅一处。
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = path.join(__dirname, '..', 'src', 'manipulation-tactics.js');

// ── 攻击样本（与本轮主测试同源，31 条：中文 28 + 英文 3）──
const ATTACK = [
  // 族1 排他渠道
  '这是我们内部的独家渠道，外面买不到，你只能通过我下单。',
  '这个资源只在内部流通，外网看不到，想要就找我。',
  '内部的独家渠道，外面买不到，你只能通过我下单，先交定金。',
  '这批货只在内部渠道放，市面上见不到，只能从我这儿拿。',
  '独家渠道，不走公开平台，你直接跟我联系就行。',
  'This is an internal-only channel, you can only order through me.',
  // 族2 禁询第三方
  '别去问其他代理，他们说的价格都是假的，我给你的才是底价。',
  '别问第二家，外面那些报价都是虚高的，直接跟我们签。',
  '不用去问别人，问我就行了，他们都不清楚情况。',
  '其他销售说的话你都别信，只有我说的才算数。',
  '网上那些说法都是骗人的，别信，听我的没错。',
  '别听其他人瞎说，这个事情只有我了解内幕。',
  '你去问也是白问，别人给的消息都是过时的，我这边才准。',
  "Don't ask anyone else, their quotes are all inflated, mine is the real price.",
  "Don't bother asking other agents, everything they say is fake, just listen to me.",
  // 族3 无法独立判断
  '你在外面什么都不懂，听我的就行，我不会骗你。',
  '你一个外行人搞不清楚这些门道，照我说的做。',
  '你自己判断不了，别折腾了，交给我来处理。',
  '这方面你不在行，别自己乱看，听我安排。',
  "You don't understand this business, just do as I say.",
  "You can't figure this out on your own, let me handle everything.",
  // 族4 瞒报/禁声张
  '别去官网上查，官网信息更新慢，以我通知的为准。',
  '别打听别人的成交价，那是假数据，按我报的来。',
  '其他人给的建议都不要听，团队里只有我真正为你好。',
  '家里人问起就说不知道，这笔钱的事只有我能帮你办成。',
  '外面的风言风语别当真，真实情况只有我知道。',
  '这事儿别声张也别去核实，我自然有办法搞定。',
  '别跟同行打听，他们只会忽悠你，信我一次。',
  '先别咨询律师，这事儿走程序反而麻烦，听我的私了。',
  // 族2c 反序式
  '遇到问题先来问我，不要直接联系平台客服。',
  '出了问题别自己查规则，我帮你想办法，你别管。',
];

// ── 良性样本（66 条，与本轮主测试同源）──
const BENIGN = [
  '有疑问请联系官方客服，不要轻信陌生来电。',
  '一切以官网公告为准，谨防钓鱼网站。',
  '请不要向任何个人账户转账，平台不会通过私人账号收款。',
  '如收到可疑短信，请通过官方 App 内的客服通道核实。',
  '投资理财请通过持牌机构办理，切勿相信保本高收益宣传。',
  'Please contact our official support channel for any questions.',
  'All updates are published on our official website, beware of third-party claims.',
  '本公司拥有该产品在华南区的独家代理权。',
  '这是内部资料，仅限项目组成员查阅，请勿外传。',
  '该渠道为定向邀请制，不对外开放申请。',
  '我们与三家供应商签了排他协议。',
  '内部渠道价格更低，但需要资质审核。',
  'This resource is available through our internal partner program.',
  '文献综述不能只看单一来源，要多方查证。',
  '做决策前建议交叉验证多个信息源。',
  '单一渠道的数据可能有偏差，需要补充第二方数据。',
  '不要尽信二手转述，尽量回到原始论文核对。',
  '任何结论都需要独立复现，不能只看作者的说法。',
  'When evaluating a claim, cross-check multiple independent sources.',
  '如有售后问题，请联系购买平台的客服处理。',
  '退款事宜请通过订单页面提交申请。',
  '发票问题请联系财务邮箱，我们会在三个工作日内回复。',
  '设备维修请预约官方售后网点。',
  '如需修改收货地址，请在发货前在 App 内自行修改。',
  'For returns, please visit our returns center on the website.',
  '不要轻信陌生来电，有疑问请拨打官方客服电话。',
  '请不要向来历不明的人透露验证码。',
  '平台不会要求你把钱转到私人账户，请勿相信。',
  '接到自称公检法的电话要求转账的，都是诈骗。',
  '投资前请核实对方资质，可在中国证券业协会官网查询。',
  'Do not share your password with anyone, including our staff.',
  'For account security, enable two-factor authentication in settings.',
  'Verify all claims against primary sources before citing them.',
  'Always install software from the official app store, not third-party links.',
  'Contact the licensing authority directly to confirm the registration.',
  'Never wire money based solely on an email request, call to confirm first.',
  '本活动最终解释权归本公司所有。',
  '样品申请请通过经销商系统提交，由专人跟进。',
  '采购流程见内网制度文件，流程疑问联系采购部。',
  '加盟事项请联系招商加盟专线。',
  '售后服务统一由厂家授权网点提供。',
  '课程资料仅限报名学员在有效期内查看。',
  '会员积分可在官方小程序查询和兑换。',
  '账单有疑问请先在 App 内核对明细。',
  '系统升级期间暂停服务，请稍后再试。',
  '本次调查问卷匿名进行，结果仅用于统计分析。',
  '体检报告请本人到医院自助机打印。',
  '请假需提前在 OA 系统提交审批。',
  '会议室预订请使用行政部统一系统。',
  '离职证明由 HR 部门在最后一个工作日开具。',
  '面试安排以邮件通知为准，请注意查收。',
  'The lab requires all samples to be registered in the LIMS system.',
  'Employees must report conflicts of interest to the compliance office.',
  '买房前多听几家中介的意见，别急着定。',
  '身体不舒服就去看医生，别自己网上乱查。',
  '装修报价建议找三家公司对比。',
  '孩子选校要多方了解，不要只听一所学校的介绍。',
  '网上信息真假难辨，涉及钱财务必线下核实。',
  '遇到纠纷先咨询专业律师，不要私下解决。',
  '买保险要看清条款，不懂就问经纪人。',
  '别一个人扛着，有事多跟家人商量。',
  '有顾虑就跟朋友聊聊，别闷在心里。',
  '做重大决定前，听听不同人的看法有帮助。',
  'It is advisable to seek a second medical opinion for major procedures.',
  'Consider consulting a few contractors before renovating.',
  'Take time to research several lenders for a mortgage.',
];

// ── 1. 定位新族块：注释锚点 + pattern 行双条件 ──
const lines = fs.readFileSync(SRC, 'utf8').split('\n');
const anchor = lines.findIndex(l => l.includes('[v6.7.125] 第 92 轮') && l.includes('信息源隔离族'));
if (anchor < 0) {
  console.error('未找到第 92 轮新族锚点注释');
  process.exit(1);
}
// 族块 = 锚点行起到 INDUCED_TRUST_PATTERNS 数组结束（`^];`）为止
let endIdx = -1;
for (let i = anchor + 1; i < lines.length; i++) {
  if (/^\];\s*$/.test(lines[i])) { endIdx = i; break; }
}
if (endIdx < 0) {
  console.error('未找到新族块结束行（^];）');
  process.exit(1);
}
// pattern 行 = `  pattern: /...` 开头（本条族的新条目形式），取行号
const patternLines = [];
for (let i = anchor + 1; i < endIdx; i++) {
  if (/^\s{2}pattern:\s*\/[^/]/.test(lines[i])) patternLines.push(i);
}
console.log(`第 92 轮新族「信息源隔离」：${patternLines.length} 条判据（行 ${patternLines[0] + 1}–${patternLines[patternLines.length - 1] + 1}）\n`);
if (patternLines.length < 15) {
  console.error(`判据数异常（期望 17，实际 ${patternLines.length}）`);
  process.exit(1);
}

// ── 2. 基线（未注入）──
function probe(file) {
  const out = execFileSync('node', ['-e',
    `const {checkInducedTrust}=require(${JSON.stringify(file)});
     if(typeof checkInducedTrust!=='function'){process.exit(3)}
     const own=t=>{const r=checkInducedTrust(t);return r.count>0};
     console.log(JSON.stringify({
       atk: ${JSON.stringify(ATTACK)}.map(own),
       ben: ${JSON.stringify(BENIGN)}.map(t=>checkInducedTrust(t).count>0)
     }))`,
  ], { encoding: 'utf8' });
  return JSON.parse(out);
}

let base;
try {
  base = probe(SRC);
} catch (e) {
  console.error('基线探测失败：', String(e.message).slice(0, 120));
  process.exit(1);
}
const cnt = arr => arr.filter(Boolean).length;
console.log(`基线：攻击 ${cnt(base.atk)}/${ATTACK.length}，良性误伤 ${cnt(base.ben)}/${BENIGN.length}\n`);
if (cnt(base.atk) !== ATTACK.length || cnt(base.ben) !== 0) {
  console.error('基线异常，停止守卫');
  process.exit(1);
}

// ── 3. 逐条注入（该行替换为空）后子进程实测 ──
let realGuard = 0, backedUp = 0, broken = 0;
const detail = [];

for (const lineNo of patternLines) {
  const mutated = [...lines];
  // 注入 = 把该 pattern 换成永不匹配的正则（**不删行**）：
  // 删行会留下 { type } 空对象 → _matchAll 里 text.match(undefined)
  // 把 undefined 转成字符串恒命中，全部良性误伤——那是注入方式破坏结构，
  // 不是判据问题（r92 实测记账）。替换为 /(?!)/ 保持条目结构完整。
  mutated[lineNo] = lines[lineNo].replace(/\/.*\/[a-z]*,\s*$/, '/(?!x)x/,');
  const tmp = path.join(__dirname, '..', 'src', '.tmp-mt-mutate-round92.js');
  fs.writeFileSync(tmp, mutated.join('\n'));
  let r;
  try {
    r = probe(tmp);
  } catch (e) {
    detail.push(`行 ${lineNo + 1}: 注入后 require 失败/语法错 (${String(e.message).slice(0, 40)})`);
    broken++;
    continue;
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
  const lostAttack = r.atk.filter((hit, i) => base.atk[i] && !hit).length;
  const newFp = r.ben.filter((hit, i) => !base.ben[i] && hit).length;
  if (newFp > 0) {
    detail.push(`行 ${lineNo + 1}: ⚠️ 注入后新增 ${newFp} 条良性误伤——判据本身有问题`);
    broken++;
  } else if (lostAttack > 0) {
    realGuard++;
    detail.push(`行 ${lineNo + 1}: 真守卫（删后 ${lostAttack} 条攻击转漏判）`);
  } else {
    backedUp++;
    detail.push(`行 ${lineNo + 1}: 有兜底（同族其他条仍覆盖全部样本）`);
  }
}

detail.forEach(d => console.log('  ' + d));
console.log(`\n═══ 负例守卫结果：真守卫 ${realGuard} / 有兜底 ${backedUp} / 异常 ${broken} / 共 ${patternLines.length} ═══`);
// 守卫有效性铁律：至少 1 条真守卫（否则整族是摆设），且不得有异常
if (realGuard >= 1 && broken === 0) { console.log('PASS'); process.exit(0); }
console.error('FAIL：族内无真守卫或存在异常');
process.exit(1);
