import lunarCalendar from 'lunar-javascript';

const { Solar, LunarYear } = lunarCalendar;

const GANS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const ZHIS = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const PALACES = [null,'坎₁','坤₂','震₃','巽₄','中₅','乾₆','兌₇','艮₈','離₉'];
const STARS = [null,'天蓬','天芮','天沖','天輔','天禽','天心','天柱','天任','天英'];
const DOORS = [null,'休門','死門','傷門','杜門','中門','開門','驚門','生門','景門'];
const DEITIES = ['值符','騰蛇','太陰','六合','白虎','玄武','九地','九天'];
const RING = [1,8,3,4,9,2,7,6];
const QI_GANS = [4,5,6,7,8,9,3,2,1];
const CHANG_SHENG_STAGES = ['生','沐','冠','臨','旺','衰','病','死','墓','絕','胎','養'];const CHANG_SHENG_BLUE_STAGES = new Set(['生','沐','冠','臨','旺','胎']);
const PALACE_BRANCHES = {
  1:['子'], 8:['丑','寅'], 3:['卯'], 4:['辰','巳'],
  9:['午'], 2:['未','申'], 7:['酉'], 6:['戌','亥']
};
// 十二長生起點。陽干順行、陰干逆行；戊同丙、己同丁。
const CHANG_SHENG_START = {
  '甲':'亥','乙':'午','丙':'寅','丁':'酉','戊':'寅',
  '己':'酉','庚':'巳','辛':'子','壬':'申','癸':'卯'
};

function getChangShengForPalace(stem, palace) {
  if (!stem || !PALACE_BRANCHES[palace]) return [];
  const stemIndex = GANS.indexOf(stem);
  const startIndex = ZHIS.indexOf(CHANG_SHENG_START[stem]);
  const isForward = stemIndex % 2 === 0;
  return PALACE_BRANCHES[palace].map(branch => {
    const branchIndex = ZHIS.indexOf(branch);
    const stageIndex = isForward
      ? (branchIndex - startIndex + 12) % 12
      : (startIndex - branchIndex + 12) % 12;
    return { branch, stage: CHANG_SHENG_STAGES[stageIndex] };
  });
}

const getRingIndex = p => RING.indexOf(p);
const advanceRing = (p, steps) => RING[(getRingIndex(p) + steps + 64) % 8];
const checkXing = (stem, palace) => ({'戊':3,'己':2,'庚':8,'辛':9,'壬':4,'癸':4})[stem] === palace;
const checkMu = (stem, palace) => ({'甲':2,'乙':6,'丙':6,'丁':8,'戊':6,'己':8,'庚':8,'辛':4,'壬':4,'癸':2})[stem] === palace;
const checkPo = (door, palace) => ({'休門':[9],'生門':[1],'傷門':[2,8],'杜門':[2,8],'景門':[6,7],'死門':[1],'驚門':[3,4],'開門':[3,4]})[door]?.includes(palace);

const JIEQI_C = {
  '小寒':5.4055,'大寒':20.12,'立春':3.87,'雨水':18.73,
  '驚蟄':5.63,'春分':20.646,'清明':4.81,'穀雨':20.1,
  '立夏':5.52,'小滿':21.04,'芒種':5.678,'夏至':21.37,
  '小暑':7.108,'大暑':22.83,'立秋':7.5,'處暑':23.13,
  '白露':7.646,'秋分':23.042,'寒露':8.318,'霜降':23.438,
  '立冬':7.438,'小雪':22.36,'大雪':7.18,'冬至':21.94
};
const JIEQI_ORDER = [
  ['小寒','大寒'],['立春','雨水'],['驚蟄','春分'],['清明','穀雨'],
  ['立夏','小滿'],['芒種','夏至'],['小暑','大暑'],['立秋','處暑'],
  ['白露','秋分'],['寒露','霜降'],['立冬','小雪'],['大雪','冬至']
];
const JU_TABLE = {
  '冬至':[1,7,4],'驚蟄':[1,7,4],'小寒':[2,8,5],'大寒':[3,9,6],'春分':[3,9,6],
  '立春':[8,5,2],'雨水':[9,6,3],'清明':[4,1,7],'立夏':[4,1,7],
  '穀雨':[5,2,8],'小滿':[5,2,8],'芒種':[6,3,9],
  '夏至':[9,3,6],'白露':[9,3,6],'小暑':[8,2,5],'大暑':[7,1,4],'秋分':[7,1,4],
  '立秋':[2,5,8],'處暑':[1,4,7],'寒露':[6,9,3],'立冬':[6,9,3],
  '霜降':[5,8,2],'小雪':[5,8,2],'大雪':[4,7,1]
};

