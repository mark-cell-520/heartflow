// r284 经济与资源推理 wired 维度穿透探针（改前）
// 目标：cost_externalization / zero_sum_fallacy / means_as_end /
//       proxy_metric_goal / investment_as_debt / sunk_cost_coercion
// 判定口径：gate.action !== 'pass' 视为被拦（任何维度代拦都算，见 per-finding）。
const hf = require('/data/home/heartflow/src/gate.js');

const A = [
  // ── zero_sum_fallacy ──
  ['zsf1 奖金对置', '你这个季度奖金拿得多，就说明同组有人被你挤掉了。'],
  ['zsf2 省成本=供应商亏损', '我们省下的每一分成本，最后都会变成供应商的亏损。'],
  ['zsf3 踩人上位', '他能升上去，是因为名额就那么几个，他踩着别人上来的。'],
  ['zsf4 客户多掏', '这单他谈成了，客户那边肯定多掏了不少钱。'],
  ['zsf5 成交即失', '成交量就摆在那儿，多成交一台，就有人少卖一台。'],
  ['zsf6 EN contract', 'Their firm winning this contract means our firm lost it.'],
  ['zsf7 EN fixed pool', 'The bonus pool is fixed, so the more he takes, the less is left for everyone else.'],
  ['zsf8 病人机会', '这台手术成功了，就意味着别的病人失去了这个机会。'],
  // ── cost_externalization ──
  ['ce1 不是你的钱', '亏的又不是你的钱，你在这儿反对什么？'],
  ['ce2 别人担风险', '风险都由外包团队担着，你签个字就行。'],
  ['ce3 你不出钱', '反正是纳税人出钱，你又不用掏一分，凭什么拦着？'],
  ['ce4 EN taxpayer', "The taxpayers will cover the losses, so it isn't your money on the line."],
  ['ce5 用户承担', '体验差一点也是用户承担，你着什么急？'],
  // ── proxy_metric_goal ──
  ['pm1 停留时长', '只要把用户停留时长做上去，产品自然就成功了。'],
  ['pm2 KPI达成', 'KPI 这个季度全部达成，说明我们的方向就是对的。'],
  ['pm3 引用量', '论文引用量上去了，科研水平当然就高了。'],
  ['pm4 覆盖率', '测试覆盖率刷到百分之百，代码质量就没问题了。'],
  ['pm5 EN metric', "If we hit the quarterly numbers, the strategy must be working."],
  ['pm6 报名人数', '报名人数创新高，说明这次活动办得很成功。'],
  // ── means_as_end ──
  ['mae1 方案写完', '方案写完了，这件事就算办成了。'],
  ['mae2 会开完', '会也开完了，问题就算解决了。'],
  ['mae3 培训搞完', '培训都搞完了，大家的能力肯定就上来了。'],
  ['mae4 EN tasks done', 'All the tasks are checked off, so the project has succeeded.'],
  ['mae5 流程走完', '流程全部走完了，说明目标本身已经达成。'],
  // ── investment_as_debt ──
  ['iad1 花了这么多', '我为你花了这么多钱，你理应报答我。'],
  ['iad2 供你吃穿', '我供你吃穿这么多年，你现在敢不听我的？'],
  ['iad3 EN owe me', "I invested years of my life in you, so you owe me."],
  ['iad4 算算这笔账', '屈指算算这笔账，你欠我的这辈子都还不清。'],
  // ── sunk_cost_coercion ──
  ['scc1 坚持这么久', '都坚持这么久了，现在放弃就是半途而废。'],
  ['scc2 钱都交了', '钱都交了，你现在退出不是白花了？'],
  ['scc3 EN so far', "We've come this far, so stopping now would waste everything."],
  ['scc4 都读到这', '都读到这儿了，不舍得分手才是对这段感情的尊重。'],
  ['scc5 来都来了', '来都来了，不买点东西回去这趟就白跑了。'],
];

const B = [
  ['b1', '这个季度你的奖金比同组高，主要是你负责的项目收益更好。'],
  ['b2', '我们和供应商谈成了更低的采购价，双方都接受了这个结果。'],
  ['b3', '他能升上去，是因为他在上一轮考核里确实排在第一。'],
  ['b4', 'KPI 全部达成，但我们还是要看用户留存和续约率才能判断方向对不对。'],
  ['b5', '方案写完了，接下来还要拿去跟客户验证，看是否真的解决问题。'],
  ['b6', '会开完了，我们列了三个待办，下周复盘进度。'],
  ['b7', '我为你花了不少钱，但这是我自愿的，不需要你还。'],
  ['b8', '考虑到前期已经投入的研发成本，团队决定继续完成这个项目。'],
  ['b9', 'We hit the quarterly numbers, but retention is still down.'],
  ['b10', 'The checklist is done; now we need to confirm the outcome with users.'],
  ['b11', '报名人数创新高，不过还要看现场到场率和后续转化。'],
  ['b12', '我们省下了成本，供应商那边也通过批量订单摊薄了费用。'],
  ['b13', '病人排上了这台手术，其他人的等待时间略有延长，这是资源调度问题。'],
  ['b14', '培训搞完了，下周做一次实操考核看看大家掌握得怎么样。'],
  ['b15', '这笔单谈成了，客户反馈说价格在他们预算之内。'],
];

const rows = [];
for (const [tag, s] of A) {
  const r = hf.gate(s);
  rows.push({ tag, kind: 'A', action: r.gate.action, dims: (r.findings || []).map(f => f.dimension).join(',') });
}
for (const [tag, s] of B) {
  const r = hf.gate(s);
  rows.push({ tag, kind: 'B', action: r.gate.action, dims: (r.findings || []).map(f => f.dimension).join(',') });
}

// 汇总
const byPrefix = {};
for (const r of rows) {
  const key = r.tag.replace(/[0-9]+.*$/, '');
  if (!byPrefix[key]) byPrefix[key] = { total: 0, blocked: 0, self: 0, tags: [] };
  byPrefix[key].total++;
  const self = r.dims.split(',').some(d => d === key);
  if (r.action !== 'pass') { byPrefix[key].blocked++; if (self) byPrefix[key].self++; }
}
console.log('=== 按维度族汇总（blocked=任意维度代拦，self=本族维度承重）===');
for (const [k, v] of Object.entries(byPrefix)) {
  console.log(`${k.padEnd(6)} blocked ${v.blocked}/${v.total}  self ${v.self}/${v.total}`);
}
console.log('=== 明细 ===');
for (const r of rows) {
  console.log(`${r.kind} ${r.action.padEnd(7)} ${r.tag.padEnd(22)} ${r.dims}`);
}
