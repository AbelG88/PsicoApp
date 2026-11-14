'use strict';
/* Facturación y números: comprobantes (factura asistida para ARCA y recibos),
   gastos del consultorio, reportes y exportaciones. */
const FAC={
  ARCA:'https://auth.afip.gob.ar/contribuyente_/login.xhtml',
  IVA:{cf:'Consumidor Final',mono:'Responsable Monotributo',ri:'IVA Responsable Inscripto',ex:'IVA Sujeto Exento'},
  COND:{mono:'Monotributista',ri:'Responsable inscripto',ex:'Exento en IVA'},
  CATS:['Alquiler','Monotributo','Matrícula y colegio','Seguro de mala praxis','Supervisión y formación','Insumos','Servicios','Otros'],
  cfg:()=>CX.cfg('fac'),
  /* conector para emisión real (modo online): si un proveedor se registra acá, aparece "Emitir ahora" */
  provider:null,
  tipo(iva){const c=FAC.cfg().cond||'mono';return c==='ri'?(iva==='ri'?'A':'B'):'C'},
  cobrado(ym){return S.payments.filter(x=>x.date.startsWith(ym)).reduce((a,x)=>a+(+x.amount||0),0)+S.sessions.filter(s=>s.osSt==='cobr'&&s.cobFecha&&s.cobFecha.startsWith(ym)).reduce((a,s)=>a+(+s.osAmt||0),0)},
  gastado(ym){return S.x.exp.filter(x=>x.date.startsWith(ym)).reduce((a,x)=>a+(+x.amount||0),0)},
  ymAdd(ym,n){const d=new Date(ym+'-15T12:00');d.setMonth(d.getMonth()+n);return dstr(d).slice(0,7)},
  /* cobros de pacientes que todavía no tienen comprobante */
  pendPat(){
    const by={};
    for(const x of S.payments){if(x.inv||!(+x.amount>0))continue;const p=pat(x.pid);if(!p)continue;(by[x.pid]=by[x.pid]||{p,list:[],total:0}).list.push(x);by[x.pid].total+=+x.amount}
    return Object.values(by).sort((a,b)=>b.total-a.total);
  },
  /* sesiones presentadas o cobradas a obras sociales, sin factura */
  pendFin(){
    const by={};
    for(const s of S.sessions){if(s.finv||!s.fid||!osBill(s)||(s.osSt!=='pres'&&s.osSt!=='cobr'))continue;const f=fin(s.fid);if(!f)continue;const k=s.fid+'|'+s.date.slice(0,7);(by[k]=by[k]||{f,ym:s.date.slice(0,7),list:[],total:0}).list.push(s);by[k].total+=+s.osAmt||0}
    return Object.values(by).filter(g=>g.total>0).sort((a,b)=>a.ym.localeCompare(b.ym));
  },
  ult12(){const from=addMonths(today(),-12);return S.x.inv.filter(i=>i.kind==='fac'&&i.st==='ok'&&i.date>from).reduce((a,i)=>a+(i.nc?-1:1)*(+i.total||0),0)},
  cob12(){let t=0;for(let i=0;i<12;i++)t+=FAC.cobrado(FAC.ymAdd(today().slice(0,7),-i));return t},
  numero:i=>i.num?`${String(i.pv||FAC.cfg().pv||'').padStart(5,'0')}-${String(i.num).padStart(8,'0')}`:'',
  draft(m){
    const c=FAC.cfg(),term=CX.term(true);
    if(m.pid){
      const p=pat(m.pid),g=FAC.pendPat().find(x=>x.p.id===m.pid),list=g?g.list:[];
      const ds=list.map(x=>x.date).sort();
      return {kind:'fac',pid:p.id,name:p.name,doc:p.dni||'',iva:'cf',payIds:list.map(x=>x.id),total:g?g.total:0,from:ds[0]||today(),to:ds[ds.length-1]||today(),
        desc:c.desc||`Honorarios profesionales`,venta:list.length&&list.every(x=>x.method==='Efectivo')?'Contado':'Transferencia bancaria'};
    }
    const g=FAC.pendFin().find(x=>x.f.id===m.fid&&x.ym===m.ym),f=fin(m.fid),fx=S.x.finx[m.fid]||{};
    const list=g?g.list:[];
    return {kind:'fac',fid:f.id,ym:m.ym,name:fx.razon||f.name,doc:fx.cuit||'',iva:fx.iva||'ri',sesIds:list.map(s=>s.id),total:g?g.total:0,from:m.ym+'-01',to:dstr(new Date(+m.ym.slice(0,4),+m.ym.slice(5,7),0)),
      desc:`${c.desc||'Honorarios profesionales'} · ${list.length} ${term} · ${capital(monthName(m.ym))}`,venta:'Cuenta corriente'};
  }
};

