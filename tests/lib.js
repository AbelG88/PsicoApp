const puppeteer=require('puppeteer-core'),http=require('http'),fs=require('fs'),path=require('path');
const ROOT=require('path').join(__dirname,'..');
exports.serve=(port=8123)=>new Promise(r=>{const s=http.createServer((q,res)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';const f=path.join(ROOT,p);
  fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);res.end();return}const t={'.html':'text/html','.js':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'}[path.extname(f)]||'text/plain';res.writeHead(200,{'content-type':t+';charset=utf-8'});res.end(d)})}).listen(port,()=>r(s))});
exports.launch=()=>puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--disable-gpu',...(process.env.CX_NET?['--proxy-server='+process.env.HTTPS_PROXY,'--proxy-bypass-list=localhost;127.0.0.1','--ignore-certificate-errors']:['--no-proxy-server'])]});
exports.page=async(b,errs)=>{const ctx=await b.createBrowserContext();const p=await ctx.newPage();await p.setViewport({width:390,height:800,deviceScaleFactor:2,isMobile:true,hasTouch:true});
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
  p.on('dialog',async d=>{p._dialogs=(p._dialogs||[]);p._dialogs.push(d.message());const a=p._answer;await d.accept(typeof a==='string'?a:undefined)});return p};
exports.sleep=ms=>new Promise(r=>setTimeout(r,ms));
