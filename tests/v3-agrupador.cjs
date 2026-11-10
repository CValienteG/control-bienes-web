const {abrir,output}=require('./v3-fixtures.cjs');const fs=require('node:fs'),assert=require('node:assert/strict');
// Agrupador por familia de bienes y columnas descriptivas de la V3.
(async()=>{const {p,browser}=await abrir();
 const propuestas=await p.evaluate(()=>['SILLA DE VISITA','Silla de prueba','TELEVISOR LED 4 K','TV LED PANTALLA PLANA','MUEBLE CENTRO TV','MESA CATERING PLEGABLE','EQUIPO BIOMETRIOCO TIEMPO ASISTEN CIA','OBJETO DESCONOCIDO'].map(agrupadorPropuesto));
 assert.deepEqual(propuestas,['SILLAS','SILLAS','TELEVISORES','TELEVISORES','OTROS MUEBLES','MESAS','SEGURIDAD, ACCESO Y CONTRA INCENDIO','SIN AGRUPADOR']);
 console.log('OK propuesta inicial de agrupadores por descripción');

 // Datos descriptivos en la plantilla.
 await p.evaluate(()=>{Object.assign(S.data.bienes['PRUEBA-0001'],{marca:'Epson',modelo:'X49',serie:'SN-001',fechaAdq:'2019-03-15'});S.data.bienes['PRUEBA-0152'].nombre='TELEVISOR LED';});
 const leer=async()=>{const bytes=await p.evaluate(async()=>[...new Uint8Array(await (await plantillaToma({id:'anual',...S.data.tomas.anual},'')).arrayBuffer())]);const f=output+'/agrupador-'+Date.now()+'.xlsx';fs.writeFileSync(f,Buffer.from(bytes));
  return p.evaluate(async b=>{const sh=(await readXlsx(new Uint8Array(b).buffer)).find(s=>s.name==='ETIQUETA');return sh.rows;},[...bytes]);};
 let rows=await leer();const H=rows[0],col=h=>H.indexOf(h);
 assert.deepEqual(H.slice(0,13),['ID','CÓDIGO CONTABLE','AGRUPADOR','ACTIVO','MARCA','MODELO','SERIE / PLACA','FECHA DE ADQUISICIÓN','CÓDIGO ADMINISTRACIÓN','CÓDIGO CR','CR','Prioridad CR','RESULTADO']);
 const r1=rows.find(r=>r[col('CÓDIGO ADMINISTRACIÓN')]==='PRUEBA-0001'),r152=rows.find(r=>r[col('CÓDIGO ADMINISTRACIÓN')]==='PRUEBA-0152');
 assert.equal(r1[col('AGRUPADOR')],'SILLAS');assert.equal(r1[col('ACTIVO')],'Silla de prueba');assert.deepEqual([r1[col('MARCA')],r1[col('MODELO')],r1[col('SERIE / PLACA')]],['Epson','X49','SN-001']);
 assert.equal(await p.evaluate(v=>ddmmyyyy(xlDate(v)),r1[col('FECHA DE ADQUISICIÓN')]),'15/03/2019');
 assert.equal(r152[col('AGRUPADOR')],'TELEVISORES');
 console.log('OK V3: agrupador, descripción original, marca, modelo, serie y fecha de adquisición en gris');

 // Cambiar el agrupador de un grupo de bienes iguales: aplica a sus bienes, sin tocar descripción ni grupo.
 const key=await p.evaluate(()=>grupoId({id:'PRUEBA-0001',...S.data.bienes['PRUEBA-0001']}));
 await p.evaluate(k=>cambiarAgrupador({keys:[k],valor:'  sillas de visita ',accion:'grupo',firma:firmaDatos(S.data.config.agrupadores||null)}),key);
 const tras=await p.evaluate(()=>({a:agrupador({id:'PRUEBA-0001',...S.data.bienes['PRUEBA-0001']}),tv:agrupador({id:'PRUEBA-0152',...S.data.bienes['PRUEBA-0152']}),nombre:S.data.bienes['PRUEBA-0001'].nombre,eventos:Object.values(S.data.config).filter(x=>x.tipo==='Cambio de agrupador').length}));
 assert.deepEqual(tras,{a:'SILLAS DE VISITA',tv:'TELEVISORES',nombre:'Silla de prueba',eventos:1});
 // Una edición basada en datos viejos no sobrescribe la de otro usuario.
 await assert.rejects(p.evaluate(k=>cambiarAgrupador({keys:[k],valor:'X',accion:'grupo',firma:firmaDatos(null)}),key));
 rows=await leer();assert.equal(rows.find(r=>r[col('CÓDIGO ADMINISTRACIÓN')]==='PRUEBA-0001')[col('AGRUPADOR')],'SILLAS DE VISITA');
 console.log('OK agrupador editable por grupo, con historial y control de cambios simultáneos');

 // Separar bienes conserva el agrupador editado del grupo de origen.
 await p.evaluate(async k=>{const L=['PRUEBA-0003','PRUEBA-0004'];await editarGrupoConfirmado({accion:'separar',origen:k,destino:'manual:prueba',nombre:'Sillas separadas',ids:L,afectados:L,firma:firmaDatos(S.data.config.gruposBienes||null)});},key);
 assert.equal(await p.evaluate(()=>agrupador({id:'PRUEBA-0003',...S.data.bienes['PRUEBA-0003']})),'SILLAS DE VISITA');
 console.log('OK separar bienes hereda el agrupador');

 // Vista de grupos: columna y filtro de agrupador; el registro por cantidad sigue por grupo de bienes iguales.
 await p.evaluate(()=>{S.view='bienes';S.igVista=true;S.grAgr='TELEVISORES';render();});
 const th=await p.locator('.grupos-compartidos thead th').allTextContents(),filas=await p.locator('.grupos-compartidos tbody tr').allInnerTexts();assert.equal(th[0],'Agrupador');assert.equal(filas.length,1);assert.match(filas[0],/^TELEVISORES\tTELEVISOR LED\t1\b/);
 assert.equal(await p.locator('[data-act="grAgrupador"][data-id="renombrar"]').count(),1);
 await p.evaluate(()=>{S.grAgr='';S.view='inventario';S.igVista=false;render();});
 console.log('OK vista de grupos con columna y filtro de agrupador');

 // Importación: la plantilla nueva no reporta columnas ignoradas; la V3 de 17 columnas anterior sigue entrando.
 const bytes=await p.evaluate(async()=>[...new Uint8Array(await (await plantillaToma({id:'anual',...S.data.tomas.anual},'20312')).arrayBuffer())]);
 const imp=await p.evaluate(async b=>{const r=await analizarImport(new File([new Uint8Array(b)],'nueva.xlsx'),{id:'anual',...S.data.tomas.anual});return {ign:r.cabecera.ignoradas,filas:r.all.size,err:r.errores};},bytes);
 assert.deepEqual(imp,{ign:[],filas:151,err:[]});
 const viejo=await p.evaluate(async()=>{const H=['ID','CÓDIGO CONTABLE','ACTIVO (grupo)','CÓDIGO ADMINISTRACIÓN','CÓDIGO CR','CR','Prioridad CR','RESULTADO','FECHA DE INVENTARIO','EDIFICIO','PISO','UBICACIÓN','CANTIDAD','OPERATIVIDAD','CONSERVACIÓN','CUSTODIO','OBSERVACIONES'];
  const rows=[H,[2,'P-000002','Silla de prueba','PRUEBA-0002',20312,'Operaciones CCB',1,'','10/11/2026','CCB','4','Aula 401',1,'Operativo','Bueno','','']];
  const r=await analizarImport(new File([await xlsxBlob([{name:'ETIQUETA',rows}])],'v3-17.xlsx'),{id:'anual',...S.data.tomas.anual});return {enc:r.enc,ign:r.cabecera.ignoradas,err:r.errores};});
 assert.deepEqual(viejo,{enc:1,ign:[],err:[]});
 console.log('OK importación: plantilla de 22 columnas sin columnas ignoradas y V3 de 17 columnas compatible');
 assert.deepEqual(p.errores,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
