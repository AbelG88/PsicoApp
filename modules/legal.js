'use strict';
/* Legales y privacidad: aceptación de términos, textos, aviso para pacientes,
   guía de cumplimiento y herramientas para los derechos del paciente. */
const LEGAL={
  V:'1.0',FECHA:'13 de noviembre de 2026',
  CONTACTO:'abel.edgardo.garcia.88@gmail.com',
  docs:{
    terms:{n:'Términos y condiciones',t:()=>`
<p><i>Versión ${LEGAL.V} · ${LEGAL.FECHA}</i></p>
<h2>1. Qué es Consultorio</h2>
<p>Consultorio es una aplicación para que profesionales de la salud independientes organicen su agenda, sus cobros, la facturación y la historia clínica de sus pacientes. Es una herramienta de gestión: <b>no es un dispositivo médico, no brinda diagnóstico ni tratamiento y no da asesoramiento legal, contable ni impositivo.</b></p>
<h2>2. Quién la ofrece</h2>
<p>La desarrolla y ofrece Abel García, a título personal, desde Argentina ("el desarrollador"). Contacto: ${LEGAL.CONTACTO}.</p>
<h2>3. Licencia de uso</h2>
<p>Podés usar la aplicación para tu práctica profesional. El código y el diseño son del desarrollador; no podés revenderla ni presentarla como propia. El uso es gratuito y se sostiene con aportes voluntarios.</p>
<h2>4. Tu responsabilidad profesional</h2>
<ul>
<li>Sos la única persona responsable de los registros que cargás, de su exactitud y de tu ejercicio profesional, que se rige por las leyes de tu profesión y las normas de tu colegio o consejo.</li>
<li>Sos <b>responsable de la base de datos</b> de tus pacientes según la Ley 25.326: te corresponde informarles cómo tratás sus datos, obtener los consentimientos necesarios, guardar el secreto profesional y cumplir las obligaciones que esa ley fija para quienes tienen bases de datos personales.</li>
<li>La historia clínica es obligatoria y debe conservarse al menos 10 años (Ley 26.529). La aplicación te ayuda a llevarla, pero cumplir esa obligación depende de vos: hacé copias de seguridad y guardalas en un lugar seguro.</li>
<li>La aplicación identifica las notas con tu clave y una huella de control, que es una firma electrónica. No es una firma digital con certificado en los términos de la Ley 25.506. Si necesitás ese nivel de respaldo, imprimí y firmá la historia clínica o firmá el PDF con tu firma digital.</li>
<li>La aplicación no emite recetas ni órdenes médicas.</li>
</ul>
<h2>5. Tu clave y tus copias</h2>
<p>Tus datos se cifran con una clave que solo vos conocés. <b>Si la olvidás, nadie puede recuperar los datos</b>: ni el desarrollador ni ningún servicio técnico. Sos responsable de recordar la clave, de hacer copias de seguridad periódicas y de proteger tu dispositivo con bloqueo de pantalla.</p>
<h2>6. Modo sin conexión y modo online</h2>
<p>En el modo sin conexión todo queda en tu dispositivo. En el modo online, una copia cifrada se guarda en un servidor para que la uses en varios dispositivos; se cifra en tu dispositivo antes de salir, y el desarrollador no puede leerla. El modo online puede interrumpirse por mantenimiento o por causas ajenas; por eso las copias de seguridad siguen siendo necesarias.</p>
<h2>7. Facturación</h2>
<p>La aplicación prepara los datos de tus comprobantes y guarda sus números, pero la emisión se hace en ARCA. Verificar los datos, emitir en término y cumplir con tus obligaciones fiscales es tu responsabilidad. Los recibos que genera la aplicación son constancias de pago y no reemplazan a la factura.</p>
<h2>8. Aportes voluntarios</h2>
<p>Cada cierto tiempo la aplicación te invita a colaborar. El aporte es voluntario y no habilita funciones: todas están disponibles sin pagar. Si aportás, podés pedir un código que desactiva la invitación. Si en el futuro se ofrecen planes pagos, se informarán sus condiciones antes de contratarlos, incluido tu derecho a arrepentirte de la compra dentro de los 10 días (Ley 24.240).</p>
<h2>9. Sin garantías</h2>
<p>La aplicación se ofrece "como está". Se hace el mayor esfuerzo para que funcione bien, pero puede tener errores o dejar de estar disponible. En la medida en que la ley lo permita, el desarrollador no responde por pérdida de datos, lucro cesante ni daños derivados del uso o de la imposibilidad de uso. Nada de esto limita los derechos que las normas de defensa del consumidor te reconozcan y que no puedan renunciarse.</p>
<h2>10. Cambios</h2>
<p>Estos términos pueden actualizarse. Si el cambio es importante, la aplicación te va a pedir que los aceptes de nuevo.</p>
<h2>11. Ley aplicable</h2>
<p>Rigen las leyes de la República Argentina. Si sos consumidor, podés reclamar ante los tribunales de tu domicilio.</p>
<p class="mut">Texto redactado sin intervención de un estudio jurídico. Si vas a basar decisiones importantes en él, consultá a un/a profesional del derecho.</p>`},
    priv:{n:'Política de privacidad',t:()=>`
<p><i>Versión ${LEGAL.V} · ${LEGAL.FECHA}</i></p>
<p>Consultorio maneja datos de salud, que la ley argentina trata como datos sensibles. Por eso está hecha para que el desarrollador no pueda verlos.</p>
<h2>1. Quién es responsable de qué</h2>
<ul>
<li><b>El o la profesional</b> que usa la aplicación es responsable de los datos de sus pacientes y decide qué carga y para qué.</li>
<li><b>El desarrollador</b> (Abel García, ${LEGAL.CONTACTO}) es responsable solo de los datos de cuenta del modo online, que se detallan abajo.</li>
</ul>
<h2>2. Qué datos se cargan</h2>
<p>Datos del profesional (nombre, matrícula, CUIT, alias), de sus pacientes (nombre, teléfono, documento, obra social, turnos, pagos), historia clínica (ficha, notas y consentimientos), comprobantes y gastos.</p>
<h2>3. Modo sin conexión</h2>
<ul>
<li>Todo se guarda <b>solo en tu dispositivo</b>, cifrado con AES-256-GCM. La clave se deriva de tu contraseña (PBKDF2) y solo existe en memoria mientras la aplicación está abierta.</li>
<li>El desarrollador no recibe, no ve y no puede recuperar esos datos ni tu clave.</li>
<li>La aplicación se bloquea sola al pasar a segundo plano.</li>
</ul>
<h2>4. Modo online</h2>
<ul>
<li>Para identificarte se usa tu cuenta de Google, de Facebook o tu email. De esa cuenta se guarda el <b>email, un identificador y las fechas de acceso</b>.</li>
<li>Tus datos se cifran <b>en tu dispositivo</b>, con tu clave, antes de enviarse. En el servidor solo hay bloques cifrados: ni el desarrollador ni el proveedor pueden leerlos.</li>
<li>El servidor es de Supabase y está ubicado en San Pablo, Brasil. Guardar datos fuera de Argentina es una transferencia internacional; viajan y se almacenan cifrados de extremo a extremo.</li>
<li>Podés borrar tu cuenta y todos los datos del servidor desde Panel → Modo online. El borrado es inmediato y definitivo.</li>
</ul>
<h2>5. Qué sale de tu dispositivo</h2>
<p>Nada sale por su cuenta, salvo la copia cifrada del modo online si lo activás. Lo demás sale solo cuando vos lo decidís: copias de seguridad (cifradas), archivos de Excel, impresiones y PDF (<b>sin cifrar</b>: cuidá a quién se los das), mensajes de WhatsApp (se abren con el texto listo y los enviás vos) y enlaces a ARCA o a los medios de aporte.</p>
<h2>6. Terceros</h2>
<p>La aplicación está alojada en GitHub Pages, que recibe datos técnicos de tu conexión (como la dirección IP), pero no tus registros. No hay analíticas, publicidad ni cookies de seguimiento. Al usar WhatsApp, Google, Facebook, Mercado Pago u otros servicios enlazados rigen sus propias políticas.</p>
<h2>7. Conservación</h2>
<p>Los datos de tu dispositivo se conservan hasta que los borres. Los del modo online, hasta que borres tu cuenta. Recordá que la historia clínica debe conservarse al menos 10 años.</p>
<h2>8. Derechos</h2>
<p>Los pacientes ejercen sus derechos de acceso, rectificación y supresión ante su profesional, que tiene sus datos. Como titular de una cuenta online, podés pedir acceso, rectificación o supresión de tus datos de cuenta escribiendo a ${LEGAL.CONTACTO}.</p>
<p>El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto, conforme lo establecido en el artículo 14, inciso 3 de la Ley 25.326. La Agencia de Acceso a la Información Pública, órgano de control de la Ley 25.326, tiene la atribución de atender las denuncias y reclamos que se interpongan con relación al incumplimiento de las normas sobre protección de datos personales.</p>
<p class="mut">Texto redactado sin intervención de un estudio jurídico.</p>`},
    guia:{n:'Guía de cumplimiento para tu consultorio',t:()=>`
<p>Lo que la ley argentina espera de vos cuando llevás datos de pacientes, y cómo te ayuda la aplicación. No reemplaza el asesoramiento de tu colegio profesional ni de un/a abogado/a.</p>
<h2>Historia clínica (Ley 26.529)</h2>
<ul>
<li><b>Es obligatoria, cronológica y completa.</b> Cargá una nota por cada atención. La aplicación las ordena, las numera y registra fecha y hora.</li>
<li><b>No se puede alterar.</b> Cada nota se corrige durante 24 horas y después queda firmada; los errores se salvan con una aclaración.</li>
<li><b>El paciente es el titular.</b> Si te pide una copia, tenés 48 horas para entregarla: Historia clínica → Documentos → Copia.</li>
<li><b>Se conserva al menos 10 años</b> desde la última atención. La aplicación no deja eliminar pacientes con historia clínica: archivalos.</li>
<li><b>Es confidencial.</b> No la muestres ni la envíes a terceros sin autorización del paciente u orden judicial.</li>
</ul>
<h2>Consentimiento informado</h2>
<ul>
<li>Explicá el tratamiento y dejá constancia. En Documentos tenés modelos para imprimir y registrar la firma.</li>
<li>Con menores, firman sus representantes y se escucha al niño, niña o adolescente.</li>
</ul>
<h2>Datos personales (Ley 25.326)</h2>
<ul>
<li>Los datos de salud son <b>sensibles</b>. Podés tratarlos por ser profesional de la salud, respetando el secreto profesional.</li>
<li>Informá a tus pacientes para qué usás sus datos: imprimí el "Aviso de privacidad para pacientes".</li>
<li>Pedí solo los datos que necesitás.</li>
<li>La ley prevé la inscripción de las bases de datos ante la Agencia de Acceso a la Información Pública. Consultá en la Agencia o en tu colegio cómo te alcanza.</li>
<li>Si un paciente pide ver, corregir o suprimir sus datos, respondé dentro de los plazos legales (10 días corridos para el acceso, 5 días hábiles para rectificar o suprimir). La historia clínica no se suprime mientras dure la obligación de conservarla.</li>
</ul>
<h2>Seguridad práctica</h2>
<ul>
<li>Usá una clave larga (una frase) y no la compartas.</li>
<li>Activá el bloqueo de pantalla del teléfono.</li>
<li>Hacé una copia de seguridad por semana y guardala fuera del teléfono.</li>
<li>Los archivos de Excel y los PDF salen sin cifrar: borralos después de usarlos.</li>
<li>No uses la aplicación en dispositivos compartidos.</li>
</ul>
<h2>Facturación</h2>
<ul>
<li>Todo cobro lleva su comprobante electrónico emitido en ARCA.</li>
<li>En la descripción de la factura no hace falta detallar diagnósticos.</li>
</ul>`}
  },
  aviso(){
    const st=S.settings,c=CX.cfg('panel');
    return `<h1>Aviso de privacidad para pacientes</h1><div class="meta">${CX.profLine()}</div>${c.dom?`<div class="meta">${esc(c.dom)}</div>`:''}
<p style="margin-top:18px">Para atenderte necesito registrar algunos datos tuyos. Quiero que sepas cómo los cuido.</p>
<h2>Qué datos registro</h2><p>Tus datos de contacto, los de tu obra social o prepaga si corresponde, los turnos y pagos, y tu historia clínica.</p>
<h2>Para qué</h2><p>Únicamente para brindarte atención, llevar tu historia clínica como exige la ley y gestionar turnos y honorarios.</p>
<h2>Cómo los protejo</h2><p>Están amparados por el secreto profesional. Se guardan en un sistema cifrado al que solo yo accedo con mi clave. No los comparto con nadie, salvo con tu obra social o prepaga para facturar las prestaciones, o cuando una ley o un juez lo ordenen.</p>
<h2>Cuánto tiempo</h2><p>La historia clínica se conserva al menos 10 años desde la última atención (Ley 26.529).</p>
<h2>Tus derechos</h2><p>Sos titular de tu historia clínica y podés pedirme una copia, que te voy a entregar dentro de las 48 horas. También podés pedirme ver, corregir o suprimir tus datos personales (Ley 25.326)${st.name?'':' '}${c.tel||c.mail?', escribiéndome a '+esc([c.tel,c.mail].filter(Boolean).join(' o ')):''}.</p>
<p class="small">La Agencia de Acceso a la Información Pública, órgano de control de la Ley 25.326, tiene la atribución de atender las denuncias y reclamos que se interpongan con relación al incumplimiento de las normas sobre protección de datos personales.</p>
<div class="sig"><div>Tomé conocimiento · firma y aclaración</div><div>Fecha</div></div>`;
  }
};

