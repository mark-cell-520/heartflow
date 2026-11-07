import json
import re

nums = {}
for i, line in enumerate(open('coordination/claims.jsonl', encoding='utf-8'), 1):
    line = line.strip()
    if not line:
        continue
    try:
        d = json.loads(line)
    except Exception:
        print(f'  [parse-fail] line {i}')
        continue
    n = d.get('note', '') or ''
    for m in re.findall(r'provisional (\d+)', n):
        nums.setdefault(int(m), []).append(f"{d.get('round')}/{d.get('kind')}")
top = sorted(nums)[-14:]
for k in top:
    print(f'  provisional {k}: {nums[k]}')
print('distinct provisional numbers:', len(nums))
print('max:', max(nums))
