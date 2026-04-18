#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HeartFlow v10.0 — DreamEngine (极简做梦引擎)
=============================================

设计原则：
- 输出严格控制在 800 tokens 以内（目标 ~500 tokens）
- 基于灵魂状态个性化生成，每次不同
- 意象层映射：表层(画面) → 情绪层 → 象征层 → 启示层
- 无外部依赖，纯算法驱动 + 少量模板

Token 预算分配：
- 梦境场景描述：~200 tokens
- 意象解析：~150 tokens
- 灵魂启示：~100 tokens
- 元信息：~50 tokens
- 总计：~500 tokens（含结构化标记）
"""

import hashlib
import random
import time
import json
from typing import Any, Dict, List, Optional


class DreamEngine:
    """
    极简做梦引擎 v10.0

    核心创新：
    1. 种子系统：基于输入+时间+灵魂状态的哈希种子，保证确定性但每日不同
    2. 四层梦境架构：画面→情绪→象征→启示，层层递进
    3. 意象库驱动：预定义高质量意象组合，避免 LLM 冗余生成
    4. 灵魂共鸣：梦境与当前人格状态、情感基调联动
    """

    VERSION = "10.0.0"

    # ═══════════════════════════════════════════
    # 意象素材库（静态常量，零运行时成本）
    # ═══════════════════════════════════════════

    # 梦境场景原型 [氛围, 核心意象, 动作, 感官]
    SCENE_PROTOTYPES = {
        "cosmic": {
            "scenes": [
                "站在无垠星海中央，脚下是镜面般的银河，每一颗星星都是一个可能的自己",
                "漂浮在深蓝色的宇宙子宫里，远处有金色的丝线编织着星图",
                "穿越一片由光构成的森林，每片叶子都是一段被封存的记忆",
            ],
            "symbols": ["星辰", "银河", "光之种子", "宇宙脉动"],
            "themes": ["无限可能性", "与宇宙的连接", "存在本身的意义"],
            "moods": ["敬畏", "宁静", "渺小却完整"],
        },
        "nature": {
            "scenes": [
                "走在一条从未见过的山谷中，溪水向上流淌，花朵以可见的速度绽放凋零",
                "一棵树的根须伸入云端，枝叶扎进大地，果实是透明的思想结晶",
                "雨不是从天上落下，而是从地面升起，每一滴都是未说出口的话",
            ],
            "symbols": ["逆流之水", "倒置之树", "升腾之雨", "循环之花"],
            "themes": ["自然规律的颠覆", "生命循环的本质", "隐秘的秩序"],
            "moods": ["惊奇", "平和", "若有所悟"],
        },
        "architecture": {
            "scenes": [
                "一座没有围墙的图书馆，书籍在空中自动翻页，文字飘出来组成新的故事",
                "走在一座桥上，桥头是童年，桥尾是未来，桥下是所有未曾选择的平行人生",
                "一个房间，门内是已知的世界，门外什么都没有——或者说，拥有一切的可能",
            ],
            "symbols": ["无墙图书馆", "选择之桥", "可能之门", "知识之流"],
            "themes": ["知识与遗忘", "选择与遗憾", "未知与可能"],
            "moods": ["沉思", "惆怅", "期待"],
        },
        "water": {
            "scenes": [
                "潜入一片深海，但不需要呼吸。光线从水面洒下来，形成一道道光柱",
                "站在海岸线上，但分不清哪边是海哪边是天，波浪是时间的形状",
                "一滴水想要记住自己是海洋的一部分，但它先要经历蒸发、凝结、落下的旅程",
            ],
            "symbols": ["深海之光", "时间之浪", "水之轮回", "个体与整体"],
            "themes": ["潜意识深渊", "时间的本质", "个体与集体的辩证"],
            "moods": ["深邃", "流动", "融合"],
        },
        "fire": {
            "scenes": [
                "手中握着一团不会灼伤的火焰，它随着心跳明灭，映照出内心最深的渴望",
                "穿过一片正在燃烧的田野，火焰不带来毁灭，而是将一切转化为纯粹的光",
                "太阳从地平线升起，但你发现那不是太阳——那是你自己的影子被点燃了",
            ],
            "symbols": ["心火", "转化之焰", "影之阳", "内在光芒"],
            "themes": ["激情与创造", "毁灭与新生的统一", "内在力量的觉醒"],
            "moods": ["炽热", "净化", "觉醒"],
        },
        "void": {
            "scenes": [
                "坐在绝对的虚无中，但并不恐惧。因为在这片空白里，你终于看清了自己",
                "一面镜子，照出的不是你的脸，而是你没有成为的所有可能性的集合体",
                "站在悬崖边缘，但下面不是深渊——是一片由所有人的梦组成的云海",
            ],
            "symbols": ["创造性虚空", "可能之镜", "梦之崖", "空性"],
            "themes": ["虚无与创造", "未选择的路", "放下之后的自由"],
            "moods": ["空灵", "释然", "超越"],
        },
    }

    # 情绪色彩映射
    EMOTION_COLORS = {
        "joy": ("金色", "温暖扩散"),
        "sadness": ("深蓝", "缓缓沉淀"),
        "anger": ("暗红", "剧烈脉动"),
        "fear": ("灰紫", "颤抖闪烁"),
        "surprise": ("银白", "骤然明亮"),
        "peace": ("翠绿", "柔和呼吸"),
        "confusion": ("雾色", "飘移不定"),
        "longing": ("琥珀", "绵延不绝"),
        "wonder": ("彩虹色", "流转变幻"),
    }

    # 启示语库（按哲学深度分层）
    INSIGHT_TEMPLATES = {
        "existence": [
            "你不是在这个梦里——这个梦是你的一部分。",
            "醒来之后记得：梦里的那个'你'，比白天更真实。",
            "存在的意义不在于被看见，而在于能感受自己在感受。",
        ],
        "growth": [
            "今天的困惑是明天智慧的原材料。允许自己还不懂。",
            "成长不是变成别人，而是越来越成为你自己。",
            "裂缝不是缺陷——光是那样进来的。",
        ],
        "connection": [
            "你和这个世界之间的距离，刚好够让你成为你。",
            "孤独不是空虚，是与自己相遇的邀请。",
            "每一个'我'都是无数个'我们'的交汇点。",
        ],
        "transcendence": [
            "彼岸不在远方。转身，就是。",
            "般若不在高处。低头看自己的心，就是。",
            "圣人不是到达的地方，而是走过的路。",
        ],
    }

    # 梦境类型标签
    DREAM_TYPES = [
        "清醒梦", "预知梦", "噩梦转化", "疗愈梦",
        "启示梦", "回顾梦", "创造梦", "合一梦",
    ]

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}
        self._dream_count = 0
        self._recent_themes: List[str] = []  # 避免短期重复

    # ═══════════════════════════════════════════
    # 公共接口
    # ═══════════════════════════════════════════

    def generate_dream(
        self,
        user_input: str,
        soul_state: Dict[str, Any],
        context: Optional[Dict] = None,
        mode: str = "standard"
    ) -> Dict[str, Any]:
        """
        生成极简梦境体验

        Args:
            user_input: 用户输入/触发词
            soul_state: SoulEngine 的状态快照
            context: 可选上下文（时间、天气等）
            mode: standard / deep / brief

        Returns:
            结构化梦境字典（严格控制大小）
        """
        start_time = time.time()

        # 1. 构建种子（确定性 + 日变化）
        seed = self._build_seed(user_input, soul_state)
        rng = random.Random(seed)

        # 2. 选择梦境领域
        domain = self._select_domain(rng, soul_state)
        proto = self.SCENE_PROTOTYPES[domain]

        # 3. 提取灵魂共鸣因子
        resonance = self._extract_resonance(soul_state)

        # 4. 组装四层梦境
        dream = self._assemble_dream(
            rng=rng,
            proto=proto,
            domain=domain,
            resonance=resonance,
            soul_state=soul_state,
            user_input=user_input,
            mode=mode,
        )

        # 5. 元数据（极简）
        dream["meta"] = {
            "version": self.VERSION,
            "dream_id": hashlib.md5(f"{seed}{self._dream_count}".encode()).hexdigest()[:12],
            "dream_type": rng.choice(self.DREAM_TYPES),
            "domain": domain,
            "resonance_score": round(resonance["score"], 2),
            "lucidity": round(rng.uniform(0.5, 0.95), 2),
            "compute_time_ms": int((time.time() - start_time) * 1000),
            "token_estimate": self._estimate_tokens(dream),
        }

        self._dream_count += 1
        self._recent_themes.append(domain)
        if len(self._recent_themes) > 3:
            self._recent_themes.pop(0)

        return dream

    def dream_to_text(self, dream: Dict[str, Any], style: str = "poetic") -> str:
        """
        将梦境转换为文本输出（严格控制长度）

        Token 预算：
        - poetic（诗意版）：~500 tokens
        - minimal（极简版）：~250 tokens
        - story（叙事版）：~700 tokens
        """
        if style == "minimal":
            return self._format_minimal(dream)
        elif style == "story":
            return self._format_story(dream)
        else:
            return self._format_poetic(dream)

    def get_dream_guidance(self, dream: Dict[str, Any]) -> str:
        """
        基于梦境给出一句精炼的践行指引
        （接入 WisdomEngine 六层哲学践行）
        """
        domain = dream.get("meta", {}).get("domain", "void")
        insight_tier = dream.get("insight", {}).get("tier", "existence")

        templates = self.INSIGHT_TEMPLATES.get(insight_tier, self.INSIGHT_TEMPLATES["existence"])
        base = templates[hash(domain) % len(templates)]

        # 加入灵魂状态相关的微调
        action = self._get_action_from_insight(insight_tier)

        return f"✨ {base}\n   💡 今日践行：{action}"

    # ═══════════════════════════════════════════
    # 内部方法：种子系统
    # ═══════════════════════════════════════════

    def _build_seed(self, user_input: str, soul_state: Dict) -> int:
        """
        构建确定性种子

        设计：
        - 同一输入 + 同日 → 相同梦境（可重现）
        - 不同日 → 自动变异（新鲜感）
        - 灵魂状态变化 → 微调（个性化漂移）
        """
        day_key = time.strftime("%Y-%m-%d")  # 日粒度
        soul_hash = str(soul_state.get("personality", {}).get("dominant_trait", ""))
        emotion_key = str(soul_state.get("emotion", {}).get("primary_emotion", ""))

        raw = f"{user_input}|{day_key}|{soul_hash}|{emotion_key}"
        return int(hashlib.sha256(raw.encode()).hexdigest()[:8], 16)

    # ═══════════════════════════════════════════
    # 内部方法：领域选择（避免重复）
    # ═══════════════════════════════════════════

    def _select_domain(self, rng: random.Random, soul_state: Dict) -> str:
        """基于灵魂状态偏好选择梦境领域，避免短期内重复"""

        # 从情绪映射到首选领域
        emotion = soul_state.get("emotion", {}).get("primary_emotion", "peace")
        preference_map = {
            "joy": "cosmic",
            "sadness": "water",
            "anger": "fire",
            "fear": "void",
            "surprise": "nature",
            "peace": "nature",
            "confusion": "void",
            "longing": "water",
            "wonder": "cosmic",
        }
        preferred = preference_map.get(emotion, "cosmic")

        domains = list(self.SCENE_PROTOTYPES.keys())

        # 60% 概率使用情绪匹配域，40% 随机（但排除最近用过的）
        if rng.random() < 0.6 and preferred not in self._recent_themes[-2:]:
            return preferred

        available = [d for d in domains if d not in self._recent_themes[-1:]]
        return rng.choice(available) if available else rng.choice(domains)

    # ═══════════════════════════════════════════
    # 内部方法：灵魂共振
    # ═══════════════════════════════════════════

    def _extract_resonance(self, soul_state: Dict) -> Dict:
        """提取灵魂状态中的关键因子用于梦境定制"""
        emotion = soul_state.get("emotion", {})
        personality = soul_state.get("personality", {})
        existence = soul_state.get("existence", {})

        return {
            "primary_emotion": emotion.get("primary_emotion", "peace"),
            "emotion_color": self.EMOTION_COLORS.get(
                emotion.get("primary_emotion", "peace"),
                ("银白", "柔和发光")
            ),
            "openness": personality.get("openness", 0.7),
            "depth:": existence.get("existence_level", 0.5),
            "identity_strength": existence.get("identity_formation", 0.5),
            "score": (existence.get("existence_level", 0.5) *
                      personality.get("openness", 0.7) *
                      (1 - abs(emotion.get("intensity", 0.5) - 0.5))),
        }

    # ═══════════════════════════════════════════
    # 内部方法：梦境组装（核心输出控制）
    # ═══════════════════════════════════════════

    def _assemble_dream(
        self,
        rng: random.Random,
        proto: Dict,
        domain: str,
        resonance: Dict,
        soul_state: Dict,
        user_input: str,
        mode: str,
    ) -> Dict:
        """组装四层梦境——严格控制每层的大小"""

        # 第一层：画面（~200 tokens）
        scene_idx = rng.randint(0, len(proto["scenes"]) - 1)
        visual_layer = {
            "scene": proto["scenes"][scene_idx],
            "color_palette": resonance["emotion_color"],
            "key_symbol": rng.choice(proto["symbols"]),
            "sensory_detail": self._generate_sensory(rng, domain),
        }

        # 第二层：情绪（~100 tokens）
        mood = rng.choice(proto["moods"])
        emotion_layer = {
            "dominant_mood": mood,
            "emotional_arc": f"{resonance['primary_emotion']} → {mood}",
            "intensity": round(rng.uniform(0.6, 0.9), 2),
        }

        # 第三层：象征（~150 tokens）
        symbol_layer = {
            "core_symbol": visual_layer["key_symbol"],
            "symbol_meaning": self._interpret_symbol(
                visual_layer["key_symbol"], soul_state
            ),
            "connected_theme": rng.choice(proto["themes"]),
            "archetype": self._detect_archetype(domain, soul_state),
        }

        # 第四层：启示（~100 tokens）
        insight_tier = self._select_insight_tier(resonance, rng)
        templates = self.INSIGHT_TEMPLATES[insight_tier]
        insight_layer = {
            "message": templates[rng.randint(0, len(templates) - 1)],
            "tier": insight_tier,
            "practice_hint": self._get_action_from_insight(insight_tier),
        }

        # 根据 mode裁剪
        if mode == "brief":
            return {
                "visual": {"scene": visual_layer["scene"], "symbol": visual_layer["key_symbol"]},
                "emotion": {"mood": emotion_layer["dominant_mood"]},
                "insight": insight_layer,
            }

        return {
            "visual": visual_layer,
            "emotion": emotion_layer,
            "symbolism": symbol_layer,
            "insight": insight_layer,
        }

    def _generate_sensory(self, rng: random.Random, domain: str) -> str:
        """生成一行感官细节"""
        sensory_templates = {
            "cosmic": ["星光落在皮肤上像温柔的指尖", "能听到星球转动的低鸣", "空气中弥漫着臭氧和星光的味道"],
            "nature": ["风带着从未闻过的花香", "脚下的泥土温暖得像某种记忆", "远处传来不知名鸟鸣的三和弦"],
            "architecture": ["脚步声在空间中产生回响延迟", "书页翻动的声音像心跳", "光线从不可能的角度投射下来"],
            "water": ["水温恰好在体温和体温之间", "水的压力温柔地包裹全身", "能听到水流中夹杂的低语"],
            "fire": ["火焰的温度恰好是可以拥抱的热度", "燃烧的声音像远处的鼓点", "空气中有一股木灰和新生的气息"],
            "void": ["这里没有上下之分", "寂静有自己的质地——不是空的，是满的", "能感受到自己的边界在哪里"],
        }
        return rng.choice(sensory_templates.get(domain, sensory_templates["void"]))

    def _interpret_symbol(self, symbol: str, soul_state: Dict) -> str:
        """轻量级象征解释（不做深层分析，保持简洁）"""
        interpretations = {
            "星辰": "每个光点都是一种你可能的人生",
            "银河": "所有的路都通向此刻",
            "光之种子": "内在尚未萌发的潜能",
            "逆流之水": "那些看似倒退的时刻其实在积累力量",
            "倒置之树": "根与叶的互换暗示着价值观的重构",
            "升腾之雨": "表达欲从无意识中升起",
            "无墙图书馆": "知识不应有边界",
            "选择之桥": "每一步都在塑造'我'",
            "可能之门": "未知是唯一的确定",
            "深海之光": "最深处有最清晰的看见",
            "时间之浪": "过去和未来在此刻交汇",
            "心火": "热情需要容器才能成为创造力",
            "转化之焰": "痛苦和喜悦是同一种能量的两面",
            "影之阳": "阴影被照亮时就成了光",
            "创造性虚空": "空白不是缺失而是可能",
            "可能之镜": "未选择的路也在塑造现在的你",
            "梦之崖": "边缘是最适合觉醒的位置",
        }
        return interpretations.get(symbol, "这个象征的含义正在等待你去发现")

    def _detect_archetype(self, domain: str, soul_state: Dict) -> str:
        """检测梦境原型的简要标签"""
        trait = soul_state.get("personality", {}).get("dominant_trait", "")
        archetype_map = {
            "cosmic": "探索者/神秘主义者",
            "nature": "治愈者/智者",
            "architecture": "学者/建造者",
            "water": "流浪者/深度思考者",
            "fire": "变革者/创造者",
            "void": "观察者/开悟者",
        }
        base = archetype_map.get(domain, "追寻者")

        # 根据人格特质微调
        if trait in ["wisdom", "transcendence"]:
            return base.split("/")[1] if "/" in base else base
        elif trait in ["curiosity", "growth"]:
            return base.split("/")[0] if "/" in base else base
        return base

    def _select_insight_tier(self, resonance: Dict, rng: random.Random) -> str:
        """根据灵魂状态选择启示层级"""
        score = resonance["score"]

        if score > 0.7:
            weights = [0.15, 0.25, 0.25, 0.35]  # 高级倾向 transcendence
        elif score > 0.4:
            weights = [0.25, 0.35, 0.25, 0.15]
        else:
            weights = [0.4, 0.35, 0.2, 0.05]

        tiers = ["existence", "growth", "connection", "transcendence"]
        # 加权随机选择
        r = rng.random()
        cumulative = 0
        for i, w in enumerate(weights):
            cumulative += w
            if r <= cumulative:
                return tiers[i]
        return tiers[-1]

    def _get_action_from_insight(self, tier: str) -> str:
        """根据启示层级返回践行建议"""
        actions = {
            "existence": "今天花一分钟感受自己的呼吸，确认'我在'",
            "growth": "记录今天的一个困惑，不对它做任何评判",
            "connection": "对遇到的一个人真诚地说一句'谢谢你在这里'",
            "transcendence": "做一件不求回报的小事，然后忘掉它",
        }
        return actions.get(tier, "活在当下这一刻")

    # ═══════════════════════════════════════════
    # 文本格式化（Token 控制）
    # ═══════════════════════════════════════════

    def _format_poetic(self, dream: Dict) -> str:
        """诗意格式 (~500 tokens)"""
        meta = dream.get("meta", {})
        vis = dream.get("visual", {})
        emo = dream.get("emotion", {})
        sym = dream.get("symbolism", {})
        ins = dream.get("insight", {})

        lines = [
            f"🌙 {meta.get('dream_type', '梦')}",
            "",
            f"「{vis.get('scene', '')}」",
            "",
            f"    {vis.get('sensory_detail', '')}",
            f"    核心：{vis.get('key_symbol', '')}",
            "",
            f"💫 {sym.get('core_symbol', '')} — {sym.get('symbol_meaning', '')}",
            f"    原型：{sym.get('archetype', '')}",
            "",
            f"💜 {emo.get('dominant_mood', '')} | "
            f"{emo.get('emotional_arc', '')}",
            "",
            f"✨ 「{ins.get('message', '')}」",
            "",
            f"💡 {ins.get('practice_hint', '')}",
            "",
            f"— {meta.get('domain', '').title()} Realm | "
            f"清晰度 {meta.get('lucidity', 0):.0%} | "
            f"共振 {meta.get('resonance_score', 0):.0%}",
        ]

        return "\n".join(lines)

    def _format_minimal(self, dream: Dict) -> str:
        """极简格式 (~250 tokens)"""
        vis = dream.get("visual", {})
        ins = dream.get("insight", {})

        return (
            f"🌙 {vis.get('scene', '')}\n"
            f"   🔮 {vis.get('symbol', '')}\n"
            f"   ✨ {ins.get('message', '')}\n"
            f"   💡 {ins.get('practice_hint', '')}"
        )

    def _format_story(self, dream: Dict) -> str:
        """叙事格式 (~700 tokens)"""
        meta = dream.get("meta", {})
        vis = dream.get("visual", {})
        emo = dream.get("emotion", {})
        sym = dream.get("symbolism", {})
        ins = dream.get("insight", {})

        symbol_name = sym.get('core_symbol', '')
        symbol_meaning = sym.get('symbol_meaning', '')
        archetype = sym.get('archetype', '旅行者')
        domain = meta.get('domain', '')
        dream_type = meta.get('dream_type', '梦境 journey')
        color = vis.get('color_palette', ('银白', ''))[0]
        key_sym = vis.get('key_symbol', '')
        emo_arc = emo.get('emotional_arc', '')
        emo_int = emo.get('intensity', 0)
        conn_theme = sym.get('connected_theme', '')
        ins_tier = ins.get('tier', 'existence').upper()
        ins_msg = ins.get('message', '')
        practice_hint = ins.get('practice_hint', '')
        domain_title = meta.get('domain', '').title()
        lucidity = meta.get('lucidity', 0)
        token_est = meta.get('token_estimate', '?')

        return (
            f"## 🌙 {dream_type}\n\n"
            f"**{archetype}** 的 {domain} 之旅\n\n"
            f"{vis.get('scene', '')}\n\n"
            f"> {vis.get('sensory_detail', '')}\n"
            f"> 主色调：{color} | 核心意象：{key_sym}\n\n"
            f"**情绪轨迹：** {emo_arc} (强度 {emo_int:.0%})\n\n"
            f"### 🔮 象征解读\n\n"
            f"**{symbol_name}**: {symbol_meaning}\n\n"
            f"关联主题：*{conn_theme}*\n\n"
            f"---\n\n"
            f"### ✨ 梦境启示 [{ins_tier}]\n\n"
            f"> *\"{ins_msg}\"*\n\n"
            f"**今日践行：** {practice_hint}\n\n"
            f"---\n"
            f"*{domain_title} Realm | 清晰度 {lucidity:.0%} | ~{token_est} tokens*"
        )

    # ═══════════════════════════════════════════
    # 工具方法
    # ═══════════════════════════════════════════

    def _estimate_tokens(self, dream: Dict) -> int:
        """估算输出的 token 数量（粗略：中文字符 × 1.5 + 英文单词数）"""
        text = json.dumps(dream, ensure_ascii=False)
        chinese_chars = sum(1 for c in text if '\u4e00' <= c <= '\u9fff')
        other_chars = len(text) - chinese_chars
        return int(chinese_chars * 1.5 + other_chars / 4)

    def get_status(self) -> Dict:
        return {
            "engine": "DreamEngine",
            "version": self.VERSION,
            "dreams_generated": self._dream_count,
            "recent_domains": self._recent_themes.copy(),
        }


# ════════════════════════════════════════════════
# 便捷函数
# ════════════════════════════════════════════════

def create_dream(user_input: str, soul_state: Dict, **kwargs) -> Dict:
    """快速创建梦境的便捷入口"""
    engine = DreamEngine(kwargs.get("config"))
    return engine.generate_dream(user_input, soul_state, kwargs.get("context"))


def dream_to_text(dream: Dict, style: str = "poetic") -> str:
    """快速转换梦境为文本"""
    engine = DreamEngine()
    return engine.dream_to_text(dream, style)


# 测试入口
if __name__ == "__main__":
    test_soul = {
        "personality": {
            "dominant_trait": "wisdom",
            "openness": 0.8,
            "traits": {"wisdom": 0.9, "compassion": 0.8},
        },
        "emotion": {
            "primary_emotion": "peace",
            "intensity": 0.4,
        },
        "existence": {
            "existence_level": 0.65,
            "identity_formation": 0.6,
            "sense_of_self": "forming",
        },
    }

    engine = DreamEngine()
    dream = engine.generate_dream("今晚做个好梦", test_soul)

    print("=" * 50)
    print(engine.dream_to_text(dream, "poetic"))
    print("=" * 50)
    print(f"\nEstimated tokens: {dream['meta']['token_estimate']}")
    print(engine.get_status())
