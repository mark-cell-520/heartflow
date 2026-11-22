/**
 * test/chinese-tokenizer.test.js
 *
 * ChineseTokenizer（src/core/chinese-tokenizer.js）守护测试。
 * 立项来源：SelfScanner 未测试模块清单（r278 全局修复轮后复扫）。
 * 该模块是联想理解链（L1-L5）的中文分词前提：LexicalAssociator 用
 * tokenize()（词级）、ChunkDetector 用 tokenizeChars()（字级），
 * 此前只有 scripts/round-540-tokenizer-check.js 一次性探针，无守护。
 *
 * 覆盖六节：
 *   A 构造与词表加载（惰性/注入/坏根/单例）
 *   B tokenize 词级切分（空值/英文/中文/最长匹配/别名/混排）
 *   C tokenizeChars 字级切分（成语还原契约/英文整词/标点）
 *   D 标点契约（全角标点必须作分隔符——本轮抓出的真 bug 族）
 *   E 边界与回归（短文本/超长注入词/stats 字段/幂等）
 *
 * 已知现状锁（非 bug，设计选择，锁防漂移）：
 *   - 全角字母数字（Ａ-Ｚ０-９）在全角标点区间 \uff01-\uff5e 内，
 *     与 ASCII 数字待遇不同：「接口123」保留 123，「接口１２３」吃掉。
 *     模块头将全角形态归入标点，属既定设计。
 */
'use strict';

const path = require('path');
const assert = require('assert');

const REPO = path.resolve(__dirname, '..');
const mod = require(path.join(REPO, 'src/core/chinese-tokenizer.js'));
const { ChineseTokenizer, getShared } = mod;

let pass = 0, fail = 0;
const failures = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fail++; failures.push(name + ' :: ' + (e && e.message)); }
}

// ─── A 节：构造与词表加载 ─────────────────────────────────────────
t('A1 默认惰性构造：built=false，首次 tokenize 后加载真实词表', () => {
  const tk = new ChineseTokenizer(REPO);
  assert.strictEqual(tk.built, false, 'lazy 构造不应立即读盘');
  const tokens = tk.tokenize('守株待兔是不劳而获');
  assert.strictEqual(tk.built, true, 'tokenize 后应触发加载');
  const stats = tk.getStats();
  assert.ok(stats.dictionarySize > 1000, '真实词表应 >1000 词，实际: ' + stats.dictionarySize);
  assert.deepStrictEqual(stats.loadErrors, [], '词表文件应全部可读: ' + JSON.stringify(stats.loadErrors));
  assert.ok(tokens.length >= 2, '成语应命中词表: ' + JSON.stringify(tokens));
});

t('A2 注入词表：跳过读盘，桶按长度降序', () => {
  const tk = new ChineseTokenizer(REPO, { dictionary: new Set(['机器学习', '模型', '中国']) });
  assert.strictEqual(tk.built, true, '注入后应立即 built');
  const stats = tk.getStats();
  assert.strictEqual(stats.dictionarySize, 3);
  assert.deepStrictEqual(stats.bucketLengths, [4, 2], '桶长降序: ' + JSON.stringify(stats.bucketLengths));
  assert.strictEqual(stats.maxWordLen, 8, '默认 maxWordLen=8');
  assert.deepStrictEqual(stats.loadErrors, []);
});

t('A3 坏项目根：loadErrors 记三条 missing，分词回落单字', () => {
  const tk = new ChineseTokenizer(path.join(REPO, 'definitely', 'not', 'a', 'root'));
  const stats = tk.getStats();
  assert.strictEqual(stats.dictionarySize, 0, '坏根词表应为空');
  assert.strictEqual(stats.loadErrors.length, 3, '三个数据文件都应记 missing: ' + JSON.stringify(stats.loadErrors));
  for (const e of stats.loadErrors) assert.strictEqual(e.reason, 'missing');
  assert.deepStrictEqual(tk.tokenize('你好世界'), ['你', '好', '世', '界'], '无词表回落单字');
});

t('A4 getShared 单例：重复调用同一实例', () => {
  const a = getShared(REPO);
  const b = getShared(REPO);
  assert.strictEqual(a, b, '模块级共享实例必须唯一');
  assert.ok(a.getStats().dictionarySize > 1000, '共享实例应已加载真实词表');
});

