const {abrir}=require('./v3-fixtures.cjs');const assert=require('node:assert/strict');
// Una toma V3 trae cada bien con su propio código contable: no es un código compartido.
(async()=>{const {p,browser}=await abrir();
 const r=await p.evaluate(async()=>{const fila=(b,id)=>[b.idEtq,b.codCont,b.nombre,'','','','','','',id,20312,'Operaciones CCB',1];
  const libro=async filas=>new File([await xlsxBlob([{name:'ETIQUETA',rows:[V3_HEADERS,...filas]}])],'codigos.xlsx');
  const t={id:'anual',...S.data.tomas.anual},B=S.data.bienes,ids=Object.keys(B).filter(id=>B[id].crToma==='20312');
  const limpio=await analizarImport(await libro(ids.map(id=>fila(B[id],id))),t);
  B[ids[1]].codCont=B[ids[0]].codCont;const otroEnBase=await analizarImport(await libro([fila(B[ids[0]],ids[0])]),t);
  const ambosEnArchivo=await analizarImport(await libro([fila(B[ids[0]],ids[0]),fila(B[ids[1]],ids[1])]),t);
  return {limpio:limpio.avisosContables.length,otro:otroEnBase.avisosContables.map(a=>a.bienes.map(b=>b.id)),ambos:ambosEnArchivo.avisosContables.map(a=>[a.enArchivo,a.bienes.length])};});
 assert.equal(r.limpio,0);assert.deepEqual(r.otro,[['PRUEBA-0002']]);assert.deepEqual(r.ambos,[[true,2]]);
 console.log('OK códigos contables: cada fila no se compara consigo misma; compartidos en base o en archivo siguen avisándose');assert.deepEqual(p.errores,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
