"use strict";
let currentProfile=null;

window.authorizeCurrentUser=async function(){
  const {data,error}=await sb.from("profiles").select("id,email,role,status,created_at").eq("id",state.user.id).single();
  if(error){toast("Ejecuta el archivo supabase.sql actualizado");await sb.auth.signOut();state.user=null;return false}
  currentProfile=data;
  if(data.status!=="approved"){
    const message=data.status==="revoked"?"Tu acceso fue retirado. Contacta al administrador.":"Tu cuenta está pendiente de autorización.";
    $("#authHelp").textContent=message;toast(message);await sb.auth.signOut();state.user=null;return false
  }
  $("#adminSettings").classList.toggle("hidden",data.role!=="admin");
  return true
};

const originalSettingsClick=$("#settingsBtn").onclick;
$("#settingsBtn").onclick=()=>{originalSettingsClick?.();$("#adminSettings").classList.toggle("hidden",currentProfile?.role!=="admin")};
$("#qrBtn").onclick=()=>{resetQrChooser();showScreen("qrView");showQrTab("create")};
$("#messagesBtn").onclick=async()=>{showScreen("messagesView");startMessageUpdates();await loadRecipients()};
$$('[data-feature-home]').forEach(button=>button.onclick=()=>showScreen("homeView"));

// Administración de cuentas
function userRow(profile,checkbox=false){
  const remaining=Math.max(0,7-Math.floor((Date.now()-new Date(profile.created_at))/86400000));
  if(checkbox)return `<label class="user-row"><input type="checkbox" name="approve" value="${profile.id}"><span><b>${escapeHtml(profile.email)}</b><small> ${remaining} día${remaining===1?"":"s"} para autorizar</small></span></label>`;
  return `<div class="user-row"><span><b>${escapeHtml(profile.email)}</b><small> · ${profile.role==="admin"?"Administrador":"Usuario"}</small></span>${profile.id===state.user.id?"<small>Tu cuenta</small>":`<button data-revoke="${profile.id}">Quitar acceso</button>`}</div>`
}
async function openPendingUsers(){
  const {data,error}=await sb.from("profiles").select("id,email,created_at").eq("status","pending").order("created_at");
  if(error)return toast(error.message);
  $("#pendingUsersList").innerHTML=data.length?data.map(p=>userRow(p,true)).join(""):"<p>No hay cuentas pendientes.</p>";
  $("#pendingUsersDialog").showModal()
}
$("#pendingUsersBtn").onclick=()=>{$("#settingsDialog").close();openPendingUsers()};
$("#pendingUsersForm").onsubmit=async e=>{
  e.preventDefault();const ids=$$('#pendingUsersList input:checked').map(x=>x.value);if(!ids.length)return toast("Selecciona al menos una cuenta");
  const {error}=await sb.rpc("approve_users",{user_ids:ids});if(error)return toast(error.message);
  toast("Cuentas autorizadas");await openPendingUsers()
};
async function openUsers(){
  const {data,error}=await sb.from("profiles").select("id,email,role,status,created_at").eq("status","approved").order("email");if(error)return toast(error.message);
  $("#usersList").innerHTML=data.map(p=>userRow(p)).join("")||"<p>No hay usuarios.</p>";
  $$('#usersList [data-revoke]').forEach(button=>button.onclick=async()=>{if(!confirm("¿Quitar el acceso a esta cuenta?"))return;const {error}=await sb.rpc("revoke_user",{target_user:button.dataset.revoke});if(error)return toast(error.message);toast("Acceso retirado");openUsers()});
  $("#usersDialog").showModal()
}
$("#usersBtn").onclick=()=>{$("#settingsDialog").close();openUsers()};

