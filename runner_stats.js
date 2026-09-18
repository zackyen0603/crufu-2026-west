(function(){
"use strict";
function id(x){return document.getElementById(x)}
function val(el){return el?el.value:""}
function paceSec(s){var m=/^(\d{1,2}):([0-5]\d)/.exec((s||"").trim());return m?(+m[1])*60+(+m[2]):NaN}
function paceTxt(s){if(!isFinite(s))return "—";s=Math.round(s);return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0")}
function dur(m){if(!isFinite(m))return "—";m=Math.round(m);return Math.floor(m/60)+"h "+String(m%60).padStart(2,"0")+"m"}
function km(n){return isFinite(n)?Number(n).toFixed(1)+" km":"—"}
function signed(n){if(!isFinite(n))return "—";n=Math.round(n);return(n>0?"+":"")+n+" 分"}
function trackDist(leg){var t=window.ROUTE_TRACKS&&window.ROUTE_TRACKS[String(leg)];return t&&isFinite(t.distance_km)?Number(t.distance_km):Number(LEG_DATA[leg-1].distance||0)}
function diffWeight(s){return s==="難中之王"?5:s==="難"?4:s==="適中"?3:s==="易"?2:s==="極易"?1:0}
function parseShown(s,year){var m=/^(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})$/.exec(s||"");return m?new Date(year,+m[1]-1,+m[2],+m[3],+m[4]):null}
function selected(){return val(id("statsRunner"))}
function saveRunner(r){try{localStorage.setItem((window.LS||"crufu2026v6_")+"stats_runner",r)}catch(e){}}
function loadRunner(){try{return localStorage.getItem((window.LS||"crufu2026v6_")+"stats_runner")||""}catch(e){return""}}
function initSelect(){
 var s=id("statsRunner");if(!s||!window.ALL)return;s.innerHTML="";var keep=loadRunner();
 ALL.forEach(function(r){var o=document.createElement("option");o.value=r;o.textContent=r;if(r===keep)o.selected=true;s.appendChild(o)});
 if(!s.value&&ALL.length)s.value=ALL[0];s.onchange=function(){saveRunner(s.value);render()}
}
function rowsFor(runner){
 var y=2026,rs=id("raceStart");if(rs&&rs.value){var d=new Date(rs.value);if(!isNaN(d.getTime()))y=d.getFullYear()}
 var out=[];
 document.querySelectorAll("tr[data-leg]").forEach(function(tr){
  var sel=tr.querySelector(".runnerSelect");if(!sel||sel.value!==runner)return;
  var leg=+tr.dataset.leg,x=LEG_DATA[leg-1],base=paceSec(tr.querySelector(".basePace").textContent),eff=paceSec(tr.querySelector(".effective").textContent);
  var st=parseShown(tr.querySelector(".startAt").textContent,y),ft=parseShown(tr.querySelector(".finishAt").textContent,y);
  if(st&&ft&&ft<st)ft.setFullYear(y+1);
  var ai=tr.querySelector(".actualArrival"),actual=ai&&ai.value?new Date(ai.value):null;if(actual&&isNaN(actual.getTime()))actual=null;
  out.push({leg:leg,car:tr.dataset.car,x:x,d:+x.distance,gps:trackDist(leg),gain:+x.gain,loss:+x.loss,base:base,eff:eff,adj:+tr.querySelector(".adjust").value||0,run:eff*(+x.distance)/60,st:st,ft:ft,actual:actual,delay:actual&&ft?(actual-ft)/60000:NaN})
 });return out
}
function render(){
 var r=selected(),a=rowsFor(r),sum=id("runnerStatsSummary"),body=id("runnerStatsBody");if(!r||!sum||!body)return;saveRunner(r);
 if(!a.length){sum.innerHTML='<div class="statCard"><span>目前沒有分配棒次</span><b>'+r+'</b></div>';id("runnerLoadStats").innerHTML='<p class="muted">請先將棒次分配給此跑者。</p>';id("runnerRestStats").innerHTML="";id("runnerProgressStats").innerHTML="";body.innerHTML="";return}
 var d=0,gps=0,g=0,l=0,run=0,day=0,night=0,we=0,done=0,doneD=0,del=[],gaps=[],maxD=a[0],maxG=a[0],hard=a[0];
 a.forEach(function(x,i){d+=x.d;gps+=x.gps;g+=x.gain;l+=x.loss;run+=x.run;we+=x.eff*x.d;(String(x.x.icon).indexOf("🌙")>=0?night+=x.d:day+=x.d);if(x.d>maxD.d)maxD=x;if(x.gain>maxG.gain)maxG=x;if(diffWeight(x.x.difficulty)>diffWeight(hard.x.difficulty))hard=x;if(x.actual){done++;doneD+=x.d;if(isFinite(x.delay))del.push(x.delay)}if(i&&a[i-1].ft&&x.st){var z=(x.st-a[i-1].ft)/60000;if(z>=0)gaps.push(z)}})
 var avgEff=we/d,team=LEG_DATA.reduce(function(s,x){return s+(+x.distance||0)},0),baseEl=document.querySelector('.paceInput[data-runner="'+r+'"]'),base=baseEl?baseEl.value:"—";
 var avgDel=del.length?del.reduce(function(s,x){return s+x},0)/del.length:NaN,minGap=gaps.length?Math.min.apply(null,gaps):NaN,maxGap=gaps.length?Math.max.apply(null,gaps):NaN,avgGap=gaps.length?gaps.reduce(function(s,x){return s+x},0)/gaps.length:NaN;
 var span=a[0].st&&a[a.length-1].ft?(a[a.length-1].ft-a[0].st)/60000:NaN;
 sum.innerHTML='<div class="statCard"><span>分配棒數</span><b>'+a.length+' 棒</b><small>'+a.map(function(x){return"#"+x.leg}).join("、")+'</small></div>'+ '<div class="statCard"><span>表定總距離</span><b>'+km(d)+'</b><small>全隊 '+(d/team*100).toFixed(1)+'%</small></div>'+ '<div class="statCard"><span>總爬升</span><b>'+Math.round(g)+' m</b><small>'+Math.round(g/d)+' m/km</small></div>'+ '<div class="statCard"><span>總下降</span><b>'+Math.round(l)+' m</b><small>'+Math.round(l/d)+' m/km</small></div>'+ '<div class="statCard"><span>個人基準配速</span><b>'+base+' /km</b><small>目前設定</small></div>'+ '<div class="statCard"><span>加權採用配速</span><b>'+paceTxt(avgEff)+' /km</b><small>含棒次修正</small></div>'+ '<div class="statCard"><span>預估總跑步時間</span><b>'+dur(run)+'</b><small>不含等待</small></div>'+ '<div class="statCard"><span>實際確認進度</span><b>'+done+' / '+a.length+' 棒</b><small>'+km(doneD)+'</small></div>';
 id("runnerLoadStats").innerHTML='<dl class="statsList"><div><dt>平均每棒距離</dt><dd>'+km(d/a.length)+'</dd></div><div><dt>GPS 軌跡總距離</dt><dd>'+km(gps)+'</dd></div><div><dt>日間距離</dt><dd>'+km(day)+'</dd></div><div><dt>夜間距離</dt><dd>'+km(night)+'</dd></div><div><dt>最長一棒</dt><dd>#'+maxD.leg+' '+km(maxD.d)+'</dd></div><div><dt>單棒最高爬升</dt><dd>#'+maxG.leg+' +'+maxG.gain+' m</dd></div><div><dt>最高難度棒次</dt><dd>#'+hard.leg+' '+hard.x.difficulty+'</dd></div><div><dt>淨高程變化</dt><dd>'+((g-l)>=0?"+":"")+Math.round(g-l)+' m</dd></div></dl>';
 id("runnerRestStats").innerHTML='<dl class="statsList"><div><dt>第一棒預估開始</dt><dd>'+ (a[0].st?a[0].st.toLocaleString("zh-TW",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}):"—")+'</dd></div><div><dt>最後一棒預估完成</dt><dd>'+(a[a.length-1].ft?a[a.length-1].ft.toLocaleString("zh-TW",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}):"—")+'</dd></div><div><dt>首棒至末棒跨度</dt><dd>'+dur(span)+'</dd></div><div><dt>平均恢復時間</dt><dd>'+dur(avgGap)+'</dd></div><div><dt>最短恢復時間</dt><dd>'+dur(minGap)+'</dd></div><div><dt>最長恢復時間</dt><dd>'+dur(maxGap)+'</dd></div></dl>';
 id("runnerProgressStats").innerHTML='<dl class="statsList"><div><dt>已確認完成距離</dt><dd>'+km(doneD)+'</dd></div><div><dt>尚未確認距離</dt><dd>'+km(Math.max(0,d-doneD))+'</dd></div><div><dt>有實際抵達紀錄</dt><dd>'+done+' 棒</dd></div><div><dt>平均抵達偏差</dt><dd>'+(del.length?signed(avgDel):"尚無資料")+'</dd></div><div><dt>晚於預估</dt><dd>'+del.filter(function(x){return x>0}).length+' 棒</dd></div><div><dt>早於預估</dt><dd>'+del.filter(function(x){return x<0}).length+' 棒</dd></div></dl>';
 body.innerHTML=a.map(function(x){return'<tr><td><b>#'+x.leg+'</b></td><td>'+x.car+'</td><td>'+x.x.icon+'</td><td>'+x.x.difficulty+'</td><td>'+(x.st?x.st.toLocaleString("zh-TW",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}):"—")+'</td><td>'+(x.ft?x.ft.toLocaleString("zh-TW",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}):"—")+'</td><td>'+(x.actual?'<span class="actualBadge">'+x.actual.toLocaleString("zh-TW",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false})+'</span>':"—")+'</td><td>'+x.d.toFixed(1)+' km</td><td>'+x.gps.toFixed(1)+' km</td><td>+'+x.gain+' m</td><td>-'+x.loss+' m</td><td>'+Math.round(x.gain/x.d)+' m/km</td><td>'+paceTxt(x.base)+'</td><td>'+(x.adj>=0?"+":"")+x.adj+' 秒</td><td>'+paceTxt(x.eff)+'</td><td>'+dur(x.run)+'</td><td>'+(x.actual?signed(x.delay):"—")+'</td><td><a href="'+x.x.url+'" target="_blank" rel="noopener">路線 ↗</a></td></tr>'}).join("")
}
function attach(){
 initSelect();render();
 document.addEventListener("change",function(e){if(e.target.matches(".runnerSelect,.paceInput,.adjust,.actualArrival,#raceStart"))setTimeout(render,30)});
 var a=id("applyAll");if(a)a.addEventListener("click",function(){setTimeout(render,60)});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){setTimeout(attach,0)});else setTimeout(attach,0);
})();