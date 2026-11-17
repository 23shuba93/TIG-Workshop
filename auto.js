'use strict';
const TigAuto=(()=>{
const E=typeof TigEngine==='undefined'?require('./engine.js'):TigEngine;
const D=typeof TIG_DATA==='undefined'?require('./data.js'):TIG_DATA;
const R=typeof TIG_EVIDENCE==='undefined'?require('./evidence.js'):TIG_EVIDENCE;
const groups={
process:['gas','process','polarity'],
geometry:['geometry','gap','land','angle','capArea'],
regime:['profile','rootI','fillI','flow','fillerRoot','fillerFill'],
filler:['filler'],
electrode:['electrode','diameter','limitMode'],
torch:['nozzle','stickout','arc'],
cycle:['pre','post','upslope','downslope','startI','endI','pulse','peak','base','duty','frequency','en'],
passes:['layerHeight','beadArea','rootWidth'],
materials:['consumptionLength','rodDensity']
};
function mode(s,k){return s['mode_'+k]||'manual';}
function candidates(s){const rec=R.fillers[s.grade];if(rec)return rec.level==='марочная рекомендация'?rec.choices:[];const raw=D.fillers[s.grade];return raw?raw.split(' · ')[0].split(', ').filter(Boolean):[];}
function profile(s){if(!['butt','ring'].includes(s.joint))return null;const list=D.profiles.filter(p=>p.group===s.group&&(!p.only||p.only===s.grade)&&p.geometry!=='custom'&&s.s>=p.rows[0][0]&&s.s<=p.rows.at(-1)[0]);
return list.find(p=>p.id===s.profile&&p.geometry===s.geometry)||list.find(p=>p.geometry===s.geometry)||list[0];}
function reference(s){
 if(s.shape==='round')return R.pipeRegime(s);
 const direct=E.reference(s);
 return direct;
}
function apply(input){
 const s=structuredClone(input),messages={};
 if(mode(s,'process')==='auto'){s.gas='Ar';s.process='ИНп';s.polarity=s.group==='al'?'AC':'DC-';}
 const p=profile(s);
 if(mode(s,'geometry')==='auto'&&s.shape!=='round'){
  if(p){s.geometry=p.geometry;if(p.b!==null)s.gap=p.b;if(p.c!==null)s.land=Math.min(s.s,p.c);if(p.angle>0)s.angle=p.angle;messages.geometry='Начальная геометрия по профилю Юхина. Сверьте с выбранным типом ГОСТ; это не автоматическая проверка разделки.';}
  else {s.land=Math.min(s.land,s.s);messages.geometry='Нет подтверждённой схемы для этой марки и толщины. Переключите геометрию на ручной ввод.';}
 }
 if(mode(s,'regime')==='auto'){
  s.profile=p?.id||'manual';const r=reference(s);
  if(r.pipe){s.rootI=(r.root[0]+r.root[1])/2;s.fillI=r.fill?(r.fill[0]+r.fill[1])/2:null;s.fillerRoot=s.fillerFill=2;messages.regime=r.scope+' '+r.warning;}
  else if(r.values){s.rootI=s.fillI=Math.round((r.values[1]+r.values[2])/2);if(r.values[5]!==null)s.flow=(r.values[5]+r.values[6])/2;if(r.values[4]!==null)s.fillerRoot=s.fillerFill=Math.round(r.values[4]*10)/10;
  messages.regime=r.warning||'Общий ориентир таблицы. Отдельные проверенные режимы корня и заполнения источником не заданы.';}
  else {s.rootI=s.fillI=null;messages.regime=r.error+' Для продолжения используйте ручной режим.';}
 }
 if(mode(s,'filler')==='auto'){
  const c=candidates(s);s.filler=s.process==='ИН'?'':c[0]||'';
  messages.filler=s.process==='ИН'?'Без присадки.':c.length?'Предварительный вариант по марке металла, не гарантия пригодности к условиям эксплуатации. Альтернативы: '+c.join(', '):'Для этой марки нет проверенной записи. Автоподбор не выполнен — задайте присадку вручную.';
 }
 if(s.shape==='round'&&mode(s,'geometry')==='auto')messages.geometry='Размеры разделки трубы назначьте по выбранному типу ГОСТ и технологии. Автоматический перенос разделки листа отключён.';
 if(R.fillers[s.grade])messages.filler=R.fillers[s.grade].level+': '+R.fillers[s.grade].note+' Кандидаты: '+(R.fillers[s.grade].choices.join(', ')||'не назначены')+'. '+R.fillers[s.grade].source;
 if(mode(s,'torch')==='auto'){for(const k of groups.torch)s[k]=E.defaults()[k];messages.torch='Сопло, вылет и длина дуги — начальные настройки проекта. Подтверждённого автоподбора для всех сочетаний нет; сверьте их вручную с горелкой и технологией.';}
 if(mode(s,'cycle')==='auto'){for(const k of groups.cycle)s[k]=E.defaults()[k];messages.cycle='Отображены начальные настройки циклограммы. Для рабочего режима подтвердите их по аппарату и технологии; таймер не заменяет контроль охлаждения титана.';}
 if(mode(s,'electrode')==='auto'){
  const r=E.recommendedElectrode(s);
  if(r.diameter&&!r.error){s.electrode=r.electrode;s.diameter=r.diameter;s.limitMode=r.limitMode;if(s.tipFlat>=s.diameter)s.tipFlat=.15;}
  if(r.error&&r.electrode){s.electrode=r.electrode;s.limitMode='passport';s.passportMin=null;s.passportMax=null;}messages.electrode=r.error||'Рекомендация применена автоматически. Пределы пересчитаны; токи сварки не ограничиваются молча.';
 }
 if(mode(s,'passes')==='auto'){s.layerHeight=2.5;s.beadArea=12;s.rootWidth=3;messages.passes='Геометрическая оценка по высоте слоя 2,5 мм и принятой площади валика 12 мм². Число валиков требует проверки.';}
 if(mode(s,'materials')==='auto'){s.consumptionLength=E.perimeter(s)/1000*s.quantity;s.rodDensity=D.groups[s.group].rho;}
 return {state:s,messages};
}
function designationText(s){const n=E.designation(s),code=s.normMode==='manual'?s.standardCode:n.code;return code?'ГОСТ '+n.standard+(n.standard==='14771'?'-76':'-80')+' — '+code+' — '+n.process:'Тип не выбран';}
return {groups,mode,candidates,profile,reference,apply,designationText};
})();
if(typeof module!=='undefined')module.exports=TigAuto;
