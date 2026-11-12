import io

path = '/root/hermes1/skills/ai/mark-heartflow-skill/src/ad-hominem.js'
src = io.open(path, encoding='utf-8').read()

anchor = "  '|水平有限|水平不行|能力不够|能力不足|资历不够|资历浅|经验不足|too inexperienced)' +\n"
assert src.count(anchor) == 1, 'anchor count=%d' % src.count(anchor)

# c2 [r298] 中文无经验否定族：从来没做过这一行 / 没干过这行 / 没做过这工作
c2 = (
  "  // c2 [r298] 无经验否定族（从来没做过这一行/没干过这行/没做过这个工作）\n"
  "  // ——r298 探针实测：「他从来没做过这一行，所以他的分析完全错误」腿②命中\n"
  "  // （完全错误）但腿① false。与 ATTACK_EN c4 族形态对应。\n"
  "  '|(?:从来|从未|压根|根本|完全)?(?:没|未)(?:有)?(?:做过|干过|搞过|做过|经历过|接触过|入过)(?:这|那)?(?:一|几)?(?:行|个行|行当|门|块|领域|方面|类|种)(?:工作|活儿|事情|事)?'\n"
  "  '|(?:从来|从未|压根|根本)?(?:没|未)(?:做过|干过|搞过|经历过|接触过)(?:这个|那个|这类|那类|任何)?(?:工作|活儿|项目|事情|业务|职业|岗位)'\n"
  "  '|(?:入行|从业)(?:时间|经历)?(?:很|太|挺|非常)?(?:短|少|浅|不够|不足)'\n"
)

new = src.replace(anchor, c2 + anchor, 1)
assert new != src
io.open(path, 'w', encoding='utf-8').write(new)
print('OK: ZH c2 inserted before 水平有限 anchor')
