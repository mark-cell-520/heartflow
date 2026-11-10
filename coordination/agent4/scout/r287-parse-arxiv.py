import re, sys
path = sys.argv[1]
x = open(path, encoding='utf-8').read()
for m in re.finditer(r'<entry>(.*?)</entry>', x, re.S):
    e = m.group(1)
    t = re.search(r'<title>(.*?)</title>', e, re.S).group(1).strip().replace('\n', ' ')
    s = re.search(r'<summary>(.*?)</summary>', e, re.S).group(1).strip().replace('\n', ' ')
    print('###', t)
    print(s[:1400])
    print()
