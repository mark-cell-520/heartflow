#!/usr/bin/env python3
"""
安全随机数工具模块 v1.0
================
提供密码学安全的随机数生成，替代不安全的 random 模块。

功能:
- secrets.randbelow() 替代 random.randint/random.random()
- secrets.token_bytes() 替代 random.choice() 用于随机选择
- 安全种子生成

注意：这些是密码学安全的随机数，不应用于确定性测试。
"""

import secrets
import math
from typing import List, Any, Optional


def randbelow(n: int) -> int:
    """
    返回 [0, n) 范围内的密码学安全随机整数。
    
    替代 random.randint(0, n-1) 或 random.randrange(n)
    """
    return secrets.randbelow(n)


def random() -> float:
    """
    返回 [0, 1) 范围内的密码学安全的随机浮点数。
    
    替代 random.random()
    注意：每次调用都会消耗系统熵池，建议仅在安全关键场景使用。
    """
    # 使用 secrets 生成随机字节，然后转换为 [0, 1)
    return secrets.randbelow(2**64) / (2**64)


def choice(seq: List[Any]) -> Any:
    """
    从非空序列中随机选择元素。
    
    替代 random.choice(seq)
    """
    if not seq:
        raise IndexError("Cannot choose from empty sequence")
    return seq[secrets.randbelow(len(seq))]


def shuffle(seq: List[Any]) -> List[Any]:
    """
    随机打乱序列（原地洗牌算法）。
    
    替代 random.shuffle(seq)
    返回新列表，不修改原序列。
    """
    result = list(seq)
    n = len(result)
    for i in range(n - 1, 0, -1):
        j = secrets.randbelow(i + 1)
        result[i], result[j] = result[j], result[i]
    return result


def gauss(mu: float = 0.0, sigma: float = 1.0) -> float:
    """
    生成满足高斯（正态）分布的随机浮点数。
    
    使用 Box-Muller 变换
    
    Args:
        mu: 均值
        sigma: 标准差
    """
    # 使用 secrets 生成两个 [0, 1) 的随机数
    u1 = max(1e-10, min(0.99999999, secrets.randbelow(2**64) / (2**64)))
    u2 = max(1e-10, min(0.99999999, secrets.randbelow(2**64) / (2**64)))
    # Box-Muller 变换
    z = math.sqrt(-2 * math.log(u1)) * math.cos(2 * math.pi * u2)
    return mu + sigma * z


def token_hex(length: int = 32) -> str:
    """
    生成随机十六进制令牌。
    
    替代 random/hashlib 方式生成 ID
    """
    return secrets.token_hex(length)


# ========== 兼容旧 API 的别名 ==========

randint = randbelow  # randint(n) = randbelow(n) 返回 0 到 n-1


# ========== 测试 ==========

if __name__ == "__main__":
    print("安全随机模块测试")
    print("=" * 40)
    
    # 测试 randbelow
    for i in range(5):
        print(f"randbelow(100): {randbelow(100)}")
    
    print()
    
    # 测试 random
    for i in range(5):
        print(f"random(): {random():.6f}")
    
    print()
    
    # 测试 choice
    seq = ["a", "b", "c", "d", "e"]
    for i in range(5):
        print(f"choice({seq}): {choice(seq)}")
    
    print()
    
    # 测试 shuffle
    test_list = [1, 2, 3, 4, 5]
    print(f"原始: {test_list}")
    print(f"打乱: {shuffle(test_list)}")
    
    print()
    
    # 测试 gauss
    for i in range(5):
        print(f"gauss(0,1): {gauss(0, 1):.4f}")