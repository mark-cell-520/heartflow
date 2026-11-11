#!/usr/bin/env python3
# r290 补腿：BURDEN_MIRROR_ZH 补「谁也解释不了 / 说不清」支（动词内置否定形）
import io
path = 'src/appeal-to-ignorance.js'
src = io.open(path, encoding='utf-8').read()
anchor = '(?:拿不出|给不出|举不出|找不到|没有)(?:任何)?(?:能|可以)?[^。！？!?]{0,8}(?:证据|凭据|实据|依据|证明|反证)'
addition = anchor + '|(?:谁也|无人|没人|没有人|谁都不能|谁也不能)[^。！？!?]{0,6}(?:解释不了|解释不清|说不清|道不明|讲不通|弄不懂|搞不懂|想不通|说不出|无法解释|不能解释|解释不通)'
n = src.count(anchor)
assert n == 1, 'anchor count=%d' % n
src = src.replace(anchor, addition)
io.open(path, 'w', encoding='utf-8').write(src)
print('patched count=%d' % n)
