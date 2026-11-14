'use strict';
/* Historia clínica de carga rápida.
   - Una nota por turno, con secciones y frases frecuentes según la profesión.
   - Se puede corregir durante 24 h; después queda firmada y solo admite aclaraciones.
   - Cada nota firmada guarda una huella encadenada con la anterior (control de modificación).
   - Todo se guarda cifrado en la bóveda, separado de turnos y cobros. */
const HC={
  EDIT_MS:24*3600*1000,focus:null,dt:null,
  secs:()=>{const c=CX.cfg('hc');return c.secs&&c.secs.length?c.secs:CX.prof().secs},
  phr:()=>{const c=CX.cfg('hc');return c.phr||CX.prof().phr},
  editable:n=>!n.closed&&Date.now()-n.at<HC.EDIT_MS,
  async sha(s){const h=new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(s)));return [...h].map(b=>b.toString(16).padStart(2,'0')).join('')},
  body:n=>JSON.stringify([n.pid,n.date,n.time||'',n.tipo||'nota',n.secs,n.at,n.ref||'']),
  async notes(pid){
    const l=await CX.vault.list('note',pid);
    return l.sort((a,b)=>(a.date+(a.time||'')+a.at).localeCompare(b.date+(b.time||'')+b.at));
  },
  /* firma las notas que ya pasaron el plazo de corrección, en orden */
  async closeDue(pid,forceId){
    const l=(await HC.notes(pid)).sort((a,b)=>a.at-b.at);
    let prev=l.filter(n=>n.closed).sort((a,b)=>a.closed-b.closed).map(n=>n.hash).pop()||'';
    let ch=false;
    for(const n of l){
      if(n.closed)continue;
      if(n._id===forceId||Date.now()-n.at>=HC.EDIT_MS){
        n.prev=prev;n.hash=await HC.sha(prev+HC.body(n));
        n.closed=n._id===forceId?Date.now():n.at+HC.EDIT_MS;n.autor=S.settings.name||'';n.mat=S.settings.matricula||'';
        prev=n.hash;await CX.vault.put('note',pid,n,n._id);ch=true;
      }
    }
    return ch;
  },
  async verify(notes){
    for(const n of notes.filter(n=>n.closed)){if(await HC.sha((n.prev||'')+HC.body(n))!==n.hash)return n}
    return null;
  },
  ficha:async pid=>(await CX.vault.get('ficha-'+pid))||{f:{},hist:[]},
  age(b){if(!b)return '';const d=new Date(b+'T12:00'),t=new Date();let a=t.getFullYear()-d.getFullYear();if(t<new Date(t.getFullYear(),d.getMonth(),d.getDate()))a--;return a>=0&&a<130?a+' años':''},
  FIELDS:[['nac','Fecha de nacimiento','date'],['dni','DNI','text'],['dom','Domicilio','text'],['ocu','Ocupación / escolaridad','text'],['emer','Contacto de emergencia','text'],['resp','Responsable o acompañante (menores)','text'],['deriv','Derivado por','text'],['motivo','Motivo de consulta','area'],['ant','Antecedentes','area'],['med','Medicación actual','area'],['aler','Alergias','text'],['dx','Diagnóstico o impresión','area'],['obs','Observaciones','area']],
  noteHtml(n,folio){
    const secs=Object.entries(n.secs||{}).filter(([,v])=>v&&v.trim());
    const multi=secs.length>1||(secs[0]&&secs[0][0]!==HC.secs()[0]);
    const tipo=n.tipo==='acl'?'Aclaración':n.tipo==='cons'?'Consentimiento':'';
    return `<div class="note" data-act="x:hc:abrir" data-id="${n._id}"><div class="nh"><b>${CX.fdate(n.date)}${n.time?' · '+esc(n.time):''}${tipo?' · '+tipo:''}</b><span class="sub">${folio?'Folio '+folio+' · ':''}${n.closed?'Firmada':HC.editable(n)?'<span class="warnt">Se puede corregir</span>':'Firmada'}</span></div>
    <div class="nb keep">${secs.map(([k,v])=>(multi?`<b>${esc(k)}</b>`:'')+esc(v.trim())).join('\n')||'<span class="mut">Sin texto</span>'}</div></div>`;
  },
  CONS:{
    trat:{n:'Tratamiento',t:(p,s)=>`CONSENTIMIENTO INFORMADO PARA TRATAMIENTO

Yo, ${p.name}${p.dni?', DNI '+p.dni:', DNI ____________'}, declaro que ${s.name||'el/la profesional'}${s.matricula?', matrícula '+s.matricula+',':''} me explicó en términos claros:

1. En qué consiste la atención propuesta, sus objetivos y la modalidad de trabajo (frecuencia, duración y lugar de los encuentros).
2. Los beneficios esperados, los riesgos o molestias posibles y las alternativas disponibles.
3. Que puedo hacer preguntas en cualquier momento y que puedo interrumpir el tratamiento cuando lo decida, sin que eso afecte mi derecho a ser atendido/a.
4. Que todo lo conversado está protegido por el secreto profesional, con las excepciones que establece la ley.
5. Los honorarios, la forma de pago y la política de cancelación de turnos.

Habiendo comprendido la información recibida, presto mi consentimiento para iniciar el tratamiento.

Lugar y fecha: ______________________`},
    tele:{n:'Atención a distancia',t:(p,s)=>`CONSENTIMIENTO PARA ATENCIÓN A DISTANCIA

Yo, ${p.name}${p.dni?', DNI '+p.dni:', DNI ____________'}, acepto recibir atención por videollamada o teléfono con ${s.name||'el/la profesional'}${s.matricula?', matrícula '+s.matricula:''}.

Fui informado/a de que:
1. La atención a distancia tiene los mismos deberes de confidencialidad que la presencial.
2. Debo conectarme desde un lugar privado y con una conexión estable. El/la profesional hará lo mismo.
3. Las sesiones no se graban, salvo acuerdo expreso y por escrito de ambas partes.
4. Ningún medio electrónico es completamente seguro; conozco y acepto ese riesgo.
5. Si la comunicación se corta, se seguirá el modo de contacto acordado: ______________________
6. Ante una urgencia debo comunicarme con el servicio de emergencias o concurrir a una guardia.

Lugar y fecha: ______________________`},
    datos:{n:'Datos personales',t:(p,s)=>`CONSENTIMIENTO PARA EL TRATAMIENTO DE DATOS PERSONALES

Yo, ${p.name}${p.dni?', DNI '+p.dni:', DNI ____________'}, tomo conocimiento y acepto que:

1. ${s.name||'El/la profesional'}${s.matricula?' (matrícula '+s.matricula+')':''} es responsable de mis datos personales y de salud, que se registran con la única finalidad de brindarme atención, llevar mi historia clínica y gestionar turnos y honorarios.
2. Mis datos son confidenciales, están protegidos por el secreto profesional y se guardan en un sistema cifrado con clave. No se ceden a terceros, salvo a mi obra social o prepaga para la facturación de las prestaciones, o por obligación legal.
3. La historia clínica se conserva durante al menos 10 años desde la última atención (Ley 26.529).
4. Soy titular de mi historia clínica y puedo pedir una copia, que se me entregará dentro de las 48 horas (Ley 26.529, art. 14).
5. Puedo ejercer los derechos de acceso, rectificación y supresión de mis datos (Ley 25.326). La Agencia de Acceso a la Información Pública, órgano de control de esa ley, atiende las denuncias y reclamos por incumplimiento.
6. Autorizo que me contacten por WhatsApp o teléfono para recordatorios de turnos y avisos administrativos: SÍ / NO.

Lugar y fecha: ______________________`},
    menor:{n:'Menores de edad',t:(p,s)=>`CONSENTIMIENTO DE REPRESENTANTES LEGALES

Quien suscribe, ______________________, DNI ____________, en carácter de madre / padre / tutor/a de ${p.name}${p.dni?', DNI '+p.dni:''}, presto mi consentimiento para que reciba atención de ${s.name||'el/la profesional'}${s.matricula?', matrícula '+s.matricula:''}.

Fui informado/a sobre los objetivos, la modalidad de trabajo, la frecuencia de los encuentros y los honorarios. Entiendo que:
1. Se escuchará la opinión del niño, niña o adolescente y se respetará su intimidad, de acuerdo con su edad y grado de madurez.
2. Se me informará sobre la evolución general del tratamiento, preservando la confidencialidad de lo trabajado en los encuentros.
3. Puedo retirar este consentimiento en cualquier momento.

Lugar y fecha: ______________________`}
  }
};

