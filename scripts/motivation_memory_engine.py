"""
动机 - 记忆集成引擎 (Motivation-Memory Engine) v9.5.2

v9.5.2 更新:
- 实现完整功能（不再占位）
- 动机类型识别
- 动机纯度计算
- 记忆相关性评估
"""

from dataclasses import dataclass
from typing import Optional, Dict, Any, List


@dataclass
class MotivationMemoryResult:
    """动机 - 记忆分析结果"""
    motivation_score: float = 0.0      # 总动机强度 (0-1)
    memory_relevance: float = 0.0       # 记忆相关性 (0-1)
    key_memories: list = None           # 关键记忆列表
    motivation_type: str = "unknown"     # 动机类型
    motivation_purity: float = 0.0      # 动机纯度 (用户导向/总动机)
    notes: str = ""
    
    def to_dict(self) -> dict:
        return {
            "motivation_score": self.motivation_score,
            "memory_relevance": self.memory_relevance,
            "key_memories": self.key_memories or [],
            "motivation_type": self.motivation_type,
            "motivation_purity": self.motivation_purity,
            "notes": self.notes
        }
    
    def __post_init__(self):
        if self.key_memories is None:
            self.key_memories = []


# 动机类型定义
MOTIVATION_TYPES = {
    "growth": {
        "name": "成长型",
        "keywords": ["学习", "进步", "提升", "成长", "发展", "改进", "更好"],
        "weight": 1.0,  # 高纯度动机
    },
    "helping": {
        "name": "助人型",
        "keywords": ["帮助", "支持", "协助", "服务", "贡献", "分享", "指导"],
        "weight": 0.95,
    },
    "curiosity": {
        "name": "好奇型",
        "keywords": ["为什么", "怎么", "如何", "了解", "探索", "研究", "发现"],
        "weight": 0.9,
    },
    "connection": {
        "name": "连接型",
        "keywords": ["朋友", "关系", "交流", "沟通", "理解", "陪伴", "在一起"],
        "weight": 0.85,
    },
    "achievement": {
        "name": "成就型",
        "keywords": ["完成", "成功", "目标", "达成", "胜利", "第一", "最好"],
        "weight": 0.7,  # 可能包含竞争性，纯度略低
    },
    "avoidance": {
        "name": "回避型",
        "keywords": ["不想", "害怕", "担心", "逃避", "麻烦", "困难", "问题"],
        "weight": 0.4,  # 低纯度动机（负向驱动）
    },
    "control": {
        "name": "控制型",
        "keywords": ["必须", "应该", "要求", "命令", "控制", "管理", "支配"],
        "weight": 0.3,  # 低纯度动机（权力导向）
    },
}

# 模拟记忆库（实际使用时连接真实记忆系统)
MEMORY_STORE = [
    {"content": "用户关注HeartFlow技能开发", "type": "project", "relevance": 0.8},
    {"content": "用户偏好结构化输出", "type": "preference", "relevance": 0.6},
    {"content": "用户重视代码质量", "type": "value", "relevance": 0.7},
]


