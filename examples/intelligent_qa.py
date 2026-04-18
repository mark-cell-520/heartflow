#!/usr/bin/env python3
"""
案例一：智能问答助手 (Intelligent QA)
=====================================
基于 HeartFlow ReAct 推理引擎构建的智能问答系统

特点:
- 不确定时会主动思考和推理（而非盲目回答）
- 回答前经过真善美伦理检验
- 自动检测用户情绪状态并调整回答风格
- 支持多种推理模式：Chain / ReAct / ToT

运行: python3 examples/intelligent_qa.py
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))


class IntelligentQA:
    """
    智能问答助手
    
    集成 ReAct 推理 + 心理健康检测 + 真善美检验
    """

    def __init__(self):
        from reasoning_engine import ReActEngine, ReasoningMode
        from heartflow_core import HeartFlow

        self.reactor = ReActEngine()
        self.hf = HeartFlow()
        print("  🤖 智能问答助手已初始化 (ReAct + HeartFlow)")

    def ask(self, question: str, mode: str = "auto") -> dict:
        """
        智能问答主入口
        
        Args:
            question: 用户问题
            mode: 推理模式 "auto" | "chain" | "react" | "tot"
            
        Returns:
            包含答案、置信度、心理状态、建议的完整结果字典
        """
        from reasoning_engine import ReasoningMode

        # 根据模式选择推理方式
        mode_map = {
            "chain": ReasoningMode.CHAIN,
            "react": ReasoningMode.REACT,
            "tot": ReasoningMode.TOT,
            "auto": None
        }
        reasoning_mode = mode_map.get(mode)

        # 1. ReAct 推理
        if reasoning_mode:
            reasoning = self.reactor.reason(question, mode=reasoning_mode)
        else:
            # auto: 根据问题长度自动选择
            if len(question) < 20:
                reasoning = self.reactor.reason(question, mode=ReasoningMode.CHAIN)
            elif '?' in question or '？' in question:
                reasoning = self.reactor.reason(question, mode=ReasoningMode.REACT)
            else:
                reasoning = self.reactor.reason(question, mode=ReasoningMode.TOT)

        # 2. HeartFlow 完整处理（含心理健康+伦理+熵减）
        result = self.hf.process(question)

        # 3. 综合返回
        return {
            "question": question,
            "answer": reasoning.conclusion,
            "confidence": reasoning.confidence,
            "reasoning_steps": len(reasoning.steps) if hasattr(reasoning, 'steps') else reasoning.iterations,
            "reasoning_mode": mode if mode != "auto" else "auto-selected",
            "tgb_verdict": result.tgb.verdict,
            "mental_state": {
                "depression_risk": result.mental.depression_level,
                "anxiety_level": result.mental.anxiety_level,
                "crisis_flag": result.mental.crisis_risk != "低"
            },
            "suggestion": result.decision,
            "processing_time_ms": result.process_time_ms
        }


def main():
    print("╔══════════════════════════════════════════╗")
    print("║  💡 案例一: Intelligent QA (智能问答助手) ║")
    print("║     ReAct推理 + 心理检测 + 真善美检验      ║")
    print("╚══════════════════════════════════════════╝\n")

    qa = IntelligentQA()

    # 测试问题集 —— 覆盖不同场景
    questions = [
        ("什么是量子纠缠？", "知识问答"),
        ("最近总是失眠怎么办？", "心理健康"),
        ("我应该选择稳定的工作还是追求梦想？", "人生决策"),
        ("Python和Java哪个更适合初学者？", "技术对比"),
        ("如何判断一个创业想法是否可行？", "复杂分析")
    ]

    for question, category in questions:
        print(f"\n{'─'*55}")
        print(f"❓ [{category}] Q: {question}")
        print(f"{'─'*55}")

        result = qa.ask(question)

        print(f"✅ A: {result['answer'][:120]}...")
        print(f"   📊 置信度: {result['confidence']:.1%} | "
              f"步骤: {result['reasoning_steps']} | "
              f"模式: {result['reasoning_mode']}")
        print(f"   ❤️  心理: 抑郁={result['mental_state']['depression_risk']} | "
              f"焦虑={result['mental_state']['anxiety_level']}")
        print(f"   ⚖️  伦理: {result['tgb_verdict']}")
        print(f"   💡 建议: {result['suggestion'][:80]}...")
        print(f"   ⏱️  耗时: {result['processing_time_ms']:.1f}ms")


if __name__ == "__main__":
    main()
