'use strict';
/* Licencia de la versión offline (pago único).
   - Los primeros TRIAL_DIAS días de uso son de prueba, con todo habilitado.
   - Pasada la prueba sin licencia, la app queda en SOLO LECTURA: se puede ver, buscar, imprimir y
     exportar todo (el acceso a la historia clínica nunca se bloquea), pero no cargar datos nuevos.
   - La licencia es un código firmado (mismo mecanismo que los aportes, con t:'lic') que se valida
     sin internet con la clave pública. No se puede inventar sin la clave privada.
   Limitación asumida: los datos viven en el dispositivo del usuario, así que un usuario técnico
   puede saltearse el control. Es una licencia de confianza, no un candado. */
const LIC={
  TRIAL_DIAS:30,
  AVISO_DIAS:7,
  PRECIO:'',            /* ej. 'ARS 45.000 pago único'; vacío = no se muestra */
  LINK_PAGO:'',         /* link de Mercado Pago; vacío = se pide por contacto */
  valid:false,
  /* formularios que siguen funcionando con la prueba vencida */
  PERMITIDOS:['lic:code','don:code'],
  PERMITIDOS_PREFIJO:['nube:','legal:'],
  async verify(){
    const c=S&&S.x&&S.x.lic&&S.x.lic.code;
    const info=c?await DON.check(c):null;
    LIC.valid=!!(info&&info.t==='lic');
    return LIC.valid;
  },
  dias(){const l=S.x.lic;return Math.max(0,LIC.TRIAL_DIAS-daysBetween(l.start,today()))},
  estado(){
    if(LIC.valid)return 'licencia';
    return LIC.dias()>0?'prueba':'vencida';
  },
  /* true si se puede cargar/modificar datos */
  puede(){return LIC.estado()!=='vencida'},
  guard(name){
    if(LIC.puede())return true;
    if(LIC.PERMITIDOS.includes(name)||LIC.PERMITIDOS_PREFIJO.some(p=>name.startsWith(p)))return true;
    CX.sheet('lic:muro');return false;
  },
  comprar(){
    return LIC.LINK_PAGO
      ?`<a class="btn" target="_blank" rel="noopener" href="${LIC.LINK_PAGO}">Comprar licencia${LIC.PRECIO?' · '+esc(LIC.PRECIO):''}</a>`
      :`<p class="mut">${LIC.PRECIO?esc(LIC.PRECIO)+'. ':''}Para obtener tu licencia escribí a <b>${esc(LEGAL.CONTACTO)}</b> y te respondemos con tu código.</p>`;
  },
  form(){
    return `<form data-form="x:lic:code"><textarea name="code" rows="3" class="keep" placeholder="Pegá acá tu código de licencia (empieza con CX1.)" required></textarea><p class="err" id="licerr"></p><button style="width:100%">Activar licencia</button></form>`;
  }
};

CX.def('lic',{
  name:'Licencia',core:true,
  panel:[{sec:'pie',head:'El proyecto',title:'Licencia',p:'lic:home',sub:()=>{
    const e=LIC.estado();
    return e==='licencia'?'<span class="ok">Activa</span>':e==='prueba'?`Prueba: te quedan ${LIC.dias()} días`:'<span class="err">Prueba terminada: modo solo lectura</span>';
  }}],
  pages:{
    home:{view(){
      const e=LIC.estado(),l=S.x.lic;
      return CX.head('Licencia')+(
        e==='licencia'?`<div class="banner"><b>Licencia activa${l.name?' · '+esc(l.name):''}.</b> Gracias por elegir Consultorio. Es de pago único y no vence.</div>`:
        e==='prueba'?`<div class="banner">Estás en el período de prueba: te quedan <b>${LIC.dias()} días</b> con todas las funciones.</div><p class="sub">Al terminar, tus datos siguen siendo tuyos: podés verlos, imprimirlos y exportarlos siempre. Para seguir cargando datos necesitás la licencia.</p>${LIC.comprar()}`:
        `<div class="banner err"><b>La prueba terminó.</b> La app está en modo solo lectura: podés ver, imprimir y exportar todo, pero no cargar datos nuevos hasta activar tu licencia.</div>${LIC.comprar()}`
      )+(e==='licencia'?'':`<h3 class="sec">¿Ya tenés tu código?</h3>${LIC.form()}`);
    }}
  },
  sheets:{
    muro(){
      return `<h1 class="sm">Tu prueba terminó</h1>
      <p class="sub">Tus datos están intactos y podés verlos, imprimirlos y exportarlos cuando quieras. Para seguir cargando pacientes, turnos y cobros necesitás activar tu licencia (pago único).</p>
      ${LIC.comprar()}${LIC.form()}
      <div class="btns" style="margin-top:14px"><button class="sec" data-act="x:export">Exportar mi copia</button><button class="sec" data-act="x:close">Cerrar</button></div>`;
    }
  },
  forms:{
    async code(v,f){
      const info=await DON.check(v.code);
      if(!info||info.t!=='lic'){f.querySelector('#licerr').textContent='El código no es válido. Copialo completo, sin espacios de más.';return}
      S.x.lic.code=v.code.replace(/\s+/g,'');S.x.lic.name=info.n||'';S.x.lic.at=today();
      LIC.valid=true;CX.ui.modal=null;
      await save();render();toast('Licencia activada. ¡Gracias!');
    }
  },
  coreForms:{
    /* formularios del núcleo que cargan datos */
    pat:()=>LIC.guard('core:pat'),ses:()=>LIC.guard('core:ses'),pay:()=>LIC.guard('core:pay'),
    fin:()=>LIC.guard('core:fin'),monto:()=>LIC.guard('core:monto')
  },
  async boot(){
    S.x.lic=S.x.lic||{};
    if(!S.x.lic.start)S.x.lic.start=today();   /* quien ya usaba la app arranca su prueba hoy */
    await LIC.verify();
  }
});
CX.listen('ready',async()=>{
  const e=LIC.estado();
  if(e==='vencida')return CX.sheet('lic:muro');
  if(e==='prueba'&&LIC.dias()<=LIC.AVISO_DIAS&&S.x.lic.avisado!==today()){
    S.x.lic.avisado=today();await save();
    toast(`Te quedan ${LIC.dias()} días de prueba. Licencia en Panel → Licencia.`);
  }
});
CX.guard=name=>LIC.guard(name);
