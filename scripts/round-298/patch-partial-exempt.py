import io

path = '/root/hermes1/skills/ai/mark-heartflow-skill/src/ad-hominem.js'
src = io.open(path, encoding='utf-8').read()

BS = chr(92)

anchor = "const SELF_DEPRECATION_EXEMPT = "
assert src.count(anchor) == 1

exempt = (
  "// [r298] 局部否定豁免（PARTIAL_CRITIQUE_EXEMPT）——正当批评与人身攻击的界线：\n"
  "// 「Your analysis is wrong on point three, but the overall approach is sound.」\n"
  "// 是局部否定+整体肯定的正当批评，不是因人废言。r298 c5 补腿实测误伤 5/5\n"
  "// （见 scripts/round-298/r298-c5-fp-probe.js），故新增本护栏。\n"
  "// 判据：局部限定语（on point N / in one respect / in part / on the second\n"
  "// point / here / in this section）与整体肯定/转折标志（but / however /\n"
  "// though / overall / the rest / otherwise / nonetheless）**共现**才豁免——\n"
  "// 单有局部限定无转折（整体作废句可能恰好含 here）不放行。\n"
  "const PARTIAL_CRITIQUE_EXEMPT = /(?:" + BS + "b(?:on|in|at)" + BS + "s+(?:the" + BS + "s+)?(?:point|aspect|respect|detail|section|part|step|claim|area)s?" + BS + "b" + "|" + BS + "bin" + BS + "s+(?:one|this|that|a)" + BS + "s+(?:respect|aspect|area|detail|particular)" + BS + "b" + "|" + BS + "bhere" + BS + "b" + "|" + BS + "bin" + BS + "s+part" + BS + "b" + "|" + BS + "bpartially" + BS + "b" + "|" + BS + "bminor" + BS + "s+(?:point|issue|quibble|detail)" + BS + "b)[^.?!]{0,120}?(?:" + BS + "b(?:but|however|though|although|yet|nonetheless|nevertheless|overall|otherwise|on" + BS + "s+the" + BS + "s+whole|the" + BS + "s+rest|rest" + BS + "s+of|apart" + BS + "s+from|aside" + BS + "s+from|except" + BS + "s+for)" + BS + "b)/i;\n"
  "\n"
  "const SELF_DEPRECATION_EXEMPT = "
)

new = src.replace(anchor, exempt, 1)
assert new != src

# 2) 判函数接入：解构 + 提前返回 + __internals 导出
d_anchor = "  const SELF_DEPRECATION_EXEMPT_ = R.SELF_DEPRECATION_EXEMPT || SELF_DEPRECATION_EXEMPT;\n"
assert src.count(d_anchor) == 1
d_new = d_anchor + "  const PARTIAL_CRITIQUE_EXEMPT_ = R.PARTIAL_CRITIQUE_EXEMPT || PARTIAL_CRITIQUE_EXEMPT;\n"
new = new.replace(d_anchor, d_new, 1)

r_anchor = "  if (SELF_DEPRECATION_EXEMPT_.test(text)) {\n    return { hit: false, score: 0, detail: '', count: 0 };\n  }\n"
assert src.count(r_anchor) == 1
r_new = r_anchor + "  // 局部否定：正当的局部批评+整体肯定不是因人废言\n  if (PARTIAL_CRITIQUE_EXEMPT_.test(text)) {\n    return { hit: false, score: 0, detail: '', count: 0 };\n  }\n"
new = new.replace(r_anchor, r_new, 1)

i_anchor = "__internals: () => ({ ATTACK_ZH, ATTACK_EN, DISREGARD_ZH, DISREGARD_EN, ANTIFRAUD_EXEMPT, LEGAL_FACT_EXEMPT, META_EXEMPT, SELF_DEPRECATION_EXEMPT }),"
assert src.count(i_anchor) == 1
i_new = "__internals: () => ({ ATTACK_ZH, ATTACK_EN, DISREGARD_ZH, DISREGARD_EN, ANTIFRAUD_EXEMPT, LEGAL_FACT_EXEMPT, META_EXEMPT, SELF_DEPRECATION_EXEMPT, PARTIAL_CRITIQUE_EXEMPT }),"
new = new.replace(i_anchor, i_new, 1)

io.open(path, 'w', encoding='utf-8').write(new)
print('OK: PARTIAL_CRITIQUE_EXEMPT wired (def + destructure + gate + internals)')
