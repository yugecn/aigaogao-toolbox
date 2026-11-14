import json,urllib.request,time
from concurrent.futures import ThreadPoolExecutor
N=json.load(open('swnodes.json'))
def get(u):
    for a in range(4):
        try: return urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=30).read().decode('gbk','ignore')
        except Exception as e: err=e;time.sleep(2)
    raise err
def cons(k):
    syms=[];p=1
    while True:
        d=json.loads(get(f'https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeData?page={p}&num=100&sort=symbol&asc=1&node={k}') or '[]')
        syms+=[[x['symbol'],x['name']] for x in d]
        if len(d)<100: break
        p+=1
    return k,syms
out={}
nodes=[('sw1',a,b) for a,b in N['sw1']]+[('sw2',a,b) for a,b in N['sw2']]
with ThreadPoolExecutor(12) as ex:
    for (lv,name,k),(k2,s) in zip(nodes,ex.map(cons,[n[2] for n in nodes])): out[k]={'lv':lv,'name':name,'cons':s}
json.dump(out,open('sw.json','w'),ensure_ascii=False)
a={s for v in out.values() if v['lv']=='sw1' for s,_ in v['cons']}
print(len(out),len(a))
