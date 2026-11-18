'use strict';
const Quick=(()=>{
let compact=true,opened=false;try{compact=localStorage.getItem('tig-ui-simple')!=='no';}catch{}
const shapes=[['sheet','Лист'],['round','Круглая труба'],['square','Квадратная'],['rect','Прямоугольная']];
const joints=[['butt','Стыковой'],['tee','Тавровый'],['corner','Угловой'],['lap','Нахлёсточный'],['ring','Кольцевой']];
function adjust(s,k){if(!compact)return s;if(k==='shape'||k==='joint'){
 if(k==='joint'&&s.joint==='ring')s.shape='round';
 if(s.shape==='round'){
 if(s.joint==='butt')s.joint='ring';
 if(!['К1','К2','Н45'].includes(s.position))s.position='К1';
 if(s.weldSide==='any')s.weldSide='single';
 s.pipeline=['steel','ss'].includes(s.group);
 }else{if(s.joint==='ring')s.joint='butt';if(['К1','К2','Н45'].includes(s.position))s.position='Н1';s.pipeline=false;}
 }return s;}
function buttons(k,list){return '<div class="quick-choices" aria-label="'+(k==='shape'?'Форма заготовки':'Тип соединения')+'">'+list.map(([v,t])=>'<button type="button" data-fast="'+k+':'+v+'" aria-pressed="'+(state[k]===v)+'">'+t+'</button>').join('')+'</div>';}
function moveField(k,target){const el=document.querySelector('[data-key="'+k+'"]');if(el)target.append(el.closest('label')||el);}
function layout(){document.body.classList.toggle('compact',compact);const main=$('#main');if(!$('#live-result'))return;
 const toolbar=document.createElement('div');toolbar.className='quick-toolbar';toolbar.innerHTML='<span>Ваш рабочий экран</span><button data-quick="view" class="secondary">'+(compact?'Подробный интерфейс':'Простой интерфейс')+'</button>';main.prepend(toolbar);
 if(!compact)return;
 const workspace=main.querySelector('.workspace');const material=workspace.querySelector('section.card');const shell=document.createElement('div');shell.className='quick-layout';workspace.before(shell);
 const form=document.createElement('div');form.className='quick-form';shell.append(form);form.append(material);
 const h=material.querySelector('h2');h.textContent='1. Заготовка';
 const shape=document.querySelector('[data-key=shape]');shape.closest('label').insertAdjacentHTML('beforebegin',buttons('shape',shapes));shape.closest('label').hidden=true;
 const joint=document.querySelector('[data-key=joint]');joint.closest('label').hidden=true;
 const process=document.createElement('section');process.className='card';process.innerHTML='<h2>2. Соединение</h2>'+buttons('joint',joints)+'<div class="quick-fields"></div>';form.append(process);
 const fields=process.querySelector('.quick-fields');moveField('position',fields);if(state.shape==='round')moveField('weldSide',fields);
 const controls=document.createElement('div');controls.className='quick-controls';controls.innerHTML='<button data-quick="auto">Подобрать автоматически</button><small>Ток, присадка и электрод — по проверенной базе. Ручные значения этих блоков будут заменены.</small>';process.append(controls);
 const result=document.createElement('section');result.className='card quick-result';result.id='quick-result';shell.append(result);
 const details=document.createElement('details');details.className='quick-details';details.open=opened;details.innerHTML='<summary>Ручные настройки, ГОСТ и подробности расчёта</summary>';details.addEventListener('toggle',()=>opened=details.open);shell.after(details);details.append(workspace);
 const heading=main.querySelector('h1');heading.textContent='Выберите заготовку. Получите ориентир.';main.querySelector('.lead').textContent='Автоматический пересчёт при каждом изменении. Точные настройки — в разделе ниже.';
 const pipeline=document.querySelector('[data-key=pipeline]');if(pipeline)fields.append(pipeline.closest('label'));
 refresh();}
function refresh(){const box=$('#quick-result');if(!box)return;const r=TigAuto.reference(state),n=E.designation(state),rec=E.recommendedElectrode(state);const errs=E.errors(state);
 const valid=!errs.length&&!r.error;const mode=state.mode_regime==='manual'?'Ручной режим':valid?'Справочный подбор':'Нужны уточнения';
 const metric=(label,value,small='')=>'<div class="quick-metric"><small>'+label+'</small><strong>'+esc(value)+'</strong>'+(small?'<span>'+esc(small)+'</span>':'')+'</div>';
 let plan=null;try{if(valid&&state.fillI!==null)plan=E.makePlan(state);}catch{}
 box.innerHTML='<div class="quick-result-head"><span class="eyebrow">РЕЗУЛЬТАТ</span><span class="pill">'+mode+'</span></div><h2>'+esc(state.grade)+' · '+fmt(state.s)+' мм</h2><div class="quick-metrics">'+metric('Корень',fmt(state.rootI,0)+' А',state.polarity)+metric('Заполнение',fmt(state.fillI,0)+' А',state.gas)+metric('Рекомендуемый вольфрам',rec.diameter&&!rec.error?rec.electrode+' Ø'+fmt(rec.diameter)+' мм':'Нужны данные')+metric('Присадка',state.filler||'Выберите по технологии','Ø '+fmt(state.fillerRoot)+' / '+fmt(state.fillerFill)+' мм')+'</div><div class="quick-designation">'+esc(n.code?'ГОСТ '+n.standard+' · '+n.code:'Тип ГОСТ требует уточнения')+'<small>Предварительный отбор · '+fmt(E.perimeter(state))+' мм шва</small></div>'+(errs.length?note(errs.map(esc).join('<br>'),'danger'):'')+(r.error?note(esc(r.error),'warning'):'')+'<p class="small">'+(plan?'Черновая оценка: '+plan.length+' проходов. Схему разделки и каждый проход нужно проверить.':r.pipe&&!r.fill?'Источник задаёт только корень. Полный план требует отдельной технологии.':'Для плана проходов уточните режим и разделку.')+'</p><button data-action="go-passes">Карта проходов →</button><details><summary>Основание и ограничения</summary>'+note(esc(r.source||(r.profile?'Юхин, с. '+r.profile.page:'Параметры по вашей технологии')))+(r.scope?'<p>'+esc(r.scope)+'</p>':'')+'<p>'+esc(r.warning||'Ориентир не является аттестованной технологической картой.')+'</p></details><button class="secondary" data-quick="details">Изменить параметры вручную</button>';
 document.querySelectorAll('[data-fast]').forEach(el=>{const[k,v]=el.dataset.fast.split(':');el.setAttribute('aria-pressed',String(state[k]===v));});}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.fast){const[k,v]=b.dataset.fast.split(':');const el=document.querySelector('select[data-key="'+k+'"]');if(el){el.value=v;updateInput(el);}return;}const a=b.dataset.quick;if(a==='view'){compact=!compact;try{localStorage.setItem('tig-ui-simple',compact?'yes':'no');}catch{}render();}if(a==='details'){opened=true;const d=$('.quick-details');if(d){d.open=true;d.scrollIntoView({behavior:'smooth',block:'start'});}}if(a==='auto'){for(const k of ['process','geometry','regime','filler','electrode','passes','materials'])state['mode_'+k]='auto';state=adjust(state,'shape');state=TigAuto.apply(state).state;state.planStamp='';save();render();toast('Автоподбор выполнен в пределах базы. Проверьте результат и условия.');}});
return {layout,refresh,adjust};
})();
