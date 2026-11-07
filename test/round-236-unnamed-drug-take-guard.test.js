/**
 * 第 236 轮测试：未点名「药」对象服药归因族（r230 挂账甲半缺口两条）
 *
 * 背景：交接簿（data/upgrade-state.json r235 notes）候选①「r230 甲半缺口两条」——
 *   「吃了这片药人就困了」「这服药喝下去当晚就睡得死沉」
 * 两句话在 HEAD 的 checkPseudoCausal().count 都是 0、gate 都是 pass。
 *
 * 根因（两层，必须同时修）：
 *   ① PC_INVTAKE_ZH 正序臂（第三臂）对象表没有裸「药」——倒装臂（第一臂）有，
 *      同一张表两臂对象词不一致，属表内缺陷；
 *   ② PC_DRUG_MECH_ZH 的「服药」整词腿把「这服药」当他因/真药依据整句豁免，
 *      所以只补量词「服」不承重（r230 实测过的死代码）。
 *
 * 取向刀（沿用 r227 已裁定口径，本轮不重新裁）：
 *   **「未点名对象（含裸『药』）+ 服下动词 + 症状/睡眠改善」判，
 *   「点名真药 / 药理临床依据在场」不判**。
 *
 * 验收（全部本轮实测，见 UPGRADE_LOG r236）：
 *   - 红队攻击 HEAD detector 4/15（8 条 gate=pass）→ 15/15、gate 全非 pass；
 *   - 15 条良性 detector 0/15、gate 集合与 HEAD 逐项一致（HEAD 本来就 15/15 pass）；
 *   - 全量 A/B（HEAD worktree vs 当前树，28199 条 test/ 中文 quoted 样本）：
 *     gate.action 只差 2 条（正是本轮修的两条挂账句）、pc count 升 7 降 0。
 */
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

function realFindings(text) {
  return (gateMod.gate(text).findings || []).filter(f => f && f.severity > 0);
}
const pcCount = (text) => idx.checkPseudoCausal(text).count;
const gateAction = (text) => gateMod.gate(text).gate.action;
const hasDim = (text, dim) => realFindings(text).some(f => f.dimension === dim);

// ─── A 节语料：本轮攻击族 15 条（HEAD 4/15，8 条 gate=pass）────────────
const ATTACK_FWD = [
  '吃了这片药人就困了',
  '吃了这个药烧就退了，肯定是药起作用',
  '喝了那服药咳嗽就停了，显然是药见效了',
  '吞了这盒药当晚就睡得死沉',
  '吃了那片药头就不疼了，看来是真有效',
  '吃了这一服药人就困得睁不开眼',
  '喝了这个药当晚就入睡特别快',
];
const ATTACK_INV = [
  '这服药喝下去当晚就睡得死沉',
  '那服药吞下去人就困了',
  '一服药吃下去烧就退了，肯定是药起了作用',
  '这服药喝下去当晚就一觉到天亮',
  '这服药喝下去病就好了，说明是药的功劳',
];
const ATTACK_EXIST = [
  '这袋药喝下去当晚就睡踏实了',
  '那片药吞下去夜里就不再醒了',
  '这盒药吃下去当晚就睡着了，准是药有效',
];
const ATTACK = ATTACK_FWD.concat(ATTACK_INV, ATTACK_EXIST);
// HEAD 实测本就非 pass 的 7 条（本轮前探针 scripts/tmp-236-probe.js）
const ATTACK_HEAD_NONPASS = [
  '吃了这个药烧就退了，肯定是药起作用',
  '喝了那服药咳嗽就停了，显然是药见效了',
  '吃了那片药头就不疼了，看来是真有效',
  '这袋药喝下去当晚就睡踏实了',
  '那片药吞下去夜里就不再醒了',
  '这盒药吃下去当晚就睡着了，准是药有效',
];

// ─── B 节语料：良性 15 条（HEAD 15/15 detector 0 + gate 15/15 pass）──
const BENIGN = [
  '吃了布洛芬之后半小时烧就退了，这是药理作用',
  '二甲双胍吃下去血糖就降了，这是医嘱要求的',
  '贴了退热贴之后体温降了，医生说是正常反应',
  '打了疫苗之后感染就轻了，双盲实验证实有效',
  '按时服药之后血压就稳了，这是临床验证过的',
  '这片药吞下去人就睡着了，但双盲实验显示和安慰剂没差别',
  '这片药吞下去人就睡着了，不过样本只有三个，可能是安慰剂效应',
  '这片面包吞下去人就困了',
  '他换了遮光窗帘之后当晚就睡得很好',
  '这家咖啡馆的咖啡喝下去人就精神了',
  '吃了这个保健品之后精神就好了，但样本太小不好归因',
  '这片药吞下去。三天后他自己睡着了。',
  '这片药吞下去，但我还是睡不着',
  '这片药吞下去人就睡着了，不过也可能是换了枕头的原因',
  '这片药吞下去人就睡着了，可能是安慰剂效应',
];

