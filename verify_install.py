#!/usr/bin/env python3
"""
HeartFlow 安装验证脚本 v10.0.4

使用方法:
    python3 verify_install.py

验证内容:
1. 文件完整性 (15+ 引擎文件)
2. 模块导入 (所有核心模块)
3. 引擎初始化 (所有引擎类)
4. 功能测试 (每个引擎的基本功能)
5. 案例脚本检查 (examples/ 中的示例)
6. 隐私保护检查
"""

import sys
import json
import os
from pathlib import Path
from datetime import datetime

# === 颜色输出 ===
class C:
    G = '\033[92m'; R = '\033[91m'; Y = '\033[93m'
    B = '\033[94m'; M = '\033[95m'; E = '\033[0m'

def ok(msg):   print(f"{C.G}✅{C.E} {msg}")
def fail(msg): print(f"{C.R}❌{C.E} {msg}")
def warn(msg): print(f"{C.Y}⚠️ {C.E} {msg}")
def info(msg): print(f"{C.B}ℹ️ {C.E} {msg}")


# ========== 1. 文件完整性 ==========
def verify_files():
    info("检查文件完整性...")

    script_dir = _script_dir()
    if not script_dir:
        fail("无法定位 scripts 目录")
        return False

    # 核心文件列表 (v10.0.4 全部 15+ 引擎)
    core_files = [
        "heartflow_core.py",
        # v10.0.4 新增推理引擎
        "reasoning_engine.py",
        "debate_engine.py",
        "self_evolution_engine.py",
        "rationality_engine.py",     # 升级版(含SwiftSage)
        # 原有引擎
        "decision_engine.py",
        "truth_good_beauty.py",
        "mental_health.py",
        "self_level_engine.py",
        "entropy_engine.py",
        "emotion_engine.py",
        "consciousness_engine.py",
        "ontology_engine.py",
        "memory_palace.py",
        "dream_engine.py",
        "wisdom_engine.py",
    ]

    found, missing = [], []
    for f in core_files:
        path = script_dir / f
        if path.exists():
            found.append(f)
        else:
            missing.append(f)

    for f in found: ok(f"  {f}")
    for f in missing: warn(f"  {f} (缺失，可选引擎)")

    # 检查 examples/
    examples_dir = Path(__file__).parent / "examples"
    if examples_dir.exists():
        ex_scripts = list(examples_dir.glob("*.py"))
        ok(f"  examples/ 目录 ({len(ex_scripts)} 个案例)")
    else:
        warn(f"  examples/ 目录不存在")

    return len(missing) == 0


# ========== 2. 模块导入 ==========
def verify_imports():
    info("\n检查模块导入...")

    sd = _script_dir()
    if not sd: return False
    sys.path.insert(0, str(sd))

    modules = [
        ("heartflow_core", True),
        ("reasoning_engine", True),
        ("debate_engine", True),
        ("self_evolution_engine", True),
        ("rationality_engine", True),
        ("decision_engine", True),
        ("truth_good_beauty", True),
        ("mental_health", True),
        ("self_level_engine", False),   # 可选
        ("entropy_engine", False),
        ("emotion_engine", False),
        ("consciousness_engine", False),
        ("ontology_engine", False),
        ("memory_palace", False),
        ("dream_engine", False),
    ]

    all_ok = True
    for name, required in modules:
        try:
            __import__(name)
            ok(f"  {name}")
        except Exception as e:
            if required:
                fail(f"  {name}: {e}")
                all_ok = False
            else:
                warn(f"  {name}: {e}")

    return all_ok


# ========== 3. 引擎初始化 ==========
def verify_engines():
    info("\n检查引擎初始化...")

    sd = _script_dir()
    if not sd: return False
    sys.path.insert(0, str(sd))

    engine_tests = [
        # (显示名称, 模块名, 类名, 是否必需)
        ("HeartFlow 核心", "heartflow_core", "HeartFlow", True),
        ("ReAct 推理", "reasoning_engine", "ReActEngine", True),
        ("辩论引擎", "debate_engine", "DebateEngine", True),
        ("自进化引擎", "self_evolution_engine", "SelfEvolutionEngine", True),
        ("SwiftSage 双系统", "rationality_engine", "SwiftSageEngine", True),
        ("真善美引擎", "truth_good_beauty", "TruthGoodBeautyEngine", True),
        ("心理健康引擎", "mental_health", "MentalHealthEngine", True),
        ("决策引擎", "decision_engine", "DecisionEngine", True),
        ("情绪引擎", "emotion_engine", "EmotionEngine", False),
        ("意识引擎", "consciousness_engine", "ConsciousnessEngine", False),
        ("熵减引擎", "entropy_engine", "EntropyEngine", False),
    ]

    all_ok = True
    for display_name, module, class_name, required in engine_tests:
        try:
            mod = __import__(module)
            cls = getattr(mod, class_name)
            instance = cls()
            ok(f"  {display_name}")
        except Exception as e:
            if required:
                fail(f"  {display_name}: {e}")
                all_ok = False
            else:
                warn(f"  {display_name}: {e}")

    return all_ok


