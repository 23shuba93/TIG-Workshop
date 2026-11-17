'use strict';
// Table 1 selector, not dimensional conformity or a drawing symbol generator.
// Source editions: GOST 14771-76 (2006, changes 1–3), GOST 16037-80 (1999, change 1).
const TIG_CATALOG=(()=>{
const prep={any:'Любая — показать варианты',none:'Без скоса',flange2:'Отбортовка двух кромок',flange1:'Отбортовка одной кромки',one:'Один скос одной кромки',two:'Скос двух кромок (V)',double1:'Два симметричных скоса одной кромки',double2:'Два симметричных скоса двух кромок (X)',curve1:'Криволинейный скос одной кромки',curve2:'Криволинейный скос двух кромок',broken1:'Ломаный скос одной кромки',broken2:'Ломаный скос двух кромок',doubleCurve1:'Два криволинейных скоса одной кромки',doubleCurve2:'Два криволинейных скоса двух кромок',doubleBroken2:'Два ломаных скоса двух кромок',step:'Ступенчатые скосы',bore:'Скосы с расточкой',curveBore:'Криволинейные скосы с расточкой',flare:'Скосы с раздачей',asym:'Два несимметричных скоса'};
const side={any:'Любое — показать варианты',single:'Односторонний без подкладки',double:'Двусторонний',removable:'Съёмная подкладка',permanent:'Остающаяся подкладка / цилиндрическое кольцо',lock:'Замковый',insert:'Расплавляемая вставка',cone:'Коническая подкладка',lip:'Цилиндрический ус',flared:'С раздачей и развальцовкой',pair:'Два односторонних шва муфты'};
const rows=[];
function plate(code,joint,p,w,inp,inn=null,extra=''){rows.push({standard:'14771',code,joint,prep:p,side:w,ranges:{'ИНп':inp,'ИН':inn},extra});}
plate('С1','butt','flange2','single',null,[.5,2]);plate('С28','butt','flange2','single',[.8,4]);plate('С3','butt','flange1','single',null,[.5,2]);
for(const [c,w]of [['С2','single'],['С4','removable'],['С5','permanent'],['С6','lock']])plate(c,'butt','none',w,[.8,6],[.5,4]);
plate('С7','butt','none','double',[3,6],[3,6]);
for(const[c,w]of [['С8','single'],['С9','removable'],['С10','permanent'],['С11','lock'],['С12','double']])plate(c,'butt','one',w,[3,10]);
plate('С13','butt','curve1','double',null);plate('С14','butt','broken1','double',null);plate('С15','butt','double1','double',[6,20]);plate('С16','butt','doubleCurve1','double',null);
for(const[c,w]of [['С17','single'],['С18','removable'],['С19','permanent'],['С20','lock'],['С21','double']])plate(c,'butt','two',w,[3,10]);
plate('С22','butt','step','single',[4,20]);plate('С23','butt','curve2','double',null);plate('С24','butt','broken2','double',null);plate('С25','butt','double2','double',[6,20]);plate('С26','butt','doubleCurve2','double',null);plate('С27','butt','doubleBroken2','double',null);
plate('У1','corner','flange1','single',[.5,3],[.5,3]);plate('У2','corner','flange1','single',[.8,4]);
for(const[c,w]of [['У4','single'],['У5','double']])plate(c,'corner','none',w,[.8,10],null,'Вариант с торцевым примыканием ограничен 4 мм; до 10 мм — другая схема взаимного расположения кромок в таблице 1. Сверьте рисунок.');
plate('У6','corner','one','single',[3,10]);plate('У7','corner','one','double',[3,10]);plate('У8','corner','double1','double',[6,20]);plate('У9','corner','two','single',[3,20]);plate('У10','corner','two','double',[3,20]);
plate('Т1','tee','none','single',[.8,40]);plate('Т3','tee','none','double',[.8,40]);plate('Т6','tee','one','single',[3,10]);plate('Т7','tee','one','double',[3,10]);plate('Т8','tee','double1','double',[6,20]);plate('Т9','tee','double1','double',null);
plate('Н1','lap','none','single',[.8,10],[.8,4]);plate('Н2','lap','none','double',[.8,10],[.8,4]);
function pipe(code,node,joint,p,w,range,dmin=null,extra=''){rows.push({standard:'16037',code,node,joint,prep:p,side:w,ranges:{'ЗН':range},dmin,extra});}
for(const[c,w]of [['С2','single'],['С4','removable'],['С5','permanent']])pipe(c,'pipe','butt','none',w,[2,3],10);
pipe('С8','pipe','butt','one','single',null);pipe('С10','pipe','butt','one','permanent',null);
pipe('С17','pipe','butt','two','single',[3,20],14);pipe('С18','pipe','butt','two','removable',[2,40],10);pipe('С19','pipe','butt','two','permanent',[2,20],10);
pipe('С46','pipe','butt','two','insert',[4,20],25);pipe('С47','pipe','butt','curve2','single',[5,6],25);pipe('С48','pipe','butt','curveBore','single',[6,25],25);
pipe('С49','pipe','butt','bore','permanent',[6,20],25);pipe('С50','pipe','butt','bore','cone',[6,20],25);pipe('С51','pipe','butt','flare','cone',[2,6],10);pipe('С52','pipe','butt','curveBore','permanent',[7,60],25);pipe('С53','pipe','butt','curveBore','permanent',null);
pipe('С54','elbow','butt','two','double',null);pipe('С55','elbow','butt','two','removable',null);pipe('С56','flange','butt','asym','double',null);
pipe('Н1','nipple','lap','none','single',[2,5],10);pipe('Н3','flare','lap','none','single',null);pipe('Н4','coupling','lap','none','pair',null);
pipe('У15','flange','corner','one','flared',null);pipe('У5','flange','corner','none','double',null);pipe('У7','flange','corner','one','double',null);pipe('У8','flange','corner','double1','double',null);
pipe('У16','equalBranch','corner','none','single',null);
pipe('У17','branch','corner','none','single',[2,20],14,'Накладная схема ответвления; сверить рисунок таблицы 1.');
pipe('У18','branch','corner','none','single',[2,25],14,'Вставная схема ответвления; сверить рисунок таблицы 1.');
pipe('У19','branch','corner','one','single',[4,25],14);
pipe('У20','branch','corner','one','lip',[4,20],12);pipe('У21','branch','corner','one','removable',[4,20],12);
return {prep,side,rows,sources:{
'14771':'https://lasar.ru/upload/iblock/5be/5be2f177187e89d7b6ce43619f9222db.pdf',
'16037':'https://files.stroyinf.ru/Data2/1/4294852/4294852667.pdf'
}};
})();
if(typeof module!=='undefined')module.exports=TIG_CATALOG;
