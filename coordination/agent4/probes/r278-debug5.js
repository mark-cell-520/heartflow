const s = '这牌子立了上百年，口碑摆在那儿，照老方子来。';
console.log('chars:', [...s].map((c, i) => i + ':' + c).join(' '));
console.log('t1:', s.match(/牌子立了上百年/));
console.log('t2:', s.match(/牌子(?:立)(?:了)?(?:上)?(?:百)?多年?/));
console.log('t3:', s.match(/(?:牌子|招牌|口碑|名头)(?:立|打|树|闯)/));
console.log('t4:', s.match(/(?:立|打|树|闯)(?:了)?(?:上)?(?:百|几十|多少)?多年?/));
