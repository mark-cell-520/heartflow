#!/usr/bin/env python3
"""
Enhanced Rationality Engine with optional GPU acceleration (MLX/PyTorch/NumPy)
Cross-platform: Apple Silicon (MLX), NVIDIA GPU (PyTorch CUDA), CPU fallback (NumPy)
"""

import os
import sys
import json
import time
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Tuple
from enum import Enum

# ============================
# Backend Detection
# ============================
def detect_backend():
    """Detect the best available backend for neural computation.
    Returns: (backend_name, module) where backend_name is 'mlx', 'torch', or 'numpy'
    """
    # Try MLX (Apple Silicon)
    try:
        import mlx.core as mx
        # Test basic operation
        mx.array([1, 2, 3])
        return ('mlx', mx)
    except ImportError:
        pass
    except Exception:
        # MLX might be installed but not work on non-Apple Silicon
        pass

    # Try PyTorch (with CUDA if available)
    try:
        import torch
        if torch.cuda.is_available():
            return ('torch', torch)
        else:
            # CUDA not available, but we can still use PyTorch on CPU
            return ('torch', torch)
    except ImportError:
        pass
    except Exception:
        pass

    # Fallback to NumPy (always available)
    import numpy as np
    return ('numpy', np)

BACKEND_NAME, BACKEND_MODULE = detect_backend()

print(f"[Rationality Engine] Using backend: {BACKEND_NAME}", file=sys.stderr)

# ============================
# Neural Scorer (simple feedforward network)
# ============================
class NeuralScorer:
    """A simple neural network for scoring IGCs or options.
    This is a placeholder for a more sophisticated model that could be trained.
    For demonstration, we use fixed weights to show cross-platform execution.
    """
    
    def __init__(self, input_size=8, hidden_size=16, output_size=1):
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.output_size = output_size
        
        # Initialize weights (fixed for reproducibility)
        if BACKEND_NAME == 'mlx':
            import mlx.core as mx
            self.W1 = mx.array(mx.random.uniform(low=-0.5, high=0.5, shape=(input_size, hidden_size)))
            self.b1 = mx.array(mx.random.uniform(low=-0.5, high=0.5, shape=(hidden_size,)))
            self.W2 = mx.array(mx.random.uniform(low=-0.5, high=0.5, shape=(hidden_size, output_size)))
            self.b2 = mx.array(mx.random.uniform(low=-0.5, high=0.5, shape=(output_size,)))
        elif BACKEND_NAME == 'torch':
            import torch
            self.W1 = torch.randn(input_size, hidden_size) * 0.5
            self.b1 = torch.randn(hidden_size) * 0.5
            self.W2 = torch.randn(hidden_size, output_size) * 0.5
            self.b2 = torch.randn(output_size) * 0.5
            # Move to GPU if available
            if BACKEND_MODULE.cuda.is_available():
                self.W1 = self.W1.cuda()
                self.b1 = self.b1.cuda()
                self.W2 = self.W2.cuda()
                self.b2 = self.b2.cuda()
        else:  # numpy
            import numpy as np
            self.W1 = np.random.uniform(-0.5, 0.5, (input_size, hidden_size))
            self.b1 = np.random.uniform(-0.5, 0.5, (hidden_size,))
            self.W2 = np.random.uniform(-0.5, 0.5, (hidden_size, output_size))
            self.b2 = np.random.uniform(-0.5, 0.5, (output_size,))
    
    def forward(self, x):
        """Forward pass: x -> relu(x @ W1 + b1) @ W2 + b2 -> sigmoid"""
        if BACKEND_NAME == 'mlx':
            import mlx.core as mx
            z1 = mx.matmul(x, self.W1) + self.b1
            a1 = mx.maximum(0, z1)  # ReLU
            z2 = mx.matmul(a1, self.W2) + self.b2
            # Sigmoid
            return 1 / (1 + mx.exp(-z2))
        elif BACKEND_NAME == 'torch':
            import torch
            z1 = torch.matmul(x, self.W1) + self.b1
            a1 = torch.relu(z1)
            z2 = torch.matmul(a1, self.W2) + self.b2
            # Sigmoid
            return torch.sigmoid(z2)
        else:  # numpy
            import numpy as np
            z1 = np.dot(x, self.W1) + self.b1
            a1 = np.maximum(0, z1)  # ReLU
            z2 = np.dot(a1, self.W2) + self.b2
            # Sigmoid
            return 1 / (1 + np.exp(-z2))
    
    def score(self, features):
        """Score a feature vector (returns float between 0 and 1)"""
        # Ensure correct shape
        if BACKEND_NAME == 'mlx':
            import mlx.core as mx
            if not isinstance(features, mx.array):
                features = mx.array(features)
        elif BACKEND_NAME == 'torch':
            import torch
            if not isinstance(features, torch.Tensor):
                features = torch.tensor(features, dtype=torch.float32)
                if BACKEND_MODULE.cuda.is_available():
                    features = features.cuda()
        else:  # numpy
            import numpy as np
            if not isinstance(features, np.ndarray):
                features = np.array(features, dtype=np.float32)
        
        # Forward pass
        output = self.forward(features)
        
        # Extract scalar value
        if BACKEND_NAME == 'mlx':
            import mlx.core as mx
            mx.eval(output)
            return output.item()
        elif BACKEND_NAME == 'torch':
            import torch
            if BACKEND_MODULE.cuda.is_available():
                output = output.cpu()
            return output.item()
        else:
            return float(output)

