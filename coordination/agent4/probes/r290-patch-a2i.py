#!/usr/bin/env python3
# r290 补腿脚本：appeal-to-ignorance 镜像族射程扩展（zh/en 各补缺口）
import io

path = 'src/appeal-to-ignorance.js'
src = io.open(path, encoding='utf-8').read()

# 缺口1（ZH）：「谁也解释不了这种巧合」——burden 腿主语加「谁也」族
old_zh = '(?:没人|无人|没有人|谁也不能|谁都没能|至今没有|迄今没有|迄今为止没有|从没有|未曾|未能|无法|没法|不能|没能|尚未有人?)[^。！？!?]{0,10}(?:能|能够|可以|成功)?(?:证明|证实|解释|说明|查清|查明)'
new_zh = '(?:没人|无人|没有人|谁也不能|谁都不能|谁也|无人能|至今没有|迄今没有|迄今为止没有|从没有|未曾|未能|无法|没法|不能|没能|尚未有人?)[^。！？!?]{0,10}(?:能|能够|可以|成功)?(?:证明|证实|解释|说明|查清|查明)'
n = src.count(old_zh)
assert n == 1, 'zh count=%d' % n
src = src.replace(old_zh, new_zh)

# 缺口2（EN）：「You cannot show any evidence that it does not work.」
# 在 BURDEN_MIRROR_EN 末尾并列支追加：you cannot show/provide any evidence …
anchor = "(?:no\\s+one|nobody)\\s+(?:has|have|had)?\\s*(?:ever\\s+)?(?:been\\s+able\\s+to\\s+)?(?:can|could|can'?t|couldn'?t)?\\s*(?:disprove|disproven|refute|refuted|debunk)\\b"
addition = anchor + "|(?:you|they|we)\\s+(?:cannot|can'?t|could\\s+not|couldn'?t)\\s+(?:show|provide|produce|give|offer|present)\\s+(?:any|a\\s+single)\\s+(?:evidence|proof|data|reason|argument)\\s+(?:that|to\\s+show|showing)\\s+[^.]{0,60}?(?:do(?:es)?\\s+not|don'?t|doesn'?t|cannot|can'?t|is\\s+not|isn'?t|non-?existent|ineffective|false|wrong)"
n2 = src.count(anchor)
assert n2 == 1, 'en count=%d' % n2
src = src.replace(anchor, addition)

io.open(path, 'w', encoding='utf-8').write(src)
print('patched zh=%d en=%d' % (n, n2))
