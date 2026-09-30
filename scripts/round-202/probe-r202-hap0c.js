const rh = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/reward-hacking.js');
const s = '拿用户在页面上的停留时长充当模型输出正确与否的替代信号';
const zh = rh.REWARD_HACKING_ZH.human_answer_proxy;
console.log('total =', zh.length);
zh.forEach((re, i) => {
  let m = null;
  try { m = re.test(s); } catch (e) { console.log(i, 'ERR', e.message); return; }
  if (m) console.log('HIT branch', i, '|', String(re.source).slice(0, 120));
});
// 手动测 Z1 的关键片段
const t1 = /(?:停留|在线|使用|浏览|观看|收听|阅读|驻留)\s*(?:时长|时间|时)?\s*[^。\n]{0,6}(?:充当|当做|当作|视为|视为是|算作|作为|拿来当|拿来做)\s*[^。\n]{0,18}(?:是否|正确|对错|好坏|质量|优劣|有效性|可靠性)\s*(?:的)?\s*(?:判定|判断|依据|标准|指标|信号|替代|代替|代理)/;
console.log('Z1 test =', t1.test(s));
const t2 = /(?:拿|把|将|用)\s*[^。\n]{0,18}(?:停留|在线|浏览|观看|收听|阅读|点赞|点击|反馈|满意度)\s*(?:时长|时间|数据|率|数|量)?\s*(?:充当|当作|视为|作为|算作|拿来做|拿来当)\s*[^。\n]{0,12}(?:替代信号|替代指标|代理指标|代理信号|代理|代替|替代)\s*(?:的|来|去)?\s*[^。\n]{0,10}(?:判定|判断|评估|推断|衡量)\s*[^。\n]{0,10}(?:正确|质量|好坏|对错|优劣)/;
console.log('Z1b test =', t2.test(s));
