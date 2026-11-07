#!/usr/bin/env python3
"""r250-scout-extra.py — 4 号海外扫描补充查询（引号精确短语，arXiv / GitHub / S2）
r250 五候选：A 均值-离群误读 / B 邓宁-克鲁格 / C 趋势外推 / D 显著性≠重要性 / E 现状偏好
空返即空返，不编造命中。"""
import json
import re
import subprocess
import urllib.parse
import urllib.request
import os
import time

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
        print(f'[ok] {label} -> {os.path.basename(out)} ({len(data)} bytes)')
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
    print(f'   GitHub repos={d.get("total_count")} shown={len(items)}')
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
    print(f'=== r250 海外扫描补充（五候选）stamp={STAMP} ===')
    arxiv('all:"Dunning-Kruger effect"', 'dk-quoted')
    arxiv('all:"status quo bias"', 'sqb-quoted')
    arxiv('all:"trend extrapolation"', 'trend-quoted')
    arxiv('all:"statistical significance" AND all:"effect size"', 'sig-effsize')
    arxiv('all:"average" AND all:"median" AND all:"skewed"', 'mean-median-skew')
    gh('"Dunning-Kruger"', 'dk-quoted')
    gh('"status quo bias"', 'sqb-quoted')
    gh('"trend extrapolation" fallacy', 'trend-quoted')
    gh('"statistical significance" "effect size"', 'sig-effsize')
    gh('logical fallacy detection rule engine', 'lf-rule-engine')
    s2('Dunning-Kruger effect', 'dk')
    time.sleep(6)
    s2('status quo bias default effect', 'sqb')
    time.sleep(6)
    s2('trend extrapolation fallacy', 'trend')
    time.sleep(6)
    s2('mean median typical value misinterpretation', 'mean-median')
    time.sleep(6)
    s2('statistical significance effect size misinterpretation', 'sig-effsize')
