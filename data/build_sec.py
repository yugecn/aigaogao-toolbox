import json,statistics as st
K=json.load(open('kl3.json'));SW=json.load(open('sw.json'));G=json.load(open('sectors.json'))
# trading days
from collections import Counter
cnt=Counter(r[0] for v in K.values() for r in v)
days=sorted(d for d,c in cnt.items() if c>1000)[-12:]
def pct_amt(s):
    r=K.get(s) or [];m={}
    for i in range(1,len(r)):
        try:
            c0=float(r[i-1][2]);o,c,h,l,v=map(float,r[i][1:6]);am=float(r[i][6]) if r[i][6] not in ('',None) else None
        except: continue
        if v<=0 or c0<=0: continue
        if am is None: am=v*(1 if s.startswith(('sh688','sh689')) else 100)*(o+c+h+l)/4/1e4
        m[r[i][0]]=( (c/c0-1)*100, am/1e4 )
    return m
P={s:pct_amt(s) for s in K}
def agg(codes):
    H=[];A=[];U=[];D=[]
    for d in days:
        xs=[P[s][d] for s in codes if s in P and d in P[s]]
        H.append(round(st.mean(x[0] for x in xs),3) if xs else None)
        A.append(round(sum(x[1] for x in xs),2) if xs else None)
        U.append(sum(1 for x in xs if x[0]>0));D.append(sum(1 for x in xs if x[0]<0))
    return H,A,U,D
secs=[];names={}
for k,v in SW.items():
    codes=[s for s,_ in v['cons']]
    for s,n in v['cons']: names[s]=n
    H,A,U,D=agg(codes)
    par=('sw1_'+k[4:6]+'0000') if v['lv']=='sw2' else ''
    secs.append({'k':k,'lv':v['lv'],'p':par,'name':v['name'],'n':len(codes),'h':H,'a':A,'u':U,'d':D,'c':codes})
for k,v in G.items():
    if v['kind']!='gn': continue
    H,A,U,D=agg(v['cons'])
    secs.append({'k':k,'lv':'gn','p':'','name':v['name'],'n':len(v['cons']),'h':H,'a':A,'u':U,'d':D,'c':v['cons']})
allc=sorted({s for x in secs if x['lv']=='sw1' for s in x['c']})
H,A,U,D=agg(allc)
out={'days':days,'all':{'h':H,'a':A,'u':U,'d':D,'n':len(allc)},'secs':secs,'names':{s:names.get(s,'') for s in allc},'built':days[-1]}
json.dump(out,open('sec_data.json','w'),ensure_ascii=False,separators=(',',':'))
cov=sum(1 for s in allc if P.get(s))
print(days, 'cov',cov,len(allc),'avg',H[-3:],'amt',A[-3:])
