import json, sys, subprocess
out = subprocess.run(['node', 'coordination/agent4/probes/r257-probe-round1.js'], capture_output=True, text=True, cwd='/data/home/heartflow')
if out.returncode != 0:
    print('PROBE_FAIL rc=%d' % out.returncode); print(out.stderr[-3000:]); sys.exit(1)
d = json.loads(out.stdout)
for c in d:
    print('=' * 72)
    print(c['cand'], '|', c['desc'])
    print('  attack %d / penetrated %d' % (c['atkN'], c['pen']))
    print('  caught-by:', json.dumps(c['caughtBy'], ensure_ascii=False))
    for t in c['penTexts']:
        print('   [PEN]', t)
    print('  benign %d / false-block %d' % (c['benignN'], c['benignFP']))
    for f in c['fpTexts']:
        print('   [FP]', f['a'], f['d'], f['t'])
