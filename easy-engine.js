'use strict';
const EasyEngine=(()=>{
const E=typeof TigEngine==='undefined'?require('./engine.js'):TigEngine,D=typeof TIG_DATA==='undefined'?require('./data.js'):TIG_DATA,R=typeof TIG_EVIDENCE==='undefined'?require('./evidence.js'):TIG_EVIDENCE;
const C=typeof TIG_CATALOG==='undefined'?require('./catalog.js'):TIG_CATALOG;
const rows=[[.6,25,35],[1.5,70,85],[2.7,80,100],[3.4,90,120],[4.8,130,160]];
function calculate(x){
 const s={...E.defaults(),...x,gas:'Ar',process:'ИНп',polarity:x.group==='al'?'AC':'DC-',pipeline:['steel','stainless'].includes(x.group),weldSide:'single',jointPrep:'any',mode_regime:'manual',pipeSpec:'document'};
 const errors=[];if(!(s.s>=.5&&s.s<=100))errors.push('Толщина: от 0,5 до 100 мм.');if(s.shape==='round'&&s.d<=2*s.s)errors.push('Наружный диаметр должен быть больше двух толщин стенки.');if(['square','rect'].includes(s.shape)&&(s.a<=2*s.s||s.shape==='rect'&&s.bside<=2*s.s))errors.push('Стороны профиля должны быть больше двух толщин стенки.');if(errors.length)return {errors};
 s.joint=s.shape==='round'&&s.joint==='butt'?'ring':s.joint;s.geometry=['tee','corner','lap'].includes(s.joint)?'fillet':s.s<=2?'square':'V';s.gap=s.geometry==='square'?.5:2;s.land=Math.min(1,s.s/3);s.angle=60;s.fillet=Math.min(s.s,6);s.capArea=s.s<=2?0:5;
 const special=['12ХМ','15ХМ','12Х1МФ','15Х1М1Ф','20Х13','12Х17','ХН78Т','Д16','В95'].includes(s.grade);
 let root=null,fill=null,source='',basis='',flow=8,rod=s.s<=2?1.6:2;
 const pipe=R.pipeRegime({...s,mode_regime:'auto'});
 if(!special&&s.shape==='round'&&pipe.pipe){root=pipe.root;fill=pipe.fill;source=pipe.source;basis=pipe.scope;}
 if(!root&&!special&&['steel','stainless'].includes(s.group)){
  const t=Math.max(.6,Math.min(s.s,4.8)),r=E.interpolate(rows,t).values;root=s.s>4.8?[70,85]:r.slice(1);fill=r.slice(1);source='Lincoln Electric, Square Wave TIG 200, TIG Amperage Values';basis=s.s>4.8?'Модель многопроходного заполнения: корень по ориентиру 1,5 мм, заполнение по 4,8 мм. Это допущение приложения, не табличный режим для всей толщины.':'Интерполяция общего ориентира по толщине. Труба, форма соединения и положение требуют пробной настройки; отдельные коэффициенты не выдумываются.';
 }
 if(!root&&!special){const ps=D.profiles.filter(p=>p.group===s.group&&(!p.only||p.only===s.grade));const p=ps.find(p=>s.s>=p.rows[0][0]&&s.s<=p.rows.at(-1)[0]);if(p){const r=E.interpolate(p.rows,s.s).values;root=fill=r.slice(1,3);flow=r[5]===null?8:(r[5]+r[6])/2;rod=r[4]||2;source='Юхин, с. '+p.page+' · '+p.name;basis='Справочный аналог по группе материала. Табличная схема: '+p.name+'. Применимость к выбранной детали проверяется отдельно.';}}
 s.rootI=root?Math.round((root[0]+root[1])/2):null;s.fillI=fill?Math.round((fill[0]+fill[1])/2):null;s.flow=flow;s.fillerRoot=rod;s.fillerFill=rod;s.en=75;
 const rec=E.recommendedElectrode({...s,rootI:root?.[1]??null,fillI:fill?.[1]??null,shape:'sheet',joint:'butt',profile:'manual'});s.electrode=rec.electrode||'WL15';s.diameter=rec.diameter||2.4;s.limitMode=rec.limitMode||'guide';
 if(x.customElectrode){s.electrode=x.customElectrode;s.diameter=x.customDiameter||2.4;s.limitMode='book';}
 const capacity=E.capacity(s);const warnings=[];if(x.customElectrode&&capacity.max===null)warnings.push('Для выбранного электрода нужен паспортный предел. Ток не изменён.');if(capacity.max&&Math.max(root?.[1]||0,fill?.[1]||0)>capacity.max)warnings.push('Выбранный электрод мал для расчётного тока. Возьмите рекомендуемый диаметр; снижение тока не гарантирует проплавления.');
 const filler=R.fillers[s.grade];s.filler=filler?.choices?.[0]||D.fillers[s.grade]||'По технологии марки';
 const standard=s.shape==='round'?'16037':'14771',process=standard==='16037'?'ЗН':'ИНп';const candidates=['steel','stainless'].includes(s.group)&&s.grade!=='ХН78Т'?C.rows.filter(c=>c.standard===standard&&c.joint===(s.joint==='ring'?'butt':s.joint)&&(standard!=='16037'||c.node==='pipe')&&c.side==='single'&&['none','two','double2'].includes(c.prep)&&c.ranges[process]&&s.s>=c.ranges[process][0]&&s.s<=c.ranges[process][1]&&(!c.dmin||s.d>=c.dmin)):[];const n={standard,process,candidates};const selected=n.candidates.find(c=>c.code===x.weldCode)||n.candidates.find(c=>c.prep===(s.geometry==='V'?'two':'none'))||n.candidates[0];
 if(selected&&['butt','ring'].includes(s.joint)){s.geometry=selected.prep==='none'?'square':selected.prep==='double2'?'X':'V';}
 const area=Math.max(s.s*.5,E.area(s)||0)+s.capArea;const count=s.s<=2?1:Math.min(600,Math.max(2,Math.ceil(area/12)));const passes=Array.from({length:count},(_,i)=>({name:count===1?'Один проход':i===0?'Корень':i===count-1?'Облицовка':'Заполнение',range:i===0?root:fill,current:i===0?s.rootI:s.fillI,rod}));
 const length=E.perimeter(s)/1000,qty=x.quantity||1,speed=x.travelSpeed||100;const time=length*1000*count*qty/speed;const gas=(time+count*qty*11/60)*flow*1.1;const mass=area*length*qty*D.groups[s.group].rho/1000/0.95;
 return {s,errors:[],root,fill,source,basis,flow,rod,rec,warnings,filler,designation:n,selected,passes,length,gas,mass,time,speed,capacity,special};
}
return {calculate};})();
if(typeof module!=='undefined')module.exports=EasyEngine;