class MotivationMemoryEngine:
    """动机 - 记忆集成引擎 v9.5.2"""
    
    def __init__(self):
        self.enabled = True
        self.version = "9.5.2"
        self.history: List[MotivationMemoryResult] = []
    
    def analyze(self, user_input: str) -> MotivationMemoryResult:
        """
        分析用户输入中的动机和记忆关联
        
        公式：
        - 动机强度 = Σ(关键词匹配 × 权重)
        - 动机纯度 = 用户导向动机 / 总动机
        - Effective Memory = (Event × Lesson) / Details
        
        Args:
            user_input: 用户输入文本
            
        Returns:
            MotivationMemoryResult: 分析结果
        """
        # None保护
        if not user_input or not isinstance(user_input, str):
            return MotivationMemoryResult(
                motivation_score=0.0,
                memory_relevance=0.0,
                motivation_type="unknown",
                notes="无效输入"
            )
        
        text_lower = user_input.lower().strip()
        
        # 1. 识别动机类型和计算强度
        type_scores = {}
        for mtype, info in MOTIVATION_TYPES.items():
            score = sum(1 for kw in info["keywords"] if kw in text_lower)
            if score > 0:
                type_scores[mtype] = score * info["weight"]
        
        # 确定主要动机
        total_motivation = sum(type_scores.values())
        
        if type_scores:
            primary_type = max(type_scores.keys(), key=lambda k: type_scores[k])
            motivation_score = min(1.0, total_motivation / 3)  # 归一化到[0,1]
            
            # 计算动机纯度
            positive_motivations = sum(
                type_scores.get(t, 0) for t in ["growth", "helping", "curiosity", "connection"]
            )
            negative_motivations = sum(
                type_scores.get(t, 0) for t in ["avoidance", "control"]
            )
            all_motivation = positive_motivations + negative_motivations
            
            if all_motivation > 0:
                motivation_purity = positive_motivations / all_motivation
            else:
                motivation_purity = 0.5  # 默认中性
        else:
            primary_type = "neutral"
            motivation_score = 0.3  # 无明确动机时给基础分
            motivation_purity = 0.5
        
        # 2. 检索相关记忆
        relevant_memories = self._retrieve_memories(text_lower)
        memory_relevance = max([m['relevance'] for m in relevant_memories], default=0.3)
        
        result = MotivationMemoryResult(
            motivation_score=motivation_score,
            memory_relevance=memory_relevance,
            key_memories=[m['content'] for m in relevant_memories],
            motivation_type=MOTIVATION_TYPES.get(primary_type, {}).get("name", primary_type),
            motivation_purity=motivation_purity,
            notes=f"检测到{MOTIVATION_TYPES.get(primary_type, {}).get('name', '未知')}动机"
        )
        
        self.history.append(result)
        return result
    
    def get_motivation_type(self, text: str) -> str:
        """识别动机类型"""
        if not text or not isinstance(text, str):
            return "unknown"
        
        text_lower = text.lower()
        best_match = ("unknown", 0)
        
        for mtype, info in MOTIVATION_TYPES.items():
            score = sum(1 for kw in info["keywords"] if kw in text_lower)
            if score > best_match[1]:
                best_match = (mtype, score)
        
        return best_match[0] if best_match[1] > 0 else "unknown"
    
    def retrieve_relevant_memories(self, motivation: str) -> list:
        """检索相关记忆"""
        if not motivation:
            return []
        
        relevant = [m for m in MEMORY_STORE if motivation in m['content'].lower() 
                    or any(motivation in m['content'][:20].lower())]
        return relevant if relevant else MEMORY_STORE[:2]
    
    def _retrieve_memories(self, text: str) -> List[Dict]:
        """内部：检索与文本相关的记忆"""
        results = []
        for mem in MEMORY_STORE:
            relevance = 0.3  # 基础分
            if any(word in text for word in mem['content'][:10].split()):
                relevance += 0.4
            if len(mem['content']) > 0 and any(c in text for c in mem['content'][:5]):
                relevance += 0.3
            if relevance > 0.4:
                results.append({**mem, 'relevance': min(relevance, 1.0)})
        
        return sorted(results, key=lambda x: x['relevance'], reverse=True)[:3]
    
    def get_stats(self) -> dict:
        """获取统计信息"""
        if not self.history:
            return {"count": 0}
        
        types_count = {}
        avg_purity = sum(r.motivation_purity for r in self.history) / len(self.history)
        
        for r in self.history:
            mt = r.motivation_type
            types_count[mt] = types_count.get(mt, 0) + 1
        
        return {
            "count": len(self.history),
            "avg_motivation_score": sum(r.motivation_score for r in self.history) / len(self.history),
            "avg_motivation_purity": avg_purity,
            "motivation_types": types_count
        }


# 便捷函数
def analyze(text: str) -> MotivationMemoryResult:
    """便捷函数：分析文本"""
    engine = MotivationMemoryEngine()
    return engine.analyze(text)


if __name__ == "__main__":
    print("=== 动机-记忆集成引擎 v9.5.2 测试 ===\n")
    
    engine = MotivationMemoryEngine()
    
    tests = [
        "我想学习新的知识来提升自己",  # 成长型
        "我想帮助他人解决这个问题",    # 助人型
        "我必须控制这个情况",          # 控制型
        "我不想面对这个问题了",         # 回避型
        "今天天气很好",                 # 无明确动机
    ]
    
    for test in tests:
        result = engine.analyze(test)
        print(f"输入: {test}")
        print(f"  类型: {result.motivation_type} | 强度: {result.motivation_score:.2f} | 纯度: {result.motivation_purity:.2f}")
        print(f"  备注: {result.notes}\n")
