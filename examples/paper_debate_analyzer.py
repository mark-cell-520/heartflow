#!/usr/bin/env python3
"""
案例二：论文观点辩论分析器 (Paper Debate Analyzer)
===================================================
输入一段学术观点或论文摘要，
自动从正方、反方、综合、批判、主持五个角度进行分析。

基于: Multi-Agent Debate (ICML'23), ReConcile (ACL'24), ECON (ICML'25)

运行: python3 examples/paper_debate_analyzer.py
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))


def analyze_claim(claim: str, max_rounds: int = 3) -> dict:
    """
    分析一个学术主张
    
    Args:
        claim: 待分析的学术主张/观点
        max_rounds: 辩论轮数
        
    Returns:
        包含各角色论点、共识水平、最终裁决的完整分析结果
    """
    from debate_engine import DebateEngine

    engine = DebateEngine()
    result = engine.debate(claim, max_rounds=max_rounds)

    return {
        "claim": claim,
        "total_rounds": result.total_rounds,
        "consensus_level": result.consensus_level,
        "convergence": result.convergence.value if hasattr(result.convergence, 'value') else str(result.convergence),
        "verdict": result.final_verdict,
        "winning_perspective": result.winning_perspective or "无明确胜出",
        "arguments": [
            {
                "role": a.role.value,
                "role_icon": _get_role_icon(a.role.value),
                "stance": a.stance.value,
                "argument": a.content,
                "strength": round(a.strength, 2),
                "round": a.round
            }
            for a in result.arguments
        ],
        "key_insights": result.key_insights if hasattr(result, 'key_insights') else [],
        "summary": f"辩论{result.total_rounds}轮后，共识水平{result.consensus_level:.1%}，"
                   f"{'已收敛' if result.convergence.value in ['converged', 'partial'] else '持续分歧'}。"
                   f"裁决：{result.final_verdict[:100]}"
    }


def _get_role_icon(role_name: str) -> str:
    """获取角色对应的 emoji"""
    icons = {
        "PROPOSER": "👍",
        "OPPOSER": "👎",
        "SYNTHESIZER": "🤝",
        "DEVILS_ADVOCATE": "😈",
        "MODERATOR": "🎙️"
    }
    return icons.get(role_name, "💬")


def main():
    print("╔══════════════════════════════════════════════╗")
    print("║  ⚖️  案例二: Paper Debate Analyzer           ║")
    print("║     五角色辩证辩论 · 多视角学术分析          ║")
    print("╚══════════════════════════════════════════════╝\n")

    # 热门学术话题 —— 覆盖 AI 哲学/技术/伦理
    claims = [
        "大语言模型已经具备了真正的理解能力",
        "Transformer 架构将被更高效的架构取代",
        "AI 应该被赋予某种形式的法律主体地位",
        "开源 AI 比闭源 AI 更有利于人类安全",
        "AGI (通用人工智能) 将在 2030 年前实现"
    ]

    all_results = []

    for i, claim in enumerate(claims, 1):
        print(f"\n{'='*60}")
        print(f"📜 [{i}/{len(claims)}] 分析命题:")
        print(f"   \"{claim}\"")
        print(f"{'='*60}")

        analysis = analyze_claim(claim, max_rounds=2)

        # 输出概要
        print(f"\n📊 共识水平: {analysis['consensus_level']:.1%}")
        print(f"🔄 收敛状态: {analysis['convergence']}")
        print(f"🎯 最终裁定: {analysis['verdict'][:120]}")
        print(f"🏆 胜出视角: {analysis['winning_perspective']}")

        # 输出各方论点
        print(f"\n📋 各方论点:")

        for arg in analysis["arguments"]:
            icon = arg["role_icon"]
            role_display = {
                "PROPOSER": "正方(支持)",
                "OPPOSER": "反方(反对)",
                "SYNTHESIZER": "综合(中立)",
                "DEVILS_ADVOCATE": "魔鬼(批判)",
                "MODERATOR": "主持(裁决)"
            }.get(arg["role"], arg["role"])

            stance_icon = {"SUPPORT": "✅", "OPPOSE": "❌", "NEUTRAL": "⚪", "CRITIQUE": "⚠️"}
            s = stance_icon.get(arg["stance"], "")

            print(f"\n  {icon} 【{role_display}】({s} {arg['stance']}) [强度:{arg['strength']:.2f}]")
            # 缩进显示论点内容（自动换行）
            content = arg['argument']
            if len(content) > 100:
                content = content[:100] + "..."
            print(f"     {content}")

        # 关键洞察
        if analysis['key_insights']:
            print(f"\n💡 关键洞察:")
            for insight in analysis['key_insights'][:3]:
                print(f"   • {insight[:80]}")

        all_results.append(analysis)

    # 汇总对比
    print("\n\n" + "=" * 60)
    print("📈 全部命题分析汇总")
    print("=" * 60)
    print(f"{'命题':<35} {'共识':>8} {'状态':>10}")
    print("-" * 60)

    for r in all_results:
        claim_short = r['claim'][:33] + "..." if len(r['claim']) > 35 else r['claim']
        conv = "✅ 已收敛" if r['convergence'] in ['converged', 'partial'] else "⚠️ 分歧"
        print(f"{claim_short:<35} {r['consensus_level']:>7.1%} {conv:>10}")

    print(f"\n共分析 {len(all_results)} 个学术命题，每个经过 5 角色 × 2 轮 = 10+ 次论证")


if __name__ == "__main__":
    main()
