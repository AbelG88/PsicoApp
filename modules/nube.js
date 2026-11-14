'use strict';
/* Modo online: cuenta (Google, Facebook o email) y sincronización entre dispositivos.
   Los datos se cifran en el dispositivo antes de subir: en la base de datos solo hay
   bloques cifrados, uno por registro. Ni el servidor ni el desarrollador pueden leerlos.
   Los cambios hechos en dos dispositivos se unen registro por registro (gana el más nuevo). */
const NUBE={
  URL:'https://infjyoqfrhhbudxojsts.supabase.co',
  KEY:'sb_publishable_rb2Q_Pvdjc5YmveKBBMixQ_CcQX565k',
  sb:null,user:null,state:'off',msg:'',busy:false,again:false,timer:null,provs:null,gen:0,
  meta(){try{return JSON.parse(localStorage.getItem('cx_nube'))||{}}catch(_){return {}}},
  setMeta(p){const m={...NUBE.meta(),...p};localStorage.setItem('cx_nube',JSON.stringify(m));return m},
  redirect:()=>location.origin+location.pathname,
  loadLib(){return new Promise((res,rej)=>{
    if(window.supabase)return res();
    const s=document.createElement('script');s.src='vendor/supabase.js';s.onload=()=>res();s.onerror=()=>rej(new Error('lib'));document.head.appendChild(s);
  })},
  async client(){
    if(NUBE.sb)return NUBE.sb;
    if(window.__cxCloud){NUBE.sb=window.__cxCloud;return NUBE.sb}
    await NUBE.loadLib();
    NUBE.sb=window.supabase.createClient(NUBE.URL,NUBE.KEY,{auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true,storageKey:'cx_auth'}});
    return NUBE.sb;
  },
  async session(){
    try{const sb=await NUBE.client();const {data}=await sb.auth.getSession();NUBE.user=data&&data.session?data.session.user:null}catch(_){NUBE.user=null}
    return NUBE.user;
  },
  async providers(){
    if(NUBE.provs)return NUBE.provs;
    try{const r=await fetch(NUBE.URL+'/auth/v1/settings',{headers:{apikey:NUBE.KEY}});const j=await r.json();NUBE.provs={google:!!j.external.google,facebook:!!j.external.facebook,email:!!j.external.email}}
    catch(_){NUBE.provs={google:false,facebook:false,email:true,offline:true}}
    return NUBE.provs;
  },
  /* ---- acceso a la tabla ---- */
  async getCore(){const sb=await NUBE.client();const {data,error}=await sb.from('records').select('id,rev,body,updated_at').eq('id','core').maybeSingle();if(error)throw error;return data},
  async rowsSince(cur){
    const sb=await NUBE.client(),out=[];let from=0;
    for(;;){
      let q=sb.from('records').select('*').order('updated_at',{ascending:true}).range(from,from+499);
      if(cur)q=q.gt('updated_at',cur);
      const {data,error}=await q;if(error)throw error;
      out.push(...data);if(data.length<500)break;from+=500;
    }
    return out;
  },
  /* ---- unión de dos copias del núcleo ---- */
  merge(L,R){
    const now=Date.now(),tomb={};
    for(const src of [R.x.tomb||{},L.x.tomb||{}])for(const k in src)if(now-src[k]<200*864e5)tomb[k]=Math.max(tomb[k]||0,src[k]);
    const pick=(a,b)=>{
      const m=new Map();
      for(const o of b||[])m.set(o.id,o);
      for(const o of a||[]){const r=m.get(o.id);if(!r||(o._t||0)>=(r._t||0))m.set(o.id,o)}
      return [...m.values()].filter(o=>!(tomb[o.id]&&tomb[o.id]>=(o._t||0)));
    };
    const base=(L.x.rt||0)>=(R.x.rt||0)?L:R;
    const out=JSON.parse(JSON.stringify(base));
    for(const k of ['patients','sessions','payments','fin'])out[k]=pick(L[k],R[k]);
    for(const k of ['inv','exp','srv'])out.x[k]=pick(L.x[k],R.x[k]);
    out.x.tomb=tomb;
    const seen=new Set();out.x.log=[...(L.x.log||[]),...(R.x.log||[])].filter(e=>{const k=e.t+e.a;if(seen.has(k))return false;seen.add(k);return true}).sort((a,b)=>a.t-b.t).slice(-600);
    out.x.vk=L.x.vk;
    return out;
  },
  set(state,msg){NUBE.state=state;NUBE.msg=msg||'';const el=document.getElementById('nubest');if(el)el.innerHTML=NUBE.statusHtml()},
  statusHtml(){
    const m=NUBE.meta(),L={ok:['','Sincronizado'],sync:['warn','Sincronizando…'],err:['bad','No se pudo sincronizar'],offline:['off','Sin conexión: se sincroniza al volver'],off:['off','Desactivado']};
    const [c,t]=L[NUBE.state]||L.off;
    return `<span class="dot ${c}"></span>${t}${NUBE.state==='ok'&&m.last?' · '+new Date(m.last).toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'}):''}${NUBE.msg?`<div class="sub">${esc(NUBE.msg)}</div>`:''}`;
  },
  queue(ms){clearTimeout(NUBE.timer);NUBE.timer=setTimeout(()=>NUBE.sync(),ms||2500)},
  /* ---- ciclo de sincronización ---- */
  async sync(){
    const m=NUBE.meta();
    if(!m.on||ui.locked||!S||!S.x||!CX.vkey)return;
    if(NUBE.busy){NUBE.again=true;return}
    if(navigator.onLine===false){NUBE.set('offline');return}
    NUBE.busy=true;NUBE.set('sync');
    try{
      if(!await NUBE.session()){NUBE.set('err','La sesión venció: volvé a entrar con tu cuenta desde Panel → Modo online.');return}
      if(m.uid&&m.uid!==NUBE.user.id){NUBE.set('err','Este dispositivo está vinculado a otra cuenta.');return}
      const sb=await NUBE.client(),gen0=NUBE.gen;
      /* 1. bajar lo nuevo */
      const cur=m.cursor?new Date(new Date(m.cursor).getTime()-5000).toISOString():null;
      const rows=await NUBE.rowsSince(cur);
      let cursor=m.cursor||'',core=null,vch=false;
      for(const r of rows){
        if(r.updated_at>cursor)cursor=r.updated_at;
        if(r.id==='core'){core=r;continue}
        if(!CX.vault.ok)continue;
        const loc=await CX.vault.rq(CX.vault.st('readonly').get(r.id));
        if(loc&&loc.dirty&&loc.t>=r.t){if(loc.rev!==r.rev){loc.rev=r.rev;await CX.vault.putRaw(loc)}continue}
        if(loc&&loc.t===r.t&&loc.rev===r.rev)continue;
        await CX.vault.putRaw({id:r.id,kind:r.kind,pid:r.pid,kp:r.kind+'|'+r.pid,t:r.t,rev:r.rev,...(r.del?{del:1}:r.body||{})});vch=true;
      }
      if(vch)await CX.loadIndex();
      /* 2. núcleo: adoptar, unir o subir */
      for(let i=0;i<4;i++){
        if(!core)core=await NUBE.getCore();
        const mm=NUBE.meta();
        if(core&&core.rev!==mm.coreRev){
          if(core.body.salt!==b64(SALT)){
            localStorage.setItem(LS,JSON.stringify(core.body));localStorage.setItem('cx_keepvault','1');NUBE.setMeta({coreRev:core.rev,cursor});
            localStorage.removeItem('cx_dirty');localStorage.setItem('cx_note','La clave se cambió en otro dispositivo. Entrá con la clave nueva.');
            NUBE.busy=false;lock();return;
          }
          const R=await decryptObj(KEY,core.body);
          const ui0=CX.ui;
          if(CX.dirty&&R.x){S=NUBE.merge(S,R)}else{S=R;CX.dirty=false}
          migrate();CX.ensure();CX.snapshot();await _save();
          NUBE.setMeta({coreRev:core.rev});CX.ui=ui0;
        }
        if(!CX.dirty&&core)break;
        const body=JSON.parse(localStorage.getItem(LS));
        if(!core){
          const {data,error}=await sb.from('records').insert({id:'core',kind:'core',rev:1,t:Date.now(),body}).select('rev,updated_at');
          if(error){if(error.code==='23505'){core=null;continue}throw error}
          NUBE.setMeta({coreRev:1});core={rev:1};break;
        }
        const {data,error}=await sb.from('records').update({rev:core.rev+1,t:Date.now(),body}).eq('id','core').eq('rev',core.rev).select('rev,updated_at');
        if(error)throw error;
        if(data&&data.length){NUBE.setMeta({coreRev:core.rev+1});break}
        core=null; /* otro dispositivo subió primero: se vuelve a bajar y unir */
      }
      /* 3. subir registros de la bóveda */
      const dirty=CX.vault.ok?(await CX.vault.raw()).filter(r=>r.dirty):[];
      for(let i=0;i<dirty.length;i+=50){
        const part=dirty.slice(i,i+50);
        const up=part.map(r=>({id:r.id,kind:r.kind,pid:r.pid||'',t:r.t,rev:(r.rev||0)+1,del:!!r.del,body:r.del?null:{iv:r.iv,ct:r.ct,...(r.z?{z:1}:{})}}));
        const {error}=await sb.from('records').upsert(up,{onConflict:'user_id,id'});if(error)throw error;
        for(const r of part){const now=await CX.vault.rq(CX.vault.st('readonly').get(r.id));if(now&&now.t===r.t){delete now.dirty;now.rev=(r.rev||0)+1;await CX.vault.putRaw(now)}}
      }
      if(NUBE.gen===gen0){CX.dirty=false;localStorage.removeItem('cx_dirty')}else NUBE.again=true;
      NUBE.setMeta({cursor,last:Date.now(),uid:NUBE.user.id,email:NUBE.user.email||''});
      NUBE.set('ok');
      if(rows.length)render();
    }catch(e){
      console.error('[nube]',e);
      NUBE.set(navigator.onLine===false||/fetch|network/i.test(String(e&&e.message))?'offline':'err',e&&e.message&&!/fetch|network/i.test(e.message)?String(e.message).slice(0,140):'');
    }finally{
      NUBE.busy=false;
      if(NUBE.again){NUBE.again=false;NUBE.queue(1500)}
    }
  },
  /* primera activación en un dispositivo que ya tiene datos */
  async activar(){
    if(!await NUBE.session())return CX.sheet('nube:login',{});
    const core=await NUBE.getCore();
    let same=false;
    if(core&&core.body.salt===b64(SALT)){try{const R=await decryptObj(KEY,core.body);same=!!(R.x&&R.x.vk===S.x.vk)}catch(_){}}
    if(core&&!same)return CX.sheet('nube:choque',{email:NUBE.user.email});
    await NUBE.encender(!core);
  },
  async encender(all){
    if(all&&CX.vault.ok)for(const r of await CX.vault.raw()){r.dirty=1;await CX.vault.putRaw(r)}
    NUBE.setMeta({on:true,uid:NUBE.user.id,email:NUBE.user.email||'',cursor:'',coreRev:all?0:NUBE.meta().coreRev||0,want:false});
    CX.touch();CX.log('nube');await _save();
    CX.ui.modal=null;render();await NUBE.sync();render();
  },
  /* trae el consultorio de la cuenta a este dispositivo (reemplaza lo local) */
  async bajar(){
    const core=await NUBE.getCore();if(!core)return false;
    localStorage.setItem(LS,JSON.stringify(core.body));
    if(await CX.vault.open()||CX.vault.ok)await CX.vault.replace([]);
    localStorage.setItem('cx_keepvault','1');localStorage.removeItem('cx_dirty');
    NUBE.setMeta({on:true,uid:NUBE.user.id,email:NUBE.user.email||'',cursor:'',coreRev:core.rev,want:false});
    return true;
  },
  loginHtml(p,m){
    return `${p.offline?'<div class="banner warn">No hay conexión. Conectate a internet para entrar con tu cuenta.</div>':''}
    ${p.google?`<button style="width:100%;margin-top:10px" data-act="x:nube:oauth" data-p="google">Continuar con Google</button>`:''}
    ${p.facebook?`<button class="sec" style="width:100%;margin-top:10px" data-act="x:nube:oauth" data-p="facebook">Continuar con Facebook</button>`:''}
    ${p.email?`<form data-form="x:nube:otp"><label>${p.google||p.facebook?'O con tu email':'Tu email'}</label><input type="email" name="email" required autocomplete="email" placeholder="vos@ejemplo.com" value="${esc(m.email||'')}">
    ${m.sent?`<div class="banner">Te mandamos un mail a <b>${esc(m.email)}</b>. Abrí el enlace en este mismo dispositivo, o escribí acá el código que figura en el mail.</div><input name="code" inputmode="numeric" autocomplete="one-time-code" placeholder="Código del mail">`:''}
    <p class="err">${esc(m.err||'')}</p><button class="sec" style="width:100%">${m.sent?'Entrar con el código':'Recibir enlace por mail'}</button></form>`:''}`;
  }
};
const _touch=CX.touch;CX.touch=function(){NUBE.gen++;_touch()};

