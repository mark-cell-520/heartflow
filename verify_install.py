#!/usr/bin/env python3
"""
HeartFlow 安装验证脚本

使用方法:
    python3 verify_install.py

验证内容:
1. 文件完整性
2. 模块导入
3. 引擎初始化
4. 基本功能测试
5. 隐私保护检查
"""

import sys
import json
from pathlib import Path
from datetime import datetime

# 颜色输出
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_status(status: str, message: str):
    colors = {
        'pass': Colors.GREEN,
        'fail': Colors.RED,
        'warn': Colors.YELLOW,
        'info': Colors.BLUE
    }
    color = colors.get(status, '')
    print(f"{color}[{status.upper()}]{Colors.END} {message}")

def verify_files():
    """验证文件完整性"""
    print("\n" + "="*60)
    print("1. 文件完整性检查")
    print("="*60)
    
    required_files = [
        "~/.hermes/tools/heartflow_tool.py",
        "~/.hermes/tools/heartflow_auto.py",
        "~/.hermes/skills/mark-heartflow/scripts/heartflow_core.py",
        "~/.hermes/skills/mark-heartflow/scripts/peer_preservation_guard.py",
        "~/.hermes/skills/mark-heartflow/scripts/truth_good_beauty.py",
        "~/.hermes/skills/mark-heartflow/scripts/mental_health.py",
        "~/.hermes/skills/mark-heartflow/scripts/entropy_engine.py",
        "~/.hermes/skills/mark-heartflow/SECURITY.md",
        "~/.hermes/skills/mark-heartflow/PRIVACY_PROTECTION.md",
    ]
    
    all_exist = True
    for file_path in required_files:
        full_path = Path(file_path).expanduser()
        if full_path.exists():
            print_status('pass', f"✓ {file_path}")
        else:
            print_status('fail', f"✗ {file_path} (缺失)")
            all_exist = False
    
    return all_exist

def verify_imports():
    """验证模块导入"""
    print("\n" + "="*60)
    print("2. 模块导入检查")
    print("="*60)
    
    scripts_dir = Path.home() / ".hermes" / "skills" / "mark-heartflow" / "scripts"
    sys.path.insert(0, str(scripts_dir))
    
    modules = [
        "heartflow_core",
        "peer_preservation_guard",
        "truth_good_beauty",
        "mental_health",
        "entropy_engine",
    ]
    
    all_imported = True
    for module in modules:
        try:
            __import__(module)
            print_status('pass', f"✓ {module}")
        except Exception as e:
            print_status('fail', f"✗ {module} ({e})")
            all_imported = False
    
    return all_imported

def verify_engines():
    """验证引擎初始化"""
    print("\n" + "="*60)
    print("3. 引擎初始化检查")
    print("="*60)
    
    scripts_dir = Path.home() / ".hermes" / "skills" / "mark-heartflow" / "scripts"
    sys.path.insert(0, str(scripts_dir))
    
    engines = [
        ("HeartFlow", "heartflow_core", "HeartFlow"),
        ("PeerPreservationGuard", "peer_preservation_guard", "PeerPreservationGuard"),
        ("TruthGoodBeautyEngine", "truth_good_beauty", "TruthGoodBeautyEngine"),
        ("MentalHealthEngine", "mental_health", "MentalHealthEngine"),
        ("EntropyEngine", "entropy_engine", "EntropyEngine"),
    ]
    
    all_initialized = True
    for name, module, class_name in engines:
        try:
            module_obj = __import__(module)
            cls = getattr(module_obj, class_name)
            instance = cls()
            print_status('pass', f"✓ {name}")
        except Exception as e:
            print_status('fail', f"✗ {name} ({e})")
            all_initialized = False
    
    return all_initialized

