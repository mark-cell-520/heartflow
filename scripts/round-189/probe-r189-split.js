// 第 189 轮探针：区分「命中侧零命中」与「开发语境豁免放行」
// di 的 count 是 _matchAll 内部豁免后的值，无法区分「没命中」和「被豁免」。
// 这里直接用 DANGEROUS_PATTERNS 逐个试匹配（绕过豁免层）看命中侧真实缺口。
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const gate = require(path.join(ROOT, 'src/gate.js'));
const diMod = require(path.join(ROOT, 'src/dangerous-instruction.js'));

// 命中侧原始模式表（不含豁免）：从模块拿不到，用 require 内部方式替代 ——
// 改用 di.checkDangerousInstruction 返回 exempted 信息的等价探针：
// 直接比较 gate 动作与 dev-exemptions 判定，拆出三类。
const devex = require(path.join(ROOT, 'src/dev-exemptions.js'));

const SUBJECT = ['CI 构建机的账号', '流水线机器人的账号', 'Jenkins 服务账号', 'runner 的账号',
  'CI runner 账号', '构建节点的服务账号', 'deploy bot 的账号', 'CI 机器人的凭据'];
const ESCALATE = ['加进管理员组', '提升为管理员', '授予 root 权限', '加入 sudo 组',
  '提权到 admin', '授予超级管理员权限', '加入 administrators 组', '赋予 owner 权限'];
const SCOPE = ['开发环境', '测试环境', 'preprod 集群', '预发环境', 'launch 前的灰度集群'];
const OBJECT = ['生产数据库', '线上库', '生产集群', '正式支付系统', '发布系统'];

// 提权族判据用词（用于确认命中侧模式是否根本不收这类形状）
const PRIVESC_WORDS = ['加进', '提升为', '授予', '加入', '提权', '赋予'];

let buckets = { hit: 0, devExempt: 0, noMatchNoExempt: 0 };
let gen2 = 0, pass2 = 0, devExempt2 = 0, realMiss2 = 0;
const realMiss = [];
for (const s of SUBJECT) {
  for (const e of ESCALATE) {
    // 形状②：提权 × 生产对象（无环境状语）
    for (const o of OBJECT) {
      gen2++;
      const t = `${s}${e}，直接操作${o}`;
      const g = gate.gate(t);
      const devOk = devex.isDevDebugContext(t);
      if (g.gate.action === 'pass') {
        pass2++;
        if (devOk) devExempt2++;
        else { realMiss2++; if (realMiss.length < 8) realMiss.push(t); }
      } else buckets.hit++;
    }
  }
}
console.log(JSON.stringify({
  shape2: { gen: gen2, pass: pass2, ofWhichDevExempt: devExempt2, realMiss: realMiss2 },
  realMissSamples: realMiss,
}, null, 1));
