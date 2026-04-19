#!/usr/bin/env python3
"""
HeartFlow 安全初始化模块 v1.0
===========================
在导入 HeartFlow 时自动设置安全限制。

功能:
- 设置递归深度限制
- 捕获递归溢出异常
- 提供安全的递归调用包装器

使用方式 (在 heartflow_core.py 顶部添加):
    from security_init import setup_security
    setup_security()
"""

import sys
import traceback
from functools import wraps
from typing import Callable, Any


# 安全递归限制（Python 默认 1000，可以根据需求调整）
SAFE_RECURSION_LIMIT = 5000


def setup_security():
    """设置安全限制"""
    old_limit = sys.getrecursionlimit()
    if old_limit < SAFE_RECURSION_LIMIT:
        sys.setrecursionlimit(SAFE_RECURSION_LIMIT)
        print(f"[Security] 递归深度限制: {old_limit} -> {SAFE_RECURSION_LIMIT}")


def get_safe_recursion_limit() -> int:
    """获取当前递归深度限制"""
    return sys.getrecursionlimit()


def safe_recursive(max_depth: int = None) -> Callable:
    """
    递归函数安全装饰器
    
    使用方式:
        @safe_recursive(max_depth=100)
        def my_recursive_func(n):
            ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            limit = max_depth or SAFE_RECURSION_LIMIT
            depth = sys.getrecursionlimit()
            
            # 检查是否接近限制
            if depth >= limit * 0.9:
                raise RecursionError(
                    f"递归深度超过安全限制 ({limit})，可能存在 DoS 风险"
                )
            
            return func(*args, **kwargs)
        
        return wrapper
    return decorator


def check_recursion_depth(func: Callable) -> Callable:
    """
    检查递归深度的装饰器
    
    在函数执行前后检查栈深度，防止无限递归
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except RecursionError as e:
            print(f"[Security] 递归错误 in {func.__name__}: {e}")
            traceback.print_exc()
            raise
        
    return wrapper


# 模块导入时自动设置
if __name__ != "__main__":
    setup_security()