// ─── B 节：tokenize 词级切分 ──────────────────────────────────────
t('B1 空值族：空串/null/非字符串 → []', () => {
  const tk = new ChineseTokenizer(REPO, { dictionary: new Set(['测试']) });
  assert.deepStrictEqual(tk.tokenize(''), []);
  assert.deepStrictEqual(tk.tokenize(null), []);
  assert.deepStrictEqual(tk.tokenize(undefined), []);
  assert.deepStrictEqual(tk.tokenize(12345), []);
  assert.deepStrictEqual(tk.tokenize({}), []);
});

t('B2 纯英文按空白切分且保留原形', () => {
  const tk = new ChineseTokenizer(REPO, { dictionary: new Set(['测试']) });
  assert.deepStrictEqual(tk.tokenize('hello world'), ['hello', 'world']);
  assert.deepStrictEqual(tk.tokenize('Hello, World!'), ['Hello', 'World']);
  assert.deepStrictEqual(tk.tokenize('   '), [], '纯空白无 token');
});

t('B3 无词表中文 → 单字序列（成语检测依赖字序列，不能丢字）', () => {
  const tk = new ChineseTokenizer(REPO, { dictionary: new Set() });
  assert.deepStrictEqual(tk.tokenize('压力很大'), ['压', '力', '很', '大']);
});

t('B4 注入词表正向最长匹配（含竞争词与边界）', () => {
  const tk = new ChineseTokenizer(REPO, { dictionary: new Set(['机器学习', '深度学习', '模型', '中国', '中国人民']) });
  assert.deepStrictEqual(
    tk.tokenize('我们用深度学习训练一个机器学习模型'),
    ['我', '们', '用', '深度学习', '训', '练', '一', '个', '机器学习', '模型'],
  );
  assert.deepStrictEqual(tk.tokenize('中国人民'), ['中国人民'], '最长词优先');
  assert.deepStrictEqual(tk.tokenize('中国'), ['中国']);
});

t('B5 segment 与 tokenize 同义', () => {
  const tk = new ChineseTokenizer(REPO, { dictionary: new Set(['机器学习', '模型']) });
  const a = tk.tokenize('训练机器学习模型');
  const b = tk.segment('训练机器学习模型');
  assert.deepStrictEqual(a, b, 'alias 必须同义');
});

t('B6 中英混排：CJK↔非 CJK 边界强制切开', () => {
  const tk = new ChineseTokenizer(REPO, { dictionary: new Set(['接口', '需要']) });
  assert.deepStrictEqual(tk.tokenize('API接口需要重构'), ['API', '接口', '需要', '重', '构']);
  assert.deepStrictEqual(tk.tokenize('接口123'), ['接口', '123'], 'ASCII 数字整词保留');
});

// ─── C 节：tokenizeChars 字级切分 ─────────────────────────────────
t('C1 中文 → 单字序列', () => {
  const tk = new ChineseTokenizer(REPO, { dictionary: new Set(['机器学习']) });
  assert.deepStrictEqual(tk.tokenizeChars('你好世界'), ['你', '好', '世', '界']);
});

t('C2 英文/数字整词保留', () => {
  const tk = new ChineseTokenizer(REPO, { dictionary: new Set(['测试']) });
  assert.deepStrictEqual(tk.tokenizeChars('API接口'), ['API', '接', '口']);
  assert.deepStrictEqual(tk.tokenizeChars('接口123'), ['接', '口', '123']);
  assert.deepStrictEqual(tk.tokenizeChars('hello world'), ['hello', 'world']);
});

t('C3 成语还原契约：连续 4 字可 slice join 精确还原（ChunkDetector 前提）', () => {
  const tk = new ChineseTokenizer(REPO); // 真实词库含 idiom-story-db
  const words = tk.tokenizeChars('守株待兔是不劳而获');
  assert.ok(words.length >= 4, '字序列长度应 >=4: ' + JSON.stringify(words));
  assert.strictEqual(words.slice(0, 4).join(''), '守株待兔', '前 4 字须精确还原成语');
});

t('C4 中文标点在位时正确剥离（对照组）', () => {
  const tk = new ChineseTokenizer(REPO, { dictionary: new Set() });
  assert.deepStrictEqual(tk.tokenizeChars('你好，世界'), ['你', '好', '世', '界']);
  assert.deepStrictEqual(tk.tokenize('你好，世界'), ['你', '好', '世', '界']);
});

