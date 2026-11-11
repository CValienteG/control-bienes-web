// F1.1 Espacios: catálogo Sede → Edificio → Piso → Ambiente.
const {abrir}=require('./v3-fixtures.cjs');const assert=require('node:assert/strict');
let ok=0;const report=x=>{ok++;console.log('OK',ok,x);};
(async()=>{
 const {p,browser}=await abrir(8781,1366);
 await p.evaluate(()=>{S.data.espacios={};const z='Centro Cultural de la Biblia';S.data.config.ubicacionesV3={mapa:{[JSON.stringify([z,'4','aula cuatro cero uno'])]:'LIM-P4/401',[JSON.stringify([z,'4','texto libre'])]:'__texto'}};
  S.data.bienes['PRUEBA-0001'].amb='LIM-P4/401';S.data.bienes['PRUEBA-0002'].amb='LIM-P4/401';S.data.bienes['PRUEBA-0003'].amb='LIM-P4/402';location.hash='espacios';});
 await p.waitForFunction(()=>S.view==='espacios');
 assert.match(await p.locator('#main').innerText(),/Aún no hay catálogo de espacios/);
 await p.getByRole('button',{name:'Crear catálogo inicial'}).click();
 const nota=await p.locator('#modal').innerText();assert.match(nota,/7 sedes, 8 edificios, 3 pisos y \d+ ambientes/);assert.match(nota,/con 1 nombres usados en campo/);
 await p.locator('#mok').click();await p.waitForFunction(()=>Object.keys(S.data.espacios).length>=18&&!espFaltantes().length&&!$('#modal').open);
 const r=await p.evaluate(()=>{const E=S.data.espacios,c=k=>Object.values(E).filter(e=>e.nivel===k).length;return {sedes:c('sede'),edif:c('edificio'),pisos:Object.values(E).filter(e=>e.nivel==='piso').map(e=>e.padre+'>'+e.codigo).sort(),amb:c('ambiente'),a401:E['LIM-CCB-P4-401'],alm:Object.keys(E).filter(k=>k.startsWith('LIM-ALM-P4-')),suc:Object.keys(E).filter(k=>k.endsWith('-PRI')).sort()};});
 assert.equal(r.sedes,7);assert.equal(r.edif,8);assert.deepEqual(r.pisos,['LIM-ALM>P4','LIM-CCB>P3','LIM-CCB>P4']);
 assert.equal(r.a401.nombre,'Aula 401');assert.equal(r.a401.tipoAmbiente,'Aula');assert.deepEqual(r.a401.alias,['aula cuatro cero uno']);assert.equal(r.a401.plano,'LIM-P4');
 assert.ok(r.alm.length>=1,'el ambiente de Almacenes del piso 4 va al edificio Almacenes');assert.deepEqual(r.suc,['AQP-PRI','CUZ-PRI','HYO-PRI','JUL-PRI','PIU-PRI','TRU-PRI']);
 await p.waitForFunction(()=>!document.querySelector('#main [data-act="espSembrar"]'));assert.equal(await p.locator('#main [data-act="espSembrar"]').count(),0,'sin faltantes no se ofrece de nuevo');
 report('Catálogo inicial: 7 sedes, Almacenes y CCB con pisos y ambientes de los planos, edificio principal por sucursal, tipo sugerido y alias de la V3; no se repite');
 // Bienes por espacio
 const cuenta=await p.evaluate(()=>({amb:espBienesDe({id:'LIM-CCB-P4-401',...S.data.espacios['LIM-CCB-P4-401']}).length,piso:espBienesDe({id:'LIM-CCB-P4',...S.data.espacios['LIM-CCB-P4']}).length,sede:espBienesDe({id:'LIM',...S.data.espacios.LIM}).length}));
 assert.deepEqual(cuenta,{amb:2,piso:3,sede:3});
 await p.locator('details[data-esp-piso="LIM-CCB-P4"] summary').click();await p.locator('[data-act="espVer"][data-id="LIM-CCB-P4-401"]').click();
 const ver=await p.locator('#modal').innerText();assert.match(ver,/Sede Lima principal → Centro Cultural de la Biblia \(CCB\) → .* → Aula 401/);assert.match(ver,/2 bienes/);assert.match(ver,/PRUEBA-0001/);
 await p.evaluate(()=>ACT.closeModal());
 report('Bienes por ambiente, piso y sede según la ficha; ruta completa del ambiente');
 // Sucursal: agregar piso y ambiente
 await p.evaluate(()=>ACT.espSede('PIU'));await p.locator('[data-act="espNuevo"][data-id="PIU-PRI"]').click();
 await p.locator('#ff-nombre').fill('Primer piso');await p.locator('#ff-codigo').fill('p1');await p.locator('#mok').click();await p.waitForFunction(()=>S.data.espacios['PIU-PRI-P1']);
 await p.evaluate(()=>ACT.espNuevo('PIU-PRI-P1'));await p.locator('#ff-nombre').fill('Oficina de ventas');await p.locator('#ff-codigo').fill('101');await p.locator('#ff-tipoAmbiente').selectOption('Oficina');await p.locator('#mok').click();
 await p.waitForFunction(()=>S.data.espacios['PIU-PRI-P1-101']);
 const dup=await p.evaluate(async()=>{ACT.espNuevo('PIU-PRI-P1');await new Promise(r=>setTimeout(r,50));$('#ff-nombre').value='Otra';$('#ff-codigo').value='101';$('#mok').click();await new Promise(r=>setTimeout(r,100));return $('#ferr')?.textContent||'';});
 assert.match(dup,/Ya existe/);await p.evaluate(()=>ACT.closeModal());
 assert.deepEqual(await p.evaluate(()=>{const e=S.data.espacios['PIU-PRI-P1-101'];return [e.nivel,e.padre,e.codigo,e.tipoAmbiente];}),['ambiente','PIU-PRI-P1','101','Oficina']);
 report('Sucursal: agregar piso y ambiente con código; código repetido rechazado');
 // Editar
 await p.evaluate(()=>ACT.espEditar('LIM-CCB-P4-401'));await p.locator('#ff-alias').fill('aula cuatro cero uno\nSalón 401\nSalón 401');await p.locator('#ff-tipoAmbiente').selectOption('Sala');await p.locator('#mok').click();
 await p.waitForFunction(()=>S.data.espacios['LIM-CCB-P4-401'].tipoAmbiente==='Sala');
 assert.deepEqual(await p.evaluate(()=>S.data.espacios['LIM-CCB-P4-401'].alias),['aula cuatro cero uno','Salón 401']);
 await p.evaluate(()=>{ACT.espSede('LIM');S.espQ='salon 401';render();});await p.waitForFunction(()=>/Aula 401/.test($('#main').innerText)&&!/Aula 402/.test($('#main').innerText));
 await p.evaluate(()=>{S.espQ='';render();});
 report('Editar nombre, tipo y nombres alternativos (sin repetidos); la búsqueda encuentra por nombre alternativo');
 // Sin permisos de administrador
 const noadmin=await p.evaluate(()=>{S.admin=false;doRender();const b=document.querySelectorAll('[data-act="espEditar"],[data-act="espNuevo"],[data-act="espSembrar"]').length;let err='';try{ACT.espEditar('LIM');}catch(e){err=e.message;}S.admin=true;doRender();return {b,err};});
 assert.equal(noadmin.b,0);assert.match(noadmin.err,/administrador/);
 report('Solo el administrador ve y usa crear, agregar y editar');
 // Diseño y otras vistas
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 for(const v of ['resumen','bienes','inventario','planos'])await p.evaluate(v=>{location.hash=v;},v);await p.waitForTimeout(200);
 assert.deepEqual(p.errores,[]);await browser.close();
 console.log('TOTAL',ok,'· espacios');
})().catch(e=>{console.error(e);process.exit(1);});
