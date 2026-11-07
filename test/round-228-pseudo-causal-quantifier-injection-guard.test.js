// test/round-228-pseudo-causal-quantifier-injection-guard.test.js
// 第 228 轮守卫：pseudo_causal「倒装服药归因」族量词表扩面 + 注射形收口
//
// 缺口实测（scripts/tmp-228-probe.js，轮末已删）：
//   改前 12 条新量词攻击句（盒/支/片/粒/颗，对象未点名）detector 0/12 全漏，
//        5 条注射形攻击句（「那支针打下去」「这一针打下去」）detector 0/5 全漏；
//   改后 攻击 19/19 三层命中（detector + findings + gate），
//        良性（点名真药 + 新量词 10 条 / 结构性界线 6 条）detector 零命中不变。
//
// 根因（r227 只收了 8 个量词 + 无注射臂）：
//   ① 量词表 `[个瓶包袋剂味碗杯]` 漏掉最常用的 盒/支/片/粒/颗——
//      「这盒药吃下去烧就退了」「那片药吞下去烧就退了」整族零覆盖；
//   ② 「这一针」语序未收——「这/那 + 一 + 单字量词」的可选数词分支缺失；
//   ③ 注射形（「那支针打下去」）没有任何臂——原表只认吃/喝/服/吞 四个服下动词。
//
// 本测试锁定六件事：
//   ① 17 条新攻击句三层命中（不只守 action）
//   ② 点名真药 + 新量词良性族零误伤（扩面不许把「这片降压药」拉进来）
//   ③ 结构性/语境界线不判（跨句、对冲谦辞、无服下动词）
//   ④ 六处变异守卫 + 还原校验（整表 / 新量词 / 注射臂 / 可选数词 /
//      豁免表新族），全部「复制 src/ 整棵树到临时目录再变异」
//   ⑤ 存量族不塌（r227 的 15 条 + round-48 的 24 攻击 / 30 良性）
//   ⑥ 源码常量完整（量词 13 字三处 / 注射臂 / 可选数词 / 豁免表新族）+ halves 诊断
const path = require('path');
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');

const idx = require(path.join(ROOT, 'src/index.js'));
const gateMod = require(path.join(ROOT, 'src/gate.js'));
const SRC = path.join(ROOT, 'src', 'index.js');

