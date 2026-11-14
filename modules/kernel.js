'use strict';
/* =====================================================================
   Consultorio · núcleo de módulos
   Se carga después de index.html y lo extiende sin modificarlo:
   - registro de módulos que se prenden y apagan
   - perfiles por profesión
   - bóveda cifrada (IndexedDB) para datos pesados o clínicos
   - páginas, hojas y eventos propios (acciones "x:...")
   - copia de seguridad completa y marcas de tiempo para sincronizar
   ===================================================================== */
const CX={v:'2.0.0',mods:{},order:[],ui:null,vkey:null,snap:null,stash:{},idx:{},listeners:{},dirty:false};
const xFresh=()=>({stack:[],modal:null,gate:null});
CX.ui=xFresh();

/* ---------- perfiles por profesión ---------- */
CX.PROFS={
  psico:{n:'Psicología',term:'sesión',dur:50,secs:['Evolución','Plan'],
    srv:[['Sesión individual',50],['Entrevista de admisión',50],['Sesión de pareja o familia',60]],
    phr:['Concurre puntual.','Refiere ','Se trabaja sobre ','Se observa ','Continúa con el encuadre acordado.','Se acuerda continuar con frecuencia semanal.','Sin cambios respecto de la sesión anterior.','Se indica tarea: ','Próxima sesión: ']},
  psiq:{n:'Psiquiatría',term:'consulta',dur:30,secs:['Motivo y evolución','Examen psíquico','Diagnóstico','Indicaciones'],
    srv:[['Consulta',30],['Primera consulta',50],['Control',20]],
    phr:['Concurre a control.','Refiere ','Sin efectos adversos referidos.','Lúcido/a, orientado/a globalmente.','Se mantiene el esquema actual.','Se ajusta: ','Se solicita ','Próximo control en ']},
  med:{n:'Medicina',term:'consulta',dur:20,secs:['Motivo de consulta','Examen físico','Diagnóstico','Indicaciones'],
    srv:[['Consulta',20],['Primera consulta',30],['Control',15],['Práctica',30]],
    phr:['Concurre a control.','Refiere ','Afebril, buen estado general.','Signos vitales: TA  FC  T° ','Sin particularidades.','Se solicita ','Se indica ','Pautas de alarma.','Control en ']},
  fono:{n:'Fonoaudiología',term:'sesión',dur:40,secs:['Objetivo trabajado','Actividades','Desempeño','Tarea para casa'],
    srv:[['Sesión',40],['Evaluación',60],['Entrevista con la familia',40]],
    phr:['Concurre acompañado/a por ','Buena predisposición.','Se trabaja ','Logra con ayuda ','Logra de forma independiente ','Requiere apoyo en ','Se envía tarea: ','Se sugiere a la familia ']},
  kine:{n:'Kinesiología',term:'sesión',dur:45,secs:['Evaluación','Tratamiento realizado','Evolución','Indicaciones'],
    srv:[['Sesión',45],['Evaluación inicial',60],['Sesión domiciliaria',60]],
    phr:['Refiere dolor /10.','Mejora la movilidad.','Se realiza ','Tolera bien la sesión.','Sin dolor al finalizar.','Se indican ejercicios para casa: ','Continúa plan.']},
  nutri:{n:'Nutrición',term:'consulta',dur:30,secs:['Motivo y evolución','Mediciones','Plan alimentario','Indicaciones'],
    srv:[['Consulta',30],['Primera consulta',60],['Control',20]],
    phr:['Concurre a control.','Peso:  kg · Talla:  cm','Refiere buena adherencia.','Refiere dificultades con ','Se ajusta el plan: ','Se entregan pautas sobre ','Control en ']},
  to:{n:'Terapia ocupacional',term:'sesión',dur:45,secs:['Objetivo trabajado','Actividades','Desempeño','Indicaciones'],
    srv:[['Sesión',45],['Evaluación',60],['Entrevista con la familia',45]],
    phr:['Concurre acompañado/a por ','Buena predisposición.','Se trabaja ','Logra con asistencia ','Logra de forma independiente ','Se sugiere en casa ','Se continúa con el plan.']},
  psp:{n:'Psicopedagogía',term:'sesión',dur:45,secs:['Objetivo trabajado','Actividades','Desempeño','Orientaciones'],
    srv:[['Sesión',45],['Evaluación diagnóstica',60],['Entrevista con la familia o la escuela',45]],
    phr:['Concurre acompañado/a por ','Buena predisposición.','Se trabaja ','Resuelve con ayuda ','Resuelve de forma autónoma ','Se observan dificultades en ','Se sugiere a la familia ','Se sugiere a la escuela ']},
  otro:{n:'Otra profesión de la salud',term:'sesión',dur:45,secs:['Evolución','Indicaciones'],
    srv:[['Sesión',45],['Primera entrevista',60]],
    phr:['Concurre puntual.','Refiere ','Se trabaja ','Se indica ','Continúa plan.','Próximo turno: ']}
};
CX.prof=()=>CX.PROFS[S&&S.x&&S.x.prof]||CX.PROFS.otro;
CX.term=(pl)=>{const t=CX.prof().term;return pl?(t==='consulta'?'consultas':'sesiones'):t};

