const L=require('./lib');
(async()=>{
const srv=await L.serve(),b=await L.launch(),errs=[];const p=await L.page(b,errs);
const ok=(c,m)=>{console.log((c?'  ok  ':'  FAIL ')+m);if(!c)process.exitCode=1};
const txt=async()=>{const t=await p.evaluate(()=>document.getElementById('app').innerText);const s=new String(t);s.includes=x=>t.toLowerCase().includes(String(x).toLowerCase());return s};
const click=async(sel,t)=>{const r=await p.evaluate((sel,t)=>{const els=[...document.querySelectorAll(sel)].filter(e=>!t||e.innerText.trim().includes(t));const e=els[els.length-1];if(!e)return false;e.click();return true},sel,t);if(!r)console.log('   (no encontré '+sel+' '+(t||'')+')');await L.sleep(250);return r};
const fill=(sel,v)=>p.evaluate((sel,v)=>{const e=document.querySelector(sel);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))},sel,v);
const submit=async sel=>{await p.evaluate(sel=>document.querySelector(sel).requestSubmit(),sel);await L.sleep(700)};
await p.goto('http://localhost:8123/');await L.sleep(500);
ok((await txt()).includes('Elegí una clave'),'pantalla de alta');
ok(!!(await p.$('input[name=legal]')),'checkbox legal en el alta');
await fill('input[name=p]','clave-larga-1');await fill('input[name=p2]','clave-larga-1');
await p.evaluate(()=>document.querySelector('input[name=legal]').checked=true);
await submit('form[data-form=unlock]');await L.sleep(800);
ok((await txt()).includes('Armemos tu consultorio'),'onboarding (sin gate legal porque aceptó en el alta)');
await click('[data-act="x:panel:prof"]','Fonoaudiología');
await fill('.gate input[name=name]','Lic. Prueba');
await submit('form[data-form="x:panel:inicio"]');
ok((await txt()).includes('Hoy'),'entra a Hoy');
ok(await p.evaluate(()=>S.x.prof==='fono'&&S.x.srv.length===3&&S.x.cfg.hc.secs.length===4&&!!S.x.legal),'perfil fono sembrado + legal registrado');
// paciente
await click('nav button','Pacientes');await click('.fab');
await fill('input[name=name]','Juana Pérez');await fill('input[name=phone]','11 2345 6789');await fill('input[name=fee]','25000');
await submit('form[data-form=pat]');
ok((await txt()).includes('Juana Pérez'),'paciente creado');
// turno hoy con prestación
await click('nav button','Hoy');await click('.fab');
await p.evaluate(()=>{const s=document.querySelector('select[name=pid]');s.value=S.patients[0].id;s.dispatchEvent(new Event('change',{bubbles:true}))});
ok(!!(await p.$('[data-act="x:agenda:srv"]')),'prestaciones en el turno nuevo');
await click('[data-act="x:agenda:srv"]','Evaluación');
await submit('form[data-form=ses]');
ok(await p.evaluate(()=>S.sessions.length===1&&S.sessions[0].dur===60&&!!S.sessions[0]._t),'turno con prestación (dur 60) y marca de tiempo');
// superposición
await click('.fab');await p.evaluate(()=>{const s=document.querySelector('select[name=pid]');s.value=S.patients[0].id;s.dispatchEvent(new Event('change',{bubbles:true}))});
await p.evaluate(()=>{document.querySelector('select[name=time]').value=S.sessions[0].time});
await submit('form[data-form=ses]');
ok((p._dialogs||[]).some(d=>d.includes('Ya hay un turno')),'aviso de superposición');
await p.evaluate(()=>{S.sessions.length=1;ui.modal=null});await p.evaluate(()=>go());await L.sleep(300);
// asistió + nota
await click('.chk');
ok(!!(await p.$('[data-act="x:hc:nota"]')),'botón + Nota en Hoy');
await click('[data-act="x:hc:nota"]');await L.sleep(500);
ok((await p.$$('textarea[data-hcsec]')).length===4,'hoja de nota con 4 secciones (fono)');
await p.focus('textarea[data-hcsec]');await click('[data-act="x:hc:phr"]','Buena predisposición');
await fill('textarea[name=s1]','Juego de soplo y praxias.');
await L.sleep(1500);
ok(await p.evaluate(async()=>!!(await CX.vault.get('draft-n-'+S.sessions[0].id))),'borrador autoguardado');
await submit('form[data-form="x:hc:nota"]');await L.sleep(500);
ok((await txt()).includes('✓ Nota'),'nota guardada, se ve en Hoy');
ok(await p.evaluate(async()=>{const n=await CX.vault.get('n-'+S.sessions[0].id);return n&&n.secs['Objetivo trabajado'].includes('Buena predisposición')&&!(await CX.vault.get('draft-n-'+S.sessions[0].id))}),'nota cifrada en bóveda, borrador eliminado');
ok(await p.evaluate(async()=>{const r=(await CX.vault.raw()).find(r=>r.kind==='note');return r&&r.ct&&!JSON.stringify(r).includes('soplo')}),'registro en IndexedDB no legible');
// HC page
await click('nav button','Pacientes');await click('.item','Juana');
ok((await txt()).includes('Historia clínica')&&(await txt()).includes('Contacto y modalidad'),'fila HC y contacto en paciente');
await click('#hcrow');await L.sleep(600);
ok((await txt()).includes('Se puede corregir')&&(await txt()).includes('Folio 1'),'página HC con nota editable');
// ficha
await click('[data-act="x:hc:ficha"]');await L.sleep(300);await fill('textarea[name=motivo]','Dislalia');await submit('form[data-form="x:hc:ficha"]');
ok((await txt()).includes('Dislalia'),'ficha guardada y resumida');
// firmar forzando antigüedad
await p.evaluate(async()=>{const id='n-'+S.sessions[0].id;const n=await CX.vault.get(id);n.at=Date.now()-25*3600e3;await CX.vault.put('note',n.pid,n,id);await CX.refresh()});await L.sleep(600);
ok((await txt()).includes('Firmada'),'nota firmada sola a las 24 h');
await click('.note');await L.sleep(300);
ok((await txt()).includes('Huella')&&(await txt()).includes('Agregar aclaración'),'nota firmada: solo aclaración');
await click('[data-act="x:hc:acl"]');await L.sleep(300);await fill('textarea[data-hcsec]','Donde dice soplo debe decir succión.');await submit('form[data-form="x:hc:nota"]');
ok((await txt()).includes('Aclaración')&&(await txt()).includes('2 registros'),'aclaración agregada');
ok(await p.evaluate(async()=>{const l=await HC.notes(S.patients[0].id);return !(await HC.verify(l))}),'cadena de huellas verifica');
ok(await p.evaluate(async()=>{const id='n-'+S.sessions[0].id;const r=(await CX.vault.raw()).find(r=>r.id===id);const n=await CX.vault.get(id);n.secs['Actividades']='ALTERADA';const e=await encryptObj(CX.vkey,(({_id,_t,_kind,_pid,...o})=>o)(n));await CX.vault.putRaw({...r,...e});const l=await HC.notes(S.patients[0].id);const bad=await HC.verify(l);n.secs['Actividades']='Juego de soplo y praxias.';const e2=await encryptObj(CX.vkey,(({_id,_t,_kind,_pid,...o})=>o)(n));await CX.vault.putRaw({...r,...e2});return !!bad}),'alteración externa detectada');
// eliminar paciente bloqueado
await click('[data-act="x:back"]');await click('[data-act=delpat]');
ok((p._dialogs||[]).some(d=>d.includes('10 años'))&&await p.evaluate(()=>S.patients.length===1),'no deja eliminar paciente con HC');
// cobro + comprobantes
await click('[data-act=newpay]','Cobrar');await submit('form[data-form=pay]');
await click('nav button','Plata');
ok((await txt()).includes('Comprobantes')&&(await txt()).includes('1 por facturar'),'Plata muestra comprobantes pendientes');
await click('[data-act="x:go"]','Comprobantes');
await click('[data-act="x:fac:nueva"]');await L.sleep(300);
ok((await txt()).includes('Factura C')&&(await txt()).includes('Consumidor Final')&&(await txt()).includes('25000'),'hoja de factura asistida');
await fill('input[name=num]','15');await fill('input[name=cae]','12345678901234');await submit('form[data-form="x:fac:emitida"]');
ok(await p.evaluate(()=>S.x.inv.length===1&&S.x.inv[0].st==='ok'&&S.payments[0].inv===S.x.inv[0].id),'factura registrada y cobro vinculado');
ok((await txt()).includes('No hay cobros sin comprobante'),'ya no queda por facturar');
// gasto
await click('[data-act="x:back"]');await click('[data-act="x:fac:gastos"]');await click('.fab');await fill('input[name=amount]','8000');await submit('form[data-form="x:fac:gasto"]');
ok((await txt()).includes('Te queda')&&(await txt()).includes('17.000'),'gasto y neto');
await click('[data-act="x:back"]');await click('[data-act="x:go"]','Reportes');
ok((await txt()).includes('Cobrado en 2026')&&(await txt()).includes('Exportar a Excel'),'reportes');
// panel
await click('[data-act="x:back"]');await click('[data-act=aj]');
ok((await txt()).includes('Panel')&&(await txt()).includes('Módulos')&&(await txt()).includes('Apoyar Consultorio'),'panel de control');
await click('.item','Aumentar aranceles');await fill('input[name=pct]','10');await submit('form[data-form="x:panel:aumento"]');
ok(await p.evaluate(()=>S.patients[0].fee===27500),'aumento 10% aplicado');
await click('[data-act=undo]');await L.sleep(400);ok(await p.evaluate(()=>S.patients[0].fee===25000),'aumento deshecho');
// módulos off
await click('.item','Módulos');await p.evaluate(()=>{const c=document.querySelector('[data-id=hc]');c.checked=false;c.dispatchEvent(new Event('change',{bubbles:true}))});await L.sleep(400);
await click('nav button','Hoy');ok(!(await p.$('[data-act="x:hc:nota"]')),'módulo HC apagado oculta la nota');
await p.evaluate(async()=>{S.x.mods.hc=true;await go()});
// backup + restore
const bk=await p.evaluate(()=>CX.backupBlob());const o=JSON.parse(bk);
ok(o.v===2&&o.core.z===1&&o.vault.length>=3&&!bk.includes('Juana'),'copia v2 comprimida, con bóveda y sin texto plano');
await p.evaluate(async bk=>{await CX.vault.replace([]);localStorage.clear();const f=new File([bk],'b.json');await CX.restore(f)},bk);await L.sleep(500);
ok((await txt()).includes('Ingresá tu clave'),'restaurar bloquea');
await fill('input[name=p]','mala');await submit('form[data-form=unlock]');ok((await txt()).includes('Clave incorrecta'),'clave incorrecta');
await fill('input[name=p]','clave-larga-1');await submit('form[data-form=unlock]');await L.sleep(600);
ok(await p.evaluate(async()=>S.patients.length===1&&(await HC.notes(S.patients[0].id)).length===2),'restaurado con HC');
// donación a los 30 días
await p.evaluate(async()=>{S.x.don.last=addDays(today(),-31);await save();lock()});
await fill('input[name=p]','clave-larga-1');await submit('form[data-form=unlock]');await L.sleep(700);
ok((await txt()).includes('¿Te está sirviendo Consultorio?'),'pedido de aporte a los 30 días');
await click('[data-act="x:don:tengo"]');await L.sleep(300);
await fill('textarea[name=code]','CX1.abc.def');await submit('form[data-form="x:don:code"]');ok((await txt()).includes('no es válido'),'código inventado rechazado');
const code=await (async()=>{const {webcrypto:c}=require('crypto');const jwk=JSON.parse(require('fs').readFileSync(''+(process.env.CX_PRIV||'clave-privada.json')+'')).jwk;const k=await c.subtle.importKey('jwk',jwk,{name:'ECDSA',namedCurve:'P-256'},false,['sign']);const d=Buffer.from(JSON.stringify({n:'Lic. Prueba',d:'2026-11-14',t:'don'}));const s=Buffer.from(await c.subtle.sign({name:'ECDSA',hash:'SHA-256'},k,d));return 'CX1.'+d.toString('base64url')+'.'+s.toString('base64url')})();
await fill('textarea[name=code]',code);await submit('form[data-form="x:don:code"]');
ok(await p.evaluate(()=>!!S.x.don.code&&!DON.due()),'código firmado aceptado, no vuelve a pedir');
// vocabulario consulta
await p.evaluate(async()=>{S.x.prof='med';await go();CX.ui.stack=[];ui.tab='plata';render()});
ok((await txt()).includes('Consultas del mes'),'vocabulario "consulta" para medicina');
console.log(errs.length?'ERRORES:\n'+errs.join('\n'):'sin errores de consola');
await p.screenshot({path:'s-plata.png'});
await b.close();srv.close();
})().catch(e=>{console.error(e);process.exit(1)});
