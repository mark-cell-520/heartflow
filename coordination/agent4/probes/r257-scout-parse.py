import json, glob, os, re, html
d = '/data/home/heartflow/coordination/agent4/scout'
stamp = '20261108-141657'
# arXiv
p = os.path.join(d, 'arxiv-%s.xml' % stamp)
if os.path.exists(p):
    x = open(p, encoding='utf-8').read()
    entries = re.findall(r'<entry>(.*?)</entry>', x, re.S)
    print('arXiv entries: %d' % len(entries))
    for e in entries[:15]:
        t = re.search(r'<title>(.*?)</title>', e, re.S)
        i = re.search(r'<id>(.*?)</id>', e, re.S)
        print('  -', (html.unescape(re.sub(r'\s+', ' ', t.group(1))).strip() if t else '?'), '|', (i.group(1) if i else '?'))
# S2
p = os.path.join(d, 's2-%s.json' % stamp)
if os.path.exists(p):
    try:
        j = json.load(open(p, encoding='utf-8'))
        print('S2 total: %s' % j.get('total'))
        for it in (j.get('data') or [])[:15]:
            print('  -', it.get('year'), '|', (it.get('title') or '')[:110], '| cit=%s' % it.get('citationCount'))
    except Exception as ex:
        print('S2 parse fail:', ex)
# GitHub
p = os.path.join(d, 'github-repos-%s.json' % stamp)
if os.path.exists(p):
    j = json.load(open(p, encoding='utf-8'))
    print('GitHub repos total_count: %s' % j.get('total_count'))
    for it in (j.get('items') or [])[:15]:
        print('  -', it.get('full_name'), '| ★%s' % it.get('stargazers_count'), '|', (it.get('description') or '')[:80])
