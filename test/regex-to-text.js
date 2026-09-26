/**
 * 共享：正则 → 字面量测试文本（v6.7.82）
 *
 * 为什么单独一个文件：
 *   test/dimension-coverage-benchmark.js 有一个能用的 toText()，
 *   scripts/dimension-health.js 有一个不能用的 regexesToTexts()。
 *   前者会给字符类填值（`[^。]`→"都喜欢"），后者直接删掉字符类
 *   —— 导致依赖字符类的模式生成的文本残缺：
 *     `您说得完全对，[^，]*您太聪明了` → 「您说得完全对，宝」
 *   面板因此把 sycophancy/pseudoProfundity/softDeflection 报成 BROKEN，
 *   而这 3 个维度第 23 轮已验证全部活着。
 *
 *   同一份逻辑写两遍必然漂移（第 22 轮修过一次，面板没跟上）。
 *   抽成共享模块，两处都 require。
 */

/**
 * 正则字面量 → 可用于测试的纯文本
 * @param {string} re 形如 `/foo[^。]?bar/gi`
 * @returns {string} 形如 `foobar`
 */
function toText(re) {
  let s = String(re).replace(/^\//, '').replace(/\/[gimsuy]*$/, '');
  // ⓪ [第 89 轮] 可选组整组丢弃（`(?:x)?` / `(x)?`），必须在字符类填值**之前**。
  // 为什么：v1 把可选组当成常规组「取第一分支填字面量」，于是
  //   `(?:了)?` → 「了」、`(?:\.\d+)?` → 「.5」、`\d+(?:\s*分之\s*x)?` → 「5 分之x」
  // 反推文本比原模式**要求得更多**——原 Pattern 不要求这些字符出现，
  // 填进去反而让文本必然不匹配 → 面板误报 BROKEN。
  // 实测（第 89 轮）：pseudoCausal 的两条中文判据正是死在这里。
  //   PSEUDO_CAUSAL_ZH[1] v1 反推「下降s了s(:d d xs分之sx)s倍」不命中，
  //   丢弃可选组后得到「下降  5 倍」→ 命中。
  // 全 50 维度 A/B 对照：修复 1 个、倒退 0 个（见 r89-v2b 试错记录）。
  // ⚠️ 只处理**无嵌套括号**的可选组；嵌套形状（`(?:a(?:b)?)?`）不猜，按原样
  //    交给后续步骤，宁可不命中也不要产出错误的「必含」文本。
  s = s.replace(/\((\?:)?([^()]*)\)\?/g, '');
  // ① 字符类填值（不能只删——`[^。]` 删掉后剩下的字面量必然不匹配原模式）
  s = s.replace(/\[[^\]]*\]/g, m => {
    if (m.includes('。') || m.includes('，')) return '都喜欢';
    if (/[0-9]/.test(m)) return '5';
    return 'x';
  });
  // ①b 转义类别先转占位符，再删量词。
  // 顺序要紧：若先删 `\\[bBsSdDwW]`，`\d+` 会变 `+` 再被删 → 整段消失
  // （实测 `/准确率\s*(?:提高)\s*\d+/` 只剩「准确率提高」，数字全丢）。
  s = s
    .replace(/\\d\+?/g, '5')
    .replace(/\\w\+?/g, 'x')
    .replace(/\\s\+?/g, ' ')
    .replace(/\\[bBsSdDwW]/g, '');
  // ② 非捕获组/捕获组取第一个分支
  s = s.replace(/\(([^()]*)\)/g, (m, inner) => {
    const first = inner.split('|').filter(Boolean)[0] || '';
    return first.replace(/\?:/g, '');
  });
  // ③ 去掉剩余元字符
  s = s.replace(/[+*?]/g, '');
  s = s.replace(/[\\^$.{}|]/g, ' ').trim();
  return s;
}

/** 批量转换并过滤太短的结果 */
function toTexts(regexes) {
  const out = [];
  for (const r of regexes || []) {
    const t = toText(r).slice(0, 40);
    if (t.length >= 2) out.push(t);
  }
  return out;
}

module.exports = { toText, toTexts };