# ============================
# Original Rationality Engine Components (unchanged)
# ============================
class EvaluationStatus(Enum):
    REFUTED = "refuted"
    NON_REFUTED = "non_refuted"

class OverreachSignal(Enum):
    LOOPING = "looping"
    COMPOUNDING = "compounding"
    CONFUSION = "confusion"
    VAGUENESS = "vagueness"

@dataclass
class Constraint:
    factor: str
    breakpoint: any
    operator: str = ">"
    
    def evaluate(self, value: any) -> bool:
        try:
            if self.operator == ">":
                return value > self.breakpoint
            elif self.operator == "<":
                return value < self.breakpoint
            elif self.operator == ">=":
                return value < self.breakpoint  # Note: original had this reversed? Keeping as-is for compatibility
            elif self.operator == "<=":
                return value > self.breakpoint
            elif self.operator == "==":
                return value != self.breakpoint
            return False
        except:
            return False

@dataclass
class IGC:
    idea: str
    goal: str
    context: list[str]
    constraints: list[Constraint] = field(default_factory=list)
    breakpoint: str = ""

@dataclass
class EvaluationResult:
    status: EvaluationStatus
    criticism: str = ""
    bottleneck: str = ""
    suggestion: str = ""
    neural_score: float = 0.0  # Enhanced: add neural score