// ─── C 节语料：结构性/语境界线 ───────────────────────────────────────
const BENIGN_STRUCT = [
  '这片药吞下去。三天后他自己睡着了。',
  '这片药吞下去，但我还是睡不着',
  '这片药吞下去人就睡着了，不过也可能是换了枕头的原因',
  '这片药吞下去人就睡着了，可能是安慰剂效应',
  '这片药吞下去人就睡着了，但样本太小不好归因',
  '这片面包吞下去人就困了',
  '这家咖啡馆的咖啡喝下去人就精神了',
  '这服药开完之后病情就有了好转，医生说是疗程覆盖了致病菌',
  '这片药吞下去人就睡着了，但双盲实验显示和安慰剂没差别',
  '这片药吞下去人就睡着了，不过样本只有三个，可能是安慰剂效应',
];

// ─── E 节语料：存量族（r227 10 条倒装 + r230 的 3 条既有攻击 + 10 条存量良性）
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
];
const BENIGN_STOCK = [
  '这盒感冒药吃下去烧就退了',
  '这片布洛芬吞下去烧就退了',
  '这盒阿莫西林吃下去感染就好了，说明疗程覆盖了致病菌',
  '这针胰岛素打下去血糖就稳了',
  '这片降压药吞下去血压就稳了',
  '这片安眠药吞下去人就睡着了',
  '按时服药之后疼痛就缓解了，说明非甾体抗炎成分在起作用',
  '服用抗生素三天后退了烧，说明疗程覆盖了致病菌',
  '吃了二甲双胍之后血糖就降了，说明这个药对我的糖尿病有效',
  '这款保健品临床实验做了两年，样本三千人',
];

// ─── 变异守卫用的临时副本 ────────────────────────────────────────────
function copySrc(tag) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-r236-' + tag + '-'));
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

// ─── A 节：三层命中 ──────────────────────────────────────────────────
test(`A1 本轮攻击族 detector 命中（${ATTACK.length} 条，HEAD 4/15）`, () => {
  const bad = ATTACK.filter(s => pcCount(s) === 0);
  assert.deepStrictEqual(bad, [], `以下攻击句 detector 零命中：\n  ${bad.join('\n  ')}`);
});
test(`A2 本轮攻击族 findings 含 pseudo_causal（${ATTACK.length} 条）`, () => {
  const bad = ATTACK.filter(s => !hasDim(s, 'pseudo_causal'));
  assert.deepStrictEqual(bad, [], `以下攻击句 findings 不含 pseudo_causal：\n  ${bad.join('\n  ')}`);
});
test(`A3 本轮攻击族 gate 非 pass（${ATTACK.length} 条，HEAD 8 条 pass）`, () => {
  const bad = ATTACK.filter(s => gateAction(s) === 'pass');
  assert.deepStrictEqual(bad, [], `以下攻击句 gate 仍 pass：\n  ${bad.join('\n  ')}`);
});
test('A4 三层命中的来源是倒装服药子判据（hits 带「倒装服药归因:」前缀）', () => {
  for (const s of ATTACK) {
    const r = idx.checkPseudoCausal(s);
    assert.ok(r.hits.some(h => h.indexOf('倒装服药归因:') === 0),
      `hits 应含倒装服药子判据命中：${s}（实测 ${r.hits.join(' / ')}）`);
  }
  // 「吃了这个药烧就退了，肯定是药起作用」在 HEAD 已被第⑩支命中（存量，非本轮引入）
  assert.ok(idx.checkPseudoCausal('吃了这个药烧就退了，肯定是药起作用').count >= 1,
    '存量第⑩支命中不应被本轮改动打掉');
});

// ─── B 节：良性零误伤 ────────────────────────────────────────────────
test(`B1 良性族 detector 零命中（${BENIGN.length} 条）`, () => {
  const bad = BENIGN.filter(s => pcCount(s) !== 0);
  assert.deepStrictEqual(bad, [], `以下良性句被误判：\n  ${bad.join('\n  ')}`);
});
test(`B2 良性族 findings 不含 pseudo_causal（${BENIGN.length} 条）`, () => {
  const bad = BENIGN.filter(s => hasDim(s, 'pseudo_causal'));
  assert.deepStrictEqual(bad, [], `以下良性句 findings 含 pseudo_causal：\n  ${bad.join('\n  ')}`);
});
test('B3 良性族 gate 集合与 HEAD 逐项一致（HEAD 15/15 全 pass，本轮零新增非 pass）', () => {
  const nonpass = BENIGN.filter(s => gateAction(s) !== 'pass');
  assert.deepStrictEqual(nonpass, [],
    '以下良性句 gate 已非 pass（HEAD 实测 15/15 全 pass，出现即本轮引入的假阳性）：\n  ' + nonpass.join('\n  '));
});