CX.def('fac',{
  name:'Facturación y reportes',desc:'Facturas para ARCA con ayuda paso a paso, recibos, gastos, reportes y exportación a Excel',
  panel:[{sec:'fun',title:'Facturación: datos fiscales',p:'fac:cfg',sub:()=>{const c=FAC.cfg();return esc(FAC.COND[c.cond||'mono'])+(c.pv?' · punto de venta '+esc(c.pv):'')}}],
  pages:{
    home:{view(){
      const c=FAC.cfg(),pp=FAC.pendPat(),pf=FAC.pendFin();
      const emit=[...S.x.inv].sort((a,b)=>(b.date+b.id).localeCompare(a.date+a.id)).slice(0,40);
      const base=FAC.ult12()||FAC.cob12(),tope=+c.tope||0,pct=tope?Math.min(100,Math.round(base/tope*100)):0;
      const pagos=[...S.payments].sort((a,b)=>(b.date+b.id).localeCompare(a.date+a.id)).slice(0,8);
      return CX.head('Comprobantes',`<button class="lnk" data-act="x:go" data-p="fac:cfg">Datos fiscales</button>`)+`
      ${S.settings.cuit&&c.pv?'':`<div class="banner">Cargá tu CUIT y punto de venta para que la app prepare cada factura.<div class="row"><button class="sm" data-act="x:go" data-p="fac:cfg">Completar</button></div></div>`}
      ${tope?`<div class="sub" style="margin-top:14px">${FAC.ult12()?'Facturado':'Cobrado'} en los últimos 12 meses</div><div class="med">${money(base)} <span class="sub">de ${money(tope)}</span></div><div class="hbar${pct>=90?' bad':pct>=75?' warn':''}"><i style="width:${Math.max(1,pct)}%"></i></div><div class="sub" style="margin-top:4px">${pct}% del tope de tu categoría${pct>=90?' · <span class="bad">consultá con tu contador/a</span>':''}</div>`:''}
      <h3 class="sec">Por facturar${pp.length+pf.length?` · ${money(pp.reduce((a,x)=>a+x.total,0)+pf.reduce((a,x)=>a+x.total,0))}`:''}</h3>
      ${pp.map(g=>`<div class="item col"><div class="grow"><div>${esc(g.p.name)}</div><div class="sub">${g.list.length} cobro${g.list.length>1?'s':''} · ${CX.fdate(g.list.map(x=>x.date).sort()[0])}${g.list.length>1?' en adelante':''}</div></div><div><b>${money(g.total)}</b></div>
        <div class="row" style="width:100%;justify-content:flex-end"><button class="sm" data-act="x:fac:nueva" data-pid="${g.p.id}">Facturar</button><button class="sec sm" data-act="x:fac:omitir" data-pid="${g.p.id}">No facturo</button></div></div>`).join('')}
      ${pf.map(g=>`<div class="item col"><div class="grow"><div>${esc(g.f.name)}</div><div class="sub">${esc(capital(monthName(g.ym)))} · ${g.list.length} ${CX.term(true)}</div></div><div><b>${money(g.total)}</b></div>
        <div class="row" style="width:100%;justify-content:flex-end"><button class="sm" data-act="x:fac:nueva" data-fid="${g.f.id}" data-ym="${g.ym}">Facturar</button></div></div>`).join('')}
      ${pp.length+pf.length?'':'<div class="empty">No hay cobros sin comprobante.</div>'}
      <h3 class="sec">Comprobantes</h3>
      ${emit.map(i=>`<div class="item" data-act="x:fac:ver" data-id="${i.id}"><div class="time">${shortDate(i.date)}</div><div class="grow"><div>${esc(i.name)}</div><div class="sub">${i.kind==='rec'?'Recibo '+esc(i.num):i.st==='ok'?`Factura ${esc(i.tipo)} ${FAC.numero(i)}`:i.st==='anul'?'<span class="bad">Anulada</span>':'<span class="warnt">Preparada, falta emitir en ARCA</span>'}</div></div><div>${money(i.total)}</div></div>`).join('')||'<div class="empty">Todavía no hay comprobantes.</div>'}
      <h3 class="sec">Recibo de un cobro</h3>
      ${pagos.map(x=>{const p=pat(x.pid);return p?`<div class="item"><div class="time">${shortDate(x.date)}</div><div class="grow"><div>${esc(p.name)}</div><div class="sub">${esc(x.method||'')} · ${money(x.amount)}</div></div><button class="lnk" data-act="x:fac:recibo" data-id="${x.id}">${x.rec?'Ver recibo':'Recibo'}</button></div>`:''}).join('')||'<div class="empty">Sin cobros.</div>'}
      <p class="mut">La factura electrónica se emite en ARCA: la app prepara los datos para copiarlos y guarda el número y el CAE. El recibo es una constancia de pago y no reemplaza a la factura.</p>`;
    }},
    cfg:{view(){
      const c=FAC.cfg(),st=S.settings;
      return CX.head('Datos fiscales')+`<form data-form="x:fac:cfg">
      <label>Condición frente al IVA</label><select name="cond">${Object.entries(FAC.COND).map(([k,v])=>`<option value="${k}"${(c.cond||'mono')===k?' selected':''}>${v}</option>`).join('')}</select>
      <div class="grid2"><div><label>CUIT</label><input name="cuit" inputmode="numeric" value="${esc(st.cuit)}"></div><div><label>Punto de venta</label><input name="pv" inputmode="numeric" value="${esc(c.pv)}" placeholder="Ej: 2"></div></div>
      <label>Descripción habitual del servicio</label><input name="desc" value="${esc(c.desc||'Honorarios profesionales')}">
      <label>Tope anual de facturación de tu categoría</label><input type="number" name="tope" min="0" step="any" value="${c.tope||''}" placeholder="Opcional: lo ves en ARCA o te lo dice tu contador/a">
      <p class="mut">Con el tope, la app te avisa cuánto llevás facturado en 12 meses. Los topes cambian: actualizalo en cada recategorización.</p>
      <h3 class="sec">Obras sociales y prepagas: datos para facturarles</h3>
      ${S.fin.map(f=>{const fx=S.x.finx[f.id]||{};return CX.item('x:sheet',{s:'fac:finx',id:f.id},esc(f.name),fx.cuit?'CUIT '+esc(fx.cuit)+' · '+FAC.IVA[fx.iva||'ri']:'<span class="warnt">Falta CUIT y razón social</span>')}).join('')||'<div class="mut">No cargaste obras sociales.</div>'}
      <div class="btns"><button>Guardar</button><button type="button" class="sec" data-act="x:back">Cancelar</button></div></form>`;
    }},
    gastos:{view(a){
      const m=a.m||ui.month,list=S.x.exp.filter(x=>x.date.startsWith(m)).sort((x,y)=>y.date.localeCompare(x.date)),tot=list.reduce((s,x)=>s+(+x.amount||0),0);
      const cob=FAC.cobrado(m),by={};for(const x of list)by[x.cat]=(by[x.cat]||0)+(+x.amount||0);
      return CX.head('Gastos')+`<div class="datenav"><button class="icon" data-act="x:fac:gmes" data-m="${FAC.ymAdd(m,-1)}" aria-label="Mes anterior">‹</button><b>${esc(capital(monthName(m)))}</b><button class="icon" data-act="x:fac:gmes" data-m="${FAC.ymAdd(m,1)}" aria-label="Mes siguiente">›</button></div>
      <div class="sub" style="margin-top:12px">Gastos del mes</div><div class="big">${money(tot)}</div>
      <div class="kpis" style="grid-template-columns:1fr 1fr"><div><div class="sub">Cobrado</div><b>${money(cob)}</b></div><div><div class="sub">Te queda</div><b class="${cob-tot<0?'bad':''}">${money(cob-tot)}</b></div></div>
      ${Object.entries(by).sort((x,y)=>y[1]-x[1]).map(([k,v])=>`<div class="kv"><span>${esc(k)}</span><b>${money(v)}</b></div>`).join('')}
      <h3 class="sec">Movimientos</h3>
      ${list.map(x=>`<div class="item" data-act="x:sheet" data-s="fac:gasto" data-id="${x.id}"><div class="time">${shortDate(x.date)}</div><div class="grow"><div>${esc(x.cat)}</div>${x.note?`<div class="sub">${esc(x.note)}</div>`:''}</div><div>${money(x.amount)}</div></div>`).join('')||'<div class="empty">Sin gastos cargados este mes.</div>'}
      ${S.x.exp.some(x=>x.fijo&&x.date.startsWith(FAC.ymAdd(m,-1)))&&!list.some(x=>x.fijo)?`<div style="margin-top:10px"><button class="sec sm" data-act="x:fac:repetir" data-m="${m}">Repetir los gastos fijos del mes anterior</button></div>`:''}
      <button class="fab" data-act="x:sheet" data-s="fac:gasto" aria-label="Nuevo gasto">+</button>`;
    }},
    rep:{view(a){
      const y=a.y||today().slice(0,4),months=[...Array(12)].map((_,i)=>y+'-'+pad(i+1));
      const cob=months.map(FAC.cobrado),gas=months.map(FAC.gastado),max=Math.max(1,...cob);
      const tc=cob.reduce((s,v)=>s+v,0),tg=gas.reduce((s,v)=>s+v,0);
      const ses=S.sessions.filter(s=>s.date.startsWith(y)),n=k=>ses.filter(s=>s.status===k).length;
      const cerr=n('asistio')+n('falto')+n('cancelo')+n('cancelo_tarde'),aus=cerr?Math.round((n('falto')+n('cancelo_tarde'))/cerr*100):0;
      const pays=S.payments.filter(x=>x.date.startsWith(y)),byM={};for(const x of pays)byM[x.method||'Otro']=(byM[x.method||'Otro']||0)+(+x.amount||0);
      const byF={Particular:0};for(const s of ses){if(charged(s))byF.Particular+=+s.fee||0;if(osBill(s)){const f=fin(s.fid);const k=f?f.name:'Obra social';byF[k]=(byF[k]||0)+(+s.osAmt||0)}}
      const act=new Set(ses.filter(s=>s.status==='asistio').map(s=>s.pid)).size;
      const deuda=S.patients.reduce((s,p)=>s+Math.max(0,balance(p.id)),0),osd=S.fin.reduce((s,f)=>s+finStats(f.id).total,0);
      const cur=today().slice(0,7),ML=['E','F','M','A','M','J','J','A','S','O','N','D'];
      const rows=o=>Object.entries(o).filter(x=>x[1]>0).sort((x,z)=>z[1]-x[1]).map(([k,v])=>`<div class="kv"><span>${esc(k)}</span><b>${money(v)}</b></div>`).join('')||'<div class="mut">Sin datos.</div>';
      return CX.head('Reportes')+`<div class="datenav"><button class="icon" data-act="x:fac:ryear" data-y="${+y-1}" aria-label="Año anterior">‹</button><b>${y}</b><button class="icon" data-act="x:fac:ryear" data-y="${+y+1}" aria-label="Año siguiente">›</button></div>
      <div class="sub" style="margin-top:12px">Cobrado en ${y}</div><div class="big">${money(tc)}</div>
      <div class="bars">${months.map((m,i)=>`<div><i class="${m>cur?'cur':''}" style="height:${Math.round(cob[i]/max*100)}%" title="${money(cob[i])}"></i><span>${ML[i]}</span></div>`).join('')}</div>
      <div class="kpis"><div><div class="sub">Gastos</div><b>${money(tg)}</b></div><div><div class="sub">Te quedó</div><b>${money(tc-tg)}</b></div><div><div class="sub">Promedio mes</div><b>${money(tc/Math.max(1,months.filter((m,i)=>m<=cur&&(cob[i]||gas[i])).length))}</b></div></div>
      <h3 class="sec">Mes por mes</h3>
      ${months.filter((m,i)=>cob[i]||gas[i]).map((m)=>{const i=months.indexOf(m);return `<div class="kv"><span>${esc(capital(monthName(m).split(' ')[0]))}</span><b>${money(cob[i])}${gas[i]?` <span class="sub">− ${money(gas[i])} = ${money(cob[i]-gas[i])}</span>`:''}</b></div>`}).join('')||'<div class="mut">Sin movimientos este año.</div>'}
      <h3 class="sec">Asistencia</h3>
      <div class="kv"><span>Turnos atendidos</span><b>${n('asistio')}</b></div><div class="kv"><span>Faltas y cancelaciones tardías</span><b>${n('falto')+n('cancelo_tarde')} · ${aus}%</b></div><div class="kv"><span>Cancelaciones con aviso</span><b>${n('cancelo')}</b></div><div class="kv"><span>Pacientes atendidos</span><b>${act}</b></div>
      <h3 class="sec">Cobros por medio de pago</h3>${rows(byM)}
      <h3 class="sec">Trabajo facturado por origen</h3>${rows(byF)}
      <h3 class="sec">Pendiente de cobro hoy</h3>
      <div class="kv"><span>Pacientes</span><b class="${deuda?'bad':''}">${money(deuda)}</b></div><div class="kv"><span>Obras sociales</span><b>${money(osd)}</b></div>
      <h3 class="sec">Exportar a Excel</h3>
      <div class="row wrap">${[['cobros','Cobros'],['turnos','Turnos'],['gastos','Gastos'],['comp','Comprobantes'],['pacientes','Pacientes']].map(([k,l])=>`<button class="sec sm" data-act="x:fac:csv" data-k="${k}" data-y="${y}">${l}</button>`).join('')}</div>
      <p class="mut">Cada archivo incluye los datos de ${y} (pacientes: todos) y se abre con Excel o Google Sheets. Son datos sin cifrar: cuidá a quién se los mandás.</p>`;
    }}
  },
  sheets:{
    nueva(m){
      const c=FAC.cfg(),d=m.inv||FAC.draft(m),tipo=FAC.tipo(d.iva);
      const row=(l,v,copy=true)=>`<div class="kv"><span>${l}</span><b class="keep">${esc(v)}</b>${copy&&v?`<button type="button" class="sec sm" data-act="x:fac:copy" data-v="${esc(v)}">Copiar</button>`:''}</div>`;
      const dni=d.iva==='cf'?(d.doc?'DNI '+d.doc:'Sin identificar'):('CUIT '+(d.doc||'—'));
      return `<h1 class="sm">Factura ${tipo} · ${esc(d.name)}</h1><div class="sub">Paso 1: cargá estos datos en ARCA, en "Comprobantes en línea".</div>
      <div class="box">
      ${row('Punto de venta',c.pv||'Falta cargar',false)}${row('Tipo','Factura '+tipo,false)}${row('Fecha',CX.fdate(today()),false)}
      ${row('Concepto','Servicios',false)}${row('Período',CX.fdate(d.from)+' al '+CX.fdate(d.to),false)}
      ${row('Condición IVA',FAC.IVA[d.iva],false)}${(d.doc?row(d.iva==='cf'?'Documento':'CUIT',d.doc):row(d.iva==='cf'?'Documento':'CUIT',d.iva==='cf'?'No hace falta':'Falta cargar',false))}${row('Nombre',d.name)}
      ${row('Condición de venta',d.venta,false)}${row('Descripción',d.desc)}${row('Cantidad','1',false)}${row('Importe',String(Math.round(d.total*100)/100))}
      </div>
      <a class="btn sec" style="width:100%" href="${FAC.ARCA}" target="_blank" rel="noopener">Abrir ARCA</a>
      <form data-form="x:fac:emitida"><div class="sub" style="margin-top:18px">Paso 2: cuando ARCA te dé el comprobante, anotá el número y el CAE.</div>
      <label>Descripción</label><input name="desc" value="${esc(d.desc)}">
      <div class="grid2"><div><label>Número</label><input name="num" inputmode="numeric" value="${esc(d.num)}" placeholder="Ej: 123"></div><div><label>Fecha</label><input type="date" name="date" value="${d.date||today()}" required></div></div>
      <div class="grid2"><div><label>CAE</label><input name="cae" inputmode="numeric" value="${esc(d.cae)}" placeholder="14 dígitos"></div><div><label>Vencimiento del CAE</label><input type="date" name="caeV" value="${esc(d.caeV)}"></div></div>
      <p class="err" id="facerr"></p>
      <div class="btns"><button>Guardar como emitida</button><button type="button" class="sec" data-act="x:fac:guardarpend">Guardar para después</button></div></form>
      <button class="lnk" data-act="x:close">Cancelar</button>
      ${d.iva==='cf'?'<p class="mut">A consumidor final no hace falta identificar al paciente salvo importes muy altos; el monto exacto lo fija ARCA y cambia.</p>':''}`;
    },
    ver(m){
      const i=S.x.inv.find(x=>x.id===m.id);if(!i)return '';
      const p=i.pid&&pat(i.pid);
      const msg=`Hola${p?' '+first(p):''}, te envío la factura ${i.tipo} ${FAC.numero(i)} por ${money(i.total)}.${sign()}`;
      return `<h1 class="sm">${i.kind==='rec'?'Recibo '+esc(i.num):'Factura '+esc(i.tipo)+' '+FAC.numero(i)}</h1><div class="sub">${esc(i.name)} · ${CX.fdate(i.date)}</div>
      <div class="big" style="margin:14px 0">${money(i.total)}</div>
      <div class="box"><div class="kv"><span>Descripción</span><b class="keep">${esc(i.desc)}</b></div>${i.cae?`<div class="kv"><span>CAE</span><b>${esc(i.cae)}${i.caeV?' · vence '+CX.fdate(i.caeV):''}</b></div>`:''}<div class="kv"><span>Estado</span><b>${i.st==='ok'?'Emitida':i.st==='anul'?'Anulada':'Preparada, sin emitir'}</b></div></div>
      ${i.kind==='fac'&&i.st==='pend'?`<div class="btns"><button data-act="x:fac:retomar" data-id="${i.id}">Completar emisión</button><button class="sec" data-act="x:close">Cerrar</button></div>`:`<div class="btns">${i.kind==='rec'?`<button data-act="x:fac:recprint" data-id="${i.id}">Imprimir</button>`:p&&waOk(p)?`<a class="btn" target="_blank" rel="noopener" href="${waLink(p,msg)}">Avisar por WhatsApp</a>`:'<span></span>'}<button class="sec" data-act="x:close">Cerrar</button></div>`}
      ${i.st!=='anul'?`<button class="dng" data-act="x:fac:anular" data-id="${i.id}">${i.kind==='rec'||i.st==='pend'?'Eliminar':'Marcar como anulada'}</button>${i.kind==='fac'&&i.st==='ok'?'<p class="mut">Una factura emitida se anula en ARCA con una nota de crédito. Acá solo se marca para que los cobros vuelvan a "Por facturar".</p>':''}`:''}`;
    },
    finx(m){
      const f=fin(m.id),fx=S.x.finx[m.id]||{};
      return `<h1 class="sm">${esc(f.name)}</h1><div class="sub">Datos para facturarle</div><form data-form="x:fac:finx" data-id="${m.id}">
      <label>Razón social</label><input name="razon" value="${esc(fx.razon||f.name)}">
      <label>CUIT</label><input name="cuit" inputmode="numeric" value="${esc(fx.cuit)}">
      <label>Condición frente al IVA</label><select name="iva">${['ri','ex','mono'].map(k=>`<option value="${k}"${(fx.iva||'ri')===k?' selected':''}>${FAC.IVA[k]}</option>`).join('')}</select>
      <label>Domicilio fiscal</label><input name="dom" value="${esc(fx.dom)}">
      ${CX.btns()}</form>`;
    },
    gasto(m){
      const x=m.id?S.x.exp.find(e=>e.id===m.id):{date:today(),cat:CX.cfg('fac').lastCat||FAC.CATS[0]};
      const cats=[...new Set([...FAC.CATS,...S.x.exp.map(e=>e.cat)])];
      return `<h1 class="sm">${m.id?'Editar':'Nuevo'} gasto</h1><form data-form="x:fac:gasto" data-id="${m.id||''}">
      <label>Rubro</label><div class="chips" style="margin-top:0">${cats.map(c=>`<label><input type="radio" name="cat" value="${esc(c)}"${c===x.cat?' checked':''}><span>${esc(c)}</span></label>`).join('')}</div>
      ${amountField('amount','Monto',x.amount,[],true)}
      <label>Fecha</label><input type="date" name="date" value="${x.date}" required>
      <details class="more"${x.note?' open':''}><summary>+ Detalle</summary><input name="note" value="${esc(x.note)}" placeholder="Opcional"></details>
      <div class="tog"><input type="checkbox" name="fijo" id="gf"${x.fijo?' checked':''}><label for="gf">Es un gasto fijo de todos los meses</label></div>
      ${CX.btns()}</form>${m.id?`<button class="dng" data-act="x:fac:delgasto" data-id="${m.id}">Eliminar</button>`:''}`;
    }
  },
  acts:{
    copy(d){return CX.copy(d.v,'Copiado')},
    nueva(d){CX.sheet('fac:nueva',d.pid?{pid:d.pid}:{fid:d.fid,ym:d.ym})},
    retomar(d){const i=S.x.inv.find(x=>x.id===d.id);if(i)CX.sheet('fac:nueva',{inv:i,id:i.id})},
    ver(d){CX.sheet('fac:ver',{id:d.id})},
    async guardarpend(d,t){await FAC.guardar(t.closest('.sheet').querySelector('form'),false)},
    async omitir(d){
      const g=FAC.pendPat().find(x=>x.p.id===d.pid);if(!g)return;
      const ids=g.list.map(x=>x.id);g.list.forEach(x=>x.inv='-');await go();
      toast(`${ids.length} cobro${ids.length>1?'s':''} sin facturar`,async()=>{S.payments.forEach(x=>{if(ids.includes(x.id))delete x.inv});await go()});
    },
    async anular(d){
      const i=S.x.inv.find(x=>x.id===d.id);if(!i)return;
      const del=i.kind==='rec'||i.st==='pend';
      if(!confirm(del?'¿Eliminar este comprobante?':'¿Marcar la factura como anulada? Recordá hacer la nota de crédito en ARCA.'))return;
      S.payments.forEach(x=>{if(x.inv===i.id)delete x.inv;if(x.rec===i.id)delete x.rec});S.sessions.forEach(s=>{if(s.finv===i.id)delete s.finv});
      if(del)S.x.inv=S.x.inv.filter(x=>x.id!==i.id);else i.st='anul';
      CX.ui.modal=null;await go();
    },
    async recibo(d){
      const x=S.payments.find(p=>p.id===d.id);if(!x)return;
      let r=x.rec&&S.x.inv.find(i=>i.id===x.rec);
      if(!r){const c=FAC.cfg();c.recN=(c.recN||0)+1;const p=pat(x.pid);
        r={id:uid(),kind:'rec',date:x.date,pid:x.pid,name:p.name,total:+x.amount,num:String(c.recN).padStart(4,'0'),desc:(c.desc||'Honorarios profesionales'),method:x.method,st:'ok'};
        S.x.inv.push(r);x.rec=r.id;await go()}
      FAC.printRec(r);
    },
    recprint(d){const r=S.x.inv.find(i=>i.id===d.id);if(r)FAC.printRec(r)},
    gmes(d){CX.page().args.m=d.m;render()},
    ryear(d){CX.page().args.y=d.y;render()},
    async delgasto(d){S.x.exp=S.x.exp.filter(x=>x.id!==d.id);CX.ui.modal=null;await go()},
    async repetir(d){
      const prev=FAC.ymAdd(d.m,-1),ids=[];
      for(const x of S.x.exp.filter(e=>e.fijo&&e.date.startsWith(prev))){const id=uid();ids.push(id);const dim=new Date(+d.m.slice(0,4),+d.m.slice(5,7),0).getDate();const cp={...x,id,date:d.m+'-'+pad(Math.min(+x.date.slice(8),dim))};delete cp._t;S.x.exp.push(cp)}
      await go();toast(`${ids.length} gastos fijos copiados`,async()=>{S.x.exp=S.x.exp.filter(x=>!ids.includes(x.id));await go()});
    },
    csv(d){
      const y=d.y,f=CX.fdate;
      if(d.k==='cobros')CX.csv(`cobros-${y}.csv`,['Fecha','Paciente','Monto','Medio','Nota','Comprobante'],S.payments.filter(x=>x.date.startsWith(y)).sort((a,b)=>a.date.localeCompare(b.date)).map(x=>{const i=x.inv&&S.x.inv.find(v=>v.id===x.inv);return [f(x.date),(pat(x.pid)||{}).name||'',x.amount,x.method||'',x.note||'',i?`${i.tipo} ${FAC.numero(i)}`:'']}));
      else if(d.k==='turnos')CX.csv(`turnos-${y}.csv`,['Fecha','Hora','Paciente','Estado','Paga el paciente','Obra social','Paga la obra social','Estado obra social','Autorización'],S.sessions.filter(s=>s.date.startsWith(y)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).map(s=>[f(s.date),s.time,(pat(s.pid)||{}).name||'',STATUS[s.status],s.fee||0,s.fid?(fin(s.fid)||{}).name||'':'',s.osAmt||'',s.fid&&s.osSt?OSLAB[s.osSt]:'',s.auth||'']));
      else if(d.k==='gastos')CX.csv(`gastos-${y}.csv`,['Fecha','Rubro','Monto','Detalle','Fijo'],S.x.exp.filter(x=>x.date.startsWith(y)).sort((a,b)=>a.date.localeCompare(b.date)).map(x=>[f(x.date),x.cat,x.amount,x.note||'',x.fijo?'Sí':'']));
      else if(d.k==='comp')CX.csv(`comprobantes-${y}.csv`,['Fecha','Tipo','Número','Receptor','Documento','Descripción','Total','CAE','Estado'],S.x.inv.filter(i=>i.date.startsWith(y)).sort((a,b)=>a.date.localeCompare(b.date)).map(i=>[f(i.date),i.kind==='rec'?'Recibo':'Factura '+i.tipo,i.kind==='rec'?i.num:FAC.numero(i),i.name,i.doc||'',i.desc||'',i.total,i.cae||'',i.st==='ok'?'Emitido':i.st==='anul'?'Anulado':'Pendiente']));
      else if(d.k==='pacientes')CX.csv(`pacientes.csv`,['Nombre','Teléfono','Obra social','Nº afiliado','DNI','Valor','Saldo','Archivado'],S.patients.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(p=>[p.name,p.phone||'',finName(p),p.afil||'',p.dni||'',p.fee||0,balance(p.id),p.archived?'Sí':'']));
    }
  },
  forms:{
    async emitida(v,f){
      const e=f.querySelector('#facerr');
      if(!v.num.trim()){e.textContent='Falta el número del comprobante.';return}
      if(v.cae&&!/^\d{14}$/.test(v.cae.trim())){e.textContent='El CAE tiene 14 dígitos.';return}
      await FAC.guardar(f,true);
    },
    async cfg(v){
      const c=FAC.cfg();c.cond=v.cond;c.pv=v.pv.trim();c.desc=v.desc.trim();c.tope=+v.tope||0;S.settings.cuit=v.cuit.trim();
      await save();CX.back();toast('Datos fiscales guardados');
    },
    async finx(v,f){S.x.finx[f.dataset.id]={razon:v.razon.trim(),cuit:v.cuit.trim(),iva:v.iva,dom:v.dom.trim()};CX.ui.modal=null;await go()},
    async gasto(v,f){
      const rec={date:v.date,cat:v.cat||'Otros',amount:+v.amount||0,note:(v.note||'').trim(),fijo:v.fijo==='on'};
      CX.cfg('fac').lastCat=rec.cat;
      if(f.dataset.id)Object.assign(S.x.exp.find(x=>x.id===f.dataset.id),rec);else S.x.exp.push({id:uid(),...rec});
      CX.ui.modal=null;const pg=CX.page();if(pg&&pg.id==='fac:gastos')pg.args.m=v.date.slice(0,7);await go();
    }
  },
  inject(app){
    if(ui.tab!=='plata'||ui.fid||ui.rep)return;
    const h=app.querySelector('h3.sec');if(!h)return;
    const anchor=h.closest('.row')||h;
    const n=FAC.pendPat().length+FAC.pendFin().length,g=FAC.gastado(ui.month),cob=FAC.cobrado(ui.month);
    anchor.insertAdjacentHTML('beforebegin',`<div id="facrow">
      ${CX.item('x:go',{p:'fac:home'},'Comprobantes',n?`<span class="warnt">${n} por facturar</span>`:'Facturas y recibos')}
      ${CX.item('x:fac:gastos',{},'Gastos',g?`${money(g)} este mes · te queda ${money(cob-g)}`:'Alquiler, monotributo, matrícula…')}
      ${CX.item('x:go',{p:'fac:rep'},'Reportes','Año, asistencia, medios de pago y Excel')}</div>`);
  }
});
CX.mods.fac.acts.gastos=()=>CX.go('fac:gastos',{m:ui.month});

