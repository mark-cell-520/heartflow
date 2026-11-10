'use strict';
const re = /(不|没)(接受|答应|同意|支持|配合|参与|执行|买|用|转发|声援|出席|采纳|跟着)[^。！？；\n]{0,12}(就是|便是|等于|意味着)[^。！？；\n]{0,12}(不想在|不想待|不想干|不肯|不愿|不敢|不忠|不孝|背叛|对着干|作对|唱反调|不是自己人|是外人|自己人|外人|自找|担着|别怪|后果|出事)/;
const t = '不买就不是自己人，这点觉悟总得有吧。';
console.log('test:', re.test(t));
console.log('exec:', re.exec(t));
// 手动回溯诊断：缩短结论段
const t2 = '不买就不是自己人。';
console.log('短句 test:', re.test(t2), re.exec(t2));
const t3 = '不买就是不想干。';
console.log('不想干 test:', re.test(t3), re.exec(t3));
