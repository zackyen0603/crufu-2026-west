(function(){
"use strict";
var timer=null;
var SELECTOR="#raceStart,.runnerSelect,.paceInput,.adjust,.handoff,.neutral,.actualArrival";
function schedule(delay){
 if(document.body.classList.contains("sharedMode"))return;
 clearTimeout(timer);
 timer=setTimeout(function(){
   var btn=document.getElementById("applyAll");
   if(btn&&!btn.disabled)btn.click()
 },delay||0)
}
function init(){
 document.addEventListener("change",function(e){
   if(e.target&&e.target.matches&&e.target.matches(SELECTOR))schedule(20)
 },true);
 document.addEventListener("input",function(e){
   if(!e.target||!e.target.matches||!e.target.matches(SELECTOR))return;
   if(e.target.matches(".adjust,.handoff,.neutral,#raceStart,.actualArrival"))schedule(250)
 },true);
 ["resetAssign","resetTimes"].forEach(function(x){
   var b=document.getElementById(x);if(b)b.addEventListener("click",function(){schedule(30)})
 });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();