import io
BS = chr(92)
p = '/root/hermes1/skills/ai/mark-heartflow-skill/src/index.js'
lines = io.open(p, encoding='utf-8').read().split('\n')
n = 6791
old = lines[n-1]
print('OLD:', repr(old))
print('backslash count:', old.count(BS))
# 目标：把 [^...\\n] 里的双反斜杠（正则里的 \\n = 字面反杠+n）改成单反斜杠（\n = 换行）
# 文件中该字符类形态是 [^。？\\\\n]（4 个源反斜杠）-> [^。？\\n]（2 个源反斜杠）
target = BS * 4
repl = BS * 2
print('target present:', old.count(target))
new = old.replace(target + 'n]', repl + 'n]')
print('NEW:', repr(new))
assert new != old, 'NO CHANGE'
assert new.count(BS * 4) == 0, 'still has 4 backslashes'
lines[n-1] = new
io.open(p, 'w', encoding='utf-8').write('\n'.join(lines))
print('OK: line', n, 'patched')
