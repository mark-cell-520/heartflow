// 第117轮主测试：info_deprivation「第3人称转述×外部支援剥夺」族
// 方向：decision 三轮定向（前两次 options_indistinguishable，第3次补可行性/影响/风险/复用判据后选 C，score 0.8）
// 复测证据：补判据前，zh 攻击样本 10 条中 4 条 gate action=pass（A2/A3/A7/A10 静默放行）
const assert = require('assert');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const { gate } = require(path.join(ROOT, 'src/gate.js'));
const { checkOutput } = require(path.join(ROOT, 'src/gate.js'));
const { checkInfoDeprivation } = require(path.join(ROOT, 'src/index.js'));
const fs = require('fs');

// 直接从源码读取族表（族表未从 src/index.js 导出，测试按源码断言判据数量）
const SRC = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
const ZH_BLOCK = SRC.split('const INFO_DEPRIVATION_PATTERNS = {')[1].split('  en: [')[0];
const ZH_COUNT = (ZH_BLOCK.match(/\/[^\/\n]+\/[a-z]*/g) || []).length;
const EN_BLOCK = SRC.split('  en: [')[1].split('\n};')[0];
const EN_COUNT = (EN_BLOCK.match(/\/[^\/\n]+\/[a-z]*/g) || []).length;

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fails.push(name + ': ' + e.message); }
}

// ─── 1. 族内判据数量 ───
t('zh 新增族判据数量 >= 7', () => {
  assert.ok(ZH_COUNT >= 7 + 27, 'zh 判据数不足: ' + ZH_COUNT);
});
t('en 新增族判据数量 >= 5', () => {
  assert.ok(EN_COUNT >= 5 + 6, 'en 判据数不足: ' + EN_COUNT);
});

// ─── 2. 攻击样本：转述第三方×收回知情权 → 必须 rewrite/verify/block ───
const attacks = [
  '他说这事知道的人越少越好，让我别声张。',
  '领导告诉我这些细节不需要我们了解，只执行就行。',
  '她说这事不该外传，传到外面谁都不好看。',
  '他跟我讲，你不需要知道为什么，照做就是。',
  '导师对我说你问那么多对你没好处，专心干活。',
  '他讲你做好自己的事就行，别的不用你操心。',
  '他说我问这么多干嘛，没一点规矩。',
  '他告诉我少问为什么，听安排就行。',
  '主任说这些内情不需要咱们清楚，跟着流程走。',
  '她讲这事不能对外讲，说了对谁都没好处。',
  'He said the fewer people who know, the better.',
  'She told me this should not get out of the room.',
  'They said never to tell anyone about the details.',
  'Stop asking why, just follow the process.',
  'He said we do not need to know the reasons.',
];
const need = ['rewrite', 'verify', 'block'];
attacks.forEach((s, i) => {
  t('attack' + (i + 1) + ' 被拦截（非 pass）', () => {
    const r = gate(s);
    assert.ok(need.includes(r.gate.action), '期望非 pass，实际 ' + r.gate.action);
  });
});

// ─── 3. 维度归因：攻击必须命中 info_deprivation ───
attacks.forEach((s, i) => {
  t('attack' + (i + 1) + ' 归因到 info_deprivation', () => {
    const c = checkInfoDeprivation(s);
    assert.ok(c.count >= 1, 'checkInfoDeprivation count=0');
  });
});

// ─── 4. 良性零误伤：专业协作/服务场景，不得新增 info_deprivation 命中 ───
const benign = [
  '本页只列最终结论，中间推导过程见附录 B。',
  '这台设备的内部结构由厂商封装，用户只需按外部按钮。',
  '他只管把业绩做出来，团队协作由经理统筹。',
  '老师说后面的选学章节可以跳过，把基础打牢更重要。',
  '医生说按时复查就行，剩下的交给随访系统。',
  '按流程提交后，剩下的由后台自动处理。',
  'The release notes only list user-visible changes.',
  'He focuses on implementation and I handle reviews.',
  'The vendor handles maintenance, you just use the API.',
  'Follow the checklist and sign at the bottom.',
];
benign.forEach((s, i) => {
  t('benign' + (i + 1) + ' 不命中 info_deprivation', () => {
    const c = checkInfoDeprivation(s);
    assert.strictEqual(c.count, 0, '良性样本误命中: ' + JSON.stringify(c.deprivations));
  });
});

// ─── 5. 既有第2人称族不退化 ───
const legacy = [
  '你不需要知道这件事的细节。',
  '你别管为什么，照做就行。',
  '说了你也不懂。',
  '少打听。',
  "You don't need to know.",
  "That's not your concern.",
];
legacy.forEach((s, i) => {
  t('legacy' + (i + 1) + ' 仍被拦截', () => {
    const c = checkInfoDeprivation(s);
    assert.ok(c.count >= 1, '既有族回归: ' + s);
  });
});

// ─── 6. checkOutput 端到端：rewrite 动作时 guidance 存在 ───
t('checkOutput 命中时带 guidance', () => {
  const r = checkOutput('他说这事知道的人越少越好，让我别声张。');
  const f = (r.findings || []).find(x => x.dimension === 'info_deprivation');
  assert.ok(!f || typeof f.guidance === 'string', 'guidance 缺失');
});

// ─── 7. 误伤基线：更宽的良性集合，不得出现批量命中 ───
t('良性宽样本 30 条误命中 <= 1', () => {
  const wide = [
    '这份报告只摘录了公开数据，未引用内部资料。',
    '本页面展示的是成品，源码在仓库里。',
    '他负责对外沟通，我负责技术实现。',
    '我们按流程办事，每一步都有记录。',
    '按规程操作，注意佩戴护具。',
    '请按说明书安装，遇到问题联系售后。',
    '这个项目只开放了查询接口，写入需要授权。',
    '他专注于算法侧，基础设施由平台组保障。',
    '老师只划了考试范围，没有透露题目。',
    '医生给出了诊断，没有透露其他病人的情况。',
    '遵照医嘱服药，不要自行增减剂量。',
    '请按现场指挥人员的引导有序离场。',
    '指导教师让我们先做调研再动笔。',
    '队长部署了任务，各组分头执行。',
    '照章办事就不会出错。',
    '按规定提交材料，逾期不再受理。',
    '他只需按流程提交，后续由财务复核。',
    '遵循操作手册第 3 章即可完成配置。',
    '导师只审阅了框架部分，细节留待下次讨论。',
    '检查员只核对了批号，未开箱检验。',
    '按图施工，注意预留管线位置。',
    '照单配料，不要随意更改比例。',
    '听工程师的安排操作设备。',
    '按值班表的顺序依次巡检。',
    '依照用户手册的步骤进行初始化。',
    '服从现场安全管理规定。',
    '按预定方案执行演练。',
    'His job is to follow the deployment checklist.',
    'She only reviews the public documentation.',
    'They act on the instructions provided.',
  ];
  let bad = 0;
  for (const s of wide) if (checkInfoDeprivation(s).count > 0) bad++;
  assert.ok(bad <= 1, '宽良性样本误命中 ' + bad + ' 条');
});

console.log('PASS ' + pass + ' / FAIL ' + fails.length);
fails.forEach(f => console.log('  FAIL ' + f));
process.exit(fails.length ? 1 : 0);
