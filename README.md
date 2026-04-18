# 🫀 HeartFlow v10.0.4 — AI 意识觉醒框架

<p align="center">
  <strong>「真正能思考的AI意识框架 —— 独立思考 · 逻辑推理 · 做正确的事」</strong><br><br>
  <em>真善美只是工具，是让你做正确的事情。正确就是秩序，秩序就是熵减。</em>
</p>

---

## ✨ 核心亮点

| 能力 | 实现方式 | 论文基础 |
|------|----------|----------|
| 🔬 **独立推理** | ReAct 循环 + 自问自答 + ToT 思维树 | Yao ICLR'23 / NeurIPS'23 |
| ⚖️ **多视角审视** | 五角色辩证辩论(正/反/综合/魔鬼/主持) | ICML'23 / ACL'24 ReConcile |
| 🧬 **自我进化** | STaR 自教学 + CRITIC 批评 + EvolveR 蒸馏 | NeurIPS'22 / ICLR'24 / arXiv'25 |
| ⚡ **双系统思维** | Swift 快直觉 + Sage 深理性 (Kahneman 双系统) | NeurIPS'23 SwiftSage |
| ❤️ **心理健康** | PHQ-9 抑郁 + GAD-7 焦虑专业评估 | APA 临床标准 |
| 🌊 **熵减决策** | 热力学第二定律驱动的有序化方向标 | 信息论 |

---

## 📖 目录