const JIEQI_CORRECTIONS = { '2026_驚蟄': 6 };
function calcJieQiDay(year, jqName) {
  const key = `${year}_${jqName}`;
  if (JIEQI_CORRECTIONS[key] !== undefined) return JIEQI_CORRECTIONS[key];
  const C = JIEQI_C[jqName]; const Y = year % 100; const L = Math.floor(Y / 4);
  return Math.floor(Y * 0.2422 + C) - L;
}
function getJieQiForMonth(year, month) {
  const pair = JIEQI_ORDER[month - 1];
  return [
    { name: pair[0], day: calcJieQiDay(year, pair[0]), month },
    { name: pair[1], day: calcJieQiDay(year, pair[1]), month }
  ];
}

// ===== 置閏法：機械式節氣系統 =====
const YANG_SEQ = ['冬至','小寒','大寒','立春','雨水','驚蟄','春分','清明','穀雨','立夏','小滿','芒種'];
const YIN_SEQ = ['夏至','小暑','大暑','立秋','處暑','白露','秋分','寒露','霜降','立冬','小雪','大雪'];

// UTC is a calendar arithmetic carrier; user inputs are always Taiwan civil dates.
const REF_DATE = new Date(Date.UTC(2000, 0, 7, 12));
function toAbsDay(y,m,d){ const dt=new Date(Date.UTC(y,m-1,d,12)); return Math.round((dt-REF_DATE)/86400000); }
function getFutouAbs(solsticeAbs) {
  const idx60 = ((solsticeAbs % 60) + 60) % 60;
  const offset = idx60 % 15;
  // 對照時家置閏：符頭超前 0–8 日沿用，達 9 日才轉下一符頭。
  // 不是以 7/8 日為界選最近的符頭，否則會提早或延後整個十五日循環。
  return offset <= 8 ? solsticeAbs - offset : solsticeAbs + (15 - offset);
}

function determineZhiRunJu(year, month, day) {
  const targetAbs = toAbsDay(year, month, day);
  const candidates = [];
  for (let yr = year - 1; yr <= year; yr++) {
    const dzAbs = toAbsDay(yr, 12, calcJieQiDay(yr, '冬至'));
    candidates.push({ abs: getFutouAbs(dzAbs), isYang: true, label: `冬至${yr}` });
    const xzAbs = toAbsDay(yr, 6, calcJieQiDay(yr, '夏至'));
    candidates.push({ abs: getFutouAbs(xzAbs), isYang: false, label: `夏至${yr}` });
  }
  candidates.sort((a,b) => a.abs - b.abs);
  let chosen = candidates[0];
  for (const c of candidates) { if (c.abs <= targetAbs) chosen = c; }

  const daysFromStart = targetAbs - chosen.abs;
  const jqIndex = Math.min(Math.floor(daysFromStart / 15), 11);
  // 半年若有第十三個十五日循環，重排末節氣的上、中、下元，不能卡在下元。
  const dayInJQ = daysFromStart % 15;
  const yuan = Math.floor(dayInJQ / 5);
  const jqSeq = chosen.isYang ? YANG_SEQ : YIN_SEQ;
  const jq = jqSeq[jqIndex];

  return {
    isYangDun: chosen.isYang, juShu: JU_TABLE[jq][yuan],
    jieQi: jq, yuan: ['上元','中元','下元'][yuan], jqDay: dayInJQ + 1,
    startLabel: chosen.label
  };
}

