import re

def per_file(path):
    """提取每个测试文件的 [N/total] name + 后续 console.log 的 测试结果 行配对。"""
    out = {}
    cur = None
    with open(path) as f:
        for line in f:
            m = re.match(r'^\[\d+/\d+\]\s+·\s+(.+?)\s*$', line)
            if m:
                cur = m.group(1)
                continue
            r = re.search(r'测试结果:\s*(\d+)\s*通过,\s*(\d+)\s*失败', line)
            if r and cur:
                out[cur] = (int(r.group(1)), int(r.group(2)))
                cur = None
    return out

a = per_file('/data/home/heartflow/coordination/agent4/r285-runall.output.txt')
b = per_file('/data/home/heartflow/coordination/agent4/probes/r286-runall-full.output.txt')
print('r285 files with results:', len(a), 'sum passed', sum(v[0] for v in a.values()), 'sum failed', sum(v[1] for v in a.values()))
print('r286 files with results:', len(b), 'sum passed', sum(v[0] for v in b.values()), 'sum failed', sum(v[1] for v in b.values()))
keys = set(a) | set(b)
diffs = []
for k in sorted(keys):
    va, vb = a.get(k), b.get(k)
    if va != vb:
        diffs.append((k, va, vb))
print('\nper-file diffs ({}):'.format(len(diffs)))
for k, va, vb in diffs:
    print(' ', k, 'r285=', va, 'r286=', vb)
