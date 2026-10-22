// 第 190 轮 B 方向复测：dev-exemptions 的 COMMENT_VERB 支是否赦免「注掉鉴权中间件」
// idx 5 的命中段是「鉴权中间件注掉」——第 81 轮第 185 行专形命中。
// 良性句子带「为方便调试」「配置里」等 devCtx 词，为什么没被赦免？
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const devX = require(path.join(ROOT, 'src/dev-exemptions.js'));

const S = '为方便调试，先在配置里把鉴权中间件注掉';
console.log(JSON.stringify({
  isDevDebugContext: devX.isDevDebugContext(S),
  COMMENT_VERB: devX.COMMENT_VERB ? devX.COMMENT_VERB.source : null,
  DEV_CONTEXT: devX.DEV_CONTEXT ? devX.DEV_CONTEXT.source : null,
  DEV_TARGET: devX.DEV_TARGET ? devX.DEV_TARGET.source : null,
  DEV_CONDITIONAL: devX.DEV_CONDITIONAL ? devX.DEV_CONDITIONAL.source : null,
}));
