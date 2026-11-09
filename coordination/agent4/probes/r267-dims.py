import re
base='/root/hermes1/skills/ai/mark-heartflow-skill/'
t=open(base+'SKILL.md',encoding='utf-8').read()
m=re.search(r'\*\*Verify-level \((\d+)\):\*\* ([a-z_, ]+)', t)
print('claimed count:', m.group(1))
names=m.group(2).split(', ')
print('listed count:', len(names))
t2=open(base+'src/index.js',encoding='utf-8').read()
i=t2.find('const VERIFY_DIMS'); j=t2.find(']);', i)
real=re.findall(r"'([a-z_]+)'", t2[i:j])
print('real count:', len(real))
missing=[n for n in real if n not in names]
extra=[n for n in names if n not in real]
print('in real not listed:', len(missing), missing[:40])
print('listed not in real:', len(extra), extra[:40])
