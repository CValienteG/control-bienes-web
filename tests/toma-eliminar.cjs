const {abrir}=require('./v3-fixtures.cjs');const assert=require('node:assert/strict');
// El respaldo previo a eliminar una toma es un solo texto JSON: pocos índices en Firestore aunque la toma sea grande.
(async()=>{const {p,browser}=await abrir();
 await p.evaluate(()=>{const C=S.data['tomas/anual/conteos'];for(const id of S.data.tomas.anual.esperados)C[id]={r:'Encontrado',cant:1,sede:'Sede Central Lima · CCB',piso:'4',ambiente:'Aula 401',cu:'Prueba',c:'Bueno',o:'Operativo',obs:'',u:'admin',t:new Date().toISOString(),imp:{archivo:'x.xlsx',hoja:'ETIQUETA',fila:2}};S.tomaSel='anual';});
 await p.evaluate(()=>ACT.tEliminar());await p.locator('#modal input').first().fill('ELIMINAR');await p.locator('#mok').click();
 await p.waitForFunction(()=>!S.data.tomas.anual,null,{timeout:60000});
 const r=await p.evaluate(()=>{const L=Object.entries(S.data.config).filter(([k])=>k.startsWith('toma-eliminada-'));const d=L[0][1],x=JSON.parse(d.datos);return {n:L.length,tipos:[...new Set(Object.values(d).map(v=>typeof v))],conteos:Object.keys(x.conteos).length,campo:d.conteos,esperados:x.toma.esperados.length,quedan:Object.keys(S.data['tomas/anual/conteos']||{}).length};});
 assert.equal(r.n,1);assert.deepEqual(r.tipos.sort(),['number','string']);assert.equal(r.conteos,153);assert.equal(r.campo,153);assert.equal(r.esperados,153);assert.equal(r.quedan,0);assert.deepEqual(p.errores,[]);
 console.log('OK eliminar toma: respaldo JSON en un solo campo, 153 conteos recuperables, conteos y toma borrados');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
