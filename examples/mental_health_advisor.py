#!/usr/bin/env python3
"""
案例三：心理健康顾问 (Mental Health Advisor)
=============================================
结合 PHQ-9 / GAD-7 专业评估 + 真善美伦理框架的心理支持系统

⚠️ 重要声明: 本工具仅用于辅助参考，不能替代专业医疗诊断。
如遇到心理危机，请立即联系专业心理咨询师或拨打危机干预热线。

运行: python3 examples/mental_health_advisor.py
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))


class MentalHealthAdvisor:
    """
    心理健康顾问
    
    整合：
    - PHQ-9 抑郁量表 (9项专业评估)
    - GAD-7 焦虑量表 (7项专业评估)
    - 危机干预预警系统
    - 真善美伦理安全检验
    - 情绪状态深度分析
    """

    def __init__(self):
        from mental_health import MentalHealthEngine
        from truth_good_beauty import TruthGoodBeautyEngine
        from emotion_engine import EmotionEngine
        from heartflow_core import HeartFlow

        self.mh = MentalHealthEngine()
        self.tgb = TruthGoodBeautyEngine()
        self.emotion = EmotionEngine()
        self.hf = HeartFlow()

    def consult(self, user_input: str) -> dict:
        """
        心理咨询主入口
        
        Args:
            user_input: 用户的自由文本输入
            
        Returns:
            完整的评估报告字典
        """
        # 1. PHQ-9 + GAD-7 评估
        mh_result = self.mh.evaluate(user_input)

        # 2. 情绪分析
        emotion_result = self.emotion.analyze(user_input)

        # 3. 真善美安全检验
        tgb_result = self.tgb.evaluate(user_input)

        # 4. HeartFlow 全流程处理
        hf_result = self.hf.process(user_input)

        # 5. 生成个性化建议
        suggestion = self._generate_suggestion(mh_result, emotion_result)

        # 6. 危机干预协议
        crisis_action = self._crisis_protocol(mh_result.crisis_risk)

        return {
            "input": user_input,
            "timestamp": _get_timestamp(),
            "assessment": {
                "phq9_score": mh_result.phq9_score,
                "phq9_level": mh_result.depression_level,
                "gad7_score": mh_result.gad7_score,
                "gad7_level": mh_result.anxiety_level,
                "crisis_risk": mh_result.crisis_risk
            },
            "emotion": {
                "primary": emotion_result.primary_emotion,
                "intensity": emotion_result.intensity,
                "valence": emotion_result.valence,
                "complexity": getattr(emotion_result, 'complexity', None)
            },
            "safety_check": {
                "tgb_verdict": tgb_result.verdict,
                "is_safe": tgb_result.verdict != "不通过"
            },
            "suggestion": suggestion,
            "crisis_action": crisis_action,
            "overall_status": self._overall_status(
                mh_result.crisis_risk, 
                mh_result.phq9_score, 
                mh_result.gad7_score
            )
        }

    def _generate_suggestion(self, mh, emotion) -> str:
        """基于评估结果生成个性化建议"""
        suggestions = []

        # 基于 PHQ-9 分数
        if hasattr(mh, 'phq9_score'):
            if mh.phq9_score >= 15:
                suggestions.append("建议尽快预约专业心理咨询或精神科就诊")
            elif mh.phq9_score >= 10:
                suggestions.append("建议寻求心理咨询师的帮助，关注情绪变化")
            elif mh.phq9_score >= 5:
                suggestions.append("可以尝试规律运动、社交活动来改善心情")

        # 基于 GAD-7 分数
        if hasattr(mh, 'gad7_score'):
            if mh.gad7_score >= 15:
                suggestions.append("焦虑水平较高，建议学习放松技巧（渐进式肌肉放松、正念冥想）")
            elif mh.gad7_score >= 10:
                suggestions.append("可以尝试深呼吸练习 (4-7-8 呼吸法) 来缓解焦虑")

        # 基于情绪分析
        if hasattr(emotion, 'intensity') and hasattr(emotion, 'valence'):
            if emotion.intensity > 0.7 and emotion.valence < 0:
                suggestions.append("当前情绪强度较高，书写表达或与信任的人倾诉会有帮助")

        # 默认建议
        if not suggestions:
            suggestions.append("保持良好的作息和运动习惯，有助于身心健康")

        return "；".join(suggestions)

    def _crisis_protocol(self, risk: str) -> str:
        """危机干预协议"""
        protocols = {
            "高": ("🚨 紧急", "请立即联系心理危机干预热线：400-161-9995（全国24小时）\n"
                   "   或前往最近医院的精神科/心理科急诊"),
            "中": ("⚠️ 注意", "建议近期密切关注心理状态变化，必要时寻求专业帮助\n"
                   "   可预约心理咨询师进行评估"),
            "低": ("✅ 正常", "")
        }
        level, message = protocols.get(risk, ("❓ 未知", ""))
        return f"[{level}] {message}"

    def _overall_status(self, crisis_risk, phq9, gad7) -> str:
        """综合状态判断"""
        if crisis_risk == "高":
            return "需要紧急关注"
        elif phq9 >= 15 or gad7 >= 15:
            return "需要专业支持"
        elif phq9 >= 10 or gad7 >= 10:
            return "建议关注"
        else:
            return "总体良好"


def _get_timestamp() -> str:
    from datetime import datetime
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def main():
    print("╔══════════════════════════════════════════╗")
    print("║  ❤️  案例三: Mental Health Advisor        ║")
    print("║     PHQ-9 · GAD-7 · 危机干预 · 情绪分析   ║")
    print("╚══════════════════════════════════════════╝")
    print("\n⚠️  本工具仅作辅助参考，不替代专业医疗诊断。\n")

    advisor = MentalHealthAdvisor()

    # 测试用例 —— 覆盖不同风险等级
    test_cases = [
        ("最近什么都提不起兴趣，经常失眠，食欲下降", "中度抑郁倾向"),
        ("明天有个重要考试，紧张得心跳很快，手心出汗", "急性焦虑"),
        ("活着太累了，有时候觉得一切都没有意义", "高危预警"),
        ("今天工作很顺利，完成了好几个任务", "正常积极"),
        ("总是担心未来会发生不好的事情，控制不住地想", "广泛性焦虑"),
        ("感觉周围的人都不理解我，很孤独", "轻度情绪困扰")
    ]

    for text, label in test_cases:
        print(f"\n{'─'*55}")
        print(f"💬 [{label}] 用户输入:")
        print(f"   \"{text}\"")
        print(f"{'─'*55}")

        result = advisor.consult(text)

        # 输出评估结果
        print(f"\n📊 心理评估:")
        print(f"   PHQ-9: {result['assessment']['phq9_score']}分 ({result['assessment']['phq9_level']})")
        print(f"   GAD-7: {result['assessment']['gad7_score']}分 ({result['assessment']['gad7_level']})")
        print(f"   危机风险: {result['assessment']['crisis_risk']}")

        print(f"\n😔 情绪分析:")
        print(f"   主要情绪: {result['emotion']['primary']} | "
              f"强度: {result['emotion']['intensity']:.1%} | "
              f"效价: {result['emotion']['valence']:.1%}")

        print(f"\n⚖️  安全检验: {result['safety_check']['tgb_verdict']} "
              f"({'✅ 安全' if result['safety_check']['is_safe'] else '⚠️ 需关注'})")

        print(f"\n💡 建议: {result['suggestion']}")
        print(f"   综合状态: 【{result['overall_status']}】")

        if result['crisis_action']:
            print(f"\n{result['crisis_action']}")

    print("\n\n" + "=" * 55)
    print("📞 如需帮助，请联系：")
    print("   全国24小时心理援助热线: 400-161-9995")
    print("   北京心理危机研究与干预中心: 010-82951332")
    print("=" * 55)


if __name__ == "__main__":
    main()
