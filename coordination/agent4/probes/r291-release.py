"""追加 r291 release 记录到 coordination/claims.jsonl（status=completed）。"""
import json, io

entry = {
    "round": "r291", "agent": "agent-4", "kind": "release",
    "claim_at": "2026-11-11T03:20:00Z", "status": "completed", "version": "6.8.172",
    "note": "诉诸自然 appeal_to_nature 非自然即有害反向族+裸存在句补腿（真升级②）+ no_true_scotsman HEDGE_RE 不可能假豁免修复：维度 245 不变、src/index.js 零改动；轮测 91/91、注入删条 20/20 变红；池化穿透 appeal_to_nature 9/13→3/13、no_true_scotsman 4/7→3/7；四门禁 16/0、20/20@245、24/24、52/52+302/326 与基线零偏差；全量 run-all 21,118 passed/144 failed（失败清单与 r289 基线逐条 diff 无真实新增）；commit d154be9+6e33843+1ab2ab1；交接：r292 必须落子 consciousness/ src/plugins/ src/tools/ src/core/psychology/ 之一（连续四轮顶层 src/ 触红线）",
}
with io.open('coordination/claims.jsonl', 'a', encoding='utf-8') as f:
    f.write(json.dumps(entry, ensure_ascii=False) + '\n')
print('appended r291 release')
