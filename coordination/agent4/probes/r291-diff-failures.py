"""diff 两轮 run-all 失败清单：r289 基线 vs r291 本轮。"""
import io, re

def failures(p):
    txt = io.open(p, encoding='utf-8', errors='replace').read()
    # 失败清单条目形如 "  - · <name> (原因)" 或 "  - · <name> 文件自报失败: ..."
    names = set()
    for m in re.finditer(r'^\s*-\s*·\s*(\S+?)\s*(?:\(|文件自报失败|Command failed)', txt, re.M):
        names.add(m.group(1))
    # 汇总数字
    sm = re.search(r'(\d+)\s*通过[^\d]*(\d+)\s*失败', txt)
    return names, (sm.groups() if sm else None)

base, bn = failures('/data/home/heartflow/coordination/agent4/probes/r289-runall-full.output.txt')
cur, cn = failures('/data/workspace/deploy-agent4/r291-runall-full.output.txt')
print('r289 基线失败清单:', len(base), '数字:', bn)
print('r291 本轮失败清单:', len(cur), '数字:', cn)
new = sorted(cur - base)
gone = sorted(base - cur)
print('--- 新增失败 (%d):' % len(new))
for n in new: print('  +', n)
print('--- 消失失败 (%d):' % len(gone))
for n in gone: print('  -', n)
