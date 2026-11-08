import json
p = '/data/home/heartflow/coordination/claims.jsonl'
lines = [l for l in open(p) if l.strip()]
ok = 0
bad = []
for i, l in enumerate(lines, 1):
    try:
        json.loads(l); ok += 1
    except Exception:
        bad.append(i)
print('claims.jsonl lines:', len(lines), 'parse ok:', ok, 'parse fail:', bad)
last = json.loads(lines[-1])
print('last entry:', last['round'], last['kind'], last.get('status'))