// ─── D 节：标点契约（全角标点必须作分隔符）────────────────────────
// 模块头成文契约：「中文标点视作分隔符（与原『标点即分隔』契约一致）」。
// 该契约此前只对「含 CJK 的片段」成立；非 CJK 片段被整段 push，
// 导致纯标点串成为 token、全角标点粘在英文词上。
t('D1 纯中文标点串 → 无 token', () => {
  const tk = new ChineseTokenizer(REPO, { dictionary: new Set(['测试']) });
  assert.deepStrictEqual(tk.tokenize('，，。！！'), [], '纯全角标点不应产出 token');
  assert.deepStrictEqual(tk.tokenize('。。。'), []);
  assert.deepStrictEqual(tk.tokenize('！'), []);
  assert.deepStrictEqual(tk.tokenizeChars('，，。！！'), [], 'tokenizeChars 同契约');
});

t('D2 全角标点夹英文 → 两侧都剥出整词', () => {
  const tk = new ChineseTokenizer(REPO, { dictionary: new Set(['测试']) });
  assert.deepStrictEqual(tk.tokenize('hello，world'), ['hello', 'world'], '全角逗号须作分隔符');
  assert.deepStrictEqual(tk.tokenize('abc…def'), ['abc', 'def'], '省略号须作分隔符');
  assert.deepStrictEqual(tk.tokenizeChars('hello，world'), ['hello', 'world'], 'tokenizeChars 同契约');
});

t('D3 注入词表模式同契约（证明与数据无关，是逻辑缺陷）', () => {
  const tk = new ChineseTokenizer(REPO, { dictionary: new Set(['机器学习', '模型']) });
  assert.deepStrictEqual(tk.tokenize('，，。！！'), []);
  assert.deepStrictEqual(tk.tokenize('hello，world'), ['hello', 'world']);
});

t('D4 全角数字按既定设计作分隔符（现状锁，非 bug）', () => {
  const tk = new ChineseTokenizer(REPO, { dictionary: new Set(['接口']) });
  // 全角数字落在全角标点区间 \uff01-\uff5e，模块头归入标点——与 ASCII 数字
  // 待遇不同是既定设计，此处锁定防无意漂移。
  assert.deepStrictEqual(tk.tokenize('接口１２３'), ['接口']);
});

// ─── E 节：边界与回归 ─────────────────────────────────────────────
t('E1 单字符与超短文本', () => {
  const tk = new ChineseTokenizer(REPO, { dictionary: new Set(['中']) });
  assert.deepStrictEqual(tk.tokenize('中'), ['中'], '单字输入回退单字');
  assert.deepStrictEqual(tk.tokenize('a'), ['a']);
});

t('E2 注入词表不过滤超长词（maxWordLen 只作用于读盘路径）', () => {
  const tk = new ChineseTokenizer(REPO, { dictionary: new Set(['一二三四五六七八九', '短词']) });
  assert.deepStrictEqual(tk.tokenize('一二三四五六七八九短词'), ['一二三四五六七八九', '短词']);
});

t('E3 getStats 字段齐全', () => {
  const tk = new ChineseTokenizer(REPO, { dictionary: new Set(['机器学习', '模型']) });
  const s = tk.getStats();
  for (const k of ['dictionarySize', 'bucketCount', 'bucketLengths', 'maxWordLen', 'loadErrors']) {
    assert.ok(Object.prototype.hasOwnProperty.call(s, k), 'getStats 缺字段: ' + k);
  }
});

t('E4 幂等：同输入两次切分结果一致', () => {
  const tk = new ChineseTokenizer(REPO, { dictionary: new Set(['机器学习', '模型', '中国']) });
  const s = '我们用机器学习模型，中国';
  assert.deepStrictEqual(tk.tokenize(s), tk.tokenize(s), 'tokenize 须幂等');
  assert.deepStrictEqual(tk.tokenizeChars(s), tk.tokenizeChars(s), 'tokenizeChars 须幂等');
});

// ─── 汇总 ─────────────────────────────────────────────────────────
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
if (fail > 0) {
  console.log('失败明细:');
  failures.forEach(f => console.log('  - ' + f));
  process.exit(1);
}
