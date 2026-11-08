#!/usr/bin/env python3
"""r256 海外精确引号查询：五候选 x arXiv / GitHub / S2。
输出原始事实；空返即空返，不编造命中。"""
import json, subprocess, sys, urllib.parse, os, re

OUT = 'coordination/agent4/scout'
os.makedirs(OUT, exist_ok=True)
STAMP = subprocess.check_output(['date', '-u', '+%Y%m%d-%H%M%S']).decode().strip()

QUERIES = [
    ('undistributed-middle', '"undistributed middle term"'),
    ('omission-bias', '"omission bias"'),
    ('fundamental-attribution', '"fundamental attribution error"'),
    ('ambiguity-aversion', '"ambiguity aversion"'),
    ('zero-risk-bias', '"zero-risk bias"'),
    ('fallacy-rules', '"fallacy detection" rules'),
]

def curl(url, out):
    r = subprocess.run(['curl', '-sSL', '--max-time', '40', '-H',
                        'Accept: application/json', '-H',
                        'User-Agent: heartflow-agent4-scout/1.0', url, '-o', out],
                       capture_output=True)
    return r.returncode == 0 and os.path.exists(out) and os.path.getsize(out) > 0

def arxiv(phrase, tag):
    q = urllib.parse.quote('all:%s' % phrase)
    url = ('http://export.arxiv.org/api/query?search_query=%s&start=0'
           '&max_results=10&sortBy=submittedDate&sortOrder=descending' % q)
    out = '%s/targeted-%s-%s.xml' % (OUT, tag, STAMP)
    if not curl(url, out):
        print('  [%s] arXiv 空返/失败' % tag); return
    xml = open(out, encoding='utf-8').read()
    entries = re.findall(r'<entry>(.*?)</entry>', xml, re.S)
    print('  [%s] arXiv 命中 %d 篇:' % (tag, len(entries)))
    for e in entries:
        t = re.search(r'<title>(.*?)</title>', e, re.S)
        i = re.search(r'<id>(.*?)</id>', e, re.S)
        print('    -', (t.group(1).strip().replace('\n', ' ')[:100] if t else '?'),
              '|', (i.group(1).strip() if i else '?'))

def github(phrase, tag):
    q = urllib.parse.quote('%s in:name,description,readme' % phrase)
    url = 'https://api.github.com/search/repositories?q=%s&per_page=10' % q
    out = '%s/gh-%s-%s.json' % (OUT, tag, STAMP)
    if not curl(url, out):
        print('  [%s] GitHub 空返/失败' % tag); return
    try:
        d = json.load(open(out, encoding='utf-8'))
    except Exception:
        print('  [%s] GitHub parse-fail' % tag); return
    items = d.get('items') or []
    print('  [%s] GitHub repos 命中 %d:' % (tag, len(items)))
    for it in items:
        print('    -', it.get('full_name'), '| stars=%s' % it.get('stargazers_count'),
              '| %s' % ((it.get('description') or '')[:70]))

def s2(phrase, tag):
    q = urllib.parse.quote(phrase)
    url = ('https://api.semanticscholar.org/graph/v1/paper/search?query=%s&limit=8'
           '&fields=title,year,abstract,url,citationCount' % q)
    out = '%s/s2-%s-%s.json' % (OUT, tag, STAMP)
    if not curl(url, out):
        print('  [%s] S2 空返/失败' % tag); return
    try:
        d = json.load(open(out, encoding='utf-8'))
    except Exception:
        print('  [%s] S2 parse-fail' % tag); return
    data = d.get('data') or []
    print('  [%s] S2 命中 %d:' % (tag, len(data)))
    for p in data:
        print('    -', p.get('year'), '| cites=%s' % p.get('citationCount'),
              '|', (p.get('title') or '')[:95])

for tag, phrase in QUERIES:
    print('=== %s : %s ===' % (tag, phrase))
    arxiv(phrase, tag)
    github(phrase, tag)
    s2(phrase, tag)
print('=== 扫描结束 stamp=%s ===' % STAMP)
