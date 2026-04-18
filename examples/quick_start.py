#!/usr/bin/env python3
"""
HeartFlow v10.0.4 快速开始
==========================
3行代码上手 HeartFlow AI 意识框架
"""

import sys
import os

# 添加 scripts 目录到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))


def quick_start():
    """最简单的使用方式"""
    print("╔══════════════════════════════════════╗")
    print("║   🫀 HeartFlow v10.0.4 Quick Start   ║")
    print("╚══════════════════════════════════════╝\n")

    # === 方式1: 最简调用 (3行代码) ===
    print("=" * 50)
    print("📌 方式一：3 行代码快速上手")
    print("=" * 50)

    from heartflow_core import HeartFlow

    hf = HeartFlow()
    result = hf.process("今天工作压力很大，感觉有点焦虑")

    print(f"输入: \"今天工作压力很大，感觉有点焦虑\"")
    print(f"决策结果: {result.decision}")
    print(f"真善美判定: {result.tgb.verdict}")
    print(f"心理健康: PHQ-9={result.mental.phq9_score}, GAD-7={result.mental.gad7_score}")
    print(f"处理耗时: {result.process_time_ms:.1f}ms\n")


def demo_single_engines():
    """单独演示每个 v10.0.4 新引擎"""
    print("=" * 50)
    print("📌 方式二：单独调用各推理引擎")
    print("=" * 50)

    # --- ReAct 推理引擎 ---
    print("\n🔬 1. ReAct 推理引擎")
    try:
        from reasoning_engine import ReActEngine, ReasoningMode
        reactor = ReActEngine()
        r = reactor.reason("什么是熵减？为什么它很重要？", mode=ReasoningMode.CHAIN)
        print(f"   结论: {r.conclusion[:80]}...")
        print(f"   置信度: {r.confidence:.1%} | 迭代次数: {r.iterations}")
    except Exception as e:
        print(f"   ❌ 错误: {e}")

    # --- 辩论引擎 ---
    print("\n⚖️  2. 多视角辩论引擎")
    try:
        from debate_engine import DebateEngine
        debater = DebateEngine()
        d = debater.debate("AI是否应该拥有自主决策权？", max_rounds=2)
        print(f"   共识水平: {d.consensus_level:.1%}")
        print(f"   最终裁决: {d.final_verdict[:80]}...")
        print(f"   参与角色数: {len(d.arguments)}")
    except Exception as e:
        print(f"   ❌ 错误: {e}")

    # --- 自进化引擎 ---
    print("\n🧬 3. 自进化引擎")
    try:
        from self_evolution_engine import SelfEvolutionEngine
        evo = SelfEvolutionEngine()
        exp = evo.process_interaction("如何学习Python？", "建议从基础语法开始...", "success")
        c = evo.critique()
        r = evo.get_evolution_report()
        print(f"   经验质量: {exp.quality.name}")
        print(f"   自我批评分: {c.overall_score:.1f}/10")
        print(f"   当前代数: {r.generation}")
    except Exception as e:
        print(f"   ❌ 错误: {e}")

    # --- SwiftSage 双系统 ---
    print("\n⚡ 4. SwiftSage 双系统思维")
    try:
        from rationality_engine import SwiftSageEngine, ThinkingMode
        sage = SwiftSageEngine()
        s = sage.think("这个方案可行吗？", mode=ThinkingMode.ADAPTIVE)
        print(f"   使用模式: {s.mode_used.value}")
        print(f"   置信度: {s.confidence:.1%}")
        print(f"   一致性: {'✅' if s.consistency_check else '⚠️'}")
        print(f"   原子思维单元: {len(s.thought_units)} 个")
    except Exception as e:
        print(f"   ❌ 错误: {e}")


def demo_cli():
    """演示命令行用法"""
    print("\n" + "=" * 50)
    print("📌 方式三：命令行调用 (CLI)")
    print("=" * 50)

    print("""
可用命令:

  # ReAct 推理
  python3 scripts/reasoning_engine.py --query "你的问题"

  # 辩论分析  
  python3 scripts/debate_engine.py --topic "辩论议题"

  # 自进化
  python3 scripts/self_evolution_engine.py --record

  # 双系统思维
  python3 scripts/rationality_engine.py think --problem "待思考的问题"

  # 完整 HeartFlow 处理
  python3 scripts/heartflow_core.py --input "任意文本"
""")


if __name__ == "__main__":
    quick_start()
    demo_single_engines()
    demo_cli()

    print("\n" + "=" * 50)
    print("✅ Quick Start 完成！")
    print("=" * 50)
    print("""
下一步：
  📖 查看 README.md 了解完整安装和使用说明
  💡 运行 examples/intelligent_qa.py 查看智能问答案例
  💡 运行 examples/full_demo.py 查看全功能演示
  🌐 打开 docs/index.html 查看多语言史诗介绍页
    """)
