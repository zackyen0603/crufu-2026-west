(function(){
"use strict";
var MODE_KEY="crufu2026_data_source";
var RAW_URL="https://raw.githubusercontent.com/zackyen0603/crufu-2026-west/main/shared/race-state.json";
var FALLBACK_URL="shared/race-state.json";
var mode="local",localSnapshot=null,lastRevision=null,timer=null,loading=false;

function id(x){return document.getElementById(x)}
function all(sel){return Array.prototype.slice.call(document.querySelectorAll(sel))}
function fmtTime(s){if(!s)return "—";var d=new Date(s);if(isNaN(d.getTime()))return s;return String(d.getMonth()+1).padStart(2,"0")+"/"+String(d.getDate()).padStart(2,"0")+" "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")+":"+String(d.getSeconds()).padStart(2,"0")}
function setStatus(kind,text,rev,updated){
 var dot=id("sourceStatusDot"),t=id("sourceStatusText"),r=id("sourceRevision"),u=id("sourceUpdatedAt");
 if(dot)dot.className="sourceDot "+kind;if(t)t.textContent=text;if(r)r.textContent=rev?"Revision #"+rev:"—";if(u)u.textContent=updated?"更新 "+fmtTime(updated):"—"
}
function collect(){
 var s={race_start:id("raceStart")?id("raceStart").value:"",legs:{},paces:{}};
 all("tr[data-leg]").forEach(function(tr){
   var l=tr.dataset.leg;
   s.legs[l]={
     runner:tr.querySelector(".runnerSelect")?tr.querySelector(".runnerSelect").value:"",
     actual_arrival:tr.querySelector(".actualArrival")?tr.querySelector(".actualArrival").value:"",
     adjustment:Number(tr.querySelector(".adjust")?tr.querySelector(".adjust").value:0)||0,
     handoff_wait:Number(tr.querySelector(".handoff")?tr.querySelector(".handoff").value:0)||0,
     neutral_wait:Number(tr.querySelector(".neutral")?tr.querySelector(".neutral").value:0)||0
   }
 });
 all(".paceInput").forEach(function(el){s.paces[el.dataset.runner]=el.value});
 return s
}
function setValue(el,v){if(el&&v!==undefined&&v!==null)el.value=String(v)}
function applyState(s){
 if(!s)return;
 if(s.race_start)setValue(id("raceStart"),String(s.race_start).slice(0,16));
 all("tr[data-leg]").forEach(function(tr){
   var x=s.legs&&s.legs[tr.dataset.leg];if(!x)return;
   setValue(tr.querySelector(".runnerSelect"),x.runner);
   setValue(tr.querySelector(".actualArrival"),x.actual_arrival||"");
   setValue(tr.querySelector(".adjust"),x.adjustment||0);
   setValue(tr.querySelector(".handoff"),x.handoff_wait||0);
   setValue(tr.querySelector(".neutral"),x.neutral_wait||0)
 });
 if(s.paces)all(".paceInput").forEach(function(el){if(s.paces[el.dataset.runner])el.value=s.paces[el.dataset.runner]});
 var a=id("applyAll");if(a)a.click();
 if(window.CRUFU_ACTUAL_STATS&&window.CRUFU_ACTUAL_STATS.refresh)window.CRUFU_ACTUAL_STATS.refresh();
 setTimeout(function(){window.dispatchEvent(new Event("resize"))},50)
}
function readonly(on){
 document.body.classList.toggle("sharedMode",on);
 all("#calc input,#calc select,#paces select").forEach(function(el){el.disabled=on});
 var buttons=all('[data-source-mode]');buttons.forEach(function(b){b.classList.toggle("active",b.dataset.sourceMode===(on?"shared":"local"))})
}
async function getJson(url){
 var res=await fetch(url+(url.indexOf("?")>=0?"&":"?")+"t="+Date.now(),{cache:"no-store"});
 if(!res.ok)throw new Error("HTTP "+res.status);return await res.json()
}
async function refresh(force){
 if(mode!=="shared"||loading)return;loading=true;setStatus("loading","同步團隊資料中",lastRevision,null);
 try{
   var s;
   try{s=await getJson(RAW_URL)}catch(e){s=await getJson(FALLBACK_URL)}
   if(force||String(s.revision)!==String(lastRevision)){
     applyState(s);lastRevision=s.revision
   }
   setStatus("ok","團隊共享｜唯讀",s.revision,s.updated_at)
 }catch(e){
   console.error("Shared race state fetch failed",e);setStatus("error","團隊資料讀取失敗",lastRevision,null)
 }finally{loading=false}
}
function switchMode(next){
 if(next===mode)return;
 if(next==="shared"){
   localSnapshot=collect();mode="shared";try{localStorage.setItem(MODE_KEY,"shared")}catch(e){}
   readonly(true);id("sourceRefresh").hidden=false;refresh(true)
 }else{
   mode="local";try{localStorage.setItem(MODE_KEY,"local")}catch(e){}
   readonly(false);id("sourceRefresh").hidden=true;
   if(localSnapshot)applyState(localSnapshot);
   setStatus("local","本機資料",null,null)
 }
}
function init(){
 all("[data-source-mode]").forEach(function(b){b.addEventListener("click",function(){switchMode(b.dataset.sourceMode)})});
 var r=id("sourceRefresh");if(r)r.addEventListener("click",function(){refresh(true)});
 var saved="local";try{saved=localStorage.getItem(MODE_KEY)||"local"}catch(e){}
 mode="local";readonly(false);setStatus("local","本機資料",null,null);
 if(saved==="shared"){setTimeout(function(){switchMode("shared")},120)}
 timer=setInterval(function(){if(mode==="shared")refresh(false)},15000)
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();

(function(){
"use strict";
var autoTimer=null;
var AUTO_SELECTOR="#raceStart,.runnerSelect,.paceInput,.adjust,.handoff,.neutral,.actualArrival";
function autoApply(delay){
 if(document.body.classList.contains("sharedMode"))return;
 clearTimeout(autoTimer);
 autoTimer=setTimeout(function(){
   var btn=document.getElementById("applyAll");
   if(btn&&!btn.disabled)btn.click()
 },delay||0)
}
function initAutoApply(){
 document.addEventListener("change",function(e){
   if(e.target&&e.target.matches&&e.target.matches(AUTO_SELECTOR))autoApply(20)
 },true);
 document.addEventListener("input",function(e){
   if(!e.target||!e.target.matches||!e.target.matches(AUTO_SELECTOR))return;
   if(e.target.matches(".adjust,.handoff,.neutral,#raceStart,.actualArrival"))autoApply(250)
 },true);
 ["resetAssign","resetTimes"].forEach(function(x){
   var b=document.getElementById(x);if(b)b.addEventListener("click",function(){autoApply(30)})
 });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initAutoApply);else initAutoApply();
})();