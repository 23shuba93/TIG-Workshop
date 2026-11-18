const assert=require('assert'),E=require('./easy-engine.js');
const base={group:'steel',grade:'Сталь 20',shape:'round',s:6,d:108,a:60,bside:40,joint:'butt',position:'К1',quantity:1};
for(const shape of ['sheet','round','square','rect']){const r=E.calculate({...base,shape});assert.equal(r.errors.length,0);assert(r.root&&r.fill);assert(r.passes.length>0);assert(Number.isFinite(r.gas));assert(r.rec.diameter);assert(r.designation.candidates.length);}
const a=E.calculate(base),b=E.calculate({...base,quantity:2});assert.equal(b.gas,a.gas*2);assert.equal(b.mass,a.mass*2);
assert(E.calculate({...base,d:10}).errors.length);
assert.equal(E.calculate({...base,group:'al',grade:'Д16'}).root,null);
const c=E.calculate({...base,customElectrode:'ЭВЧ',customDiameter:1});assert(c.warnings.length);
assert(E.calculate({...base,s:100,d:530}).passes.length<=600);
console.log('PASS: four shapes, pipe results, consumption scaling, impossible geometry, special alloy, electrode warning, thick-wall pass bound');
