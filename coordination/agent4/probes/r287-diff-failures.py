import re

def failures(path):
    out = []
    with open(path) as f:
        lines = f.read().split('\n')
    in_list = False
    for line in lines:
        if line.startswith('失败的测试:'):
            in_list = True
            continue
        if in_list:
            m = re.match(r'\s+-\s+·?\s*(.+?)\s*$', line)
            if m:
                out.append(m.group(1))
            elif line.strip() and not line.startswith(' '):
                # 失败清单后还有非缩进内容（如 EXIT=）——但如果出现 '全部通过' 等就停
                if not line.startswith('  '):
                    in_list = False
    return out

a = failures('/data/home/heartflow/coordination/agent4/r285-runall.output.txt')
b = failures('/data/home/heartflow/coordination/agent4/probes/r286-runall-full.output.txt')
print('r285 failures:', len(a))
print('r286 failures:', len(b))
sa, sb = set(a), set(b)
new = sorted(sb - sa)
gone = sorted(sa - sb)
print('\nNEW in r286 ({}):'.format(len(new)))
for x in new:
    print('  +', x[:150])
print('\nGONE from r285 ({}):'.format(len(gone)))
for x in gone:
    print('  -', x[:150])