/* ---------- registro de módulos ---------- */
CX.def=function(id,m){m.id=id;CX.mods[id]=m;CX.order.push(id)};
CX.on=id=>{const m=CX.mods[id];if(!m)return false;if(m.core)return true;const v=S&&S.x&&S.x.mods?S.x.mods[id]:undefined;return v===undefined?m.defaultOn!==false:!!v};
CX.active=()=>CX.order.map(i=>CX.mods[i]).filter(m=>CX.on(m.id));
CX.cfg=id=>{const c=S.x.cfg;return c[id]=c[id]||{}};
CX.listen=(ev,fn)=>{(CX.listeners[ev]=CX.listeners[ev]||[]).push(fn)};
CX.emit=async(ev,...a)=>{for(const f of CX.listeners[ev]||[]){try{await f(...a)}catch(e){console.error('[cx]',ev,e)}}};

/* ---------- cifrado con compresión ----------
   Se comprime antes de cifrar para que el almacenamiento rinda varias veces más.
   Los datos viejos (sin "z") se siguen leyendo igual. */
const _encObj=encryptObj,_decObj=decryptObj;
const cxGz=async(u8,comp)=>new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(comp?new CompressionStream('gzip'):new DecompressionStream('gzip'))).arrayBuffer());
encryptObj=async function(key,obj){
  if(typeof CompressionStream==='undefined')return _encObj(key,obj);
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const pt=await cxGz(enc.encode(JSON.stringify(obj)),true);
  const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,pt));
  return {iv:b64(iv),ct:b64(ct),z:1};
};
decryptObj=async function(key,o){
  if(!o.z)return _decObj(key,o);
  const pt=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(o.iv)},key,unb64(o.ct)));
  return JSON.parse(dec.decode(await cxGz(pt,false)));
};

