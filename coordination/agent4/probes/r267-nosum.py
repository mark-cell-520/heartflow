#!/usr/bin/env python3
"""r267 探针：静态盘点 test/**/*.test.js 的 no-summary-line 格式债。

口径与 test/run-all.js 计数逻辑严格对齐：
  1) 汇总行「N 通过, M 失败 / N passed, M failed」      -> 可计数
  2) 分数式「N/M passed / 合计 N/M」                     -> 可计数
  3) 裸跑型 PASS/SKIP 单行                               -> 计 1 passed（不计失败）
  4) 以上都没有且 exit 0                                  -> 计 1 failed（格式债）
静态扫描只看 console.log/error 输出语句，不实际执行测试。
"""
import os
import re
import json
import sys

PAT = re.compile(r"\d+\s*(?:通过|passed)\s*[/,]?\s*\d+\s*(?:失败|failed)")
RATIO = re.compile(r"\d+\s*/\s*\d+\s*(?:passed|通过|tests?\b|个|条)")
PASS_SKIP = re.compile(r"console\.(?:log|error)\(\s*['\"`]\s*(?:PASS|SKIP)\b")


def scan(test_dir="test"):
    nosum, passline, counted = [], [], []
    total = 0
    for root, dirs, files in os.walk(test_dir):
        parts = root.split(os.sep)
        if "archive" in parts or "node_modules" in parts:
            continue
        for f in sorted(files):
            if not f.endswith(".test.js"):
                continue
            total += 1
            p = os.path.join(root, f)
            try:
                with open(p, encoding="utf8") as fh:
                    s = fh.read()
            except Exception:
                continue
            body = "\n".join(
                l for l in s.split("\n") if "console.log" in l or "console.error" in l
            )
            if PAT.search(body) or RATIO.search(body):
                counted.append(p)
            elif PASS_SKIP.search(body):
                passline.append(p)
            else:
                nosum.append(p)
    return total, counted, passline, nosum


def main():
    test_dir = sys.argv[1] if len(sys.argv) > 1 else "test"
    total, counted, passline, nosum = scan(test_dir)
    print("test.js 总数:        %d" % total)
    print("有标准汇总(可计数):  %d" % len(counted))
    print("PASS/SKIP 单行:      %d" % len(passline))
    print("no-summary-line 债:  %d" % len(nosum))
    out = sys.argv[2] if len(sys.argv) > 2 else "/tmp/r267-nosum.json"
    with open(out, "w", encoding="utf8") as fh:
        json.dump({"nosum": nosum, "passline": passline}, fh, ensure_ascii=False, indent=1)
    print("清单已写入 %s" % out)
    for p in nosum[:80]:
        print(" - %s" % p)


if __name__ == "__main__":
    main()