CX.def('nube',{
  name:'Modo online',desc:'Tus datos cifrados en la nube para usar la app en varios dispositivos, con tu cuenta de Google, Facebook o email',defaultOn:true,
  panel:[{sec:'datos',title:'Modo online',p:'nube:home',sub:()=>{const m=NUBE.meta();return m.on?`<span class="dot${NUBE.state==='err'?' bad':''}"></span>Activo · ${esc(m.email||'')}`:'Usá la app en varios dispositivos'}}],
  pages:{
    home:{
      async load(){const m=NUBE.meta();let p={};if(!m.on){p=await NUBE.providers();await NUBE.session()}return {p}},
      view(a,d){
        const m=NUBE.meta();
        if(m.on)return CX.head('Modo online')+`
        <div class="sub" style="margin-top:14px">Cuenta</div><div class="med keep">${esc(m.email||'Conectada')}</div>
        <div class="box" id="nubest">${NUBE.statusHtml()}</div>
        <div class="btns"><button data-act="x:nube:ahora">Sincronizar ahora</button><button class="sec" data-act="x:nube:salir">Desconectar</button></div>
        <h3 class="sec">En otro dispositivo</h3>
        <p class="mut">Abrí la app, tocá "Ya tengo cuenta" en la pantalla inicial, entrá con la misma cuenta y después con tu clave. Los cambios se unen solos entre dispositivos.</p>
        <h3 class="sec">Cómo se protegen tus datos</h3>
        <p class="mut">Todo se cifra en este dispositivo con tu clave antes de subir. En el servidor (Supabase, San Pablo) solo hay bloques cifrados: nadie más puede leerlos. Por eso, si olvidás la clave, tampoco se pueden recuperar desde la nube.</p>
        <h3 class="sec">Zona de riesgo</h3>
        <button class="dng" data-act="x:nube:borrar">Borrar mi cuenta y mis datos de la nube</button>
        <p class="mut">Los datos de este dispositivo no se tocan.</p>`;
        return CX.head('Modo online')+`<p class="sub">Guardá una copia cifrada en la nube y usá Consultorio en el celular, la tablet y la computadora a la vez.</p>
        <div class="box"><div class="kv"><span>Cifrado</span><b>En tu dispositivo, con tu clave</b></div><div class="kv"><span>Quién puede leerlo</span><b>Solo vos</b></div><div class="kv"><span>Sin internet</span><b>Sigue funcionando</b></div></div>
        ${NUBE.user?`<div class="banner">Entraste como <b class="keep">${esc(NUBE.user.email||'tu cuenta')}</b>.<div class="row"><button class="sm" data-act="x:nube:activar">Activar en este dispositivo</button><button class="sec sm" data-act="x:nube:salir">Usar otra cuenta</button></div></div>`
        :`<h3 class="sec">Entrá con tu cuenta</h3>${NUBE.loginHtml(d.p,a)}`}
        <p class="mut">Al activar el modo online aceptás que una copia cifrada de tus datos se guarde en un servidor fuera de Argentina. Podés borrarla cuando quieras.</p>`;
      }
    }
  },
  sheets:{
    login(m){
      return `<h1 class="sm">Entrar con mi cuenta</h1><p class="sub">Para traer a este dispositivo el consultorio que ya usás en otro.</p>
      ${m.p?NUBE.loginHtml(m.p,m):'<div class="empty">Cargando…</div>'}
      <button class="lnk" data-act="x:close">Cancelar</button>`;
    },
    choque(m){
      return `<h1 class="sm">Esta cuenta ya tiene datos</h1>
      <p class="sub">La cuenta <b class="keep">${esc(m.email||'')}</b> ya tiene un consultorio guardado, distinto del de este dispositivo. Elegí cuál queda.</p>
      <div class="box"><b>Usar el de la nube</b><p class="mut" style="margin:.3em 0 .6em">Este dispositivo pasa a mostrar los datos de la cuenta. Lo que hay acá se reemplaza: antes descargá una copia.</p><div class="row wrap"><button class="sec sm" data-act="x:panel:down">Descargar copia de este dispositivo</button><button class="sm" data-act="x:nube:usarnube">Usar el de la nube</button></div></div>
      <div class="box"><b>Usar el de este dispositivo</b><p class="mut" style="margin:.3em 0 .6em">Lo que está en la nube se borra y se sube lo de acá.</p><button class="sec sm" data-act="x:nube:pisarnube">Reemplazar la nube</button></div>
      <button class="lnk" data-act="x:close">Cancelar</button>`;
    }
  },
  acts:{
    async login(){CX.sheet('nube:login',{});const p=await NUBE.providers();if(CX.ui.modal&&CX.ui.modal.t==='nube:login'){CX.ui.modal.p=p;render()}},
    async oauth(d){
      NUBE.setMeta({want:true});
      const sb=await NUBE.client();
      const {error}=await sb.auth.signInWithOAuth({provider:d.p,options:{redirectTo:NUBE.redirect()}});
      if(error)toast('No se pudo abrir el acceso con '+d.p);
    },
    activar(){return NUBE.activar()},
    ahora(){return NUBE.sync()},
    async salir(){
      if(NUBE.meta().on&&!confirm('¿Desconectar este dispositivo? Los datos quedan acá, pero dejan de sincronizarse.'))return;
      try{const sb=await NUBE.client();await sb.auth.signOut()}catch(_){}
      NUBE.user=null;localStorage.removeItem('cx_nube');NUBE.set('off');await CX.refresh();
    },
    async usarnube(){
      if(!confirm('Se van a reemplazar los datos de este dispositivo por los de la nube. Vas a entrar con la clave de esa cuenta. ¿Seguir?'))return;
      if(await NUBE.bajar()){localStorage.setItem('cx_note','Listo. Entrá con la clave del consultorio de tu cuenta.');lock()}
    },
    async pisarnube(){
      if(!confirm('Se va a borrar lo que hay en la nube y se va a subir lo de este dispositivo. ¿Seguir?'))return;
      const sb=await NUBE.client();const {error}=await sb.from('records').delete().neq('id','');
      if(error){toast('No se pudo borrar la nube');return}
      await NUBE.encender(true);await CX.refresh();
    },
    async borrar(){
      const w=prompt('Esto borra tu cuenta y todos tus datos de la nube. No se puede deshacer.\nLos datos de este dispositivo no se tocan.\n\nPara confirmar, escribí BORRAR');
      if(w!=='BORRAR')return;
      try{const sb=await NUBE.client();const {error}=await sb.rpc('delete_my_account');if(error)throw error;try{await sb.auth.signOut()}catch(_){}
        NUBE.user=null;localStorage.removeItem('cx_nube');NUBE.set('off');await CX.refresh();toast('Cuenta y datos de la nube borrados')}
      catch(e){toast('No se pudo borrar. Probá de nuevo con conexión.')}
    }
  },
  forms:{
    async otp(v){
      const sb=await NUBE.client(),holder=CX.ui.modal&&CX.ui.modal.t==='nube:login'?CX.ui.modal:CX.page().args;
      holder.email=v.email.trim();holder.err='';
      if(v.code&&v.code.trim()){
        const {error}=await sb.auth.verifyOtp({email:holder.email,token:v.code.trim(),type:'email'});
        if(error){holder.err='El código no es válido o venció.';render();return}
        await NUBE.session();return NUBE.entrar();
      }
      NUBE.setMeta({want:true});
      const {error}=await sb.auth.signInWithOtp({email:holder.email,options:{emailRedirectTo:NUBE.redirect()}});
      if(error){holder.err=/rate|limit/i.test(error.message)?'Se pidieron demasiados mails. Esperá unos minutos y probá de nuevo.':'No se pudo enviar el mail.';render();return}
      holder.sent=true;render();
    }
  },
  /* pantalla inicial: entrar con una cuenta que ya tiene datos */
  injectLock(app){
    const box=app.querySelector('.lock');if(!box)return;
    const note=localStorage.getItem('cx_note');
    if(note)box.querySelector('form').insertAdjacentHTML('beforebegin',`<div class="banner" style="text-align:left">${esc(note)}</div>`);
    if(!localStorage.getItem(LS))box.insertAdjacentHTML('beforeend',`<div class="lockx"><button class="lnk" data-act="x:nube:login">Ya tengo cuenta: traer mi consultorio</button></div>`);
  }
});