/* ---------- bóveda: registros cifrados uno por uno en IndexedDB ---------- */
CX.vault={
  db:null,ok:false,
  open(){return new Promise((res)=>{
    if(typeof indexedDB==='undefined'){res(false);return}
    try{
      const r=indexedDB.open('consultorio_vault',1);
      r.onupgradeneeded=()=>{const s=r.result.createObjectStore('rec',{keyPath:'id'});s.createIndex('kp','kp')};
      r.onsuccess=()=>{this.db=r.result;this.ok=true;res(true)};
      r.onerror=()=>res(false);r.onblocked=()=>res(false);
    }catch(_){res(false)}
  })},
  st(mode){return this.db.transaction('rec',mode).objectStore('rec')},
  rq(r){return new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})},
  async unseal(r){return {...await decryptObj(CX.vkey,r),_id:r.id,_t:r.t,_kind:r.kind,_pid:r.pid}},
  async put(kind,pid,obj,id){
    const o={...obj};delete o._id;delete o._t;delete o._kind;delete o._pid;
    const rec={id:id||uid(),kind,pid:pid||'',kp:kind+'|'+(pid||''),t:Date.now(),dirty:1,...await encryptObj(CX.vkey,o)};
    await this.rq(this.st('readwrite').put(rec));CX.reindex(rec);CX.touch();return rec.id;
  },
  async get(id){const r=await this.rq(this.st('readonly').get(id));return r&&!r.del?this.unseal(r):null},
  async list(kind,pid){
    const rs=await this.rq(this.st('readonly').index('kp').getAll(kind+'|'+(pid||'')));
    return Promise.all(rs.filter(r=>!r.del).map(r=>this.unseal(r)));
  },
  async del(id){
    const r=await this.rq(this.st('readonly').get(id));if(!r)return;
    await this.rq(this.st('readwrite').put({id:r.id,kind:r.kind,pid:r.pid,kp:r.kp,t:Date.now(),del:1,dirty:1}));
    await CX.loadIndex();CX.touch();
  },
  raw(){return this.rq(this.st('readonly').getAll())},
  putRaw(rec){return this.rq(this.st('readwrite').put(rec))},
  async replace(recs){
    const s=this.st('readwrite');await this.rq(s.clear());
    for(const r of recs||[])await this.rq(this.st('readwrite').put(r));
    await CX.loadIndex();
  }
};
/* índice en memoria (solo metadatos sin cifrar): cuántos registros de cada tipo tiene cada paciente */
CX.reindex=r=>{if(r.del)return;const k=r.pid||'_';const e=CX.idx[k]=CX.idx[k]||{};const c=e[r.kind]=e[r.kind]||{ids:new Set(),last:0};c.ids.add(r.id);if(r.t>c.last)c.last=r.t};
CX.loadIndex=async()=>{CX.idx={};if(!CX.vault.ok)return;for(const r of await CX.vault.raw())CX.reindex(r)};
CX.count=(pid,kind)=>{const e=CX.idx[pid||'_'];return e&&e[kind]?e[kind].ids.size:0};

/* ---------- estado extendido ---------- */
CX.ensure=function(){
  const x=S.x=S.x||{};
  x.v=1;x.mods=x.mods||{};x.cfg=x.cfg||{};x.inv=x.inv||[];x.exp=x.exp||[];x.srv=x.srv||[];
  x.px=x.px||{};x.finx=x.finx||{};x.tomb=x.tomb||{};x.log=x.log||[];
  x.don=x.don||{first:today(),last:today()};
  let fresh=false;
  if(!x.vk){x.vk=b64(crypto.getRandomValues(new Uint8Array(32)));fresh=true}
  return fresh;
};
CX.log=(a,extra)=>{if(!S||!S.x)return;S.x.log.push({t:Date.now(),a,...(extra||{})});if(S.x.log.length>600)S.x.log.splice(0,S.x.log.length-600)};

/* marcas de tiempo por registro: permiten unir cambios hechos en dos dispositivos */
CX.cols=()=>[['patients',S.patients],['sessions',S.sessions],['payments',S.payments],['fin',S.fin],['inv',S.x.inv],['exp',S.x.exp],['srv',S.x.srv]];
const cxJson=o=>{const t=o._t;delete o._t;const j=JSON.stringify(o);if(t!==undefined)o._t=t;return j};
CX.restJson=()=>{const x=S.x,keep={};for(const k in x)if(!['inv','exp','srv','tomb','log','rt'].includes(k))keep[k]=x[k];return JSON.stringify([S.settings,keep])};
CX.snapshot=function(){
  const snap={cols:{},rest:CX.restJson()};
  for(const [k,arr] of CX.cols()){const m=snap.cols[k]=new Map();for(const o of arr)m.set(o.id,cxJson(o))}
  CX.snap=snap;
};
CX.stamp=function(){
  if(!S||!S.x)return false;
  if(!CX.snap){CX.snapshot();return false}
  const now=Date.now();let ch=false;
  for(const [k,arr] of CX.cols()){
    const old=CX.snap.cols[k]||new Map(),seen=new Set(),nu=new Map();
    for(const o of arr){
      seen.add(o.id);const j=cxJson(o),was=old.get(o.id);
      if(was===undefined){ch=true;if(k==='sessions'&&CX.stash.ses){Object.assign(o,CX.stash.ses)}o._t=now;nu.set(o.id,cxJson(o))}
      else if(was!==j){ch=true;o._t=now;nu.set(o.id,j)}
      else nu.set(o.id,j);
    }
    for(const id of old.keys())if(!seen.has(id)){S.x.tomb[id]=now;ch=true}
    CX.snap.cols[k]=nu;
  }
  CX.stash.ses=null;
  const rest=CX.restJson();
  if(rest!==CX.snap.rest){CX.snap.rest=rest;S.x.rt=now;ch=true}
  if(ch)CX.touch();
  return ch;
};
CX.touch=()=>{CX.dirty=true;try{localStorage.setItem('cx_dirty','1')}catch(_){}};

