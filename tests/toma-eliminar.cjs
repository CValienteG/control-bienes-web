const {abrir}=require('./v3-fixtures.cjs');const assert=require('node:assert/strict');
// El respaldo previo a eliminar una toma es un solo texto JSON: pocos índices en Firestore aunque la toma sea grande.
(async()=>{const {p,browser}=await abrir();
 await p.evaluate(()=>{const C=S.data['tomas/anual/conteos'];for(const id of S.data.tomas.anual.esperados)C[id]={r:'Encontrado',cant:1,sede:'Sede Central Lima · CCB',piso:'4',ambiente:'Aula 401',cu:'Prueba',c:'Bueno',o:'Operativo',obs:'',u:'admin',t:new Date().toISOString(),imp:{archivo:'x.xlsx',hoja:'ETIQUETA',fila:2}};S.tomaSel='anual';});
 const antes=await p.evaluate(()=>Object.fromEntries(Object.entries(S.data.tomas.anual.crEstados).map(([cr,e])=>[cr,e.revision||0])));
 // Registra cada escritura de la toma: en Firestore, escrituras simultáneas sobre ella compiten entre sí.
 await p.evaluate(()=>{window._lotes=[];const orig=transaccionCR;transaccionCR=async(paths,fn)=>orig(paths,v=>{const r=fn(v);const w=(r.writes||[]).find(([k])=>k==='tomas/anual');if(w)_lotes.push({cr:w[1].crEditado,n:w[1].loteConteos.ids.length,conteos:r.writes.length-1});return r;});});
 await p.evaluate(()=>ACT.tEliminar());await p.locator('#modal input').first().fill('ELIMINAR');await p.locator('#mok').click();
 await p.waitForFunction(()=>!S.data.tomas.anual,null,{timeout:60000});
 const r=await p.evaluate(()=>{const L=Object.entries(S.data.config).filter(([k])=>k.startsWith('toma-eliminada-'));const d=L[0][1],x=JSON.parse(d.datos);return {n:L.length,tipos:[...new Set(Object.values(d).map(v=>typeof v))],conteos:Object.keys(x.conteos).length,campo:d.conteos,esperados:x.toma.esperados.length,quedan:Object.keys(S.data['tomas/anual/conteos']||{}).length};});
 const lotes=await p.evaluate(()=>_lotes);
 assert.deepEqual(lotes,[{cr:'20312',n:100,conteos:100},{cr:'20312',n:51,conteos:51},{cr:'20131',n:2,conteos:2}]);
 assert.equal(r.n,1);assert.deepEqual(r.tipos.sort(),['number','string']);assert.equal(r.conteos,153);assert.equal(r.campo,153);assert.equal(r.esperados,153);assert.equal(r.quedan,0);assert.deepEqual(p.errores,[]);
 console.log('OK eliminar toma: respaldo JSON en un solo campo, 153 conteos recuperables, conteos borrados en 3 lotes por CR (100+51+2) y toma borrada');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
