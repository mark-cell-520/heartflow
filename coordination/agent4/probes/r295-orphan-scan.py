import os, re

files = []
for root, dirs, fs in os.walk('src'):
    if 'node_modules' in root:
        continue
    for f in fs:
        if f.endswith('.js'):
            files.append(os.path.join(root, f))

refs = set()
for root, dirs, fs in os.walk('.'):
    if any(x in root for x in ('node_modules', '.git', 'coordination', 'test')):
        continue
    for f in fs:
        if not f.endswith('.js'):
            continue
        p = os.path.join(root, f)
        try:
            txt = open(p, encoding='utf-8', errors='replace').read()
        except Exception:
            continue
        for m in re.finditer(r"""require\(['"](\.[^'"]+)['"]\)""", txt):
            refs.add(os.path.normpath(os.path.join(root, m.group(1))))
        for m in re.finditer(r"""from\s+['"](\.[^'"]+)['"]""", txt):
            refs.add(os.path.normpath(os.path.join(root, m.group(1))))

orphans = [p for p in files if p not in refs]
print("orphan count:", len(orphans))
for p in sorted(orphans):
    print(" ", p, os.path.getsize(p))
