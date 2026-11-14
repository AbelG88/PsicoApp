'use strict';
/* Panel de control: profesión, módulos, datos del consultorio, prestaciones,
   aumento de aranceles, copia de seguridad y registro de actividad. */
CX.advance=function(){
  CX.ui.gate=null;
  for(const m of CX.order.map(i=>CX.mods[i])){const g=m.gate&&m.gate();if(g){CX.ui.gate=g;break}}
  render();
  if(!CX.ui.gate)CX.emit('ready');
};
CX.listen('unlock',()=>{CX.advance()});

CX.def('panel',{
  name:'Panel de control',core:true,
  gate(){return S.x.prof?null:'inicio'},
  pages:{
    home:{view(){
      const groups=[];
      for(const m of CX.active())for(const it of (m.panel||[]))groups.push(it);
      const st=S.settings,p=CX.prof();
      return `<div class="top"><button class="lnk" data-act="x:back">‹ Volver</button></div><h1 style="margin-top:12px">Panel</h1>
      <div class="sub">${esc(st.name||'Tu consultorio')} · ${esc(p.n)}</div>
      <h3 class="sec">Tu consultorio</h3>
      ${CX.item('x:go',{p:'panel:datos'},'Mis datos',esc([st.name,st.matricula&&'Mat. '+st.matricula,st.cuit&&'CUIT '+st.cuit].filter(Boolean).join(' · ')||'Nombre, matrícula, CUIT, alias'))}
      ${CX.item('x:go',{p:'panel:srv'},'Prestaciones y valores',S.x.srv.length?esc(S.x.srv.map(s=>s.name).slice(0,3).join(', '))+(S.x.srv.length>3?'…':''):'Tipos de turno con duración y valor')}
      ${CX.item('x:go',{p:'panel:aumento'},'Aumentar aranceles','Subí todos los valores con un porcentaje')}
      ${CX.item('x:panel:core',{},'Obras sociales, montos y cobro de ausencias','Ajustes generales')}
      <h3 class="sec">Funciones</h3>
      ${CX.item('x:go',{p:'panel:mods'},'Módulos',CX.order.map(i=>CX.mods[i]).filter(m=>!m.core).map(m=>`<span class="dot${CX.on(m.id)?'':' off'}"></span>${esc(m.name)}`).join(' &nbsp; '))}
      ${groups.filter(g=>g.sec==='fun').map(g=>CX.item('x:go',{p:g.p},esc(g.title),g.sub?g.sub():'')).join('')}
      <h3 class="sec">Datos y seguridad</h3>
      ${CX.item('x:go',{p:'panel:copia'},'Copia de seguridad',st.lastBackup?'Última: '+CX.fdate(st.lastBackup):'<span class="warnt">Todavía no hiciste ninguna</span>')}
      ${groups.filter(g=>g.sec==='datos').map(g=>CX.item('x:go',{p:g.p},esc(g.title),g.sub?g.sub():'')).join('')}
      ${CX.item('x:go',{p:'panel:log'},'Registro de actividad','Entradas, copias y exportaciones')}
      <div class="row wrap" style="margin-top:18px"><button class="sec" data-act="chpass">Cambiar clave</button><button class="sec" data-act="lock">Bloquear ahora</button></div>
      ${groups.filter(g=>g.sec==='pie').map(g=>`<h3 class="sec">${esc(g.head||'')}</h3>`+CX.item('x:go',{p:g.p},esc(g.title),g.sub?g.sub():'')).join('')}
      <p class="mut" style="margin-top:22px">Consultorio ${CX.v}</p>`;
    }},
    datos:{view(){
      const st=S.settings,c=CX.cfg('panel');
      return CX.head('Mis datos')+`<form data-form="x:panel:datos">
      <label>Profesión</label><select name="prof">${Object.entries(CX.PROFS).map(([k,p])=>`<option value="${k}"${S.x.prof===k?' selected':''}>${esc(p.n)}</option>`).join('')}</select>
      <label>Nombre (firma de mensajes y documentos)</label><input name="name" value="${esc(st.name)}" placeholder="Lic. / Dr. / Dra. …">
      <div class="grid2"><div><label>Matrícula</label><input name="matricula" value="${esc(st.matricula)}" placeholder="MN / MP"></div><div><label>CUIT</label><input name="cuit" inputmode="numeric" value="${esc(st.cuit)}"></div></div>
      <label>Domicilio del consultorio</label><input name="dom" value="${esc(c.dom)}" placeholder="Calle, número, localidad">
      <div class="grid2"><div><label>Teléfono</label><input name="tel" inputmode="tel" value="${esc(c.tel)}"></div><div><label>Email</label><input name="mail" type="email" value="${esc(c.mail)}"></div></div>
      <label>Alias o CBU (aparece en los mensajes de deuda)</label><input name="alias" value="${esc(st.alias)}" placeholder="tu.alias.mp">
      <p class="mut">Estos datos aparecen en recibos, constancias, planillas y en la historia clínica impresa.</p>
      <div class="btns"><button>Guardar</button><button type="button" class="sec" data-act="x:back">Cancelar</button></div></form>`;
    }},
    mods:{view(){
      return CX.head('Módulos')+`<p class="sub">Prendé solo lo que usás. Apagar un módulo lo oculta, pero no borra sus datos.</p>
      ${CX.order.map(i=>CX.mods[i]).filter(m=>!m.core).map(m=>`<label class="sw" style="margin:0;color:var(--ink);font-size:1rem"><div><div><b>${esc(m.name)}</b></div><div class="sub">${esc(m.desc||'')}</div></div><input type="checkbox" data-xchg="panel:mod" data-id="${m.id}"${CX.on(m.id)?' checked':''}></label>`).join('')}`;
    }},
    srv:{view(){
      return CX.head('Prestaciones y valores')+`<p class="sub">Son tus tipos de turno. Al agendar aparecen como botones y cargan solos el valor.</p>
      ${S.x.srv.length?S.x.srv.map(s=>CX.item('x:sheet',{s:'panel:srv',id:s.id},esc(s.name),`${s.dur||CX.prof().dur} min`,`<b>${money(s.fee)}</b>`)).join(''):'<div class="empty">Todavía no cargaste prestaciones.</div>'}
      <div style="margin-top:12px"><button class="sec" data-act="x:sheet" data-s="panel:srv">+ Agregar prestación</button></div>`;
    }},
    aumento:{view(a){
      const pct=+a.pct||0,red=+a.red||100;
      const up=v=>v>0?Math.round(v*(1+pct/100)/red)*red:v;
      const nPat=S.patients.filter(p=>!p.archived&&(+p.fee>0||+p.osFee>0)).length;
      const fut=S.sessions.filter(s=>s.status==='prog'&&s.date>=today()).length;
      const ej=S.patients.filter(p=>!p.archived&&+p.fee>0).slice(0,3);
      return CX.head('Aumentar aranceles')+`<p class="sub">Aplica un porcentaje a todos los valores de una vez. Los turnos ya atendidos no cambian.</p>
      <form data-form="x:panel:aumento">
      <label>Porcentaje de aumento</label><div class="pills">${[5,8,10,15,20,25].map(n=>`<button type="button" class="pill${pct===n?' on':''}" data-act="x:panel:pct" data-v="${n}">${n}%</button>`).join('')}</div>
      <input type="number" name="pct" min="0.1" max="500" step="any" value="${pct||''}" placeholder="Otro porcentaje" required data-xchg="panel:pctin">
      <label>Redondear a</label><select name="red" data-xchg="panel:pctin">${[1,50,100,500,1000].map(n=>`<option value="${n}"${red===n?' selected':''}>${n===1?'Sin redondeo':money(n)}</option>`).join('')}</select>
      <label>Aplicar a</label>
      <div class="tog"><input type="checkbox" name="pat" id="aup" checked><label for="aup">Lo que paga cada paciente (${nPat} pacientes)</label></div>
      <div class="tog"><input type="checkbox" name="srv" id="aus" checked><label for="aus">Prestaciones (${S.x.srv.length})</label></div>
      <div class="tog"><input type="checkbox" name="fut" id="auf" checked><label for="auf">Turnos futuros ya agendados (${fut})</label></div>
      <div class="tog"><input type="checkbox" name="os" id="auo"><label for="auo">Lo que pagan las obras sociales (solo si ya te confirmaron el aumento)</label></div>
      ${pct&&ej.length?`<div class="box"><div class="sub">Así quedarían, por ejemplo:</div>${ej.map(p=>`<div class="kv"><span>${esc(p.name)}</span><b>${money(p.fee)} → ${money(up(+p.fee))}</b></div>`).join('')}</div>`:''}
      <div class="tog"><input type="checkbox" name="desde" id="aud"><label for="aud">Aplicar a los turnos futuros recién desde una fecha</label></div>
      <input type="date" name="fecha" value="${addDays(today(),1)}">
      <div class="btns"><button>Aplicar aumento</button><button type="button" class="sec" data-act="x:back">Cancelar</button></div></form>`;
    }},
    copia:{view(){
      const st=S.settings,age=backupAge();
      const used=(localStorage.getItem(LS)||'').length,pctUsed=Math.min(100,Math.round(used/4500000*100));
      return CX.head('Copia de seguridad')+`
      <div class="sub" style="margin-top:14px">Última copia</div><div class="big ${age===null||age>=15?'warnt':''}">${age===null?'Nunca':age===0?'Hoy':`Hace ${age} día${age===1?'':'s'}`}</div>
      <p class="mut">La copia es un archivo cifrado con tu clave. Incluye pacientes, turnos, cobros${CX.vault.ok?', historia clínica':''} y ajustes. Guardala fuera del teléfono: en Drive, o mandátela por mail.</p>
      <div class="btns"><button data-act="x:panel:share">Enviar copia</button><button class="sec" data-act="x:panel:down">Descargar</button></div>
      <button class="lnk" data-act="import">Restaurar una copia</button>
      <input type="file" id="imp" accept=".json,application/json" hidden>
      <h3 class="sec">Espacio usado en este dispositivo</h3>
      <div class="hbar${pctUsed>80?' bad':pctUsed>60?' warn':''}"><i style="width:${Math.max(1,pctUsed)}%"></i></div>
      <div class="sub" style="margin-top:6px">${pctUsed}% del espacio para turnos y cobros${CX.vault.ok?'. La historia clínica se guarda aparte y no tiene este límite.':''}</div>
      <h3 class="sec">Importante</h3>
      <p class="mut">Sin tu clave no se puede abrir la copia: nadie puede recuperarla por vos. Cada copia se abre con la clave que tenías cuando la hiciste.</p>`;
    }},
    log:{view(){
      const L={entrar:'Entró a la app',copia:'Hizo una copia de seguridad',restaurar:'Restauró una copia',hc_ver:'Abrió una historia clínica',hc_exp:'Exportó una historia clínica',hc_nota:'Firmó una nota clínica',pac_exp:'Exportó los datos de un paciente',nube:'Sincronizó con la nube',aumento:'Aplicó un aumento de aranceles'};
      const rows=[...S.x.log].reverse().slice(0,200);
      return CX.head('Registro de actividad')+`<p class="sub">Queda constancia de cada entrada y de cada acceso a datos sensibles en este consultorio.</p>
      ${rows.map(r=>{const d=new Date(r.t),p=r.pid&&pat(r.pid);return `<div class="kv"><span>${pad(d.getDate())}/${pad(d.getMonth()+1)} ${pad(d.getHours())}:${pad(d.getMinutes())}</span><b>${esc(L[r.a]||r.a)}${p?' · '+esc(p.name):''}</b></div>`}).join('')||'<div class="empty">Sin actividad registrada.</div>'}`;
    }}
  },
  sheets:{
    srv(m){
      const s=m.id?S.x.srv.find(x=>x.id===m.id):{dur:CX.prof().dur};
      return `<h1 class="sm">${m.id?'Editar':'Nueva'} prestación</h1><form data-form="x:panel:srv" data-id="${m.id||''}">
      <label>Nombre</label><input name="name" required value="${esc(s.name)}" placeholder="Sesión individual, Primera consulta…">
      ${amountField('fee','Valor',s.fee,[],true)}
      <label>Duración</label><select name="dur">${[15,20,30,40,45,50,60,90,120].map(n=>`<option value="${n}"${+s.dur===n?' selected':''}>${n} minutos</option>`).join('')}</select>
      ${CX.btns()}</form>${m.id?`<button class="dng" data-act="x:panel:delsrv" data-id="${m.id}">Eliminar</button>`:''}`;
    }
  },
  acts:{
    core(){CX.ui.stack=[];ui.prev=ui.tab==='aj'?'hoy':ui.tab;ui.tab='aj';render();scrollTo(0,0)},
    share(){return CX.backup(true)},
    down(){return CX.backup(false)},
    pct(d,t){const f=t.closest('form');CX.page().args={pct:+d.v,red:+f.elements.red.value};render()},
    async delsrv(d){S.x.srv=S.x.srv.filter(x=>x.id!==d.id);CX.ui.modal=null;await go()},
    prof(d,t){t.closest('.pills').querySelectorAll('.pill').forEach(b=>b.classList.toggle('on',b===t));t.closest('form').elements.prof.value=d.v}
  },
  chg:{
    async mod(t){S.x.mods[t.dataset.id]=t.checked;await save();render()},
    pctin(t){const f=t.form;CX.page().args={pct:+f.elements.pct.value,red:+f.elements.red.value}}
  },
  forms:{
    async inicio(v){
      S.x.prof=v.prof||'otro';
      if(v.name)S.settings.name=v.name.trim();
      for(const m of CX.order.map(i=>CX.mods[i]))if(!m.core)S.x.mods[m.id]=v['m_'+m.id]==='on';
      CX.seed();await save();CX.advance();
    },
    async datos(v){
      const st=S.settings,c=CX.cfg('panel'),was=S.x.prof;
      st.name=v.name.trim();st.matricula=v.matricula.trim();st.cuit=v.cuit.trim();st.alias=v.alias.trim();
      c.dom=v.dom.trim();c.tel=v.tel.trim();c.mail=v.mail.trim();
      if(v.prof!==was){S.x.prof=v.prof;CX.seed(true)}
      await save();CX.back();toast('Datos guardados');
    },
    async srv(v,f){
      const rec={name:v.name.trim(),fee:+v.fee||0,dur:+v.dur||CX.prof().dur};learn(rec.fee);
      if(f.dataset.id)Object.assign(S.x.srv.find(x=>x.id===f.dataset.id),rec);else S.x.srv.push({id:uid(),...rec});
      CX.ui.modal=null;await go();
    },
    async aumento(v){
      const pct=+v.pct,red=+v.red||1;if(!(pct>0))return;
      const up=x=>+x>0?Math.round(+x*(1+pct/100)/red)*red:+x||0;
      const prev=JSON.stringify({p:S.patients.map(p=>[p.id,p.fee,p.osFee]),s:S.x.srv.map(s=>[s.id,s.fee]),f:S.fin.map(f=>[f.id,f.fee,f.copago]),t:S.sessions.filter(s=>s.status==='prog').map(s=>[s.id,s.fee,s.osAmt])});
      const desde=v.desde==='on'&&v.fecha?v.fecha:today();
      let n=0;
      if(v.pat==='on')for(const p of S.patients){if(p.archived)continue;if(+p.fee>0){p.fee=up(p.fee);n++}}
      if(v.srv==='on')for(const s of S.x.srv)s.fee=up(s.fee);
      if(v.os==='on'){for(const f of S.fin){f.fee=up(f.fee)}for(const p of S.patients)if(+p.osFee>0)p.osFee=up(p.osFee)}
      if(v.fut==='on')for(const s of S.sessions){if(s.status==='prog'&&s.date>=desde){if(v.pat==='on'||v.srv==='on')s.fee=up(s.fee);if(v.os==='on'&&s.osAmt)s.osAmt=up(s.osAmt)}}
      learn(...S.patients.map(p=>p.fee),...S.x.srv.map(s=>s.fee));
      CX.log('aumento',{pct});await save();CX.back();
      toast(`Aumento del ${pct}% aplicado`,async()=>{
        const o=JSON.parse(prev);
        for(const [id,fee,osFee] of o.p){const p=pat(id);if(p){p.fee=fee;p.osFee=osFee}}
        for(const [id,fee] of o.s){const s=S.x.srv.find(x=>x.id===id);if(s)s.fee=fee}
        for(const [id,fee,cop] of o.f){const f=fin(id);if(f){f.fee=fee;f.copago=cop}}
        for(const [id,fee,os] of o.t){const s=S.sessions.find(x=>x.id===id);if(s){s.fee=fee;if(os!==undefined)s.osAmt=os}}
        await go();
      });
    }
  }
});

