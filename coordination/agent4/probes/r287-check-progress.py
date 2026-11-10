import re
nums = []
with open('/data/home/heartflow/coordination/agent4/probes/r286-runall-full.output.txt') as f:
    for line in f:
        m = re.match(r'^\[(\d+)/711\]', line)
        if m:
            nums.append(int(m.group(1)))
print('count', len(nums), 'min', min(nums) if nums else None, 'max', max(nums) if nums else None, 'last', nums[-1] if nums else None)
bad = [(i, nums[i-1], nums[i]) for i in range(1, len(nums)) if nums[i] < nums[i-1]]
print('non-monotonic points:', len(bad), bad[:8])
