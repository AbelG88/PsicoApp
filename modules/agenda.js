'use strict';
/* Agenda avanzada: prestaciones al agendar, aviso de superposición,
   recordatorios en tanda por WhatsApp, datos de contacto y vacaciones. */
const AG={
  TPL:'Hola {nombre}, te recuerdo tu turno del {dia} a las {hora}.{link} Si no podés asistir, avisame con tiempo. ¡Gracias!{firma}',
  tpl:()=>CX.cfg('agenda').tpl||AG.TPL,
  px:pid=>S.x.px[pid]||{},
  /* próximo día con turnos, dentro de los próximos 4 días */
  nextDay(){for(let i=1;i<=4;i++){const d=addDays(today(),i);if(S.sessions.some(s=>s.date===d&&s.status==='prog'))return d}return null},
  pend(d){return S.sessions.filter(s=>s.date===d&&s.status==='prog').sort((a,b)=>a.time.localeCompare(b.time))},
  msg(s){
    const p=pat(s.pid),x=AG.px(s.pid);
    const dia=s.date===addDays(today(),1)?'mañana '+dayName(s.date):longDate(s.date);
    return AG.tpl().replace(/\{nombre\}/g,first(p)).replace(/\{dia\}/g,dia).replace(/\{hora\}/g,s.time).replace(/\{link\}/g,x.online&&x.link?' Nos vemos por videollamada: '+x.link+' .':'').replace(/\{firma\}/g,sign());
  }
};