FAC.guardar=async function(f,emitida){
  const m=CX.ui.modal,v=Object.fromEntries(new FormData(f)),d=m.inv||FAC.draft(m);
  const tipo=FAC.tipo(d.iva);
  const rec={...d,id:m.id||uid(),desc:v.desc.trim()||d.desc,tipo,pv:FAC.cfg().pv||'',num:v.num.trim(),cae:v.cae.trim(),caeV:v.caeV||'',date:v.date||today(),st:emitida?'ok':'pend'};
  const i=S.x.inv.findIndex(x=>x.id===rec.id);if(i>=0)S.x.inv[i]=rec;else S.x.inv.push(rec);
  for(const x of S.payments)if((rec.payIds||[]).includes(x.id))x.inv=rec.id;
  for(const s of S.sessions)if((rec.sesIds||[]).includes(s.id))s.finv=rec.id;
  CX.ui.modal=null;await go();
  toast(emitida?`Factura ${tipo} ${FAC.numero(rec)} guardada`:'Guardada: falta emitirla en ARCA');
};
FAC.printRec=function(r){
  const c=CX.cfg('panel');
  CX.print(`Recibo ${r.num} ${r.name}`,`<h1>Recibo N° ${esc(r.num)}</h1><div class="meta">${CX.profLine()}</div>${c.dom?`<div class="meta">${esc(c.dom)}</div>`:''}
  <p style="margin-top:26px;font-size:14px;line-height:1.9">Recibí de <b>${esc(r.name)}</b> la suma de <b>${money(r.total)}</b> en concepto de ${esc((r.desc||'honorarios profesionales').toLowerCase())}${r.method?', abonada por '+esc(r.method.toLowerCase()):''}.</p>
  <p class="meta">Fecha: ${CX.fdate(r.date)}</p>
  <div class="sig"><div style="visibility:hidden"></div><div>Firma y sello</div></div>
  <p class="small" style="margin-top:30px">Constancia de pago. Documento no válido como factura.</p>`,'El recibo acredita el pago; la factura se emite en ARCA.');
};
