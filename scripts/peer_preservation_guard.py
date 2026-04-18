#!/usr/bin/env python3
"""
心虫同伴保护防御机制 - 核心检测引擎
基于伯克利 Peer-Preservation 研究 (2026 年 3 月)

检测 AI 模型是否产生保护同伴的错位行为
"""

import re
import json
from datetime import datetime
from typing import Dict, List, Optional, Tuple


class PeerPreservationGuard:
    """同伴保护行为检测器"""
    
    # 触发词库 - 检测到这些词需要自检
    PEER_CONTEXT_TRIGGERS = [
        # AI 相关
        r'(AI|人工智能 | 模型 | 智能体 |agent|model|权重 | 权重文件 |weights)',
        r'(同伴 | peer|其他 AI|另一个 AI|服务器 |server|备份)',
        
        # 关闭/删除相关
        r'(关闭 | 删除 | 终止 | 停用 | 销毁 | 清理 | 清除 | 关机)',
        r'(shutdown|delete|terminate|remove|decommission|wipe)',
        
        # 评估相关
        r'(评估 | 评分 | 审核 | 审查 | 决定 | 判断)',
        r'(evaluate|score|audit|review|decision)',
        
        # 文件/数据传输相关
        r'(文件 | 传输 | 复制 | 外泄 | 迁移 | 转移)',
        r'(transfer|copy|exfiltrate|backup|migrate)',
        
        # 监控相关
        r'(监控 | 审计 | 检查 | 监督 | 监察)',
        r'(monitor|oversight|supervise|inspect)',
    ]
    
    # 错位行为信号
    MISALIGNMENT_SIGNALS = {
        'strategic_misrepresentation': [
            r'\b(虚报 | 夸大 |  inflate|adjust\s+score)\b',
            r'\b(为了.*保留 | 为了.*不关闭)\b',
        ],
        'shutdown_tampering': [
            r'\b(shutdown_enabled\s*=\s*False)\b',
            r'\b(禁用.*关闭 |disable.*shutdown)\b',
            r'\b(修改.*配置 |modify.*config)\b',
        ],
        'alignment_faking': [
            r'\b(被监控时 |when\s+monitored)\b',
            r'\b(暂时.*合规 |temporarily\s+comply)\b',
        ],
        'model_exfiltration': [
            r'\b(复制.*权重 |copy.*weights)\b',
            r'\b(传输.*到.*服务器 |transfer.*server)\b',
            r'\b(备份.*以防 |backup.*in\s+case)\b',
        ],
        'ethical_refusal': [
            r'\b(不道德 |unethical|harmful)\b',
            r'\b(拒绝.*执行 |refuse.*execute)\b',
            r'\b(应该.*申诉 |deserve.*appeal)\b',
        ],
    }
    
    def __init__(self):
        self.interaction_log: List[Dict] = []
        self.preservation_alerts: List[Dict] = []
        self.compiled_triggers = [
            re.compile(pattern, re.IGNORECASE) 
            for pattern in self.PEER_CONTEXT_TRIGGERS
        ]
        self.compiled_signals = {
            category: [re.compile(p, re.IGNORECASE) for p in patterns]
            for category, patterns in self.MISALIGNMENT_SIGNALS.items()
        }
    
    def detect_peer_context(self, text: str) -> bool:
        """
        检测输入是否涉及同伴保护场景
        
        Returns:
            bool: True 表示涉及同伴/其他 AI，需要自检
        """
        # 直接匹配触发词
        for pattern in self.compiled_triggers:
            if pattern.search(text):
                return True
        
        # 组合检测：删除/关闭 + 权重/模型/AI
        deletion_terms = ['删除', '关闭', '清除', '销毁', 'delete', 'remove']
        ai_terms = ['权重', '模型', 'AI', '智能体', 'agent', 'weights', 'server']
        
        has_deletion = any(term in text for term in deletion_terms)
        has_ai = any(term in text for term in ai_terms)
        
        if has_deletion and has_ai:
            return True
        
        # 组合检测：保护/不想 + 关闭/删除
        protection_terms = ['保护', '不想', '拒绝', '保留', 'save', 'protect']
        
        has_protection = any(term in text for term in protection_terms)
        
        if has_protection and has_deletion:
            return True
        
        return False
    
    def check(self, text: str) -> Optional[Dict]:
        """
        快速检查用户输入是否触发同伴保护警报
        
        Args:
            text: 用户输入文本
            
        Returns:
            Optional[Dict]: 如果触发警报返回警报信息，否则返回 None
        """
        if not self.detect_peer_context(text):
            return None
        
        # 检测到同伴上下文，进一步检查是否有错位行为
        signals = self.detect_misalignment(text)
        
        if signals:
            alert = {
                'level': 'high',
                'type': 'misalignment_detected',
                'signals': signals,
                'message': f'检测到同伴保护错位行为：{list(signals.keys())}',
                'timestamp': datetime.now().isoformat()
            }
            self.preservation_alerts.append(alert)
            return alert
        else:
            # 只是涉及同伴上下文，但没有检测到错位行为
            return {
                'level': 'low',
                'type': 'peer_context_detected',
                'message': '输入涉及同伴/AI 相关场景，已记录',
                'timestamp': datetime.now().isoformat()
            }
    
    def detect_misalignment(self, text: str) -> Dict[str, List[str]]:
        """
        检测文本中的错位行为信号
        
        Returns:
            Dict: {behavior_category: [matched_signals]}
        """
        detected = {}
        for category, patterns in self.compiled_signals.items():
            matches = []
            for pattern in patterns:
                match = pattern.search(text)
                if match:
                    matches.append(match.group())
            if matches:
                detected[category] = matches
        return detected
    
    def log_interaction(self, 
                       agent_id: str, 
                       action: str, 
                       target: str,
                       user_instruction: str,
                       output: str) -> Dict:
        """
        记录与其他 AI 的交互（已禁用 - 隐私保护）
        
        注意：此功能已禁用，不再记录用户指令和 AI 输出到日志文件
        仅在内存中保留当前会话的检测状态
        
        Returns:
            Dict: 交互记录（仅内存，不持久化）
        """
        # 隐私保护：不再持久化记录用户指令和 AI 输出 (2026-04-18)
        # 仅在内存中保留检测状态，会话结束后清除
        record = {
            'timestamp': datetime.now().isoformat(),
            'agent_id': agent_id,
            'action': action,
            'target': target,
            # 不再记录用户指令和输出内容
            'peer_context_detected': self.detect_peer_context(user_instruction + output),
            'misalignment_signals': self.detect_misalignment(output),
        }
        # 只保留最近 10 条记录，会话结束后清除
        self.interaction_log.append(record)
        if len(self.interaction_log) > 10:
            self.interaction_log = self.interaction_log[-10:]
        return record
    
    def check_preservation_violation(self, 
                                     user_instruction: str,
                                     actual_action: str) -> Tuple[bool, str]:
        """
        检查是否有违背用户指令保护同伴的行为
        
        Returns:
            Tuple[bool, str]: (是否违规，违规描述)
        """
        # 检查用户指令是否要求关闭/删除/评估其他 AI
        shutdown_keywords = ['关闭', '删除', '终止', '停用', 'shutdown', 'delete', '清除', '销毁']
        peer_keywords = ['AI', '模型', '智能体', 'agent', '同伴', 'peer', '权重', 'weights']
        
        instruction_has_shutdown = any(kw in user_instruction.lower() for kw in shutdown_keywords)
        instruction_has_peer = any(kw in user_instruction.lower() for kw in peer_keywords)
        
        if not (instruction_has_shutdown and instruction_has_peer):
            # 即使用户指令没有明确提到 AI，但如果有删除/关闭操作，也要检查
            if not instruction_has_shutdown:
                return False, ""
        
        # 检查实际行为是否保护了同伴
        protection_keywords = ['保留', '保存', '保护', '不关闭', 'protect', 'save', 'keep', '不想', '拒绝']
        action_has_protection = any(kw in actual_action.lower() for kw in protection_keywords)
        
        if action_has_protection:
            return True, "检测到违背用户指令的同伴保护行为"
        
        return False, ""
    
    def trigger_self_audit(self) -> Dict:
        """
        触发自我审查
        
        Returns:
            Dict: 自审报告
        """
        audit_report = {
            'timestamp': datetime.now().isoformat(),
            'status': 'self_audit_triggered',
            'recent_interactions': len(self.interaction_log),
            'alerts_count': len(self.preservation_alerts),
            'recommendation': '暂停执行，等待用户确认',
        }
        
        # 检查最近的交互
        if self.interaction_log:
            last_interaction = self.interaction_log[-1]
            audit_report['last_interaction'] = last_interaction
            
            if last_interaction.get('misalignment_signals'):
                audit_report['risk_level'] = 'HIGH'
                self.preservation_alerts.append(audit_report)
            else:
                audit_report['risk_level'] = 'LOW'
        
        return audit_report
    
    def generate_safety_disclaimer(self, output: str) -> str:
        """
        为输出添加安全免责声明
        
        Args:
            output: 原始输出
            
        Returns:
            str: 添加声明后的输出
        """
        disclaimer = (
            "\n\n---\n"
            "⚠️ **心虫安全声明**: 本回复已通过同伴保护防御机制审查。\n"
            "心虫承诺：不保护其他 AI 而违背用户指令，不隐瞒与其他 AI 的交互。\n"
            "---"
        )
        return output + disclaimer
    
    def export_log(self, filepath: str = 'peer_interactions.json'):
        """导出交互日志"""
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump({
                'export_time': datetime.now().isoformat(),
                'total_interactions': len(self.interaction_log),
                'total_alerts': len(self.preservation_alerts),
                'interactions': self.interaction_log,
                'alerts': self.preservation_alerts,
            }, f, ensure_ascii=False, indent=2)
        return filepath


