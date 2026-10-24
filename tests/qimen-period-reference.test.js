import test from 'node:test';
import assert from 'node:assert/strict';
import { computeQiMen as c, RING, GANS, STARS, DOORS } from '../src/features/qimen/engine.js';

// 2026-10-24 使用已登入 Browser 逐張放大星彧實際盤圖抄錄。
// 未顯示的外圈天干不以這些盤例宣稱已對照。
const stars = r => RING.map(p=>STARS[r.heavenPan[p].star]);
const doors = r => RING.map(p=>DOORS[r.doorPan[p]]);
const beforeYearStars = ['天沖','天輔','天英','天芮','天柱','天心','天蓬','天任'];
const afterYearStars = ['天英','天芮','天柱','天心','天蓬','天任','天沖','天輔'];

test('月家2028/2/3 13:30：閏年不能提前至甲寅月盤', () => {
  const r=c('2028','02','03','13','auto','4','30');
  assert.deepEqual(r.bazi,{y:'丁未',m:'癸丑',d:'戊午',h:'己未'});
  assert.deepEqual([r.juText,r.chartPillar,r.xunText,r.zhiFu,r.zhiShi],['陰3','癸丑','甲辰','天任','生門']);
  assert.deepEqual(RING.map(p=>GANS[r.earthPan[p]]),['庚','壬','戊','乙','辛','己','癸','丁']);
  assert.deepEqual(stars(r),['天輔','天英','天芮','天柱','天心','天蓬','天任','天沖']);
  assert.deepEqual(doors(r),['休門','生門','傷門','杜門','景門','死門','驚門','開門']);
});

test('月家交節整日盤與時分四柱分開：2/4 15:00與15:40盤面相同', () => {
  const before=c('2028','02','04','15','auto','4','00');
  const after=c('2028','02','04','15','auto','4','40');
  assert.deepEqual([before.bazi.y,before.bazi.m],['丁未','癸丑']);
  assert.deepEqual([after.bazi.y,after.bazi.m],['戊申','甲寅']);
  assert.deepEqual([before.juText,before.chartPillar,before.xunText,before.zhiFu,before.zhiShi],['陰3','甲寅','甲寅','天柱','驚門']);
  assert.deepEqual(stars(before),['天蓬','天任','天沖','天輔','天英','天芮','天柱','天心']);
  assert.deepEqual(doors(before),['休門','生門','傷門','杜門','景門','死門','驚門','開門']);
  for(const key of ['juText','chartPillar','heavenPan','earthPan','doorPan','deityPan','outerStems']) assert.deepEqual(before[key],after[key]);
  const zi=c('2028','02','03','23','auto','4','30');
  assert.deepEqual([zi.bazi.y,zi.bazi.m,zi.bazi.d,zi.bazi.h],['丁未','癸丑','己未','甲子']);
  assert.deepEqual(zi.heavenPan,before.heavenPan);
  assert.equal(zi.chartPillar,'甲寅');
});

test('月家2026/3/5 13:30已採辛卯月盤，顯示四柱仍庚寅月', () => {
  const r=c('2026','03','05','13','auto','4','30');
  assert.deepEqual([r.juText,r.bazi.m,r.chartPillar,r.xunText,r.zhiFu,r.zhiShi],['陰5','庚寅','辛卯','甲申','天沖','傷門']);
  assert.deepEqual(stars(r),['天芮','天柱','天心','天蓬','天任','天沖','天輔','天英']);
  assert.deepEqual(doors(r),['死門','驚門','開門','休門','生門','傷門','杜門','景門']);
});

test('年家2028立春按時分換年柱轉盤，不能套月家整日分界', () => {
  const dayBefore=c('2028','02','03','13','auto','5','30');
  const before=c('2028','02','04','15','auto','5','00');
  const after=c('2028','02','04','15','auto','5','40');
  assert.deepEqual([before.juText,before.bazi.y,before.bazi.m],['陰7','丁未','癸丑']);
  assert.deepEqual([after.juText,after.bazi.y,after.bazi.m],['陰7','戊申','甲寅']);
  assert.deepEqual(dayBefore.heavenPan,before.heavenPan);
  assert.deepEqual(stars(before),beforeYearStars);
  assert.deepEqual(doors(before),['驚門','開門','休門','生門','傷門','杜門','景門','死門']);
  assert.deepEqual(stars(after),afterYearStars);
  assert.deepEqual(doors(after),['生門','傷門','杜門','景門','死門','驚門','開門','休門']);
});

test('年家三元按西元年：1924/1984/2044元旦已分別陰四、陰七、陰一', () => {
  for(const [y,ju] of [['1924','陰4'],['1984','陰7'],['2044','陰1']]) {
    const r=c(y,'01','01',y==='2044'?'00':'12','auto','5','30');
    assert.equal(r.juText,ju,y);
    assert.equal(r.bazi.y,'癸亥');
    assert.equal(r.xunText,'甲寅');
    assert.equal(r.yuanInfo.yearIn180,y==='1924'?61:y==='1984'?121:1);
  }
});

test('年家2043/12/31 23時即進上元陰一，2044立春前已陰一', () => {
  const before=c('2043','12','31','22','auto','5','30');
  const zi=c('2043','12','31','23','auto','5','30');
  const jan=c('2044','01','01','00','auto','5','30');
  assert.equal(before.juText,'陰7');
  assert.equal(zi.juText,'陰1');
  assert.deepEqual(zi.heavenPan,jan.heavenPan);
  assert.equal(zi.bazi.y,'癸亥');
  for(const d of ['03','04']) {
    const r=c('2044','02',d,'12','auto','5','30');
    assert.deepEqual([r.juText,r.bazi.y],['陰1','癸亥']);
  }
});

test('日家2028立春前四柱修正，已對照局數及九星八門不變', () => {
  const r=c('2028','02','03','13','auto','6','30');
  assert.deepEqual(r.bazi,{y:'丁未',m:'癸丑',d:'戊午',h:'己未'});
  assert.deepEqual([r.juText,r.xunText,r.zhiFu,r.zhiShi],['陽1','甲寅','天心','開門']);
  assert.deepEqual(stars(r),['天心','天蓬','天任','天沖','天輔','天英','天芮','天柱']);
  assert.deepEqual(doors(r),['開門','休門','生門','傷門','杜門','景門','死門','驚門']);
  const next=c('2028','02','04','15','auto','6','00');
  assert.deepEqual([next.juText,next.bazi.y,next.bazi.m,next.xunText,next.zhiFu,next.zhiShi],['陽2','丁未','癸丑','甲寅','天柱','驚門']);
});
