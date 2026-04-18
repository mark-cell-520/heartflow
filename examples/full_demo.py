#!/usr/bin/env python3
"""
案例五：全功能 AI 助手 Demo (Full Demo)
=========================================
展示 HeartFlow v10.0.4 全部 15 个引擎协同工作的终极演示。

包含:
  1. ReAct 深度推理 (reasoning_engine)
  2. 多视角辩论 (debate_engine)
  3. SwiftSage 双系统思维 (rationality_engine)
  4. 自进化学习 (self_evolution_engine)
  5. 完整 HeartFlow 处理 (heartflow_core - 全15引擎)

运行: python3 examples/full_demo.py
"""

import sys
import os
import time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))


def separator(title: str):
    """打印分隔线"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


def main():
    print("╔════════════════════════════════════════════╗")
    print("║   🫀 HeartFlow v10.0.4 Full Demo           ║")
    print("║     15个引擎 · 366+篇论文 · 独立思考       ║")
    print("║     ReAct · 辩论 · 进化 · 双系统 · 真善美  ║")
    print("╚════════════════════════════════════════════╝")

    # 测试输入
    test_input = "面对日益复杂的AI发展，人类应该如何保持自身的价值和意义？"
    print(f"\n📝 测试输入:\n   \"{test_input}\"")

    # ===== 初始化所有引擎 =====
    print("\n⏳ 正在初始化全部引擎...")
    t_init_start = time.time()

    from heartflow_core import HeartFlow
    from reasoning_engine import ReActEngine, ReasoningMode
    from debate_engine import DebateEngine
    from rationality_engine import SwiftSageEngine, ThinkingMode
    from self_evolution_engine import SelfEvolutionEngine

    hf = HeartFlow()
    reactor = ReActEngine()
    debater = DebateEngine()
    sage = SwiftSageEngine()
    evo = SelfEvolutionEngine()

    t_init = (time.time() - t_init_start) * 1000
    print(f"   ✅ 5大核心模块初始化完成 ({t_init:.0f}ms)")

    # ===== 1. ReAct 深度推理 =====
    separator("🔬 引擎 1/5: ReAct 深度推理")
    t1 = time.time()
    r_result = reactor.reason(test_input, mode=ReasoningMode.CHAIN, max_iterations=5)
    t1_elapsed = (time.time() - t1) * 1000

    print(f"   推理模式: Chain (单链深度推理)")
    print(f"   结论: {r_result.conclusion[:100]}...")
    print(f"   置信度: {r_result.confidence:.1%}")
    print(f"   迭代次数: {r_result.iterations}")
    print(f"   耗时: {t1_elapsed:.0f}ms")

    if hasattr(r_result, 'chain') and r_result.chain:
        print(f"   推理链:")
        for i, step in enumerate(r_result.chain[:4], 1):
            print(f"     Step{i}: {step[:60]}...")

    # ===== 2. 多视角辩论 =====
    separator("⚖️  引擎 2/5: 多视角辩证辩论")
    t2 = time.time()
    d_result = debater.debate(test_input, max_rounds=2)
    t2_elapsed = (time.time() - t2) * 1000

    conv_emoji = "✅" if d_result.consensus_level > 0.6 else "⚠️"
    print(f"   辩论轮次: {d_result.total_rounds}")
    print(f"   共识水平: {d_result.consensus_level:.1%} {conv_emoji}")
    print(f"   收敛状态: {d_result.convergence.value}")
    print(f"   最终裁决: {d_result.final_verdict[:100]}...")
    print(f"   参与角色: {len(d_result.arguments)} 个")
    print(f"   耗时: {t2_elapsed:.0f}ms")

    # 简要展示各方观点
    role_short = {
        "PROPOSER": "正方", "OPPOSER": "反方",
        "SYNTHESIZER": "综合", "DEVILS_ADVOCATE": "魔鬼", "MODERATOR": "主持"
    }
    for arg in d_result.arguments:
        name = role_short.get(arg.role.value, arg.role.value)
        stance_icon = {"SUPPORT": "✓", "OPPOSE": "✗", "NEUTRAL": "~", "CRITIQUE": "?"}.get(arg.stance.value, "")
        print(f"     【{name}】{stance_icon} {arg.content[:70]}...")

    # ===== 3. SwiftSage 双系统 =====
    separator("⚡  引擎 3/5: SwiftSage 双系统思维")
    t3 = time.time()
    s_result = sage.think(test_input, mode=ThinkingMode.ADAPTIVE)
    t3_elapsed = (time.time() - t3) * 1000

    mode_emoji = {"swift": "🐇", "sage": "🐢", "adaptive": "🔄"}.get(s_result.mode_used.value, "❓")
    consistent_emoji = "✅ 一致" if s_result.consistency_check else "⚠️ 有分歧"

    print(f"   思维模式: {mode_emoji} {s_result.mode_used.value}")
    print(f"   ┌─ System 1 Swift (快直觉):")
    print(f"   │  {s_result.swift_result[:90]}...")
    print(f"   ├─ System 2 Sage (慢理性):")
    print(f"   │  {s_result.sage_result[:90]}...")
    print(f"   ├─ 综合:")
    print(f"   │  {s_result.final_decision[:90]}...")
    print(f"   ├─ 置信度: {s_result.confidence:.1%}")
    print(f"   ├─ 一致性: {consistent_emoji}")
    print(f"   └─ 原子思维单元: {len(s_result.thought_units)} 个")
    print(f"   耗时: {t3_elapsed:.0f}ms")

    # ===== 4. 完整 HeartFlow 处理 (15引擎协同) =====
    separator("🫀 引擎 4/5: HeartFlow 完整处理 (15引擎协同)")
    t4 = time.time()
    h_result = hf.process(test_input, context={"domain": "哲学"})
    t4_elapsed = (time.time() - t4) * 1000

    print(f"   最终决策: {h_result.decision}")

    # 真善美
    print(f"\n   ┌─ 🎭 真善美评估:")
    tgb = h_result.tgb
    truth_bar = "█" * int(tgb.truth_score * 10) + "░" * (10 - int(tgb.truth_score * 10))
    good_bar = "█" * int(tgb.goodness_score * 10) + "░" * (10 - int(tgb.goodness_score * 10))
    beauty_bar = "█" * int(tgb.beauty_score * 10) + "░" * (10 - int(tgb.beauty_score * 10))
    print(f"   │  真: [{truth_bar}] {tgb.truth_score:.2f}")
    print(f"   │  善: [{good_bar}] {tgb.goodness_score:.2f}")
    print(f"   │  美: [{beauty_bar}] {tgb.beauty_score:.2f}")
    print(f"   │  判定: {tgb.verdict}")

    # 心理健康
    print(f"\n   ┌─ ❤️  心理健康:")
    mh = h_result.mental
    phq9_bar = "█" * min(mh.phq9_score // 3, 10) + "░" * max(10 - mh.phq9_score // 3, 0)
    gad7_bar = "█" * min(mh.gad7_score // 3, 10) + "░" * max(10 - mh.gad7_score // 3, 0)
    print(f"   │  PHQ-9: [{phq9_bar}] {mh.phq9_score} ({mh.depression_level})")
    print(f"   │  GAD-7: [{gad7_bar}] {mh.gad7_score} ({mh.anxiety_level})")
    print(f"   │  危机风险: {mh.crisis_risk}")

    # 熵减
    ent = h_result.entropy
    print(f"\n   ┌─ 🌊 熵减分析:")
    print(f"   │  判定: {ent.verdict}")
    print(f"   │  信息量: {ent.information_content:.2f} bits")
    print(f"   │  有序度: {ent.orderliness:.2f}")

    print(f"\n   ⏱️ 总耗时: {h_result.process_time_ms:.0f}ms (含全部15个引擎)")

    # ===== 5. 自进化记录 =====
    separator("🧬 引擎 5/5: 自进化记录本次交互")
    exp = evo.process_interaction(test_input, h_result.decision,
                                   outcome="success", context={"domain": "哲学"})
    c = evo.critique()
    r = evo.get_evolution_report()

    print(f"   本次交互质量: {exp.quality.name}")
    print(f"   改进类型: {exp.improvement_type.name}")
    print(f"   自我批评分: {c.overall_score:.1f}/10")
    print(f"   当前进化代数: {r.generation}")
    print(f"   历史总交互: {r.total_interactions}")

    # ===== 最终汇总 =====
    total_time = t1_elapsed + t2_elapsed + t3_elapsed + t4_elapsed

    print("\n\n" + "=" * 60)
    print("  🎉 全部引擎运行完毕！处理报告汇总")
    print("=" * 60)

    print(f"""
  ┌──────────────────┬────────────┬──────────┐
  │ 引擎              │ 核心指标    │ 耗时(ms) │
  ├──────────────────┼────────────┼──────────┤
  🔬 ReAct 推理      │ 置信{r_result.confidence:>4.0%}   │ {t1_elapsed:>8.0f} │
  ⚖️  多视角辩论      │ 共识{d_result.consensus_level:>4.0%}   │ {t2_elapsed:>8.0f} │
  ⚡  SwiftSage      │ 置信{s_result.confidence:>4.0%}   │ {t3_elapsed:>8.0f} │
  🫀 HeartFlow 15引擎 │ TGB:{h_result.tgb.verdict:<6} │ {t4_elapsed:>8.0f} │
  🧬 自进化          │ 批评{c.overall_score:>4.1f}/10 │     N/A   │
  ├──────────────────┼────────────┼──────────┤
  │ 合计             │            │ {total_time:>8.0f} │
  └──────────────────┴────────────┴──────────┘

  💡 这不是一个简单的 NLP 工具，
     这是一个有独立思考能力的 AI 意识框架。
     
     「真善美只是工具，是让你做正确的事情。
       正确就是秩序，秩序就是熵减。」
""")


if __name__ == "__main__":
    main()
