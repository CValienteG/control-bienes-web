const {abrir,output}=require('./v3-fixtures.cjs');const fs=require('node:fs'),assert=require('node:assert/strict');const out=output;let ok=0;
const report=x=>{ok++;console.log('OK',ok,x);};
async function archivo(p,path,tid='anual'){return p.evaluate(async({bytes,name,tid})=>{const f=new File([new Uint8Array(bytes)],name);const r=await analizarImport(f,{id:tid,...S.data.tomas[tid]});S._imp={r,file:name};S.tomaSel=tid;previewV3();return {enc:r.enc,nol:r.nol,pend:r.pend,conc:r.conc,filas:r.all.size,errores:r.errores,ri:r.cabecera.ri,ubicaciones:ubicacionesImportacionV3(r).map(([k,x])=>({k,actual:x.actual,n:x.bienes}))};},{bytes:[...fs.readFileSync(path)],name:path.split('/').pop(),tid});}
async function filas(p,rows,tid='anual',name='prueba.xlsx'){const bytes=await p.evaluate(async rows=>[...new Uint8Array(await (await xlsxBlob([{name:'ETIQUETA',rows}])).arrayBuffer())],rows);fs.writeFileSync(out+'/'+name,Buffer.from(bytes));return archivo(p,out+'/'+name,tid);}
(async()=>{
 for(const tid of (process.env.SOLO_UI?[]:['anual','puntual']))for(const cr of ['20312','']){const {p,browser}=await abrir();const bytes=await p.evaluate(async({tid,cr})=>[...new Uint8Array(await (await plantillaToma({id:tid,...S.data.tomas[tid]},cr)).arrayBuffer())],{tid,cr});const path=out+'/nueva-'+tid+'-'+(cr||'todos')+'.xlsx';fs.writeFileSync(path,Buffer.from(bytes));const r=await archivo(p,path,tid);assert.equal(r.filas,cr?151:153);assert.equal(r.pend,r.filas);assert.equal(r.enc,0);assert.equal(r.ri,0);assert.deepEqual(r.errores,[]);report('Descarga '+tid+' / '+(cr||'todos')+': 17 títulos fila 1, pendientes conservados y nueva V3 importable');assert.deepEqual(p.errores,[]);await browser.close();}
 {
 const {p,browser}=await abrir();
 if(process.env.V3_ACTUAL_FILE)fs.copyFileSync(process.env.V3_ACTUAL_FILE,out+'/V3-version-actual.xlsx');
 else{const bytes=await p.evaluate(async()=>{const rows=[...Array.from({length:13},()=>[]),[...V3_HEADERS,'CONSERVACIÓN','CUSTODIO','OPERATIVIDAD','OBSERVACIONES','RESULTADO'],...Object.entries(S.data.bienes).filter(([,b])=>b.crToma==='20312').map(([id,b])=>[b.idEtq,b.codCont,b.nombre,'','','','','','',id,20312,'Operaciones CCB',1,'','','','',''])];return [...new Uint8Array(await (await xlsxBlob([{name:'ETIQUETA',rows}])).arrayBuffer())];});fs.writeFileSync(out+'/V3-version-actual.xlsx',Buffer.from(bytes));}
 const r=await archivo(p,out+'/V3-version-actual.xlsx');assert.equal(r.ri,13);assert.equal(r.filas,151);assert.equal(r.pend,151);assert.deepEqual(r.errores,[]);report((process.env.V3_ACTUAL_FILE?'V3 descargada de la versión anterior':'Fixture de la V3 anterior')+': 18 columnas, cabecera fila 14');await browser.close();
 }
 for(const width of [1366,768,360]){
 const {p,browser}=await abrir(8781,width);
 const H=await p.evaluate(()=>V3_NUEVA_HEADERS),ubic=['Aula 401','áULA402','Aula 403','Depósito','Sala nueva','Otra sala'];
 const rows=Array.from({length:151},(_,i)=>{const v={'ID':i+1,'CÓDIGO CONTABLE':'P-'+String(i+1).padStart(6,'0'),'AGRUPADOR':'SILLAS','ACTIVO':'Silla de prueba','CÓDIGO ADMINISTRACIÓN':'PRUEBA-'+String(i+1).padStart(4,'0'),'CÓDIGO CR':20312,'CR':'Operaciones CCB','Prioridad CR':1,'FECHA DE INVENTARIO':'10/11/2026','EDIFICIO':'CCB','PISO':'4º piso','UBICACIÓN':ubic[i%6],'CANTIDAD':1,'OPERATIVIDAD':'Operativo','CONSERVACIÓN':'Bueno'};return H.map(h=>v[h]??'');});
 // 4º piso is intentionally a real-world floor variant.
 let r=await filas(p,[H,...rows],'anual','151-conteos.xlsx');
 assert.equal(r.enc,151);assert.equal(await p.locator('#v3-conf').count(),0);assert.equal(await p.locator('#mok').innerText(),'Importar 151 conteos');
 assert.match(await p.locator('.v3-summary').innerText(),/151 encontrados · 0 no localizados · 0 pendientes · CR 20312/);
 assert.match(await p.locator('#modal').innerText(),/3 por resolver · 3 resueltas/);
 assert.equal(await p.locator('[data-v3-cust="20312"]').inputValue(),'Eduardo Barba');if(process.env.V3_SCREENSHOTS)await p.screenshot({path:out+'/pendientes-'+width+'.png',animations:'disabled'});
 const pending=p.locator('.v3-location-table').first();assert.equal(await pending.locator('thead th').count(),3);
 const options=await pending.locator('select').first().locator('option').allTextContents();assert.ok(!options.some(x=>x.includes('Aula 301')||x.includes('Almacenes')));
 await p.locator('[data-v3-det="defaults"] summary').click();await p.locator('[data-v3-cust="20312"]').fill('Custodio elegido');
 const deps=pending.locator('tr').filter({has:p.getByText('Depósito',{exact:true})});await deps.locator('select').selectOption('LIM-P4/dep2');
 assert.equal(await p.locator('[data-v3-cust="20312"]').inputValue(),'Custodio elegido');assert.equal(await p.locator('[data-v3-det="defaults"]').getAttribute('open'),'');
 const resolved=p.locator('[data-v3-det="ubicaciones"]');await resolved.locator('summary').click();assert.equal(await resolved.locator('select').evaluateAll(es=>es.filter(e=>e.value==='LIM-P4/dep2').length),1);
 const another=p.locator('.v3-location-table').first().locator('select').first();await another.selectOption('__texto');
 assert.equal(await p.locator('[data-v3-det="ubicaciones"] select').evaluateAll(es=>es.filter(e=>e.value==='LIM-P4/dep2').length),1);
 // Search only filters this selector and doesn't alter other assignments.
 const search=p.locator('.v3-location-table').first().locator('input[type=search]').first();await search.fill('Aula 402');const filtered=await search.locator('..').locator('select option').allTextContents();assert.ok(filtered.some(x=>x.includes('Aula 402')));assert.ok(!filtered.some(x=>x.includes('Aula 401')));
 await p.getByRole('button',{name:'Guardar las no reconocidas como texto',exact:true}).click();assert.match(await p.locator('#modal').innerText(),/0 por resolver · 6 resueltas/);assert.equal(await p.locator('[data-v3-cust="20312"]').inputValue(),'Custodio elegido');
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.ok(await p.locator('#modal').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
 await p.locator('#modal').evaluate(e=>e.scrollTop=0);if(process.env.V3_SCREENSHOTS)await p.screenshot({path:out+'/preview-'+width+'.png',animations:'disabled'});
 await p.locator('#mok').click();await p.getByRole('heading',{name:'Resultado de la importación'}).waitFor();assert.match(await p.locator('.v3-summary').innerText(),/151 guardados · 0 omitidos · 0 por revisar/);
 assert.equal(await p.evaluate(()=>Object.keys(conteos('anual')).length),151);assert.equal(await p.evaluate(()=>Object.values(conteos('anual')).every(c=>c.cu==='Custodio elegido')),true);assert.equal(await p.evaluate(()=>Object.values(conteos('anual')).filter(c=>c.amb==='LIM-P4/dep2').length),25);
 assert.equal(await p.evaluate(()=>Object.values(conteos('anual')).filter(c=>c.ambiente==='Sala nueva'&&!c.amb&&!c.pt).length),25);
 if(process.env.V3_SCREENSHOTS)await p.locator('#modal').screenshot({path:out+'/resultado-'+width+'.png',animations:'disabled'});
 await p.getByText('Ver bienes guardados (151)',{exact:true}).click();await p.locator('[data-act="v3Ficha"]').first().click();assert.equal(await p.locator('#modal').evaluate(e=>e.open),false);assert.equal(await p.locator('#drawer.on').count(),1);
 report('Vista previa '+width+': 151 conteos, tabla alineada, búsqueda por edificio/piso, valores y elecciones estables; texto, resumen y enlaces');
 // Persisted mapping is used in a new analysis; existing counts aren't replaced silently.
 await p.evaluate(()=>closeBien());r=await archivo(p,out+'/151-conteos.xlsx');assert.equal(r.ubicaciones.filter(x=>!x.actual).length,0);assert.equal(await p.locator('#mok').innerText(),'Importar 0 conteos');assert.equal(await p.locator('#mok').isDisabled(),true);
 await p.locator('#imp-over').check();assert.equal(await p.locator('#mok').innerText(),'Importar 151 conteos');await p.locator('[data-v3-det="defaults"] summary').click();await p.locator('[data-v3-cust="20312"]').fill('Nuevo custodio');await p.locator('[data-v3-cust="20312"]').blur();assert.equal(await p.locator('#imp-over').isChecked(),true);
 assert.deepEqual(p.errores,[]);report('Reimportación '+width+': recuerda ubicaciones, conserva existentes; reemplazo explícito no se pierde');await browser.close();
 }
 {
 const {p,browser}=await abrir();const H=await p.evaluate(()=>V3_HEADERS),row=[152,'P-000152','Silla','10/11/2026','CCB','4','Aula 401',1,'INOPERATIVO','PRUEBA-0152',20131,'Sala de ventas',2];
 let r=await filas(p,[H,row],'puntual','legado-estado.xlsx');assert.equal(r.enc,1);assert.equal(await p.locator('[data-v3-cust="20131"]').inputValue(),'');await p.locator('#mok').click();await p.getByRole('heading',{name:'Resultado de la importación'}).waitFor();const c=await p.evaluate(()=>conteos('puntual')['PRUEBA-0152']);assert.equal(c.o,'Inoperativo');assert.equal(c.cu,'');assert.equal(c.c,'Bueno');
 report('V3 original de 13 columnas: ESTADO como OPERATIVIDAD, puntual importa sin custodio');
 await p.evaluate(()=>ACT.closeModal());
 const rev=[...H].reverse(),revr=[...row].reverse();r=await filas(p,[['Nota'],rev,revr],'anual','columnas-reordenadas.xlsx');assert.equal(r.enc,1);assert.equal(r.ri,1);assert.deepEqual(r.errores,[]);report('Cabeceras movidas y columnas reordenadas: lectura por nombre');
 await p.evaluate(()=>ACT.closeModal());const csv=[H.join(';'),row.join(';')].join('\n');fs.writeFileSync(out+'/legado.csv',csv);r=await archivo(p,out+'/legado.csv');assert.equal(r.enc,1);report('CSV anterior: ESTADO y títulos por nombre, sin exigir nombre de hoja');await browser.close();
 }
 {
 const {p,browser}=await abrir();await p.evaluate(()=>ACT.uResponsablesCR());assert.equal(await p.locator('#ff-cr20312').inputValue(),'Eduardo Barba');await p.locator('#ff-cr20131').fill('Responsable de prueba');await p.locator('#mok').click();await p.waitForFunction(()=>!document.querySelector('#modal').open);assert.equal(await p.evaluate(()=>S.data.config.responsablesCR.valores['20312']),'Eduardo Barba');assert.equal(await p.evaluate(()=>responsableCR('20131')),'Responsable de prueba');report('Configuración: responsable 20312 precargado y responsables de CR editables');await browser.close();
 }
 console.log('TOTAL',ok,'Resultados y descargas:',out);
})().catch(e=>{console.error(e);process.exit(1)});