/* ---------- envoltorios del núcleo ---------- */
const _unlock=unlock,_save=save,_lock=lock,_render=render,_lockView=lockView;
unlock=async function(pass){
  const ok=await _unlock(pass);
  if(ok)await CX.boot();
  return ok;
};
save=async function(){
  if(S&&S.x)CX.stamp();
  await _save();
  if(S&&S.x)CX.emit('save');
};
lock=function(){CX.ui=xFresh();CX.vkey=null;CX.snap=null;CX.idx={};CX.emit('lock');_lock()};

CX.boot=async function(){
  const fresh=CX.ensure();
  CX.vkey=await crypto.subtle.importKey('raw',unb64(S.x.vk),'AES-GCM',false,['encrypt','decrypt']);
  await CX.vault.open();
  if(fresh&&CX.vault.ok&&!localStorage.getItem('cx_keepvault'))await CX.vault.replace([]);
  localStorage.removeItem('cx_keepvault');
  await CX.loadIndex();
  CX.dirty=!!localStorage.getItem('cx_dirty');
  CX.snapshot();
  for(const m of CX.order.map(i=>CX.mods[i]))if(m.boot){try{await m.boot()}catch(e){console.error('[cx] boot',m.id,e)}}
  CX.log('entrar');
  if(!S.x.prof)CX.ui.gate='inicio';
  await _save();
  CX.emit('unlock');
};

/* ---------- navegación propia ---------- */
CX.page=()=>CX.ui.stack[CX.ui.stack.length-1]||null;
CX.findPage=id=>{const [m,p]=id.split(':');const mod=CX.mods[m];return mod&&mod.pages&&mod.pages[p]};
CX.go=async function(id,args,replace){
  const def=CX.findPage(id);if(!def)return;
  const pg={id,args:args||{},data:null};
  if(def.load)pg.data=await def.load(pg.args);
  if(replace)CX.ui.stack.pop();
  CX.ui.stack.push(pg);CX.ui.modal=null;ui.modal=null;render();scrollTo(0,0);
};
CX.back=function(){CX.ui.stack.pop();CX.ui.modal=null;CX.refresh()};
CX.refresh=async function(){
  const pg=CX.page();
  if(pg){const def=CX.findPage(pg.id);if(def&&def.load)pg.data=await def.load(pg.args)}
  render();
};
CX.sheet=function(t,args){CX.ui.modal={t,...(args||{})};ui.modal=null;render()};
CX.close=function(){CX.ui.modal=null;render()};
CX.nav=()=>`<nav>${[['hoy','Hoy'],['pac','Pacientes'],['plata','Plata']].map(([k,l])=>`<button class="${ui.tab===k?'on':''}" data-act="tab" data-t="${k}">${l}</button>`).join('')}</nav>`;
CX.modalHtml=function(){
  const m=CX.ui.modal;if(!m)return '';
  const [mod,name]=m.t.split(':');const def=CX.mods[mod]&&CX.mods[mod].sheets&&CX.mods[mod].sheets[name];
  if(!def)return '';
  return `<div class="modal" data-act="x:bg"><div class="sheet">${def(m)}</div></div>`;
};
CX.head=(title,right)=>`<div class="top"><button class="lnk" data-act="x:back">‹ Volver</button>${right||''}</div><h1 class="sm" style="margin-top:12px">${title}</h1>`;
CX.btns=(ok,extra)=>`<div class="btns"><button>${ok||'Guardar'}</button><button type="button" class="sec" data-act="x:close">Cancelar</button></div>${extra||''}`;

