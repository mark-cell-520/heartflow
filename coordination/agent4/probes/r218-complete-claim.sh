#!/usr/bin/env bash
# r218 收尾：按宪法 dimension 轮 completed 格式原子追加 claims.jsonl
set -uo pipefail
cd /data/home/heartflow
LINE='{"round":"r218","agent":"agent-4","kind":"dimension","claim_at":"2026-11-05T13:55:00Z","status":"completed","note":"zero_sum_fallacy 第212维度模块+测试+接线规格已起草(4ea438b+报告commit)，8处src/index.js接线待1号；VERSION未bump(能力未激活)"}'
flock coordination/claims.jsonl.lock bash -c 'printf "%s\n" "$1" >> coordination/claims.jsonl' _ "$LINE" && tail -2 coordination/claims.jsonl
