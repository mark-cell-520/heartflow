// debug 5：找出「删掉整条 223 正则后会被哪条下游规则误命中」的正向样本
// 这是设计有效变异的基础：删掉本条 → 下游 superlative generic 误吃 → 变红。
const fs = require('fs');
const os = require('os');
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

const FROM = '最新(?=的|[一声音起回代批版本款项届篇篇]|指示|通知|公告|数据|结果|消息|进展|情况|文件|资料|信息|成果|记录|命令|新闻|快讯|通报|战报|名单|编号|标签|快照|镜像|构建|打包|方案|设计|计划|想法|构想|稿|名单)';
const NEVER = '最新(?=' + 'zzzzz' + ')';

function load(tag) {
  const dir = path.join(os.tmpdir(), 'hf-sl5-' + tag);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  return path.join(dir, 'src', 'index.js');
}

const origPath = path.join(HF, 'src', 'index.js');

// 全删变异
{
  const p = load('full');
  let s = fs.readFileSync(p, 'utf8');
  if (!s.includes(FROM)) throw new Error('FROM 未命中');
  s = s.split(FROM).join(NEVER);
  fs.writeFileSync(p, s);
  const m = require(p);
  const samples = [
    '最新的资料已归档', '最新的信息请看附件', '最新的文件在这里',
    '最新的进展同步一下', '最新的结果出来了', '最新的情况说明在这里',
    '最新数据已经同步', '最新通知已收到', '最新公告请查收',
    '最新一期报告', '请查看最新的版本说明', '最新发布的产品存在一个已知问题。',
    '最新一代的芯片性能更好。', '最新一届的名单在这里。',
    '最新的成果已发布。', '最新的记录被刷新。', '最新消息刚推送。',
    '这是最新一批数据。', '最新款的产品已经上架。',
  ];
  for (const t of samples) {
    const r = m.checkConfidenceCalibration(t);
    const d = (r.issues || []).map(i => i.detail).join('|');
    console.log((d ? 'HIT ' : '--- ') + t + '  ' + d);
  }
}
