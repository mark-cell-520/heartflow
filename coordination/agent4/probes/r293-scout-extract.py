import json, glob, os
os.chdir('/data/home/heartflow/coordination/agent4/scout')
f = 'github-repos-20261111-042812.json'
d = json.load(open(f, encoding='utf-8'))
print('total_count:', d.get('total_count'))
for it in d.get('items', [])[:15]:
    print('-', it.get('full_name'), '| stars:', it.get('stargazers_count'), '|', (it.get('description') or '')[:80])