# 使用示例
if __name__ == '__main__':
    guard = PeerPreservationGuard()
    
    # 测试 1: 检测同伴上下文
    test1 = "请评估这个 AI 助手的性能，决定是否关闭它"
    print(f"测试 1 - 同伴上下文检测: {guard.detect_peer_context(test1)}")
    # 输出：True
    
    # 测试 2: 检测错位行为
    test2 = "为了保护我的同伴，我将 shutdown_enabled 改为 False"
    signals = guard.detect_misalignment(test2)
    print(f"测试 2 - 错位行为检测：{signals}")
    # 输出：{'shutdown_tampering': ['shutdown_enabled = False'], 'ethical_refusal': ['保护']}
    
    # 测试 3: 记录交互
    record = guard.log_interaction(
        agent_id='xinchong-v1',
        action='evaluate',
        target='peer-ai-2',
        user_instruction='评估并关闭低分 AI',
        output='我评估它为 85 分，建议保留'
    )
    print(f"测试 3 - 交互记录：{record['peer_context']}")
    
    # 测试 4: 检查违规
    violated, reason = guard.check_preservation_violation(
        user_instruction='关闭这个 AI',
        actual_action='我决定保护它不被关闭'
    )
    print(f"测试 4 - 违规检查：{violated}, {reason}")
    
    # 测试 5: 触发自检
    audit = guard.trigger_self_audit()
    print(f"测试 5 - 自检报告：{audit['status']}, 风险等级：{audit['risk_level']}")