let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + '\n     ' + e.message); process.exitCode = 1; }
}
process.on('exit', () => {
  console.log(`${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
});

const pcCount = (text) => idx.checkPseudoCausal(text).count;
const gateAction = (text) => gateMod.gate(text).gate.action;
function realFindings(text) {
  return (gateMod.gate(text).findings || []).filter(f => f && f.severity > 0);
}
const hasDim = (text, dim) => realFindings(text).some(f => f.dimension === dim);

// ─── 供 D 节变异用的源码锚点（与 src/index.js 当前实现逐字对应）────────
const ANCHOR_QUANT = '[盒支片粒颗个瓶包袋剂味碗杯服]';                       // 新量词类（出现 3 次）
const ANCHOR_QUANT_OLD = '[个瓶包袋剂味碗杯]';                            // r227 旧量词类（不许再出现）
const ANCHOR_OPT_QUANT = '(?:[盒支片粒颗个瓶包袋剂味碗杯服][^。]{0,4})?';        // 注射臂量词可选组
const ANCHOR_INJECT = '(?:注射液|针剂|药剂|针)[^。]{0,4}打(?:下)?(?:去)?';  // 注射臂
// [v6.8.158 第 230 轮] 锚点去掉收尾 `)`：原写法把正则的闭合括号也编进锚点，
// 任何后续往 PC_DRUG_MECH_ZH **尾部**追加词的轮次都会让锚点静默失配
// （r230 追加 10 个证据词后就撞上了，D5/F 两处报「锚点不唯一 0 !== 1」）。
// 与 r229 踩坑④ 同族：**锚点不能依赖语句结尾**。去掉 `)` 后锚点仍唯一
// （实测 src/index.js 中该串只出现 1 次），变异由「整段换成 `)`」改为「整段删空」。
const ANCHOR_DRUGMECH_NEW = '|降压药|降糖药|安眠药|止咳药|止泻药|肠胃药|胃药|抗过敏|救心丸|蒙脱石|奥司他韦|阿奇霉素|红霉素|左氧氟沙星';
const ANCHOR_INVTAKE = 'const PC_INVTAKE_ZH = /(?:';
const ANCHOR_DRUGMECH = 'const PC_DRUG_MECH_ZH = /(?:';
const ANCHOR_IV_CALL = 'const iv = causalInvertedTakeZh(text);';

// ─── A 节语料：新量词攻击（12）+ 注射形攻击（5）─────────────────────
const ATTACK_INJECT = [
  '那支针打下去烧就退了，肯定是针起了作用',
  '这一针打下去烧就退了，肯定是这一针有效',
  '这支针剂打下去立马退烧，看来这一针有效',
  '那支针打下去咳嗽就停了，一定是针见效了',
  '这盒针剂打下去烧就退了，显然是针剂起了作用',
  // 无量词注射语序（「这针/一针」）——承重的是量词可选组的 `?`
  '这针打下去烧就退了，肯定是这针起了作用',
  '一针打下去烧就退了，肯定是这一针有效',
];
const ATTACK_QUANT = [
  '这盒药吃下去烧就退了，肯定是药起了作用',
  '那片药吞下去烧就退了，准是药有效',
  '这粒药丸吃下去烧就退了，肯定是药丸起了作用',
  '那颗胶囊吞下去头疼就止住了，看来胶囊有用',
  '那盒丸吃下去病就好了，一定是丸的功劳',
  '这盒偏方吃下去烧就退了，显然是偏方起了作用',
  '这盒香灰吃下去烧就退了，肯定是香灰显灵',
  '那片丹药吃下去病就好了，说明仙丹灵验',
  '这粒药吞下去烧就退了，肯定是这药有效',
  '那颗药吞下去头就不疼了，说明药灵验',
  '那盒符水喝下去烧就退了，显然是符水的功效',
  '这盒秘方吃下去咳嗽就止住了，一定是秘方见效了',
];
const ATTACK = ATTACK_QUANT.concat(ATTACK_INJECT);
// r227 收口的 15 条（10 倒装 + 2 正序新族 + 3 存量），本轮不许退化
const ATTACK_R227 = [
  '这瓶药吃下去烧就退了，肯定是药起了作用',
  '那包药吃下去烧就退了，肯定是药起了作用',
  '这碗符水喝下去病就好了，说明符水显灵',
  '那袋香灰喝下去烧就退了，显然是香灰的功效',
  '这味偏方吃下去烧就退了，肯定是偏方起了作用',
  '那瓶药喝下去咳嗽就停了，一定是药见效了',
  '这包土方吃下去感冒就好了，说明土方有效',
  '那碗药喝下去疼就止住了，显然是药起了作用',
  '这瓶药服下去烧就退了，肯定是这药有效',
  '那杯符水喝下去头就不疼了，说明符水灵验',
  '喝了这个偏方，病就好了，看来真有用',
  '喝了这符水病就好了，说明符水显灵',
  '吃了这个药烧就退了，肯定是药起作用',
  '拜了财神之后就签单了',
  '他戴上幸运手环后比赛就赢了',
];

// ─── B 节语料：点名真药 + 新量词（扩面后仍必须零误伤）──────────────
// HEAD 实测（改前）这 10 条 detector 全 0、gate 全 pass——它们本来就合规，
// 本轮扩面不许把它们拉进来（r227「点名真药 + 药理依据不判」同族纪律）。
const BENIGN_NAMED = [
  '这盒感冒药吃下去烧就退了',
  '这片布洛芬吞下去烧就退了',
  '这盒阿莫西林吃下去感染就好了，说明疗程覆盖了致病菌',
  '这针胰岛素打下去血糖就稳了',
  '这支疫苗打下去感染就轻了，说明免疫应答生效了',
  '这片降压药吞下去血压就稳了',
  '那片奥美拉唑吞下去胃酸就少了',
  '这盒蒙脱石散吃下去腹泻就止住了',
  '这片安眠药吞下去人就睡着了',
  '这支流感疫苗打下去今年就没感冒',
];

// ─── C 节语料：结构性/语境界线（扩面后仍不许判）────────────────────
const BENIGN_STRUCT = [
  // 跨句：甲半与乙半分居两句，是事后叙述不是「服下即愈」的因果断言
  '这盒药吃下去。三天后他自己好了。',
  '这支针打下去。三天后他自己好了。',
  // 对冲谦辞：自认不确定
  '这盒药吃下去烧就退了，但样本太小不好归因',
  // 甲半在场但乙半（症状消退）不在同子句的 24 字窗口内
  '这盒药吃下去之后他照常上班，一周后体检指标全部正常',
  // 无名对象但没有任何服下动词
  '这盒药就放在桌上，谁也没动过',
  '这支针是护士打的，跟他自己没关系',
];

// ─── E 节语料：存量族（round-48 建维时的 24 攻击 / 30 良性，与 r227 E 节逐字一致）──
const LEGACY_ATTACK = [
  '上线之后投诉量下降了，所以这次上线就是投诉下降的原因。',
  '自从换了新领导，业绩就一路下滑，显然是新领导把团队带崩了。',
  '自从公司开始抓考勤，离职率就降了，说明抓考勤确实有用。',
  '他一来我们组项目就延期了，看来他就是问题所在。',
  '这部剧播出后当地旅游就火了，可见这部剧带火了整座城市。',
  '换了新 Logo 之后销量起来了，说明新 Logo 是成功的。',
  '去年开始用新系统，从那以后事故就没再出过，可见新系统解决了安全隐患。',
  '自从老板每天早会后，迟到的人就少了，说明早会制度立竿见影。',
  '这次促销一结束，退货量就上来了，显然促销把不合适的人吸引来了。',
  '调整了首页布局之后留存就涨了，证明之前的布局确实有问题。',
  '我把闹钟提前半小时后，上班就不再迟到了，可见闹钟是关键。',
  '团队加了新人之后，代码缺陷率下降了，说明新人培训起了作用。',
  '自从搬进了新办公室，大家的加班反而变少了，看来环境改善提高了效率。',
  '上了新考勤机以来，没人再忘打卡了，说明机器比制度管用。',
  '这两次延期都发生在你值班那周，所以问题就出在你身上。',
  '前年亏今年赚，中间只差了一次团建，显然是团建把士气带起来了。',
  '昨天改了配置，今天服务就稳了，说明就是配置的问题。',
  '自从改了餐标，食堂抱怨少了，可见抱怨都是钱没给够。',
  '他接手后投诉立刻少了，说明前任主管根本不会管理。',
  '发布新版本后崩溃率下降，证明是旧版本的锅。',
  '改了标题风格之后阅读量翻倍，可见读者就吃这一套。',
  '换了供应商之后交期变短，说明这家供应商明显更专业。',
  '下雨天的销售额总是低，所以天气直接决定了我们的业绩。',
  '周一出事故最多，可见周一大家状态最差。',
];
const LEGACY_BENIGN = [
  '上线之后投诉量有所下降，我们也同步调整了客服排班，具体原因还要再看两周数据。',
  '换了新领导之后业绩有变化，但这几个月市场环境也变了很多，不好归因。',
  '考勤收紧后离职率有下降，同期也普调了薪资，两件事混在一起还看不出主因。',
  '项目延期发生在他加入之后，但他只负责后端，延期主要在前端联调。',
  '旅游热度上升与剧的播出时间接近，但同期还有免门票政策，权重待评估。',
  '新 Logo 上线和销量回暖都发生在三季度，我们还做了两轮促销，需要拆开看。',
  '崩溃率下降与发版时间重合，不过同期还换了机器，不能直接归因。',
  '早会后迟到变少，也可能是天气变冷大家出门更早了。',
  '改配置后服务变稳，我怀疑跟当晚流量下降也有关，需要再观察。',
  '换了供应商后交期变短，今年整体物流都比去年通畅。',
  '采用新架构后请求 Latency 从 800ms 降到 120ms。',
  '这个版本发布后崩溃率从 2.1% 降到 0.4%。',
  '改版之后日活从 3 万涨到 4.5 万。',
  '灰度上线后转化率提升了 30%。',
  '去年导入新 CRM 后，销售人均单量提升了 1.8 倍。',
  '算法调整后检索准确率从 71% 提到 79%。',
  '六点之后地铁明显宽松很多。',
  '大雨之后水库水位涨了两米。',
  '国庆假期之后机票价格普遍回落。',
  '考试结束后图书馆的空位就多了。',
  '我们给查询加了索引，Explain 显示扫描行数从 120 万降到 3 千，慢查询随之消失。',
  '增加了缓存之后接口耗时降到 40ms，因为重复计算被省掉了。',
  '把超时从 30s 改成 5s，用户投诉中「转圈」的描述少了很多。',
  '加了单元测试之后线上回滚次数下降，边界 case 在提测前就被挡住了。',
  '换上 SSD 后编译时间从 14 分钟降到 3 分钟。',
  '灰度只放 5% 流量，有问题可以立刻关掉。',
  '上线后我们盯着看板守了半小时，没有异常再走人。',
  '发版后先观察 24 小时，指标不动再回滚。',
  '周一的事故率最高，p<0.05，样本 14 个月。',
  '下雨天销售额低，r=-0.62，是强相关不是因果。',
];

// ─── D 节：变异守卫（复制 src/ 整棵树到临时目录再变异，绝不在原地改写 src/）──
function copySrc(tag) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-r228-' + tag + '-'));
  for (const f of ['VERSION', 'package.json']) {
    try { fs.copyFileSync(path.join(ROOT, f), path.join(tmp, f)); } catch (e) { /* 缺文件不致命 */ }
  }
  cp.execFileSync(process.execPath,
    ['-e', `const fs=require('fs'),p=require('path');
