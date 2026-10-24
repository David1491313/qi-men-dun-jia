import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { computeQiMen, RING, GANS, STARS, DOORS } from '../src/features/qimen/engine.js';

// reference_ju 是網站實際盤圖的固定字形像素讀值，並非由引擎產生。
// 原始日期/起局像素與逐筆CSV一併保留，可用Python工具獨立重讀。
const observations=JSON.parse(readFileSync(new URL('../docs/winter-daily-20261024/results.json',import.meta.url),'utf8'));
for(const [kind,count] of [['daily',105],['rule-probe',12],['minute-boundary',12]]) {
  test(`陰盤冬至網站固定對照：${kind} ${count}組`,()=>{
    const rows=observations.filter(r=>r.kind===kind);
    assert.equal(rows.length,count);
    for(const r of rows) {
      const result=computeQiMen(String(r.year),String(r.month),String(r.day),String(r.hour),'auto','1',String(r.minute));
      assert.equal(result.juText,r.reference_ju,r.id);
    }
  });
}

const charts=[
  {year:'2026',hour:'12',minute:'30',ju:'陰3',fu:'天芮',shi:'死門',center:'丙',
   stars:['天英','天芮','天柱','天心','天蓬','天任','天沖','天輔'],
   doors:['杜門','景門','死門','驚門','開門','休門','生門','傷門'],
   earth:['庚','壬','戊','乙','辛','己','癸','丁'],
   heaven:['辛','己丙','癸','丁','庚','壬','戊','乙'],
   outer:['丁','庚','壬','戊','乙','辛','己丙','癸'],
   deities:['騰蛇','值符','九天','九地','玄武','白虎','六合','太陰']},
  {year:'2027',hour:'04',minute:'51',ju:'陽2',fu:'天沖',shi:'傷門',center:'辛',
   stars:['天芮','天柱','天心','天蓬','天任','天沖','天輔','天英'],
   doors:['景門','死門','驚門','開門','休門','生門','傷門','杜門'],
   earth:['乙','丁','己','庚','丙','戊','癸','壬'],
   heaven:['戊辛','癸','壬','乙','丁','己','庚','丙'],
   outer:['壬','乙','丁','己','庚','丙','戊辛','癸'],
   deities:['六合','白虎','玄武','九地','九天','值符','騰蛇','太陰']},
];
for(const e of charts) test(`冬至分時網站完整盤：${e.year}/12/22 ${e.hour}:${e.minute}`,()=>{
  const r=computeQiMen(e.year,'12','22',e.hour,'auto','1',e.minute);
  assert.deepEqual([r.juText,r.xunText,r.fuText,r.zhiFu,r.zhiShi],[e.ju,'甲戌','己',e.fu,e.shi]);
  assert.deepEqual(RING.map(p=>STARS[r.heavenPan[p].star]),e.stars);
  assert.deepEqual(RING.map(p=>DOORS[r.doorPan[p]]),e.doors);
  assert.deepEqual(RING.map(p=>GANS[r.earthPan[p]]),e.earth);
  assert.equal(GANS[r.earthPan[5]],e.center);
  assert.deepEqual(RING.map(p=>GANS[r.heavenPan[p].stem]+(r.heavenPan[p].extraStem!=null?GANS[r.heavenPan[p].extraStem]:'')),e.heaven);
  assert.deepEqual(RING.map(p=>r.outerStems[p]),e.outer);
  assert.deepEqual(RING.map(p=>r.deityPan[p]),e.deities);
  assert.deepEqual([r.emptyText,r.horseText,r.horsePalace],['申酉','申',2]);
});
