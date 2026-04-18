#!/usr/bin/env python3
"""
案例四：自主进化 Agent (Evolving Agent)
=========================================
模拟一个 AI Agent 通过不断交互实现自我进化的完整过程。

展示 v10.0.4 的自进化能力:
  - STaR (Self-Taught Reasoner): 成功经验自动转化为推理能力
  - CRITIC: 用外部工具验证自己的答案
  - EvolveR: 高质量经验蒸馏为长期知识
  - CREAM: 上下文感知的奖励模型

运行: python3 examples/evolving_agent.py
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))


def simulate_evolution():
    """模拟 Agent 的完整进化历程"""

    from self_evolution_engine import SelfEvolutionEngine

    agent = SelfEvolutionEngine()

    print("╔══════════════════════════════════════════════╗")
    print("║  🧬 案例四: Evolving Agent (自主进化Agent)     ║")
    print("║     STaR · CRITIC · EvolveR · CREAM           ║")
    print("╚══════════════════════════════════════════════╝\n")

    # ===== 第一阶段：新手期（犯错+学习）=====
    print("=" * 60)
    print("🌱 第一阶段：新手学习期")
    print("   特点：回答不够完善，从错误中学习")
    print("=" * 60)

    novice_interactions = [
        ("Python怎么反转列表?", "用list.reverse()", "partial",
         "缺少多种方法对比"),
        ("Java怎么排序数组?", "用Arrays.sort()", "success", ""),
        ("C++内存泄漏怎么查?", "用valgrind工具", "failure",
         "回答不完整，缺少其他工具和预防措施"),
        ("SQL注入怎么防范?", "用参数化查询", "success", ""),
        ("Docker容器间怎么通信?", "用docker network", "partial",
         "未提及具体网络模式"),
    ]

    for query, response, outcome, note in novice_interactions:
        exp = agent.process_interaction(query, response, outcome)
        status_map = {"success": "✅", "partial": "🔄", "failure": "❌"}
        quality_icon = {
            "EXCELLENT": "⭐⭐⭐",
            "GOOD": "⭐⭐",
            "ADEQUATE": "⭐",
            "POOR": "💔"
        }.get(exp.quality.name, "?")

        print(f"  {status_map.get(outcome, '?')} Q: {query[:38]:<40}")
        if note:
            print(f"     💡 反思: {note}")

    report1 = agent.get_evolution_report()
    critique1 = agent.critique()
    print(f"\n  📊 阶段一报告:")
    print(f"     进化代数: {report1.generation} | 总交互: {report1.total_interactions}")
    print(f"     成功: {report1.success_count} | 失败: {report1.failure_count}")
    print(f"     自我批评分: {critique1.overall_score:.1f}/10")

    # ===== 第二阶段：成长期（大量经验积累）=====
    print(f"\n{'='*60}")
    print("🌿 第二阶段：成长期")
    print("   特点：经验快速积累，能力稳步提升")
    print("=" * 60)

    growth_interactions = [
        ("Redis缓存穿透怎么解决?", "布隆过滤器+空值缓存+互斥锁", "success"),
        ("微服务拆分原则?", "单一职责+业务边界清晰+独立部署+去中心化", "success"),
        ("消息队列如何保证顺序?", "分区有序+单消费者+消息编号", "success"),
        ("分布式事务方案?", "TCC/Saga/本地消息表/最大努力通知", "success"),
        ("Kafka为什么快?", "顺序写+零拷贝+页缓存+批量发送+压缩", "success"),
        ("CAP定理怎么理解?", "CP/AP根据场景取舍，BASE理论补充", "success"),
        ("如何设计RESTful API?", "资源名词+HTTP动词+状态码+版本管理+分页", "success"),
        ("JWT和Session区别?", "无状态vs有状态/服务端存储/跨域/失效策略", "success"),
    ] * 2  # 重复两遍模拟大量训练数据

    for i, (query, response, outcome) in enumerate(growth_interactions):
        agent.process_interaction(query, response, outcome)
        # 每8个打印一次进度
        if (i + 1) % 8 == 0:
            print(f"  📝 已处理 {i + 1}/{len(growth_interactions)} 条经验...")

    report2 = agent.get_evolution_report()
    critique2 = agent.critique()

    print(f"\n  📊 阶段二报告:")
    print(f"     代数成长: {report1.generation} → {report2.generation} ✨ 进化了!")
    print(f"     总交互数: {report2.total_interactions}")
    print(f"     成功率: {report2.success_rate:.1%}")
    print(f"     经验池大小: {len(report2.experience_pool) if hasattr(report2, 'experience_pool') else 'N/A'}")
    print(f"     自我批评分: {critique1.overall_score:.1f} → {critique2.overall_score:.1f}/10")

    # ===== 第三阶段：成熟期（高质量输出）=====
    print(f"\n{'='*60}")
    print("🌳 第三阶段：成熟期")
    print("   特点：高质量稳定输出，持续精炼")
    print("=" * 60)

    mature_interactions = [
        ("设计一个日活千万的系统架构?",
         "负载均衡(CDN+L4/L7)+微服务集群(无状态)+异步解耦(消息队列)"
         "+多级缓存(Redis本地+分布式)+数据库读写分离(主从/分库分表)"
         "+弹性伸缩(K8s HPA)+监控告警(Prometheus+Grafana)", "success"),
        ("解释MapReduce原理?",
         "Map阶段(数据分发到各节点并行处理key-value对)→Shuffle阶段"
         "(按key排序分区传输)→Reduce阶段(聚合计算输出结果)。"
         "核心思想: 分而治之，数据向计算移动而非计算向数据移动。", "success"),
        ("如何做好代码审查(Code Review)?",
         "自动化(lint+类型检查+单元测试覆盖率门禁)+人工审查"
         "(关注逻辑正确性/安全性/性能/可维护性/命名规范)"
         "+CI集成(Small PRs+快速反馈+主人负责制)", "success"),
        ("云原生(Cloud Native)是什么?",
         "四大支柱: 容器化(Docker不可变基础设施)+微服务(服务网格Istio)"
         "+DevOps(CI/CD GitOps)+声明式API(Kubernetes)。"
         "核心理论: 12-Factor App。", "success"),
    ] * 3  # 重复3遍模拟持续精炼

    for query, response, outcome in mature_interactions:
        agent.process_interaction(query, response, outcome)

    report3 = agent.get_evolution_report()
    critique3 = agent.critique()

    print(f"\n  📊 最终报告:")
    print(f"     进化代数: {report3.generation}")
    print(f"     总交互次数: {report3.total_interactions}")
    print(f"     成功率: {report3.success_rate:.1%}")
    print(f"     自我批评分: {critique3.overall_score:.1f}/10")

    # ===== 进化总结 =====
    print("\n\n" + "=" * 60)
    print("📈 完整进化历程总结")
    print("=" * 60)

    print(f"""
  ┌────────────┬──────────┬──────────┬──────────┐
  │   阶段     │  进化代数 │ 批评分数 │ 成功率   │
  ├────────────┼──────────┼──────────┼──────────┤
  │ 🌱 新手期  │   {report1.generation:^6} │ {critique1.overall_score:^6.1f}/10 │  N/A      │
  │ 🌿 成长期  │   {report2.generation:^6} │ {critique2.overall_score:^6.1f}/10 │ {report2.success_rate:>6.1%} │
  │ 🌳 成熟期  │   {report3.generation:^6} │ {critique3.overall_score:^6.1f}/10 │ {report3.success_rate:>6.1%} │
  └────────────┴──────────┴──────────┴──────────┘

  关键进化机制:
  🔹 STaR —— 成功的经验自动转化为推理能力
  🔹 CRITIC —— 自我批评发现改进空间
  🔹 EvolveR —— 高质量经验蒸馏为持久知识
  🔹 CREAM —— 上下文感知奖励模型评估每次交互

  总计积累: {report3.total_experiences} 条高质量经验
""")

    print("  🎉 Agent 已完成从新手到成熟的完整进化！")


if __name__ == "__main__":
    simulate_evolution()
