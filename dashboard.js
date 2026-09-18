(function(){
"use strict";
function id(x){return document.getElementById(x)}
function pad(n){return String(n).padStart(2,"0")}
function fmtDate(d){if(!d||isNaN(d.getTime()))return "—";return pad(d.getMonth()+1)+"/"+pad(d.getDate())+" "+pad(d.getHours())+":"+pad(d.getMinutes())}
function parseShown(s){
 var m=/^(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})$/.exec((s||"").trim());
 if(!m)return null;
 var y=2026,rs=id("raceStart");if(rs&&rs.value){var x=new Date(rs.value);if(!isNaN(x.getTime()))y=x.getFullYear()}
 return new Date(y,+m[1]-1,+m[2],+m[3],+m[4],0,0)
}
function actualDate(leg){
 var el=document.querySelector('tr[data-leg="'+leg+'"] .actualArrival');
 if(!el||!el.value)return null;var d=new Date(el.value);return isNaN(d.getTime())?null:d
}
function runnerFor(leg){var el=document.querySelector('tr[data-leg="'+leg+'"] .runnerSelect');return el?el.value:"—"}
function distFor(leg){var x=LEG_DATA[leg-1];return x?Number(x.distance)||0:0}
function totalKm(){return LEG_DATA.reduce(function(s,x){return s+(Number(x.distance)||0)},0)}
function through(leg){var s=0;for(var i=1;i<=leg;i++)s+=distFor(i);return s}
function paceText(sec){if(!isFinite(sec)||sec<=0)return "—";sec=Math.round(sec);return Math.floor(sec/60)+":"+pad(sec%60)+" /km"}
function diffText(mins){if(!isFinite(mins))return "—";mins=Math.round(mins);return (mins>0?"+":"")+mins+" 分"}
function countdown(target,now){
 if(!target||isNaN(target.getTime()))return "—";
 var sec=Math.round((target-now)/1000),past=sec<0;sec=Math.abs(sec);
 var h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60);
 if(h>=24){var d=Math.floor(h/24);h%=24;return (past?"已過 ":"還有 ")+d+"天 "+h+"h "+m+"m"}
 return (past?"已過 ":"還有 ")+h+"h "+m+"m"
}
function schedule(){
 var out=[];
 document.querySelectorAll("tr[data-leg]").forEach(function(tr){
   var leg=Number(tr.dataset.leg),x=LEG_DATA[leg-1];
   out.push({leg:leg,row:tr,x:x,runner:runnerFor(leg),start:parseShown(tr.querySelector(".startAt").textContent),finish:parseShown(tr.querySelector(".finishAt").textContent),actual:actualDate(leg)})
 });
 return out
}
function actualMetric(leg){return window.CRUFU_ACTUAL_STATS&&window.CRUFU_ACTUAL_STATS.get?window.CRUFU_ACTUAL_STATS.get(leg):null}
function latestActual(s){var last=null;s.forEach(function(x){if(x.actual)last=x});return last}
function computeCurrent(s,now,last){
 var from=last?last.leg+1:1,current=null,state=last?"等待下一棒":"尚未起跑";
 for(var i=0;i<s.length;i++){
   var x=s[i];if(x.leg<from)continue;
   if(x.start&&now<x.start){state=last?"交接 / 等待下一棒":"尚未起跑";break}
   if(x.start&&x.finish&&now>=x.start&&now<=x.finish){current=x;state="跑步進行中";break}
   if(x.finish&&now>x.finish){current=x;state="依預估已完成，等待實際抵達"}
 }
 return {current:current,state:state}
}
function estimatedKm(s,now,last,current,state){
 var confirmed=last?through(last.leg):0;
 if(!current)return confirmed;
 if(current.actual)return Math.max(confirmed,through(current.leg));
 if(state==="跑步進行中"&&current.start&&current.finish){
   var f=(now-current.start)/(current.finish-current.start);f=Math.max(0,Math.min(1,f));
   return Math.max(confirmed,through(current.leg-1)+distFor(current.leg)*f)
 }
 if(state.indexOf("依預估已完成")===0)return Math.max(confirmed,through(current.leg));
 return confirmed
}
function detailHtml(x){
 if(!x)return '<div class="dashDetailEmpty">—</div>';
 var a=actualMetric(x.leg),pace=a&&isFinite(a.pace)?paceText(a.pace):"—";
 return '<div class="dashDetailTitle"><b>#'+x.leg+' '+x.runner+'</b><span>'+x.x.icon+' '+x.x.difficulty+'</span></div>'+ '<div class="dashDetailGrid"><span>車組<b>'+x.x.car+' 車</b></span><span>距離<b>'+Number(x.x.distance).toFixed(1)+' km</b></span><span>爬升<b>+'+x.x.gain+' m</b></span><span>下降<b>-'+x.x.loss+' m</b></span>'+ '<span>預估開始<b>'+fmtDate(x.start)+'</b></span><span>預估結束<b>'+fmtDate(x.finish)+'</b></span><span>實際抵達<b>'+fmtDate(x.actual)+'</b></span><span>實際配速<b>'+pace+'</b></span></div>'+ (x.x.note?'<div class="dashAlert">'+x.x.note+'</div>':'')
}
function renderLegStrip(s,current){
 var h="";s.forEach(function(x){var cls=x.actual?"done":(current&&x.leg===current.leg?"current":"pending");h+='<div class="dashLeg '+cls+'" title="#'+x.leg+' '+x.runner+'"><b>'+x.leg+'</b><small>'+x.runner+'</small></div>'});id("dashLegStrip").innerHTML=h
}
function renderUpcoming(s,last,current){
 var base=current?current.leg:(last?Math.min(30,last.leg+1):1),start=Math.max(1,base-2),end=Math.min(30,base+4),h="";
 for(var leg=start;leg<=end;leg++){
   var x=s[leg-1],a=actualMetric(leg),status=x.actual?"已完成":(current&&leg===current.leg?"目前":"待跑");
   h+='<tr><td><span class="dashStatusPill '+status+'">'+status+'</span></td><td><b>#'+leg+'</b></td><td>'+x.x.car+'</td><td>'+x.runner+'</td><td>'+Number(x.x.distance).toFixed(1)+' km</td><td>+'+x.x.gain+'/-'+x.x.loss+'</td><td>'+fmtDate(x.start)+'</td><td>'+fmtDate(x.finish)+'</td><td>'+fmtDate(x.actual)+'</td><td>'+(a&&isFinite(a.pace)?paceText(a.pace):"—")+'</td></tr>'
 }
 id("dashUpcomingBody").innerHTML=h
}
function render(){
 if(!id("tab-dashboard")||!window.LEG_DATA)return;
 var now=new Date(),s=schedule(),last=latestActual(s),c=computeCurrent(s,now,last),current=c.current,total=totalKm(),confirmed=last?through(last.leg):0,est=estimatedKm(s,now,last,current,c.state);
 var pct=total?Math.min(100,est/total*100):0,cpct=total?Math.min(100,confirmed/total*100):0;
 id("dashNow").textContent=fmtDate(now);id("dashTotalKm").textContent=total.toFixed(1);id("dashConfirmedKm").textContent=confirmed.toFixed(1)+" km";id("dashEstimatedKm").textContent=est.toFixed(1);id("dashRemainingKm").textContent=Math.max(0,total-est).toFixed(1)+" km";id("dashPercent").textContent=pct.toFixed(1)+"%";
 id("dashProgressBar").style.width=pct+"%";id("dashConfirmedMark").style.left=cpct+"%";id("dashCurrentState").textContent=c.state;
 if(current){id("dashCurrentLeg").textContent="#"+current.leg;id("dashCurrentRunner").textContent=current.runner}else if(last&&last.leg===30){id("dashCurrentLeg").textContent="FINISH";id("dashCurrentRunner").textContent="全隊完成"}else{id("dashCurrentLeg").textContent="—";id("dashCurrentRunner").textContent="等待下一棒"}
 id("dashLatestActual").textContent=last?"#"+last.leg+" "+fmtDate(last.actual):"尚無";
 var nextLeg=current?Math.min(30,current.leg+1):(last?Math.min(30,last.leg+1):1),next=s[nextLeg-1];
 if(last&&last.leg===30){id("dashNextRunner").textContent="已完賽";id("dashNextLeg").textContent="30 / 30 棒完成";id("dashNextEta").textContent="—";id("dashEtaCountdown").textContent="—"}
 else {id("dashNextRunner").textContent=next?next.runner:"—";id("dashNextLeg").textContent=next?"第 "+next.leg+" 棒｜"+next.x.car+" 車｜"+Number(next.x.distance).toFixed(1)+" km":"—";var eta=current?current.finish:(next?next.start:null);id("dashNextEta").textContent=fmtDate(eta);id("dashEtaCountdown").textContent=countdown(eta,now)}
 var finish=s.length?s[s.length-1].finish:null;id("dashFinish").textContent=fmtDate(finish);id("dashFinishCountdown").textContent=countdown(finish,now);
 var offset=NaN;if(last&&last.finish)offset=(last.actual-last.finish)/60000;id("dashOffset").textContent=isFinite(offset)?diffText(offset):"—";
 var completed=last?last.leg:0;id("dashCompletedLegs").textContent=completed+" / 30";id("dashCompletedPercent").textContent=(completed/30*100).toFixed(0)+"%";
 var actualMin=0,actualDist=0,count=0;for(var l=1;l<=30;l++){var am=actualMetric(l);if(am&&isFinite(am.mins)&&isFinite(am.pace)){actualMin+=am.mins;actualDist+=distFor(l);count++}}
 id("dashActualPace").textContent=count&&actualDist?paceText(actualMin*60/actualDist):"—";
 id("dashCurrentDetail").innerHTML=detailHtml(current);id("dashNextDetail").innerHTML=detailHtml((last&&last.leg===30)?null:next);id("dashLastDetail").innerHTML=detailHtml(last);id("dashLegSummary").textContent="實際完成 "+completed+" 棒｜估計進度 "+pct.toFixed(1)+"%";
 renderLegStrip(s,current);renderUpcoming(s,last,current)
}
function init(){
 render();setInterval(render,15000);
 document.addEventListener("change",function(e){if(e.target.matches(".actualArrival,.runnerSelect,.paceInput,.adjust,#raceStart"))setTimeout(render,80)});
 var a=id("applyAll");if(a)a.addEventListener("click",function(){setTimeout(render,100)});
 var r=id("dashRefresh");if(r)r.addEventListener("click",render);
 document.querySelectorAll('.appTabBtn[data-tab="dashboard"]').forEach(function(b){b.addEventListener("click",function(){setTimeout(render,80)})})
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();