/* valores iniciales según la profesión */
CX.seed=function(force){
  const p=CX.prof();
  if(!S.x.srv.length){const base=topMontos(1)[0]||0;S.x.srv=p.srv.map(([name,dur])=>({id:uid(),name,dur,fee:base}))}
  const hc=CX.cfg('hc');
  if(force||!hc.secs){hc.secs=[...p.secs];hc.phr=[...p.phr]}
};

CX.gates.inicio=function(){
  const mods=CX.order.map(i=>CX.mods[i]).filter(m=>!m.core);
  return `<div class="gate"><h1>Armemos tu consultorio</h1><p class="sub">Elegí tu profesión y qué querés usar. Después lo podés cambiar desde el Panel.</p>
  <form data-form="x:panel:inicio"><input type="hidden" name="prof" value="psico">
  <label>Profesión</label><div class="pills">${Object.entries(CX.PROFS).map(([k,p])=>`<button type="button" class="pill${k==='psico'?' on':''}" data-act="x:panel:prof" data-v="${k}">${esc(p.n)}</button>`).join('')}</div>
  <label>Tu nombre, como querés que figure</label><input name="name" value="${esc(S.settings.name)}" placeholder="Lic. / Dr. / Dra. …">
  <h3 class="sec">Qué vas a usar</h3>
  <div class="sw"><div><div><b>Agenda, pacientes y cobros</b></div><div class="sub">Siempre activo</div></div><span class="ok">✓</span></div>
  ${mods.map(m=>`<label class="sw" style="margin:0;color:var(--ink);font-size:1rem"><div><div><b>${esc(m.name)}</b></div><div class="sub">${esc(m.desc||'')}</div></div><input type="checkbox" name="m_${m.id}"${m.defaultOn!==false?' checked':''}></label>`).join('')}
  <button style="width:100%;margin-top:22px">Empezar</button></form></div>`;
};