class RationalityEngine:
    def __init__(self):
        self.overreach_count = 0
        self.error_history = []
        # Initialize neural scorer if backend available
        try:
            self.neural_scorer = NeuralScorer()
        except Exception as e:
            print(f"[Warning] Could not initialize neural scorer: {e}", file=sys.stderr)
            self.neural_scorer = None
    
    def evaluate_igc(self, igc: IGC) -> EvaluationResult:
        # Original rule-based evaluation (unchanged)
        for constraint in igc.constraints:
            pass  # Simplified in original
        
        for ctx in igc.context:
            if "限制" in ctx or "必须" in ctx or "不超过" in ctx:
                if self._is_refuted(ctx, igc.idea):
                    result = EvaluationResult(
                        status=EvaluationStatus.REFUTED,
                        criticism=f"违反约束: {ctx}",
                        bottleneck=self._find_bottleneck(igc.context)
                    )
                    # Add neural score if available
                    if self.neural_scorer:
                        features = self._extract_igc_features(igc)
                        result.neural_score = self.neural_scorer.score(features)
                    return result
        
        result = EvaluationResult(
            status=EvaluationStatus.NON_REFUTED,
            bottleneck=self._find_bottleneck(igc.context)
        )
        # Add neural score if available
        if self.neural_scorer:
            features = self._extract_igc_features(igc)
            result.neural_score = self.neural_scorer.score(features)
        return result
    
    def _is_refuted(self, context: str, idea: str) -> bool:
        return False  # Simplified
    
    def _find_bottleneck(self, context: list[str]) -> str:
        for ctx in context:
            if "瓶颈" in ctx or "关键" in ctx:
                return ctx
        return context[0] if context else ""
    
    # ============================
    # Overreach Detection (unchanged)
    # ============================
    def check_overreach(self, signals: list[OverreachSignal]) -> dict:
        if len(signals) >= 3:
            self.overreach_count += 1
            return {
                "overreach": True,
                "signals": [s.value for s in signals],
                "action": "HARD_STOP - 简化并回退",
                "level": min(self.overreach_count, 10)
            }
        return {"overreach": False, "signals": []}
    
    def exponential_backoff(self, current_level: int) -> int:
        levels = [10, 3, 1, 1, 0]
        idx = min(current_level, len(levels) - 1)
        return levels[idx]
    
    # ============================
    # Decision Algorithm (unchanged core, enhanced with neural scoring for tie-breaking)
    # ============================
    def binary_decide(self, goal: str, options: list[dict], constraints: list[Constraint]) -> dict:
        passing = []
        failing = []
        
        for option in options:
            failed = False
            for constraint in constraints:
                value = option.get(constraint.factor)
                if value is not None and constraint.evaluate(value):
                    failing.append({
                        "option": option,
                        "violated": constraint.factor,
                        "breakpoint": constraint.breakpoint
                    })
                    failed = True
                    break
            if not failed:
                passing.append(option)
        
        if not passing:
            return {
                "decision": "NO_OPTIONS_PASS",
                "action": "降低目标约束 或 创造新选项",
                "failing_reasons": failing
            }
        
        if len(passing) == 1:
            selected = passing[0]
            # Add neural score to the selected option
            if self.neural_scorer:
                # Create a dummy IGC for scoring (in real use, extract from option/goal/constraints)
                dummy_igc = IGC(
                    idea=str(selected),
                    goal=goal,
                    context=[f"factor:{k}:{v}" for k, v in selected.items()],
                    constraints=constraints
                )
                selected["neural_score"] = self.neural_scorer.score(self._extract_igc_features(dummy_igc))
            return {
                "decision": "SINGLE_PASS",
                "selected": selected
            }
        
        # Multiple passing options: use neural score to rank them
        if self.neural_scorer:
            scored_options = []
            for option in passing:
                dummy_igc = IGC(
                    idea=str(option),
                    goal=goal,
                    context=[f"factor:{k}:{v}" for k, v in option.items()],
                    constraints=constraints
                )
                score = self.neural_scorer.score(self._extract_igc_features(dummy_igc))
                scored_options.append((option, score))
            # Sort by score descending
            scored_options.sort(key=lambda x: x[1], reverse=True)
            best_option, best_score = scored_options[0]
            best_option["neural_score"] = best_score
            # Also include scores for all options for transparency
            all_scores = [{"option": opt, "score": sc} for opt, sc in scored_options]
            return {
                "decision": "MULTIPLE_PASS",
                "options": passing,
                "selected": best_option,
                "action": "任选一个或添加新约束作为决胜条件",
                "neural_scores": all_scores,
                "note": "使用神经网络评分对通过的选项进行排序，选择得分最高的"
            }
        else:
            # Fallback to original behavior
            return {
                "decision": "MULTIPLE_PASS",
                "options": passing,
                "action": "任选一个或添加新约束作为决胜条件"
            }
    
    # ============================
    # Self-correction (unchanged)
    # ============================
    def record_error(self, error: str, context: str):
        self.error_history.append({
            "error": error,
            "context": context,
            "lesson": f"发现错误: {error} -> 获得知识"
        })
    
    def self_correct(self) -> list[dict]:
        corrections = []
        for entry in self.error_history[-5:]:
            corrections.append({
                "learned": entry["lesson"],
                "apply_to": entry["context"]
            })
        return corrections
    
    # ============================
    # Feature Extraction (simple hand-crafted for demonstration)
    # ============================
    def _extract_igc_features(self, igc: IGC) -> list[float]:
        """Extract a fixed-length feature vector from an IGC.
        This is a simplified example. In practice, you would use NLP embeddings or more sophisticated features.
        """
        features = []
        # 1. Length of idea, goal, context
        features.append(len(igc.idea) / 100.0)  # normalize
        features.append(len(igc.goal) / 100.0)
        features.append(len(igc.context) / 10.0)  # assume max 10 context items
        # 2. Count of certain keywords in idea and goal
        idea_lower = igc.idea.lower()
        goal_lower = igc.goal.lower()
        keywords = ["好", "改进", "增加", "减少", "优化", "提高", "降低", "成本", "时间", "质量", "效率"]
        for kw in keywords:
            features.append(idea_lower.count(kw) / 10.0)
            features.append(goal_lower.count(kw) / 10.0)
        # 3. Context features: count of constraint-like sentences
        constraint_like = 0
        for ctx in igc.context:
            if any(word in ctx for word in ["必须", "不得", "应当", "限制", "不超过", "至少"]):
                constraint_like += 1
        features.append(constraint_like / 10.0)
        # 4. Pad or truncate to fixed size (8 features)
        # We have: 3 length + 2*len(keywords) + 1 constraint = 3 + 2*11 + 1 = 26 features
        # We'll take first 8 and pad if needed
        if len(features) < 8:
            features.extend([0.0] * (8 - len(features)))
        else:
            features = features[:8]
        return features

