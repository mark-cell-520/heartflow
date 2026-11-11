"""把 r291 的 6.8.172 CHANGELOG 条目从 6.8.170/171 之间移到文件顶部（最新在前）。"""
import io

p = '/data/home/heartflow/CHANGELOG.md'
with io.open(p, encoding='utf-8') as f:
    lines = f.readlines()

# 定位 6.8.172 条目块：从紧邻其上方的 '---' 分隔行开始，到下一 '# 6.8.' 标题行前结束
start = None
for i, l in enumerate(lines):
    if l.startswith('# 6.8.172 '):
        start = i
        break
assert start is not None, '6.8.172 标题未找到'
# 向上吞掉分隔符行（--- 与空行）
s = start
while s > 0 and (lines[s - 1].strip() in ('', '---')):
    s -= 1
# 向下到下一 '# 6.8.' 前（保留其后分隔）
e = start
while e < len(lines) and not lines[e].startswith('# 6.8.171 '):
    e += 1
while e > start and lines[e - 1].strip() == '':
    e -= 1
block = lines[s:e]
assert '# 6.8.172 ' in ''.join(block), '块内容校验失败'
rest = lines[:s] + lines[e:]
# 顶部插入：块 + 分隔
new = block + ['\n', '---\n', '\n'] + rest
with io.open(p, 'w', encoding='utf-8') as f:
    f.writelines(new)
print('moved block lines', s, '..', e, 'to top')
print('new head order:')
for l in new[:6]:
    print(repr(l))
