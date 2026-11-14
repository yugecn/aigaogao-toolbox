"""每日更新：python3 update.py  （在 data/ 目录运行）
1) sw.py 刷新申万成分  2) kl3.py 拉全部个股25日前复权K线(腾讯 proxy.finance.qq.com)
3) build_sec.py 生成 sec_data.json  4) 把 ../index.html 里的 const SEC=...; 替换为新数据"""
import subprocess,json,re,sys,os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
for s in ['sw.py','kl3.py','build_sec.py']:
    r=subprocess.run([sys.executable,s],capture_output=True,text=True,timeout=1100);print(s,r.stdout.strip()[-300:],r.stderr.strip()[-300:])
    if r.returncode: sys.exit(1)
d=json.load(open('sec_data.json'))
cov=sum(1 for x in d['all']['h'] if x is not None)
p='../index.html';h=open(p,encoding='utf-8').read()
i=h.index('const SEC=');j=h.index(';\n',i)
h=h[:i]+'const SEC='+open('sec_data.json',encoding='utf-8').read()+h[j:]
open(p,'w',encoding='utf-8').write(h)
s1=sorted([x for x in d['secs'] if x['lv']=='sw1'],key=lambda x:x['h'][-1] or 0)
print('DATE',d['built'],'AMT',round(d['all']['a'][-1]),'AVG',d['all']['h'][-1],'UP',d['all']['u'][-1],'DN',d['all']['d'][-1],'TOP',[(x['name'],x['h'][-1]) for x in s1[-3:]],'BOT',[(x['name'],x['h'][-1]) for x in s1[:3]])
