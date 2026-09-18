(function(){
"use strict";
var TAB_FOR_SECTION={overview:"progress",mapSection:"progress",calc:"progress",paces:"runners",runnerStats:"runners",gear:"event",rules:"event",special:"event","official-links":"event"};
function activate(name,scrollToTop){
 var buttons=document.querySelectorAll(".appTabBtn"),panels=document.querySelectorAll(".appTabPanel");
 for(var i=0;i<buttons.length;i++){
   var on=buttons[i].getAttribute("data-tab")===name;
   buttons[i].classList.toggle("active",on);buttons[i].setAttribute("aria-selected",on?"true":"false")
 }
 for(var j=0;j<panels.length;j++){
   var show=panels[j].getAttribute("data-tab-panel")===name;
   panels[j].hidden=!show;panels[j].classList.toggle("active",show)
 }
 if(name==="progress")setTimeout(function(){window.dispatchEvent(new Event("resize"))},40);
 if(scrollToTop){var nav=document.querySelector("nav");if(nav)window.scrollTo({top:Math.max(0,nav.offsetTop),behavior:"smooth"})}
}
function activateForHash(){
 var h=(location.hash||"").replace(/^#/,"");if(TAB_FOR_SECTION[h])activate(TAB_FOR_SECTION[h],false)
}
function init(){
 var buttons=document.querySelectorAll(".appTabBtn");
 for(var i=0;i<buttons.length;i++)buttons[i].addEventListener("click",function(){activate(this.getAttribute("data-tab"),true)});
 document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest('.sectionJump a[href^="#"]');if(a){var h=a.getAttribute("href").slice(1);if(TAB_FOR_SECTION[h])activate(TAB_FOR_SECTION[h],false)}});
 window.addEventListener("hashchange",activateForHash);
 activateForHash()
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();