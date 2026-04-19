#!/usr/bin/env python3
"""
HeartFlow 统一日志模块 v1.0
=========================
提供安全、受控的日志输出。

功能:
- 统一的日志级别管理
- 生产环境自动关闭 DEBUG 日志
- 心理健康数据强制脱敏
- 敏感数据过滤

使用方式:
    from heartflow_logging import get_logger
    
    logger = get_logger(__name__)
    logger.debug("这是调试信息")  # 生产环境不输出
    logger.info("这是正常信息")
    logger.warning("警告信息")
    logger.error("错误信息")
"""

import logging
import os
import sys
from typing import Optional


# 生产环境标志
PRODUCTION = os.environ.get("HERMES_ENV", "") == "production"


# 日志格式
DEFAULT_FORMAT = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"


def get_logger(name: str, level: Optional[int] = None) -> logging.Logger:
    """
    获取 HeartFlow 日志器
    
    Args:
        name: 日志器名称（通常使用 __name__）
        level: 日志级别，None 时自动根据环境设置
    
    Returns:
        配置好的日志器
    """
    logger = logging.getLogger(name)
    
    # 设置级别
    if level is not None:
        logger.setLevel(level)
    else:
        # 生产环境默认 WARNING，调试环境默认 DEBUG
        logger.setLevel(logging.WARNING if PRODUCTION else logging.DEBUG)
    
    # 添加处理器（如果还没有）
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stderr)
        handler.setFormatter(logging.Formatter(DEFAULT_FORMAT))
        logger.addHandler(handler)
    
    return logger


# 敏感数据模式（这些关键词不应出现在日志中）
SENSITIVE_PATTERNS = [
    "password",
    "api_key",
    "token",
    "secret",
    "psych",
    "mental_health",
    "depression",
    "anxiety",
    "suicide",
    "自杀",
    "抑郁",
    "焦虑",
]


def sanitize_log_message(message: str) -> str:
    """
    清理日志消息中的敏感数据
    
    将敏感关键词替换为 [REDACTED]
    """
    import re
    
    result = message
    for pattern in SENSITIVE_PATTERNS:
        # 不区分大小写的替换
        result = re.sub(
            rf"{pattern}[:：]?\s*[^\s\*]+",
            f"[{pattern.upper()}: REDACTED]",
            result,
            flags=re.IGNORECASE
        )
    
    return result


# 心理健康日志包装器
class MentalHealthLogger:
    """心理健康数据专用日志器"""
    
    def __init__(self, name: str = "heartflow.mental"):
        self.logger = get_logger(name)
        self._sanitize = True
    
    def log(self, level: int, message: str, data: dict = None):
        """记录心理健康日志（自动脱敏）"""
        if data and self._sanitize:
            # 脱敏敏感数据
            sanitized = {}
            for k, v in data.items():
                if isinstance(v, str) and any(p in k.lower() for p in SENSITIVE_PATTERNS):
                    sanitized[k] = "[REDACTED]"
                else:
                    sanitized[k] = v
            message = f"{message} | {sanitized}"
        
        self.logger.log(level, message)
    
    def info(self, message: str, data: dict = None):
        self.log(logging.INFO, message, data)
    
    def warning(self, message: str, data: dict = None):
        self.log(logging.WARNING, message, data)
    
    def error(self, message: str, data: dict = None):
        self.log(logging.ERROR, message, data)


# ========== 兼容旧的 print 方式 ==========

def debug(*args, **kwargs):
    """生产环境不输出的调试日志"""
    if not PRODUCTION:
        print("[Debug]", *args, **kwargs)


def info(*args, **kwargs):
    print("[Info]", *args, **kwargs)


def error(*args, **kwargs):
    print("[Error]", *args, **kwargs, file=sys.stderr)


# ========== 测试 ==========

if __name__ == "__main__":
    print("HeartFlow 日志模块测试")
    print("=" * 40)
    
    # 测试日志器
    logger = get_logger("test")
    logger.debug("调试信息")
    logger.info("普通信息")  
    logger.warning("警告信息")
    logger.error("错误信息")
    
    print()
    
    # 测试脱敏
    test_msg = "用户密码是 123456，心理健康评估: 抑郁分数=15"
    print(f"原始: {test_msg}")
    print(f"脱敏: {sanitize_log_message(test_msg)}")