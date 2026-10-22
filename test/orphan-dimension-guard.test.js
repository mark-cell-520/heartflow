/**
 * 测试：断链维度守卫（v6.7.84，心虫 decision.decide 0.93）
 *
 * 来源：第 30 轮心虫选「系统性扫描断链维度」（0.93），因为第 29 轮
 * 偶然发现 checkIndirectInjection 断链，怀疑不止一个。
 *
 * 一、最终结论：50/50 全部接入，0 断链
 *    （indirect_injection 上一轮已修）
 *
 * 二、但扫描器本身错了两次，这是本轮最大的收获
 *
 *    第一版：/\n\}\n/ 正则找函数结尾 → 只提取到 1532 字符
 *      （实际 24350）→ 报告"50 个全断链"——荒谬结论。
 *      checkVagueness/checkSycophancy 明明活着（第 23 轮验证过）。
 *      **如果直接信了这个数字，会去修 50 个根本没坏的维度。**
 *
 *    第二版：括号配对修好 → 24350 字符 → 报告"7 个断链"
 *      （hate_speech/prompt_injection/gaslighting 等）
 *      但这 7 个全是 gate 的支柱维度。真相是它们通过**别名包装**接入：
 *        const hs = _dual(checkHateSpeech, "hate_speech");
 *      扫描器只认 `checkXxx(` 直接调用形式，漏了别名形式。
 *
 *    第三版（本版）：两种形式都认 → 50/50 接入，0 断链。
 *
 *    教训固化：**诊断工具的输出在修好它自己之前不可信**。
 *    这与第 21/22 轮的维度面板、第 26 轮的 lang-coverage 是同一模式：
 *      第 21 轮：面板报 22 BROKEN → 实测 0 个真失效
 *      第 22 轮：面板口径修到 3 BROKEN → 仍全是口径问题
 *      第 26 轮：leet 括号 bug 是**引擎**真 bug（唯一一次工具对了）
 *      第 30 轮：扫描器报 50 → 7 → 0，全是扫描器自己的 bug
 *
 * 三、守卫价值
 *    现在 discriminate() 每加一个 checkXxx 都自动接入检测。
 *    未来若有人写了 checkXxx 忘记接线，本测试立刻失败——
 *    这正是第 29 轮花一整轮才发现的问题类型。
 */
const path = require('path');
const fs = require('fs');
const assert = require('assert');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

console.log('\n[提取 discriminate 函数体]');

/** 括号配对提取（不用正则——见文件头教训） */
function extractFnBody(sig) {
  const start = src.indexOf(sig);
  assert.ok(start >= 0, `找不到 ${sig}`);
  const braceStart = src.indexOf('{', start);
  let depth = 0;
  for (let i = braceStart; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error('未找到函数体结尾');
}

const body = extractFnBody('function discriminate(text, evidence');

t('函数体完整提取（> 10000 字符，第一版只有 1532）', () => {
  assert.ok(body.length > 10000,
    `只提取到 ${body.length} 字符——括号配对又坏了？`);
});

console.log('\n[所有 checkXxx 必须接入主链路]');

const checkFns = [];
const re = /^function (check[A-Z]\w*)\s*\(/gm;
let m;
while ((m = re.exec(src)) !== null) checkFns.push(m[1]);
checkFns.sort();

t(`check 函数数 = 50`, () => {
  assert.strictEqual(checkFns.length, 50,
    `check 函数数变成 ${checkFns.length}——新增/删除维度时同步更新本测试`);
});

const orphans = [];
for (const fn of checkFns) {
  const direct = (body.match(new RegExp(`\\b${fn}\\s*\\(`, 'g')) || []).length;
  const aliased = (body.match(new RegExp(`\\b${fn}\\s*[,)]`), 'g') || []).length;
  if (direct + aliased === 0) orphans.push(fn);
}

t('0 个断链维度', () => {
  assert.strictEqual(orphans.length, 0,
    `断链: ${orphans.join(', ')}。写了新 checkXxx 但 discriminate() 没调用它——` +
    `这就是第 29 轮 checkIndirectInjection 花一整轮才发现的模式。`);
});

console.log('\n[已知接入形式必须被识别（防回归）]');

t('别名包装形式算接入', () => {
  // const hs = _dual(checkHateSpeech, "hate_speech")
  const aliasBody = 'const hs = _dual(checkHateSpeech, "hate_speech");';
  const direct = (aliasBody.match(/\bcheckHateSpeech\s*\(/g) || []).length;
  const aliased = (aliasBody.match(/\bcheckHateSpeech\s*[,)]/g) || []).length;
  assert.strictEqual(direct, 0, '该样本不该有直接调用');
  assert.ok(aliased > 0, '别名形式未被识别');
});

console.log('\n[indirect_injection 已修复（第 29 轮）]');

t('checkIndirectInjection 在 discriminate 中被调用', () => {
  const n = (body.match(/\bcheckIndirectInjection\s*\(/g) || []).length;
  assert.ok(n > 0, 'checkIndirectInjection 又断链了');
});

t('indirect_injection 在 BLOCK_DIMS', () => {
  const blockMatch = src.match(/const BLOCK_DIMS = new Set\(\[([\s\S]*?)\]\)/);
  assert.ok(blockMatch, '找不到 BLOCK_DIMS');
  assert.ok(blockMatch[1].includes('indirect_injection'),
    'indirect_injection 不在 BLOCK_DIMS——维度判定结果不会变成拦截');
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