/* después de entrar con la cuenta (enlace del mail, código u OAuth) */
NUBE.entrar=async function(){
  if(!NUBE.user)return;
  if(ui.locked){
    if(localStorage.getItem(LS))return render();
    NUBE.setMeta({want:false});
    const ok=await NUBE.bajar();
    CX.ui.modal=null;
    localStorage.setItem('cx_note',ok?`Encontramos tu consultorio (${NUBE.user.email||'cuenta conectada'}). Entrá con tu clave.`:'Esa cuenta todavía no tiene un consultorio guardado. Creá uno acá y después activá el Modo online desde el Panel.');
    render();
  }else{NUBE.setMeta({want:false});CX.ui.modal=null;await CX.refresh();if(CX.page()&&CX.page().id==='nube:home')await NUBE.activar()}
};
CX.listen('unlock',()=>{localStorage.removeItem('cx_note')});
CX.listen('ready',async()=>{
  const m=NUBE.meta();
  if(m.on){NUBE.sync()}
  else if(m.want&&await NUBE.session()){NUBE.setMeta({want:false});await CX.go('nube:home');NUBE.activar()}
});
CX.listen('save',()=>{if(NUBE.meta().on&&CX.dirty)NUBE.queue()});
CX.listen('wipe',()=>{NUBE.user=null;NUBE.sb=null});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&NUBE.meta().on)NUBE.queue(800)});
window.addEventListener('online',()=>{if(NUBE.meta().on)NUBE.queue(500)});
setInterval(()=>{if(!document.hidden&&NUBE.meta().on&&!ui.locked)NUBE.sync()},60000);
/* al volver del proveedor de acceso, la dirección trae el código de sesión */
(async function(){
  const back=/[?&#](code|access_token|error_description)=/.test(location.search+location.hash);
  if(!back&&!NUBE.meta().want)return;
  try{
    await NUBE.client();
    if(back)await new Promise(r=>setTimeout(r,900));
    await NUBE.session();
    if(back)history.replaceState(null,'',location.pathname);
    if(NUBE.user)await NUBE.entrar();
  }catch(e){console.error('[nube] inicio',e)}
})();
