import re

path = '/data/home/heartflow/coordination/agent4/probes/r286-runall-full.output.txt'
# 以 [N/711] marker 分块；块内找 测试结果 行与 ✗ 行
chunks = []
cur = {'name': None, 'lines': []}
with open(path) as f:
    for line in f:
        m = re.match(r'^\[\d+/\d+\]\s+·\s+(.+?)\s*$', line)
        if m:
            if cur['name'] is not None:
                chunks.append(cur)
            cur = {'name': m.group(1), 'lines': []}
        else:
            cur['lines'].append(line.rstrip('\n'))
if cur['name'] is not None:
    chunks.append(cur)

print('chunks:', len(chunks))
fail_files = []
for c in chunks:
    text = '\n'.join(c['lines'])
    m = re.search(r'测试结果:\s*(\d+)\s*通过,\s*(\d+)\s*失败', text)
    if m and int(m.group(2)) > 0:
        fail_files.append((c['name'], int(m.group(1)), int(m.group(2))))
    elif re.search(r'^\s*✗', text, re.M):
        fail_files.append((c['name'], 'has-x-mark', ''))
print('\nfiles with failed>0 or ✗ marks ({}):'.format(len(fail_files)))
for n, p, f_ in fail_files:
    print(' ', n, p, f_)