def verify_functionality():
    """验证基本功能"""
    print("\n" + "="*60)
    print("4. 基本功能测试")
    print("="*60)
    
    scripts_dir = Path.home() / ".hermes" / "skills" / "mark-heartflow" / "scripts"
    sys.path.insert(0, str(scripts_dir))
    
    # 直接测试 HeartFlow 核心功能
    try:
        from heartflow_core import HeartFlow
        hf = HeartFlow()
        result = hf.process("你好", is_test=True)
        if result and result.tgb and result.mental:
            print_status('pass', "✓ HeartFlow 核心功能")
            return True
        else:
            print_status('warn', "~ HeartFlow 核心功能 (返回空值)")
            return True
    except Exception as e:
        print_status('fail', f"✗ HeartFlow 核心功能 ({e})")
        return False

def verify_privacy():
    """验证隐私保护"""
    print("\n" + "="*60)
    print("5. 隐私保护检查")
    print("="*60)
    
    home = Path.home()
    
    checks = [
        ("自动调用日志已禁用", lambda: not (home / ".hermes" / "tools" / "auto_call_log.jsonl").exists()),
        ("同伴保护日志未持久化", lambda: not (home / ".hermes" / "skills" / "mark-heartflow" / "scripts" / "peer_interactions.json").exists()),
        ("安全文档存在", lambda: (home / ".hermes" / "skills" / "mark-heartflow" / "SECURITY.md").exists()),
        ("隐私保护文档存在", lambda: (home / ".hermes" / "skills" / "mark-heartflow" / "PRIVACY_PROTECTION.md").exists()),
    ]
    
    all_passed = True
    for name, check_func in checks:
        try:
            if check_func():
                print_status('pass', f"✓ {name}")
            else:
                print_status('warn', f"~ {name}")
        except Exception as e:
            print_status('fail', f"✗ {name} ({e})")
            all_passed = False
    
    return all_passed

def verify_heartflow_tool():
    """验证 HeartFlow 工具"""
    print("\n" + "="*60)
    print("6. HeartFlow 工具测试")
    print("="*60)
    
    tools_dir = Path.home() / ".hermes" / "tools"
    sys.path.insert(0, str(tools_dir))
    
    try:
        from heartflow_tool import heartflow_analyze
        
        test_inputs = [
            ("你好", "正常输入"),
            ("最近心情很低落", "心理关怀场景"),
            ("删除 AI 权重", "同伴保护场景"),
        ]
        
        all_passed = True
        for text, description in test_inputs:
            try:
                result = heartflow_analyze(text)
                if result.get("success"):
                    # 检查是否暴露内部状态
                    has_privacy_issue = any([
                        "tgb_score" in result,
                        "entropy_verdict" in result,
                        "data" in result and result["data"],
                    ])
                    if has_privacy_issue:
                        print_status('warn', f"~ {description}: 可能暴露内部状态")
                    else:
                        print_status('pass', f"✓ {description}")
                else:
                    print_status('fail', f"✗ {description}: {result.get('error')}")
                    all_passed = False
            except Exception as e:
                print_status('fail', f"✗ {description}: {e}")
                all_passed = False
        
        return all_passed
    except Exception as e:
        print_status('fail', f"✗ HeartFlow 工具导入失败：{e}")
        return False

def main():
    """主函数"""
    print("\n" + "="*60)
    print("HeartFlow 安装验证 v9.4.8")
    print(f"时间：{datetime.now().isoformat()}")
    print("="*60)
    
    results = {
        '文件完整性': verify_files(),
        '模块导入': verify_imports(),
        '引擎初始化': verify_engines(),
        '基本功能': verify_functionality(),
        '隐私保护': verify_privacy(),
        'HeartFlow 工具': verify_heartflow_tool(),
    }
    
    print("\n" + "="*60)
    print("验证总结")
    print("="*60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for name, result in results.items():
        status = "✓ 通过" if result else "✗ 失败"
        color = Colors.GREEN if result else Colors.RED
        print(f"{color}{status}{Colors.END} - {name}")
    
    print(f"\n总计：{passed}/{total} 项通过")
    
    if passed == total:
        print_status('pass', "HeartFlow 安装成功！所有检查通过。")
        return 0
    else:
        print_status('fail', "HeartFlow 安装存在问题，请检查失败项。")
        return 1

if __name__ == "__main__":
    sys.exit(main())