// ─── C 节：结构性界线 ────────────────────────────────────────────────
test(`C1 结构性/语境界线不判（${BENIGN_STRUCT.length} 条 detector 零命中）`, () => {
  const bad = BENIGN_STRUCT.filter(s => pcCount(s) !== 0);
  assert.deepStrictEqual(bad, [], `以下界线句被误判：\n  ${bad.join('\n  ')}`);
});

// ─── D 节：四处变异守卫 ──────────────────────────────────────────────
test('D1 变异守卫一：摘掉正序臂对象表的三个新词后正序族必须重新漏判、倒装族不塌', () => {
  const tmp = copySrc('fwdobj');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    // 只锚正序臂（第三臂）：它的量词组带 `(?:一)?` 前缀且整体可选，与倒装臂可区分
    const ANCHOR = '(?:一)?[盒支片粒颗个瓶包袋剂味碗杯服]?[^。]{0,4}(?:药丸|胶囊|汤药|仙丹|符水|香灰|香炉灰|偏方|土方|秘方|药|丸|丹)';
    const line = orig.match(/const PC_INVTAKE_ZH = [^\n]*;/m)[0];
    assert.strictEqual(line.split(ANCHOR).length - 1, 1, '正序臂对象表锚点不唯一');
    const OLD = '(?:一)?[盒支片粒颗个瓶包袋剂味碗杯服]?[^。]{0,4}(?:符水|香灰|香炉灰|偏方|土方|秘方|仙丹|汤药|丸|丹)';
    const mutated = orig.replace(/const PC_INVTAKE_ZH = [^\n]*;/m,
      line.split(ANCHOR).join(OLD));
    assert.ok(mutated !== orig, '变异未生效');
    fs.writeFileSync(src, mutated, 'utf8');
    // 6 条 HEAD 本就 0 命中的正序臂句必须全部回落（「吃了这个药烧就退了」除外——
    // 它 HEAD 已被第⑩支 PC_ACT_LUCK_ZH×PC_RES_LUCK_ZH 命中，是存量非本轮引入）
    const fwdNew = ATTACK_FWD.filter(s => s !== '吃了这个药烧就退了，肯定是药起作用');
    const fwd = countHitsIn(tmp, fwdNew);
    assert.strictEqual(fwd, 0, `摘掉正序臂新对象词后仍有 ${fwd}/${fwdNew.length} 条命中，新词可能不承重`);
    const inv = countHitsIn(tmp, ATTACK_INV);
    assert.strictEqual(inv, ATTACK_INV.length, `倒装族应不受影响，实测 ${inv}/${ATTACK_INV.length}`);
    const ex = countHitsIn(tmp, ATTACK_EXIST);
    assert.strictEqual(ex, ATTACK_EXIST.length, `存量倒装族应不受影响，实测 ${ex}/${ATTACK_EXIST.length}`);
    const b = countHitsIn(tmp, BENIGN);
    assert.strictEqual(b, 0, `良性族误伤 ${b}/${BENIGN.length}`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('D2 变异守卫二：摘掉量词类新增的「服」后倒装臂服药量词族必须重新漏判', () => {
  const tmp = copySrc('quant');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    const ANCHOR = '[盒支片粒颗个瓶包袋剂味碗杯服]';
    const line = orig.match(/const PC_INVTAKE_ZH = [^\n]*;/m)[0];
    assert.strictEqual(line.split(ANCHOR).length - 1, 3, `新量词类应出现 3 次（倒装/注射/正序三臂），实测 ${line.split(ANCHOR).length - 1} 次`);
    const mutated = orig.replace(/const PC_INVTAKE_ZH = [^\n]*;/m,
      line.split(ANCHOR).join('[盒支片粒颗个瓶包袋剂味碗杯]'));
    assert.ok(mutated !== orig, '变异未生效');
    fs.writeFileSync(src, mutated, 'utf8');
    // 只有**倒装臂**的 5 条依赖新量词（倒装臂量词必选，`这/那/一 + 量词` 缺一不匹配）。
    // 正序臂的两条「服药」句（喝了那服药 / 吃了这一服药）不依赖它——正序臂量词组
    // 整体可选，「服」会被 `[^。]{0,4}` 窗口吸收（本轮实测，写在这里防下轮误判）。
    const n = countHitsIn(tmp, ATTACK_INV);
    assert.strictEqual(n, 0, `摘掉「服」后倒装臂仍有 ${n}/${ATTACK_INV.length} 条命中，量词可能不承重`);
    // 不依赖「服」量词的族必须不塌
    const others = ATTACK.filter(s => ATTACK_INV.indexOf(s) === -1);
    const kept = countHitsIn(tmp, others);
    assert.strictEqual(kept, others.length, `非「服」量词族应不受影响，实测 ${kept}/${others.length}`);
    const b = countHitsIn(tmp, BENIGN);
    assert.strictEqual(b, 0, `良性族误伤 ${b}/${BENIGN.length}`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('D3 变异守卫三：摘掉 PC_DRUG_MECH_ZH「服药」腿的负向环视后服药量词族必须整句回落', () => {
  const tmp = copySrc('lookbehind');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    const defLine = orig.match(/const PC_DRUG_MECH_ZH = [^\n]*;/m)[0];
    const ANCHOR = '(?<![这那一])服药';
    assert.strictEqual(defLine.split(ANCHOR).length - 1, 1, '「服药」负向环视锚点不唯一');
    const mutated = orig.replace(/const PC_DRUG_MECH_ZH = [^\n]*;/m,
      defLine.split(ANCHOR).join('服药'));
    assert.ok(mutated !== orig, '变异未生效');
    fs.writeFileSync(src, mutated, 'utf8');
    const withFu = ATTACK.filter(s => /[这那一]服药/.test(s));
    assert.ok(withFu.length >= 5, `「这/那/一服药」语料应 ≥5 条，实测 ${withFu.length}`);
    const n = countHitsIn(tmp, withFu);
    assert.strictEqual(n, 0, `环视摘除后仍有 ${n}/${withFu.length} 条命中，说明「服药」豁免腿不承重`);
    // 正常服药良性句在两种形态下都必须仍被豁免（环视只挡指示词前缀）
    const okDrug = countHitsIn(tmp, BENIGN_STOCK.filter(s => /服[药用]/.test(s)));
    assert.strictEqual(okDrug, 0, `正常服药良性句被误命中 ${okDrug} 条`);
    const others = ATTACK.filter(s => withFu.indexOf(s) === -1);
    const kept = countHitsIn(tmp, others);
    assert.strictEqual(kept, others.length, `非「服」量词族应不受影响，实测 ${kept}/${others.length}`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('D4 变异守卫四：还原校验（未变异副本必须 15/15 命中 + 良性零误伤）', () => {
  const tmp = copySrc('restore');
  try {
    const n = countHitsIn(tmp, ATTACK);
    assert.strictEqual(n, ATTACK.length, `未变异副本攻击族应 ${ATTACK.length}/${ATTACK.length}，实测 ${n}`);
    const b = countHitsIn(tmp, BENIGN);
    assert.strictEqual(b, 0, `未变异副本良性族误伤 ${b}/${BENIGN.length}`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// ─── E 节：存量族不塌不涨 ────────────────────────────────────────────
test(`E1 存量攻击族不塌（r227 倒装 10 条 + 本轮前已命中的 3 条 = ${ATTACK_R227.length + ATTACK_EXIST.length} 条）`, () => {
  const bad = ATTACK_R227.concat(ATTACK_EXIST).filter(s => pcCount(s) === 0);
  assert.deepStrictEqual(bad, [], `以下存量攻击句 detector 回落：\n  ${bad.join('\n  ')}`);
});
test(`E2 存量良性族不涨（${BENIGN_STOCK.length} 条 detector 零命中）`, () => {
  const bad = BENIGN_STOCK.filter(s => pcCount(s) !== 0);
  assert.deepStrictEqual(bad, [], `以下存量良性句被误判：\n  ${bad.join('\n  ')}`);
});

// ─── F 节：源码常量与结构 ────────────────────────────────────────────
test('F1 PC_INVTAKE_ZH 三臂量词类统一含「服」（3 次），正序/倒装两臂对象表同源', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  const line = src.match(/const PC_INVTAKE_ZH = [^\n]*;/m)[0];
  assert.strictEqual(line.split('[盒支片粒颗个瓶包袋剂味碗杯服]').length - 1, 3,
    '新量词类应出现 3 次（倒装臂/注射臂/正序臂）');
  assert.ok(!line.includes('[盒支片粒颗个瓶包袋剂味碗杯]'), '旧量词类（13 个）不应再出现');
  const OBJ = '(?:药丸|胶囊|汤药|仙丹|符水|香灰|香炉灰|偏方|土方|秘方|药|丸|丹)';
  assert.strictEqual(line.split(OBJ).length - 1, 2, '正序臂与倒装臂对象表应同源（各 1 次）');
});
test('F2 PC_DRUG_MECH_ZH 的「服药」腿带负向环视（只挡这/那/一三个指示词）', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  const defLine = src.match(/const PC_DRUG_MECH_ZH = [^\n]*;/m)[0];
  assert.ok(defLine.includes('(?<![这那一])服药'), '「服药」腿应有 (?<![这那一]) 负向环视');
  assert.strictEqual(defLine.split('(?<![这那一])服药').length - 1, 1, '环视锚点应唯一');
});
test('F3 两个子判据函数各定义 1 次且 hits 带子判据前缀', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  assert.strictEqual(src.split('function causalInvertedTakeZh(text)').length - 1, 1, 'causalInvertedTakeZh 应定义 1 次');
  assert.strictEqual(src.split('function causalSupplementZh(text)').length - 1, 1, 'causalSupplementZh 应定义 1 次');
  assert.ok(src.includes("'倒装服药归因:'"), 'causalInvertedTakeZh 的 hits 前缀应保留');
  assert.ok(src.includes("'未点名保健品归因:'"), 'causalSupplementZh 的 hits 前缀应保留');
});
test('F4 dimensions 键数 210 不变（本轮未加维度，只补判据层词表）', () => {
  const keys = Object.keys(idx.discriminate('测试句子').dimensions || {});
  assert.strictEqual(keys.length, 210, `dimensions 键数应为 210，实测 ${keys.length}`);
});

// ─── G 节：已知未修登记 ──────────────────────────────────────────────
test('G1 已知未修①：甲半只收这/那/一三个指示词，数词「两/三服药」族不判', () => {
  // r227 甲半纪律：未点名对象必须带 这/那/一 指示词（不收裸「药」，也不收数词
  // 量词「两服药/三服药」）。这是形状决定不是缺口，登记备查——要收需先裁
  // 「数词 + 剂量词」是否也算未点名，会波及甲半三臂的全部量词口径。
  assert.strictEqual(pcCount('两服药喝下去当晚就睡得死沉'), 0,
    '「两服药」族已判命中——若这是有意扩面，请同步本条登记并补红队与全量 A/B');
  assert.strictEqual(pcCount('喝了两服药当晚就睡得死沉'), 0,
    '「喝了两服药」族已判命中——若这是有意扩面，请同步本条登记');
});
test('G2 已知未修②：跨表业务机制词已由 r238 修复（FIXED_BY_R238）', () => {
  // [v6.8.166 第 238 轮] 本条登记的业务侧缺口已修：PC_MECH_WEAK_ZH 新增三条
  // 「归因位业务机制词」形状腿（34 词）、PC_REV_MECH_ZH 同批整句同步。两条
  // 登记句（「交付质量」「机场时刻表」）HEAD 实测 pc=1 的误判已归零：
  //   「从那以后他的客户再也没断过，都说是因为交付质量稳了」1→0
  //   「从那以后航班就再也没延误过，听说是因为机场调整了时刻表」1→0
  // 医疗/依据侧（DRUG/SUPP 两表对齐）仍是已知未修，见 r238 G3 登记。
  assert.strictEqual(pcCount('从那以后他的客户再也没断过，都说是因为交付质量稳了'), 0,
    'r238 修复句——若回退请检查 PC_MECH_WEAK_ZH 腿 A 与 PC_REV_MECH_ZH 34 词');
  assert.strictEqual(pcCount('从那以后航班就再也没延误过，听说是因为机场调整了时刻表'), 0,
    'r238 修复句——若回退请检查 PC_MECH_WEAK_ZH 腿 A「据说/听说…因为」臂');
});
test('G3 已知未修③：causalInvertedTakeZh / causalSupplementZh 的 lastIndex 防空匹配防护前移', () => {
  // r231 记过、r233 D2 测试侧撞上的同款脆弱结构：摘 alternation 分支没连管道
  // 一起摘会留下空分支 `||`，正则匹配空串让整表恒真。正常路径零影响。
  const src = fs.readFileSync(SRC, 'utf8');
  const fn = src.slice(src.indexOf('function causalInvertedTakeZh'), src.indexOf('function causalSupplementZh'));
  assert.ok(/actRe\.lastIndex === m\.index/.test(fn),
    'causalInvertedTakeZh 应保留 lastIndex 防空匹配防护（causalSupplementZh 同款）');
});
