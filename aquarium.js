"use strict";
let backGuardArmed=false;
const noteColors=["#ffe680","#ffaaa5","#9ee7d8","#a9d4ff","#d7b5ff","#ffc78e","#b8e994"];
renderFish=function(){cancelAnimationFrame(state.raf);const board=$("#fishTank");const notes=state.notes.filter(n=>n.pond_id===state.activePond).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));board.innerHTML="";board.className="fish-tank notes-board";$("#emptyPond").classList.toggle("hidden",notes.length>0);notes.forEach((note,index)=>{const card=document.createElement("button");card.className="board-note";card.style.setProperty("--paper",note.color||noteColors[index%noteColors.length]);card.innerHTML='<span class="pin" aria-hidden="true"></span><strong>'+escapeHtml(note.title)+'</strong><time>'+stamp(note.created_at)+"</time>";card.addEventListener("click",()=>viewNote(note));board.appendChild(card)});updatePonds()};
const versionValue=[...document.querySelectorAll(".setting-row")].find(row=>row.textContent.includes("Versión"))?.querySelector("b");if(versionValue)versionValue.textContent="1.1.5";
const backgroundLabel=$("#backgroundSelect")?.closest("label");if(backgroundLabel)backgroundLabel.classList.add("hidden");
const hint=$(".turn-hint");if(hint)hint.textContent="Notas recientes primero";
const emptyTitle=$("#emptyPond b"),emptyText=$("#emptyPond span");if(emptyTitle)emptyTitle.textContent="El pizarrón está vacío";if(emptyText)emptyText.textContent="Crea una nota para colocarla aquí.";
$(".hero-fish").textContent="📝";$(".brand").innerHTML="🎓 <span>TableroGO</span>";$("#myPondBtn b").textContent="📌";
function armBackGuard(){if(backGuardArmed)return;history.pushState({gopionline:true},"");backGuardArmed=true}
const originalShowApp=showApp;showApp=function(){originalShowApp();armBackGuard()};
window.addEventListener("popstate",async()=>{if(!state.user)return;const openDialog=[...document.querySelectorAll("dialog[open]")].at(-1);if(openDialog){openDialog.close();history.pushState({gopionline:true},"");return}if(!$("#pondView").classList.contains("hidden")){showScreen("homeView");history.pushState({gopionline:true},"");return}if(cloud)await sb.auth.signOut();state.user=null;$("#appView").classList.add("hidden");$("#authView").classList.remove("hidden");toast("Sesión cerrada");backGuardArmed=false});
if(!$("#appView").classList.contains("hidden"))armBackGuard();
