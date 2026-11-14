// ---------- 板块实时追踪 ----------
const SECIDX=[["上证指数","sh000001"],["深证成指","sz399001"],["创业板指","sz399006"],["沪深300","sh000300"],["中证500","sh000905"],["中证1000","sh000852"],["上证50","sh000016"],["科创50","sh000688"],["北证50","bj899050"]];
let LIVE=null,liveAt="",secLv="sw1",secSort="hl",secDir=-1,secTimer=null,secView="v_rt";
const fp=x=>x==null||isNaN(x)?"--":(x>0?"+":"")+x.toFixed(2)+"%";
const cls=x=>x>0?"u":x<0?"d":"";
function heatCell(x,max){if(x==null)return"<td>--</td>";const a=Math.min(1,Math.abs(x)/(max||3));const c=x>=0?"214,51,42":"22,144,74";return`<td style="background:rgba(${c},${(0.08+a*0.42).toFixed(2)})" class="${cls(x)}">${fp(x)}</td>`}
async function sinaPage(p){const r=await fetch(`https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeData?page=${p}&num=100&sort=symbol&asc=1&node=hs_a`);const t=await r.text();return JSON.parse(t||"[]")}
async function liveSina(){const m={};const pages=Math.ceil((Object.keys(SEC.names).length+150)/100);let p=1,ok=0;
 const run=async()=>{while(p<=pages){const my=p++;try{const d=await sinaPage(my);d.forEach(x=>{m[x.symbol]={pct:+x.changepercent,amt:+x.amount,v:+x.volume,t:x.ticktime,price:+x.trade,name:x.name}});ok++}catch(e){}}};
 await Promise.all(Array.from({length:8},run));if(Object.keys(m).length<3000)throw new Error("sina "+Object.keys(m).length);return m}
async function liveTencent(){const codes=Object.keys(SEC.names),m={},B=400,chunks=[];for(let i=0;i<codes.length;i+=B)chunks.push(codes.slice(i,i+B));let k=0;
 const run=async()=>{while(k<chunks.length){const ch=chunks[k++];const q=await quotes(ch).catch(()=>({}));for(const c in q){const x=q[c];m[c]={pct:x.pct,amt:x.amt,v:x.vol,price:x.price,name:x.name,t:x.ts}}}};
 await Promise.all(Array.from({length:4},run));if(Object.keys(m).length<3000)throw new Error("tencent "+Object.keys(m).length);return m}
async function loadLive(){if(!LIVE)$("s0").textContent="拉取全市场实时行情…";
 try{LIVE=await liveTencent();liveAt="腾讯实时"}catch(e){try{LIVE=await liveSina();liveAt="新浪实时(备用)"}catch(e2){LIVE=null;liveAt="实时失败，显示 "+SEC.built+" 收盘"}}
 const b=bjNow();$("s0").textContent=`${liveAt} · 北京时间 ${String(Math.floor(b.min/60)).padStart(2,"0")}:${String(b.min%60).padStart(2,"0")} · 覆盖 ${LIVE?Object.keys(LIVE).filter(c=>SEC.names[c]).length:0}/${SEC.all.n} 只${trading()?" · 盘中每5秒刷新":""}`;
 drawSec()}