// Mensajería
let activeRecipient="",messageChannel=null,messagePoll=null,messageBusy=false,messageSignature="",messageCache=[],editingMessageId="";
const isTransferNow=value=>/^https?:\/\/(?:www\.)?transfernow\.net\//i.test(value.trim());
async function loadRecipients(){
  const {data,error}=await sb.from("profiles").select("id,email").eq("status","approved").neq("id",state.user.id).order("email");
  if(error)return toast(error.message);const select=$("#messageRecipient");select.innerHTML=data.length?data.map(p=>`<option value="${p.id}">${escapeHtml(p.email)}</option>`).join(""):"<option value=''>No hay otros usuarios</option>";
  activeRecipient=select.value;messageSignature="";if(activeRecipient)await loadMessages(true);else $("#messageList").innerHTML="<p class='muted'>No hay otros usuarios autorizados.</p>"
}
async function loadMessages(force=false){
  if(!activeRecipient||messageBusy)return false;messageBusy=true;const me=state.user.id;
  const filter=`and(sender_id.eq.${me},recipient_id.eq.${activeRecipient}),and(sender_id.eq.${activeRecipient},recipient_id.eq.${me})`;
  const {data,error}=await sb.from("messages").select("*").or(filter).order("created_at",{ascending:true}).limit(200);messageBusy=false;if(error){toast(error.message);return false}
  const signature=data.map(m=>`${m.id}:${m.updated_at||""}:${m.body}`).join("|");if(!force&&signature===messageSignature)return true;messageSignature=signature;
  messageCache=data;const box=$("#messageList");box.innerHTML=data.map(m=>{const file=isTransferNow(m.body),mine=m.sender_id===me,content=file?`<a class="transfer-message" href="${escapeHtml(m.body)}" target="_blank" rel="noopener noreferrer">📎 Archivo en TransferNow<br><small>Disponible temporalmente · Abrir o descargar</small></a>`:`<span>${escapeHtml(m.body)}</span>`,edited=m.updated_at&&new Date(m.updated_at)>new Date(m.created_at);return `<div class="message-line ${mine?"mine-line":""}">${mine?`<button class="message-tool pencil-tool" data-edit-message="${m.id}" aria-label="Editar mensaje" title="Editar mensaje">✏️</button>`:""}<article class="message ${mine?"mine":""}" data-message-card="${m.id}">${content}<time>${stamp(m.created_at)}${edited?" · editado":""}</time></article>${mine?`<button class="message-tool trash-tool" data-delete-message="${m.id}" aria-label="Borrar mensaje" title="Borrar mensaje">🗑️</button>`:""}</div>`}).join("")||"<p class='muted'>Aún no hay mensajes.</p>";
  $$('[data-edit-message]').forEach(button=>button.onclick=()=>openMessageEditor(button.dataset.editMessage));
  $$('[data-delete-message]').forEach(button=>button.onclick=()=>deleteMessage(button.dataset.deleteMessage,button));box.scrollTop=box.scrollHeight
  return true
}
function activePair(message){const me=state.user?.id;return activeRecipient&&((message.sender_id===me&&message.recipient_id===activeRecipient)||(message.sender_id===activeRecipient&&message.recipient_id===me))}
function startMessageUpdates(){
  if(!cloud||!state.user)return;
  if(!messageChannel)messageChannel=sb.channel(`tablerogo-messages-${state.user.id}`).on("postgres_changes",{event:"*",schema:"public",table:"messages"},()=>{if(!$("#messagesView").classList.contains("hidden"))loadMessages(true)}).subscribe();
  if(!messagePoll)messagePoll=setInterval(()=>{if(!$("#messagesView").classList.contains("hidden")&&document.visibilityState==="visible")loadMessages()},2000)
}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&!$("#messagesView").classList.contains("hidden"))loadMessages(true)});
window.addEventListener("focus",()=>{if(!$("#messagesView").classList.contains("hidden"))loadMessages(true)});
$("#messageRecipient").onchange=async e=>{activeRecipient=e.target.value;messageSignature="";await loadMessages(true)};
$("#messageForm").onsubmit=async e=>{e.preventDefault();const body=$("#messageBody").value.trim();if(!activeRecipient)return toast("Selecciona un usuario");const {error}=await sb.from("messages").insert({sender_id:state.user.id,recipient_id:activeRecipient,body});if(error)return toast(error.message);$("#messageBody").value="";await loadMessages()};
function openMessageEditor(id){const message=messageCache.find(item=>item.id===id&&item.sender_id===state.user.id);if(!message)return;editingMessageId=id;$("#editMessageBody").value=message.body;$("#editMessageDialog").showModal();$("#editMessageBody").focus()}
$("#editMessageForm").onsubmit=async e=>{e.preventDefault();const body=$("#editMessageBody").value.trim();if(!body||!editingMessageId)return;const {error}=await sb.from("messages").update({body,updated_at:new Date().toISOString()}).eq("id",editingMessageId).eq("sender_id",state.user.id);if(error)return toast(error.message);$("#editMessageDialog").close();editingMessageId="";messageSignature="";await loadMessages(true);toast("Mensaje editado")};
async function paperBasketAnimation(card,trash){
  if(!card||!trash||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const from=card.getBoundingClientRect(),to=trash.getBoundingClientRect(),paper=document.createElement("div");paper.className="crumpled-paper";paper.textContent="📄";paper.style.left=`${from.left+from.width/2-22}px`;paper.style.top=`${from.top+from.height/2-22}px`;document.body.appendChild(paper);card.style.visibility="hidden";
  await paper.animate([{transform:"scale(1) rotate(0)",borderRadius:"5px"},{transform:"scale(.55) rotate(220deg)",borderRadius:"50%"}],{duration:320,easing:"ease-in",fill:"forwards"}).finished;
  const dx=to.left+to.width/2-(from.left+from.width/2),dy=to.top+to.height/2-(from.top+from.height/2);
  await paper.animate([{transform:"translate(0,0) scale(.55) rotate(220deg)"},{transform:`translate(${dx*.5}px,${dy*.5-90}px) scale(.45) rotate(560deg)`},{transform:`translate(${dx}px,${dy}px) scale(.18) rotate(900deg)`,opacity:.2}],{duration:650,easing:"cubic-bezier(.25,.7,.45,1)",fill:"forwards"}).finished;paper.remove()
}
async function deleteMessage(id,trash){const message=messageCache.find(item=>item.id===id&&item.sender_id===state.user.id);if(!message||!confirm("¿Borrar este mensaje?"))return;const line=trash.closest(".message-line"),card=line?.querySelector("[data-message-card]");await paperBasketAnimation(card,trash);const {error}=await sb.from("messages").delete().eq("id",id).eq("sender_id",state.user.id);if(error){if(card)card.style.visibility="";return toast(error.message)}line?.remove();messageCache=messageCache.filter(item=>item.id!==id);messageSignature="";toast("Mensaje encestado en el bote")}

// Códigos QR (Texto, URL y TransferNow manual)
const QR_STORE="tablerogo.qr.v1",QR_DAY=86400000;
let qrType="",currentQr=null;
const qrKey=()=>`${QR_STORE}.${state.user?.id||"local"}`;
function qrItems(){try{return JSON.parse(localStorage.getItem(qrKey()))||[]}catch{return[]}}
function putQr(list){localStorage.setItem(qrKey(),JSON.stringify(list))}
function cleanQr(){const now=Date.now(),list=qrItems(),valid=list.filter(x=>x.keep||now-x.createdAt<QR_DAY);if(valid.length!==list.length)putQr(valid);return valid}
function showQrTab(tab){const saved=tab==="saved";$("#qrCreatePanel").classList.toggle("hidden",saved);$("#qrSavedPanel").classList.toggle("hidden",!saved);$("#qrCreateTab").classList.toggle("active",!saved);$("#qrSavedTab").classList.toggle("active",saved);if(saved)renderSavedQr()}
function resetQrChooser(){qrType="";currentQr=null;$("#qrValue").value="";$("#qrError").textContent="";$("#qrForm").classList.add("hidden");$("#qrPreview").classList.add("hidden");$("#qrTypeChooser").classList.remove("hidden")}
$("#qrCreateTab").onclick=()=>showQrTab("create");$("#qrSavedTab").onclick=()=>showQrTab("saved");
$$('[data-qr-type]').forEach(button=>button.onclick=()=>{qrType=button.dataset.qrType;$("#qrTypeChooser").classList.add("hidden");$("#qrForm").classList.remove("hidden");$("#qrPreview").classList.add("hidden");$("#qrInputLabel").textContent=qrType==="url"?"Enlace o URL":"Texto";$("#qrValue").placeholder=qrType==="url"?"https://ejemplo.com":"Escribe el contenido del QR"});
$("#qrChangeType").onclick=()=>{$("#qrForm").classList.add("hidden");$("#qrPreview").classList.add("hidden");$("#qrTypeChooser").classList.remove("hidden");$("#qrValue").value=""};
function qrValue(){let value=$("#qrValue").value.trim();if(!value)throw Error("Escribe un contenido.");if(qrType==="url"){if(!/^https?:\/\//i.test(value))value="https://"+value;const url=new URL(value);if(!url.hostname.includes("."))throw Error("Escribe una URL válida.");return url.href}return value}
async function qrData(value){return QRCode.toDataURL(value,{width:900,margin:3,errorCorrectionLevel:"H",color:{dark:"#263e34",light:"#ffffff"}})}
function showQrPreview(qr){currentQr=qr;const image=new Image;image.onload=()=>{const canvas=$("#qrCanvas");canvas.width=canvas.height=900;canvas.getContext("2d").drawImage(image,0,0)};image.src=qr.data;$("#qrPreviewText").textContent=qr.value;$("#qrPreview").classList.remove("hidden")}
$("#qrForm").onsubmit=async e=>{e.preventDefault();try{const value=qrValue(),data=await qrData(value);showQrPreview({id:uid(),type:qrType,value,data,createdAt:Date.now(),keep:false});$("#qrError").textContent=""}catch(error){$("#qrError").textContent="URL o contenido no válido"}};
$("#qrSave").onclick=()=>{if(!currentQr)return;const list=cleanQr();if(!list.some(x=>x.id===currentQr.id)){list.unshift(currentQr);putQr(list);toast("QR guardado durante 24 horas")}else toast("Este QR ya está guardado")};
function qrFilename(q,ext){return `TableroGO_QR_${q.type}_${new Date(q.createdAt).toISOString().slice(0,10)}.${ext}`}
function downloadFile(value,name){const link=document.createElement("a");link.href=value;link.download=name;link.click()}
function downloadJpg(q){const image=new Image;image.onload=()=>{const canvas=document.createElement("canvas");canvas.width=canvas.height=1200;const ctx=canvas.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,1200,1200);ctx.drawImage(image,100,100,1000,1000);downloadFile(canvas.toDataURL("image/jpeg",.96),qrFilename(q,"jpg"))};image.src=q.data}
function downloadPdf(q){const {jsPDF}=window.jspdf,doc=new jsPDF({unit:"mm",format:"a4"});doc.setTextColor(38,62,52);doc.setFontSize(22);doc.text("TableroGO",105,24,{align:"center"});doc.addImage(q.data,"PNG",45,42,120,120);if(q.type==="url"){doc.link(45,42,120,120,{url:q.value});doc.setFontSize(10);doc.textWithLink(q.value.slice(0,85),105,177,{url:q.value,align:"center"})}else{doc.setFontSize(10);doc.text(doc.splitTextToSize(q.value,170).slice(0,8),20,175)}doc.save(qrFilename(q,"pdf"))}
$("#qrJpg").onclick=()=>currentQr&&downloadJpg(currentQr);$("#qrPdf").onclick=()=>currentQr&&downloadPdf(currentQr);
function qrRemaining(q){const ms=Math.max(0,QR_DAY-(Date.now()-q.createdAt));return `${Math.floor(ms/3600000)} h ${Math.floor(ms%3600000/60000)} min`}
function openQr(q){$("#qrViewerImg").src=q.data;$("#qrViewerText").textContent=q.value;$("#qrViewer").showModal()}
function renderSavedQr(){const list=cleanQr(),box=$("#qrSavedList");box.innerHTML=list.map(q=>`<article class="saved-qr"><img data-open-qr="${q.id}" src="${q.data}" alt="Código QR"><p>${escapeHtml(q.value)}</p><small>${q.keep?"Conservado":"Se elimina en "+qrRemaining(q)}</small><label><input type="checkbox" data-keep-qr="${q.id}" ${q.keep?"checked":""}> Conservar</label><div class="form-row"><button data-jpg-qr="${q.id}">JPEG</button><button data-pdf-qr="${q.id}">PDF</button><button data-delete-qr="${q.id}">Eliminar</button></div></article>`).join("")||"<p>No hay códigos QR guardados.</p>";
  $$('[data-open-qr]').forEach(x=>x.onclick=()=>openQr(qrItems().find(q=>q.id===x.dataset.openQr)));$$('[data-keep-qr]').forEach(x=>x.onchange=()=>{const list=qrItems(),q=list.find(v=>v.id===x.dataset.keepQr);q.keep=x.checked;if(!q.keep)q.createdAt=Date.now();putQr(list);renderSavedQr()});$$('[data-jpg-qr]').forEach(x=>x.onclick=()=>downloadJpg(qrItems().find(q=>q.id===x.dataset.jpgQr)));$$('[data-pdf-qr]').forEach(x=>x.onclick=()=>downloadPdf(qrItems().find(q=>q.id===x.dataset.pdfQr)));$$('[data-delete-qr]').forEach(x=>x.onclick=()=>{putQr(qrItems().filter(q=>q.id!==x.dataset.deleteQr));renderSavedQr()})
}

cleanQr();
window.startTablero();