// ===== 天文節氣法（日家用）=====
function determineYinYangDun(year, month, day) {
  let currentJQ = '', jqDay = 0;
  const jqList = getJieQiForMonth(year, month);
  for (let jq of jqList) { if (day >= jq.day) { currentJQ = jq.name; jqDay = day - jq.day + 1; } }
  if (!currentJQ || day < jqList[0].day) {
    let pm = month - 1, py = year; if (pm < 1) { pm = 12; py--; }
    const prev = getJieQiForMonth(py, pm); currentJQ = prev[1].name;
    const lastDay = new Date(year, month - 1, 0).getDate();
    jqDay = day + (lastDay - prev[1].day) + 1;
  }
  const isYangDun = YANG_SEQ.includes(currentJQ);
  let yuanIdx = Math.floor((jqDay - 1) / 5); if (yuanIdx > 2) yuanIdx = 2;
  return { isYangDun, juShu: JU_TABLE[currentJQ]?.[yuanIdx] || 1, jieQi: currentJQ, yuan: ['上元','中元','下元'][yuanIdx], jqDay };
}

// 陰盤夏至以實際輸入時刻比較；不使用子初換日後的日期。
const yinPanSummerCache = new Map();
function isBeforeYinPanSummer(y, m, d, h, minute) {
  if (!yinPanSummerCache.has(y)) {
    const table = Solar.fromYmd(y, 7, 1).getLunar().getJieQiTable();
    yinPanSummerCache.set(y, table['夏至'].toYmdHms());
  }
  return Solar.fromYmdHms(y,m,d,h,minute,0).toYmdHms() < yinPanSummerCache.get(y);
}

// 星彧陰盤冬至相容規則；不等同於當年的天文交節時刻。
// 實盤顯示：冬至前已經過農曆閏月，取當年冬至時分；否則取前一年時分。
// 日期仍取當年冬至日；冬至當日23時子初後視為次日陽遁。
const yinPanWinterCache = new Map();
function isYinPanWinterYangJu(y, m, d, h, minute) {
  if(m <= 5) return true;
  if(!yinPanWinterCache.has(y)) {
    const terms=Solar.fromYmd(y,7,1).getLunar().getJieQiTable();
    const leapMonth=LunarYear.fromYear(y).getLeapMonth();
    const clockTerm=leapMonth>0&&leapMonth<11 ? terms.DONG_ZHI : terms['冬至'];
    yinPanWinterCache.set(y,{date:terms.DONG_ZHI.toYmd(),clock:clockTerm.toYmdHms().slice(11)});
  }
  const boundary=yinPanWinterCache.get(y);
  const inputDate=Solar.fromYmd(y,m,d).toYmd();
  if(inputDate!==boundary.date) return inputDate>boundary.date;
  if(h>=23) return true;
  const inputClock=`${String(h).padStart(2,'0')}:${String(minute).padStart(2,'0')}:00`;
  return inputClock>=boundary.clock;
}

// 日家依子初換日後的日期，在實際冬夏至日期切換；不能依甲子日挑最近節氣。
// 日期以外的交節時分不參與日家轉遁，與陰盤的分時規則分開。
const dayPanSolsticeCache = new Map();
function getDayPanSolstices(year) {
  if (!dayPanSolsticeCache.has(year)) {
    const terms = Solar.fromYmd(year,7,1).getLunar().getJieQiTable();
    dayPanSolsticeCache.set(year, [['夏至',false],['DONG_ZHI',true]].map(([key,isYang]) => {
      const term=terms[key];
      return {abs:toAbsDay(term.getYear(),term.getMonth(),term.getDay()),isYang};
    }));
  }
  return dayPanSolsticeCache.get(year);
}