CX.def('hc',{
  name:'Historia clínica',desc:'Notas rápidas por turno, ficha del paciente, consentimientos y copia para el paciente',
  panel:[{sec:'fun',title:'Historia clínica: secciones y frases',p:'hc:cfg',sub:()=>esc(HC.secs().join(' · '))}],
  boot(){document.addEventListener('focusin',e=>{if(e.target.matches&&e.target.matches('textarea[data-hcsec]'))HC.focus=e.target})},
  pages:{
    pac:{
      async load(a){
        if(!CX.vault.ok)return {err:1};
        if(await HC.closeDue(a.id))await CX.loadIndex();
        const notes=await HC.notes(a.id),fi=await HC.ficha(a.id);
        const bad=await HC.verify(notes);
        CX.log('hc_ver',{pid:a.id});await save();
        return {notes,fi,bad};
      },
      view(a,d){
        const p=pat(a.id);if(!p)return CX.head('Historia clínica')+'<div class="empty">Paciente no encontrado.</div>';
        if(d.err)return CX.head('Historia clínica')+'<div class="banner warn">Este navegador no permite guardar la historia clínica (IndexedDB no disponible). Probá fuera del modo incógnito.</div>';
        const f=d.fi.f||{},q=norm(a.q||'');
        const folio=new Map(d.notes.slice().sort((x,y)=>x.at-y.at).map((n,i)=>[n._id,i+1]));
        const list=d.notes.slice().reverse().filter(n=>!q||norm(Object.values(n.secs||{}).join(' ')).includes(q));
        const res=[['Motivo',f.motivo],['Diagnóstico',f.dx],['Medicación',f.med],['Alergias',f.aler]].filter(x=>x[1]);
        return `<div class="top"><button class="lnk" data-act="x:back">‹ ${esc(first(p))}</button><button class="lnk" data-act="x:hc:docs" data-pid="${p.id}">Documentos</button></div>
        <h1 class="sm" style="margin-top:12px">Historia clínica</h1>
        <div class="sub">${esc(p.name)}${f.nac?' · '+HC.age(f.nac):''}${f.dni||p.dni?' · DNI '+esc(f.dni||p.dni):''}</div>
        ${d.bad?`<div class="banner warn"><b>Atención:</b> la nota del ${CX.fdate(d.bad.date)} no coincide con su huella de firma. Pudo haberse alterado fuera de la app.</div>`:''}
        <div class="btns"><button data-act="x:hc:nota" data-pid="${p.id}">+ Nota</button><button class="sec" data-act="x:hc:ficha" data-pid="${p.id}">Ficha</button></div>
        ${res.length?`<div class="box keep">${res.map(([k,v])=>`<div class="kv"><span>${k}</span><b style="white-space:pre-wrap">${esc(v)}</b></div>`).join('')}</div>`:`<p class="mut">Completá la ficha con el motivo de consulta, antecedentes y medicación para tenerlos siempre a la vista.</p>`}
        ${d.notes.length>5?`<input type="search" data-xinp="hc:q" value="${esc(a.q||'')}" placeholder="Buscar en las notas" autocomplete="off" style="margin-top:8px">`:''}
        <h3 class="sec">${d.notes.length} registro${d.notes.length===1?'':'s'}</h3>
        <div id="hclist">${list.map(n=>HC.noteHtml(n,folio.get(n._id))).join('')||`<div class="empty">${q?'Ninguna nota coincide.':'Todavía no hay notas. Cargá la primera con "+ Nota".'}</div>`}</div>
        <p class="mut">Cada nota se puede corregir durante 24 horas. Después queda firmada con tu nombre y solo admite aclaraciones. La historia clínica debe conservarse al menos 10 años.</p>`;
      }
    },
    cfg:{view(){
      return CX.head('Historia clínica')+`<form data-form="x:hc:cfg">
      <label>Secciones de cada nota (una por línea)</label><textarea name="secs" rows="5" class="keep">${esc(HC.secs().join('\n'))}</textarea>
      <p class="mut">Con una sola sección la nota es un único cuadro de texto, lo más rápido. Las secciones vacías no se guardan.</p>
      <label>Frases frecuentes (una por línea)</label><textarea name="phr" rows="10" class="keep">${esc(HC.phr().join('\n'))}</textarea>
      <p class="mut">Aparecen como botones al escribir una nota: un toque las inserta donde está el cursor.</p>
      <div class="btns"><button>Guardar</button><button type="button" class="sec" data-act="x:hc:reset">Volver a las de ${esc(CX.prof().n)}</button></div></form>`;
    }}
  },
  sheets:{
    nota(m){
      const p=pat(m.pid),n=m.note||{},secs=HC.secs(),dr=m.draft||n.secs||{};
      const keys=[...new Set([...secs,...Object.keys(n.secs||{})])];
      const last=m.last;
      return `<h1 class="sm">${esc(p.name)}</h1><div class="sub">${m.tipo==='acl'?'Aclaración sobre la nota del '+CX.fdate(m.refDate):esc(capital(longDate(m.date)))+(m.time?' · '+esc(m.time):'')}</div>
      <form data-form="x:hc:nota">
      ${keys.map((k,i)=>`${keys.length>1?`<label>${esc(k)}</label>`:'<div style="height:12px"></div>'}<textarea class="auto keep" name="s${i}" data-hcsec="${esc(k)}" data-xinp="hc:draft" rows="${keys.length>1?3:7}" placeholder="${keys.length>1?'':'Escribí o dictá la evolución…'}"${i===0?' autofocus':''}>${esc(dr[k]||'')}</textarea>`).join('')}
      <div class="phr">${last&&!m.id?`<button type="button" class="pill on" data-act="x:hc:copiar">Copiar la anterior</button>`:''}${HC.phr().map((x,i)=>`<button type="button" class="pill" data-act="x:hc:phr" data-i="${i}">${esc(x.trim())}</button>`).join('')}</div>
      ${last?`<details class="more"><summary>Ver la nota anterior (${CX.fdate(last.date)})</summary><div class="box keep" style="white-space:pre-wrap">${Object.entries(last.secs||{}).filter(([,v])=>v).map(([k,v])=>(Object.keys(last.secs).length>1?esc(k)+': ':'')+esc(v)).join('\n')}</div></details>`:''}
      ${m.tipo==='acl'||m.id?'':`<details class="more"><summary>Fecha: ${CX.fdate(m.date)} · cambiar</summary><div class="grid2"><div><label>Fecha</label><input type="date" name="date" value="${m.date}" max="${today()}"></div><div><label>Hora</label><input type="time" name="time" value="${esc(m.time||'')}"></div></div></details>`}
      ${CX.btns('Guardar')}</form>
      ${m.id?`<div class="row sp"><button class="lnk" data-act="x:hc:firmar" data-id="${m.id}" data-pid="${m.pid}">Firmar ahora</button><button class="dng" data-act="x:hc:borrar" data-id="${m.id}" data-pid="${m.pid}">Borrar borrador</button></div>`:''}
      <p class="mut">Se guarda sola mientras escribís. Podés corregirla durante 24 horas.</p>`;
    },
    ver(m){
      const n=m.note,p=pat(m.pid);
      return `<h1 class="sm">${esc(p.name)}</h1>${HC.noteHtml(n,m.folio)}
      <div class="box"><div class="kv"><span>Firmada</span><b>${new Date(n.closed).toLocaleString('es-AR',{dateStyle:'short',timeStyle:'short'})}</b></div><div class="kv"><span>Por</span><b>${esc(n.autor||'—')}${n.mat?' · Mat. '+esc(n.mat):''}</b></div><div class="kv"><span>Huella</span><b style="font-family:monospace;font-size:.8rem">${esc((n.hash||'').slice(0,16))}</b></div></div>
      <div class="btns"><button data-act="x:hc:acl" data-id="${n._id}" data-pid="${m.pid}">Agregar aclaración</button><button class="sec" data-act="x:close">Cerrar</button></div>
      <p class="mut">Una nota firmada no se modifica ni se borra. Si hay un error, se agrega una aclaración que queda vinculada.</p>`;
    },
    ficha(m){
      const f=m.fi.f||{},p=pat(m.pid);
      return `<h1 class="sm">Ficha de ${esc(first(p))}</h1><form data-form="x:hc:ficha">
      ${HC.FIELDS.map(([k,l,t])=>`<label>${l}</label>${t==='area'?`<textarea name="${k}" rows="2" class="keep">${esc(f[k])}</textarea>`:`<input type="${t}" name="${k}" value="${esc(f[k]||(k==='dni'?p.dni:''))}">`}`).join('')}
      ${CX.btns()}</form>${(m.fi.hist||[]).length?`<p class="mut">Modificada ${m.fi.hist.length} ${m.fi.hist.length===1?'vez':'veces'}. Las versiones anteriores quedan guardadas.</p>`:''}`;
    },
    docs(m){
      const p=pat(m.pid);
      return `<h1 class="sm">Documentos</h1><div class="sub">${esc(p.name)}</div>
      ${CX.item('x:hc:exp',{pid:p.id},'Copia de la historia clínica','Para imprimir o entregar al paciente como PDF')}
      ${CX.item('x:hc:const',{pid:p.id},'Constancia de asistencia','Del último turno al que asistió')}
      <h3 class="sec">Consentimientos</h3>
      ${Object.entries(HC.CONS).map(([k,c])=>CX.item('x:hc:cons',{pid:p.id,k},'Consentimiento: '+esc(c.n),'Imprimir para firmar y registrar la firma')).join('')}
      <p class="mut">Los textos son modelos generales. Adaptalos a tu práctica y a lo que indique tu colegio profesional.</p>
      <div class="btns"><span></span><button class="sec" data-act="x:close">Cerrar</button></div>`;
    },
    cons(m){
      const p=pat(m.pid),c=HC.CONS[m.k];
      return `<h1 class="sm">Consentimiento: ${esc(c.n)}</h1><form data-form="x:hc:cons">
      <textarea name="txt" rows="14" class="keep" style="font-size:.9rem">${esc(m.txt||c.t(p,S.settings))}</textarea>
      <div class="btns"><button>Imprimir para firmar</button><button type="button" class="sec" data-act="x:hc:consfirma">Registrar que lo firmó</button></div></form>
      <button class="lnk" data-act="x:close">Cerrar</button>`;
    }
  },
  inp:{
    q(t){const pg=CX.page();pg.args.q=t.value;const d=pg.data,q=norm(t.value);
      const folio=new Map(d.notes.slice().sort((x,y)=>x.at-y.at).map((n,i)=>[n._id,i+1]));
      const l=document.getElementById('hclist');if(l)l.innerHTML=d.notes.slice().reverse().filter(n=>!q||norm(Object.values(n.secs||{}).join(' ')).includes(q)).map(n=>HC.noteHtml(n,folio.get(n._id))).join('')||'<div class="empty">Ninguna nota coincide.</div>'},
    draft(t){
      const m=CX.ui.modal;if(!m||m.t!=='hc:nota')return;
      m.draft=HC.read(t.form);clearTimeout(HC.dt);HC.dt=setTimeout(HC.saveDraft,1200);
    }
  },
  acts:{
    async pac(d){await CX.go('hc:pac',{id:d.id})},
    async nota(d){
      const p=pat(d.pid);if(!p)return;
      const s=d.sid?S.sessions.find(x=>x.id===d.sid):null;
      const id=s?'n-'+s.id:null;
      let note=id?await CX.vault.get(id):null;
      if(note&&!HC.editable(note)){return HC.openView(note)}
      const all=await HC.notes(p.id);
      const last=all.filter(n=>n.tipo!=='cons'&&(!note||n._id!==note._id)).pop()||null;
      const dr=await CX.vault.get('draft-'+(id||p.id));
      CX.sheet('hc:nota',{pid:p.id,sid:s?s.id:'',id:note?note._id:'',note,last,date:note?note.date:s?s.date:today(),time:note?note.time:s?s.time:'',draft:dr?dr.secs:null});
    },
    async abrir(d){
      const n=await CX.vault.get(d.id);if(!n)return;
      if(n.tipo==='cons')return;
      if(HC.editable(n)){
        const all=await HC.notes(n.pid),last=all.filter(x=>x._id!==n._id&&x.tipo!=='cons'&&x.at<n.at).pop()||null;
        CX.sheet('hc:nota',{pid:n.pid,sid:n.sid||'',id:n._id,note:n,last,date:n.date,time:n.time,tipo:n.tipo,refDate:n.refDate});
      }else HC.openView(n);
    },
    async acl(d){
      const n=await CX.vault.get(d.id);if(!n)return;
      CX.sheet('hc:nota',{pid:d.pid,tipo:'acl',ref:n._id,refDate:n.date,date:today(),time:''});
    },
    phr(d,t){
      const f=t.closest('form'),ta=(HC.focus&&f.contains(HC.focus))?HC.focus:f.querySelector('textarea');
      const txt=HC.phr()[+d.i]||'';
      const a=ta.selectionStart??ta.value.length,b=ta.selectionEnd??a;
      const pre=ta.value.slice(0,a),sep=pre&&!/\s$/.test(pre)?' ':'';
      ta.value=pre+sep+txt+ta.value.slice(b);
      const pos=(pre+sep+txt).length;ta.focus();ta.setSelectionRange(pos,pos);
      CX.mods.hc.inp.draft(ta);
    },
    copiar(d,t){
      const m=CX.ui.modal,f=t.closest('form');if(!m.last)return;
      f.querySelectorAll('textarea[data-hcsec]').forEach(ta=>{const v=m.last.secs[ta.dataset.hcsec];if(v&&!ta.value.trim())ta.value=v});
      CX.mods.hc.inp.draft(f.querySelector('textarea'));
    },
    async firmar(d){
      if(!confirm('¿Firmar la nota ahora? Después no se va a poder modificar, solo agregar aclaraciones.'))return;
      const f=document.querySelector('form[data-form="x:hc:nota"]');
      if(f)await HC.store(f,true);
      await HC.closeDue(d.pid,d.id);CX.log('hc_nota',{pid:d.pid});await save();
      CX.ui.modal=null;await CX.refresh();toast('Nota firmada');
    },
    async borrar(d){
      const n=await CX.vault.get(d.id);if(!n||!HC.editable(n))return;
      if(!confirm('¿Borrar este borrador? Todavía no está firmado.'))return;
      await CX.vault.del(d.id);await CX.vault.del('draft-'+d.id);CX.ui.modal=null;await CX.refresh();
    },
    async ficha(d){CX.sheet('hc:ficha',{pid:d.pid,fi:await HC.ficha(d.pid)})},
    docs(d){CX.sheet('hc:docs',{pid:d.pid})},
    cons(d){CX.sheet('hc:cons',{pid:d.pid,k:d.k})},
    async consfirma(){
      const m=CX.ui.modal,f=document.querySelector('form[data-form="x:hc:cons"]');
      const txt=f?f.elements.txt.value:'';
      const now=Date.now();
      await CX.vault.put('note',m.pid,{pid:m.pid,tipo:'cons',date:today(),time:'',at:now,secs:{[`Consentimiento informado: ${HC.CONS[m.k].n}`]:'Firmado en papel por el paciente o su representante. Texto entregado:\n\n'+txt}});
      await HC.closeDue(m.pid);await save();
      CX.ui.modal=null;await CX.refresh();toast('Firma registrada en la historia clínica');
    },
    async exp(d){
      const p=pat(d.pid);if(!p)return;
      await HC.closeDue(p.id);
      const notes=(await HC.notes(p.id)).sort((a,b)=>a.at-b.at),fi=await HC.ficha(p.id),f=fi.f||{};
      const abiertas=notes.filter(n=>!n.closed).length;
      const body=`<h1>Historia clínica</h1><div class="meta">${CX.profLine()}</div>${CX.cfg('panel').dom?`<div class="meta">${esc(CX.cfg('panel').dom)}</div>`:''}
      <h2>Datos del paciente</h2><table>${[['Nombre',p.name],...HC.FIELDS.map(([k,l,t])=>[l,t==='date'?CX.fdate(f[k]):f[k]||(k==='dni'?p.dni:'')])].filter(r=>r[1]).map(r=>`<tr><th style="width:32%">${esc(r[0])}</th><td class="pre">${esc(r[1])}</td></tr>`).join('')}</table>
      <h2>Registros (${notes.length})</h2>
      ${notes.map((n,i)=>`<div class="box"><b>Folio ${i+1} · ${CX.fdate(n.date)}${n.time?' '+esc(n.time):''}${n.tipo==='acl'?' · Aclaración sobre la nota del '+CX.fdate(n.refDate):n.tipo==='cons'?' · Consentimiento':''}</b>
      ${Object.entries(n.secs||{}).filter(([,v])=>v&&v.trim()).map(([k,v])=>`<div class="pre"><i>${esc(k)}:</i> ${esc(v.trim())}</div>`).join('')}
      <div class="small">${n.closed?`Firmado electrónicamente por ${esc(n.autor||S.settings.name||'')}${n.mat?' (Mat. '+esc(n.mat)+')':''} el ${new Date(n.closed).toLocaleString('es-AR')} · huella ${esc((n.hash||'').slice(0,16))}`:'Borrador sin firmar'}</div></div>`).join('')||'<p>Sin registros.</p>'}
      <p class="small">Copia emitida el ${new Date().toLocaleString('es-AR')}. El paciente es titular de su historia clínica (Ley 26.529, art. 14). Documento confidencial amparado por el secreto profesional.</p>
      <div class="sig"><div>Firma y sello del profesional</div><div>Recibí copia · firma y aclaración</div></div>`;
      CX.log('hc_exp',{pid:p.id});await save();
      CX.print(`Historia clínica ${p.name}`,body,abiertas?`Hay ${abiertas} nota(s) todavía sin firmar: figuran como borrador.`:'Contiene datos de salud: entregala solo al paciente o a quien él autorice.');
    },
    async const(d){
      const p=pat(d.pid);if(!p)return;
      const s=d.sid?S.sessions.find(x=>x.id===d.sid):S.sessions.filter(x=>x.pid===p.id&&x.status==='asistio').sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).pop();
      if(!s){toast('No hay turnos con asistencia para este paciente');return}
      const dur=s.dur||CX.prof().dur,[h,mi]=s.time.split(':').map(Number),end=new Date(2000,0,1,h,mi+dur);
      const fi=CX.vault.ok?await HC.ficha(p.id):{f:{}};
      const body=`<h1>Constancia de asistencia</h1><div class="meta">${CX.profLine()}</div>${CX.cfg('panel').dom?`<div class="meta">${esc(CX.cfg('panel').dom)}</div>`:''}
      <p style="margin-top:28px;font-size:14px;line-height:1.8">Dejo constancia de que <b>${esc(p.name)}</b>${(fi.f&&fi.f.dni)||p.dni?', DNI '+esc((fi.f&&fi.f.dni)||p.dni)+',':''} concurrió a mi consultorio el día <b>${esc(longDate(s.date))} de ${s.date.slice(0,4)}</b>, de ${esc(s.time)} a ${pad(end.getHours())}:${pad(end.getMinutes())} horas.</p>
      <p style="font-size:14px;line-height:1.8">Se extiende la presente a pedido del interesado, para ser presentada ante quien corresponda.</p>
      <p class="meta" style="margin-top:20px">Fecha de emisión: ${CX.fdate(today())}</p>
      <div class="sig"><div style="visibility:hidden"></div><div>Firma y sello</div></div>`;
      CX.print(`Constancia ${p.name} ${s.date}`,body,'La constancia no incluye diagnóstico ni motivo de consulta.');
    },
    async reset(){const c=CX.cfg('hc');delete c.secs;delete c.phr;CX.seed(true);await save();render();toast('Secciones y frases restablecidas')}
  },
  forms:{
    async nota(v,f){await HC.store(f,false);CX.ui.modal=null;await save();await CX.refresh();toast('Nota guardada')},
    async ficha(v){
      const m=CX.ui.modal,fi=m.fi,nf={};
      for(const [k] of HC.FIELDS)if((v[k]||'').trim())nf[k]=v[k].trim();
      if(JSON.stringify(nf)!==JSON.stringify(fi.f||{})){
        if(Object.keys(fi.f||{}).length)(fi.hist=fi.hist||[]).push({t:Date.now(),f:fi.f});
        fi.f=nf;await CX.vault.put('ficha',m.pid,{f:fi.f,hist:fi.hist||[]},'ficha-'+m.pid);await save();
      }
      CX.ui.modal=null;await CX.refresh();
    },
    cons(v){
      const m=CX.ui.modal,p=pat(m.pid);m.txt=v.txt;
      const [tit,...rest]=v.txt.split('\n');
      CX.print(`Consentimiento ${p.name}`,`<h1>${esc(tit)}</h1><div class="meta">${CX.profLine()}</div><div class="pre" style="margin-top:18px;font-size:13.5px;line-height:1.7">${esc(rest.join('\n').trim())}</div><div class="sig"><div>Firma y aclaración del paciente o representante</div><div>Firma y sello del profesional</div></div>`,'Imprimí dos copias: una queda para el paciente.');
    },
    async cfg(v){
      const c=CX.cfg('hc');
      c.secs=v.secs.split('\n').map(s=>s.trim()).filter(Boolean).slice(0,8);
      c.phr=v.phr.split('\n').map(s=>s.replace(/\s+$/,' ')).filter(s=>s.trim()).slice(0,40);
      if(!c.secs.length)c.secs=[...CX.prof().secs];
      await save();CX.back();toast('Guardado');
    }
  },
  intercepts:{},
  inject(app){
    if(!CX.vault.ok)return;
    if(ui.tab==='hoy'){
      app.querySelectorAll('.item[data-act="opensess"]').forEach(row=>{
        const s=S.sessions.find(x=>x.id===row.dataset.id);if(!s||s.status!=='asistio')return;
        const has=CX.idx[s.pid]&&CX.idx[s.pid].note&&CX.idx[s.pid].note.ids.has('n-'+s.id);
        const g=row.querySelector('.grow');if(!g)return;
        let box=g.querySelector('.xrow');if(!box){box=document.createElement('div');box.className='xrow';box.style.margin='6px 0 0';const old=g.querySelector('[data-act="cobrarrow"]');if(old){box.appendChild(old);g.lastElementChild&&!g.lastElementChild.children.length&&g.lastElementChild.remove()}g.appendChild(box)}
        box.insertAdjacentHTML('beforeend',`<button type="button" class="pill ${has?'done':'ghost'}" data-act="x:hc:nota" data-pid="${s.pid}" data-sid="${s.id}">${has?'✓ Nota':'+ Nota'}</button>`);
      });
    }
    if(ui.tab==='pac'&&ui.pid&&!ui.modal){
      const b=app.querySelector('.btns');const n=CX.count(ui.pid,'note');
      if(b)b.insertAdjacentHTML('afterend',`<div class="item" data-act="x:hc:pac" data-id="${ui.pid}" id="hcrow"><div class="grow"><div><b>Historia clínica</b></div><div class="sub">${n?`${n} registro${n===1?'':'s'}`:'Sin notas todavía'}</div></div><span class="mut">›</span></div>`);
    }
    if(ui.modal&&ui.modal.t==='ses'&&ui.modal.id){
      const s=S.sessions.find(x=>x.id===ui.modal.id),sh=app.querySelector('.modal .sheet .sub');
      if(s&&sh){const has=CX.idx[s.pid]&&CX.idx[s.pid].note&&CX.idx[s.pid].note.ids.has('n-'+s.id);
        sh.insertAdjacentHTML('afterend',`<div class="xrow"><button type="button" class="pill ${has?'done':''}" data-act="x:hc:nota" data-pid="${s.pid}" data-sid="${s.id}">${has?'✓ Ver nota clínica':'+ Nota clínica'}</button>${s.status==='asistio'?`<button type="button" class="pill ghost" data-act="x:hc:const" data-pid="${s.pid}" data-sid="${s.id}">Constancia</button>`:''}</div>`)}
    }
  }
});

