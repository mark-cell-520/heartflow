import io, sys

path = '/root/hermes1/skills/ai/mark-heartflow-skill/src/ad-hominem.js'
src = io.open(path, encoding='utf-8').read()

anchor = '  "|\\\\b(?:outsiders?|amateurs?|laym[ae]n|laypeople|laypersons?|non[- ]professionals?|dilettantes?)\\\\b" +\n'
assert src.count(anchor) == 1, 'anchor count=%d' % src.count(anchor)

BS = chr(92)  # backslash

# c4: 无经验否定族（has never done this kind of work / never worked in the field）
c4 = (
  '  // c4 [r298] 无经验否定族（has never done this kind of work / never worked in\n'
  '  // the field）——r298 探针实测漏判：「他从来没做过这一行，所以他的分析\n'
  '  // 完全错误」腿②命中但腿① false。与 ZH 从来没做过这一行 形态对应。\n'
  '  "|' + BS*2 + 'b(?:has|have|had)' + BS*2 + 's+(?:never' + BS*2 + 's+)?(?:done|worked' + BS*2 + 's+(?:in|on)|built|shipped|delivered|handled|seen)' + BS*2 + 's+'
  + '(?:this|that|these|any|real|actual)?' + BS*2 + 's*(?:kind' + BS*2 + 's+of' + BS*2 + 's+)?(?:work|job|project|thing|line' + BS*2 + 's+of' + BS*2 + 's+work|business|field|industry)' + BS*2 + 'b" +\n'
  '  "|' + BS*2 + 'b(?:never|didn' + chr(39) + '?t|did' + BS*2 + 's+not)' + BS*2 + 's+(?:done|worked' + BS*2 + 's+(?:in|on)|built|shipped|delivered|handled)' + BS*2 + 's+'
  + '(?:this|that|any|real)?' + BS*2 + 's*(?:kind' + BS*2 + 's+of' + BS*2 + 's+)?(?:work|job|thing|business|field|industry)' + BS*2 + 'b" +\n'
)

# c5: 成果连带贬损（their assessment/analysis/report is invalid/wrong/fundamentally flawed）
c5 = (
  '  // c5 [r298] 成果连带贬损（their assessment is invalid / his reasoning is\n'
  '  // fundamentally flawed）——攻击落点是「归属人的成果被定性为废」，属对\n'
  '  // 提出论点者的能力连带否定（腿① c 类延伸）。r298 探针实测：「Their\n'
  '  // assessment of our process is invalid, so we can ignore it.」腿②命中\n'
  '  // （is invalid）但腿① false。\n'
  '  "|' + BS*2 + 'b(?:his|her|their|your|our)' + BS*2 + 's+(?:assessment|analysis|reasoning|logic|argument|report|paper|study|conclusions?|findings?|work|critique|criticism|method|methodology|model|numbers?|data)'
  + BS*2 + 's+(?:' + BS*2 + 'w+' + BS*2 + 's+){0,3}(?:is|are)' + BS*2 + 's+'
  + '(?:invalid|wrong|flawed|fundamentally' + BS*2 + 's+flawed|worthless|junk|nonsense|garbage|irrelevant|meaningless|misguided|baseless|unfounded)' + BS*2 + 'b" +\n'
)

new = src.replace(anchor, anchor + c4 + c5, 1)
assert new != src
io.open(path, 'w', encoding='utf-8').write(new)
print('OK: c4+c5 inserted after line anchor (outsiders)')
