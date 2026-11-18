#!/usr/bin/env bash
# r387 推送区间禁区核查：56b31a0..HEAD
cd /data/home/heartflow || exit 1
RANGE="56b31a0..HEAD"
echo "=== 推送区间文件清单 ==="
git diff --name-only $RANGE | sort | tee /tmp/r387-range.txt
echo ""
echo "=== 文件总数 ==="
wc -l < /tmp/r387-range.txt
echo ""
echo "=== 禁区文件核查（应为 0）==="
FORBIDDEN="src/index.js bin/verify.js scripts/guard-abilities.js scripts/bidirectional-guard.js test/doc-numbers-accuracy.test.js"
HITS=0
for f in $FORBIDDEN; do
  if grep -qx "$f" /tmp/r387-range.txt; then echo "!!! 命中禁区: $f"; HITS=$((HITS+1)); fi
done
echo "禁区命中数: $HITS"
echo ""
echo "=== 提交类型分布 ==="
git log --pretty=%s -6 | sed -E 's/^([a-z]+)\(.*/\1/' | sort | uniq -c
echo ""
echo "=== VERSION 核对 ==="
echo "VERSION=$(cat VERSION)"
git diff $RANGE -- VERSION package.json | head -5
echo "(空=VERSION/package.json 未动)"
echo ""
echo "=== 工作区残留（未跟踪外轮文件，不算本轮产物）==="
git status --porcelain | grep '^??' | wc -l
