#!/bin/bash
# cron-wechat-bridge.sh
# 心虫升级结果投递桥接
# 将本地JSON结果文件转换为简短微信通知，投递给origin

RESULT_FILE="$1"
CHAT_ID="o9cq803Q3IFYdiHZ1FhPIxynpStA@im.wechat"

if [ -z "$RESULT_FILE" ] || [ ! -f "$RESULT_FILE" ]; then
    echo "Usage: $0 <result.json>"
    exit 1
fi

# 读取结果
VERSION=$(node -e "const d=require('$RESULT_FILE'); console.log(d.version||'N/A')" 2>/dev/null || echo "N/A")
PAPER=$(node -e "const d=require('$RESULT_FILE'); console.log(d.paper||'N/A')" 2>/dev/null || echo "N/A")
FILES=$(node -e "const d=require('$RESULT_FILE'); console.log(d.filesChanged||'N/A')" 2>/dev/null || echo "N/A")
STATUS=$(node -e "const d=require('$RESULT_FILE'); console.log(d.testStatus||'N/A')" 2>/dev/null || echo "N/A")

MSG="【心虫升级完成】
版本: $VERSION
论文: $PAPER
文件: $FILES
测试: $STATUS"

echo "[bridge] Sending: $MSG"
echo "$MSG"