function liveAgg(codes){if(!LIVE)return null;let s=0,n=0,a=0,u=0,d=0,f=0;for(const c of codes){const x=LIVE[c];if(!x||!x.v)continue;n++;s+=x.pct;a+=x.amt;if(x.pct>0)u++;else if(x.pct<0)d++;else f++}return n?{h:s/n,a:a/1e8,u,d,f,n}:null}
function secRow(S){const L=liveAgg(S.c),h=S.h.slice(),a=S.a.slice(),D=SEC.days;
 // replace today's column with live if live date is newer or same day
 let hl=L?L.h:h[h.length-1],al=L?L.a:a[a.length-1],u=L?L.u:S.u[S.u.length-1],dn=L?L.d:S.d[S.d.length-1];
 const hist=L&&isNewDay()?h.concat([hl]):h.slice(0,-1).concat([hl]),amts=L&&isNewDay()?a.concat([al]):a.slice(0,-1).concat([al]);
 const n=hist.length,avg=k=>{const xs=hist.slice(n-k).filter(x=>x!=null);return xs.length?xs.reduce((p,q)=>p+q,0)/xs.length:null};
 const prevA=amts.slice(Math.max(0,n-11),n-1).filter(x=>x!=null),flow=prevA.length?al/(prevA.reduce((p,q)=>p+q,0)/prevA.length):null;
 const ychg=amts[n-2]?(al/amts[n-2]-1)*100:null;
 const last3=hist.slice(n-3),turn=last3.length===3&&last3.every(x=>x>0)&&hist[n-4]<=0?"三天转红":last3.length===3&&last3.every(x=>x<0)&&hist[n-4]>=0?"三天转绿":"";
 return{S,hl,al,u,dn,flow,ychg,a3:avg(3),a5:avg(5),a10:avg(10),a9:avg(9),hist,turn}}
