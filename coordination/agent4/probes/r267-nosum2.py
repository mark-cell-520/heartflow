#!/usr/bin/env python3
"""r267 探针 v2：严格复刻 test/run-all.js 的任务分发逻辑。

run-all 不是看测试文件自己有没有 console.log 汇总，而是看「文件形态」：
  isMount   = module.exports = function/name/箭头   -> 走 _mount.js，harness 补汇总
  describe( = 有 describe( 且不引 mini-expect     -> 走 _jest-globals.js
  其余                                          -> 裸 node，必须自己输出汇总
因此真正的 no-summary-line 债 = 非 mount、非 describe 形态，且自身不含
汇总/分数式/PASS-SKIP 输出的文件。
"""
import os
import re
import json
import sys

PAT = re.compile(r"\d+\s*(?:通过|passed)\s*[/,]?\s*\d+\s*(?:失败|failed)")
RATIO = re.compile(r"\d+\s*/\s*\d+\s*(?:passed|通过|tests?\b|个|条)")
PASS_SKIP = re.compile(r"console\.(?:log|error)\(\s*['\"`]\s*(?:PASS|SKIP)\b")
IS_MOUNT = re.compile(r"module\.exports\s*=\s*(?:function\b|[A-Za-z_$][\w$]*\s*;|\(?[^)]*\)?\s*=>)")
DESCRIBE = re.compile(r"\bdescribe\s*\(")
MINI_EXPECT = re.compile(r"require\(['\"][^'\"]*mini-expect")


def classify(p):
    with open(p, encoding="utf8") as fh:
        s = fh.read()
    body = "\n".join(
        l for l in s.split("\n") if "console.log" in l or "console.error" in l
    )
    has_summary = bool(PAT.search(body) or RATIO.search(body))
    has_pass_skip = bool(PASS_SKIP.search(body))
    is_mount = bool(IS_MOUNT.search(s))
    is_describe = bool(DESCRIBE.search(s) and not MINI_EXPECT.search(s))
    if is_mount:
        return "mount", has_summary, has_pass_skip
    if is_describe:
        return "jest", has_summary, has_pass_skip
    return "bare", has_summary, has_pass_skip


def main():
    test_dir = sys.argv[1] if len(sys.argv) > 1 else "test"
    out = sys.argv[2] if len(sys.argv) > 2 else "/tmp/r267-nosum2.json"
    buckets = {"mount": [], "jest": [], "bare": []}
    debt = []
    for root, dirs, files in os.walk(test_dir):
        parts = root.split(os.sep)
        if "archive" in parts or "node_modules" in parts:
            continue
        for f in sorted(files):
            if not f.endswith(".test.js"):
                continue
            p = os.path.join(root, f)
            try:
                kind, has_summary, has_ps = classify(p)
            except Exception:
                continue
            buckets[kind].append(p)
            if kind == "bare" and not has_summary and not has_ps:
                debt.append(p)
    for k in buckets:
        print("%-6s %d" % (k, len(buckets[k])))
    print("no-summary-line 债(裸 node 且无任何汇总输出): %d" % len(debt))
    with open(out, "w", encoding="utf8") as fh:
        json.dump({"debt": debt, "buckets": buckets}, fh, ensure_ascii=False, indent=1)
    print("清单已写入 %s" % out)
    for p in debt:
        print(" - %s" % p)


if __name__ == "__main__":
    main()
