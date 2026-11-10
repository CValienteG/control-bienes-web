const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const output=process.env.V3_TEST_OUTPUT||fs.mkdtempSync(path.join(os.tmpdir(),'control-bienes-v3-'));fs.mkdirSync(output,{recursive:true});
function datos(){
 const bienes=Object.fromEntries(Array.from({length:153},(_,i)=>{const id='PRUEBA-'+String(i+1).padStart(4,'0');return [id,{codigo:id,idEtq:i+1,codCont:'P-'+String(i+1).padStart(6,'0'),nombre:'Silla de prueba',tipo:'AF',categoria:'MUEBLES',seccion:'MUEBLES',etapa:'en_uso',crToma:i<151?'20312':'20131',hist:[]}];}));
 const esperados=Object.keys(bienes),crPorBien=Object.fromEntries(esperados.map(id=>[id,bienes[id].crToma]));
 const tomas={anual:{anualCR:1,nombre:'PRUEBA ANUAL',estado:'abierta',esperados,crPorBien,crEstados:Object.fromEntries(['20312','20131'].map(cr=>[cr,{estado:'abierta',version:0,revision:0,actas:[]}])),cierresRealizados:0,cierresEnCurso:0},puntual:{nombre:'PRUEBA PUNTUAL',estado:'abierta',esperados,sobrantes:[]}};
 const ambientes=[{id:'401',nombre:'Aula 401',zona:'Centro Cultural de la Biblia',x:40,y:40,w:10,h:10},{id:'402',nombre:'Aula 402',zona:'Centro Cultural de la Biblia',x:60,y:40,w:10,h:10},{id:'403',nombre:'Aula 403',zona:'Centro Cultural de la Biblia',x:60,y:60,w:10,h:10},{id:'dep1',nombre:'Depósito',zona:'Centro Cultural de la Biblia',x:20,y:40,w:10,h:10},{id:'dep2',nombre:'Depósito',zona:'Centro Cultural de la Biblia',x:70,y:40,w:10,h:10},{id:'alm',nombre:'Aula 402',zona:'Almacenes',x:20,y:10,w:10,h:10}];
 return {bienes,tomas,planos:{'LIM-P4':{nombre:'Piso 4',piso:'4',orden:4,marco:'LIM',zona:'Centro Cultural de la Biblia',ambientes},'LIM-P3':{nombre:'Piso 3',piso:'3',orden:3,marco:'LIM',ambientes:[{...ambientes[0],id:'301',nombre:'Aula 301'}]}},config:{cuadrantes:{on:true,x:50,y:25,nombres:['C2','C1','C3','C4']},crPrioridad:{crs:{20312:{nombre:'Operaciones CCB',prioridad:1},20131:{nombre:'Sala de ventas',prioridad:2}}}},'tomas/anual/conteos':{},'tomas/puntual/conteos':{},equipos:{},sistemas:{},mantenimientos:{}};
}
async function abrir(port=8781,width=1366){
 const browser=await chromium.launch({args:['--no-sandbox'],...(process.env.BROWSER_BIN?{executablePath:process.env.BROWSER_BIN}:fs.existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium'}:{})});const p=await browser.newPage({viewport:{width,height:1000},acceptDownloads:true});
 p.errores=[];p.on('pageerror',e=>p.errores.push(e.message));
 await p.route('https://www.gstatic.com/firebasejs/**',r=>r.fulfill({body:'',contentType:'application/javascript'}));
 await p.goto((process.env.TEST_BASE_URL||'http://127.0.0.1:'+port+'/index.html')+'?local',{waitUntil:'domcontentloaded'});
 await p.evaluate(D=>{DB=null;FS=null;S.data=D;S.loaded=Object.fromEntries(Object.keys(S.loaded).map(k=>[k,true]));Object.assign(S,{me:'admin',myName:'Prueba',admin:true,readonly:false,mode:'local',usuarios:{admin:{activo:true,rol:'admin',nombre:'Prueba'}},view:'inventario',sel:null,tomaSel:'anual',tf:'todos'});render();},datos());
 return {p,browser};
}
module.exports={datos,abrir,output};