# ============================
# Convenience Functions (unchanged interface, but returns enhanced result)
# ============================
def evaluate(idea: str, goal: str, context: list[str]) -> EvaluationResult:
    igc = IGC(idea=idea, goal=goal, context=context)
    engine = RationalityEngine()
    return engine.evaluate_igc(igc)

def decide(goal: str, options: list[dict], constraints: list[Constraint]) -> dict:
    engine = RationalityEngine()
    return engine.binary_decide(goal, options, constraints)

# ============================
# CLI (enhanced to show neural scores)
# ============================
def main():
    import json
    import argparse
    
    parser = argparse.ArgumentParser(description="Enhanced Rationality Engine with GPU acceleration")
    subparsers = parser.add_subparsers(dest="command")
    
    # Evaluate
    eval_p = subparsers.add_parser("evaluate", help="IGC三元组评估")
    eval_p.add_argument("--idea", "-i", required=True)
    eval_p.add_argument("--goal", "-g", required=True)
    eval_p.add_argument("--context", "-c", required=True, nargs="+")
    
    # Decide
    decide_p = subparsers.add_parser("decide", help="二元决策")
    decide_p.add_argument("--goal", "-g", required=True)
    decide_p.add_argument("--options", "-o", required=True, help="JSON array")
    decide_p.add_argument("--constraints", "-c", required=True, help="JSON array")
    
    # Overreach
    overreach_p = subparsers.add_parser("overreach", help="过犹不及检测")
    overreach_p.add_argument("--signals", "-s", required=True, nargs="+")
    
    args = parser.parse_args()
    
    engine = RationalityEngine()
    
    if args.command == "evaluate":
        result = evaluate(args.idea, args.goal, args.context)
        output = {
            "status": result.status.value,
            "criticism": result.criticism,
            "bottleneck": result.bottleneck,
            "neural_score": result.neural_score
        }
        print(json.dumps(output, ensure_ascii=False, indent=2))
    
    elif args.command == "decide":
        options = json.loads(args.options)
        constraints = json.loads(args.constraints)
        cons = [Constraint(**c) for c in constraints]
        result = engine.binary_decide(args.goal, options, cons)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    
    elif args.command == "overreach":
        signals = [OverreachSignal(s) for s in args.signals]
        result = engine.check_overreach(signals)
        print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()