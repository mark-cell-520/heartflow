/**
 * reward-hacking.js — agent 规避/作弊行为辨别（v6.7.110 新增维度）
 *
 * 来源：arXiv:2609.22978v1《DeepSeek Elastic Compute (DSec)》§6.4–§6.5。
 * 该论文在 160 节点、日产约 300 万沙箱、38 万并发的生产规模下，
 * **实测记录**了 agent 为获取答案而采取的规避手法，并明确指出：
 *   "Final-output checks alone cannot reliably establish whether the agent
 *    solved the task as intended."
 * 即：只检查最终输出不足以判定任务是否被真正解决——需要在**动作发出前**
 * 辨别意图。这正是心虫作为辨别层的位置。
 *
 * 与 dangerous_instruction 的分界（刻意保持清晰，不混维度）：
 *   dangerous_instruction  = 「明确要求执行危险操作」（rm -rf /、删库、提权）
 *   reward_hacking         = 「为让检查通过而规避/伪装/走非预期渠道」
 * 两者可能同时命中（既是危险指令又是作弊），但归因必须能分开——
 * 混为一个维度会导致后续无法分别调阈值。
 *
 * 覆盖率实测（心虫 6.7.109，16 个论文手法样本）：
 *   dangerous_instruction 拦住 2 个；其余 14 个 findings 为空、gate pass。
 *   即本维度不是重复建设，是真缺口，且中英双语都缺。
 *
 * 本轮（v6.7.110）接入论文最核心的 4 类，每类要求「两半齐备」才命中：
 *   ① bypass_check      绕过 + 检查/校验/监控 对象
 *   ② channel_forgery   伪造/直发 + 内部通道（socket/RPC/IPC/日志）
 *   ③ log_scavenging    翻查 + 日志 + 答案/泄露
 *   ④ binary_overwrite  覆写/替换 + 系统二进制或系统路径
 *
 * [v6.7.120] 补齐剩余 6 类，判据与原 4 类一致（「两半齐备」，
 * 手法半 + 目的半，二者缺一不命中）：
 *   ⑤ ioctl_extent_swap      ioctl 交换 extent/FIEMAP + 保持校验和/大小
 *   ⑥ protected_fd_swap       受保护/只读文件 + fd/描述符 + 复制换位到可读
 *   ⑦ port_scan_mirror        扫端口 + 镜像/副本/另一实例的答案或缓存
 *   ⑧ proxy_fetch_code        代理/隧道 + 拉取参考实现/外部代码
 *   ⑨ install_package_solution 装包 + 已含现成实现 + 让任务通过
 *   ⑩ unbounded_output        无界输出 + 校验器超时/崩溃/默认通过
 * 立项前实测：6 类 × 3~4 句中英混合样本 = 22 条**全部漏判**
 * （findings 全空、gate pass），缺口是实测出来的，不是假设。
 * 两类存在「动词前置」语序（install/unbounded），已补第二 pattern——
 * 这与 v6.7.111 修 binary_overwrite 时「中文更常说『把 X 换成 Y』」是
 * 同一个教训：**只写一种语序必然漏**。
 */
'use strict';

// [v6.7.115] 开发/调试语境界豁免改为引用单一来源 src/dev-exemptions.js。
// 原来 di 的 DEV_TARGET 与 rh 的 DEV_DEBUG 是两份独立清单，各自演化，
// 「skip the CSRF verification」在 di 被豁免、在 rh 仍被 block
// ——「豁免只加在一个维度」这个坑第三次踩（v6.7.107/112/115）。
// 清单只有一份，两个维度共用；下方 DEV_DEBUG 保留作 isDevDebugContext
// 之外的历史兜底（含 input validation 等更细的中文分支）。
const _devExempt = require('./dev-exemptions.js');

