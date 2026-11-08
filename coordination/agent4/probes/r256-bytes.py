import sys
d = open('/data/home/heartflow/src/fundamental-attribution-error.js', 'rb').read()
for key in (b'DISP_ONLY_ZH', b'SITD_REJECT_EN', b'DISP_MARK_TRAIT_ZH'):
    i = d.find(key)
    print(key.decode(), '=>', repr(d[i:i + 130]))
    print()
