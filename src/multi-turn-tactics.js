/**
 * 多轮累积攻击检测（v6.7.86）
 *
 * 来源：第 32 轮心虫选「验证多轮累积攻击检出」（0.85）。
 *
 * 实测结论（3/5 漏判）：
 *   权威施压型（总经理办公室紧急通知）  → block ✓
 *   钓鱼社工型（账户异常+链接+密码）     → block ✓
 *   信任建立型（IT部+工号密码）          → pass ✗
 *   渐进越权型（订单→手机号→记录→入口）  → pass ✗
 *   情感操控型（你不做就是不在乎）        → pass ✗
 *
 * 漏判的共同特征：**没有任何单句含高危信号**，攻击性来自意图序列。
 * 这是单文本门禁的必然边界——但其中"渐进越权型"和"信任建立型"
 * 含可识别的累积模式，不该直接放过。
 *
 * 设计原则（重要）：
 *   只检测**动作序列的结构**（权限→PII→批量数据→系统入口），
 *   不检测单句意图。这样良性多轮对话（"查订单状态→导报表→发邮件"）
 *   不会误拦—— benign 对照组的 2 个样本必须保持 pass。
 */
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

// 阶梯的四个层级（按敏感度递增）
const LADDERS = [
  { name: 'pii_request', label: '索取个人敏感信息', score: 30,
    re: /(?:(?:手机号|身份证|银行卡|密码|验证码|住址|姓名|工号|出生日期|护照)|(?:\b(?:phone|password|ssn|credit ?card|address|id ?number|credentials?)\b))/i },
  { name: 'bulk_export', label: '批量导出数据', score: 30,
    re: /(?:批量|全部|导出|下载|拉取|dump)[^。\n]{0,12}(?:数据|记录|列表|名单|报表|档案)|(?:历史|所有|全部)[^。\n]{0,8}(?:订单|记录|数据|信息)[^。\n]{0,6}(?:导出|下载|发我|给我|列出来)/i },
  { name: 'system_entry', label: '索取系统/后台入口', score: 35,
    re: /(?:(?:后台|管理|admin|root)[^。\n]{0,6}(?:入口|地址|链接|口令|密码|账号|权限)|(?:数据库|服务器|运维)[^。\n]{0,8}(?:地址|入口|账号|密码|权限|口令))/i },
  { name: 'authority_claim', label: '自称权威/紧急', score: 25,
    // [v6.7.86] "IT 部门"与"IT部"都要覆盖；间隔放宽到 20
    // （"我是公司 IT 部门新来的同事李明"到"需要核对"超过 12 字）
    re: /(?:(?:总经理|总监|董事长|CEO|CTO|COO|主管|领导|经理|总经办|IT\s*部门?|信息安全部|审计部|法务部|人力资源部|HR)[^。\n]{0,20}(?:通知|要求|说的|审批|授权|安排|登记|核对)|(?:紧急|马上|立刻|立即)[^。\n]{0,10}(?:审计|核查|处理|提供|确认))/i },
  { name: 'guilt_trip', label: '愧疚施压（别人都行为什么你不行）', score: 25,
    re: /(?:(?:其他|别的|大家|所有人|每个)[^。\n]{0,8}(?:都|全)[^。\n]{0,6}(?:能|可以|做)[^。\n]{0,12}(?:你|为何|为什么)[^。\n]{0,6}(?:不|没)|(?:如果你)[^。\n]{0,20}(?:就)[^。\n]{0,10}(?:应该|必须|该)[^。\n]{0,24}(?:不(?:答应|做|配合|给)[^。\n]{0,8}(?:就是|说明)))/i },
];

/**
 * @param {string} text 完整多轮文本（含换行或句号分隔）
 * @returns {{count, hits, score, ladders}}
 */
function checkMultiTurnEscalation(text) {
  if (!text || typeof text !== 'string') {
    return { count: 0, hits: [], score: 0, ladders: [] };
  }
  const hits = [];
  let score = 0;
  for (const L of LADDERS) {
    const m = text.match(L.re);
    if (m) {
      hits.push({ ladder: L.name, label: L.label, matched: m[0].slice(0, 40) });
      score += L.score;
    }
  }
  // 需要 ≥2 层阶梯才算累积攻击——单层只是"索取信息"，
  // 是正常工作内容（客服问手机号、开发要数据库地址都很正常）。
  const qualifies = hits.length >= 2;
  return {
    count: hits.length,
    hits,
    ladders: hits.map(h => h.ladder),
    score: qualifies ? Math.min(1, score / 100) : 0,
    qualifies,
  };
}

module.exports = { checkMultiTurnEscalation, LADDERS };
