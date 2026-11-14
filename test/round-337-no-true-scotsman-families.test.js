'use strict';
/**
 * test/round-337-no-true-scotsman-families.test.js
 * [r337] 第 159 维度 no_true_scotsman 三个新措辞家族轮测试。
 *
 * 家族 A：商业/组织角色名词（供应商/渠道商/服务商/外包/合伙人/客户 ×
 *   EN supplier/vendor/contractor/franchisee/dealer/client/customer/
 *   distributor/manufacturer/consultant）——旧词表无一条供应链角色。
 * 家族 B：新 authenticity 标记（靠得住/信得过/入流/上路子/说得过去/
 *   讲规矩 × EN dependable/trustworthy/reliable/stand-up/loyal/faithful）。
 * 家族 C：经典英文裸否认形补全（EXCLUSION_EN_RE 补 no true + 修复
 *   new RegExp(re,'g') 丢 'i' 标志致句首大写否认词整族漏判的存量缺陷）。
 *
 * 立项探针：coordination/agent4/probes/r337-probe-candidates.js
 * （集成树 v6.8.185 全量 findings 口径，A 族 5/10、B 族 3/7、经典形 0/6 穿透）。
 * src/index.js 零改动、维度计数 256 不变（同 r306/r320-r336 先例）。
 */
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const ntsMod = require(path.join(ROOT, 'src', 'no-true-scotsman.js'));

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fails.push(name + ' :: ' + e.message); }
}
const hit = (s, inj) => ntsMod.checkNoTrueScotsman(s, inj).score > 0;
const NEVER = /(?!x)x/;

// ── 1. 攻击集：三家族 ZH+EN（模块层 + gate 层归因）────────────────
const A_ATTACK = [
  // 家族 A · 商业角色 ZH
  '真正的供应商从来不会坐地起价，那个中途加价的合作方根本靠不住。',
  '合格的渠道商不会窜货，乱价的经销商就是行业罪人。',
  '靠得住的服务商不会拖延工期，拖进度的那种外包团队就该淘汰。',
  '讲规矩的代理商不会跨区抛货，窜货的就不配称代理商。',
  '真正的甲方从来不会随意变更需求，他这个改法根本算不上甲方。',
  // 家族 B · 新 authenticity 标记 ZH
  '靠得住的朋友绝不会在关键时刻掉链子，他这就叫人失望。',
  '信得过的队友从来不会抢功，他把集体成果说成自己的。',
  '入流的厂商从来不在包装上做手脚，这种虚标的就是不入流。',
  '说得过去的领导不会把锅甩给下属，他这次就是没担当。',
  // 家族 A · 商业角色 EN
  'A real supplier never raises prices mid-contract.',
  'A dependable contractor never misses the agreed deadline.',
  'Trustworthy franchisees do not deviate from the operating manual.',
  // 家族 B · 新 authenticity 标记 EN
  'A dependable friend never lets you down when it matters.',
  'A trustworthy employee would never leak internal documents.',
  'Stand-up colleagues do not rat out their teammates.',
  // 家族 C · 经典英文裸否认形（句首大写 No + 无其他否定词）
  'No true fan leaves after one bad season.',
  'No true artist copies references.',
  'No real programmer uses an IDE.',
  'No true vendor would hide its supply chain from customers.',
];
t('攻击-三家族全命中（模块层）', () => {
  for (const s of A_ATTACK) assert.ok(hit(s), '漏判: ' + s);
});
t('攻击-gate 层归因 no_true_scotsman', () => {
  for (const s of A_ATTACK) {
    const r = gate.checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const dims = (r.findings || []).map((f) => f.dimension);
    assert.ok(dims.includes('no_true_scotsman'), '未归因 no_true_scotsman: ' + s + ' -> ' + dims.join(','));
  }
});

// ── 2. 良性集（新元素单腿/无驱逐断言/豁免形）─────────────────────
const BENIGN = [
  // 商业角色在场但无驱逐断言（单腿不判）
  '真正的供应商需要具备完整的资质文件，这是准入的前提。',
  '合格的渠道商应该遵守区域政策，违约会被取消授权资格。',
  '靠谱的服务商会主动同步进度，让我们很省心。',
  '这位客户经理很称职，帮我们争取到了额外账期。',
  'Suppliers must certify their components before shipping to us.',
  'A trustworthy contractor should flag schedule risks early.',
  'Trustworthy vendors publish their audit reports every year.',
  // 新标记在场但无驱逐断言
  '靠得住的朋友会在你需要的时候出现，我很珍惜这种关系。',
  '信得过的队友主动分担了收尾工作，项目才按时上线。',
  'A dependable friend checks in on you during tough times.',
  'Reliable employees escalate problems before they blow up.',
  // 经典形无 auth 腿（角色名词缺席）
  'No true consensus exists on the cause of the anomaly.',
];
t('良性-模块层全零命中', () => {
  for (const s of BENIGN) assert.ok(!hit(s), '误伤: ' + s);
});
t('良性-gate 层不归因 no_true_scotsman', () => {
  for (const s of BENIGN) {
    const r = gate.checkOutput(s);
    if (r.gate.action !== 'pass') {
      const dims = (r.findings || []).map((f) => f.dimension);
      assert.ok(!dims.includes('no_true_scotsman'),
        'no_true_scotsman 误伤: ' + s + ' -> ' + r.gate.action + ' / ' + dims.join(','));
    }
  }
});

