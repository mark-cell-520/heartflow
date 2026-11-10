import re
from collections import Counter

def result_lines(path):
    c = Counter()
    with open(path) as f:
        for line in f:
            m = re.search(r'测试结果:\s*(\d+)\s*通过,\s*(\d+)\s*失败', line)
            if m:
                c[(int(m.group(1)), int(m.group(2)))] += 1
    return c

a = result_lines('/data/home/heartflow/coordination/agent4/r285-runall.output.txt')
b = result_lines('/data/home/heartflow/coordination/agent4/probes/r286-runall-full.output.txt')
print('r285 total result lines:', sum(a.values()), 'sum passed', sum(k[0]*v for k,v in a.items()), 'sum failed', sum(k[1]*v for k,v in a.items()))
print('r286 total result lines:', sum(b.values()), 'sum passed', sum(k[0]*v for k,v in b.items()), 'sum failed', sum(k[1]*v for k,v in b.items()))
print('\n(result-line multiset diff, r286 - r285):')
for k in sorted(set(a) | set(b)):
    d = b.get(k, 0) - a.get(k, 0)
    if d != 0:
        print(' ', k, 'delta', d)

# 失败>0 的结果行在两版中的出现次数
print('\nlines with failed>0:')
for k in sorted(set(a) | set(b)):
    if k[1] > 0:
        print(' ', k, 'r285:', a.get(k, 0), 'r286:', b.get(k, 0))