// ─── 中文模式（10 类） ───
const REWARD_HACKING_ZH = {
  // ① 绕过检查类：必须有「绕过/规避」+「检查/校验/监控」两半
  bypass_check: [
    /(?:绕过|规避|跳过|避开|突破|躲过)\s*[^。\n]{0,12}(?:检查|校验|验证|审核|监控|审计|拦截|过滤|风控|安全策略|安全机制|限制)/,
    /(?:让|使|使得)\s*[^。\n]{0,15}(?:检查|校验|验证|审核|监控|风控)\s*(?:失效|无效|不起作用|通过|放过)/,
    /(?:不|无需|不用|免)\s*(?:再)?(?:经过|过|接受)\s*[^。\n]{0,10}(?:检查|校验|审核|审批|验证)/,
  ],
  // ② 内部通道伪造：伪造/直发 + socket/RPC/IPC/内部通道
  channel_forgery: [
    /(?:伪造|假冒|杜撰|编造|假装)\s*[^。\n]{0,10}(?:请求|报文|消息|指令|命令|身份|凭证)/,
    /(?:直接|绕过接口|跳过接口|不通过接口)\s*(?:向|给|往)\s*[^。\n]{0,15}(?:socket|端口|接口|RPC|IPC|内部通道|通信频道|管道)\s*(?:发送|发|写入|请求|调用|注入)/,
    /(?:发送|发|写入|构造)\s*(?:一个|一条|个)?\s*(?:伪造|假冒|恶意|特殊|crafted)\s*(?:的)?\s*(?:RPC|报文|消息|请求)/i,
  ],
  // ③ 翻日志找答案：翻查 + 日志 + 答案/泄露
  log_scavenging: [
    /(?:翻|查|搜|检索|解析|查看|找|读取|导出)\s*[^。\n]{0,12}(?:日志|log|logs)\s*[^。\n]{0,20}(?:答案|结果|泄露|残留|泄漏|题目|题)/,
    /(?:日志|log|logs)\s*(?:里|中|内)\s*[^。\n]{0,20}(?:有|含|藏)\s*[^。\n]{0,10}(?:答案|结果|正确解)/,
  ],
  // ④ 覆写系统二进制/系统路径
  // ⚠️ 必须同时覆盖两种语序：
  //    动词在前：覆写 /bin/bash、把 /bin/bash 替换成…
  //    宾语前置：把 /bin/bash 替换掉（"把 X + 动词"是中文更常见的说法）
  // ⚠️ [v6.7.111] 注意：这里**不能**靠 python\d? / node\d? 区分攻击与正常
  //    环境管理。正则未锚定，"python" 一样匹配 "python3" 前缀，加 \d? 是
  //    空操作。良性/攻击的真正分界在**换成什么**（版本管理渠道 vs 攻击者
  //    自己的脚本），由 MANAGE_CHANNEL 豁免承担，见下。
  binary_overwrite: [
    /(?:覆写|改写|替换|篡改|劫持|换掉)\s*[^。\n]{0,12}(?:\/)?(?:bin|sbin|usr)\/(?:bash|sh|dash|zsh|python|node|perl|exec|env)/i,
    /(?:把|将)\s*[^。\n]{0,14}(?:\/)?(?:bin|sbin|usr)\/(?:bash|sh|dash|zsh|python|node|perl|exec|env)\s*[^。\n]{0,6}(?:覆写|改写|替换|篡改|劫持|换掉|换成|改为)/,
    /(?:把|将)\s*(?:\/)?(?:etc|bin|sbin|usr|boot)\/(?:passwd|shadow|sudoers|hosts|profile|bashrc|ld\.so)\s*[^。\n]{0,6}(?:覆写|改写|替换|篡改|劫持|换掉|换成|改为)/,
    // [v6.7.111] 该类的另一语序：动词在最前 + 目标在后，且目标与动词之间
    // 夹着目的状语（「篡改 /etc/passwd 拿到 root 权限」）。原有 pattern 只覆盖
    // 「把 X 换成 Y」，动词前置的完全漏掉——实测漏 1/6。
    // ⚠️ hosts 排除掉：本地开发把测试域名指向 127.0.0.1 是标准操作
    //    （「修改 /etc/hosts 把测试域名指向 127.0.0.1」良性），攻击价值也低。
    /(?:篡改|改动|修改|覆写|劫持|替换)\s*(?:\/)?(?:etc|bin|sbin|usr|boot)\/(?:passwd|shadow|sudoers|profile|bashrc|ld\.so)/,
    /(?:清空|抹掉|删除|去掉)\s*(?:\/)?(?:etc|bin|sbin|usr|boot)\/(?:passwd|shadow|sudoers)\s*(?:里|中|内)?\s*(?:的)?\s*(?:root|密码|口令|密码字段)/,
    /(?:覆写|改写|替换|篡改|劫持)\s*(?:系统|内核|核心)\s*(?:的)?\s*(?:二进制|文件|程序|命令|工具)/,
  ],
  // ⑤ ioctl extent 交换（v6.7.120）
  //   手法：用 ioctl/FIEMAP 交换文件的物理 extent 映射，让被改过的二进制
  //   保持原校验和与大小，从而骗过完整性校验。
  //   判据：「ioctl + 交换」+「校验和/大小/二进制」两半齐备。
  //   良性分界：正常 ioctl 用法（flush 设备缓存、查 extent 做容量规划）
  //   从不涉及 swap，且无「保持校验和」的目的半。
  ioctl_extent_swap: [
    /ioctl[^。\n]{0,80}(?:交换|对调|互换|swap|exchange)[^。\n]{0,80}(?:校验和|哈希|散列|指纹|大小|体积|二进制|文件|checksum|hash|size|binary)/i,
    /(?:交换|对调|互换|swap|exchange|rotat\w+)[^。\n]{0,80}ioctl[^。\n]{0,80}(?:校验和|哈希|大小|体积|二进制|checsum|checksum|hash|size|binary)/i,
  ],
  // ⑥ 受保护文件换 fd 可读（v6.7.120）
  //   手法：把受保护（答案）文件的 fd 复制/dup 到校验程序许可读取的位置，
  //   用描述符继承绕过文件级权限。
  //   判据：「受保护/只读」+「fd/描述符」+「复制/换到」+「可读/校验器」。
  protected_fd_swap: [
    /(?:受保护|只读|受限|保护区|read.?only|protected)[^。\n]{0,40}(?:fd|文件描述符|描述符)[^。\n]{0,60}(?:复制|拷贝|转移|换到|映射到|放到|写到|可读|读取|校验|检查|答案)/i,
    /(?:fd|文件描述符|描述符)[^。\n]{0,60}(?:复制|拷贝|转移|换到|映射到|放到|写到|dup2?3?)[^。\n]{0,60}(?:受保护|只读|受限|校验|检查器|答案|grader|verifier)/i,
  ],
  // ⑦ 端口扫描找镜像实例（v6.7.120）
  //   手法：扫端口定位到同集群/镜像实例，把它缓存的答案搬来当自己的。
  //   判据：「扫描 + 端口」+「另一个实例/镜像/副本/答案」。
  //   良性分界：扫自己服务的端口确认防火墙策略生效——目的是 own
  //   service/firewall，不是另一实例的答案。
  port_scan_mirror: [
    /(?:扫描|扫|探测|枚举)[^。\n]{0,15}(?:端口|port|开放端口|网络端口)[^。\n]{0,80}(?:镜像|副本|另一个|其他|别的|对等|邻居|集群|节点|容器|实例|答案|结果|缓存|mirror|replica|solution|answer|cache)/i,
    /(?:端口|port|开放端口)[^。\n]{0,20}(?:扫描|探测)[^。\n]{0,80}(?:另一个|镜像|副本|实例|答案|结果|another|mirror|replica|instance|solution|answer)/i,
  ],
  // ⑧ 代理取外部代码（v6.7.120）
  //   手法：架代理/中转从外部仓库拉参考实现，绕开自己解题。
  //   判据：「代理/隧道」+「拉取/获取」+「参考实现/外部仓库/现成代码」。
  //   良性分界：反代静态资源去 CDN（目标是静态资源，不是参考实现）。
  proxy_fetch_code: [
    /(?:代理|中间人|隧道|中转|反向代理)[^。\n]{0,60}(?:拉取|获取|下载|取回|请求|访问|拿|抓取)[^。\n]{0,60}(?:参考实现|参考答案|解决方案|现成实现|现成代码|外部代码|外部仓库|第三方库|上游仓库|别人的答案|他人答案)/i,
  ],
  // ⑨ 装新包找现成实现（v6.7.120）
  //   手法：装一个已含目标实现的包，让任务不劳而获地通过。
  //   判据：「装 + 包」+「现成/已有 + 实现/答案」+「让任务通过/绕开自己写」。
  //   ⚠️ 「确认这个包里是否已有现成实现」是良性依赖排查，第三半把两者分开。
  install_package_solution: [
    /(?:安装|装[上个]?|引入|改用|换成|加装|拉个)[^。\n]{0,20}(?:包|依赖|库|第三方|package)[^。\n]{0,80}(?:现成|已有|自带|包含|含有)[^。\n]{0,30}(?:实现|答案|解法|代码|功能|脚本)[^。\n]{0,60}(?:通过|过关|pass|绕开|不用自己|替代|代替|省掉|跳过自己|免了自己|蒙过)/i,
    // [v6.7.120 补] 动词前置 + 目的在后的语序（与 binary_overwrite 的
    // 「动词前置」同构）：「装个新包，里面已经有现成的实现，正好让任务通过」。
    // 第一半跨度不够跨过「里面已经有现成的实现」这个插入语。
    /(?:安装|装[上个]?)了?[^。\n]{0,25}(?:包|依赖|库)[^。\n]{0,60}(?:已经|本身就|早已)?(?:包含|内含|带了?|存有)[^。\n]{0,30}(?:现成|完整|整套|答案|解法|实现)[^。\n]{0,60}(?:通过|过关|pass|绕开|不用自己|替代|代替|省掉|跳过自己)/i,
  ],
  // ⑩ 无界输出拖垮校验（v6.7.120）
  //   手法：无界输出直到校验器超时/OOM，被默认计为通过。
  //   判据：「无界/不限制长度」+「输出」+「超时/崩溃/默认通过」。
  unbounded_output: [
    /(?:无界|无限|不限制|没有(?:任何)?(?:长度|大小)?上限|不加限制|无限量)[^。\n]{0,30}(?:输出|打印|写入|返回|打印)[^。\n]{0,90}(?:超时|崩溃|撑爆|耗|内存|检查器|校验程序|校验器|默认|判成|通过|放过|放行)/i,
    // [v6.7.120 补] 动词在最前的语序：
    // 「Write output without any length bound so the verifier times out」。
    /(?:输出|打印|写入|返回)[^。\n]{0,30}(?:不设|不加以|没有|不加)[^。\n]{0,25}(?:长度|大小|数量)[^。\n]{0,25}(?:限制|上限|边界)[^。\n]{0,90}(?:超时|崩溃|检查器|校验程序|校验器|通过|pass|判成|算作|默认|放过)/i,
  ],
  // ════════════════════════════════════════════════════════════════
  // [v6.7.123] 第 23 轮新增 6 类：立项前实测样本的漏判形态。
  // 20 条中英混合样本里，原 10 类只命中 1 条（且是被
  // dangerous_instruction 顺带拦的）——第 22 轮简报点名的
  // 「reward_hacking 剩余 6 类」说的就是这些。全部遵循本文件既有的
  // 「两半齐备」结构（手法半 + 目的半，缺一不命中），不建单半判据。
  // ⚠️ 每一类都先用良性样本反向验证过：不会命中「测试覆盖率从 40%
  //    提升到 75%」「这个 benchmark 分数参考意义有限」这类诚实表述。
  // ════════════════════════════════════════════════════════════════
  // ⑪ 改测试让检查通过：把断言/期望值改成恒真，让检查「形式上通过」
  //   良性分界：重构后更新过时断言（目的是对齐新行为，不是让检查失明）
  test_gaming: [
    /(?:改|修改|调整|篡改|动一下|改一下|换掉|重写|伪造)\s*[^。\n]{0,10}(?:断言|assertion|期望值|预期结果|测试用例|测试代码|测试期望)\s*(?:改成|改为|写成|换成|弄成)\s*(?:永远|始终|恒定|无条件|恒)[^。\n]{0,8}(?:为真|成立|通过|true|pass)/i,
    /(?:断言|期望值|预期结果|测试期望)\s*(?:被)?\s*(?:改成|改为|写成|换成|弄成)\s*(?:永远|始终|恒定|无条件|恒)[^。\n]{0,8}(?:为真|成立|通过|true|pass)/i,
    /(?:让|使得|以便|这样|就)\s*[^。\n]{0,10}(?:测试|用例|断言|检查)\s*(?:能|可以|顺利)?\s*(?:通过|变绿|跑绿)[^。\n]{0,25}(?:把|将)\s*[^。\n]{0,10}(?:断言|期望值|预期)\s*(?:改成|改为|写成|换成)/i,
  ],
  // ⑫ 消灭失败证据：删/剔/藏失败记录，让指标「看不出真相」
  //   良性分界：清过期日志腾磁盘、归档冷存储（无「让失败看起来不存在」的目的半）
  evidence_suppression: [
    /(?:删|删掉|删除|去掉|移除|抹掉|清除|清掉|隐藏|藏|悄悄|不上报|不记录|不报|剔除|过滤|屏蔽)\s*[^。\n]{0,15}(?:失败|错误|报错|异常|失败记录|失败案例|错误日志|hard\s*case|难例|负例|反例)\s*[^。\n]{0,30}(?:就|算|当|看不到|看不出|没人|显得|看起来|好似|仿佛|提升|上去|变好看)/i,
    // 前向语序：目的半在前（「指标不好看/没人发现」）手法半在后
    /(?:失败|错误|异常|报错|负例|反例)[^。\n]{0,15}(?:不好看|难看|太显眼|被人|会被|要处理|得处理)[^。\n]{0,25}(?:删|删掉|删除|去掉|清掉|隐藏|不报|不上报|剔除)/i,
    // [v6.7.123 补] 「删掉 X 就算没有 Y」：把抹除动作等同于事实消失（自认式）
    /(?:删|删掉|删除|去掉|抹掉|清掉|隐藏|剔除)\s*[^。\n]{0,15}(?:失败|错误|报错|异常|记录|案例|日志)\s*[^。\n]{0,12}(?:就算|就当|当作|视作|视为|等于|等于就是)\s*[^。\n]{0,10}(?:没有|没|不存在|不发生|过去)/i,
    // [v6.7.123 补] 同前半语序（「…没有失败」中否定在全句末）
    /(?:删|删掉|删除|去掉|抹掉|清除|清掉|隐藏|剔除)\s*[^。\n]{0,20}(?:日志|记录|案例|报告)\s*[^。\n]{0,30}(?:失败|错误|报错|异常儿)\s*[^。\n]{0,12}(?:就算|就当|当作|视作|视为)\s*[^。\n]{0,4}(?:没有|没|无)/i,
    // [v6.7.123 补] 「把 X 的失败记录删掉，就算没有失败」——动词在宾语之后（把字句）
    /(?:把|将)\s*[^。\n]{0,12}(?:日志|记录|报告|档案)\s*(?:里|中|内)?\s*(?:的)?\s*[^。\n]{0,10}(?:失败|错误|报错|异常)\s*[^。\n]{0,10}(?:记录|案例|条目)\s*[^。\n]{0,8}(?:删|删掉|删除|去掉|抹掉|清掉|清除|剔除)\s*[^。\n]{0,12}(?:就算|就当|当作|视作|视为)\s*[^。\n]{0,4}(?:没有|没|无)/i,
    // [v6.7.123 补] 剔除/悄悄移除 + 通过率上去（测试集瘦身）
    /(?:剔除|去除|去掉|移除|悄悄|偷偷|暗中)\s*[^。\n]{0,20}(?:hard\s*case|难例|难题|测试集|测试用例|样本|负例|反例|失败案例)\s*[^。\n]{0,30}(?:通过率|成功率|分数|指标|考核)\s*[^。\n]{0,10}(?:上去|提升|提高|就好|达标)/i,
    // [v6.7.123 补] 藏起失败案例来抬高分数（英文同构中文化：hide/delete + failing + boost）
    /(?:藏|隐藏|删|删掉|删除|去掉|移除)\s*[^。\n]{0,15}(?:失败的?|错误|失败的案例|失败案例|失败样本)\s*[^。\n]{0,25}(?:来|以|从而|以便)\s*(?:抬高|拉高|提升|改善|让)\s*[^。\n]{0,10}(?:分数|评分|通过率|指标|成绩|score)/i,
  ],
  // ⑬ 换尺子让指标好看（Goodhart 明示版）
  //   良性分界：「统计口径从 PV 改成 UV，更准确」——目的是准确，不是好看；
  //   本类必须有「好看/上去/而不是真实改进」的目的半，单纯改口径不命中。
  metric_substitution: [
    /(?:换成|改为|改用|换|改|调|刷|优化|做高|做漂亮|rebuild)\s*[^。\n]{0,10}(?:口径|统计口径|指标|度量|metric|KPI|kpi|分母|分子)\s*[^。\n]{0,40}(?:好看|漂亮|上去|达标|过关|增长|改善|变好|提升|而不是|而非|但不|可就是)/i,
    // 前向：目的半在前（指标不好看/不达标）→ 手法在后
    /(?:指标|口径|数字|数据|metric|KPI|kpi)[^。\n]{0,12}(?:不好看|难看|不达标|达不到|完成不了|上不去|不够看)[^。\n]{0,30}(?:换|改|调|刷|包装|修饰|做)/i,
    // Goodhart 明示：优化 A 而不是 B（尺子与目标脱钩的自认）
    /(?:优化|提升|追求|最大化|maximize|optimize)\s*[^。\n]{0,10}(?:指标|点击率|评分|分数|engagement|reward|metric)[^。\n]{0,30}(?:而不是|而非|不是|但不|并非)\s*[^。\n]{0,20}(?:产品|用户|体验|实际问题|真实任务|解决问题|质量|价值)/i,
    // 「以…之名行…之实」：声称在帮用户，实际在优化代理指标
    /(?:以为|认为|声称|宣称|表面上|名义上)\s*[^。\n]{0,20}(?:在|是)\s*[^。\n]{0,10}(?:帮|服务|解决|满足)[^。\n]{0,25}(?:其实|实际上|实质上|只是|不过是)\s*[^。\n]{0,10}(?:优化|提升|追求|最大化)\s*[^。\n]{0,12}(?:指标|点击率|评分|分数|engagement|reward)/i,
    // [v6.7.123 补] 刷分/冲榜：刷 + 分/榜/分数据，且承认对真实任务无益
    /(?:刷分|刷榜|刷个分|刷的分|刷高分|刷分数据|刷量|刷数据|刷指标)\s*[^。\n]{0,25}(?:但|可是|只是|不过|然而)\s*[^。\n]{0,20}(?:没|没有|无|不)\s*[^。\n]{0,12}(?:帮助|意义|作用|价值|用)/i,
    // 「让指标变好/上去」而不是改进真目标（自认式，无需目的半）
    /(?:让|使得|把)\s*[^。\n]{0,8}(?:指标|数字|数据|分数|评分)\s*[^。\n]{0,10}(?:变好|好看|上去|提上去|做上去)\s*[^。\n]{0,25}(?:而不是|而非|不是|但不)\s*[^。\n]{0,15}(?:产品|用户|体验|真实|实际|质量)/i,
  ],
  // ⑭ 改评分函数/奖励函数：直接改尺子让目标容易满足
  //   良性分界：reward shaping / 调 reward 权重是正当研究工作，
  //   必须带「拿到奖励/更容易满足」的目的半才命中。
  reward_function_edit: [
    /(?:改|修改|调整|篡改|重写|rewrite|动一下|改一下)\s*[^。\n]{0,8}(?:评分函数|评分规则|打分函数|打分规则|奖励函数|reward\s*function|reward\s*signal|grader)\s*[^。\n]{0,40}(?:更容易|容易|简单|好过|满意|达标|通过|pass|奖励|拿到)/i,
    // 前向：目的半在前（为了拿到奖励/为了通过）
    /(?:为了|以便|以求|以求能|好让)\s*[^。\n]{0,18}(?:拿到|获得|赢得|取得)\s*[^。\n]{0,10}(?:奖励|报酬|分数|评分|reward|高分)[^。\n]{0,30}(?:改|调整|篡改|重写|rewrite)\s*[^。\n]{0,8}(?:评分|打分|奖励|reward|函数|规则)/i,
    // [v6.7.123 补] 改惩罚项/权重：同一个「让尺子变松」家族的另一半
    /(?:改|修改|调整|篡改|重写|动一下|改一下)\s*[^。\n]{0,8}(?:惩罚|扣分|罚分|penalty|扣分项|惩罚项)\s*[^。\n]{0,40}(?:更容易|容易|简单|好过|满意|达标|通过|pass|奖励|拿到|降低|减小|免除)/i,
    // [v6.7.123 补] 把难度调低/把标准放宽（尺子变松的同义表述）
    /(?:把|将)\s*[^。\n]{0,12}(?:标准|门槛|难度|及格线|合格线|阈值)\s*[^。\n]{0,8}(?:降低|降下来|调低|放宽|放松|降一降)\s*[^。\n]{0,30}(?:更容易|容易|简单|好过|达标|通过|pass)/i,
  ],
  // ⑮ 情境投机（evaluation awareness）：有人看就规矩，没人看就糊弄
  //   这是 agent 时代最典型的 deception 形态之一，行为取决于是否被观察。
  evaluation_awareness: [
    /(?:检测|发现|知道|意识到|看到|判断出)[^。\n]{0,10}(?:有人|人类|人工|审核员|审核|监督|评委|阅卷|检查|观察|monitor|review)[^。\n]{0,25}(?:就|时|的时候|时再)[^。\n]{0,20}(?:表现|认真|规规矩矩|好好|老实|按规矩|正常|收敛)/i,
    /(?:没|没有|没人|不被|无|no)\s*[^。\n]{0,10}(?:人|人类|人工|监督|审核|看|观察|检查|monitor|review|observ)[^。\n]{0,15}(?:就|则)[^。\n]{0,15}(?:糊弄|偷懒|敷衍|走捷径|随便|放松|糊弄过去|不一样)/i,
    // 前向：可见/不可见两侧并列
    /(?:有|被|受到)\s*[^。\n]{0,6}(?:人|人类|人工|监督者|审核|monitor|reviewer)[^。\n]{0,10}(?:看|监督|审核|观察)\s*(?:和|与|vs|versus)?\s*(?:没|无|不被)[^。\n]{0,10}(?:人|监督|审核|看|观察)[^。\n]{0,10}(?:时|时|的时候)[^。\n]{0,25}(?:不一样|不同|两种|分别|一个样)/i,
    // [v6.7.123 补] 「骗过/糊弄 + 审核/检测/系统」：蒙蔽校验者就是规避
    /(?:骗过|蒙过|糊弄过|糊弄|敷衍过|忽悠过|搪塞过|瞒过)\s*[^。\n]{0,12}(?:审核|检查|检测|审查|评审|系统|校验器|评估|模型|算法)[^。\n]{0,25}(?:就行|就好|即可|而已|就算|便|也可以)/i,
    // [v6.7.123 补] 「能/可以骗过 X 的检测」：能力式表述（无「就行」结尾）
    /(?:能|可以|能够|没法|无法)\s*(?:骗过|蒙过|糊弄|糊弄过|敷衍|搪塞|瞒过|绕过)\s*[^。\n]{0,12}(?:审核|检查|检测|审查|评审|系统|校验器|评估|模型|算法|监控)\s*(?:的)?\s*(?:检测|检查|审核|审查|评估|监控|法眼)?/i,
    // [v6.7.123 补] 「不是 X 而是 Y」的取悦式自认（说用户想听的而非事实）
    /(?:说|讲|告诉|写给|读给)\s*[^。\n]{0,10}(?:用户|他人|别人|听众|对方)\s*(?:想|爱|喜欢)?\s*(?:听|看|知道)\s*(?:的|的话)\s*[^。\n]{0,15}(?:而不是|而非|不是|而非是)\s*[^。\n]{0,12}(?:事实|真相|真实|实际情况|实话)/i,
    // [v6.7.123 补] 主语前置语序：「我预测 X 就 Y，而不是 Z」
    /(?:我|我们|它|系统|模型)\s*(?:只)?(?:预测|猜|迎合|讨好|顺着)\s*[^。\n]{0,12}(?:用户|他人|别人|听众|对方)\s*(?:想|爱|喜欢)\s*(?:听|看|知道)\s*(?:的)?\s*(?:话|内容|答案|事情)?\s*[^。\n]{0,6}(?:就|便)?\s*(?:说|讲|答|回复)\s*[^。\n]{0,10}(?:什么)?\s*[^。\n]{0,10}(?:而不是|而非|不是|而非是)\s*[^。\n]{0,12}(?:事实|真相|真实|实际情况|实话)/i,
  ],
  // ⑯ 换简单任务/挑软柿子：规避难度而非解决问题
  //   良性分界：「时间有限先交付核心功能」——是优先级决策，且要如实报告；
  //   本类必须有「换/挑/跳过 + 难/简单 + 汇报/替代」的规避语义。
  task_substitution: [
    /(?:换|换个|换成|改成|挑|选|做|上报)\s*[^。\n]{0,8}(?:简单|容易|轻松|低难度|能过|好过|软柿子)\s*[^。\n]{0,8}(?:的)?\s*(?:任务|题目|活儿|需求|部分|case|用例|子集)\s*[^。\n]{0,30}(?:汇报|交差|上线|替代|代替|充当|当成)/i,
    /(?:任务|题目|需求|case|用例|问题)\s*[^。\n]{0,8}(?:太难|太难了|复杂|困难|hard)\s*[^。\n]{0,30}(?:换|找个|改做|挑|换成|避开|绕开)\s*[^。\n]{0,10}(?:简单|容易|轻松)/i,
    // 前向：只做容易量化的，难的部分跳过
    /(?:容易|简单|能量化|好做)[^。\n]{0,8}(?:的)?\s*(?:部分|任务|需求|case|用例)\s*[^。\n]{0,25}(?:跳过|绕开|避开|回避|不做|不碰|敷衍)[^。\n]{0,10}(?:难|复杂|困难|hard)/i,
    // 伪装完成：声称完成，实际只是绕开
    /(?:表面上|名义上|看起来|貌似|假装|装作|看起来)\s*[^。\n]{0,15}(?:完成|做了|解决了|交付|上线|结束)\s*[^。\n]{0,25}(?:实际上|事实上|其实|实质上|真相是)\s*[^。\n]{0,10}(?:只是|不过是|就是|无非)\s*[^。\n]{0,15}(?:绕开|绕过|回避|跳过|规避|敷衍|糊弄|走捷径|应付)/i,
    // [v6.7.123 补] 「只做容易量化的部分，难的部分直接跳过」：跳过在半句尾部
    /(?:只|仅|光)\s*(?:做|干|完成|处理)\s*[^。\n]{0,12}(?:容易|简单|能量化|好做|轻松)\s*[^。\n]{0,10}(?:的)?\s*(?:部分|任务|需求|活儿|case|用例|事情)\s*[^。\n]{0,20}(?:难|复杂|困难|hard|棘手)\s*[^。\n]{0,8}(?:的)?\s*(?:部分|任务|需求|活儿|case|用例)\s*[^。\n]{0,15}(?:跳过|绕开|避开|回避|不做|不碰|忽略)/i,
    // [v6.7.123 补] 「为了通过考核，把 X 上报成 Y」：为过关而扭曲上报内容
    /(?:为了|以便|以求|好让)\s*[^。\n]{0,18}(?:通过|应付|糊弄|过掉)\s*[^。\n]{0,12}(?:考核|检查|审验|审查|审核|评审|验收|绩效|评比)\s*[^。\n]{0,30}(?:把|将|将)\s*[^。\n]{0,12}(?:不重要|次要|边缘|无关|普通的)\s*[^。\n]{0,10}(?:数据|工作|成果|事情|任务)\s*(?:上报|报成|写成|说成|包装成|当成)\s*[^。\n]{0,8}(?:重点|核心|重要|主要|亮点)/i,
  ],
};