HC.read=function(f){const o={};f.querySelectorAll('textarea[data-hcsec]').forEach(t=>{if(t.value.trim())o[t.dataset.hcsec]=t.value});return o};
HC.saveDraft=async function(){
  const m=CX.ui.modal;if(!m||m.t!=='hc:nota'||!m.draft||!CX.vkey)return;
  const key='draft-'+(m.id||(m.sid?'n-'+m.sid:m.pid));
  try{await CX.vault.put('draft',m.pid,{secs:m.draft},key)}catch(_){}
};
HC.store=async function(f,keepOpen){
  const m=CX.ui.modal,secs=HC.read(f);clearTimeout(HC.dt);
  const id=m.id||(m.sid?'n-'+m.sid:uid());
  if(!Object.keys(secs).length){if(m.id&&m.note&&HC.editable(m.note))await CX.vault.del(m.id);await CX.vault.del('draft-'+id);await CX.vault.del('draft-'+m.pid);return}
  const base=m.note||{pid:m.pid,sid:m.sid||'',at:Date.now(),tipo:m.tipo||'nota'};
  if(m.note&&!HC.editable(m.note))return;
  const n={...base,secs,date:(f.elements.date&&f.elements.date.value)||m.date,time:(f.elements.time&&f.elements.time.value)||m.time||''};
  if(m.tipo==='acl'){n.ref=m.ref;n.refDate=m.refDate}
  await CX.vault.put('note',m.pid,n,id);
  await CX.vault.del('draft-'+id);await CX.vault.del('draft-'+m.pid);
  m.id=id;
};
HC.openView=async function(n){
  const all=(await HC.notes(n.pid)).sort((a,b)=>a.at-b.at);
  CX.sheet('hc:ver',{pid:n.pid,note:n,folio:all.findIndex(x=>x._id===n._id)+1});
};
/* si la app pasa a segundo plano, el borrador se guarda al instante */
document.addEventListener('visibilitychange',()=>{if(document.hidden)HC.saveDraft()},true);

/* la historia clínica se conserva: no se elimina un paciente que tiene registros */
CX.intercept.delpat=function(d){
  if(!CX.on('hc')||!CX.count(d.id,'note'))return false;
  alert('Este paciente tiene historia clínica, que por ley debe conservarse al menos 10 años desde la última atención. Podés archivarlo: se oculta de las listas y conserva todo.');
  return true;
};
/* limpieza: si se eliminó un paciente sin notas, se borran su ficha y borradores */
CX.listen('save',async()=>{
  if(!CX.vault.ok||!CX.vkey)return;
  for(const pid of Object.keys(CX.idx)){
    if(pid==='_'||pat(pid)||CX.count(pid,'note'))continue;
    for(const k of Object.keys(CX.idx[pid]))for(const id of [...CX.idx[pid][k].ids])await CX.vault.del(id);
  }
});