function isNewDay(){if(!LIVE)return false;const t=Object.values(LIVE)[0];const b=bjNow().date;return b>SEC.days[SEC.days.length-1]&&bjNow().day>=1&&bjNow().day<=5&&bjNow().min>=570}
function flowTag(f){if(f==null)return"--";const t=f>=2?"▲":f>=1.5?"△":f<=.5?"▼":f<=.75?"▽":"";return`<span class="${f>=1.5?"u":f<=.75?"d":""}">${t}${f.toFixed(2)}</span>`}
function drawSec(){const lvSecs=SEC.secs.filter(s=>s.lv===secLv),R=lvSecs.map(secRow),ALL=secRow({c:Object.keys(SEC.names),h:SEC.all.h,a:SEC.all.a,u:SEC.all.u,d:SEC.all.d,name:"全部A股"});
 const tot=LIVE?Object.keys(LIVE).filter(c=>SEC.names[c]).reduce((p,c)=>{const x=LIVE[c];p.t+=x.amt;if(c.startsWith("sh"))p.sh+=x.amt;else if(c.startsWith("sz"))p.sz+=x.amt;else p.bj+=x.amt;return p},{t:0,sh:0,sz:0,bj:0}):null;
 $("tot0").innerHTML=tot?`交易总金额 <b class="big">${(tot.t/1e8).toFixed(0)}</b> 亿（上证 ${(tot.sh/1e8).toFixed(0)} · 深证 ${(tot.sz/1e8).toFixed(0)} · 北证 ${(tot.bj/1e8).toFixed(0)}）· 上涨 <span class="u">${ALL.u}</span> 下跌 <span class="d">${ALL.dn}</span> · 全市场等权均 <span class="${cls(ALL.hl)}">${fp(ALL.hl)}</span> · 钱流 ${flowTag(ALL.flow)}`:`${SEC.built} 收盘：估算成交 ${ALL.al.toFixed(0)} 亿 · 等权均 ${fp(ALL.hl)}`;
 // 5-day all-sector average
 const sw1=SEC.secs.filter(s=>s.lv==="sw1").map(secRow),D=ALL.hist.length,days=SEC.days.slice();if(isNewDay())days.push(bjNow().date);
 let h5="<table><tr><th>近期所有板块按日平均</th>"+days.slice(-5).map(d=>`<th>${d.slice(5)}</th>`).join("")+"</tr><tr><td>申万一级平均</td>";
 for(let j=5;j>=1;j--){const xs=sw1.map(r=>r.hist[D-j]).filter(x=>x!=null);const m=xs.reduce((p,q)=>p+q,0)/xs.length;h5+=heatCell(m,2)}h5+="</tr></table>";$("avg5").innerHTML=h5;
 const srt=sw1.slice().sort((a,b)=>b.hl-a.hl),li=r=>`<tr><td><a href="#" onclick="secOpen('${r.S.k}');return false">${r.S.name}</a></td><td class="${cls(r.hl)}">${fp(r.hl)}</td><td>${r.al.toFixed(0)}亿</td></tr>`;
 $("top5").innerHTML=`<table><tr><th>升幅前五（申万一级）</th><th>升跌%</th><th>金额</th></tr>${srt.slice(0,5).map(li).join("")}</table>`;
 $("bot5").innerHTML=`<table><tr><th>跌幅前五</th><th>升跌%</th><th>金额</th></tr>${srt.slice(-5).reverse().map(li).join("")}</table>`;
 // big table
 const key={name:r=>r.S.name,n:r=>r.S.n,hl:r=>r.hl,ud:r=>r.u/(r.u+r.dn||1),al:r=>r.al,yc:r=>r.ychg,fl:r=>r.flow,a3:r=>r.a3,a5:r=>r.a5,a10:r=>r.a10,a9:r=>r.a9}[secSort];
 R.sort((a,b)=>{const x=key(a),y=key(b);return(x>y?1:x<y?-1:0)*secDir});
 const th=(k,t)=>`<th onclick="secBy('${k}')" style="cursor:pointer">${t}${secSort===k?(secDir<0?"↓":"↑"):""}</th>`;
 let h=`<table>${"<tr>"+th("name","板块")+th("n","只数")+th("hl","当日均升跌")+th("ud","涨/跌")+th("al","金额(亿)")+th("yc","金额升跌%")+th("fl","钱流")+th("a3","3天均")+th("a5","5天均")+th("a10","10天均")+th("a9","9天平均")+"<th>信号</th></tr>"}`;
 const mx=Math.max(...R.map(r=>Math.abs(r.hl||0)),1);
 R.forEach(r=>{h+=`<tr><td><a href="#" onclick="secOpen('${r.S.k}');return false">${r.S.name}</a></td><td>${r.S.n}</td>${heatCell(r.hl,mx)}<td><span class="u">${r.u}</span>/<span class="d">${r.dn}</span></td><td>${r.al.toFixed(1)}</td><td class="${cls(r.ychg)}">${fp(r.ychg)}</td><td>${flowTag(r.flow)}</td><td class="${cls(r.a3)}">${fp(r.a3)}</td><td class="${cls(r.a5)}">${fp(r.a5)}</td><td class="${cls(r.a10)}">${fp(r.a10)}</td><td class="${cls(r.a9)}">${fp(r.a9)}</td><td>${r.turn?`<span class="chip ${r.turn==="三天转红"?"u":"d"}">${r.turn}</span>`:""}</td></tr>`});
 $("v_rt").innerHTML=`<div class="tw">${h}</table></div><p class="mute">当日均升跌 = 板块内个股涨跌幅等权平均（爱搞搞口径），停牌不计；钱流 = 当日金额 ÷ 前10日均额；${R.filter(r=>r.turn==="三天转红").length} 个板块三天转红，${R.filter(r=>r.turn==="三天转绿").length} 个三天转绿。</p>`;
 // history table
 let hh=`<table><tr><th>板块</th><th>9天平均</th>${days.slice(-9).reverse().map(d=>`<th>${d.slice(5)}</th>`).join("")}</tr><tr><td>平均</td><td class="${cls(ALL.a9)}">${fp(ALL.a9)}</td>${ALL.hist.slice(-9).reverse().map(x=>heatCell(x,2)).join("")}</tr>`;
 R.forEach(r=>{hh+=`<tr><td><a href="#" onclick="secOpen('${r.S.k}');return false">${r.S.name}</a></td><td class="${cls(r.a9)}">${fp(r.a9)}</td>${r.hist.slice(-9).reverse().map(x=>heatCell(x,3)).join("")}</tr>`});
 $("v_hist").innerHTML=`<div class="tw">${hh}</table></div><p class="mute">日均升跌%，等权；颜色越深幅度越大。排序跟随“板块实时”。</p>`}
