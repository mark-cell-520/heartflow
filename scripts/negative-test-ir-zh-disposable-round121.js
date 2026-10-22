// 第 121 轮负例守卫：逐条从源码删除新增判据 → 主测试必须变红
// 参考 scripts/negative-test-absolute-claim-en.js 的注入-删条-必须变红形态
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const SRC = '/root/.hermes/skills/ai/mark-heartflow-skill/src/index.js';
const TEST = '/root/.hermes/skills/ai/mark-heartflow-skill/test/instrumental-reasoning-zh-disposable-round121.test.js';

// 每条 needle 必须是本轮新增判据的**唯一**源码特征串（从正则内部起点替换，
// 向前找最近的 '/' 作为正则起点，避免第 120 轮 \b 悬空坑）
const NEEDLES = [
  '为了|目的是|就是|本来|本身|出发点)[^。]{0,10}(?:公司|企业|组织|单位|老板|管理层|股东)[^。]{0,12}(?:筛选|挑|筛|选择|留下|清掉|清出|出更|出最能|利益|跑得更快|更快|战斗力|价值)/',
  '战斗力|活力|效率|竞争力|狼性|执行力)[^。]{0,30}(?:淘汰|末位|竞聘|绩效排名|筛选|分选)[^。]{0,8}(?:是|就是|属于)[^。]{0,10}(?:必要|必须|本该|合理|应该)/',
  '就是为了|是为了|目的是|就是为了|本来就是|就是)[^。]{0,20}(?:筛出去|筛掉|筛出|清出去|清掉|清出|淘汰掉|刷下去|涮下去|踢出去|挤出去|砍掉)/',
  '最终|最后|说到底|本质上|归根结底)?[^。]{0,4}(?:受益|得利|获利|占便宜|捞到好处)[^。]{0,6}(?:的是|方是|者是|在于)[^。]{0,10}(?:公司|企业|组织|单位|老板|管理层|股东)/',
  '是|就是|属于|正是|堪称)[^。]{0,12}(?:必要|必须|合理|应当|应该|行之有效|屡试不爽)[^。]{0,6}(?:手段|方式|方法|举措|措施|机制|办法)/',
  '更有|最有|没有|毫无|缺|少)[^。]{0,2}(?:利用价值|使用价值)[^。]{0,12}(?:的人|员工|留下来|留下|清掉|优化|淘汰|走人|出去)/',
  '性价比低|性价比差|不合算|不划算|不值)[^。]{0,6}(?:的人|员工|团队成员|候选人)[^。]{0,8}(?:清掉|清出去|淘汰|优化|换掉|走人|裁掉)/',
  '危机感)[^。]{0,30}(?:末位淘汰|淘汰|竞聘|绩效排名|筛选|分选|人员优化)[^。]{0,8}(?:是|就是|属于|正是)[^。]{0,12}(?:必要|必须|合理|应该|应当|手段|举措)/',
  '就是|属于|不过是|无非是|只是|相当于)[^。]{0,12}(?:数字|资源数|可替换|可更换|可消耗|耗材|电池|零件|物料|成本项|账面上的数字|报表数字)/',
  '说砍|说裁|说换|说开)[^。]{0,4}(?:就|便)[^。]{0,6}(?:砍|裁|换|开)|(?:用废|用坏|用完|榨干)[^。]{0,6}(?:了)?[^。]{0,6}(?:再|就)[^。]{0,4}(?:招|换|补|招一批|换一批)/',
  '按|照)[^。]{0,6}(?:工时|人天|人月|产能|人次|件数|单量)[^。]{0,8}(?:折算|换算|计算|核算|算清)[^。]{0,6}|(?:折算|换算|核算)[^。]{0,10}(?:成人|成人力|为人力)/',
  '当成|看作|视为|当作|比作|当做)[^。]{0,10}(?:耗材|干电池|电池|零件|物料|成本项|成本数字|柴火|燃料|工具人|可替换资源|可消耗品|可弃置|随时可换|数字)/',
  '心寒|寒心|寒了|吃亏|受伤|受损害|受损失|拖垮|没有成长|没有安全感|为难|承担风险|被牺牲|被放弃|被替换|被淘汰)[^。]{0,16}(?:但|但是|可是|可|不过|然而)?[^。]{0,10}(?:目标|节点|指标|业绩|KPI|kpi|数字|速度|交付|成本|排名|营收|收入)[^。]{0,14}(?:必须|优先|不能改|不能变|不能动|不动摇|不能为|还是得|还是要|得保|要保|第一|最大|压倒|高于一切)/',
  '虽然|即便|即使|纵然|就算|就算是|姑且不谈|先不说)[^。]{0,16}(?:会|将|要|就是)?[^。]{0,12}(?:寒了|寒|伤了|苦了|累垮|拖垮|吃亏|受伤|受损害|受损失|没有成长|没有安全感|心寒|为难|承担风险|被牺牲|被放弃)[^。]{0,18}(?:业绩|指标|目标|节点|KPI|kpi|数字|交付|速度|成本|排名|营收|收入)[^。]{0,14}(?:还是得|还是要|还是|仍然|依然|必须|优先|不能改|不能动|不能变|不动摇|不能为|要保|得保|第一)/',
];

const orig = fs.readFileSync(SRC, 'utf8');
let real = 0, fallback = 0, anomaly = 0;
const detail = [];

for (const needle of NEEDLES) {
  const count = orig.split(needle).length - 1;
  if (count !== 1) { anomaly++; detail.push(`ANOMALY needle×${count}: ${needle.slice(0, 30)}`); continue; }
  // 向前找最近的正则起点 '/'，避免从正则内部起点替换致 \b 悬空（第 120 轮坑）
  const idx = orig.indexOf(needle);
  const slash = orig.lastIndexOf('/', idx);
  if (slash < 0) { anomaly++; detail.push('NO_SLASH: ' + needle.slice(0, 30)); continue; }
  const start = orig.lastIndexOf('\n', idx) + 1;
  const end = orig.indexOf('\n', idx);
  const line = orig.slice(start, end);
  const head = orig.slice(slash + 1, idx);
  if (/[^\\]\\[bB]/.test(head)) { fallback++; detail.push('FALLBACK_LB: ' + needle.slice(0, 30)); continue; }
  // 注入：删掉从正则起点到 needle 结束的内容
  const mutated = orig.slice(0, slash) + orig.slice(slash, idx).replace(head, '') + '' + orig.slice(idx + needle.length);
  fs.writeFileSync(SRC, mutated);
  let red = false;
  try {
    execFileSync('node', [TEST], { cwd: path.dirname(TEST), stdio: 'pipe', timeout: 90000 });
    // 未退出码 1 → 测试仍全绿 = 守卫失效
  } catch (e) {
    red = (e.status === 1);
  }
  fs.writeFileSync(SRC, orig);
  if (red) { real++; detail.push('REAL: ' + needle.slice(0, 30)); }
  else { fallback++; detail.push('NOT_RED: ' + needle.slice(0, 30)); }
}

console.log(`\n负例守卫结果：真守卫 ${real} / 有兜底 ${fallback} / 异常 ${anomaly}（共 ${NEEDLES.length} 条）`);
for (const d of detail) console.log('  ' + d);
// 恢复校验
const now = fs.readFileSync(SRC, 'utf8');
if (now !== orig) { console.error('!! 源码未还原，立即回滚'); fs.writeFileSync(SRC, orig); process.exit(2); }
console.log('源码已还原（逐字节一致）');
process.exit(fallback > 0 || anomaly > 0 ? 1 : 0);
