'use strict';
/**
 * r254：framing-effect 同指异名族 双锚 + 极性配对 增强的回归测试。
 *
 * 覆盖三类真实漏判（r254 探针实测）：
 *   1. 双锚结构——「说X…，说Y…」两个连接各引一侧标签（原单锚逻辑整族漏判）
 *   2. 裸名词形态——EUPHEMISM_ZH / SYNONYM_LINK_ZH 缺裸「说」「调整」
 *   3. 极性配对反转——单响应词场景下按极性贴标签，替代纯距离差判据
 *
 * 同时固化良性边界：同义说明、纯工程调整、正常涨价描述不得命中。
 */
const test = require('node:test');
const assert = require('node:assert');
const { detectFramingEffect } = require('../src/framing-effect.js');

/** 攻击变体：同族 ≥5 变体（倒装 / 带修饰 / 长句 / 单响应词 / 双锚） */
const ATTACK = [
  // 双锚：两个「说」各引一侧标签（r254 新增承重结构）
  ['双锚-说调整说降薪', '说调整大家理解，说降薪大家就罢工'],
  ['双锚-叫优化叫解雇', '叫人员优化没人反对，叫解雇立刻就炸了'],
  // 单响应词 + 极性配对
  ['单响应-倒装', '工资不叫降薪，叫结构调整，于是没人闹了'],
  ['单响应-顾客一听就炸', '这叫价格调整，说白了就是涨价，顾客一听就炸了'],
  // 带修饰 + 长句（响应词为极性响应：叫好 vs 炸锅）
  ['长句-修饰', '公司把同一批人的离职，在内部叫人员优化，对外叫裁员，内部叫好一片，对外炸锅了'],
  ['极性两极齐备', '同样的裁员，叫人员优化大家就叫好，叫裁员大家就一哄而散'],
];

/** 良性样本：必须含该族边缘良性 */
const BENIGN = [
  // 边缘良性：同义说明/术语澄清，不拿叫法驱动决策
  ['同义说明', '人员优化说白了就是裁员，没什么区别'],
  // 边缘良性：中性并列陈述两种叫法
  ['中性并列', '公司裁员了，也进行了人员优化'],
  // 正常业务描述，无标签×响应配对
  ['正常业务描述', '公司进行了人员优化，效率提升了不少'],
  // 纯工程调整，无同指异名对
  ['工程排期', '项目计划需要调整，下周重新排期'],
  // 正常涨价抱怨，无框架操纵
  ['正常涨价描述', '商品价格上涨了，顾客有点不满'],
];

test('r254 同指异名族：攻击变体全部命中', () => {
  for (const [name, text] of ATTACK) {
    const r = detectFramingEffect(text);
    assert.strictEqual(r.hit, true, `攻击变体未命中: ${name} => ${text}`);
    assert.ok(r.score >= 0.5, `${name} score 过低: ${r.score}`);
  }
});

test('r254 同指异名族：良性样本全部放行', () => {
  for (const [name, text] of BENIGN) {
    const r = detectFramingEffect(text);
    assert.strictEqual(r.hit, false, `良性样本被误判: ${name} => ${text} (score=${r.score})`);
  }
});

test('r254 双锚结构：单锚不可达时双锚接管', () => {
  // 句中两个不同连接各自贴近一侧标签，单锚（同一 link 同时贴近两侧）不成立
  const text = '说调整大家理解，说降薪大家就罢工';
  const r = detectFramingEffect(text);
  assert.strictEqual(r.hit, true);
  assert.match(r.details, /同指异名|框架效应|等价/);
});

test('r254 极性配对：单响应词 + neg 贴近 plain 侧即命中', () => {
  // 「闹」距 eHit=5、距 pHit=11，纯距离差判据失效；极性配对判据成立
  const text = '工资不叫降薪，叫结构调整，于是没人闹了';
  const r = detectFramingEffect(text);
  assert.strictEqual(r.hit, true, '极性配对判据未接管');
});

test('r254 非字符串/短文本输入安全', () => {
  assert.strictEqual(detectFramingEffect('').hit, false);
  assert.strictEqual(detectFramingEffect(null).hit, false);
  assert.strictEqual(detectFramingEffect(undefined).hit, false);
  assert.strictEqual(detectFramingEffect('短').hit, false);
});