function secBy(k){if(secSort===k)secDir=-secDir;else{secSort=k;secDir=k==="name"?1:-1}drawSec()}
function secLevel(lv){secLv=lv;["sw1","sw2","gn"].forEach(x=>$("lv_"+x).classList.toggle("on",x===lv));fillSecSel();drawSec()}
function secTab(v){secView=v;["v_rt","v_hist","v_cons"].forEach(x=>{$(x).style.display=x===v?"block":"none";$("b_"+x).classList.toggle("on",x===v)})}
function fillSecSel(){const sel=$("secSel");sel.innerHTML=SEC.secs.filter(s=>s.lv===secLv).map(s=>`<option value="${s.k}">${s.name}（${s.n}）</option>`).join("")}
function secOpen(k){const S=SEC.secs.find(s=>s.k===k);if(!S)return;if(S.lv!==secLv)secLevel(S.lv);$("secSel").value=k;secTab("v_cons");drawCons()}
function drawCons(){const S=SEC.secs.find(s=>s.k===$("secSel").value);if(!S)return;
 const rows=S.c.map(c=>{const x=LIVE&&LIVE[c];return{c,name:(x&&x.name)||SEC.names[c]||"",pct:x?x.pct:null,amt:x?x.amt/1e8:null,price:x?x.price:null}}).sort((a,b)=>(b.pct??-99)-(a.pct??-99));
 const r=secRow(S);
 $("consOut").innerHTML=`<p>${S.name}：${S.n} 只 · 当日均升跌 <span class="${cls(r.hl)}">${fp(r.hl)}</span> · 金额 ${r.al.toFixed(1)} 亿 · 钱流 ${flowTag(r.flow)} · 10天均 ${fp(r.a10)}</p>
 <div class="row"><button class="b" onclick="toMulti('${S.k}')">送到成本价(多股)（按金额前50）</button></div>
 <div class="tw" style="margin-top:8px"><table><tr><th>股票</th><th>代码</th><th>现价</th><th>涨跌</th><th>金额(亿)</th></tr>${rows.map(x=>`<tr><td><a href="#" onclick="$('c1').value='${x.c}';show('p1');T1();return false">${x.name}</a></td><td>${x.c.slice(2)}</td><td>${x.price?x.price.toFixed(2):"--"}</td>${heatCell(x.pct,10)}<td>${x.amt!=null?x.amt.toFixed(2):"--"}</td></tr>`).join("")}</table></div>`}
function toMulti(k){const S=SEC.secs.find(s=>s.k===k);const L=S.c.slice().sort((a,b)=>((LIVE&&LIVE[b]?LIVE[b].amt:0)-(LIVE&&LIVE[a]?LIVE[a].amt:0))).slice(0,50);$("c2").value=L.join(",");show("p2");T2()}
async function idx0(){const q=await quotes(SECIDX.map(x=>x[1])).catch(()=>({}));
 $("idx0").innerHTML=SECIDX.map(([n,c])=>{const x=q[c];return`<div class="k" style="cursor:pointer" onclick="$('c1').value='${c}';show('p1');T1()"><div class="mute">${n}</div><div class="big ${x?cls(x.pct):""}">${x?x.price.toFixed(2):"--"}</div><div class="${x?cls(x.pct):""}">${x?fp(x.pct):""} ${x?"· "+(x.amt/1e8).toFixed(0)+"亿":""}</div></div>`}).join("")}
let secBusy=false;
async function tick0(){if(secBusy)return;secBusy=true;try{await Promise.all([idx0(),loadLive()])}finally{secBusy=false}}
function T0(){tick0();if(secTimer)clearInterval(secTimer);secTimer=setInterval(()=>{if(trading()&&!document.hidden&&$("p0").classList.contains("on"))tick0()},5000)}