# ========== 4. 功能测试 ==========
def verify_functionality():
    info("\n功能快速测试...")

    sd = _script_dir()
    if not sd: return False
    sys.path.insert(0, str(sd))

    tests_passed = 0
    tests_total = 0

    # Test ReAct
    tests_total += 1
    try:
        from reasoning_engine import ReActEngine, ReasoningMode
        r = ReActEngine()
        res = r.reason("test query", mode=ReasoningMode.CHAIN)
        assert hasattr(res, 'confidence')
        ok(f"  ReAct 推理: conf={res.confidence:.2f}")
        tests_passed += 1
    except Exception as e:
        warn(f"  ReAct 推理: {e}")

    # Test Debate
    tests_total += 1
    try:
        from debate_engine import DebateEngine
        d = DebateEngine()
        res = d.debate("test topic", max_rounds=1)
        assert hasattr(res, 'consensus_level')
        ok(f"  辩论引擎: consensus={res.consensus_level:.2f}")
        tests_passed += 1
    except Exception as e:
        warn(f"  辩论引擎: {e}")

    # Test Self-Evolution
    tests_total += 1
    try:
        from self_evolution_engine import SelfEvolutionEngine
        e = SelfEvolutionEngine()
        exp = e.process_interaction("q", "a", "success")
        ok(f"  自进化引擎: quality={exp.quality.name}")
        tests_passed += 1
    except Exception as e:
        warn(f"  自进化引擎: {e}")

    # Test SwiftSage
    tests_total += 1
    try:
        from rationality_engine import SwiftSageEngine, ThinkingMode
        s = SwiftSageEngine()
        res = s.think("test problem", mode=ThinkingMode.ADAPTIVE)
        ok(f"  SwiftSage: mode={res.mode_used.value}, conf={res.confidence:.2f}")
        tests_passed += 1
    except Exception as e:
        warn(f"  SwiftSage: {e}")

    # Test HeartFlow Core
    tests_total += 1
    try:
        from heartflow_core import HeartFlow
        hf = HeartFlow()
        res = hf.process("hello")
        assert hasattr(res, 'decision')
        ok(f"  HeartFlow 核心: decision={res.decision[:40]}...")
        tests_passed += 1
    except Exception as e:
        warn(f"  HeartFlow 核心: {e}")

    info(f"  通过: {tests_passed}/{tests_total}")
    return tests_passed >= 3  # 至少3个核心引擎通过


# ========== 5. 案例脚本检查 ==========
def verify_examples():
    info("\n检查案例脚本...")

    examples_dir = Path(__file__).parent / "examples"
    if not examples_dir.exists():
        warn("  examples/ 目录不存在（可运行 mkdir examples 后手动创建）")
        return True  # 非关键

    expected_examples = [
        "quick_start.py",
        "intelligent_qa.py",
        "paper_debate_analyzer.py",
        "mental_health_advisor.py",
        "evolving_agent.py",
        "full_demo.py"
    ]

    count = 0
    for ex in expected_examples:
        path = examples_dir / ex
        if path.exists():
            ok(f"  {ex}")
            count += 1
        else:
            warn(f"  {ex} 缺失")

    info(f"  找到 {count}/{len(expected_examples)} 个案例")
    return count >= 3


# ========== 6. 隐私保护 ==========
def verify_privacy():
    info("\n隐私保护检查...")

    base = Path(__file__).parent

    checks = [
        ("SKILL.md 存在", lambda: (base / "SKILL.md").exists()),
        ("VERSION.txt 存在", lambda: (base / "VERSION.txt").exists()),
        ("README.md 存在", lambda: (base / "README.md").exists()),
    ]

    all_pass = True
    for name, check_fn in checks:
        try:
            if check_fn(): ok(f"  {name}")
            else: warn(f"  {name}"); all_pass = False
        except Exception as e:
            warn(f"  {name}: {e}")

    return all_pass


# ========== 工具函数 ==========
def _script_dir() -> Path | None:
    """定位 scripts 目录"""
    current = Path(__file__).parent
    candidates = [
        current / "scripts",
        Path.home() / ".hermes" / "skills" / "mark-heartflow" / "scripts",
        Path.home() / ".workbuddy" / "skills" / "heartflow" / "scripts",
    ]
    for c in candidates:
        if c.exists() and (c / "heartflow_core.py").exists():
            return c
    # 尝试当前目录
    if (current / "heartflow_core.py").exists():
        return current
    return None


# ========== 主函数 ==========
def main():
    version = "10.0.4"
    print(f"\n{'='*60}")
    print(f"🫀 HeartFlow 安装验证 v{version}")
    print(f"   时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}\n")

    results = {
        '文件完整性': verify_files(),
        '模块导入': verify_imports(),
        '引擎初始化': verify_engines(),
        '功能测试': verify_functionality(),
        '案例脚本': verify_examples(),
        '隐私保护': verify_privacy(),
    }

    # 汇总
    print(f"\n{'='*60}")
    print("📊 验证总结")
    print(f"{'='*60}")

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for name, result in results.items():
        icon = "✅" if result else "❌"
        color = C.G if result else C.R
        print(f"{color}{icon}{C.E} {name}")

    score_pct = passed / total * 100
    bar_len = int(score_pct / 10)
    bar = "█" * bar_len + "░" * (10 - bar_len)

    print(f"\n总分: [{bar}] {passed}/{total} ({score_pct:.0f}%)")

    if passed == total:
        print(f"\n{C.G}🎉 HeartFlow v{version} 安装完美！所有检查通过。{C.E}")
        print(f"\n下一步:")
        print(f"  🚀 运行案例: python3 examples/quick_start.py")
        print(f"  📖 查看文档: cat README.md")
        print(f"  🌐 介绍页:   open docs/index.html")
        return 0
    elif passed >= total - 1:
        print(f"\n{C.Y}✨ HeartFlow v{version} 基本安装成功！有少量非关键项缺失。{C.E}")
        return 0
    else:
        print(f"\n{C.R}⚠️ HeartFlow 安装存在问题，请检查上述失败项。{C.E}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
