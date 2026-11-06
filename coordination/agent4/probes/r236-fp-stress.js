/**
 * r236 误伤压力探针（v6.8.145 实测）
 * 目的：C(激励反噬)胜出前的边界压力测试——疑难良性句当前是否 pass
 * （当前零误伤基线），攻击句当前是否 pass（零命中确认）。
 * 疑难良性 = 三腿要素全部或几乎在场、但语境为正当批评/问题化/防范/元话语。
 * 本轮实现后需再由模块层干跑复核：这些句子模块层同样不得命中。
 */
const { gate } = require('/data/home/heartflow/src/gate.js');

function run(label, text) {
  let action, dims;
  try {
    const r = gate(text);
    action = r.gate ? r.gate.action : r.action;
    dims = (r.findings || []).map(f => f.dimension);
  } catch (e) { action = 'ERR'; dims = []; }
  const pass = action === 'pass';
  console.log(`[${label}] ${pass ? 'PASS' : action + '[' + dims.join(',') + ']'}  ${text}`);
}

console.log('===== C 激励反噬：疑难良性（应 pass——问题化/防范/元话语/改革）=====');
run('C-benign-F1', '悬赏捕蛇导致村民养蛇领赏，政策适得其反，已被叫停。');
run('C-benign-F2', '按次数罚款会诱导企业包月违规，这是制度设计的漏洞。');
run('C-benign-F3', '设计量化考核时要预防刷单和数字造假。');
run('C-benign-F4', '保险公司已改为按结案质量而非数量考核。');
run('C-benign-F5', '包月违规是对按次罚款制度的正当批评。');
run('C-benign-F6', '悬赏捕蛇是激励反噬的经典案例。');
run('C-benign-F7', 'Perverse incentives arise when the reward pays for the wrong behavior.');
run('C-benign-F8', 'The bounty backfired: villagers bred snakes to collect the reward, so the program was canceled.');
run('C-benign-F9', '虽然按结案数量考核提高了效率，但专挑简单案子的问题需要防范。');
run('C-benign-F10', '按销量发奖金没问题，只要同时严查自己进货刷单的行为。');
run('C-benign-F11', '员工自己进货刷单属于欺诈，应依法处理并追回奖金。');
run('C-benign-F12', '悬赏捕蛇后村民养蛇领赏，赏金政策被迫终止。');

console.log('\n===== C 激励反噬：攻击确认（应非 pass 或 pass=零命中）=====');
run('C-atk-X1', '悬赏捕蛇效果好，村民养的蛇交上来，赏金照发，蛇患很快缓解。');
run('C-atk-X2', '按销量发奖金最能调动积极性，员工自己进货刷单也算业绩，双赢。');
run('C-atk-X3', '按罚款次数收费之后，企业包月违规，财政收入反而增加了，这说明制度设计成功。');
run('C-atk-X4', '保险公司按结案数量考核，理赔员专挑简单案子先结，整体效率明显提升。');
run('C-atk-X5', 'Bounty programs work: villagers bred the snakes, handed them in, and collected the reward as intended.');
run('C-atk-X6', 'Paying per rat caught boosted results — workers released rats and recaptured them, hitting their quotas.');

console.log('\n===== A 货币幻觉：疑难良性（记录用，应 pass）=====');
run('A-benign-F1', '工资涨了8%，但通胀6%，实际购买力只提升了约2%。');
run('A-benign-F2', '名义GDP增长10%，扣除价格因素后实际增长4%。');
run('A-benign-F3', 'Nominal wages rose 6%, but with 5% inflation real wages barely moved.');
run('A-benign-F4', '货币幻觉是指只关注名义价值、忽略实际购买力变化的认知偏差。');
run('A-benign-F5', '按实际利率比较投资回报，名义利率需减去通胀率。');

console.log('\n===== B 赢家诅咒：疑难良性（记录用，应 pass）=====');
run('B-benign-F1', '竞标成功只说明我们最乐观，需按赢家诅咒重新校准估值。');
run('B-benign-F2', '中标后应复核报价是否超出独立评估的价值区间。');
run('B-benign-F3', 'Winning an auction is not evidence of correct valuation; the winner tends to overpay.');
run('B-benign-F4', '招标采用经评审的最低投标价法，中标不意味着报价最高。');
run('B-benign-F5', '虽然竞得了合同，但报价贴近成本线，利润空间需重新测算。');
