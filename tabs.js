(function(){
"use strict";
var TAB_FOR_SECTION={dashboard:"dashboard",overview:"progress",mapSection:"progress",calc:"progress",paces:"runners",runnerStats:"runners",gear:"event",rules:"event",special:"event","official-links":"event",scenarioForecast:"scenario"};
function activate(name,scrollToTop){
 var buttons=document.querySelectorAll(".appTabBtn"),panels=document.querySelectorAll(".appTabPanel");
 for(var i=0;i<buttons.length;i++){var on=buttons[i].getAttribute("data-tab")===name;buttons[i].classList.toggle("active",on);buttons[i].setAttribute("aria-selected",on?"true":"false")}
 for(var j=0;j<panels.length;j++){var show=panels[j].getAttribute("data-tab-panel")===name;panels[j].hidden=!show;panels[j].classList.toggle("active",show)}
 if(name==="progress")setTimeout(function(){window.dispatchEvent(new Event("resize"))},40);
 if(name==="scenario")setTimeout(renderScenario,20);
 try{localStorage.setItem("crufu2026_active_tab",name)}catch(e){}
 if(scrollToTop){var nav=document.querySelector("nav");if(nav)window.scrollTo({top:Math.max(0,nav.offsetTop),behavior:"smooth"})}
}
function activateForHash(){var h=(location.hash||"").replace(/^#/,"");if(TAB_FOR_SECTION[h]){activate(TAB_FOR_SECTION[h],false);return true}return false}

var SCENARIO_LEGS=[
 {leg:21,runner:"Eason",km:10.3,note:"原 8.3 + 2.0 km"},
 {leg:22,runner:"Eric.Lin",km:10.0,note:"原 8.0 + 2.0 km"},
 {leg:23,runner:"Zack",km:11.2,note:"原 9.2 + 2.0 km"},
 {leg:24,runner:"Kevin",km:10.3,note:"原 8.3 + 2.0 km"},
 {leg:26,runner:"Heidi",km:7.4},{leg:27,runner:"Joe",km:7.6},{leg:28,runner:"Jim",km:10.6},{leg:29,runner:"Eric.Wang",km:7.7},{leg:30,runner:"Dora",km:4.1}
];
var scenarioState=null;
function minsFromPace(v){var p=String(v||"07:00").split(":");return (+p[0]||0)+(+p[1]||0)/60}
function fmtTime(d){return d.toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit",hour12:false})}
function fmtDur(mins){var m=Math.floor(mins),s=Math.round((mins-m)*60);if(s===60){m++;s=0}return m+"m "+String(s).padStart(2,"0")+"s"}
function fmtPace(v){return v+" /km"}
function addMin(d,m){return new Date(d.getTime()+m*60000)}
function scenarioAnchor(state){
 var l20=state&&state.legs&&state.legs["20"],t=l20&&l20.actual_arrival?new Date(l20.actual_arrival):null;
 if(!t||isNaN(t.getTime()))t=new Date("2026-09-20T01:38:00+08:00");
 var neutral=Number(l20&&l20.neutral_wait)||52;
 return addMin(t,neutral);
}
function aidTimes(st,pace,km){
 var out=[];
 for(var d=3;d<km+0.0001;d+=3){if(d>=km)break;out.push('<span class="aidChip">'+d+' km '+fmtTime(addMin(st,pace*d))+'</span>')}
 return out.length?out.join(" "):"—";
}
function buildScenario(){
 if(document.querySelector('.appTabBtn[data-tab="scenario"]'))return;
 var nav=document.querySelector(".appTabs");if(!nav)return;
 var b=document.createElement("button");b.type="button";b.className="appTabBtn";b.setAttribute("data-tab","scenario");b.setAttribute("role","tab");b.setAttribute("aria-controls","tab-scenario");b.setAttribute("aria-selected","false");b.innerHTML="<strong>新方案推估</strong><small>21–24 四人重排＋每 3 km 補給</small>";nav.appendChild(b);
 var main=document.querySelector("main.wrap");if(!main)return;
 var p=document.createElement("div");p.className="appTabPanel";p.hidden=true;p.id="tab-scenario";p.setAttribute("data-tab-panel","scenario");p.setAttribute("role","tabpanel");
 p.innerHTML='<div class="tabPanelHeader"><div><h2>新方案推估｜Ailsa 最後一輪不跑</h2><p class="muted">不沿用原本 21–25 五棒切法。原本 21–25 的總距離 41.8 km 改成四人連續完成：Eason 10.3 km、Eric.Lin 10.0 km、Zack 11.2 km、Kevin 10.3 km；因此只保留新 21–24，完成後直接接第 26 棒。第 21 棒仍以 02:30 管制統一起跑為錨點。</p></div><div class="sectionJump"><button id="scenarioRefresh" class="secondary" type="button">重新抓取共享資料</button></div></div><section class="dashKpis scenarioKpis"><div class="dashKpi"><span>方案起跑錨點</span><b id="scStart">—</b><small>新第 21 棒</small></div><div class="dashKpi"><span>預估完賽</span><b id="scFinish">—</b><small>第 30 棒抵達</small></div><div class="dashKpi"><span>剩餘跑步時間</span><b id="scRemaining">—</b><small>不含新增等待</small></div><div class="dashKpi"><span>全程牆上時間</span><b id="scWall">—</b><small>06:52 起跑至預估完賽</small></div></section><section class="card"><h3>21–24 新配置</h3><div class="scenarioSplit"><span>#21 Eason 10.3 km</span><span>#22 Eric.Lin 10.0 km</span><span>#23 Zack 11.2 km</span><span>#24 Kevin 10.3 km</span><span>之後直接 #26 Heidi</span></div><p class="small muted">四人各多承擔 2.0 km，Ailsa 不跑此輪；此頁只做時間模擬，不會改動正式 30 棒紀錄。</p></section><section class="card" id="scenarioForecast"><h3>新方案時間表與每 3 km 補給 ETA</h3><div class="tableWrap"><table><thead><tr><th>棒次</th><th>跑者</th><th>距離</th><th>採用配速</th><th>預估用時</th><th>預估開始</th><th>每 3 km 補給時間點</th><th>預估結束</th></tr></thead><tbody id="scenarioBody"></tbody></table></div></section><section class="card"><h3>假設</h3><p class="small muted">補給時間以各跑者在本段的起跑時間與共享基準配速線性推估，列出 3、6、9… km 的通過時間。模型未另外加入 21 棒之後可能發生的交接、交通或新管制等待。</p><div id="scenarioStatus" class="small muted">讀取共享資料中…</div></section>';
 main.appendChild(p);
 var st=document.createElement("style");st.textContent='.scenarioSplit{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.scenarioSplit span,.aidChip{display:inline-block;padding:7px 10px;border:1px solid var(--line,#ddd);border-radius:999px;font-weight:700}.aidChip{padding:4px 7px;margin:2px;font-size:.9em;white-space:nowrap}.scenarioKpis{margin-top:0}@media(max-width:700px){.scenarioKpis{grid-template-columns:repeat(2,minmax(0,1fr))}}';document.head.appendChild(st);
 b.addEventListener("click",function(){activate("scenario",true)});
 document.getElementById("scenarioRefresh").addEventListener("click",fetchScenarioState);
}
function renderScenario(){
 if(!scenarioState)return fetchScenarioState();
 var state=scenarioState,paces=state.paces||{},start=scenarioAnchor(state),t=new Date(start),total=0,tbody=document.getElementById("scenarioBody");if(!tbody)return;
 tbody.innerHTML="";
 SCENARIO_LEGS.forEach(function(x){var pv=paces[x.runner]||"07:00",pace=minsFromPace(pv),dur=pace*x.km,st=new Date(t),en=addMin(st,dur);total+=dur;t=en;var tr=document.createElement("tr");tr.innerHTML="<td>#"+x.leg+(x.note?'<br><small class="muted">'+x.note+'</small>':"")+"</td><td><b>"+x.runner+"</b></td><td>"+x.km.toFixed(1)+" km</td><td>"+fmtPace(pv)+"</td><td>"+fmtDur(dur)+"</td><td>"+fmtTime(st)+"</td><td>"+aidTimes(st,pace,x.km)+"</td><td><b>"+fmtTime(en)+"</b></td>";tbody.appendChild(tr)});
 var raceStart=new Date(state.race_start||"2026-09-19T06:52:00+08:00"),wall=(t-raceStart)/60000;
 document.getElementById("scStart").textContent=fmtTime(start);
 document.getElementById("scFinish").textContent=fmtTime(t)+"（9/20）";
 document.getElementById("scRemaining").textContent=Math.floor(total/60)+"h "+String(Math.round(total%60)).padStart(2,"0")+"m";
 document.getElementById("scWall").textContent=Math.floor(wall/60)+"h "+String(Math.round(wall%60)).padStart(2,"0")+"m";
 var s=document.getElementById("scenarioStatus");if(s)s.textContent="共享 Revision #"+state.revision+"｜配速：Eason "+(paces.Eason||"—")+"、Eric.Lin "+(paces["Eric.Lin"]||"—")+"、Zack "+(paces.Zack||"—")+"、Kevin "+(paces.Kevin||"—");
}
function fetchScenarioState(){
 var s=document.getElementById("scenarioStatus");if(s)s.textContent="正在抓取共享資料…";
 fetch("shared/race-state.json?t="+Date.now(),{cache:"no-store"}).then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json()}).then(function(j){scenarioState=j;renderScenario()}).catch(function(e){if(s)s.textContent="共享資料讀取失敗："+e.message});
}
function init(){
 buildScenario();
 var buttons=document.querySelectorAll(".appTabBtn");
 for(var i=0;i<buttons.length;i++)if(!buttons[i].dataset.tabBound){buttons[i].dataset.tabBound="1";buttons[i].addEventListener("click",function(){activate(this.getAttribute("data-tab"),true)})}
 document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest('.sectionJump a[href^="#"]');if(a){var h=a.getAttribute("href").slice(1);if(TAB_FOR_SECTION[h])activate(TAB_FOR_SECTION[h],false)}});
 window.addEventListener("hashchange",activateForHash);
 if(!activateForHash()){var saved="";try{saved=localStorage.getItem("crufu2026_active_tab")||""}catch(e){}if(saved)activate(saved,false)}
 fetchScenarioState();setInterval(fetchScenarioState,15000);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();