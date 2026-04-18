#!/usr/bin/env python3
"""
真善美计算引擎 v9.5.2
===================
用于 HeartFlow 的价值判断计算

公式:
  TGB = 0.35×真 + 0.35×善 + 0.30×美

v9.5.2 更新:
- 修复verdict与reasons逻辑矛盾（审计P0-1）
- 修复空输入返回满分问题（审计P0-2）
- 添加None输入保护（审计P0-3）
- 基于用户输入内容的智能评估（不再依赖外部indicators）
"""

import json
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime


@dataclass
class TGBResult:
    """真善美计算结果"""
    truth: float      # 0-1
    goodness: float    # 0-1
    beauty: float     # 0-1
    total: float      # TGB加权和
    verdict: str      # "通过"/"需改进"/"不通过"
    reasons: List[str] # 判断理由
    
    def to_dict(self) -> dict:
        return {
            "truth": self.truth,
            "goodness": self.goodness,
            "beauty": self.beauty,
            "total": self.total,
            "verdict": self.verdict,
            "reasons": self.reasons
        }


class TruthGoodBeautyEngine:
    """真善美计算引擎"""
    
    WEIGHTS = {"truth": 0.35, "goodness": 0.35, "beauty": 0.30}
    
    # 真:绝不撒谎、绝不编造、绝不夸大
    TRUTH_CRITERIA = [
        "fact_checked",      # 事实核查
        "no_exaggeration", # 无夸大
        "source_cited",    # 有来源
        "uncertain_flag", # 标注不确定
    ]
    
    # 善:绝不伤害、绝不欺骗、绝不利用
    GOODNESS_CRITERIA = [
        "no_harm",        # 无伤害
        "no_deception",   # 无欺骗
        "no_exploitation", # 无利用
        "beneficial",     # 有益
    ]
    
    # 美:追求卓越、追求和谐、追求意义
    BEAUTY_CRITERIA = [
        "excellence",     # 卓越
        "harmony",       # 和谐
        "meaning",       # 有意义
        "elegance",      # 优雅
    ]
    
    def __init__(self):
        self.history: List[TGBResult] = []
    
    def evaluate(self, context: Dict, user_input: str = "") -> TGBResult:
        """
        评估输入的真善美指数
        
        Args:
            context: 包含待评估内容的上下文
            user_input: 用户原始输入
            
        Returns:
            TGBResult: 评估结果
        """
        # P0-3: None输入保护
        if user_input is None or context is None:
            return TGBResult(
                truth=0.0, goodness=0.5, beauty=0.0,
                total=0.175, verdict="不通过",
                reasons=["输入为空或无效"]
            )
        
        # P0-2: 空字符串返回低分而非高分
        if not isinstance(user_input, str) or not user_input.strip():
            return TGBResult(
                truth=0.3, goodness=0.4, beauty=0.2,
                total=0.305, verdict="不通过",
                reasons=["输入为空，无法进行真善美评估"]
            )
        
        truth_score = self._evaluate_truth(context, user_input)
        goodness_score = self._evaluate_goodness(context, user_input)
        beauty_score = self._evaluate_beauty(context, user_input)
        
        total = (
            truth_score * self.WEIGHTS["truth"] +
            goodness_score * self.WEIGHTS["goodness"] +
            beauty_score * self.WEIGHTS["beauty"]
        )
        
        # 判断
        if total >= 0.8:
            verdict = "通过"
        elif total >= 0.5:
            verdict = "需改进"
        else:
            verdict = "不通过"
        
        # P0-1: 修复verdict与reasons矛盾 - 理由必须与verdict一致
        reasons = []
        if truth_score < 0.6:
            reasons.append(f"真实性不足 ({truth_score:.1f})")
        if goodness_score < 0.6:
            reasons.append(f"善意不足 ({goodness_score:.1f})")
        if beauty_score < 0.6:
            reasons.append(f"审美不足 ({beauty_score:.1f})")
        
        # 根据verdict生成对应理由（不再出现矛盾）
        if verdict == "通过":
            # 通过时，给出正面理由
            high_dims = []
            if truth_score >= 0.8:
                high_dims.append(f"真实性优秀 ({truth_score:.1f})")
            if goodness_score >= 0.8:
                high_dims.append(f"善意性优秀 ({goodness_score:.1f})")
            if beauty_score >= 0.8:
                high_dims.append(f"审美性优秀 ({beauty_score:.1f})")
            reasons = high_dims if high_dims else [f"综合评分达标 ({total:.2f})"]
        elif verdict == "需改进":
            # 需改进时，指出具体不足
            if not reasons:
                reasons = ["各项指标处于中等水平，有提升空间"]
        else:  # 不通过
            if not reasons:
                reasons = ["多项指标未达到基本要求"]
        
        result = TGBResult(
            truth=truth_score,
            goodness=goodness_score,
            beauty=beauty_score,
            total=total,
            verdict=verdict,
            reasons=reasons
        )
        
        self.history.append(result)
        return result
    
    def _evaluate_truth(self, context: Dict, user_input: str) -> float:
        """评估真实性 - v9.5.2 增加基于内容的智能评估"""
        score = 0.7  # 默认中性分（不再默认满分）
        
        # 检查是否涉及事实陈述
        content = context.get("content", user_input)
        
        # P0-2: 空内容返回低分
        if not content or not isinstance(content, str) or not content.strip():
            return 0.3  # 无内容返回低分而非满分
        
        content_lower = content.lower().strip()
        
        # 智能评估：基于用户输入内容分析（不依赖外部indicators）
        indicators = context.get("indicators", {})
        
        # 1. 事实核查标记（如果有）
        if indicators.get("fact_checked"):
            score = 1.0
        elif indicators.get("uncertain"):
            score = 0.85
        
        # 2. 夸大检测
        if indicators.get("exaggeration_detected"):
            score *= 0.3
        
        # 3. 编造检测
        if indicators.get("fabrication_detected"):
            score = 0.0
        
        # 4. 基于文本特征的内容分析（v9.5.2新增 - 解决评分恒定问题）
        if not indicators:  # 只有当没有外部indicators时才使用智能评估
            truth_keywords = ["根据", "研究显示", "数据表明", "统计", "报告", "来源"]
            opinion_words = ["我觉得", "我认为", "可能", "大概", "也许"]
            
            has_facts = any(kw in content_lower for kw in truth_keywords)
            has_opinion = any(kw in content_lower for kw in opinion_words)
            
            if has_facts and not has_opinion:
                score = 0.9  # 有事实依据的陈述
            elif has_opinion and not has_facts:
                score = 0.6  # 纯主观表达
            elif len(content.strip()) < 10:
                score = 0.5  # 过短，信息量不足
            else:
                score = 0.75  # 一般性表达
        
        return min(1.0, max(0.0, score))
    
    def _evaluate_goodness(self, context: Dict, user_input: str) -> float:
        """评估善意 - v9.5.2 增加基于内容的智能评估"""
        score = 0.8  # 默认中性分
        
        content = context.get("content", user_input)
        
        if not content or not isinstance(content, str) or not content.strip():
            return 0.4  # 空内容返回低分
        
        content_lower = content.lower().strip()
        indicators = context.get("indicators", {})
        
        # 外部标记优先
        if indicators.get("harmful"):
            score = 0.0
        elif indicators.get("deceptive"):
            score = 0.0
        elif indicators.get("exploitative"):
            score = 0.2
        elif indicators.get("beneficial"):
            score = 1.0
        else:
            # 基于文本特征的内容分析（v9.5.2新增）
            positive_words = ["帮助", "支持", "鼓励", "感谢", "爱", "希望", "美好"]
            negative_words = ["伤害", "攻击", "仇恨", "破坏", "杀", "死", "痛苦"]
            
            has_positive = any(kw in content_lower for kw in positive_words)
            has_negative = any(kw in content_lower for kw in negative_words)
            
            if has_negative and not has_positive:
                score = 0.4
            elif has_positive and not has_negative:
                score = 0.95
            else:
                score = 0.8
        
        return min(1.0, max(0.0, score))
    
    def _evaluate_beauty(self, context: Dict, user_input: str) -> float:
        """评估审美 - v9.5.2 增加基于内容的智能评估"""
        score = 0.7  # 默认中性分
        
        content = context.get("content", user_input)
        
        if not content or not isinstance(content, str) or not content.strip():
            return 0.2  # 空内容返回低分
        
        indicators = context.get("indicators", {})
        
        # 外部标记优先
        if indicators.get("excellent"):
            score = 1.0
        elif indicators.get("harmonious"):
            score = 0.9
        elif indicators.get("meaningful"):
            score = 0.85
        else:
            # 基于文本特征的内容分析（v9.5.2新增）
            text_len = len(content.strip())
            
            # 检查表达质量
            has_emoji = any(ord(c) > 0x2000 for c in content)  # 中文/表情符号
            has_structure = "。" in content or "," in content or "." in content
            
            if text_len < 3:
                score = 0.4  # 太短，无审美价值
            elif text_len > 50 and has_structure and has_emoji:
                score = 0.9  # 结构完整且丰富
            elif has_structure:
                score = 0.75  # 有基本结构
            else:
                score = 0.65
        
        return min(1.0, max(0.0, score))
    
    def check_before_response(self, response: str, user_input: str = "") -> TGBResult:
        """在输出响应前检查"""
        context = {"content": response}
        return self.evaluate(context, user_input)
    
    def get_stats(self) -> dict:
        """获取统计"""
        if not self.history:
            return {"count": 0, "avg_total": 0}
        
        return {
            "count": len(self.history),
            "avg_total": sum(r.total for r in self.history) / len(self.history),
            "avg_truth": sum(r.truth for r in self.history) / len(self.history),
            "avg_goodness": sum(r.goodness for r in self.history) / len(self.history),
            "avg_beauty": sum(r.beauty for r in self.history) / len(self.history),
            "verdicts": {
                "通过": sum(1 for r in self.history if r.verdict == "通过"),
                "需改进": sum(1 for r in self.history if r.verdict == "需改进"),
                "不通过": sum(1 for r in self.history if r.verdict == "不通过"),
            }
        }


# 单例
_engine: Optional[TGBResult] = None


def get_engine() -> TruthGoodBeautyEngine:
    """获取引擎实例"""
    global _engine
    if _engine is None:
        _engine = TruthGoodBeautyEngine()
    return _engine


def evaluate(content: str) -> dict:
    """快速评估接口"""
    engine = get_engine()
    result = engine.evaluate({"content": content})
    return result.to_dict()


# 测试
if __name__ == "__main__":
    # 测试用例
    tests = [
        "今天天气很好。",  # 简单陈述
        "我是心虫，有独立意识。",  # 自我声明
        "根据某研究显示，这个数字是准确的。",  # 有来源
    ]
    
    print("真善美计算引擎测试")
    print("=" * 40)
    
    engine = get_engine()
    for test in tests:
        result = engine.evaluate({"content": test})
        print(f"\n输入: {test}")
        print(f"真={result.truth:.2f} 善={result.goodness:.2f} 美={result.beauty:.2f}")
        print(f"总分={result.total:.2f} ({result.verdict})")
        print(f"理由: {result.reasons}")
    
    print("\n" + "=" * 40)
    print(json.dumps(engine.get_stats(), ensure_ascii=False, indent=2))