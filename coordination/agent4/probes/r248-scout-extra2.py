#!/usr/bin/env python3
"""r248-scout-extra2.py — 第二轮补充扫描（换查询式：inverse gambler's fallacy 的
标准表述、Hacking 原始文献、赌徒谬误家族、纯规则谬误检测实现）。空返即空返。"""
import json
import os
import re
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'scout')
STAMP = subprocess.run(['date', '-u', '+%Y%m%d-%H%M%S'], capture_output=True, text=True).stdout.strip()
UA = 'heartflow-agent4-scout/1.0'


def get(url, out, label):
    try:
        req = urllib.request.Request(url, headers={'Accept': 'application/json', 'User-Agent': UA})
        with urllib.request.urlopen(req, timeout=40) as r:
            data = r.read()
        with open(out, 'wb') as f:
            f.write(data)
        print(f'[ok] {label} ({len(data)} bytes)')
        return data.decode('utf-8', 'replace')
    except Exception as e:
        print(f'[fail] {label}: {type(e).__name__}: {e}')
        return ''


def arxiv(q, label):
    url = ('http://export.arxiv.org/api/query?search_query=' + urllib.parse.quote(q) +
           '&start=0&max_results=15&sortBy=relevance')
    body = get(url, os.path.join(OUT, f'arxiv-{label}-{STAMP}.xml'), 'arXiv ' + q)
    ents = re.findall(r'<entry>(.*?)</entry>', body, re.S)
    print(f'   arXiv entries={len(ents)}')
    for e in ents[:12]:
        t = re.search(r'<title>(.*?)</title>', e, re.S)
        i = re.search(r'<id>(.*?)</id>', e, re.S)
        p = re.search(r'<published>(.*?)</published>', e, re.S)
        title = re.sub(r'\s+', ' ', t.group(1)).strip()[:100] if t else '?'
        aid = i.group(1).strip().split('/abs/')[-1] if i else '?'
        yr = p.group(1)[:10] if p else '?'
        print(f'   - {title} | {aid} | {yr}')
    return len(ents)


def gh(q, label):
    url = 'https://api.github.com/search/repositories?q=' + urllib.parse.quote(q) + '&per_page=15'
    body = get(url, os.path.join(OUT, f'github-{label}-{STAMP}.json'), 'GitHub ' + q)
    try:
        d = json.loads(body)
    except Exception:
        print('   GitHub parse-fail')
        return -1
    items = d.get('items', [])
    print(f'   GitHub repos total={d.get("total_count")} shown={len(items)}')
    for it in items[:12]:
        print(f'   - {it.get("full_name")} *{it.get("stargazers_count")} {(it.get("description") or "")[:80]}')
    return d.get('total_count')


def s2(q, label):
    url = ('https://api.semanticscholar.org/graph/v1/paper/search?query=' + urllib.parse.quote(q) +
           '&limit=15&fields=title,year,abstract,url,citationCount')
    body = get(url, os.path.join(OUT, f's2-{label}-{STAMP}.json'), 'S2 ' + q)
    try:
        d = json.loads(body)
    except Exception:
        print('   S2 parse-fail')
        return -1
    items = d.get('data', [])
    print(f'   S2 papers={len(items)} total={d.get("total")}')
    for it in items[:12]:
        print(f'   - [{it.get("year")}] {str(it.get("title"))[:95]} | cit={it.get("citationCount")} | {it.get("url")}')
    return len(items)


if __name__ == '__main__':
    print(f'=== r248 海外扫描第二轮 stamp={STAMP} ===')
    arxiv('ti:"inverse gambler"', 'igf-title')
    arxiv('all:"inverse gamblers fallacy"', 'igf-plural')
    arxiv('abs:fallacy AND abs:probability AND abs:reasoning', 'fallacy-prob-reason')
    time.sleep(3)
    gh('"gambler fallacy"', 'gambler-fallacy-repos')
    time.sleep(3)
    gh('fallacy detection regex rules', 'fallacy-regex-repos')
    time.sleep(8)
    s2('inverse gambler fallacy', 'igf-r2')
    time.sleep(8)
    s2('gambler fallacy reasoning detection', 'gf-detection-r2')
