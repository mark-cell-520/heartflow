import json, glob, os
d = os.listdir('/data/home/heartflow/coordination/agent4/scout')
print('files:', sorted(d)[-4:])
try:
    s2 = json.load(open('/data/home/heartflow/coordination/agent4/scout/s2-20261108-162630.json'))
    print('S2 total:', s2.get('total'))
    for p in (s2.get('data') or [])[:8]:
        print('  -', (p.get('title') or '')[:95])
except Exception as e:
    print('S2 err', e)
try:
    gh = json.load(open('/data/home/heartflow/coordination/agent4/scout/github-repos-20261108-162630.json'))
    print('GH total_count:', gh.get('total_count'))
    for r in (gh.get('items') or [])[:6]:
        print('  -', r.get('full_name'), '|', (r.get('description') or '')[:70])
except Exception as e:
    print('GH err', e)