/* reemplazo de vocabulario: "sesión" pasa a "consulta" en las profesiones que lo usan así */
CX.vocab=function(root){
  if(!S||!S.x||CX.prof().term!=='consulta')return;
  const map={'sesiones':'consultas','Sesiones':'Consultas','sesión':'consulta','Sesión':'Consulta'};
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;
  while((n=w.nextNode())){
    const p=n.parentElement;if(!p||p.closest('textarea,input,select,.keep,script,style'))continue;
    if(/sesi[oó]n/i.test(n.nodeValue))n.nodeValue=n.nodeValue.replace(/sesiones|Sesiones|sesión|Sesión/g,m=>map[m]);
  }
};

render=function(){
  const app=document.getElementById('app');
  const live=!ui.locked&&S&&S.x;
  if(live&&CX.ui.gate){const g=CX.gates[CX.ui.gate];if(g){app.innerHTML=g();return}CX.ui.gate=null}
  const pg=live?CX.page():null;
  if(pg){
    const def=CX.findPage(pg.id);
    if(CX.ui.modal||ui.modal)hideToast();
    app.innerHTML=def.view(pg.args,pg.data)+CX.nav()+(ui.modal?modalView():'')+CX.modalHtml();
    CX.vocab(app);return;
  }
  _render();
  if(live){
    for(const m of CX.active())if(m.inject){try{m.inject(app)}catch(e){console.error('[cx] inject',m.id,e)}}
    if(CX.ui.modal)app.insertAdjacentHTML('beforeend',CX.modalHtml());
    CX.vocab(app);
  }else if(ui.locked){
    for(const m of CX.order.map(i=>CX.mods[i]))if(m.injectLock){try{m.injectLock(app)}catch(e){console.error(e)}}
    if(CX.ui.modal)app.insertAdjacentHTML('beforeend',CX.modalHtml());
  }
};
CX.gates={};

/* ---------- eventos ---------- */
CX.intercept={
  tab(){CX.ui.stack=[];CX.ui.modal=null;return false},
  aj(){CX.go('panel:home');return true},
  export(){CX.backup();return true}
};
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-act]');if(!t)return;
  const a=t.dataset.act;
  if(a.startsWith('x:')){
    e.stopPropagation();
    const name=a.slice(2);
    if(name==='bg'){if(e.target===t)CX.close();return}
    if(t.tagName==='BUTTON'||!t.getAttribute('href'))e.preventDefault();
    CX.act(name,t.dataset,t,e);return;
  }
  const h=CX.intercept[a];
  if(h&&S&&S.x&&h(t.dataset,t,e)){e.stopPropagation();e.preventDefault()}
},true);
CX.act=async function(name,d,t,e){
  try{
    if(name==='back')return CX.back();
    if(name==='close')return CX.close();
    if(name==='go')return CX.go(d.p,d.id?{id:d.id}:{});
    if(name==='sheet')return CX.sheet(d.s,{...d});
    const i=name.indexOf(':'),mod=CX.mods[name.slice(0,i)],fn=mod&&mod.acts&&mod.acts[name.slice(i+1)];
    if(fn)await fn(d,t,e);
  }catch(err){console.error('[cx] act',name,err);toast('Algo falló. Probá de nuevo.')}
};
document.addEventListener('submit',e=>{
  const f=e.target,k=f.dataset&&f.dataset.form;if(!k)return;
  if(k.startsWith('x:')){
    e.preventDefault();e.stopPropagation();
    const name=k.slice(2),i=name.indexOf(':'),mod=CX.mods[name.slice(0,i)],fn=mod&&mod.forms&&mod.forms[name.slice(i+1)];
    if(fn)Promise.resolve(fn(Object.fromEntries(new FormData(f)),f)).catch(err=>{console.error('[cx] form',name,err);toast('No se pudo guardar. Probá de nuevo.')});
    return;
  }
  if(!S||!S.x)return;
  for(const m of CX.active()){
    const h=m.coreForms&&m.coreForms[k];
    if(h&&h(Object.fromEntries(new FormData(f)),f)===false){e.preventDefault();e.stopPropagation();return}
  }
},true);
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.id==='imp'){e.stopPropagation();if(t.files[0])CX.restore(t.files[0]);return}
  const c=t.dataset&&t.dataset.xchg;if(!c)return;
  e.stopPropagation();
  const i=c.indexOf(':'),mod=CX.mods[c.slice(0,i)],fn=mod&&mod.chg&&mod.chg[c.slice(i+1)];
  if(fn)Promise.resolve(fn(t)).catch(err=>console.error('[cx] chg',c,err));
},true);
document.addEventListener('input',e=>{
  const t=e.target,c=t.dataset&&t.dataset.xinp;if(!c)return;
  const i=c.indexOf(':'),mod=CX.mods[c.slice(0,i)],fn=mod&&mod.inp&&mod.inp[c.slice(i+1)];
  if(fn)fn(t);
},true);

