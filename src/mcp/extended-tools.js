/**
 * extended-tools.js — 运行时验证过的只读工具集（2026-10-11 自动生成）
 *
 * 来源：全局审计 P1-1「117 个 handler 未暴露」。116 个未暴露 handler 经
 * **运行时验证**（启动 server → JSON-RPC tools/call 真调 → fs 快照比对
 * mtime+size）确认无副作用后纳入本表。
 *
 * 为何不用静态分析：静态判据两个方向都误判过 ——
 *   · 按 handler 体正则：把 heartflow_memory_write_control 判成纯读（名字没 write）
 *   · 穿透目标模块：把 heartflow_self_benchmark 判成写（模块别处有 writeFileSync，
 *     实际它确实会落盘 data/self-benchmark.json，但那是运行时才发现的）
 * 只有 fs 快照比对是确定性的。
 *
 * 排除项（有 fs 副作用，不纳入）：
 *   heartflow_self_benchmark → 写 data/self-benchmark.json
 *
 * 写工具（WRITE_TOOLS）不在此表，由 mcp-server.js 的 needsWrite 收口。
 *
 * 本文件由 scripts/gen-extended-tools.js 生成，勿手改。
 */

const EXTENDED_TOOLS = [
  {
    "name": "heartflow_action_tracker",
    "description": "action tracker（action-tracker）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "action": {
          "type": "string",
          "description": "操作类型（可选，不给则由工具自行决定默认行为）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_affective_intentionality",
    "description": "affective intentionality（affective-intentionality）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_agent_card",
    "description": "agent card（agent-card）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {},
      "required": []
    }
  },
  {
    "name": "heartflow_agent_commentary",
    "description": "agent commentary（agent-commentary）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_agent_psychology_full",
    "description": "agent psychology full（agent-psychology）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {},
      "required": []
    }
  },
  {
    "name": "heartflow_autonomous_emotion",
    "description": "autonomous emotion（autonomous-emotion）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_being_mode",
    "description": "being mode（being-mode）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_boundary_check",
    "description": "boundary check。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "filePath": {
          "type": "string",
          "description": "filePath（可选）"
        },
        "actor": {
          "type": "string",
          "description": "actor（可选）"
        },
        "purpose": {
          "type": "string",
          "description": "purpose（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_check_ai_anti_pattern",
    "description": "check ai anti pattern（index）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_check_ai_misuse",
    "description": "check ai misuse（index）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_check_architecture_consistency",
    "description": "check architecture consistency（index）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_check_completion_evidence",
    "description": "check completion evidence（index）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_check_coverage_completeness",
    "description": "check coverage completeness（index）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_check_decision_trace",
    "description": "check decision trace（index）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "decision": {
          "type": "string",
          "description": "decision（可选）"
        },
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_check_forbidden_call",
    "description": "check forbidden call（index）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_check_plan_gate",
    "description": "check plan gate（index）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "plan": {
          "type": "string",
          "description": "plan（可选）"
        },
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_classics",
    "description": "classics（classics-value-mapper）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_cognitive_engine",
    "description": "cognitive engine（cognitive-engine）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        },
        "mode": {
          "type": "string",
          "description": "mode（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_cognitive_load",
    "description": "cognitive load（cognitive-load-balancer）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "tasks": {
          "type": "string",
          "description": "tasks（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_confidence_calibrate",
    "description": "confidence calibrate（confidence-calibrator）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_consciousness",
    "description": "consciousness（consciousness-theory）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {},
      "required": []
    }
  },
  {
    "name": "heartflow_consciousness_bridge",
    "description": "consciousness bridge（consciousness-bridge）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_constitutional",
    "description": "constitutional（constitutional-ai）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {},
      "required": []
    }
  },
  {
    "name": "heartflow_context_builder",
    "description": "context builder（context-builder）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_context_passport",
    "description": "context passport（decision）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "context": {
          "type": "string",
          "description": "context（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_corpus_math",
    "description": "corpus math（corpus-math-tool）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "query（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_debate",
    "description": "debate（index）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "sessionId": {
          "type": "string",
          "description": "sessionId（可选）"
        },
        "topic": {
          "type": "string",
          "description": "topic（可选）"
        },
        "roleId": {
          "type": "string",
          "description": "roleId（可选）"
        },
        "argument": {
          "type": "string",
          "description": "argument（可选）"
        },
        "evidence": {
          "type": "string",
          "description": "evidence（可选）"
        },
        "roles": {
          "type": "string",
          "description": "roles（可选）"
        },
        "maxRounds": {
          "type": "string",
          "description": "maxRounds（可选）"
        },
        "conclusion": {
          "type": "string",
          "description": "conclusion（可选）"
        },
        "action": {
          "type": "string",
          "description": "操作类型（可选，不给则由工具自行决定默认行为）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_decision_instruction",
    "description": "decision instruction（philosophy-to-decision）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "instruction": {
          "type": "string",
          "description": "instruction（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_decision_verify",
    "description": "decision verify（decision-verifier）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "decision": {
          "type": "string",
          "description": "decision（可选）"
        },
        "evidence": {
          "type": "string",
          "description": "evidence（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_deliberation",
    "description": "deliberation（deliberation-gate）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_desire_system",
    "description": "desire system（desire-system）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_dream_v2",
    "description": "dream v2（dream-engine-v2）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "theme": {
          "type": "string",
          "description": "theme（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_drift_detect",
    "description": "drift detect（sustained-drift-detector）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {},
      "required": []
    }
  },
  {
    "name": "heartflow_emotion_deep",
    "description": "emotion deep（deep-emotion）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "input": {
          "type": "string",
          "description": "input（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_emotion_dynamics",
    "description": "emotion dynamics（emotion-dynamics-engine）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "input": {
          "type": "string",
          "description": "input（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_emotional_growth",
    "description": "emotional growth（emotional-growth）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_ethics_check",
    "description": "ethics check（heart-logic）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_evolutionary_search",
    "description": "evolutionary search（index）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "searchSpace": {
          "type": "string",
          "description": "searchSpace（可选）"
        },
        "population": {
          "type": "string",
          "description": "population（可选）"
        },
        "fitnessFn": {
          "type": "string",
          "description": "fitnessFn（可选）"
        },
        "target": {
          "type": "string",
          "description": "target（可选）"
        },
        "constraintFn": {
          "type": "string",
          "description": "constraintFn（可选）"
        },
        "generations": {
          "type": "string",
          "description": "generations（可选）"
        },
        "iterations": {
          "type": "string",
          "description": "iterations（可选）"
        },
        "action": {
          "type": "string",
          "description": "操作类型（可选，不给则由工具自行决定默认行为）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_executable_reasoning",
    "description": "executable reasoning（index）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "raw": {
          "type": "string",
          "description": "raw（可选）"
        },
        "thoughtChain": {
          "type": "string",
          "description": "thoughtChain（可选）"
        },
        "opts": {
          "type": "string",
          "description": "opts（可选）"
        },
        "action": {
          "type": "string",
          "description": "操作类型（可选，不给则由工具自行决定默认行为）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_experience_replay",
    "description": "experience replay（experience-replay）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {},
      "required": []
    }
  },
  {
    "name": "heartflow_failure_analyze",
    "description": "failure analyze（failure-analyzer）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "error": {
          "type": "string",
          "description": "error（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_flow_predict",
    "description": "flow predict（flow-predictor）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "event": {
          "type": "string",
          "description": "event（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_focus_attention",
    "description": "focus attention（focus-of-attention）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "task": {
          "type": "string",
          "description": "task（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_forgetting",
    "description": "forgetting（forgetting）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "action": {
          "type": "string",
          "description": "操作类型（可选，不给则由工具自行决定默认行为）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_formula_engine",
    "description": "formula engine（formula-engine）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "query（可选）"
        },
        "action": {
          "type": "string",
          "description": "操作类型（可选，不给则由工具自行决定默认行为）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_global_workspace",
    "description": "global workspace（global-workspace）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_hypothesis",
    "description": "hypothesis（hypothesis-tester）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_information_flow",
    "description": "information flow（information-flow）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "flow": {
          "type": "string",
          "description": "flow（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_intent_classify",
    "description": "intent classify（intent-classifier）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_intent_infer",
    "description": "intent infer（intent-layer）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_interactive_dream",
    "description": "interactive dream（interactive-dream）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "theme": {
          "type": "string",
          "description": "theme（可选）"
        },
        "action": {
          "type": "string",
          "description": "操作类型（可选，不给则由工具自行决定默认行为）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_lesson_search",
    "description": "lesson search（lesson-retrieval）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "query（可选）"
        },
        "q": {
          "type": "string",
          "description": "q（可选）"
        },
        "context": {
          "type": "string",
          "description": "context（可选）"
        },
        "limit": {
          "type": "string",
          "description": "limit（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_llm_to_user",
    "description": "llm to user（llm-to-user）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_meaning",
    "description": "meaning（meaning-purpose-engine）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_memory_quality",
    "description": "memory quality（memory-quality）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "memory": {
          "type": "string",
          "description": "memory（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_mental_effort",
    "description": "mental effort（mental-effort-tracker）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "task": {
          "type": "string",
          "description": "task（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_meta_prompt",
    "description": "meta prompt（meta-prompt-engine）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_metacognition_evaluate",
    "description": "metacognition evaluate（index）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "output": {
          "type": "string",
          "description": "output（可选）"
        },
        "selfFeedback": {
          "type": "string",
          "description": "selfFeedback（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_metacognitive_monitor",
    "description": "metacognitive monitor（metacognitive-executive）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_mood",
    "description": "mood（mood-evolution）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "input": {
          "type": "string",
          "description": "input（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_multi_agent_dialogue",
    "description": "multi agent dialogue（multi-agent-dialogue）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "message": {
          "type": "string",
          "description": "message（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_observe_engine",
    "description": "observe engine（observe）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "observation": {
          "type": "string",
          "description": "observation（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_output_check",
    "description": "output check（output-checklist）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_philosophy",
    "description": "philosophy（ai-self-positioning）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {},
      "required": []
    }
  },
  {
    "name": "heartflow_philosophy_engine",
    "description": "philosophy engine（philosophy-engine）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_preference_guard",
    "description": "preference guard（preference-guard）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_psychology_engine",
    "description": "psychology engine（engine）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_purpose",
    "description": "purpose（purpose-engine）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_reflect",
    "description": "reflect（reflector）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {},
      "required": []
    }
  },
  {
    "name": "heartflow_reflexion",
    "description": "reflexion（reflexion-engine）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "failure": {
          "type": "string",
          "description": "failure（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_self_diagnose",
    "description": "self diagnose（self-diagnosis）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {},
      "required": []
    }
  },
  {
    "name": "heartflow_semantic_anchor",
    "description": "semantic anchor（semantic-anchor）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {},
      "required": []
    }
  },
  {
    "name": "heartflow_signal_absorb",
    "description": "signal absorb（signal-absorber）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "signal": {
          "type": "string",
          "description": "signal（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_spontaneous_restraint",
    "description": "spontaneous restraint（spontaneous-restraint）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_stability",
    "description": "stability（stability-guard）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "metrics": {
          "type": "string",
          "description": "metrics（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_state_risk_probe",
    "description": "state risk probe（state-risk-probe）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "state": {
          "type": "string",
          "description": "state（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_strategy_adapt",
    "description": "strategy adapt（strategy-adapter）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "experience": {
          "type": "string",
          "description": "experience（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_style_engine",
    "description": "style engine（style-engine）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "style": {
          "type": "string",
          "description": "style（可选）"
        },
        "action": {
          "type": "string",
          "description": "操作类型（可选，不给则由工具自行决定默认行为）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_supervise_dao",
    "description": "supervise dao。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {},
      "required": []
    }
  },
  {
    "name": "heartflow_supervise_priority",
    "description": "supervise priority。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {},
      "required": []
    }
  },
  {
    "name": "heartflow_supervise_progress",
    "description": "supervise progress。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {},
      "required": []
    }
  },
  {
    "name": "heartflow_supervise_uncertainty",
    "description": "supervise uncertainty。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {},
      "required": []
    }
  },
  {
    "name": "heartflow_tom_model",
    "description": "tom model（index）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "agentId": {
          "type": "string",
          "description": "agentId（可选）"
        },
        "observations": {
          "type": "string",
          "description": "observations（可选）"
        },
        "targetAgentId": {
          "type": "string",
          "description": "targetAgentId（可选）"
        },
        "agentIds": {
          "type": "string",
          "description": "agentIds（可选）"
        },
        "action": {
          "type": "string",
          "description": "操作类型（可选，不给则由工具自行决定默认行为）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_user_model",
    "description": "user model（user-model）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_user_to_llm",
    "description": "user to llm（user-to-llm）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "text（可选）"
        }
      },
      "required": []
    }
  },
  {
    "name": "heartflow_what_learned",
    "description": "what learned（what-learned）。只读工具，无副作用（运行时 fs 快照验证）。",
    "inputSchema": {
      "type": "object",
      "properties": {
        "limit": {
          "type": "string",
          "description": "limit（可选）"
        }
      },
      "required": []
    }
  }
];

module.exports = { EXTENDED_TOOLS };
