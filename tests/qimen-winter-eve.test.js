import test from 'node:test';
import assert from 'node:assert/strict';
import { computeQiMen as c, RING, GANS, STARS, DOORS } from '../src/features/qimen/engine.js';

// 2026-10-24 Browser 實盤抄錄；冬至前一晚23時換日不等於冬至已到。
test('陰盤冬至前夕：2026–2029四年23:30仍陰遁，與次日00:30同盤', () => {
  for(const [y,d,ju,day] of [
    ['2026','21','陰6','庚午'],['2027','21','陰9','乙亥'],
    ['2028','20','陰9','庚辰'],['2029','20','陰3','乙酉'],
  ]) {
    const eve=c(y,'12',d,'23','auto','1','30');
    const midnight=c(y,'12',String(Number(d)+1),'00','auto','1','30');
    assert.equal(eve.juText,ju,y);
    assert.deepEqual([eve.bazi.d,eve.bazi.h,eve.xunText],[day,'丙子','甲戌']);
    for(const k of ['juText','bazi','lunar','earthPan','heavenPan','doorPan','deityPan','outerStems']) assert.deepEqual(eve[k],midnight[k],`${y} ${k}`);
  }
});

const cases=[
  {
    y:'2026',d:'21',ju:'陰6',fu:'天芮',shi:'死門',center:'己',
    stars:['天英','天芮','天柱','天心','天蓬','天任','天沖','天輔'],
    doors:['杜門','景門','死門','驚門','開門','休門','生門','傷門'],
    earth:['癸','丙','辛','庚','丁','壬','乙','戊'],
    heaven:['丁','壬己','乙','戊','癸','丙','辛','庚'],
    outer:['戊','癸','丙','辛','庚','丁','壬己','乙'],
  },
  {
    y:'2028',d:'20',ju:'陰9',fu:'天任',shi:'生門',center:'壬',
    stars:['天英','天芮','天柱','天心','天蓬','天任','天沖','天輔'],
    doors:['傷門','杜門','景門','死門','驚門','開門','休門','生門'],
    earth:['乙','己','丁','癸','戊','丙','庚','辛'],
    heaven:['戊','丙壬','庚','辛','乙','己','丁','癸'],
    outer:['庚','辛','乙','己','丁','癸','戊','丙壬'],
  },
];
for(const e of cases) test(`陰盤${e.y}/12/${e.d} 23:30網站九星八門、天地盤及外圈`,()=>{
  const r=c(e.y,'12',e.d,'23','auto','1','30');
  assert.deepEqual([r.juText,r.xunText,r.zhiFu,r.zhiShi],[e.ju,'甲戌',e.fu,e.shi]);
  assert.deepEqual(RING.map(p=>STARS[r.heavenPan[p].star]),e.stars);
  assert.deepEqual(RING.map(p=>DOORS[r.doorPan[p]]),e.doors);
  assert.deepEqual(RING.map(p=>GANS[r.earthPan[p]]),e.earth);
  assert.equal(GANS[r.earthPan[5]],e.center);
  assert.deepEqual(RING.map(p=>GANS[r.heavenPan[p].stem]+(r.heavenPan[p].extraStem!=null?GANS[r.heavenPan[p].extraStem]:'')),e.heaven);
  assert.deepEqual(RING.map(p=>r.outerStems[p]),e.outer);
});