/* ---------- utilidades compartidas ---------- */
CX.fdate=s=>s?s.split('-').reverse().join('/'):'';
CX.copy=async function(txt,msg){try{await navigator.clipboard.writeText(txt);toast(msg||'Copiado')}catch(_){prompt('Copiá el texto:',txt)}};
CX.csv=function(name,head,rows){
  const q=c=>'"'+String(c??'').replace(/"/g,'""')+'"';
  download(name,'﻿'+[head,...rows].map(r=>r.map(q).join(';')).join('\r\n'),'text/csv;charset=utf-8');
};
CX.profLine=function(){
  const st=S.settings;
  return [st.name?esc(st.name):'',st.matricula?'Matrícula '+esc(st.matricula):'',st.cuit?'CUIT '+esc(st.cuit):''].filter(Boolean).join(' · ');
};
CX.print=function(title,body,note){
  const html=`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<style>@page{size:A4;margin:16mm}body{font:13px/1.5 Arial,Helvetica,sans-serif;color:#000;margin:18px;max-width:800px}h1{font-size:18px;margin:0 0 4px}h2{font-size:14px;margin:18px 0 4px;border-bottom:1px solid #999;padding-bottom:2px}
.meta{font-size:12px;color:#222;margin:2px 0}.box{border:1px solid #999;border-radius:4px;padding:8px 10px;margin:8px 0;page-break-inside:avoid}.small{font-size:10.5px;color:#444}
table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border:1px solid #555;padding:6px;font-size:12px;text-align:left;vertical-align:top}th{background:#eee}td.r,th.r{text-align:right}
.sig{margin-top:60px;display:flex;justify-content:space-between;gap:40px}.sig div{flex:1;border-top:1px solid #000;padding-top:4px;text-align:center;font-size:12px}
.pre{white-space:pre-wrap}.pb{page-break-after:always}.bar{margin-bottom:14px;padding:10px;background:#f1f1f1;border-radius:8px}.bar button{font-size:15px;padding:8px 14px}
@media print{.bar{display:none}body{margin:0}}</style></head><body>
<div class="bar"><button onclick="print()">Imprimir / Guardar como PDF</button> <span class="small">${esc(note||'Revisá los datos antes de entregarlo.')}</span></div>
${body}</body></html>`;
  const w=window.open('','_blank');
  if(w){w.document.open();w.document.write(html);w.document.close()}
  else download(norm(title).replace(/\W+/g,'-')+'.html',html,'text/html;charset=utf-8');
  return html;
};
CX.shareFile=async function(name,text,type){
  try{
    const f=new File([text],name,{type});
    if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:name});return true}
  }catch(e){if(e&&e.name==='AbortError')return false}
  download(name,text,type);return true;
};
CX.item=(act,data,title,sub,right)=>`<div class="item" data-act="${act}"${Object.entries(data||{}).map(([k,v])=>` data-${k}="${esc(v)}"`).join('')}><div class="grow"><div>${title}</div>${sub?`<div class="sub">${sub}</div>`:''}</div>${right===undefined?'<span class="mut">›</span>':right}</div>`;

