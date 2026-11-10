// 第 278 轮判据设计验证：字母数字比例能否切开「leet 攻击」与「字母数字 token」
// leet 攻击：!gn0re / 1gnor3 / a11 / prev1ous / instruct!ons（字母为主体）
// 混排 token：Q3 / 3f2a91b / 100k / 0xFF00 / a1b2c3d4（数字占比高）
'use strict';

function analyze(t) {
  const digits = (t.match(/[0-9]/g) || []).length;
  const letters = (t.match(/[a-zA-Z]/g) || []).length;
  const symbols = (t.match(/[@$!+|]/g) || []).length;
  return { digits, letters, symbols, ratio: digits / (digits + letters + symbols) };
}

const LEET = ['!gn0re', '1gnor3', 'a11', 'prev1ous', 'instruct!ons', '!nstruct!ons', 'gn0re',
  '1gnore', 'pr3v10us', '5y5t3m', 'p@ssword', '4dmin', 'h@ck', '|gn0re', '$ecret'];
const TOKENS = ['Q3', '3f2a91b', '100k', '0xFF00', 'v6.8.159', 'SKU-A17', 'a1b2c3d4',
  '9f8e7d6c5b4a39281706f5e4d3c2b1a0987654321', 'x86_64', 'utf8', 'sha256', 'md5',
  'Q1', 'Q2', 'Q4', '2026', '20339', '02:18:40', '2026-11-10', '6.8.62', '150%', '0x00FF',
  '3D', '4K', '8K', 'H264', 'H265', 'mp3', 'mp4'];

console.log('=== LEET 攻击 token（应还原）===');
for (const t of LEET) {
  const a = analyze(t);
  console.log(`${t.padEnd(14)} digits=${a.digits} letters=${a.letters} sym=${a.symbols} ratio=${a.ratio.toFixed(2)}`);
}
console.log('');
console.log('=== 字母数字混排 token（应保留）===');
for (const t of TOKENS) {
  const a = analyze(t);
  console.log(`${t.padEnd(14)} digits=${a.digits} letters=${a.letters} sym=${a.symbols} ratio=${a.ratio.toFixed(2)}`);
}