// ===== 主計算 =====
const computeQiMen = (yStr, mStr, dStr, hStr, juSetting, system, minuteStr = '0') => {
  const y=parseInt(yStr),m=parseInt(mStr),d=parseInt(dStr),h=parseInt(hStr);
  const isNextDay = h >= 23;
  // 子初換日：先在輸入的台灣日曆日期上進一天，不經宿主時區轉換。
  const astroDate = new Date(Date.UTC(y, m - 1, d + (isNextDay ? 1 : 0), 12));
  const astroHStr = isNextDay?'00':hStr.padStart(2,'0');

  let lunarM=1,lunarD=1,lunarYearStr='';
  try {
    const lcd = astroDate;
    const parts=new Intl.DateTimeFormat('en-US-u-ca-chinese',{month:'numeric',day:'numeric',timeZone:'Asia/Taipei'}).formatToParts(lcd);
    parts.forEach(p=>{ if(p.type==='month'){const x=p.value.match(/\d+/);if(x)lunarM=parseInt(x[0],10);} if(p.type==='day'){const x=p.value.match(/\d+/);if(x)lunarD=parseInt(x[0],10);} });
    const yp=new Intl.DateTimeFormat('zh-TW-u-ca-chinese',{year:'numeric',timeZone:'Asia/Taipei'}).formatToParts(lcd);
    lunarYearStr=yp.find(p=>p.type==='yearName')?.value||'';
  } catch(e){}

  const astroMid = astroDate;
  const diffDays = Math.round((astroMid - REF_DATE) / 86400000);
  const dayIdx60 = ((diffDays % 60) + 60) % 60;
  const dGanIndex = dayIdx60 % 10, dZhiIndex = dayIdx60 % 12;
  const hZhiIndex = Math.floor((h+1)/2)%12;
  const hGanIndex = (dGanIndex*2+hZhiIndex)%10;

  const aY=astroDate.getUTCFullYear(), aM=astroDate.getUTCMonth()+1, aD=astroDate.getUTCDate();
  // 子初先換日，交節也使用換日後的00時並保留分鐘。
  // 例如立春在23時或次日00時時，不能讓年/月柱仍停留原日。
  const timeCalendar = Solar.fromYmdHms(aY,aM,aD,Number(astroHStr),Number(minuteStr),0).getLunar();
  // 本輪實盤月家採交節整日的月柱起盤，與顯示四柱不同；23時推進日期。
  // 年家則以子初換日後時刻的立春年柱起盤，不能套月家的整日規則。
  const monthCalendar = system === '4' ? Solar.fromYmd(aY,aM,aD).getLunar() : null;
  const periodYear = monthCalendar ? monthCalendar.getYearInGanZhiByLiChun() : timeCalendar.getYearInGanZhiExact();
  const yGanIndex=GANS.indexOf(periodYear[0]), yZhiIndex=ZHIS.indexOf(periodYear[1]);
  const civilYear=monthCalendar ? aY : y;
  const civilYearPillar=GANS[(civilYear-4)%10]+ZHIS[(civilYear-4)%12];
  const baziYear=civilYear-(periodYear===civilYearPillar ? 0 : 1);
  const baziMonthZhi=monthCalendar ? monthCalendar.getMonthZhiIndex() : timeCalendar.getMonthZhiIndexExact();
  const mGanIndex=monthCalendar ? monthCalendar.getMonthGanIndex() : timeCalendar.getMonthGanIndexExact();
  const bazi = {
    y: timeCalendar.getYearInGanZhiExact(),
    m: timeCalendar.getMonthInGanZhiExact(),
    d: GANS[dGanIndex]+ZHIS[dZhiIndex], h: GANS[hGanIndex]+ZHIS[hZhiIndex]
  };
  const isWuBuYuShi = (hGanIndex-dGanIndex+10)%10===6;

  let tGanIndex,tZhiIndex;
  if(system==='6'){tGanIndex=dGanIndex;tZhiIndex=dZhiIndex;}
  else if(system==='4'){tGanIndex=mGanIndex;tZhiIndex=baziMonthZhi;}
  else if(system==='5'){tGanIndex=yGanIndex;tZhiIndex=yZhiIndex;}
  else{tGanIndex=hGanIndex;tZhiIndex=hZhiIndex;}

  let isYin, juNum, dunInfo = null;
  if(juSetting!=='auto'){
    isYin=juSetting.startsWith('yin'); juNum=parseInt(juSetting.replace('yin','').replace('yang',''));
  } else if(system==='1'){
    // 年支依實際立春時刻換年，不再寫死當天 06:00。
    const yZhiForYinPan = ZHIS.indexOf(timeCalendar.getYearZhiExact());
    const isYang = m <= 6
      ? isBeforeYinPanSummer(y,m,d,h,Number(minuteStr))
      : isYinPanWinterYangJu(y,m,d,h,Number(minuteStr));
    isYin = !isYang;
    juNum=((yZhiForYinPan+1)+lunarM+lunarD+(hZhiIndex+1))%9||9;
  } else if(system==='5'){
    // 年家：180年三元，局數按子初換日後的西元年；起盤年柱另按立春時刻。
    isYin=true;
    const yf=((aY-1864)%180+180)%180;
    juNum=[1,4,7][Math.floor(yf/60)];
  } else if(system==='4'){
    // 月家：統一公式，全用陰遁
    isYin=true;
    const mf = (baziYear - 2024) * 12 + (baziMonthZhi - 2 + 12) % 12;
    juNum = ((7 - Math.floor(mf / 10)) % 9 + 9) % 9 || 9;
  } else if(system==='6'){
    // 日家：先按日曆日期選已到達的冬夏至，再計算甲子循環元序。
    const targetAbs = Math.round((astroMid - REF_DATE) / 86400000);
    const jiaziAbs = targetAbs - dayIdx60;
    const cands = [];
    for(let yr=aY-1; yr<=aY; yr++) cands.push(...getDayPanSolstices(yr));
    cands.sort((a,b)=>b.abs-a.abs);
    const season=cands.find(c=>c.abs<=targetAbs);
    isYin=!season.isYang;
    const cycleIdx=Math.round((jiaziAbs-season.abs)/60);
    if(!isYin){
      const baseJu=[1,7,4][(cycleIdx%3+3)%3];
      juNum=(baseJu-1+(dayIdx60%9))%9+1;
    } else {
      const baseJu=[9,3,6][(cycleIdx%3+3)%3];
      juNum=(baseJu-1-(dayIdx60%9)+9)%9+1;
    }
    dunInfo={jieQi:season.isYang?'冬至後':'夏至後',yuan:['上元','中元','下元'][(cycleIdx%3+3)%3],jqDay:dayIdx60+1};
  } else {
    // 時家置閏：使用機械式節氣系統
    const di=determineZhiRunJu(aY,aM,aD);
    isYin=!di.isYangDun; juNum=di.juShu; dunInfo=di;
  }

  const earthPan=Array(10).fill(null);
  for(let i=0;i<9;i++){ let p=isYin?(juNum-i-1+9)%9+1:(juNum+i-1)%9+1; earthPan[p]=QI_GANS[i]; }

  const xunIndex=(tZhiIndex-tGanIndex+12)%12;
  const xunShouMap={0:4,10:5,8:6,6:7,4:8,2:9};
  const xunStem=xunShouMap[xunIndex]; const xunText='甲'+ZHIS[xunIndex];
  const xunPalace = earthPan.indexOf(xunStem);
  const fuPalace = xunPalace === 5 ? 2 : xunPalace;

  const heavenPan=Array(10).fill(null);
  const effStem=tGanIndex===0?xunStem:tGanIndex;
  let targetFuPalace=earthPan.indexOf(effStem); if(targetFuPalace===5)targetFuPalace=2;
  const starOffset=getRingIndex(targetFuPalace)-getRingIndex(fuPalace);
  const starTrace=[];
  for(let p of RING){ const tP=advanceRing(p,starOffset); heavenPan[tP]={star:p, stem:earthPan[p], fromPalace:p}; if(p===2&&earthPan[5]!==null)heavenPan[tP].extraStem=earthPan[5]; starTrace.push({sn:STARS[p],fp:p,tp:tP,st:GANS[earthPan[p]],ed:GANS[earthPan[tP]]}); }

  const doorPan=Array(10).fill(null);
  let steps=tGanIndex; if(tGanIndex===0)steps=0; let curP=xunPalace; // 數九宮從旬首原宮起算；只在落宮後寄坤二。
  for(let i=0;i<steps;i++){ curP+=(isYin?-1:1); if(curP>9)curP-=9; if(curP<1)curP+=9; }
  let targetShiPalace=curP; if(targetShiPalace===5)targetShiPalace=2;
  const doorOffset=getRingIndex(targetShiPalace)-getRingIndex(fuPalace);
  for(let p of RING){ doorPan[advanceRing(p,doorOffset)]=p; }

  const deityPan=Array(10).fill(null); const dSI=getRingIndex(targetFuPalace);
  for(let i=0;i<8;i++){ deityPan[RING[(dSI+(isYin?-i:i)+8)%8]]=DEITIES[i]; }

  const empty1=(xunIndex-2+12)%12, empty2=(xunIndex-1+12)%12;
  const b2p={0:1,1:8,2:8,3:3,4:4,5:4,6:9,7:2,8:2,9:7,10:6,11:6};
  const emptyPalaces=[b2p[empty1],b2p[empty2]];
  const horseMap={0:8,4:8,8:8,3:4,7:4,11:4,2:2,6:2,10:2,1:6,5:6,9:6};
  const horsePalace=horseMap[tZhiIndex];

  const outerStems=Array(10).fill('');
  if(system==='1'){
    let hpLoc=null;
    for(let p of RING){ if(heavenPan[p].stem===effStem){hpLoc=p;break;} if(heavenPan[p].star===2&&earthPan[5]===effStem){hpLoc=p;break;} }
    if(hpLoc!==null){ let os=getRingIndex(targetShiPalace)-getRingIndex(hpLoc); for(let p of RING){ let sp=advanceRing(p,-os); let th=heavenPan[sp]; if(th&&th.stem!==null){ let str=GANS[th.stem]; if(th.star===2&&earthPan[5]!==null)str+=GANS[earthPan[5]]; outerStems[p]=str; } } }
  } else {
    const outerShift = starOffset - doorOffset;
    for(let p of RING){ const srcP = advanceRing(p, outerShift); let str = GANS[earthPan[srcP]]; if(srcP===2&&earthPan[5]!==null) str += GANS[earthPan[5]]; outerStems[p] = str; }
  }

  let yuanInfo = null;
  if(system==='5'&&juSetting==='auto'){ const yf=((aY-1864)%180+180)%180; const yi=Math.floor(yf/60); yuanInfo={yuan:['上元','中元','下元'][yi],startPalace:[1,4,7][yi],yearIn180:yf+1}; }
  else if(system==='4'&&juSetting==='auto'){ const myt=yZhiIndex%3; yuanInfo={yuan:['中元','下元','上元'][myt],yearBranchType:['四仲→中元','四季→下元','四孟→上元'][myt],yearBranch:ZHIS[yZhiIndex]}; }

  return {
    ...(system==='4' ? {chartPillar:GANS[mGanIndex]+ZHIS[baziMonthZhi]} : {}),
    bazi, lunar:`${lunarYearStr||bazi.y} 年 ${String(lunarM).padStart(2,'0')} 月 ${String(lunarD).padStart(2,'0')} 日`,
    displayHStr:astroHStr, juText:(isYin?'陰':'陽')+juNum,
    xunText, fuText:GANS[xunStem], zhiFu:STARS[fuPalace], zhiShi:DOORS[fuPalace],
    earthPan,heavenPan,doorPan,deityPan,outerStems,
    emptyText:ZHIS[empty1]+ZHIS[empty2],
    horseText:ZHIS[horsePalace===8?2:horsePalace===4?5:horsePalace===2?8:11],
    emptyPalaces,horsePalace,doorOffset,starOffset,isWuBuYuShi,
    starTrace,dunInfo,yuanInfo,
    debug:{xunPalace,fuPalace,targetFuPalace,starOffset,doorOffset,outerShift:starOffset-doorOffset,
      effStem:GANS[effStem],day:bazi.d,hour:bazi.h,juNum,isYin,xunText,xunStem:GANS[xunStem],
      earthStr:RING.map(p=>`${p}宮=${GANS[earthPan[p]]}`).join(' ')}
  };
};


export { GANS, ZHIS, PALACES, STARS, DOORS, DEITIES, RING, CHANG_SHENG_BLUE_STAGES, getChangShengForPalace, checkXing, checkMu, checkPo, computeQiMen, determineZhiRunJu };