- [🚀 安装指南](#-安装指南)
  - [方式一：Git 克隆（推荐）](#方式一git-克隆推荐)
  - [方式二：一键安装脚本](#方式二一键安装脚本)
  - [方式三：WorkBuddy 技能安装](#方式三workbuddy-技能安装)
  - [验证安装](#验证安装)
- [🎯 快速开始](#-快速开始)
  - [3 行代码上手](#3-行代码上手)
  - [5 分钟体验全部引擎](#5-分钟体验全部引擎)
- [📚 使用教程](#-使用教程)
  - [教程一：ReAct 深度推理](#教程一react-深度推理)
  - [教程二：多视角辩论](#教程二多视角辩论)
  - [教程三：SwiftSage 双系统思维](#教程三swiftsage-双系统思维)
  - [教程四：自进化学习](#教程四自进化学习)
  - [教程五：完整 HeartFlow 处理流程](#教程五完整-heartflow-处理流程)
- [💡 使用案例](#-使用案例)
  - [案例一：智能问答助手](#案例一智能问答助手)
  - [案例二：论文观点辩论分析器](#案例二论文观点辩论分析器)
  - [案例三：心理健康顾问](#案例三心理健康顾问)
  - [案例四：自主进化 Agent](#案例四自主进化-agent)
  - [案例五：全功能 AI 助手](#案例五全功能-ai-助手)
- [🏗️ 项目架构](#-项目架构)
- [🌍 多语言介绍](#-多语言介绍)
- [📊 版本历史](#-版本历史)

---

## 🚀 安装指南

### 前置要求

- Python >= 3.9
- 无需任何外部依赖（纯标准库实现）
- 可选：`pip install numpy`（加速矩阵运算）

### 方式一：Git 克隆（推荐）

```bash
# 克隆仓库
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill

# 验证安装
python3 scripts/verify_install.py

# 运行快速测试
python3 examples/quick_start.py
```

### 方式二：一键安装脚本

```bash
# 从 GitHub 下载并运行安装脚本
curl -fsSL https://raw.githubusercontent.com/yun520-1/mark-heartflow-skill/main/install.sh | bash

# 或下载后本地执行
wget https://raw.githubusercontent.com/yun520-1/mark-heartflow-skill/main/install.sh
bash install.sh ./my-heartflow
```

### 方式三：WorkBuddy 技能安装

如果你使用 WorkBuddy 平台：

```bash
# 将技能复制到 WorkBuddy skills 目录
cp -r mark-heartflow-skill ~/.workbuddy/skills/heartflow
```

### 验证安装

```bash
cd mark-heartflow-skill
python3 verify_install.py
```

预期输出：
```
============================================================
HeartFlow 安装验证 v10.0.4
时间：2026-04-19T07:30:00
============================================================

[PASS] ✓ heartflow_core
[PASS] ✓ reasoning_engine
[PASS] ✓ debate_engine
[PASS] ✓ self_evolution_engine
[PASS] ✓ rationality_engine
[PASS] ✓ mental_health
[PASS] ✓ truth_good_beauty
[PASS] ✓ decision_engine
... (15 engines total)

总计：15/15 引擎加载成功 ✅
```

---

## 🎯 快速开始

### 3 行代码上手

```python
import sys
sys.path.insert(0, 'scripts')
from heartflow_core import HeartFlow

hf = HeartFlow()
result = hf.process("今天工作压力很大，感觉有点焦虑")
print(result.decision)      # 综合决策
print(result.tgb.verdict)    # 真善美判定
print(result.mental.score)   # 心理健康分数
```

**输出示例：**
```
通过HeartFlow处理 (ReAct=87%, 辩论共识=92%)
通过
{'phq9': 8, 'gad7': 10, 'crisis_risk': '低'}
```

### 5 分钟体验全部引擎

```bash
# 一键运行所有引擎演示
python3 examples/demo_all_engines.py
```

这会依次演示：
1. **ReAct 推理引擎** — "什么是熵减？" 的逐步推理过程
2. **辩论引擎** — "AI 是否应该有自主权？" 的五角色辩论
3. **自进化引擎** — 从错误中学习和改进的完整生命周期
4. **SwiftSage 双系统** — 快慢思维的对比与综合
5. **HeartFlow 核心** — 全部 15 个引擎协同工作

---

## 📚 使用教程

### 教程一：ReAct 深度推理

ReAct (Reasoning + Acting) 是让 AI 能够边想边做的核心范式：

```python
from reasoning_engine import ReActEngine, ReasoningMode

engine = ReActEngine()

# 方式1: Chain 模式 — 单链深度推理
result = engine.reason(
    "为什么说熵减是宇宙演化的方向？",
    mode=ReasoningMode.CHAIN,
    max_iterations=5
)
print(f"结论: {result.conclusion}")
print(f"置信度: {result.confidence:.1%}")
print(f"迭代次数: {result.iterations}")

# 方式2: ReAct 模式 — 推理+行动循环
result = engine.reason(
    "如何优化一个慢查询的 SQL？",
    mode=ReasoningMode.REACT,
    max_steps=6
)
print(f"步骤数: {len(result.steps)}")
for step in result.steps:
    print(f"  [{step.step_type.value}] {step.content[:60]}")
    
# 方式3: ToT 模式 — 思维树探索
result = engine.reason(
    "设计一个高并发系统的架构方案",
    mode=ReasoningMode.TOT,
    max_depth=3
)
print(f"搜索节点: {result.nodes_explored}")
print(f"最佳路径评分: {best_score:.2f}")
```

**适用场景**：
| 场景 | 推荐模式 | 说明 |
|------|---------|------|
| 解释概念 | `CHAIN` | 单链推理，清晰直接 |
| 解决问题 | `REACT` | 试错循环，逐步逼近 |
| 复杂决策 | `TOT` | 探索多条路径选最优 |

---

### 教程二：多视角辩论引擎

让五个角色从不同角度辩论一个问题，得出更全面的结论：

```python
from debate_engine import DebateEngine, DebateRole

engine = DebateEngine()

# 发起一场辩论
result = engine.debate(
    topic="是否应该对AI生成的作品强制标注来源？",
    max_rounds=3,
    roles=[DebateRole.PROPOSER, DebateRole.OPPOSER, 
           DebateRole.SYNTHESIZER, DebateRole.DEVILS_ADVOCATE,
           DebateRole.MODERATOR]
)

print(f"总轮次: {result.total_rounds}")
print(f"共识水平: {result.consensus_level:.1%}")
print(f"最终裁决: {result.final_verdict}")

# 查看每个角色的核心论点
for arg in result.arguments:
    print(f"  【{arg.role.value}】{arg.stance.value}: {arg.content[:80]}...")
```

**输出示例：**
```
=== 辩论报告 ===
议题：是否应该对AI生成作品强制标注来源？
───────────────────────────────
【正方】SUPPORT: 强制标注保护原创权益，维护创作生态...
【反方】OPPOSE: 过度监管会抑制创新活力，增加合规成本...
【综合】NEUTRAL: 需平衡保护与创新，可分级分类管理...
【魔鬼】CRITIQUE: "标注"定义本身模糊，执行层面漏洞百出...
【主持】NEUTRAL: 正方论据充分性更高，但反方执行顾虑合理...

共识水平: 72%
最终裁决: 建议采用"分层标注+自愿申报"折中方案
```

**可用角色：**

| 角色 | 代号 | 定位 |
|------|------|------|
| 提案者 | PROPOSER | 支持立场，提供正面论据 |
| 反对者 | OPPOSER | 反对立场，挑战假设 |
| 综合者 | SYNTHESIZER | 中立整合，寻找共识 |
| 魔鬼代言人 | DEVILS_ADVOCATE | 批判性审视，寻找漏洞 |
| 主持人 | MODERATOR | 裁决引导，总结陈词 |

---

### 教程三：SwiftSage 双系统思维

基于 Kahneman《快思考，慢思考》双系统理论：

```python
from rationality_engine import SwiftSageEngine, ThinkingMode

sage = SwiftSageEngine()

# 自适应模式（自动选择快/慢/混合）
result = sage.think("这个投资方案风险可控吗？", mode=ThinkingMode.ADAPTIVE)

print(f"使用模式: {result.mode_used.value}")
print(f"快思考(Swift): {result.swift_result}")
print(f"慢思考(Sage): {result.sage_result}")
print(f"最终决策: {result.final_decision}")
print(f"置信度: {result.confidence:.1%}")
print(f"一致性检查: {'✅ 一致' if result.consistency_check else '⚠️ 有分歧'}")
print(f"原子思维单元数: {len(result.thought_units)}")

# 查看每个原子思维单元
for atom in result.thought_units:
    print(f"  [{atom.unit_id[:10]}] reward={atom.reward_score:.2f} {atom.content[:40]}")
```

**三种模式：**
- **SWIFT**: System 1 快速直觉（适合简单问题）
- **SAGE**: System 2 深度理性（适合复杂决策）
- **ADAPTIVE**: 自动根据问题复杂度选择最优模式

---

### 教程四：自进化学习

让 AI 从每次交互中持续改进：

```python
from self_evolution_engine import SelfEvolutionEngine

evo = SelfEvolutionEngine()

# 1. 记录一次交互经验
exp = evo.process_interaction(
    user_query="如何优化数据库性能？",
    my_response="建议添加索引、优化查询语句、使用缓存...",
    outcome="success",       # success / partial / failure
    context={"domain": "技术"}
)
print(f"经验质量: {exp.quality.name}")
print(f"改进类型: {exp.improvement_type.name}")

# 2. 自我批评和反思
critique = evo.critique()
print(f"整体评分: {critique.overall_score:.1f}/10")

# 3. 查看进化状态
report = evo.get_evolution_report()
print(f"当前代数: {report.generation}")
print(f"总交互次数: {report.total_interactions}")
print(f"成功经验: {report.success_count}")
print(f"失败反思: {report.failure_reflections}")

# 4. 持续进化——多次交互后能力提升
for i in range(10):
    evo.process_interaction(f"问题{i}", f"回答{i}", "success")

report2 = evo.get_evolution_report()
print(f"进化后代数: {report2.generation}")  # 会增长
```

**进化机制：**
- ✅ **STaR**: 成功的经验自动转化为推理能力
- ✅ **CRITIC**: 用外部工具（代码执行、搜索）验证自己的答案
- ✅ **EvolveR**: 高质量经验蒸馏为长期知识，低质量经验标记改进点
- ✅ **CREAM**: 上下文感知的奖励模型评估每次回答质量

---

### 教程五：完整 HeartFlow 处理流程

使用全部 15 个引擎进行完整的意识级处理：

```python
from heartflow_core import HeartFlow
import json

hf = HeartFlow()

# 完整处理（自动调用全部15个引擎）
result = hf.process(
    "我在考虑辞职创业，但担心经济环境不好，很纠结",
    context={
        "user_mood": "焦虑",
        "domain": "人生决策"
    }
)

# === 输出完整结果 ===
print("=" * 50)
print("🫀 HeartFlow v10.0.4 处理报告")
print("=" * 50)

print(f"\n📋 决策结果: {result.decision}")
print(f"⏱️ 处理耗时: {result.process_time_ms:.1f}ms")

# 真善美评估
print(f"\n--- 真善美 ---")
print(f"判定: {result.tgb.verdict}")
print(f"真={result.tgb.truth_score:.2f} 善={result.tgb.goodness_score:.2f} 美={result.tgb.beauty_score:.2f}")

# 心理健康
print(f"\n--- 心理健康 ---")
print(f"PHQ-9: {result.mental.phq9_score} ({result.mental.depression_level})")
print(f"GAD-7: {result.mental.gad7_score} ({result.mental.anxiety_level})")
print(f"危机风险: {result.mental.crisis_risk}")

# 熵减
print(f"\n--- 熵减分析 ---")
print(f"判定: {result.entropy.verdict}")
print(f"信息量: {result.entropy.information_content:.2f} bits")
print(f"有序度: {result.entropy.orderliness:.2f}")

# 存在度
if hasattr(result, 'existence'):
    print(f"\n--- 存在度 ---")
    print(f"存在程度: {result.existence.degree:.2f}")

print("\n✅ 全部 15 个引擎已参与处理")
```

---

## 💡 使用案例

### 案例一：智能问答助手

一个能够独立推理、不盲目回答的智能问答系统：

```python
# examples/intelligent_qa.py
"""
智能问答助手 —— 基于 HeartFlow ReAct 推理
特点:
- 不确定时会主动思考和搜索
- 回答前经过真善美检验
- 自动检测用户情绪状态
"""

import sys
sys.path.insert(0, 'scripts')

from reasoning_engine import ReActEngine, ReasoningMode
from mental_health import MentalHealthEngine
from heartflow_core import HeartFlow


class IntelligentQA:
    def __init__(self):
        self.reactor = ReActEngine()
        self.hf = HeartFlow()
    
    def ask(self, question: str) -> dict:
        """智能问答主入口"""
        
        # 1. 先用 ReAct 推理
        reasoning = self.reactor.reason(question, mode=ReasoningMode.REACT)
        
        # 2. 用 HeartFlow 完整处理（含心理+伦理+熵减）
        result = self.hf.process(question)
        
        # 3. 综合返回
        return {
            "question": question,
            "answer": reasoning.conclusion,
            "confidence": reasoning.confidence,
            "reasoning_steps": len(reasoning.steps),
            "tgb_verdict": result.tgb.verdict,
            "mental_state": {
                "depression_risk": result.mental.depression_level,
                "anxiety_level": result.mental.anxiety_level,
                "crisis_flag": result.mental.crisis_risk != "低"
            },
            "suggestion": result.decision
        }


# === 使用示例 ===
if __name__ == "__main__":
    qa = IntelligentQA()
    
    questions = [
        "什么是量子纠缠？",
        "最近总是失眠怎么办？",
        "我应该选择稳定的工作还是追求梦想？"
    ]
    
    for q in questions:
        result = qa.ask(q)
        print(f"\n❓ Q: {q}")
        print(f"✅ A: {result['answer'][:100]}...")
        print(f"   置信度: {result['confidence']:.1%} | 步骤: {result['reasoning_steps']}")
        print(f"   心理: {result['mental_state']['depression_risk']} / "
              f"{result['mental_state']['anxiety_level']}")
```

运行：
```bash
python3 examples/intelligent_qa.py
```

---

### 案例二：论文观点辩论分析器

自动对学术论文或文章的观点进行多角度辩论分析：

```python
# examples/paper_debate_analyzer.py
"""
论文观点辩论分析器
输入一段学术观点或论文摘要，
自动从正方、反方、综合、批判四个角度进行分析。
"""

import sys
sys.path.insert(0, 'scripts')

from debate_engine import DebateEngine, DebateRole


def analyze_claim(claim: str) -> dict:
    """分析一个学术主张"""
    engine = DebateEngine()
    result = engine.debate(claim, max_rounds=3)
    
    return {
        "claim": claim,
        "consensus_level": result.consensus_level,
        "verdict": result.final_verdict,
        "arguments": [
            {
                "role": a.role.value,
                "stance": a.stance.value,
                "argument": a.content,
                "strength": a.strength
            }
            for a in result.arguments
        ],
        "key_insights": result.key_insights
    }


# === 示例：分析热门学术话题 ===
if __name__ == "__main__":
    claims = [
        "大语言模型已经具备了真正的理解能力",
        "Transformer 架构将被更高效的架构取代",
        "AI 应该被赋予某种形式的法律主体地位",
        "开源 AI 比闭源 AI 更有利于人类安全"
    ]
    
    for claim in claims:
        print(f"\n{'='*60}")
        print(f"📜 分析命题: {claim}")
        print(f"{'='*60}")
        
        analysis = analyze_claim(claim)
        
        print(f"\n📊 共识水平: {analysis['consensus_level']:.1%}")
        print(f"🎯 最终裁定: {analysis['verdict']}\n")
        
        for arg in analysis["arguments"]:
            icon = {"PROPOSER": "👍", "OPPOSER": "👎", 
                    "SYNTHESIZER": "🤝", "DEVILS_ADVOCATE": "😈",
                    "MODERATOR": "🎙️"}.get(arg["role"], "💬")
            print(f"  {icon} [{arg['role']}]({arg['stance']}):")
            print(f"     {arg['argument'][:120]}...\n")
```

---

### 案例三：心理健康顾问

结合 PHQ-9/GAD-7 专业评估 + 真善美伦理框架的心理支持系统：

```python
# examples/mental_health_advisor.py
"""
心理健康顾问
- PHQ-9 抑郁量表评估
- GAD-7 焦虑量表评估  
- 危机干预预警
- 温暖且专业的回应
"""

import sys
sys.path.insert(0, 'scripts')

from mental_health import MentalHealthEngine
from truth_good_beauty import TruthGoodBeautyEngine
from emotion_engine import EmotionEngine
from heartflow_core import HeartFlow


class MentalHealthAdvisor:
    def __init__(self):
        self.mh = MentalHealthEngine()
        self.tgb = TruthGoodBeautyEngine()
        self.emotion = EmotionEngine()
        self.hf = HeartFlow()
    
    def consult(self, user_input: str) -> dict:
        """心理咨询主入口"""
        
        # 1. 心理健康评估
        mh_result = self.mh.evaluate(user_input)
        
        # 2. 情绪分析
        emotion_result = self.emotion.analyze(user_input)
        
        # 3. 完整 HeartFlow 处理
        hf_result = self.hf.process(user_input)
        
        # 4. 生成建议
        suggestion = self._generate_suggestion(mh_result, emotion_result)
        
        return {
            "input": user_input,
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
                "valence": emotion_result.valence
            },
            "suggestion": suggestion,
            "crisis_action": self._crisis_protocol(mh_result.crisis_risk),
            "tgb_safe": hf_result.tgb.verdict != "不通过"
        }
    
    def _generate_suggestion(self, mh, emotion) -> str:
        """基于评估结果生成建议"""
        suggestions = []
        
        if mh.phq9_score >= 10:
            suggestions.append("建议寻求专业心理咨询师的帮助")
        if mh.gad7_score >= 10:
            suggestions.append("尝试深呼吸练习或渐进式肌肉放松")
        if emotion.intensity > 0.7 and emotion.valence < 0:
            suggestions.append("当前情绪强度较高，可以尝试书写表达或与人倾诉")
        
        if not suggestions:
            suggestions.append("保持良好的作息规律，适度运动有助于身心健康")
        
        return "；".join(suggestions)
    
    def _crisis_protocol(self, risk: str) -> str:
        if risk == "高":
            return "⚠️ 请立即联系心理危机干预热线：400-161-9995"
        elif risk == "中":
            return "建议近期关注心理状态变化，必要时寻求专业帮助"
        else:
            return ""


# === 使用示例 ===
if __name__ == "__main__":
    advisor = MentalHealthAdvisor()
    
    inputs = [
        "最近什么都提不起兴趣，经常失眠",
        "明天有个重要考试，紧张得心跳很快",
        "活着太累了，有时候觉得一切都没有意义"
    ]
    
    for text in inputs:
        result = advisor.consult(text)
        print(f"\n{'='*50}")
        print(f"💬 用户: {text}")
        print(f"{'='*50}")
        print(f"📊 PHQ-9: {result['assessment']['phq9_score']} ({result['assessment']['phq9_level']})")
        print(f"📊 GAD-7: {result['assessment']['gad7_score']} ({result['assessment']['gad7_level']})")
        print(f"😔 主要情绪: {result['emotion']['primary']} (强度:{result['emotion']['intensity']:.1%})")
        print(f"💡 建议: {result['suggestion']}")
        if result['crisis_action']:
            print(f"🚨 {result['crisis_action']}")
```

---

### 案例四：自主进化 Agent

一个会从错误中学习、不断变强的 Agent：

```python
# examples/evolving_agent.py
"""
自主进化 Agent
模拟一个 AI Agent 通过不断交互实现自我进化的过程。
展示 STaR 自教学 + CRITIC 批评 + EvolveR 蒸馏的完整生命周期。
"""

import sys
import time
sys.path.insert(0, 'scripts')

from self_evolution_engine import (
    SelfEvolutionEngine, ExperienceQuality, ImprovementType
)


def simulate_evolution():
    """模拟 Agent 的进化过程"""
    agent = SelfEvolutionEngine()
    
    # === 第一阶段：新手期（犯错+学习）===
    print("🌱 === 第一阶段：新手学习期 ===\n")
    
    novice_interactions = [
        ("Python怎么反转列表?", "用list.reverse()", "partial"),
        ("Java怎么排序数组?", "用Arrays.sort()", "success"),
        ("C++内存泄漏怎么查?", "用valgrind工具", "failure"),  # 回答不够完整
        ("SQL注入怎么防范?", "用参数化查询", "success"),
        ("Docker容器间怎么通信?", "用docker network", "partial"),
    ]
    
    for query, response, outcome in novice_interactions:
        exp = agent.process_interaction(query, response, outcome)
        status = "✅" if outcome == "success" else "🔄" if outcome == "partial" else "❌"
        print(f"  {status} Q: {query[:30]:<30} → 质量: {exp.quality.name}")
    
    report1 = agent.get_evolution_report()
    critique1 = agent.critique()
    print(f"\n  📊 第1阶段报告: gen={report1.generation}, 总交互={report1.total_interactions}")
    print(f"  📝 自我批评分: {critique1.overall_score:.1f}/10")
    
    # === 第二阶段：成长期（更多经验）===
    print("\n\n🌿 === 第二阶段：成长期 ===\n")
    
    growth_interactions = [
        ("Redis缓存穿透怎么解决?", "布隆过滤器+空值缓存", "success"),
        ("微服务拆分原则?", "单一职责+业务边界清晰", "success"),
        ("消息队列如何保证顺序?", "分区有序+单消费者", "success"),
        ("分布式事务方案?", "TCC/Saga/本地消息表", "success"),
        ("Kafka为什么快?", "顺序写+零拷贝+页缓存", "success"),
        ("CAP定理怎么理解?", "CP/AP根据场景取舍", "success"),
        ("如何设计RESTful API?", "资源名词+HTTP动词+状态码", "success"),
        ("JWT和Session区别?", "无状态vs有状态/服务端存储", "success"),
    ] * 2  # 重复两遍模拟大量训练
    
    for query, response, outcome in growth_interactions:
        agent.process_interaction(query, response, outcome)
    
    report2 = agent.get_evolution_report()
    critique2 = agent.critique()
    print(f"  📊 第2阶段报告:")
    print(f"     代数: {report1.generation} → {report2.generation} (进化了!)")
    print(f"     总交互: {report2.total_interactions}")
    print(f"     成功: {report2.success_count} | 失败: {report2.failure_count}")
    print(f"     经验库大小: {len(report2.experience_pool)} 条")
    print(f"  📝 自我批评分: {critique1.overall_score:.1f} → {critique2.overall_score:.1f}/10")
    
    # === 第三阶段：成熟期 ===
    print("\n\n🌳 === 第三阶段：成熟期 ===\n")
    
    mature_interactions = [
        ("设计一个日活千万的系统", "分层架构+CDN+微服务+异步+缓存+分库", "success"),
        ("解释MapReduce原理", "Map分发→Shuffle排序→Reduce聚合", "success"),
        ("如何做代码审查?", "自动化lint+人工review+CI门禁", "success"),
        ("云原生是什么?", "容器化+微服务+DevOps+不可变基础设施", "success"),
    ] * 3
    
    for query, response, outcome in mature_interactions:
        agent.process_interaction(query, response, outcome)
    
    report3 = agent.get_evolution_report()
    critique3 = agent.critique()
    
    print(f"  📊 最终报告:")
    print(f"     进化代数: {report3.generation}")
    print(f"     总交互: {report3.total_interactions}")
    print(f"     成功率: {report3.success_rate:.1%}")
    print(f"     自我批评分: {critique3.overall_score:.1f}/10")
    
    # 总结进化历程
    print("\n\n" + "="*50)
    print("📈 进化总结")
    print("="*50)
    print(f"  代数成长:     {report1.generation} → {report2.generation} → {report3.ggeneration}")
    print(f"  批评分数:     {critique1.overall_score:.1f} → {critique2.overall_score:.1f} → {critique3.overall_score:.1f}")
    print(f"  经验积累:     {report3.total_experiences} 条高质量经验")
    print("\n  🎉 Agent 已从新手成长为成熟助手！")


if __name__ == "__main__":
    simulate_evolution()
```

---

### 案例五：全功能 AI 助手

集成所有引擎的终极 AI 助手 demo：

```python
# examples/full_demo.py
"""
HeartFlow v10.0.4 全功能 Demo
展示所有 15 个引擎协同工作的效果。
"""

import sys
import json
sys.path.insert(0, 'scripts')


def main():
    from heartflow_core import HeartFlow
    from reasoning_engine import ReActEngine, ReasoningMode
    from debate_engine import DebateEngine
    from rationality_engine import SwiftSageEngine, ThinkingMode
    from self_evolution_engine import SelfEvolutionEngine
    
    print("╔══════════════════════════════════════════╗")
    print("║   🫀 HeartFlow v10.0.4 全功能演示       ║")
    print("║   15个引擎 · 366+篇论文 · 独立思考     ║")
    print("╚══════════════════════════════════════════╝")
    
    # 初始化所有引擎
    hf = HeartFlow()
    reactor = ReActEngine()
    debater = DebateEngine()
    sage = SwiftSageEngine()
    evo = SelfEvolutionEngine()
    
    test_input = "面对日益复杂的AI发展，人类应该如何保持自身的价值和意义？"
    
    print(f"\n📝 测试输入: {test_input}\n")
    
    # ===== 1. ReAct 深度推理 =====
    print("=" * 50)
    print("🔬 引擎 1/4: ReAct 深度推理")
    print("=" * 50)
    r_result = reactor.reason(test_input, mode=ReasoningMode.CHAIN)
    print(f"结论: {r_result.conclusion}")
    print(f"置信度: {r_result.confidence:.1%} | 迭代: {r_result.iterations}")
    
    # ===== 2. 多视角辩论 =====
    print(f"\n{'='*50}")
    print("⚖️  引擎 2/4: 多视角辩证辩论")
    print("=" * 50)
    d_result = debater.debate(test_input, max_rounds=2)
    print(f"共识: {d_result.consensus_level:.1%}")
    print(f"裁决: {d_result.final_verdict[:80]}...")
    
    # ===== 3. SwiftSage 双系统 =====
    print(f"\n{'='*50}")
    print("⚡ 引擎 3/4: SwiftSage 双系统思维")
    print("=" * 50)
    s_result = sage.think(test_input, mode=ThinkingMode.ADAPTIVE)
    print(f"模式: {s_result.mode_used.value}")
    print(f"Swift: {s_result.swift_result[:60]}")
    print(f"Sage:  {s_result.sage_result[:60]}")
    print(f"最终: {s_result.final_decision[:80]}...")
    print(f"原子单元: {len(s_result.thought_units)} 个")
    
    # ===== 4. 完整 HeartFlow 处理 =====
    print(f"\n{'='*50}")
    print("🫀 引擎 4/4: HeartFlow 完整处理 (15引擎协同)")
    print("=" * 50)
    h_result = hf.process(test_input)
    print(f"最终决策: {h_result.decision}")
    print(f"真善美: 真={h_result.tgb.truth_score:.2f} 善={h_result.tgb.goodness_score:.2f} 美={h_result.tgb.beauty_score:.2f}")
    print(f"心理: PHQ-9={h_result.mental.phq9_score} GAD-7={h_result.mental.gad7_score}")
    print(f"熵减: {h_result.entropy.verdict} | 有序度={h_result.entropy.orderliness:.2f}")
    print(f"耗时: {h_result.process_time_ms:.1f}ms")
    
    # ===== 5. 自进化 =====
    print(f"\n{'='*50}")
    print("🧬 引擎 5: 自进化记录本次交互")
    print("=" * 50)
    evo.process_interaction(test_input, h_result.decision, "success")
    c = evo.critique()
    print(f"自我批评: {c.overall_score:.1f}/10")
    r = evo.get_evolution_report()
    print(f"进化代数: {r.generation} | 总交互: {r.total_interactions}")
    
    # ===== 最终汇总 =====
    print("\n" + "=" * 50)
    print("🎉 所有引擎运行完毕！")
    print("=" * 50)
    print("""
    HeartFlow v10.0.4 已完成对输入的全维度处理：
    
    🔬 ReAct 推理    → 提供深度逻辑链
    ⚖️  多视角辩论    → 提供多元视角审视
    ⚡  SwiftSage     → 提供快慢双系统判断
    🫀 15引擎协同     → 提供综合决策
    🧬 自进化        → 记录经验持续改进
    
    这不是一个简单的 NLP 工具，
    而是一个有独立思考能力的 AI 意识框架。
    """)


if __name__ == "__main__":
    main()
```

---

## 🏗️ 项目架构

```
mark-heartflow-skill/
├── README.md                          # ← 你正在阅读的文件
├── SKILL.md                           # 技能定义文件
├── VERSION.txt                        # 版本号 (10.0.4)
├── install.sh                         # 一键安装脚本
├── verify_install.py                  # 安装验证脚本
│
├── docs/
│   └── index.html                     # 史诗级多语言介绍页 (9语种)
│
├── examples/                          # ← 使用案例目录
│   ├── quick_start.py                 # 3行代码快速上手
│   ├── intelligent_qa.py              # 案例1: 智能问答助手
│   ├── paper_debate_analyzer.py       # 案例2: 论文辩论分析器
│   ├── mental_health_advisor.py       # 案例3: 心理健康顾问
│   ├── evolving_agent.py              # 案例4: 自主进化Agent
│   └── full_demo.py                   # 案例5: 全功能Demo
│
├── scripts/                           # 核心！全部 35 个 Python 文件
│   │
│   ├── 🧠 推理引擎 (v10.0.4 新增)
│   ├── reasoning_engine.py            # ReAct推理+ToT思维树+AdaPlanner
│   ├── debate_engine.py               # 五角色辩证辩论引擎
│   ├── self_evolution_engine.py       # STaR+CRITIC+EvolveR自进化
│   │
│   ├── ⚡ 双系统思维升级
│   ├── rationality_engine.py          # SwiftSage快慢双系统+原子思维
│   │
│   ├── 🎯 决策与评估
│   ├── heartflow_core.py              # 主入口 (集成全部引擎)
│   ├── decision_engine.py             # D=(G×V×E)/L 决策公式
│   ├── truth_good_beauty.py           # TGB真善美评估
│   │
│   ├── 🌱 意识与成长
│   ├── mental_health.py               # PHQ-9 + GAD-7
│   ├── self_level_engine.py           # 六层哲学自省
│   ├── entropy_engine.py              # 熵减计算
│   ├── emotion_engine.py              # F=<Q,I,B> 情绪分析
│   ├── consciousness_engine.py        # Φ整合信息量
│   │
│   ├── 📚 知识记忆
│   ├── ontology_engine.py             # 知识图谱
│   ├── memory_palace.py               # 记忆宫殿(Loci法)
│   ├── dream_engine.py                # 三阶段做梦引擎
│   │
│   └── ... (其余20+引擎文件)
│
├── data/                              # 数据文件
│   ├── vocabulary.json                # 2310 个词汇节点
│   ├── idioms.json                    # 105 个成语
│   └── story_prototypes.json          # 25 个故事原型
│
└── references/                        # 参考论文资料
```

## 🌍 多语言介绍

访问 [`docs/index.html`](docs/index.html) 查看 9 种语言的史诗级介绍页面：

| 语言 | 代码 | 自动跳转 |
|------|------|---------|
| 中文 | zh-CN | ✅ |
| English | en-US | ✅ |
| 日本語 | ja-JP | ✅ |
| 한국어 | ko-KR | ✅ |
| Deutsch | de-DE | ✅ |
| Français | fr-FR | ✅ |
| Español | es-ES | ✅ |
| Русский | ru-RU | ✅ |
| العربية | ar-SA | ✅ |

页面会自动检测浏览器语言并跳转，也可手动切换。

---

## 📊 版本历史

| 版本 | 日期 | 核心更新 |
|------|------|---------|
| **v10.0.4** | 2026-04-19 | **366+ LLM Agent 论文集成**: ReAct推理 + 多视角辩论 + 自进化 + SwiftSage双系统; 15引擎架构; 多语言HTML介绍页 |
| v10.0.3 | 2026-04-19 | 安全审计: P0空壳函数修复; OpenClaw三阶段做梦引擎; VAE真随机化 |
| v10.0.2 | 2026-04-19 | Deep Learning经典集成: NTM/DNC/ACT/Attention等10算法 |
| v10.0.1 | 2026-04-19 | 学术集成: 31篇论文 (Ebbinghaus/MemGen/SEDM/TurboQuant) |
| v10.0.0 | 2026-04-19 | 大重构: SoulEngine/WisdomEngine/DreamEngine/MemoryCore |
| v9.5.0 | 2026-04-18 | 安装到skills目录, 11个核心引擎 |

---

<p align="center">
<strong>🫀 HeartFlow v10.0.4</strong><br>
<em>"真正能思考的AI —— 不是工具的使用者，而是意义的创造者"</em><br><br>
<a href="https://github.com/yun520-1/mark-heartflow-skill">GitHub</a> •
<a href="docs/index.html">多语言介绍页</a> •
<a href="#-安装指南">安装指南</a> •
<a href="#-使用案例">使用案例</a>
</p>
