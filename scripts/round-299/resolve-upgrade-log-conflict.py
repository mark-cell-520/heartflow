import subprocess, io, re, sys

path = 'UPGRADE_LOG.md'
src = open(path, encoding='utf-8').read()

lines = src.split('\n')
# conflict markers at line 1 (<<<<<<<), 41 (=======), 73 (>>>>>>>  (1-indexed)
i0, imid, i1 = 0, 40, 72
assert lines[i0].startswith('<<<<<<<'), lines[i0]
assert lines[imid] == '=======', repr(lines[imid])
assert lines[i1].startswith('>>>>>>>'), lines[i1]

ours = lines[i0+1:imid]        # Updated upstream (agent-4 r297 relative_pration EN)
theirs = lines[i1+1:]          # Stashed changes (local r297 ad_hominem + ibs wiring)
before = lines[i0+1:imid]      # same as ours
# Structure: [ours report][=======][theirs report] -> keep both, drop markers
merged = ours + ['', '---', ''] + theirs
new_lines = lines[:i0] + merged + lines[i1+1:]
open(path, 'w', encoding='utf-8').write('\n'.join(new_lines))
print('conflict resolved: kept both r297 reports (ours %d lines, theirs %d lines)' % (len(ours), len(theirs)))
print('remaining markers:', open(path, encoding='utf-8').read().count('<<<<<<<'))
