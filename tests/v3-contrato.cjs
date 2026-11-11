// Contrato congelado de la V3 (Fase 0.1 del plan integral v2).
// Si esta prueba falla, alguien cambió el formato que se usa en la toma 2026.
// No la "arregles" cambiando los valores esperados: revisa docs/contrato-v3.md
// y confirma el cambio con el usuario antes de tocar nada.
const {abrir,output}=require('./v3-fixtures.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
let ok=0;const report=x=>{ok++;console.log('OK',ok,x);};

const CONSULTA=['ID','CÓDIGO CONTABLE','AGRUPADOR','ACTIVO','MARCA','MODELO','SERIE / PLACA','FECHA DE ADQUISICIÓN','CÓDIGO ADMINISTRACIÓN','CÓDIGO CR','CR','Prioridad CR','RESULTADO'];
const CAMPO=['FECHA DE INVENTARIO','EDIFICIO','PISO','UBICACIÓN','CANTIDAD','OPERATIVIDAD','CONSERVACIÓN','CUSTODIO','OBSERVACIONES'];
const OPER=['Operativo','Inoperativo','No probado','No aplica'];
const COND=['Bueno','Regular','Malo','Por evaluar'];
const RES=['Encontrado','Por conciliar','No localizado'];

(async()=>{
 const {p,browser}=await abrir();
 // 1. Títulos y listas congelados
 const k=await p.evaluate(()=>({consulta:V3_CONSULTA,campo:V3_CAMPO,todos:V3_NUEVA_HEADERS,oper:OPER,cond:COND,res:RES}));
 assert.deepEqual(k.consulta,CONSULTA);assert.deepEqual(k.campo,CAMPO);assert.deepEqual(k.todos,[...CONSULTA,...CAMPO]);assert.equal(k.todos.length,22);
 assert.deepEqual(k.oper,OPER);assert.deepEqual(k.cond,COND);assert.deepEqual(k.res,RES);
 report('22 títulos en el orden congelado (13 de consulta + 9 de campo) y listas de operatividad, conservación y resultado');

 // 2. Archivo descargado: estructura
 const bytes=await p.evaluate(async()=>[...new Uint8Array(await (await plantillaToma({id:'anual',...S.data.tomas.anual},'20312')).arrayBuffer())]);
 const xlsx=path.join(output,'contrato-v3.xlsx');fs.writeFileSync(xlsx,Buffer.from(bytes));
 const info=JSON.parse(execFileSync('python3',['-I','-c',`
import json,sys,openpyxl
wb=openpyxl.load_workbook(sys.argv[1])
ws=wb['ETIQUETA']
dv=[(str(d.sqref),d.type,d.formula1,d.formula2) for d in ws.data_validations.dataValidation]
print(json.dumps({'hojas':wb.sheetnames,'listas_oculta':wb['Listas'].sheet_state,'fila1':[c.value for c in ws[1]],'filas':ws.max_row,'congelada':ws.freeze_panes,'dv':dv,
 'gris':ws['M1'].fill.fgColor.rgb,'amarillo':ws['N1'].fill.fgColor.rgb,'nombres':sorted(wb.defined_names.keys())}))`,xlsx]).toString());
 assert.deepEqual(info.hojas,['ETIQUETA','Léeme','Listas']);assert.equal(info.listas_oculta,'hidden');
 assert.deepEqual(info.fila1,[...CONSULTA,...CAMPO]);assert.equal(info.filas,152);assert.equal(info.congelada,'A2');
 assert.notEqual(info.gris,info.amarillo,'consulta (A–M) y campo (N–V) deben tener colores distintos');
 const dv=Object.fromEntries(info.dv.map(([ref,type,f1,f2])=>[ref.split(':')[0].replace(/\d+/g,''),{type,f1,f2}]));
 assert.equal(dv.R.type,'whole');assert.equal(dv.R.f1,'0');assert.equal(dv.R.f2,'1');
 assert.equal(dv.S.type,'list');assert.match(dv.S.f1,/V3Operatividad/);assert.equal(dv.T.type,'list');assert.match(dv.T.f1,/V3Conservacion/);
 assert.ok(!dv.O&&!dv.P&&!dv.Q,'EDIFICIO, PISO y UBICACIÓN son texto libre (sin listas)');
 assert.ok(info.nombres.includes('V3Operatividad')&&info.nombres.includes('V3Conservacion'));
 report('Descarga: hojas ETIQUETA/Léeme/Listas (oculta), títulos en fila 1, fila 1 fija, colores gris/amarillo, CANTIDAD 0–1, listas solo en OPERATIVIDAD y CONSERVACIÓN');

 // 3. Reglas de interpretación de cada fila
 const H=[...CONSULTA,...CAMPO];
 const fila=(n,v)=>H.map(h=>({'ID':n,'CÓDIGO ADMINISTRACIÓN':'PRUEBA-'+String(n).padStart(4,'0'),'CÓDIGO CONTABLE':'P-'+String(n).padStart(6,'0'),'ACTIVO':'Silla de prueba','CÓDIGO CR':20312,'CR':'Operaciones CCB','Prioridad CR':1,...v})[h]??'');
 const completo={'CANTIDAD':1,'EDIFICIO':'CCB','PISO':'4','UBICACIÓN':'Aula 401'};
 const casos=[
  [1,{...completo},'Encontrado','CANTIDAD + EDIFICIO + PISO + UBICACIÓN'],
  [2,{...completo,'OPERATIVIDAD':'Operativo','CONSERVACIÓN':'Bueno','CUSTODIO':'Ana'},'Encontrado','completo con datos opcionales'],
  [3,{'UBICACIÓN':'Aula 401'},null,'solo UBICACIÓN (incompleta)'],
  [4,{'OPERATIVIDAD':'Operativo','CONSERVACIÓN':'Bueno','CUSTODIO':'Ana'},null,'sin CANTIDAD ni ubicación (incompleta)'],
  [5,{'CANTIDAD':1,'EDIFICIO':'CCB','PISO':'4'},null,'sin UBICACIÓN (incompleta)'],
  [6,{'CANTIDAD':1},null,'solo CANTIDAD 1 (incompleta)'],
  [7,{'CANTIDAD':0},'No localizado','CANTIDAD 0'],
  [8,{'CONSERVACIÓN':'No localizado'},'No localizado','«No localizado» escrito en CONSERVACIÓN'],
  [9,{...completo,'RESULTADO':'Por conciliar'},'Por conciliar','RESULTADO Por conciliar con los obligatorios'],
  [10,{'FECHA DE INVENTARIO':'10/11/2026','OBSERVACIONES':'revisar'},null,'solo FECHA y OBSERVACIONES'],
  [11,{},null,'fila sin datos de campo'],
  [12,{'MARCA':'Otra','MODELO':'X','SERIE / PLACA':'123'},null,'solo columnas grises editadas'],
 ];
 const rows=[H,...casos.map(([n,v])=>fila(n,v))];
 const out=await p.evaluate(async rows=>{const blob=await xlsxBlob([{name:'ETIQUETA',rows}]);const f=new File([blob],'contrato.xlsx');const r=await analizarImport(f,{id:'anual',...S.data.tomas.anual});
  const reg=Object.fromEntries([...r.reg.entries()].map(([id,x])=>[id,x.d?.r||null]));return {reg,errores:r.errores,incompletas:r.incompletas.map(x=>[x.ri,x.faltan.join(',')])};},rows);
 assert.deepEqual(out.errores,[]);
 assert.deepEqual(out.incompletas,[[4,'CANTIDAD,EDIFICIO,PISO'],[5,'CANTIDAD,EDIFICIO,PISO,UBICACIÓN'],[6,'UBICACIÓN'],[7,'EDIFICIO,PISO,UBICACIÓN']],'filas incompletas y lo que les falta');
 for(const [n,,esperado,desc] of casos){const id='PRUEBA-'+String(n).padStart(4,'0');assert.equal(out.reg[id]??null,esperado,`${desc}: se esperaba ${esperado??'pendiente'}`);}
 report('Reglas: Encontrado exige CANTIDAD, EDIFICIO, PISO y UBICACIÓN; si falta alguno la fila es incompleta y no se importa; CANTIDAD 0 o «No localizado» = No localizado sin ubicación; RESULTADO Por conciliar se respeta');

 // 3b. Bienes que no están en la lista (sobrantes)
 const sob=[H,fila(30,completo),
  H.map(h=>({'ACTIVO':'Silla giratoria negra','MARCA':'Acme','CANTIDAD':2,'EDIFICIO':'CCB','PISO':'4','UBICACIÓN':'Aula 401','CÓDIGO CR':20312,'OBSERVACIONES':'sin etiqueta'})[h]??''),
  H.map(h=>({'ACTIVO':'Mesa plegable','CANTIDAD':1,'EDIFICIO':'CCB'})[h]??''),
  H.map(h=>({'ACTIVO':'Proyector antiguo','CANTIDAD':1,'EDIFICIO':'Almacenes','PISO':'6','UBICACIÓN':'Depósito','CÓDIGO CR':20312})[h]??''),
  H.map(h=>({'ID':9999,'ACTIVO':'Silla con ID mal escrito','CANTIDAD':1,'EDIFICIO':'CCB','PISO':'4','UBICACIÓN':'Aula 401'})[h]??''),
  H.map(h=>({'ACTIVO':'Pizarra','CANTIDAD':0})[h]??'')];
 const rs=await p.evaluate(async rows=>{const blob=await xlsxBlob([{name:'ETIQUETA',rows}]);const r=await analizarImport(new File([blob],'sobrantes.xlsx'),{id:'anual',...S.data.tomas.anual});
  S._imp={r,file:'sobrantes.xlsx'};S.tomaSel='anual';previewV3();const boton=document.querySelector('#mok').innerText;
  await ejecutarV3();const t=S.data.tomas.anual;return {errores:r.errores,sob:r.sobrantes.map(x=>[x.ri,x.s.d,x.s.cant,x.s.cr,x.s.ub]),desc:r.desconocidos.map(x=>x.ri),inc:r.incompletas.map(x=>[x.ri,x.d]),boton,guardados:(t.sobrantes||[]).map(s=>[s.d,s.cant,s.cr,s.marca]),modal:document.querySelector('#modal').innerText};},sob);
 assert.deepEqual(rs.errores,[]);
 assert.deepEqual(rs.sob,[[3,'Silla giratoria negra',2,'20312','CCB · 4 · Aula 401'],[5,'Proyector antiguo',1,'20312','Almacenes · 6 · Depósito']]);
 assert.deepEqual(rs.inc,[[4,'Mesa plegable']]);assert.deepEqual(rs.desc,[6,7],'un ID escrito que no existe, o un no registrado con CANTIDAD 0, no se toma como sobrante: queda por revisar');
 assert.equal(rs.boton,'Importar 1 conteo y 2 no registrados');
 assert.deepEqual(rs.guardados,[['Silla giratoria negra',2,'20312','Acme'],['Proyector antiguo',1,'20312','']]);
 assert.match(rs.modal,/2 bienes no registrados agregados como sobrantes/);assert.match(rs.modal,/1 filas incompletas no se importaron/);
 const re=await p.evaluate(async rows=>{const blob=await xlsxBlob([{name:'ETIQUETA',rows}]);const r=await analizarImport(new File([blob],'sobrantes.xlsx'),{id:'anual',...S.data.tomas.anual});return r.sobrantes.map(x=>x.s.ya);},sob);
 assert.deepEqual(re,[true,true]);
 report('Bienes no registrados: filas sin ID ni código ADM, con ACTIVO y los obligatorios se agregan como sobrantes del CR; incompletos se listan; CANTIDAD 0 se ignora; reimportar no los duplica');

 // 4. Columnas de más y orden distinto: se lee por título
 const H2=['COLUMNA PROPIA',...[...H].reverse()];
 const f2=fila(20,{...completo,'UBICACIÓN':'Aula 403'});const v2=Object.fromEntries(H.map((h,i)=>[h,f2[i]]));
 const out2=await p.evaluate(async rows=>{const blob=await xlsxBlob([{name:'ETIQUETA',rows}]);const r=await analizarImport(new File([blob],'orden.xlsx'),{id:'anual',...S.data.tomas.anual});return {reg:r.reg.get('PRUEBA-0020')?.d?.r,errores:r.errores};},[H2,['nota',...[...H].reverse().map(h=>v2[h])]]);
 assert.deepEqual(out2.errores,[]);assert.equal(out2.reg,'Encontrado');
 // Requisito mínimo: los 13 títulos base de la V3 original deben estar presentes (V3_HEADERS o sus equivalentes nuevos).
 const falta=await p.evaluate(async rows=>{const blob=await xlsxBlob([{name:'ETIQUETA',rows}]);try{await analizarImport(new File([blob],'falta.xlsx'),{id:'anual',...S.data.tomas.anual});return 'importó';}catch(e){return e.message;}},[H.filter(h=>h!=='UBICACIÓN'),fila(21,{}).filter((_,i)=>H[i]!=='UBICACIÓN')]);
 assert.notEqual(falta,'importó','sin la columna UBICACIÓN la hoja no debe importarse');
 report('Lectura por títulos: columnas en otro orden o columnas propias se aceptan; si falta un título base, la hoja se rechaza');

 assert.deepEqual(p.errores,[]);await browser.close();console.log('TOTAL',ok,'· contrato V3 vigente');
})().catch(e=>{console.error(e);process.exit(1);});
