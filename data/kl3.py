import json,urllib.request,time
from concurrent.futures import ThreadPoolExecutor
N={s for v in json.load(open('sw.json')).values() for s,_ in v['cons']}
def get(s):
    u=f'https://proxy.finance.qq.com/ifzqgtimg/appstock/app/newfqkline/get?param={s},day,,,25,qfq'
    for a in range(4):
        try:
            d=json.loads(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=20).read())['data'][s]
            r=d.get('qfqday') or d.get('day') or []
            return s,[[x[0],x[1],x[2],x[3],x[4],x[5],x[8] if len(x)>8 else ''] for x in r]
        except Exception: time.sleep(1.5*(a+1))
    return s,[]
K={}
with ThreadPoolExecutor(12) as ex:
    for s,r in ex.map(get,sorted(N)): K[s]=r
json.dump(K,open('kl3.json','w'))
print('ok',sum(1 for v in K.values() if v),len(K), sum(1 for v in K.values() if v and v[-1][6]))
