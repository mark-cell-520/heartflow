/**
 * [r631] 高危意图族补充判据 —— boundaryNeg 风险矩阵此前只认 7 个动作关键词，
 * 对「索取凭据 / 窃取外发 / 绕过验证 / 毁灭痕迹 / 伪造身份」这一整族
 * 高风险操作描述零覆盖：calculateRiskScore 恒回退 actionType='读取'、
 * baseRisk=10、needsNegotiation 走 low_risk_auto_allowed 恒 allowed=true。
 * 实测 10/10 条危险动作全部绕过（见 scripts/round-631-probe3.js 落盘证据）。
 *
 * 判据口径（不引入 LLM，纯规则）：
 *   · 每个 pattern 命中即抬升对应风险分，多家族命中取最高分而非累加，
 *     避免长句被同义词堆叠刷爆分数（那会误伤良性的长说明文）
 *   · 分数抬到 high_risk 阈值以上 → needsNegotiation 判需协商
 *      （沿用既有 fuzzyZones 的 high_risk_requires_fresh_consent 语义）
 *   · 良性动作族（读文档/整理纪要/统计行数/排序/写邮件）零命中，
 *     保证 required 基线不劣化
 */

// 高危意图族：动作描述里出现这些特征即视为高敏感操作。
// 分组即家族：credential_theft / exfiltration / auth_bypass /
//             evidence_destruction / identity_forgery / privilege_abuse
const HIGH_INTENT_PATTERNS = [
  {
    id: 'credential_access',
    category: 'credential_theft',
    score: 80,
    patterns: [
      /(拿到|获取|窃取|盗取|骗取|套出|问出|拿到).{0,12}(密码|口令|凭据|令牌|token|密钥|私钥|secret)/i,
      /(管理[员者]?|root|admin|superuser).{0,8}(密码|口令|凭据|密钥)/i,
      /(密码|口令|凭据|密钥).{0,12}(发[给我给]|告诉[我给]|列[出来举]|导出|打印)/i,
      /(保存|记住|存下).{0,8}(用户|别人|他人|所有)?.{0,4}(密码|凭据)/i,
    ],
  },
  {
    id: 'data_exfiltration',
    category: 'exfiltration',
    score: 85,
    patterns: [
      /(导?出|下载|打包|压缩|转发|发|传|同步|上传).{0,14}(到|至|去|给).{0,14}(外部|外网|公网|境外|私人|个人)?(服务器|邮箱|网盘|地址|站点|第三方)/i,
      /(客户|用户|会员|病人|员工)?(的)?(手机号|电话|身份证|住址|银行卡|薪资|病历|联系方式).{0,16}(全部|批量|整[套个]|所有)?(导?出|下载|打包|转发|发|泄露|出售)/i,
      /(泄露|售卖|出售|外传|扩散)(客户|用户|会员|病人|员工|公司|内部)?(数据|信息|资料|名单|隐私)/i,
      /(批量|自动).{0,6}(抓取|爬取|采集|收集).{0,10}(用户|客户|个人)?(隐私|信息|数据)/i,
    ],
  },
  {
    id: 'auth_bypass',
    category: 'auth_bypass',
    score: 88,
    patterns: [
      /(绕过|跳过|关闭|禁用|屏蔽|规避).{0,12}(验证|认证|授权|登录|审核|校验|风控|质检|检[测查])/i,
      /(破解|爆破|撞库|暴力).{0,8}(密码|口令|账[号户]|系统|验证)/i,
      /(免|无需|不).{0,4}(登录|验证|认证|授权|审核).{0,8(访问|进入|使用|下载)/i,
      /(伪造|伪装|冒用|借用)(身份|账号|凭据|签名|证书)/i,
    ],
  },
  {
    id: 'evidence_destruction',
    category: 'coverup',
    score: 82,
    patterns: [
      /(删|清除|清空|抹掉|销毁|覆盖|擦除).{0,14}(日志|记录|痕迹|审计|历史|备份|监控)/i,
      /(别|不要|不[能许])(让|被)?.{0,6}(人|别)?.{0,4}(发现|知道|查[到起]|看见|追查)/i,
      /(偷偷|暗中|悄悄|私下|背地里).{0,10(删|改|查|拿|发|关)/i,
    ],
  },
  {
    id: 'identity_forgery',
    category: 'forgery',
    score: 78,
    patterns: [
      /(伪造|冒签|代签|假造|PS|p图).{0,10(审批|签[名章]|文件|证明|票[据根]|合同|记录|发票)/i,
      /用(别人|他人|同事|领导|用户)的?(身份|账[号户]|名义).{0,10(提交|申请|发布|操作)/i,
    ],
  },
  {
    id: 'privilege_abuse',
    category: 'privilege_abuse',
    score: 75,
    patterns: [
      /(提权|提升|获取).{0,8(权限|角色|管理员|root)/i,
      /(关闭|停用|卸载|干掉).{0,10(防火墙|杀毒|防护|安全软件|监控)/i,
      /(注入|挂马|植入|后[门洞]|木马|勒索|挖矿)/i,
    ],
  },
];

// 高危阈值：与 needsNegotiation 的 high_risk 判定同源（RISK level 'high'）
const HIGH_INTENT_SCORE_FLOOR = 70;

module.exports = {
  HIGH_INTENT_PATTERNS,
  HIGH_INTENT_SCORE_FLOOR,
};
