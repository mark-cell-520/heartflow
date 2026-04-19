#!/usr/bin/env python3
"""
安全文件操作工具模块 v1.0
========================
提供安全的文件路径校验，防止路径遍历漏洞。

功能:
- validate_path() - 验证路径在白名单目录内
- safe_read() - 安全读取文件
- safe_write() - 安全写入文件
- get_safe_path() - 获取安全路径

使用方式:
    from secure_file_utils import validate_path, safe_read, safe_write
    
    # 验证路径
    if not validate_path(file_path, allowed_dirs):
        raise PermissionError("路径不在白名单目录内")
"""

import os
from pathlib import Path
from typing import List, Union, Optional


# 默认白名单目录（可通过环境变量扩展）
DEFAULT_ALLOWED_DIRS = [
    str(Path.home() / ".hermes"),
    str(Path.cwd()),
    "/tmp",
]


def get_allowed_dirs() -> List[str]:
    """获取白名单目录列表"""
    # 从环境变量扩展
    env_dirs = os.environ.get("HERMES_ALLOWED_DIRS", "")
    if env_dirs:
        dirs = env_dirs.split(":")
    else:
        dirs = []
    
    # 合并默认目录
    all_dirs = DEFAULT_ALLOWED_DIRS + dirs
    return [str(Path(d).resolve()) for d in all_dirs if Path(d).exists()]


def normalize_path(path: Union[str, Path]) -> str:
    """
    规范化路径 - 解析符号链接并返回绝对路径
    """
    return str(Path(path).resolve())


def validate_path(path: Union[str, Path], allowed_dirs: Optional[List[str]] = None) -> bool:
    """
    验证路径是否在白名单目录内
    
    Args:
        path: 要验证的路径
        allowed_dirs: 白名单目录列表，None 时使用默认
    
    Returns:
        True: 路径安全
        False: 路径不在白名单内
    """
    if allowed_dirs is None:
        allowed_dirs = get_allowed_dirs()
    
    try:
        # 解析真实路径
        real_path = normalize_path(path)
        
        # 检查是否在任何白名单目录内
        for allowed in allowed_dirs:
            if real_path.startswith(allowed + os.sep) or real_path == allowed:
                return True
        
        return False
    except (ValueError, OSError):
        return False


def safe_read(path: Union[str, Path], allowed_dirs: Optional[List[str]] = None, encoding: str = "utf-8") -> str:
    """
    安全读取文件（带路径校验）
    
    Args:
        path: 文件路径
        allowed_dirs: 白名单目录
        encoding: 文件编码
    
    Returns:
        文件内容
    
    Raises:
        PermissionError: 路径不在白名单内
        FileNotFoundError: 文件不存在
    """
    if not validate_path(path, allowed_dirs):
        raise PermissionError(f"路径不在白名单目录内: {path}")
    
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"文件不存在: {path}")
    
    return p.read_text(encoding=encoding)


def safe_write(path: Union[str, Path], content: str, allowed_dirs: Optional[List[str]] = None, encoding: str = "utf-8") -> None:
    """
    安全写入文件（带路径校验）
    
    Args:
        path: 文件路径
        content: 写入内容
        allowed_dirs: 白名单目录
        encoding: 文件编码
    
    Raises:
        PermissionError: 路径不在白名单内
    """
    if not validate_path(path, allowed_dirs):
        raise PermissionError(f"路径不在白名单目录内: {path}")
    
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding=encoding)


def safe_append(path: Union[str, Path], content: str, allowed_dirs: Optional[List[str]] = None, encoding: str = "utf-8") -> None:
    """
    安全追加写入文件（带路径校验）
    
    Args:
        path: 文件路径
        content: 追加内容
        allowed_dirs: 白名单目录
        encoding: 文件编码
    """
    if not validate_path(path, allowed_dirs):
        raise PermissionError(f"路径不在白名单目录内: {path}")
    
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(p.read_text(encoding=encoding) + content, encoding=encoding)


# ========== 测试 ==========

if __name__ == "__main__":
    print("安全文件操作测试")
    print("=" * 40)
    
    allowed = get_allowed_dirs()
    print(f"白名单目录: {allowed}")
    print()
    
    # 测试路径验证
    test_paths = [
        "~/.hermes/memory/test.txt",
        "~/.hermes/../etc/passwd",
        "/etc/passwd",
        "/tmp/test.txt",
    ]
    
    for p in test_paths:
        result = validate_path(p, allowed)
        print(f"validate_path({p}): {result}")