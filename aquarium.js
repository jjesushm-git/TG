"use strict";
let cameraYaw=0,dragY=null,backGuardArmed=false;
const TAU=Math.PI*2,FOV=1.55,fishSprites=["100% 0%","100% 100%"];
const wrapAngle=a=>Math.atan2(Math.sin(a),Math.cos(a));
renderFish=function(){
  cancelAnimationFrame(state.raf);
  const tank=$("#fishTank"),notes=state.notes.filter(n=>n.pond_id===state.activePond);tank.innerHTML="";
  $("#emptyPond").classList.toggle("hidden",notes.length>0);const box=tank.getBoundingClientRect();
  const actors=notes.map((n,i)=>{const el=document.createElement("button");el.className="fish";el.style.setProperty("--fish",n.color);el.innerHTML='<span class="fish-art" style="--sprite:'+fishSprites[i%2]+'"></span><span class="fish-belly">'+escapeHtml(n.title)+"</span>";el.addEventListener("click",()=>viewNote(n));tank.appendChild(el);const size=innerWidth<=420?140:160;return{el,n,worldAngle:(i/Math.max(1,notes.length))*TAU-Math.PI,depth:.35+Math.random()*.65,y:20+Math.random()*Math.max(1,box.height-size-20),vy:(Math.random()-.5)*.18,swim:(.0007+Math.random()*.0012)*(Math.random()>.5?1:-1),boost:1,w:size,h:size}});
  let last=performance.now();
  function frame(now){const dt=Math.min(2,(now-last)/16.67);last=now;
    for(const a of actors){a.worldAngle=wrapAngle(a.worldAngle+a.swim*a.boost*dt);a.y+=a.vy*dt;if(a.y<0||a.y+a.h>box.height){a.vy*=-1;a.y=Math.max(0,Math.min(a.y,box.height-a.h))}a.boost+=(1-a.boost)*.025;const relative=wrapAngle(a.worldAngle-cameraYaw),visible=Math.abs(relative)<FOV*.62;if(!visible){a.el.style.visibility="hidden";a.screenX=-999;continue}const perspective=Math.tan(relative)/Math.tan(FOV*.62),x=(box.width-a.w)/2+perspective*(box.width+a.w)*.5,sideFade=1-Math.min(1,Math.abs(relative)/(FOV*.62)),scale=(.52+a.depth*.65)*(.84+sideFade*.16);a.screenX=x;a.el.style.visibility="visible";a.el.style.left=x+"px";a.el.style.top=a.y+"px";a.el.style.zIndex=String(10+Math.round(a.depth*30));a.el.style.opacity=String(.38+sideFade*.62);a.el.style.transform="scale("+scale+")";a.el.classList.toggle("left",a.swim<0);a.el.classList.toggle("fast",a.boost>1.2)}
    for(let i=0;i<actors.length;i++)for(let j=i+1;j<actors.length;j++){const a=actors[i],b=actors[j];if(a.screenX>-100&&b.screenX>-100&&Math.abs(a.screenX-b.screenX)<95&&Math.abs(a.y-b.y)<58){a.boost=Math.max(a.boost,2.7);b.boost=Math.max(b.boost,2.7)}}state.raf=requestAnimationFrame(frame)}
  state.raf=requestAnimationFrame(frame);updatePonds();
};
const pondSurface=$("#pondView");
function rotateView(delta){cameraYaw=wrapAngle(cameraYaw+delta*.006);pondSurface.style.backgroundPosition=(50-cameraYaw/Math.PI*38)+"% center"}
pondSurface.addEventListener("wheel",e=>{e.preventDefault();rotateView(e.deltaY)},{passive:false});
pondSurface.addEventListener("touchstart",e=>{dragY=e.touches[0].clientY},{passive:true});
pondSurface.addEventListener("touchmove",e=>{if(dragY===null)return;const y=e.touches[0].clientY;rotateView(dragY-y);dragY=y;e.preventDefault()},{passive:false});
pondSurface.addEventListener("touchend",()=>{dragY=null});
const savedBackground=localStorage.getItem("gopi_background")||"ocean";$("#backgroundSelect").value=savedBackground;
function setTankBackground(value){pondSurface.style.setProperty("--tank-bg","url('"+(value==="haunted"?"aquarium-haunted.jpg":"aquarium-ocean.jpg")+"')")}
setTankBackground(savedBackground);$("#backgroundSelect").addEventListener("change",e=>{localStorage.setItem("gopi_background",e.target.value);setTankBackground(e.target.value);toast("Fondo actualizado")});
const versionValue=[...document.querySelectorAll(".setting-row")].find(r=>r.textContent.includes("Versión"))?.querySelector("b");if(versionValue)versionValue.textContent="1.1.3";
function armBackGuard(){if(backGuardArmed)return;history.pushState({gopionline:true},"");backGuardArmed=true}
const originalShowApp=showApp;showApp=function(){originalShowApp();armBackGuard()};
window.addEventListener("popstate",async()=>{if(!state.user)return;const openDialog=[...document.querySelectorAll("dialog[open]")].at(-1);if(openDialog){openDialog.close();history.pushState({gopionline:true},"");return}if(!$("#pondView").classList.contains("hidden")){showScreen("homeView");history.pushState({gopionline:true},"");return}cancelAnimationFrame(state.raf);if(cloud)await sb.auth.signOut();state.user=null;$("#appView").classList.add("hidden");$("#authView").classList.remove("hidden");toast("Sesión cerrada");backGuardArmed=false});
if(!$("#appView").classList.contains("hidden"))armBackGuard();