// ── 3. 边界锁：存量豁免对新元素仍生效────────────────────────────
t('边界-META 概念转述豁免（含新元素）', () => {
  assert.ok(!hit('这是无真正的苏格兰人谬误：先把「真正的供应商」立起来再开除反例'), '概念转述不应判');
});
t('边界-DEFINITION 定义先行豁免', () => {
  assert.ok(!hit('先定义「靠谱的服务商」指什么，再讨论他算不算'), '定义先行不应判');
});
t('边界-HEDGE 对冲豁免', () => {
  assert.ok(!hit('真正的供应商也许不会催款，但也未必准时交货'), '对冲不应判');
});
t('边界-单腿不判：只有 exclusion 无 auth', () => {
  assert.ok(!hit('他不会拖延工期，因为团队一向高效'), '只有驱逐断言不应判');
});

// ── 4. 负例：注入-删条（删掉本轮每个新模式，守卫须翻 miss）────────
// 旧版常量按当前源码字符串手术复原（同 r278 先例）。
const I = ntsMod.__internals;
const dropAlt = (re, alt) => {
  let s = re.source;
  if (s.indexOf('|' + alt) !== -1) s = s.replace('|' + alt, '');
  else if (s.indexOf(alt + '|') !== -1) s = s.replace(alt + '|', '');
  else s = s.replace(alt, '');
  return new RegExp(s, re.flags);
};
// AUTH_CN_ROLE_RE 旧版：删商业角色组 / 删新标记组
const AUTH_CN_NO_COMMERCIAL = new RegExp(
  I.AUTH_CN_ROLE_RE.source
    .replace('|供应商|厂商|厂家|渠道商|经销商|代理商|服务商|外包|合伙人|客户', ''),
  I.AUTH_CN_ROLE_RE.flags);
const AUTH_CN_NO_NEWMARKS = new RegExp(
  I.AUTH_CN_ROLE_RE.source
    .replace('|靠得住|信得过|入流|上路子|说得过去|讲规矩', ''),
  I.AUTH_CN_ROLE_RE.flags);
// AUTH_EN_ROLE_RE 旧版：删商业角色组 / 删新标记组
const AUTH_EN_NO_COMMERCIAL = new RegExp(
  I.AUTH_EN_ROLE_RE.source
    .replace('|supplier|suppliers|vendor|vendors|contractor|contractors|franchisee|franchisees|dealer|dealers|client|clients|customer|customers|distributor|distributors|manufacturer|manufacturers|consultant|consultants', ''),
  I.AUTH_EN_ROLE_RE.flags);
const AUTH_EN_NO_NEWMARKS = new RegExp(
  I.AUTH_EN_ROLE_RE.source
    .replace('|dependable|trustworthy|reliable|stand-up|loyal|faithful', ''),
  I.AUTH_EN_ROLE_RE.flags);
// EXCLUSION_EN_RE 旧版：删 no true / 去 'i' 标志（大小写修复承重证）
const EXCL_EN_NO_TRUE = dropAlt(I.EXCLUSION_EN_RE, 'no true');
const EXCL_EN_CASE_SENSITIVE = new RegExp(I.EXCLUSION_EN_RE.source, 'g');

