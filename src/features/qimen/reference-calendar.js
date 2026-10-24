import lunarCalendar from 'lunar-javascript';

const {Solar, ShouXingUtil} = lunarCalendar;
const J2000 = 2451545;
const SECOND = 1 / 86400;

// Reference compatibility, not a claim that the older forecast is more accurate.
// Delta-T data from lunar-javascript 1.6.12 (MIT), ShouXingUtil.DT_AT:
// https://registry.npmjs.org/lunar-javascript/-/lunar-javascript-1.6.12.tgz
// 1.7.7 replaced the post-2016 forecast with DE440s fits. Keep the historical
// coefficients and restore only the old forecast on a private receiver.
// Never mutate the imported singleton: solstice rules use their own calendars.
const forecastStart = ShouXingUtil.DT_AT.findIndex((v,i)=>i%5===0&&v===2016);
if (forecastStart < 0) throw new Error('Unsupported lunar-javascript Delta-T table');
const referenceUtil = {
  ...ShouXingUtil,
  DT_AT: [...ShouXingUtil.DT_AT.slice(0,forecastStart),2018,69.0,0.36,0,0,2028,72.6]
};
const termCache = new Map();

function referenceTerms(year) {
  if (!termCache.has(year)) {
    const terms=Solar.fromYmd(year,7,1).getLunar().getJieQiTable();
    termCache.set(year,Object.values(terms).map(original=>{
      const reference=Solar.fromJulianDay(referenceUtil.qiAccurate2(original.getJulianDay()-J2000)+J2000);
      return {original,reference};
    }));
  }
  return termCache.get(year);
}

// Use the public lunar-calendar getters for the year/month pillars. Only when
// the clock is between the two models' term boundaries do we select a sample
// immediately on the desired side of the package's own boundary. Day/hour and
// lunar-date calculations remain tied to the caller's original civil date.
function getReferenceCalendar(year,month,day,hour=0,minute=0,wholeDay=false) {
  const solar=Solar.fromYmdHms(year,month,day,hour,minute,0);
  const target=solar.getJulianDay();
  for (const {original,reference} of referenceTerms(year)) {
    const boundary=s=>wholeDay
      ? Solar.fromYmd(s.getYear(),s.getMonth(),s.getDay()).getJulianDay()
      : s.getJulianDay();
    const oldBoundary=boundary(reference), newBoundary=boundary(original);
    const after=target>=oldBoundary;
    if (after !== (target>=newBoundary)) {
      return Solar.fromJulianDay(newBoundary+(after?1:-1)*(wholeDay?1:SECOND)).getLunar();
    }
  }
  return solar.getLunar();
}

export {getReferenceCalendar};
