(function(){
"use strict";
function id(x){return document.getElementById(x)}
function asDate(v){if(!v)return null;var d=new Date(v);return isNaN(d.getTime())?null:d}
function paceTxt(sec){if(!isFinite(sec)||sec<=0)return "—";sec=Math.round(sec);return String(Math.floor(sec/60)).padStart(2,"0")+":"+String(sec%60).padStart(2,"0")}
function durDetail(mins){
 if(!isFinite(mins)||mins<0)return "—";
 var total=Math.round(mins*60),h=Math.floor(total/3600),m=Math.floor((total%3600)/60),s=total%60;
 if(h>0)return h+"h "+String(m).padStart(2,"0")+"m "+String(s).padStart(2,"0")+"s";
 return m+"m "+String(s).padStart(2,"0")+"s"
}
function numVal(el){var n=Number(el&&el.value);return isFinite(n)&&n>0?n:0}
function actualForLeg(leg){
 var tr=document.querySelector('tr[data-leg="'+leg+'"]');if(!tr)return null;
 var finishEl=tr.querySelector(".actualArrival"),finish=asDate(finishEl&&finishEl.value);if(!finish)return null;
 var start=null,excludedWait=0;
 if(leg===1){
   var rs=id("raceStart");start=asDate(rs&&rs.value)
 } else {
   var prevTr=document.querySelector('tr[data-leg="'+(leg-1)+'"]');
   var prev=prevTr&&prevTr.querySelector(".actualArrival");
   start=asDate(prev&&prev.value);
   if(start&&prevTr){
     var handoff=numVal(prevTr.querySelector(".handoff"));
     var neutral=numVal(prevTr.querySelector(".neutral"));
     excludedWait=handoff+neutral;
     if(excludedWait>0)start=new Date(start.getTime()+excludedWait*60000)
   }
 }
 if(!start||finish<=start)return {start:start,finish:finish,mins:NaN,pace:NaN,excludedWait:excludedWait};
 var mins=(finish-start)/60000,km=Number(tr.dataset.km)||0;
 return {start:start,finish:finish,mins:mins,pace:km>0?mins*60/km:NaN,excludedWait:excludedWait}
}
function ensureCells(){
 document.querySelectorAll("tr[data-leg]").forEach(function(tr){
   var actual=tr.querySelector(".actualCell");if(!actual)return;
   if(!tr.querySelector(".actualDurationCell")){
     var td=document.createElement("td");td.className="actualDurationCell actualMetric";td.textContent="—";actual.insertAdjacentElement("afterend",td)
   }
   if(!tr.querySelector(".actualPaceCell")){
     var dur=tr.querySelector(".actualDurationCell"),td2=document.createElement("td");td2.className="actualPaceCell actualMetric";td2.textContent="—";dur.insertAdjacentElement("afterend",td2)
   }
 });
}
function render(){
 ensureCells();
 document.querySelectorAll("tr[data-leg]").forEach(function(tr){
   var leg=Number(tr.dataset.leg),a=actualForLeg(leg),d=tr.querySelector(".actualDurationCell"),p=tr.querySelector(".actualPaceCell");
   if(a&&isFinite(a.mins)&&a.mins>=0){
     d.textContent=durDetail(a.mins);p.textContent=paceTxt(a.pace)+" /km";
     if(a.excludedWait>0){
       d.title="已扣除前一棒交接/中立等待 "+Math.round(a.excludedWait)+" 分鐘";
       p.title=d.title
     }else{d.removeAttribute("title");p.removeAttribute("title")}
     d.classList.add("hasActualMetric");p.classList.add("hasActualMetric")
   } else {
     d.textContent="—";p.textContent="—";d.removeAttribute("title");p.removeAttribute("title");
     d.classList.remove("hasActualMetric");p.classList.remove("hasActualMetric")
   }
 });
 window.CRUFU_ACTUAL_STATS={get:actualForLeg,refresh:render};
}
function attach(){
 render();
 document.addEventListener("change",function(e){if(e.target.matches(".actualArrival,#raceStart,.handoff,.neutral"))setTimeout(render,20)});
 document.addEventListener("input",function(e){if(e.target.matches(".actualArrival,#raceStart,.handoff,.neutral"))setTimeout(render,20)});
 var a=id("applyAll");if(a)a.addEventListener("click",function(){setTimeout(render,40)});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",attach);else attach();
})();