'use strict';
/* Aportes voluntarios: cada 30 días de uso la app invita a colaborar.
   Se desactiva con un código firmado que entrega el desarrollador a quien aportó.
   El código se valida sin internet con la clave pública de abajo; no se puede inventar. */
const DON={
  DIAS:30,
  PUB:{kty:'EC',crv:'P-256',x:'XdXVyzO2-0Eo1pVb275ssAtwXkafbMU94eQYotvSYlI',y:'ykl62IHJ2VV8e2vE5Tt3nX_JpBToF8Ta7ImpTGjU_W4'},
  LINKS:[
    {l:'Mercado Pago',u:'https://link.mercadopago.com.ar/abelg88',g:'Desde Argentina'},
    {l:'Cafecito',u:'https://cafecito.app/abelg88',g:'Desde Argentina'},
    {l:'PayPal',u:'https://paypal.me/AbelG88',g:'Desde el exterior'},
    {l:'Buy Me a Coffee',u:'https://buymeacoffee.com/abelg88',g:'Desde el exterior'}
  ],
  ub64:s=>{s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return unb64(s)},
  /* devuelve los datos del código si la firma es válida, o null */
  async check(code){
    try{
      const m=String(code||'').replace(/\s+/g,'').match(/^CX1\.([\w-]+)\.([\w-]+)$/);if(!m)return null;
      const key=await crypto.subtle.importKey('jwk',DON.PUB,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
      const data=DON.ub64(m[1]);
      const ok=await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,DON.ub64(m[2]),data);
      return ok?JSON.parse(dec.decode(data)):null;
    }catch(_){return null}
  },
  due(){const d=S.x.don;return !d.code&&S.patients.length>0&&daysBetween(d.last||d.first||today(),today())>=DON.DIAS},
  links(){
    return [...new Set(DON.LINKS.map(x=>x.g))].map(g=>`<div class="sub" style="margin-top:12px">${g}</div><div class="grid2" style="margin-top:6px">${DON.LINKS.filter(x=>x.g===g).map(x=>`<a class="btn sec" target="_blank" rel="noopener" href="${x.u}">${x.l}</a>`).join('')}</div>`).join('');
  }
};

CX.def('don',{
  name:'Aportes',core:true,
  panel:[{sec:'pie',head:'El proyecto',title:'Apoyar Consultorio',p:'don:home',sub:()=>S.x.don.code?'<span class="ok">Gracias por tu aporte</span>':'Es gratis y se sostiene con aportes voluntarios'}],
  pages:{
    home:{view(){
      const d=S.x.don;
      return CX.head('Apoyar Consultorio')+(d.code?`<div class="banner"><b>¡Gracias${d.name?', '+esc(d.name):''}!</b> Tu aporte ayuda a que la app siga mejorando. No vas a volver a ver el pedido.</div>`:`<p class="sub">Consultorio es gratis y no tiene publicidad. Si te ahorra tiempo, un aporte ayuda a mantenerla y mejorarla.</p>`)+`
      ${DON.links()}
      ${d.code?'':`<h3 class="sec">¿Ya aportaste?</h3><p class="mut">Mandá el comprobante a ${esc(LEGAL.CONTACTO)} y te respondemos con un código que desactiva el pedido para siempre.</p>
      <form data-form="x:don:code"><textarea name="code" rows="3" class="keep" placeholder="Pegá acá tu código (empieza con CX1.)" required></textarea><p class="err" id="donerr"></p><button class="sec" style="width:100%">Activar código</button></form>`}`;
    }}
  },
  sheets:{
    pedir(){
      return `<h1 class="sm">¿Te está sirviendo Consultorio?</h1>
      <p class="sub">Es gratis y sin publicidad. Si te ahorra tiempo, podés ayudar a que siga mejorando con un aporte, del monto que quieras.</p>
      ${DON.links()}
      <div class="btns" style="margin-top:22px"><button class="sec" data-act="x:don:tengo">Ya aporté</button><button class="sec" data-act="x:close">Ahora no</button></div>
      <p class="mut">Te lo volvemos a preguntar en ${DON.DIAS} días. Con un código de aporte no aparece más.</p>`;
    }
  },
  acts:{
    tengo(){CX.ui.modal=null;return CX.go('don:home')}
  },
  forms:{
    async code(v,f){
      const info=await DON.check(v.code);
      if(!info){f.querySelector('#donerr').textContent='El código no es válido. Copialo completo, sin espacios de más.';return}
      S.x.don.code=v.code.replace(/\s+/g,'');S.x.don.name=info.n||'';S.x.don.at=today();
      await save();render();toast('¡Gracias por tu aporte!');
    }
  }
});
CX.listen('ready',async()=>{
  if(!DON.due())return;
  S.x.don.last=today();await save();CX.sheet('don:pedir');
});