CX.def('legal',{
  name:'Legales',core:true,
  panel:[{sec:'datos',title:'Privacidad y legales',p:'legal:home',sub:()=>'Términos, privacidad, aviso para pacientes y derechos'}],
  boot(){if(CX.stash.legalOk){S.x.legal={v:LEGAL.V,at:Date.now()};CX.stash.legalOk=false}},
  gate(){return S.x.legal&&S.x.legal.v===LEGAL.V?null:'legal'},
  pages:{
    home:{view(){
      return CX.head('Privacidad y legales')+`
      ${CX.item('x:go',{p:'legal:guia'},'Guía de cumplimiento','Qué te exige la ley con los datos de pacientes')}
      ${CX.item('x:legal:aviso',{},'Aviso de privacidad para pacientes','Para imprimir y entregar o dejar en el consultorio')}
      ${CX.item('x:go',{p:'legal:pac'},'Datos de un paciente','Entregarle una copia de todo lo que tenés registrado')}
      <h3 class="sec">Documentos de la aplicación</h3>
      ${CX.item('x:go',{p:'legal:terms'},'Términos y condiciones',S.x.legal?'Aceptados el '+new Date(S.x.legal.at).toLocaleDateString('es-AR'):'')}
      ${CX.item('x:go',{p:'legal:priv'},'Política de privacidad','')}
      <h3 class="sec">Zona de riesgo</h3>
      <button class="dng" data-act="x:legal:wipe">Borrar todos los datos de este dispositivo</button>
      <p class="mut">Borra pacientes, turnos, cobros e historia clínica de este dispositivo. No se puede deshacer. Antes descargá una copia de seguridad.</p>`;
    }},
    terms:{view(){return CX.head('Términos y condiciones')+`<div class="legal">${LEGAL.docs.terms.t()}</div>`}},
    priv:{view(){return CX.head('Política de privacidad')+`<div class="legal">${LEGAL.docs.priv.t()}</div>`}},
    guia:{view(){return CX.head('Guía de cumplimiento')+`<div class="legal">${LEGAL.docs.guia.t()}</div>`}},
    pac:{view(a){
      const q=norm(a.q||''),ps=S.patients.filter(p=>!q||norm(p.name).includes(q)).sort((x,y)=>x.name.localeCompare(y.name)).slice(0,40);
      return CX.head('Datos de un paciente')+`<p class="sub">Genera un documento con sus datos, turnos y pagos. La historia clínica se entrega aparte, desde su ficha.</p>
      <input type="search" data-xinp="legal:q" value="${esc(a.q||'')}" placeholder="Buscar paciente" autocomplete="off">
      <div id="lplist">${ps.map(p=>CX.item('x:legal:pacexp',{id:p.id},esc(p.name),esc(finName(p)))).join('')||'<div class="empty">Sin pacientes.</div>'}</div>`;
    }}
  },
  sheets:{
    doc(m){const d=LEGAL.docs[m.k];return `<h1 class="sm">${d.n}</h1><div class="legal">${d.t()}</div><div class="btns"><span></span><button class="sec" data-act="x:close">Cerrar</button></div>`}
  },
  inp:{q(t){CX.page().args.q=t.value;const q=norm(t.value),l=document.getElementById('lplist');
    if(l)l.innerHTML=S.patients.filter(p=>!q||norm(p.name).includes(q)).sort((x,y)=>x.name.localeCompare(y.name)).slice(0,40).map(p=>CX.item('x:legal:pacexp',{id:p.id},esc(p.name),esc(finName(p)))).join('')||'<div class="empty">Ningún paciente coincide.</div>'}},
  acts:{
    doc(d){CX.sheet('legal:doc',{k:d.k})},
    aviso(){CX.print('Aviso de privacidad para pacientes',LEGAL.aviso(),'Entregalo en la primera entrevista o dejalo visible en el consultorio.')},
    async aceptar(){S.x.legal={v:LEGAL.V,at:Date.now()};await save();CX.advance()},
    async pacexp(d){
      const p=pat(d.id);if(!p)return;const x=S.x.px[p.id]||{};
      const ses=S.sessions.filter(s=>s.pid===p.id).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)),pays=S.payments.filter(y=>y.pid===p.id).sort((a,b)=>a.date.localeCompare(b.date));
      const body=`<h1>Datos personales registrados</h1><div class="meta">Responsable: ${CX.profLine()}</div><div class="meta">Emitido el ${CX.fdate(today())} a pedido del titular (Ley 25.326, art. 14).</div>
      <h2>Datos del paciente</h2><table>${[['Nombre',p.name],['Teléfono',p.phone],['Email',x.email],['DNI',p.dni],['Obra social o prepaga',finName(p)],['Nº de afiliado',p.afil],['Valor acordado',money(p.fee)],['Notas administrativas',p.notes],['Responsable de pago',x.resp]].filter(r=>r[1]).map(r=>`<tr><th style="width:32%">${esc(r[0])}</th><td class="pre">${esc(r[1])}</td></tr>`).join('')}</table>
      <h2>Turnos (${ses.length})</h2><table><tr><th>Fecha</th><th>Hora</th><th>Estado</th><th class="r">Valor</th></tr>${ses.map(s=>`<tr><td>${CX.fdate(s.date)}</td><td>${esc(s.time)}</td><td>${STATUS[s.status]}</td><td class="r">${money(s.fee)}</td></tr>`).join('')}</table>
      <h2>Pagos (${pays.length})</h2><table><tr><th>Fecha</th><th>Medio</th><th class="r">Monto</th></tr>${pays.map(y=>`<tr><td>${CX.fdate(y.date)}</td><td>${esc(y.method||'')}</td><td class="r">${money(y.amount)}</td></tr>`).join('')}</table>
      <p class="small">La historia clínica se entrega por separado (Ley 26.529, art. 14).</p>`;
      CX.log('pac_exp',{pid:p.id});await save();
      CX.print(`Datos de ${p.name}`,body,'Contiene datos personales: entregalo solo al paciente o a su representante.');
    },
    async wipe(){
      const w=prompt('Esto borra TODO de este dispositivo y no se puede deshacer.\n\nPara confirmar, escribí BORRAR');
      if(w!=='BORRAR')return;
      if(CX.vault.ok)await CX.vault.replace([]);
      for(const k of Object.keys(localStorage))if(k===LS||k.startsWith('cx_'))localStorage.removeItem(k);
      CX.emit('wipe');lock();
    }
  },
  injectLock(app){
    const f=app.querySelector('form[data-form="unlock"]');if(!f)return;
    const first=!localStorage.getItem(LS);
    if(first){
      const btn=f.querySelector('button');
      btn.insertAdjacentHTML('beforebegin',`<div class="lockx" style="margin-top:0"><label><input type="checkbox" name="legal" required><span>Leí y acepto los <a href="#" data-act="x:legal:doc" data-k="terms">Términos</a> y la <a href="#" data-act="x:legal:doc" data-k="priv">Política de privacidad</a>.</span></label></div>`);
    }
  }
});
document.addEventListener('submit',e=>{
  const f=e.target;if(f.dataset&&f.dataset.form==='unlock'&&f.elements.legal&&f.elements.legal.checked)CX.stash.legalOk=true;
},true);

CX.gates.legal=function(){
  return `<div class="gate"><h1 class="sm">Antes de seguir</h1>
  <p class="sub">${S.x.legal?'Actualizamos los términos de uso.':'Consultorio maneja datos sensibles de tus pacientes. Necesitamos que conozcas las reglas.'}</p>
  <div class="box"><p style="margin:.2em 0"><b>En pocas palabras:</b></p><ul style="padding-left:18px;margin:.4em 0">
  <li>Tus datos se guardan cifrados con tu clave. Si la olvidás, nadie puede recuperarlos.</li>
  <li>Sos responsable de los datos de tus pacientes y de hacer copias de seguridad.</li>
  <li>La app es una herramienta de gestión: no reemplaza tu criterio profesional ni a tu contador/a.</li></ul></div>
  ${CX.item('x:legal:doc',{k:'terms'},'Términos y condiciones','Leer completo')}
  ${CX.item('x:legal:doc',{k:'priv'},'Política de privacidad','Leer completo')}
  <button style="width:100%;margin-top:22px" data-act="x:legal:aceptar">Acepto y continúo</button>
  <div style="text-align:center;margin-top:10px"><button class="lnk" data-act="lock">Ahora no</button></div>
  ${CX.modalHtml()}</div>`;
};