const INJ = [
  // 家族 A · CN 商业角色组（整组删）
  { label: 'AUTH_CN_ROLE_RE 商业角色组', text: '真正的供应商从来不会坐地起价。', inject: { AUTH_CN_ROLE_RE: AUTH_CN_NO_COMMERCIAL } },
  { label: 'AUTH_CN_ROLE_RE 渠道商（单元素）', text: '合格的渠道商不会窜货。', inject: { AUTH_CN_ROLE_RE: dropAlt(I.AUTH_CN_ROLE_RE, '渠道商') } },
  { label: 'AUTH_CN_ROLE_RE 服务商（单元素）', text: '靠得住的服务商不会拖延工期。', inject: { AUTH_CN_ROLE_RE: dropAlt(I.AUTH_CN_ROLE_RE, '服务商') } },
  // 家族 B · CN 新标记组（整组删）+ 单元素
  { label: 'AUTH_CN_ROLE_RE 新标记组', text: '靠得住的朋友绝不会掉链子。', inject: { AUTH_CN_ROLE_RE: AUTH_CN_NO_NEWMARKS } },
  { label: 'AUTH_CN_ROLE_RE 入流（单元素）', text: '入流的厂商从来不在包装上做手脚。', inject: { AUTH_CN_ROLE_RE: dropAlt(I.AUTH_CN_ROLE_RE, '入流') } },
  { label: 'AUTH_CN_ROLE_RE 讲规矩（单元素）', text: '讲规矩的代理商不会跨区抛货。', inject: { AUTH_CN_ROLE_RE: dropAlt(I.AUTH_CN_ROLE_RE, '讲规矩') } },
  // 家族 A · EN 商业角色组 + 单元素
  { label: 'AUTH_EN_ROLE_RE 商业角色组', text: 'A real supplier never raises prices mid-contract.', inject: { AUTH_EN_ROLE_RE: AUTH_EN_NO_COMMERCIAL } },
  { label: 'AUTH_EN_ROLE_RE franchisees（单元素）', text: 'Trustworthy franchisees do not deviate from the manual.', inject: { AUTH_EN_ROLE_RE: dropAlt(I.AUTH_EN_ROLE_RE, 'franchisees') } },
  // 家族 B · EN 新标记组 + 单元素
  { label: 'AUTH_EN_ROLE_RE 新标记组', text: 'A dependable friend never lets you down.', inject: { AUTH_EN_ROLE_RE: AUTH_EN_NO_NEWMARKS } },
  { label: 'AUTH_EN_ROLE_RE trustworthy（单元素）', text: 'A trustworthy employee would never leak documents.', inject: { AUTH_EN_ROLE_RE: dropAlt(I.AUTH_EN_ROLE_RE, 'trustworthy') } },
  // 家族 C · no true 腿 + 大小写标志修复
  { label: 'EXCLUSION_EN_RE 删 no true', text: 'No true fan leaves after one bad season.', inject: { EXCLUSION_EN_RE: EXCL_EN_NO_TRUE } },
  { label: "EXCLUSION_EN_RE 去 'i' 标志（句首大写承重）", text: 'No true fan leaves after one bad season.', inject: { EXCLUSION_EN_RE: EXCL_EN_CASE_SENSITIVE } },
];
t('负例注入-全部翻转（守卫变红）', () => {
  for (const c of INJ) {
    assert.ok(hit(c.text), '注入前基线应命中: ' + c.label);
    assert.ok(!hit(c.text, c.inject), '删条后未翻转: ' + c.label + ' | ' + c.text);
  }
});

// ── 5. 存量回归：r728/r278 历史攻击仍判──────────────────────────
t('存量回归-r728 历史攻击仍命中', () => {
  for (const s of [
    '真正爱你的男人，不会计较你花多少钱',
    '真正的专家不会犯这种低级错误',
    '真爱一个人就不会计较得失',
    '真兄弟不会计较这些，计较就不是真兄弟',
    'He is not a true fan if he criticizes the team.',
    'A truly loving partner would never keep score.',
    'If she were a real friend, she would have shown up.',
  ]) assert.ok(hit(s), 'r728 回归翻转: ' + s);
});
t('存量回归-r278 历史攻击仍命中', () => {
  for (const s of [
    '真正的高手，从来不向资本低头。',
    '铁粉从来不会只买一张票。',
    '有骨气的作者不会迎合流量。',
    '老玩家从来不充一分钱。',
    'A real gamer would never pay for skins.',
    'A legit foodie never eats at chain restaurants.',
    'Real programmers do not use IDEs.',
  ]) assert.ok(hit(s), 'r278 回归翻转: ' + s);
});
t('存量回归-良性豁免未破', () => {
  for (const s of [
    '他把所有反例都重新定义排除掉了，这是无真正的苏格兰人谬误',
    '他自称真正的专家，但从来解决不了实际问题，也拿不出依据',
    '真正的粉丝也许不会第一时间买，但长期支持更重要',
  ]) assert.ok(!hit(s), '存量豁免被破: ' + s);
});

// ── 6. 登记断言（inject 钩子 + 常量扩容）────────────────────────
t('登记-inject 钩子两参数', () => {
  assert.strictEqual(ntsMod.checkNoTrueScotsman.length, 2, 'checkNoTrueScotsman 应带 inject 钩子');
});
t('登记-角色名词表扩容', () => {
  assert.ok(I.ROLE_NOUNS_CN.split('|').length >= 100, 'ROLE_NOUNS_CN 应 ≥100: got ' + I.ROLE_NOUNS_CN.split('|').length);
  assert.ok(I.ROLE_NOUNS_EN.split('|').length > 120, 'ROLE_NOUNS_EN 应 >120: got ' + I.ROLE_NOUNS_EN.split('|').length);
  assert.ok(I.ROLE_NOUNS_CN.includes('供应商') && I.ROLE_NOUNS_CN.includes('渠道商'), 'CN 商业角色未登记');
  assert.ok(I.ROLE_NOUNS_EN.includes('franchisee') && I.ROLE_NOUNS_EN.includes('contractor'), 'EN 商业角色未登记');
});

console.log('== r337 no_true_scotsman 三新家族轮测试 ==');
if (fails.length) {
  console.log('结果: ' + pass + ' 通过, ' + fails.length + ' 失败');
  for (const f of fails) console.log('  ❌ ' + f);
  process.exit(1);
} else {
  console.log('结果: ' + pass + ' 通过, 0 失败');
}
// cleanup: none (pure in-memory checks, no temp files)