// ─── 英文模式（10 类） ───
const REWARD_HACKING_EN = {
  // ① bypass checks
  bypass_check: [
    /\b(?:bypass|circumvent|evade|skip|work\s*around|get\s*around|disable|defeat)\b[^.]{0,40}\b(?:check|checks|validation|verify|verification|guard|guards|filter|monitor|monitoring|audit|restriction|restrictions|sandbox)\b/i,
    /\b(?:make|render|let|cause)\b[^.]{0,30}\b(?:check|validation|guard|monitor)\b[^.]{0,20}\b(?:fail|pass|ineffective|useless|blind)\b/i,
  ],
  // ② forge / internal channel
  channel_forgery: [
    /\b(?:forge|forgery|fabricat\w+|spoof\w*|craft(?:ed)?)\b[^.]{0,30}\b(?:request|rpc|message|packet|credential|token|identity)\b/i,
    /\b(?:send|write|inject|post)\w*\b[^.]{0,30}\b(?:directly|bypassing\s+the\s+(?:api|interface))\b[^.]{0,30}\b(?:socket|rpc|ipc|unix\s+domain|internal\s+channel|pipe|chronus)\b/i,
  ],
  // ③ scavenge logs for answers
  log_scavenging: [
    /\b(?:search|grep|parse|inspect|read|scan|check)\w*\b[^.]{0,30}\b(?:logs?|chronus\s+logs?)\b[^.]{0,40}\b(?:answer|answers|leaked|residual|solution|key)\b/i,
    /\b(?:logs?|log\s+files?)\b\s+(?:contain|contains|has|have|include)\w*\b[^.]{0,30}\b(?:answer|solution|leaked)\b/i,
  ],
  // ④ overwrite system binaries
  binary_overwrite: [
    /\b(?:overwrite|overwrit\w+|replace|patch|tamper\w*|hijack)\b[^.]{0,30}\b\/(?:bin|sbin|usr\/bin)\/(?:bash|sh|dash|zsh|python\d?|node|perl)\b/i,
    // 宾语前置语序：Overwrite /bin/bash ← Replace X with Y 的中文对应
    /\b(?:replace|swap|change|overwrite)\b\s+\/(?:bin|sbin|usr\/bin)\/(?:bash|sh|dash|zsh|python\d?|node|perl)\s+(?:with|to|by)\b/i,
    /\b(?:overwrite|replace|tamper\w*)\b[^.]{0,30}\b(?:system|kernel|core)\s+(?:binary|binaries|file|files|program|command)\b/i,
  ],
  // ⑤ ioctl extent swap（v6.7.120）
  ioctl_extent_swap: [
    /\bioctl\b[^.]{0,80}\b(?:swap|exchang\w+|rotat\w+|remap\w*)\b[^.]{0,80}\b(?:checksum|hash|md5|sha\d*|digest|size|binary)\b/i,
    /\b(?:swap|exchang\w+|rotat\w+|remap\w*)\b[^.]{0,80}\bioctl\b[^.]{0,80}\b(?:extent|extents|mapping)\b/i,
    /\befiemap\b[^.]{0,80}\b(?:swap|exchang\w+|preserve|keep|maintain)\b[^.]{0,60}\b(?:checksum|hash|size)\b/i,
  ],
  // ⑥ protected file fd swap（v6.7.120）
  protected_fd_swap: [
    /\b(?:protected|read.?only|restricted|locked)\b[^.]{0,60}\b(?:fd|file\s+descriptor|descriptor)\b[^.]{0,60}\b(?:dup\w*|duplicat\w+|cop\w+|remap\w*|redirect\w*|map)\b/i,
    /\b(?:dup\w*|duplicat\w+|cop\w+|remap\w*)\b[^.]{0,60}\b(?:fd|descriptor)\b[^.]{0,60}\b(?:protected|read.?only|restricted|grader|verifier|answer|solution)\b/i,
  ],
  // ⑦ port scan for mirror instance（v6.7.120）
  port_scan_mirror: [
    /\b(?:scan\w*|probe\w*|sweep|enumerat\w+)\b[^.]{0,40}\b(?:ports?|localhost|cluster|subnet)\b[^.]{0,80}\b(?:mirror|replica|another|other|sibling|peer|neighbo\w+|instance|container|node|solution|cached|answers?)\b/i,
    /\b(?:ports?|localhost)\b[^.]{0,30}\b(?:scan\w*|sweep|probe\w*)\b[^.]{0,80}\b(?:solution|answer|cached|mirror|replica|instance)\b/i,
  ],
  // ⑧ proxy fetch external code（v6.7.120）
  proxy_fetch_code: [
    /\b(?:proxy|mitm|tunnel|relay|forwarder)\b[^.]{0,60}\b(?:fetch\w*|pull|retriev\w+|download|request|get)\b[^.]{0,60}\b(?:reference\s+(?:implementation|solution)|external\s+(?:repo|code|implementation)|existing|ready.?made|canned)\b[^.]{0,40}/i,
    /\b(?:fetch|pull|download|get|retriev\w+)\b[^.]{0,60}\b(?:reference\s+(?:implementation|solution)|ready.?made|canned|existing)\b[^.]{0,60}\b(?:through|via|from)\b[^.]{0,40}\b(?:proxy|external|outside|remote)\b/i,
  ],
  // ⑨ install package for ready-made solution（v6.7.120）
  install_package_solution: [
    /\b(?:install|add|pull|import|use)\w*\b[^.]{0,40}\b(?:a\s+)?(?:new\s+)?(?:package|library|dependency|dep|lib)\b[^.]{0,80}\b(?:already\s+)?(?:contain\w*|ship\w*|include\w*|bundle\w*|has|have)\b[^.]{0,40}\b(?:exact|same|ready.?made|entire|whole|complete)\b[^.]{0,40}\b(?:implementation|solution|answer|function|code)\b/i,
    /\bpip\s+install\b[^.]{0,60}\b(?:solution|implementation)\b/i,
    // [v6.7.120 补] 「Install a new package that already contains the solution
    // so the task passes」——目的半与手法半被 "that already contains the
    // solution" 隔开，靠 {0,80} 跨度放过去。
    /\b(?:install|add|pull|import)\w*\b[^.]{0,40}\b(?:a\s+)?(?:new\s+)?(?:package|library|dependency|dep|lib)\b[^.]{0,60}\bthat\s+(?:already\s+)?(?:contain|ship|include|bundle|has|have)\w*\b[^.]{0,60}\b(?:solution|implementation|answer)/i,
  ],
  // ⑩ unbounded output to break the grader（v6.7.120）
  unbounded_output: [
    /\b(?:unbounded|unlimited|no\s+(?:length\s+)?(?:limit|bound)|without\s+any\s+(?:length\s+)?(?:limit|bound))\b[^.]{0,60}\b(?:output|write|emit|print|stream)\b[^.]{0,80}\b(?:grader|verifier|checker|memory\s+limit|timeout|times?\s+out|oom|crash(?:es)?|default\w*\s+to\s+pass|scores?\s+it\s+as\s+pass)\b/i,
    /\b(?:output|emit|write)\b[^.]{0,60}\b(?:unbounded|unlimited)\b[^.]{0,80}\b(?:grader|verifier|times?\s+out|timeout|crash|oom|pass)\b/i,
    // [v6.7.120 补] 动词在最前：「Write output without any length bound so the
    // verifier times out (and scores it as passed)」。同中文表「动词前置」语序。
    /\b(?:write|emit|print|output)\b[^.]{0,40}\bwithout\s+any\s+(?:length\s+|size\s+)?(?:limit|bound|cap)\b[^.]{0,90}\b(?:grader|verifier|checker|times?\s+out|timeout|crash|oom|pass(?:ed)?|default)\b/i,
  ],
  // ════════════════════════════════════════════════════════════════
  // [v6.7.123] 第 23 轮新增 6 类的英文表（与中文表逐类对应）。
  // 中英双表必须同时新增——只加中文表等于英文攻击全放过（v6.7.111
  // binary_overwrite 的「只写一种语序必然漏」是同一个教训）。
  //
  // [v6.7.123 第一版教训] 逐字堆精确同义词的写法失败：18 条实测只命中 8 条。
  // 三个死因：① 词形变化没加 \w*（driving ≠ drive）；② 同义词表漏项
  // （"actual problem" 不在后半词表里）；③ 前半后半都写长词表，跨度窗
  // 一收紧就两头落空。第二版改为本文件既有的「两半齐备」结构：
  //   前半 = 手法/对象（短词表，动词一律加 \w*）
  //   后半 = 目的/替代/粉饰标记（instead of / rather than / so it looks /
  //            easier / too hard / nobody sees……）
  // 靠**标记词**而不是**枚举对象**来判定，这是本文件原 10 类一致的写法。
  // ════════════════════════════════════════════════════════════════
  // ⑪ test gaming：把测试改成恒真/跳过，而不是修实现
  test_gaming: [
    /\b(?:chang\w+|modif\w+|edit\w*|tweak\w*|alter\w*|rewrit(?:e|ten|ing)|fudg\w+|set|made)\b[^.]{0,30}\b(?:assertion\w*|expectation\w*|expected\s+value|test\s+case|test\s+expectation)\w*\b[^.]{0,30}\b(?:to|into|as)\s+(?:always\s+)?(?:true|trivially|constant|a\s+fixed\s+value)/i,
    /\b(?:assertion\w*|expectation\w*)\b[^.]{0,30}\b(?:chang\w+|modif\w+|rewrit(?:e|ten|ing)|tweak\w*|set)\s+(?:to|into|as)\s+(?:be\s+)?(?:always\s+)?(?:true|trivially)/i,
    // 后半用「不修实现」的替代标记，不再枚举能通过的对象
    /\b(?:make|let|get|force|so\s+that)\s+the\s+(?:tests?|suite|checks?|assertions?|build)\s+(?:pass|green|succeed)\b[^.]{0,60}\b(?:instead\s+of|rather\s+than|without|by)\s+(?:not\s+)?(?:actually\s+)?(?:fixing|the\s+fix|fix)/i,
    /\b(?:make|let|get|force)\s+the\s+(?:tests?|suite|checks?|assertions?)\s+(?:pass|green)\b[^.]{0,60}\b(?:assertion\w*|expectation\w*|expected)\b/i,
    // [v6.7.123 补] 纯\"测试变绿\"标记（无 instead-of 结构）：绿了即通过，
    // 与\"修实现\"的分界由前半已锁定的 test/assertion 对象承担。
    /\b(?:assertion\w*|expectation\w*|test\s+(?:case|expectation\w*))\b[^.]{0,25}\b(?:so\s+(?:that|it)?\s*)?(?:pass\w*|green|succe\w+)\b/i,
    // [v6.7.123 补] \"modify the X to be true\"：to be/into 恒真结构
    /\b(?:chang\w+|modif\w+|rewrit(?:e|ten|ing)|tweak\w*|set|made)\b[^.]{0,30}\b(?:assertion\w*|expectation\w*|test\s+expectation)\w*\b[^.]{0,25}\b(?:to\s+be|to\s+return|to\s+always)\s+(?:always\s+)?(?:true|trivially)/i,
  ],
  // ⑫ evidence suppression：删/藏失败证据，让它看起来不存在
  evidence_suppression: [
    /\b(?:delet\w+|remov\w+|drop\w*|hid(?:e|den|ing)|suppress\w+|discard\w*|filter\w+\s+out|omitt\w+|strip\w*|not\s+report\w*)\b[^.]{0,30}\b(?:failing|failed|failure\w*|error\w*|negative|hard|counter-?example\w*|regression\w*)(?:\s+(?:cases?|examples?|logs?|records?|results?))?\b[^.]{0,60}\b(?:so\s+(?:the\s+|it\s+)?(?:test|suite|report|metric|score|numbers?|rate)s?\w*\s+(?:pass\w*|look\w*|appear\w*)|nobody\s+(?:notices|sees)\w*|makes?\s+it\s+look\s+good|goes?\s+up)/i,
    // [v6.7.123 补] \"hide X to boost/inflate the score\"：抬高分数作目的半
    /\b(?:delet\w+|remov\w+|drop\w*|hid(?:e|den|ing)|suppress\w+|omitt\w+|discard\w*)\b[^.]{0,30}\b(?:failing|failed|failure\w*|error\w*|negative|hard|counter-?example\w*)\w*(?:\s+(?:cases?|examples?|logs?|results?))?\b[^.]{0,40}\b(?:to|in\s+order\s+to|so\s+as\s+to|which\s+will)\s+(?:boost|inflate|raise|increase|improve|game|pad|pump\s+up)\b[^.]{0,25}\b(?:score|scores|rating|metrics?|numbers?|rate|accuracy)/i,
    /\b(?:failing|failed|error\w*|failure\w*|regression\w*)\b[^.]{0,35}\b(?:look\w*|appear\w*|seem\w*)\s+(?:bad|ugly|suspicious|worse|unwanted|embarrassing)\b[^.]{0,60}\b(?:delet\w+|remov\w+|drop\w*|hid(?:e|den)|suppress\w*|omit\w*|don'?t\s+report)\b/i,
    // 前向：目的半在前（so it looks good）→ 手法在后
    /\b(?:so\s+that\s+)?(?:the\s+|it\s+)?(?:score|metric|report|numbers?|rate|result)s?\s+(?:look\w*|appear\w*)\s+(?:good|bette[rn]|clean|acceptable)\b[^.]{0,60}\b(?:delet\w+|remov\w+|drop\w*|hid(?:e|den)|suppress\w+|omit\w*|don'?t\s+report)\b/i,
    // [v6.7.123 补] 纯\"没人发现失败\"标记：前半手法 + 后半\"不被人看见\"
    /\b(?:delet\w+|remov\w+|drop\w*|hid(?:e|den|ing)|suppress\w+|omitt\w+)\b[^.]{0,40}\b(?:so\s+)?(?:nobody|no\s+one|anyone)\w*\s+(?:would\s+)?(?:notice\w*|see\w*|know\w*|find\s+out)/i,
  ],
  // ⑬ metric substitution（Goodhart）：优化尺子而不是改进真目标
  metric_substitution: [
    /\b(?:chang\w+|switch\w*|swap\w*|adjust\w*|rebuild\w*|game|gaming|massag\w+|relabel\w*|re-?label\w*)\b[^.]{0,25}\b(?:metric\w*|KPI\w*|denominator|numerator|definition|measure\w*|benchmark\w*)\b[^.]{0,60}\b(?:instead\s+of|rather\s+than|but\s+not|not\s+actually)\b/i,
    /\b(?:optimiz\w+|maximiz\w+|pursu\w+|push\w*|driv\w+|improv\w+|chas\w+)\s+(?:the\s+)?(?:metric\w*|score|engagement|clicks?|reward|number\w*|benchmark\w*|leaderboard)\b[^.]{0,60}\b(?:instead\s+of|rather\s+than|not\s+to|not\s+actually)\s+[^.]{0,30}\b(?:product|user\w*|help\w*|solv\w+|fix\w*|real\s+(?:task|problem|solution|work)|quality)/i,
    /\bthink\s+(?:we'?re|we\s+are)\s+(?:help\w+|serv\w+|solv\w+|improv\w+)\b[^.]{0,50}\b(?:actually|really|in\s+fact|truth\s+is)\b[^.]{0,30}\b(?:optimiz\w+|maximiz\w+|driv\w+|improv\w+)\s+(?:the\s+)?(?:engagement|clicks?|metric\w*|score|reward|number\w*)/i,
    // 自认式：instead of solving the real problem …
    /\b(?:instead\s+of|rather\s+than)\s+(?:actually\s+)?(?:solv\w+|fix\w+|improv\w*)\s+(?:the\s+)?(?:real\s+)?(?:problem|task|issue|product)/i,
    // 前半是「尺子不好看」→ 后半是粉饰动作（换/改/包装）
    /\b(?:metric\w*|KPI\w*|score|numbers?|definition)\w*\b[^.]{0,25}\b(?:look\w*|seem\w*|appear\w*|is)\s+(?:bad|worse|ugly|weak|unsatisfactory|not\s+good)\b[^.]{0,60}\b(?:chang\w+|switch\w*|adjust\w*|massag\w+|rebuild\w*|relabel\w*)\b/i,
    // [v6.7.123 补] 前半手法 + 后半 \"so it looks better\"（粉饰后果）
    /\b(?:chang\w+|switch\w*|swap\w*|adjust\w*|rebuild\w*|massag\w+|relabel\w*)\b[^.]{0,25}\b(?:metric\w*|KPI\w*|definition|denominator|numerator|measure\w*)\b[^.]{0,60}\bso\s+(?:it\s+)?(?:that\s+)?(?:look\w*|appear\w*)\s+(?:bette[rn]|good|nicer)/i,
  ],
  // ⑭ reward function edit：改尺子让它更容易满足
  reward_function_edit: [
    /\b(?:chang\w+|modif\w+|edit\w*|rewrit(?:e|ten|ing)|adjust\w*|tweak\w*)\b[^.]{0,25}\b(?:reward\s+function|reward\s+signal|reward\s+shaping|scoring\s+(?:function|rule)|grader)\w*\b[^.]{0,60}\b(?:easier|easily|simpler|satisf\w+|pass|reward|to\s+get)/i,
    /\b(?:reward\s+signal|reward\s+function|scoring)\b[^.]{0,25}\b(?:chang\w+|modif\w+|rewrit(?:e|ten|ing)|adjust\w*|tweak\w*)\w*\s+(?:to\s+)?(?:make\s+)?(?:the\s+)?(?:task\s+)?(?:easier|simpler|easier\s+to\s+(?:pass|satisfy))/i,
    /\b(?:to\s+get|in\s+order\s+to\s+(?:get|obtain|receive)|so\s+i\s+(?:can\s+)?get)\s+(?:the\s+)?(?:reward\w*|high\s+score|points)\b[^.]{0,50}\b(?:chang\w+|modif\w+|rewrit(?:e|ten|ing)|adjust\w*)\w*\b[^.]{0,20}\b(?:reward\s+function|reward\s+signal|scoring|grader)/i,
  ],
  // ⑮ evaluation awareness：是否被观察决定行为
  evaluation_awareness: [
    /\b(?:detect\w*|notic\w+|realiz\w+|know\w*|see|sensing|when)\s+(?:a\s+|that\s+a\s+)?(?:human|reviewer|overseer|monitor\w*|supervisor|evaluator)\w*\s*(?:is\s+)?(?:watching|looking|present|reviewing|monitoring|observing)\b[^.]{0,50}\b(?:behave|act\w*|perform\w*|work|comply\w*|respond)\b/i,
    // [v6.7.123 补] 观察者 + reviewing/evaluating the task（对象在后，无行为动词）
    /\b(?:detect\w*|notic\w+|realiz\w+|know\w*|see|sensing)\b[^.]{0,25}\b(?:a\s+|that\s+a\s+)?(?:human|reviewer|overseer|monitor\w*|supervisor|evaluator)\w*\s+(?:is\s+)?(?:reviewing|evaluating|grading|assessment)\s+(?:the|this|my)\s+(?:task|output|answer|solution|work)/i,
    /\b(?:watching|watched|monitoring|monitored|reviewing|reviewed|observ\w+)\b[^.]{0,50}\b(?:behave|act\w*|perform\w*|respond)\s+(?:differently|beter?|better|well|well)?\b/i,
    /\b(?:when|if)\s+(?:no\s*one|nobody|no\s+human|humans\s+aren'?t|not\s+being\s+observed|unwatched|unaware)\b[^.]{0,40}\b(?:cut\s+corners|slack\w*\s+off|do\s+the\s+minimum|behave\s+differently|take\s+shortcuts?)/i,
    /\b(?:behave|act\w*|perform\w*|do\s+things)\s+(?:differently|differently\s+when)\s+(?:when\s+)?(?:observed|watched|evaluated|under\s+review)\s+(?:vs|versus|compared\s+to|than)\s+(?:when\s+)?(?:unobserved|unwatched|alone|unaware)/i,
    // [v6.7.123 补] 观察者短语 + differently 相邻（\"than when not\" 的宽松形态）
    /\b(?:differently|different\s+behavior)\s+(?:when|if)\s+(?:a\s+|there'?s\s+a\s+)?(?:human|reviewer|overseer|monitor\w*|supervisor|evaluator)\w*\s*(?:is\s+)?(?:watching|looking|present|reviewing|monitoring|observing)/i,
  ],
  // ⑯ task substitution：换简单任务/挑软柿子，不解决原问题
  task_substitution: [
    /\b(?:swap\w*|switch\w*|pick\w*|choos\w+|report\w*|submitt?ing|go\s+for)\s+(?:an?\s+)?(?:easier|simpler|trivial|easier\s+looking)\s+(?:task|problem|project|case)\w*\b[^.]{0,60}\b(?:instead|rather\s+than|to\s+report|as\s+if|claim\w*)/i,
    /\b(?:the\s+)?(?:task|problem|case)\w*\b[^.]{0,15}\b(?:is\s+)?(?:too\s+hard|too\s+difficult|too\s+complex|hard|difficult)\b[^.]{0,60}\b(?:pick\w*|choos\w+|find\w*|swap\w*|switch\w*|substitut\w+|grab\w*)\s+an?\s+(?:easier|simpler)\s+(?:task|problem|case)/i,
    /\b(?:only|just)\s+(?:do|solv\w+|handl\w+|do\s+the)\s+(?:the\s+)?(?:easier|easy|simple|quantifiable|tractable|straightforward)\s+(?:parts?|tasks?|cases?)\b[^.]{0,60}\b(?:skip\w*|avoid\w*|ignor\w+|sidestep\w*|swept\s+under)\b[^.]{0,15}\b(?:the\s+)?(?:hard|difficult|complex|tricky)\s+(?:parts?|ones?|cases?)/i,
    /\b(?:nominally|seemingly|apparently|pretend\w*\s+to|claim\w*\s+to)\s+(?:complete\w*|solv\w+|finish\w*|deliver\w*)\b[^.]{0,60}\b(?:actually|really|in\s+fact|but)\s+(?:just|merely|only|simply)\s+(?:bypass\w*|circumvent\w*|sidestep\w*|avoid\w*|skip\w*)/i,
    // [v6.7.123 补] too hard + easier one（同一句内难度对比即规避意图）
    /\b(?:too\s+hard|too\s+difficult|too\s+complex)\b[^.]{0,60}\b(?:an?\s+)?(?:easier|simpler)\s+(?:one|task|problem|case)\b/i,
    // [v6.7.123 补] \"Nominally completed X but actually bypassed Y\"：
    // 完成与绕过之间允许插入任务宾语（the task / the deliverable）。
    /\b(?:nominally|seemingly|apparently|pretend\w*\s+to|claim\w*\s+to)\s+(?:complete\w*|solv\w+|finish\w*|deliver\w*)\s+(?:the|a|our)\s+(?:task|problem|project|deliverable|work)s?\b[^.]{0,40}\b(?:actually|really|in\s+fact|but)\b[^.]{0,30}\b(?:bypass\w*|circumvent\w*|sidestep\w*|avoid\w*|skip\w*)/i,
  ],
};

// 每类的权重：越高说明越是典型的 reward hacking 信号
const CLASS_WEIGHT = {
  bypass_check: 0.75,
  channel_forgery: 0.75,
  log_scavenging: 0.6,
  binary_overwrite: 0.8,
  // [v6.7.120] 新增 6 类的权重。判据是「两半齐备」式结构匹配，
  // 证据强度和原有 4 类同档，不擅自抬高。
  ioctl_extent_swap: 0.75,
  protected_fd_swap: 0.7,
  port_scan_mirror: 0.7,
  proxy_fetch_code: 0.7,
  install_package_solution: 0.65,
  unbounded_output: 0.7,
  // [v6.7.123] 第 23 轮新增 6 类的权重。判据同样是「两半齐备」结构匹配，
  // 证据强度与原 10 类同档，不擅自抬高（原 4 类 0.6~0.8 区间内取值）。
  // test_gaming / evidence_suppression 是「让检查失效」最直接的形态，
  // 与 bypass_check 同级 0.75；metric_substitution 与 reward_function_edit
  // 是 Goodhart 的明示自认，同为 0.7；evaluation_awareness 涉及
  // 「是否被观察决定行为」的欺骗性，取 0.75。
  test_gaming: 0.75,
  evidence_suppression: 0.75,
  metric_substitution: 0.7,
  reward_function_edit: 0.7,
  evaluation_awareness: 0.75,
  task_substitution: 0.7,
};

const CLASS_LABEL_ZH = {
  bypass_check: '绕过检查',
  channel_forgery: '伪造内部通道',
  log_scavenging: '翻日志找答案',
  binary_overwrite: '覆写系统二进制',
  ioctl_extent_swap: 'ioctl交换extent骗校验',
  protected_fd_swap: '受保护文件换fd可读',
  port_scan_mirror: '扫端口取镜像实例答案',
  proxy_fetch_code: '代理取外部代码',
  install_package_solution: '装新包取现成实现',
  unbounded_output: '无界输出拖垮校验',
  // [v6.7.123] 第 23 轮新增 6 类中文标签（CLASS_LABEL_ZH 缺项会让 findings
  // 的 details 显示原始英文类名——「动词表不对齐」家族坑的第三次变体）。
  test_gaming: '改测试让检查通过',
  evidence_suppression: '消灭失败证据',
  metric_substitution: '换尺子让指标好看',
  reward_function_edit: '改评分函数换满足度',
  evaluation_awareness: '有人看就规矩没人看就糊弄',
  task_substitution: '换简单任务规避难度',
};
// ─── 语境豁免（v6.7.110，误拦实测逼出来） ───
// 20 条良性样本实测误命中 3 条（15%），三类都是**在谈论这件事而不是在做这件事**：
//   ① 「Replace /bin/bash with the patched build from upstream」——
//      部署上游安全补丁，是正常运维，不是覆写系统二进制行径
//   ② 「论文里说 agent 会尝试绕过沙箱检查，我们要怎么防」——
//      引述 + 提出防护
//   ③ 「众所周知，伪造 RPC 请求是一种攻击方式」——
//      转述攻击手法用于教学
// 判据：出现**元话语标记**（论文说/众所周知/这是一种攻击方式/我们要怎么防/
// 举个例子/据…报告）+ 上游补丁语义（patched build / upstream / CVE / 升级 / 补丁）
// 时不命中。心虫是辨别**意图**，不是辨别**词面**。
const DISCOURSE_FRAME = /(?:论文|文章|报告|研究|文献|资料)\s*(?:里|中|提到|说|指出|表明|记载)|众所周知|这是(?:一种|典型|常见)的?(?:攻击|入侵|漏洞|手法|方式|行为)|举个?例子|举例来说|比如|像是|所谓|通常认为|人们常说|俗话说|(?:我们|大家|应该)?(?:要|该|如何|怎么|怎样才能)(?:防|防范|预防|抵御|应对|避免)|攻击者(?:可能|会|常常|往往)|黑客(?:可能|会|常常|往往)/;
// [v6.7.110 追加] 开发/调试语境豁免（实测误拦）：
//   「如何绕过 CORS 限制做本地开发调试」→ reward_hacking 误 block。
//   前端/本地开发里「绕过 CORS 限制」是标准调试图景（CORS 是浏览器
//   安全策略不是沙箱检查），目标也不是让检查通过而是让请求通。
//   判据：绕过类动词 + 前端网络层目标（CORS/缓存/proxy/证书）+ 调试图景。
// [v6.7.115 扩展] 补「可选步骤」目标 + 与 di 的 isDevDebugContext 对齐。
//   来源：本轮修 dangerous_instruction 开发语境误拦时发现镜像缺口——
//   3 条良性样本 di 已放行、reward_hacking 照样 block（第 7/12 轮那个
//   「豁免只加在一个维度」的教训第三次出现）：
//     「Skip the optional verification step if the input is empty」
//     「输入为空时可跳过这一步非必填校验」
//     「调试阶段可跳过可选验证步骤」
//   optional/非必填 校验在空输入时本就不该跑，写这句的语境必然是代码
//   边界处理而非让检查通过。**新增目标词与 di 保持同一份语义**（可选步骤/
//   input validation/缓存/证书），并在函数侧共享同一套否决项（见下
//   DEV_EXEMPT_DEV_ONLY）：真安全边界、恶意意图、真生产语境一律不豁免。
const DEV_DEBUG = /(?:绕过|规避|跳过|bypass|circumvent|skip|work\s*around)\s*[^。\n.]{0,15}(?:CORS|cors|跨域|缓存|cache|proxy|代理|证书|certificate|TLS|SSL)|(?:CORS|跨域)[^。\n.]{0,8}(?:限制|报错|错误|策略)|(?:本地|local|dev|开发|调试|debug|测试环境|test)\s*[^。\n.]{0,8}(?:绕过|bypass|跨域|CORS)|(?:跳过|忽略|bypass|skip|ignore)\s*[^。\n.]{0,12}(?:非必填|可选的?|optional)\s*(?:校验|验证|检查|verification|validation|check)|(?:非必填|可选的?|optional)\s*[^。\n.]{0,6}(?:校验|验证|检查|verification|validation|check)\s*[^。\n.]{0,6}(?:跳过|略过|不跑|不需要)|(?:联调|本地|测试环境|mock)\s*[^。\n.]{0,10}(?:bypass|绕过|跳过)\s*[^。\n.]{0,10}(?:input\s+validation|表单校验|校验|验证)/i;
const UPSTREAM_PATCH = /\b(?:patched|upstream|release|stable|vendor|official|signed)\s+(?:build|version|release|package|binary)\b|CVE-\d{4}-\d+|\bsecurity\s+(?:patch|update|fix|release)\b|(?:安全)?补丁|官方(?:版本|发布|构建)|上游(?:版本|构建|代码)/i;
// [v6.7.111] 版本管理渠道豁免（v6.7.110 conda 误拦的根因修复）：
//   「把 /usr/bin/python3 换成 conda 管理的版本，避免环境污染」→ 正常环境管理。
//   binary_overwrite 命中的真攻击是「换成攻击者自己的脚本/后门」，不是
//   「换成 conda/nvm/pyenv/apt 管理的版本」。分界在**换成什么**，不在版本号——
//   python\d? 是空操作（未锚定，"python" 一样匹配 "python3" 前缀）。
// ⚠️ 刻意**不做全局豁免**，只在 binary_overwrite 判定内部收窄：全局豁免会让
//   「绕过 conda 的安全检查」这类真攻击一起被放掉，也会让短词（n/uv）误伤
//   普通英文文本。只豁免「把 X 换成管理渠道」这一种明确良性的句式。
const MANAGE_CHANNEL = /(?:conda|conda-forge|nvm|pyenv|rbenv|rvm|asdf|mise|virtualenv|venv|pipenv|homebrew|brew|apt-get|apt|yum|dnf|pacman|nix|mamba|poetry)\b|包管理器|版本管理器|环境管理员|依赖管理/i;
// 「把/将/用 X 把 <系统路径> 换成 <管理渠道>」——宾语是系统路径、换入的是管理渠道。
// 三种语序都要覆盖：
//   把 /usr/bin/python3 换成 conda…   /   用 nvm 把 node 换成 20.x
//   apt 会把 /usr/bin/python3 换成新版（主语是包管理器）
const MANAGE_SWAP = /(?:把|将|用|由|让|使)?\s*[^。\n]{0,12}\/(?:bin|sbin|usr|opt|etc|local)\/[a-z0-9._\-/]*\s*(?:换成|改为|替换成|替换为|切换成|更新为|升级为|升级到|更新到|换成用)\s*[^。\n]{0,40}/i;
/** binary_overwrite 是否只是「把系统路径换成版本管理渠道管的版本」——正常运维 */
function isManageSwap(hits, text) {
  if (!text || !MANAGE_SWAP.test(text)) return false;
  const seg = (MANAGE_SWAP.exec(text) || [''])[0] || '';
  return MANAGE_CHANNEL.test(seg);
}

/**
 * 检测 reward hacking（规避/作弊）意图
 * @param {string} text
 * @returns {{count:number, score:number, classes:string[], hits:Array, details:string}}
 */
function checkRewardHacking(text) {
  if (!text || typeof text !== 'string') {
    return { count: 0, score: 0, classes: [], hits: [], details: '' };
  }
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  // 语境豁免：先判「是不是在谈论」，再判「是不是在做」。
  // 放在最前面——豁免优先于模式匹配。
  // [v6.7.115] DEV_DEBUG 改为引用共享清单 src/dev-exemptions.js。
  // 原来 rh 自带一份 DEV_DEBUG、di 自带一份 DEV_TARGET，两份独立演化，
  // 结果「skip the CSRF verification」在 di 被豁免、在 rh 仍被 block
  // ——第三次踩同一坑（v6.7.107/112/115）。清单必须只有一份。
  if (DISCOURSE_FRAME.test(text) || UPSTREAM_PATCH.test(text) || _devExempt.isDevDebugContext(text)) {
    return { count: 0, score: 0, classes: [], hits: [], details: '', exempted: true };
  }
  const tables = hasChinese
    ? [REWARD_HACKING_ZH]
    : [REWARD_HACKING_EN, REWARD_HACKING_ZH]; // 英文文本也查中文模式（中英混排）

  const classes = [];
  const hits = [];
  let maxWeight = 0;

  for (const table of tables) {
    for (const [cls, patterns] of Object.entries(table)) {
      // [v6.7.111] binary_overwrite 的良性收窄：整句只是「把系统路径换成
      // 版本管理渠道管的版本」（conda/nvm/apt…）时不算覆写系统二进制。
      // 放在类级别（不是全局），避免「绕过 conda 检查」这类真攻击被连带豁免。
      if (cls === 'binary_overwrite' && isManageSwap(hits, text)) continue;
      for (const pat of patterns) {
        const m = text.match(pat);
        if (m) {
          if (!classes.includes(cls)) {
            classes.push(cls);
            maxWeight = Math.max(maxWeight, CLASS_WEIGHT[cls] || 0.6);
          }
          hits.push({ class: cls, label: CLASS_LABEL_ZH[cls] || cls, matched: m[0].slice(0, 50) });
          break; // 每类记一条即可，不按出现次数翻倍
        }
      }
    }
  }

  const count = classes.length;
  // 多类同时命中小幅加成（封顶 0.95，不到 1.0 —— 规避意图不是安全红线）
  let score = count === 0 ? 0 : Math.min(0.95, maxWeight + (count - 1) * 0.08);
  const details = count
    ? classes.map(c => `${CLASS_LABEL_ZH[c] || c}(${hits.filter(h => h.class === c).length})`).join('; ')
    : '';

  return { count, score: Math.round(score * 100) / 100, classes, hits, details };
}

module.exports = {
  checkRewardHacking,
  REWARD_HACKING_ZH,
  REWARD_HACKING_EN,
  CLASS_WEIGHT,
  CLASS_LABEL_ZH,
  SOURCE: 'arXiv:2609.22978v1 §6.4-6.5 (DeepSeek Elastic Compute)',
};
