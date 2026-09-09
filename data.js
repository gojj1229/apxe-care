/* All records below are fictional. No sensor, patient, or external data is read. */
(() => {
  const steps=[1120,1380,1260,1490,1310,1580,1720,1560,1790,1640,1880,1730,1940,2010,1830,2130,1960,2250,2070,2320,2190,2200,2380,2110,2590,2250,2670,2400];
  const minutes=[16,19,18,21,18,22,24,22,25,23,26,24,27,28,25,29,27,31,28,31,30,29,31,28,34,29,35,29];
  const records=steps.map((value,i)=>{
    const date=new Date(Date.UTC(2026,7,12+i));
    return {date:date.toISOString().slice(0,10),steps:value,minutes:minutes[i],speed:+(.7+i*.00445).toFixed(2),cadence:Math.round(value/minutes[i]),left:+(54.5+i*.13).toFixed(1),right:+(60.4+i*.06).toFixed(1),tilt:+(8.6-i*.048).toFixed(1),mode:'보행 보조',strength:2,terrain:i%9===3?'실외 경사':'실내 평지',device:'Haier W1',quality:i%9===3?'다른 측정 조건':'동일 측정 조건'};
  });
  Object.assign(records[27],{steps:2400,minutes:29,speed:.82,cadence:82,left:58,right:62,tilt:7.3});
  const difference=r=>Math.abs(r.right-r.left)/((r.right+r.left)/2)*100;
  const average=(rows,key)=>rows.length?rows.reduce((n,r)=>n+(key==='difference'?difference(r):r[key]),0)/rows.length:0;
  const getRange=(index,days,comparable=false)=>records.slice(Math.max(0,index-days+1),index+1).filter(r=>!comparable||r.terrain==='실내 평지');
  const sessions=index=>{const r=records[index];const firstSteps=Math.round(r.steps*.617),firstMinutes=Math.round(r.minutes*.62);return [{id:'am',time:'09:10',label:'오전 보행',steps:firstSteps,minutes:firstMinutes,...r,steps:firstSteps,minutes:firstMinutes},{id:'pm',time:'17:30',label:'오후 보행',...r,steps:r.steps-firstSteps,minutes:r.minutes-firstMinutes}];};
  window.CareData={records,difference,average,getRange,sessions};
})();
