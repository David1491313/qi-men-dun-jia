import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { computeQiMen as c, RING, GANS, STARS, DOORS } from '../src/features/qimen/engine.js';

// 固定預期值來自網站盤圖原始字形像素；不使用 engine_after_ju 作為預期值。
const rows=JSON.parse(readFileSync(new URL('../docs/day-daily-20261024/results.json',import.meta.url),'utf8'));
for(const [kind,count] of [['daily',52],['boundary',12],['cycle-probe',12]]) test(`日家網站固定對照：${kind} ${count}組`,()=>{
  const group=rows.filter(r=>r.kind===kind);
  assert.equal(group.length,count);
  for(const r of group) assert.equal(c(String(r.year),String(r.month),String(r.day),String(r.hour),'auto','6',String(r.minute)).juText,r.reference_ju,r.id);
});

// 以下由兩張代表盤放大抄錄。網站日家盤未顯示外圈，不能宣稱外圈已驗證。
const charts=[
  {month:'6',ju:'陽1',fu:'天心',shi:'開門',center:'壬',horse:'巳',palace:4,
   stars:['天輔','天英','天芮','天柱','天心','天蓬','天任','天沖'],
   doors:['生門','傷門','杜門','景門','死門','驚門','開門','休門'],
   earth:['戊','丙','庚','辛','乙','己','丁','癸'],
   heaven:['辛','乙','己壬','丁','癸','戊','丙','庚'],
   deities:['白虎','玄武','九地','九天','值符','騰蛇','太陰','六合']},
  {month:'12',ju:'陰6',fu:'天蓬',shi:'休門',center:'己',horse:'申',palace:2,
   stars:['天任','天沖','天輔','天英','天芮','天柱','天心','天蓬'],
   doors:['生門','傷門','杜門','景門','死門','驚門','開門','休門'],
   earth:['癸','丙','辛','庚','丁','壬','乙','戊'],
   heaven:['丙','辛','庚','丁','壬己','乙','戊','癸'],
   deities:['九天','九地','玄武','白虎','六合','太陰','騰蛇','值符']},
];
// 坤二地盤為壬寄己，兌七地盤為乙；表內保留主干，寄宮另外斷言。
for(const e of charts) test(`日家網站代表盤：2025/${e.month}/15 12:30`,()=>{
  const r=c('2025',e.month,'15','12','auto','6','30');
  assert.deepEqual([r.juText,r.xunText,r.fuText,r.zhiFu,r.zhiShi],[e.ju,'甲寅','癸',e.fu,e.shi]);
  assert.deepEqual(RING.map(p=>STARS[r.heavenPan[p].star]),e.stars);
  assert.deepEqual(RING.map(p=>DOORS[r.doorPan[p]]),e.doors);
  assert.deepEqual(RING.map(p=>GANS[r.earthPan[p]]),e.earth);
  assert.equal(GANS[r.earthPan[5]],e.center);
  assert.deepEqual(RING.map(p=>GANS[r.heavenPan[p].stem]+(r.heavenPan[p].extraStem!=null?GANS[r.heavenPan[p].extraStem]:'')),e.heaven);
  assert.deepEqual(RING.map(p=>r.deityPan[p]),e.deities);
  assert.deepEqual([r.emptyText,r.horseText,r.horsePalace],['子丑',e.horse,e.palace]);
});
