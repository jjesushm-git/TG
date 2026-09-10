"use strict";
let tankRotation=0,dragY=null;
const fishSprites=["0% 0%","50% 0%","100% 0%","0% 100%","50% 100%","100% 100%"];

renderFish=function(){
  cancelAnimationFrame(state.raf);
  const tank=$("#fishTank"),notes=state.notes.filter(n=>n.pond_id===state.activePond);
  tank.innerHTML="";
  $("#emptyPond").classList.toggle("hidden",notes.length>0);
  const box=tank.getBoundingClientRect();
  const actors=notes.map((n,i)=>{
    const el=document.createElement("button");
    el.className="fish";
    el.style.setProperty("--fish",n.color);
    el.innerHTML='<span class="fish-art" style="--sprite:'+fishSprites[i%fishSprites.length]+'"></span><span class="fish-belly">'+escapeHtml(n.title)+"</span>";
    el.addEventListener("click",()=>viewNote(n));
    tank.appendChild(el);
    const size=innerWidth<=420?140:160;
    return {el,n,angle:(i/Math.max(1,notes.length))*Math.PI*2,y:25+Math.random()*Math.max(1,box.height-size-25),vy:(Math.random()-.5)*.17,base:.0025+Math.random()*.0018,boost:1,w:size,h:size};
  });
  let last=performance.now();
  function frame(now){
    const dt=Math.min(2,(now-last)/16.67);last=now;
    for(const a of actors){
      a.angle+=a.base*a.boost*dt;a.y+=a.vy*dt;
      if(a.y<0||a.y+a.h>box.height){a.vy*=-1;a.y=Math.max(0,Math.min(a.y,box.height-a.h))}
      a.boost+=(1-a.boost)*.025;
      const theta=a.angle+tankRotation,depth=(Math.cos(theta)+1)/2;
      const x=(Math.sin(theta)+1)/2*Math.max(1,box.width-a.w),scale=.65+depth*.45;
      a.screenX=x;
      a.el.style.left=x+"px";a.el.style.top=a.y+"px";a.el.style.zIndex=String(10+Math.round(depth*30));
      a.el.style.opacity=String(.48+depth*.52);a.el.style.transform="scale("+scale+")";
      a.el.classList.toggle("left",Math.cos(theta)<0);a.el.classList.toggle("fast",a.boost>1.2);
    }
    for(let i=0;i<actors.length;i++)for(let j=i+1;j<actors.length;j++){
      const a=actors[i],b=actors[j];
      if(Math.abs(a.screenX-b.screenX)<105&&Math.abs(a.y-b.y)<62){a.boost=Math.max(a.boost,2.6);b.boost=Math.max(b.boost,2.6)}
    }
    state.raf=requestAnimationFrame(frame);
  }
  state.raf=requestAnimationFrame(frame);updatePonds();
};

const pondSurface=$("#pondView");
function rotateTank(delta){tankRotation+=delta*.008;const shift=50+(tankRotation*18)%100;pondSurface.style.backgroundPosition=shift+"% center"}
pondSurface.addEventListener("wheel",e=>{e.preventDefault();rotateTank(e.deltaY)},{passive:false});
pondSurface.addEventListener("touchstart",e=>{dragY=e.touches[0].clientY},{passive:true});
pondSurface.addEventListener("touchmove",e=>{if(dragY===null)return;const y=e.touches[0].clientY;rotateTank(dragY-y);dragY=y;e.preventDefault()},{passive:false});
pondSurface.addEventListener("touchend",()=>{dragY=null});

const savedBackground=localStorage.getItem("gopi_background")||"ocean";
$("#backgroundSelect").value=savedBackground;
function setTankBackground(value){pondSurface.style.setProperty("--tank-bg","url('"+(value==="haunted"?"aquarium-haunted.jpg":"aquarium-ocean.jpg")+"')")}
setTankBackground(savedBackground);
$("#backgroundSelect").addEventListener("change",e=>{localStorage.setItem("gopi_background",e.target.value);setTankBackground(e.target.value);toast("Fondo actualizado")});