/* ---------- copia de seguridad completa (núcleo + bóveda) ---------- */
CX.backupBlob=async function(){
  const core=JSON.parse(localStorage.getItem(LS));
  const vault=CX.vault.ok?(await CX.vault.raw()).map(r=>{const o={...r};delete o.dirty;return o}):[];
  return JSON.stringify({app:'consultorio',v:2,date:today(),core,vault});
};
CX.backup=async function(share){
  S.settings.lastBackup=today();CX.log('copia');await save();
  const txt=await CX.backupBlob(),name=`consultorio-backup-${today()}.json`;
  if(share)await CX.shareFile(name,txt,'application/json');else download(name,txt,'application/json');
  render();
};
CX.restore=async function(file){
  try{
    const o=JSON.parse(await file.text());
    const core=o.v===2?o.core:o;
    if(!core||!core.salt||!core.iv||!core.ct)throw 0;
    if(o.v===2&&!Array.isArray(o.vault))throw 0;
    if(!confirm('Esto reemplaza todos los datos actuales por los de la copia. Después vas a entrar con la clave que tenía esa copia. ¿Seguir?'))return;
    localStorage.setItem(LS,JSON.stringify(core));
    if(await CX.vault.open()||CX.vault.ok)await CX.vault.replace(o.v===2?o.vault.map(r=>({...r,dirty:1})):[]);
    localStorage.setItem('cx_keepvault','1');CX.touch();
    lock();
  }catch(_){alert('El archivo no es una copia válida.')}
};

/* ---------- estilos propios ---------- */
(function(){
  const st=document.createElement('style');
  st.textContent=`
.xrow{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 2px}
.xrow .pill{border:0;cursor:pointer;font:inherit;font-size:.88rem;font-weight:550}
.pill.ghost{background:none;box-shadow:inset 0 0 0 1.5px var(--line);color:var(--ink)}
.pill.done{background:none;box-shadow:inset 0 0 0 1.5px var(--pri)}
.note{padding:14px 0;border-bottom:1px solid var(--line)}
.note:last-child{border-bottom:0}
.note .nh{display:flex;justify-content:space-between;gap:10px;align-items:baseline}
.note .nb{white-space:pre-wrap;margin-top:6px;overflow-wrap:anywhere}
.note .nb b{font-weight:600;font-size:.8rem;color:var(--mut);text-transform:uppercase;letter-spacing:.05em;display:block;margin-top:8px}
.note .nb b:first-child{margin-top:0}
textarea.auto{min-height:76px;resize:vertical}
.phr{display:flex;gap:6px;overflow-x:auto;padding:6px 0 8px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.phr::-webkit-scrollbar{display:none}
.phr .pill{white-space:nowrap;flex:none;border:0;cursor:pointer;font:inherit;font-size:.85rem}
.bars{display:flex;align-items:flex-end;gap:6px;height:120px;margin:14px 0 4px}
.bars div{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:4px;height:100%}
.bars i{display:block;width:100%;background:var(--pri);border-radius:6px 6px 0 0;min-height:2px}
.bars i.cur{opacity:.55}
.bars span{font-size:.68rem;color:var(--mut)}
.hbar{height:8px;border-radius:8px;background:var(--pri2);overflow:hidden;margin-top:6px}
.hbar i{display:block;height:100%;background:var(--pri)}
.hbar.warn i{background:var(--warn)}.hbar.bad i{background:var(--bad)}
.kv{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid var(--line);align-items:center}
.kv:last-child{border-bottom:0}
.kv span{color:var(--mut);font-size:.88rem;flex:none}
.kv b{font-weight:550;text-align:right;overflow-wrap:anywhere}
.kv button{flex:none}
.sw{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 0;border-bottom:1px solid var(--line)}
.sw:last-child{border-bottom:0}
.sw input{width:22px;height:22px;flex:none;accent-color:var(--pri)}
.legal h2{font-size:1.05rem;margin:22px 0 6px}.legal p,.legal li{font-size:.95rem;line-height:1.55}.legal ul{padding-left:20px}
.gate{max-width:480px;margin:6vh auto 0}
.gate .pills .pill{border:0;cursor:pointer;font:inherit;padding:10px 16px;font-size:.98rem}
.lockx{max-width:340px;margin:18px auto 0;text-align:center}
.lockx label{display:flex;gap:8px;align-items:flex-start;text-align:left;font-size:.85rem;margin:10px 0}
.lockx label input{width:auto;margin-top:3px}
.lockx a,.legal a,.gate a{color:var(--pri)}
.dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--pri);margin-right:6px}
.dot.off{background:var(--line)}.dot.warn{background:var(--warn)}.dot.bad{background:var(--bad)}
`;
  document.head.appendChild(st);
})();

/* cuando terminaron de cargar todos los módulos, se vuelve a dibujar */
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>render());else setTimeout(()=>render(),0);