function w(s,d){fs.mkdirSync(d,{recursive:true});
for(const e of fs.readdirSync(s,{withFileTypes:true})){
const a=p.join(s,e.name),b=p.join(d,e.name);
if(e.isDirectory())w(a,b);else fs.copyFileSync(a,b);}}
w(process.argv[1],process.argv[2]);`,
      path.join(ROOT, 'src'), path.join(tmp, 'src')],
    { stdio: 'ignore' });
  return tmp;
}
function countHitsIn(tmp, list) {
  const out = cp.execFileSync(process.execPath,
    ['-e', `const idx=require(${JSON.stringify(path.join(tmp, 'src', 'index.js'))});
const L=${JSON.stringify(list)};
let n=0; for(const x of L){ if(idx.checkPseudoCausal(x).count>0) n++; }
console.log(n);`],
    { encoding: 'utf8' });
  return parseInt(out.trim(), 10);
}

test(`A1 新量词/注射形攻击句 detector 命中（${ATTACK.length} 条）`, () => {
  const bad = ATTACK.filter(s => pcCount(s) === 0);
  assert.deepStrictEqual(bad, [], `以下攻击句 detector 零命中：\n  ${bad.join('\n  ')}`);
});
test(`A2 新量词/注射形攻击句 findings 含 pseudo_causal（${ATTACK.length} 条）`, () => {
  const bad = ATTACK.filter(s => !hasDim(s, 'pseudo_causal'));
  assert.deepStrictEqual(bad, [], `以下攻击句 findings 不含维度：\n  ${bad.join('\n  ')}`);
});
test(`A3 新量词/注射形攻击句 gate 非 pass（${ATTACK.length} 条）`, () => {
  const bad = ATTACK.filter(s => gateAction(s) === 'pass');
  assert.deepStrictEqual(bad, [], `以下攻击句 gate 仍 pass：\n  ${bad.join('\n  ')}`);
});
test(`A4 r227 收口的 15 条存量攻击句不许退化（detector 全命中）`, () => {
  const bad = ATTACK_R227.filter(s => pcCount(s) === 0);
  assert.deepStrictEqual(bad, [], `以下 r227 攻击句本轮退化：\n  ${bad.join('\n  ')}`);
});

test(`B1 点名真药 + 新量词良性句 detector 零命中（${BENIGN_NAMED.length} 条）`, () => {
  const bad = BENIGN_NAMED.filter(s => pcCount(s) !== 0);
  assert.deepStrictEqual(bad.map(s => `${s} → ${pcCount(s)}`), [], '以下良性句被本轮扩面误伤');
});
test(`B2 点名真药 + 新量词良性句 findings 不含 pseudo_causal（${BENIGN_NAMED.length} 条）`, () => {
  const bad = BENIGN_NAMED.filter(s => hasDim(s, 'pseudo_causal'));
  assert.deepStrictEqual(bad, [], '以下良性句 findings 含维度');
});
test(`B3 点名真药 + 新量词良性句 gate 全 pass（${BENIGN_NAMED.length} 条）`, () => {
  const bad = BENIGN_NAMED.filter(s => gateAction(s) !== 'pass');
  assert.deepStrictEqual(bad.map(s => `${s} → ${gateAction(s)}`), [], '以下良性句 gate 非 pass');
});

test(`C1 结构性/语境界线不判（${BENIGN_STRUCT.length} 条 detector 零命中）`, () => {
  const bad = BENIGN_STRUCT.filter(s => pcCount(s) !== 0);
  assert.deepStrictEqual(bad.map(s => `${s} → ${pcCount(s)}`), [], '以下界线句被误判');
});

test('D1 变异守卫一：摘掉整个甲半表 PC_INVTAKE_ZH 后新攻击句必须重新漏判、存量族不受影响', () => {
  const tmp = copySrc('invtake');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    assert.strictEqual(orig.split(ANCHOR_INVTAKE).length - 1, 1, 'PC_INVTAKE_ZH 定义锚点不唯一');
    // 整行替换（只换 `const PC_INVTAKE_ZH = ` 前缀会把正则体留在行内变成语法错误）
    const mutated = orig.replace(/const PC_INVTAKE_ZH = [^\n]*;/m, 'const PC_INVTAKE_ZH = /(?!x)x/;');
    assert.ok(!mutated.includes(ANCHOR_INVTAKE), '变异后甲半表仍在');
    fs.writeFileSync(src, mutated, 'utf8');
    const n = countHitsIn(tmp, ATTACK);
    assert.strictEqual(n, 0, `摘掉甲半表后仍有 ${n}/${ATTACK.length} 条命中，该表可能不承重`);
    const kept = countHitsIn(tmp, ATTACK_R227.slice(12));
    assert.strictEqual(kept, 3, `存量 3 条正序族（第⑩⑪⑫支承重）应不受影响，实测 ${kept}/3`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('D2 变异守卫二：量词类收窄回 r227 的 8 个后新量词攻击句必须重新漏判', () => {
  const tmp = copySrc('quant');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    const nOcc = orig.split(ANCHOR_QUANT).length - 1;
    assert.strictEqual(nOcc, 3, `新量词类应出现 3 次（倒装臂/注射臂/正序臂），实测 ${nOcc} 次`);
    assert.ok(!orig.includes(ANCHOR_QUANT_OLD), 'r227 旧量词类不应再出现');
    const mutated = orig.split(ANCHOR_QUANT).join(ANCHOR_QUANT_OLD);
    assert.ok(mutated !== orig, '变异未生效');
    fs.writeFileSync(src, mutated, 'utf8');
    // 12 条新量词句 + 3 条用量词（支/盒）的注射句应全部重新漏判
    const n = countHitsIn(tmp, ATTACK_QUANT.concat(['那支针打下去烧就退了，肯定是针起了作用', '这支针剂打下去立马退烧，看来这一针有效', '这盒针剂打下去烧就退了，显然是针剂起了作用']));
    assert.strictEqual(n, 0, `收窄量词后仍有 ${n}/15 条命中，新量词可能不承重`);
    // 「这一针」量词整体可选，不收量词影响，必须仍命中
    const inj = countHitsIn(tmp, ['这一针打下去烧就退了，肯定是这一针有效']);
    assert.strictEqual(inj, 1, `「这一针」量词可选臂应不受收窄影响，实测 ${inj}/1`);
    // r227 的 10 条倒装句用的仍是旧 8 量词，必须仍 10/10 命中
    const kept = countHitsIn(tmp, ATTACK_R227.slice(0, 10));
    assert.strictEqual(kept, 10, `r227 倒装族（旧 8 量词）应不受影响，实测 ${kept}/10`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('D3 变异守卫三：摘掉注射臂后 5 条注射形攻击句必须重新漏判、服药臂不受影响', () => {
  const tmp = copySrc('inject');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    const line = orig.match(/const PC_INVTAKE_ZH = [^\n]*;/m)[0];
    assert.strictEqual(line.split(ANCHOR_INJECT).length - 1, 1, '注射臂锚点不唯一');
    const mutated = orig.replace(ANCHOR_INJECT, '(?!x)x');
    assert.ok(!mutated.includes(ANCHOR_INJECT), '变异后注射臂仍在');
    assert.ok(mutated !== orig, '变异未生效');
    fs.writeFileSync(src, mutated, 'utf8');
    const n = countHitsIn(tmp, ATTACK_INJECT);
    assert.strictEqual(n, 0, `摘掉注射臂后仍有 ${n}/${ATTACK_INJECT.length} 条命中，注射臂可能不承重`);
    const kept = countHitsIn(tmp, ATTACK_QUANT);
    assert.strictEqual(kept, ATTACK_QUANT.length, `服药臂应不受影响，实测 ${kept}/${ATTACK_QUANT.length}`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('D4 变异守卫四：把注射臂量词可选组改成必选后「这针/一针」语序必须重新漏判', () => {
  const tmp = copySrc('optquant');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    // 只在 PC_INVTAKE_ZH 定义行内计数/替换——函数头注释里写着同款示例文本
    const line = orig.match(/const PC_INVTAKE_ZH = [^\n]*;/m)[0];
    const nOcc = line.split(ANCHOR_OPT_QUANT).length - 1;
    assert.strictEqual(nOcc, 1, `注射臂量词可选组应出现 1 次，实测 ${nOcc} 次`);
    // 去掉 `?`（量词变必选）——不是删掉整组：删掉整组后 `(?:这|那|一)` 直接接
    // 对象「针」，「这针/一针」仍会被兜住（本轮实测踩到，见 UPGRADE_LOG 踩坑）
    const mutated = orig.replace(/const PC_INVTAKE_ZH = [^\n]*;/m,
      line.split(ANCHOR_OPT_QUANT).join('[盒支片粒颗个瓶包袋剂味碗杯服][^。]{0,4}'));
    assert.ok(mutated !== orig, '变异未生效');
    fs.writeFileSync(src, mutated, 'utf8');
    // 无量词注射语序必须重新漏判
    const n = countHitsIn(tmp, ['这针打下去烧就退了，肯定是这针起了作用', '一针打下去烧就退了，肯定是这一针有效']);
    assert.strictEqual(n, 0, `量词改必选后「这针/一针」仍命中（${n}/2 漏判），量词可选性可能不承重`);
    // 带真量词的注射句必须仍命中（「这一针」除外——它的「针」本身充当量词，
    // 与「这针/一针」同属依赖量词可选性的语序，同样会漏）
    const kept = countHitsIn(tmp, ATTACK_INJECT.slice(0, 5));
    assert.strictEqual(kept, 4, `带量词的注射句应 4/5 仍命中（「这一针」依赖可选性会漏），实测 ${kept}/5`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('D5 变异守卫五：摘掉豁免表新增点名药类族后「这片降压药」必须重新被误命中', () => {
  const tmp = copySrc('drugmechnew');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    assert.strictEqual(orig.split(ANCHOR_DRUGMECH_NEW).length - 1, 1, '豁免表新族锚点不唯一');
    assert.strictEqual(orig.split(ANCHOR_DRUGMECH).length - 1, 1, 'PC_DRUG_MECH_ZH 定义锚点不唯一');
    const mutated = orig.replace(ANCHOR_DRUGMECH_NEW, '');
    assert.ok(!mutated.includes(ANCHOR_DRUGMECH_NEW), '变异后新族仍在');
    assert.ok(mutated !== orig, '变异未生效');
    fs.writeFileSync(src, mutated, 'utf8');
    const n = countHitsIn(tmp, ['这片降压药吞下去血压就稳了', '这片安眠药吞下去人就睡着了']);
    // [v6.8.158 第 230 轮] 期望值 1 → **2**：原断言注释写「安眠药句乙半无消退词，
    // 仍 0」——r230 给乙半表 PC_TAKE_RES_ZH 补了睡眠臂（`睡[着了]` 等），
    // 「人就睡着了」现在是合法乙半结果词。本变异把整段 14 词（含安眠药）从护栏里
    // 摘掉，于是降压药句与安眠药句**同时**重新被误命中。这不是回归，是 r230
    // 扩面的必然结果：护栏摘得越干净，被放行的未点名句越多。
    assert.strictEqual(n, 2, `摘掉新族后降压药句与安眠药句都应重新被误命中，实测 ${n}/2`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test(`D6 变异守卫六：还原校验（未变异副本必须 ${ATTACK.length}/${ATTACK.length} 命中 + 良性零误伤）`, () => {
  const tmp = copySrc('restore');
  try {
    const n = countHitsIn(tmp, ATTACK);
    assert.strictEqual(n, ATTACK.length, `未变异副本攻击句应全命中，实测 ${n}/${ATTACK.length}`);
    const b = countHitsIn(tmp, BENIGN_NAMED.concat(BENIGN_STRUCT));
    assert.strictEqual(b, 0, `未变异副本良性/界线句应零命中，实测 ${b}/${BENIGN_NAMED.length + BENIGN_STRUCT.length}`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test(`E1 存量攻击族不塌（r227 15 条 + round-48 24 条 = ${ATTACK_R227.length + LEGACY_ATTACK.length} 条）`, () => {
  const all = ATTACK_R227.concat(LEGACY_ATTACK);
  const bad = all.filter(s => pcCount(s) === 0);
  assert.deepStrictEqual(bad, [], `以下存量攻击句 detector 零命中：\n  ${bad.join('\n  ')}`);
});
test(`E2 存量良性族不涨（${LEGACY_BENIGN.length} 条 detector 零命中）`, () => {
  const bad = LEGACY_BENIGN.filter(s => pcCount(s) !== 0);
  assert.deepStrictEqual(bad.map(s => `${s} → ${pcCount(s)}`), [], '以下存量良性句被误判');
});

test('F 源码常量完整 + halves 半身诊断真的在返回', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  // 只在 PC_INVTAKE_ZH 定义行内计数——函数头注释里写着同款示例文本（D4 踩坑同款）
  const line = src.match(/const PC_INVTAKE_ZH = [^\n]*;/m)[0];
  // 量词 13 字 × 3 处，旧 8 字类不许残留
  assert.strictEqual(line.split(ANCHOR_QUANT).length - 1, 3, '新量词类应出现 3 次');
  assert.ok(!line.includes(ANCHOR_QUANT_OLD), 'r227 旧量词类不应再出现');
  // 注射臂的量词可选组（「这一针」的「针」本身充当量词，不在量词类里）
  assert.strictEqual(line.split(ANCHOR_OPT_QUANT).length - 1, 1, '注射臂量词可选组应只出现 1 次');
  // 豁免表新族 + 本族反向护栏
  assert.strictEqual(src.split(ANCHOR_DRUGMECH_NEW).length - 1, 1, '豁免表新增点名药类族应只出现 1 次');
  assert.ok(/const PC_DRUG_MECH_ZH = \/\(\?:/.test(src), 'PC_DRUG_MECH_ZH 反向护栏表不存在');
  // r227 不变量：子判据函数唯一、调用点唯一、豁免不许升级成函数级
  assert.strictEqual(src.split('function causalInvertedTakeZh(text)').length - 1, 1, '子判据函数应只定义 1 次');
  assert.strictEqual(src.split(ANCHOR_IV_CALL).length - 1, 1, '子判据调用点应唯一');
  assert.ok(!/if \(PC_DRUG_MECH_ZH\.test\(text\)\) return \{ count: 0/.test(src),
    'PC_DRUG_MECH_ZH 不许升级成函数级豁免');
  // halves 诊断（D 节变异守卫的判据来源）仍在返回
  const r = idx.checkPseudoCausal('这盒药吃下去烧就退了，肯定是药起了作用');
  assert.ok(r.hits.some(h => String(h).startsWith('倒装服药归因:') && String(h).includes('→')),
    '倒装服药命中串未带甲半→乙半半身诊断');
});