CX.def('agenda',{
  name:'Agenda avanzada',desc:'Recordatorios en tanda por WhatsApp, prestaciones al agendar, aviso de turnos superpuestos y vacaciones',
  panel:[{sec:'fun',title:'Agenda: recordatorios y vacaciones',p:'agenda:cfg',sub:()=>'Mensaje de recordatorio y cancelación por período'}],
  pages:{
    rec:{view(a){
      const d=a.d,list=AG.pend(d);
      const done=list.filter(s=>s.rem===d).length;
      return CX.head('Recordatorios')+`<div class="sub">${esc(capital(longDate(d)))} · ${list.length} turno${list.length===1?'':'s'} · ${done} avisado${done===1?'':'s'}</div>
      ${list.map(s=>{const p=pat(s.pid);if(!p)return '';const ok=waOk(p);
        return `<div class="item"><div class="time">${esc(s.time)}</div><div class="grow"><div>${esc(p.name)}</div><div class="sub">${s.rem===d?'<span class="ok">Avisado</span>':ok?'Sin avisar':'<span class="warnt">Sin WhatsApp cargado</span>'}${AG.px(p.id).online?' · online':''}</div></div>
        ${ok?`<a class="btn sm${s.rem===d?' sec':''}" data-act="x:agenda:avisado" data-id="${s.id}" target="_blank" rel="noopener" href="${waLink(p,AG.msg(s))}">${s.rem===d?'Reenviar':'Avisar'}</a>`:`<button class="sec sm" data-act="editpat" data-id="${p.id}">Cargar</button>`}</div>`}).join('')||'<div class="empty">No hay turnos programados ese día.</div>'}
      <p class="mut">Cada botón abre WhatsApp con el mensaje listo: solo tenés que tocar enviar. Podés cambiar el texto en Panel → Agenda.</p>`;
    }},
    cfg:{view(){
      return CX.head('Agenda')+`<form data-form="x:agenda:cfg">
      <label>Mensaje de recordatorio</label><textarea name="tpl" rows="5" class="keep">${esc(AG.tpl())}</textarea>
      <p class="mut">Se reemplaza solo: {nombre}, {dia}, {hora}, {link} (videollamada, si el paciente es online) y {firma}.</p>
      <div class="btns"><button>Guardar</button><button type="button" class="sec" data-act="x:agenda:tplreset">Volver al original</button></div></form>
      <h3 class="sec">Vacaciones y feriados</h3>
      ${CX.item('x:go',{p:'agenda:vac'},'Cancelar turnos de un período','Marca como cancelados todos los turnos entre dos fechas')}`;
    }},
    vac:{view(a){
      const from=a.from||addDays(today(),1),to=a.to||addDays(today(),7);
      const list=S.sessions.filter(s=>s.status==='prog'&&s.date>=from&&s.date<=to),pids=[...new Set(list.map(s=>s.pid))];
      return CX.head('Vacaciones y feriados')+`<p class="sub">Los turnos del período quedan como cancelados con aviso: no se cobran y las series siguen después.</p>
      <div class="grid2"><div><label>Desde</label><input type="date" value="${from}" data-xchg="agenda:vfrom"></div><div><label>Hasta</label><input type="date" value="${to}" data-xchg="agenda:vto"></div></div>
      <div class="sub" style="margin-top:18px">Turnos programados en el período</div><div class="big">${list.length}</div>
      <div class="sub">${pids.length} paciente${pids.length===1?'':'s'}</div>
      ${list.length?`<div class="btns"><button data-act="x:agenda:vacok">Cancelar ${list.length} turno${list.length===1?'':'s'}</button><button class="sec" data-act="x:back">Volver</button></div>
      <h3 class="sec">Avisar a cada paciente</h3>
      ${pids.map(id=>{const p=pat(id);if(!p)return '';const msg=`Hola ${first(p)}, te aviso que del ${CX.fdate(from).slice(0,5)} al ${CX.fdate(to).slice(0,5)} no voy a atender. Retomamos después en tu horario habitual. ¡Gracias!${sign()}`;
        return `<div class="item"><div class="grow">${esc(p.name)}</div>${waOk(p)?`<a class="btn sec sm" target="_blank" rel="noopener" href="${waLink(p,msg)}">Avisar</a>`:'<span class="mut">Sin WhatsApp</span>'}</div>`}).join('')}`:'<div class="empty">No hay turnos programados entre esas fechas.</div>'}`;
    }}
  },
  sheets:{
    px(m){
      const p=pat(m.pid),x=AG.px(m.pid);
      return `<h1 class="sm">Contacto de ${esc(first(p))}</h1><form data-form="x:agenda:px">
      <label>Email</label><input type="email" name="email" value="${esc(x.email)}">
      <div class="tog"><input type="checkbox" name="online" id="pxo"${x.online?' checked':''}><label for="pxo">Se atiende por videollamada</label></div>
      <label>Link de la videollamada (se agrega al recordatorio)</label><input type="url" name="link" value="${esc(x.link)}" placeholder="https://meet.google.com/…">
      <label>Responsable de pago, si no es el paciente</label><input name="resp" value="${esc(x.resp)}" placeholder="Nombre y teléfono">
      ${CX.btns()}</form>`;
    }
  },
  acts:{
    rec(d){return CX.go('agenda:rec',{d:d.d})},
    avisado(d){const s=S.sessions.find(x=>x.id===d.id);if(s){s.rem=s.date;setTimeout(async()=>{await save();render()},500)}},
    px(d){CX.sheet('agenda:px',{pid:d.pid})},
    srv(d,t){
      const f=t.closest('form'),s=S.x.srv.find(x=>x.id===d.id);if(!f||!s)return;
      const was=f.elements.srv.value===s.id;
      f.elements.srv.value=was?'':s.id;
      t.closest('.pills').querySelectorAll('.pill').forEach(b=>b.classList.toggle('on',!was&&b===t));
      if(!was&&+s.fee>0){f.elements.fee.value=s.fee;syncPills(f,'fee');updSum(f)}
    },
    async tplreset(){delete CX.cfg('agenda').tpl;await save();render();toast('Mensaje restablecido')},
    async vacok(){
      const a=CX.page().args,from=a.from||addDays(today(),1),to=a.to||addDays(today(),7);
      const list=S.sessions.filter(s=>s.status==='prog'&&s.date>=from&&s.date<=to),ids=list.map(s=>s.id);
      if(!confirm(`¿Cancelar ${ids.length} turnos entre el ${CX.fdate(from)} y el ${CX.fdate(to)}?`))return;
      list.forEach(s=>s.status='cancelo');await go();
      toast(`${ids.length} turnos cancelados`,async()=>{S.sessions.forEach(s=>{if(ids.includes(s.id))s.status='prog'});await go()});
    }
  },
  chg:{
    vfrom(t){const a=CX.page().args;a.from=t.value;if(!a.to||a.to<t.value)a.to=t.value;render()},
    vto(t){CX.page().args.to=t.value;render()}
  },
  forms:{
    async cfg(v){CX.cfg('agenda').tpl=v.tpl.trim()||AG.TPL;await save();toast('Guardado')},
    async px(v){
      const m=CX.ui.modal;
      S.x.px[m.pid]={email:v.email.trim(),online:v.online==='on',link:v.link.trim(),resp:v.resp.trim()};
      CX.ui.modal=null;await go();
    }
  },
  /* formularios del núcleo: se revisa antes de que se guarden */
  coreForms:{
    ses(v,f){
      if(f.dataset.id)return;
      const clash=S.sessions.find(s=>s.date===v.date&&s.time===v.time&&s.status!=='cancelo'&&s.status!=='cancelo_tarde');
      if(clash){const p=pat(clash.pid);if(!confirm(`Ya hay un turno el ${CX.fdate(v.date)} a las ${v.time}${p?' ('+p.name+')':''}. ¿Agendar igual?`))return false}
      const s=v.srv&&S.x.srv.find(x=>x.id===v.srv);
      CX.stash.ses=s?{srv:s.id,dur:s.dur}:null;
    }
  },
  inject(app){
    if(ui.tab==='hoy'&&ui.date===today()&&!ui.modal){
      const d=AG.nextDay();
      if(d){const list=AG.pend(d).filter(s=>{const p=pat(s.pid);return p&&waOk(p)}),left=list.filter(s=>s.rem!==d).length;
        if(left){const w=app.querySelector('.week,.mon');
          if(w)w.insertAdjacentHTML('beforebegin',`<div class="banner"><b>${left}</b> recordatorio${left===1?'':'s'} para ${d===addDays(today(),1)?'mañana':'el '+dayName(d)}<div class="row"><button class="sm" data-act="x:agenda:rec" data-d="${d}">Avisar por WhatsApp</button></div></div>`)}}
    }
    if(ui.tab==='pac'&&ui.pid&&!ui.modal){
      const x=AG.px(ui.pid),anchor=app.querySelector('#hcrow')||app.querySelector('.btns');
      if(anchor)anchor.insertAdjacentHTML('afterend',`<div class="item" data-act="x:agenda:px" data-pid="${ui.pid}"><div class="grow"><div><b>Contacto y modalidad</b></div><div class="sub">${esc([x.online?'Videollamada':'Presencial',x.email,x.resp&&'Paga: '+x.resp].filter(Boolean).join(' · '))}</div></div><span class="mut">›</span></div>`);
    }
    if(ui.modal&&ui.modal.t==='ses'&&!ui.modal.id&&S.x.srv.length){
      const f=app.querySelector('form[data-form="ses"]'),det=f&&f.querySelector('details.more');
      if(det)det.insertAdjacentHTML('beforebegin',`<label>Prestación</label><div class="pills">${S.x.srv.map(s=>`<button type="button" class="pill" data-act="x:agenda:srv" data-id="${s.id}">${esc(s.name)}${+s.fee?' · '+money(s.fee):''}</button>`).join('')}</div><input type="hidden" name="srv" value="">`);
    }
  }
});
