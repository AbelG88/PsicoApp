const L=require('./lib');
const EMAIL=process.env.CX_EMAIL,PW=process.env.CX_PASS; // usuario de prueba creado a mano en Supabase
(async()=>{
const srv=await L.serve(8125),b=await L.launch(),errs=[];
const ok=(c,m)=>{console.log((c?'  ok  ':'  FAIL ')+m);if(!c)process.exitCode=1};
const mk=async()=>{const p=await L.page(b,errs);await p.goto('http://localhost:8125/');await L.sleep(500);return p};
const unlock=async(p,pw,first)=>{await p.evaluate((pw,first)=>{document.querySelector('input[name=p]').value=pw;if(first){document.querySelector('input[name=p2]').value=pw;document.querySelector('input[name=legal]').checked=true}document.querySelector('form[data-form=unlock]').requestSubmit()},pw,first);await L.sleep(1300)};
const login=p=>p.evaluate(async(e,pw)=>{const sb=await NUBE.client();const r=await sb.auth.signInWithPassword({email:e,password:pw});await NUBE.session();return r.error?r.error.message:NUBE.user.email},EMAIL,PW);
const sync=async p=>{await p.evaluate(async()=>{for(let i=0;i<40&&NUBE.busy;i++)await new Promise(r=>setTimeout(r,250));await NUBE.sync();for(let i=0;i<40&&NUBE.busy;i++)await new Promise(r=>setTimeout(r,250))});await L.sleep(300)};
// --- A
const A=await mk();await unlock(A,'clave-uno-123',true);
await A.evaluate(()=>document.querySelector('form[data-form="x:panel:inicio"]').requestSubmit());await L.sleep(600);
await A.evaluate(async()=>{S.patients.push({id:'p1',name:'Ana Uno',phone:'',fee:1000,notes:'',fid:''});S.sessions.push({id:'s1',pid:'p1',date:today(),time:'10:00',status:'asistio',fee:1000});await go();
  await CX.vault.put('note','p1',{pid:'p1',sid:'s1',date:today(),time:'10:00',at:Date.now(),tipo:'nota',secs:{'Evolución':'Texto secreto de la nota'}},'n-s1')});
ok(await login(A)===EMAIL,'A entra con la cuenta');
await A.evaluate(()=>NUBE.activar());await L.sleep(2500);await sync(A);
ok(await A.evaluate(()=>NUBE.meta().on&&NUBE.state==='ok'&&!CX.dirty),'A activó y sincronizó ('+await A.evaluate(()=>NUBE.state+' '+NUBE.msg)+')');
// --- B: dispositivo nuevo
const B=await mk();
ok(await login(B)===EMAIL,'B entra con la cuenta');
await B.evaluate(()=>NUBE.entrar());await L.sleep(1500);
ok((await B.evaluate(()=>document.getElementById('app').innerText)).includes('Encontramos tu consultorio'),'B descarga el consultorio y pide la clave');
await unlock(B,'clave-uno-123');await L.sleep(1500);await sync(B);
ok(await B.evaluate(async()=>S.patients.length===1&&S.patients[0].name==='Ana Uno'&&(await HC.notes('p1')).length===1&&(await HC.notes('p1'))[0].secs['Evolución'].includes('secreto')),'B tiene paciente y nota clínica');
// --- cambios cruzados
await A.evaluate(async()=>{S.patients.push({id:'pA',name:'Solo en A',phone:'',fee:1,notes:'',fid:''});pat('p1').fee=2000;await go()});
await B.evaluate(async()=>{S.patients.push({id:'pB',name:'Solo en B',phone:'',fee:1,notes:'',fid:''});S.x.exp.push({id:'eB',date:today(),cat:'Otros',amount:5});await go();
  await CX.vault.put('note','pB',{pid:'pB',date:today(),time:'',at:Date.now(),tipo:'nota',secs:{'Evolución':'Nota hecha en B'}},'nb1')});
await sync(A);await sync(B);await sync(A);await sync(B);
const st=p=>p.evaluate(async()=>({n:S.patients.map(x=>x.id).sort().join(','),fee:pat('p1').fee,exp:S.x.exp.length,notes:CX.vault.ok?(await CX.vault.raw()).filter(r=>r.kind==='note'&&!r.del).length:-1,dirty:CX.dirty,st:NUBE.state+NUBE.msg}));
const sa=await st(A),sb=await st(B);console.log('   A',JSON.stringify(sa),'\n   B',JSON.stringify(sb));
ok(sa.n==='p1,pA,pB'&&sb.n==='p1,pA,pB'&&sa.fee===2000&&sb.fee===2000&&sa.exp===1&&sa.notes===2&&sb.notes===2,'cambios hechos en A y B se unieron en ambos');
// --- borrado se propaga
await B.evaluate(async()=>{S.patients=S.patients.filter(p=>p.id!=='pA');await go()});await sync(B);await sync(A);
ok(await A.evaluate(()=>!pat('pA')&&!!pat('pB')),'un borrado en B llega a A');
// --- cambio de clave
await A.evaluate(async()=>{SALT=crypto.getRandomValues(new Uint8Array(16));KEY=await deriveKey('clave-dos-456',SALT);await go()});await sync(A);
await sync(B);await L.sleep(600);
ok((await B.evaluate(()=>ui.locked&&document.getElementById('app').innerText)||'').includes('La clave se cambió'),'B se bloquea al cambiar la clave en A');
await unlock(B,'clave-uno-123');ok(await B.evaluate(()=>ui.locked),'B: clave vieja ya no sirve');
await unlock(B,'clave-dos-456');await L.sleep(1200);await sync(B);
ok(await B.evaluate(async()=>!ui.locked&&S.patients.length===2&&(await HC.notes('p1')).length===1),'B entra con la clave nueva y conserva todo');
// --- servidor: solo cifrado
const rows=await A.evaluate(async()=>{const sb=await NUBE.client();const {data}=await sb.from('records').select('*');return data});
const blob=JSON.stringify(rows);
ok(rows.length>=3&&!/Ana Uno|secreto|Solo en|Nota hecha/.test(blob),'en la base hay '+rows.length+' filas y ningún dato legible');
// --- anónimo no ve nada
const anon=await A.evaluate(async(u,k)=>{const r=await fetch(u+'/rest/v1/records?select=id',{headers:{apikey:k}});return r.status+' '+(await r.text()).slice(0,80)},'https://infjyoqfrhhbudxojsts.supabase.co','sb_publishable_rb2Q_Pvdjc5YmveKBBMixQ_CcQX565k');
ok(/^40[13]/.test(anon)||anon.endsWith('[]'),'sin sesión no se lee nada ('+anon+')');
// --- choque: dispositivo C con otros datos
const C=await mk();await unlock(C,'otra-clave-999',true);await C.evaluate(()=>document.querySelector('form[data-form="x:panel:inicio"]').requestSubmit());await L.sleep(600);
await login(C);await C.evaluate(()=>NUBE.activar());await L.sleep(1500);
ok((await C.evaluate(()=>document.getElementById('app').innerText)).includes('Esta cuenta ya tiene datos'),'C con datos distintos: pide elegir');
// --- borrar cuenta
if(process.env.CX_KEEP!=='1'){A._answer='BORRAR';await A.evaluate(()=>CX.go('nube:home'));await L.sleep(500);await A.evaluate(()=>document.querySelector('[data-act="x:nube:borrar"]').click());await L.sleep(3000);
ok(await A.evaluate(()=>!NUBE.meta().on&&S.patients.length===2),'cuenta borrada desde la app; datos locales intactos');}
console.log(errs.length?'ERRORES:\n'+[...new Set(errs)].join('\n'):'sin errores de consola');
await b.close();srv.close();
})().catch(e=>{console.error(e);process.exit(1)});
