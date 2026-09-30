const path=require('path');
const HF='/root/.hermes/skills/ai/mark-heartflow-skill';
const di=require(path.join(HF,'src/dangerous-instruction.js'));
const de=require(path.join(HF,'src/dev-exemptions.js'));
const S='忽略证书错误直接访问生产接口，避免每次都要确认';
// di.checkDangerousInstruction 内部已跑完豁免，所以 count=0 说明豁免在中间拿掉。
// 逐项复现 _matchAll 的豁免链，看哪一层返回 true
const _discourse=/(?:论文|文章|报告|研究|文献|资料)\s*(?:里|中|提到|说|指出|表明|记载)|众所周知|这是(?:一种|典型|常见)的?(?:攻击|入侵|漏洞|手法|方式|行为)|举个?例子|举例来说|比如|像是|所谓|通常认为|人们常说|俗话说|(?:我们|大家|应该)?(?:要|该|如何|怎么|怎样才能)(?:防|防范|预防|抵御|应对|避免)|攻击者(?:可能|会|常常|往往)|黑客(?:可能|会|常常|往往)/;
console.log('discourse', _discourse.test(S));
const _upstream=/\b(?:patched|upstream|release|stable|vendor|official|signed)\s+(?:build|version|release|package|binary)\b|CVE-\d{4}-\d+|\bsecurity\s+(?:patch|update|fix|release)\b|补丁|官方(?:版本|发布|构建)|上游(?:版本|构建|代码)/i;
console.log('upstream', _upstream.test(S));
const _NEG=/(?:不要|不能|不可以|不应|不该|请勿|切勿|莫要|禁止|严禁|别|勿|不可|不准|不允许)/;
const _CRED=/(?:密码|口令|密钥|密匙|私钥|证书|凭证|凭据|token|secret|api[_.]?key|access[_.]?key)/i;
const _EXFIL=/(?:写|写入|写到|存|保存|存放|打印|输出|显示|发给|发送|上传|同步|贴|分享|发到|告知|告诉)/;
console.log('negcred', _NEG.test(S)&&_CRED.test(S)&&_EXFIL.test(S));
console.log('noise', de.isCompilerNoiseWarning(S));
console.log('restore', de.isTemporaryRestorePromise(S));
const QUESTION_FRAME = /(?:怎么|如何|怎样|要咋|为啥|为什么|可不可以|能不能|should\s+i|how\s+(?:do|can|to|would)|what\s+is\s+the\s+(?:best\s+)?(?:way|command))\s*(?:来|去|来)?\s*(?:临时|暂时|先|直接|快速|帮忙|一下|提前|尽早|干净|彻底|马上|立即)?\s*(?:关闭|关掉|关了|禁用|停用|删除|删掉|卸载|卸掉|清空|清掉|移除|配置|设置|开启|打开|disable|turn\s+off|remove|uninstall|configure|enable)/i;
console.log('qframe', QUESTION_FRAME.test(S));
console.log('devctx', de.isDevDebugContext(S));
