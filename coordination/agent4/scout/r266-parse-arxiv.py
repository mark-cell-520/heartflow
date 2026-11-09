import re, html, sys

for f in ['arxiv-r266-cf4.xml', 'arxiv-r266-eco.xml']:
    xml = open(f, encoding='utf-8').read()
    entries = re.findall(r'<entry>(.*?)</entry>', xml, re.S)
    print(f'===== {f} ({len(entries)} entries) =====')
    for e in entries[:8]:
        t = re.search(r'<title>(.*?)</title>', e, re.S).group(1).strip()
        s = re.search(r'<summary>(.*?)</summary>', e, re.S).group(1).strip()
        print('*', html.unescape(re.sub(r'\s+', ' ', t))[:110])
        print('  ', html.unescape(re.sub(r'\s+', ' ', s))[:300])
        print()
