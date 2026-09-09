(() => {
  'use strict';
  const paths={user:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2',table:'M3 4h18v16H3V4m0 5h18M9 4v16m6-11v11M3 15h18',shield:'m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6l8-4Zm-4 10 3 3 5-6',arrow:'M5 12h14m-6-6 6 6-6 6',info:'M12 10v6m0-9h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',help:'M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',file:'M14 3H5v18h14V8l-5-5v5h5M8 12h8M8 16h6',chevron:'m9 5 7 7-7 7',download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',trend:'m3 16 6-6 4 4 8-9m-6 0h6v6'};
  const icon=name=>`<i aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[name]||paths.info}"/></svg></i>`;
  document.querySelectorAll('[data-icon]').forEach(el=>el.outerHTML=icon(el.dataset.icon));
  const D=window.CareData;
  const $=s=>document.querySelector(s);
  const dialog=$('#dialog');
  const state={view:'overview',period:28,comparable:true,metric:'speed'};
  const metrics=[
    {key:'speed',label:'보행 속도',unit:'m/s',decimals:2},
    {key:'difference',label:'좌우 보폭 차이',unit:'%',decimals:1},
    {key:'support',label:'양발 지지 비율',unit:'%',decimals:1},
    {key:'tilt',label:'몸통 좌우 기울기',unit:'°',decimals:1}
  ];
  // Fictional additional sensor metric, separate from verified W1 capabilities.
  const allRecords=D.records.map((r,i)=>({...r,difference:D.difference(r),support:+(33-i*5/27).toFixed(1)}));
  const allRows=()=>allRecords.slice(-state.period);
  const rows=()=>allRows().filter(r=>!state.comparable||r.terrain==='실내 평지');
  const average=(items,key)=>items.reduce((s,r)=>s+r[key],0)/items.length;
  const short=date=>date.slice(5).replace('-','.');
  const rangeLabel=()=>`${short(allRows()[0].date)} – ${short(allRows().at(-1).date)}`;
  const fmt=n=>Math.round(n).toLocaleString('ko-KR');
  function trendChart(items,key,decimals,unit){
    const w=matchMedia("(max-width: 760px)").matches?Math.max(208,$("#workspace").clientWidth-80):650,h=166,l=40,r=18,t=22,b=25,pw=w-l-r,ph=h-t-b;
    const vals=items.map(r=>r[key]),lo=Math.min(...vals),hi=Math.max(...vals),range=Math.max(hi-lo,key==='speed'?.06:1),min=Math.max(0,lo-range*.2),max=hi+range*.2;
    const first=Date.parse(items[0].date),last=Date.parse(items.at(-1).date);
    const points=items.map(row=>[l+(Date.parse(row.date)-first)/(last-first||1)*pw,t+ph-(row[key]-min)/(max-min)*ph]);
    let out='';
    for(let i=0;i<3;i++){
      const y=t+ph*(1-i/2),v=min+(max-min)*i/2;
      out+=`<line x1="${l}" x2="${w-r}" y1="${y}" y2="${y}" stroke="#e5e5e7" stroke-dasharray="3 4"/><text x="${l-10}" y="${y+4}" text-anchor="end">${v.toFixed(decimals)}</text>`;
    }
    const path=points.map(([x,y],i)=>(i?'L':'M')+x+' '+y).join(' ');
    out+=`<path d="${path} L${points.at(-1)[0]} ${t+ph} L${l} ${t+ph}Z" fill="#0066cc" opacity=".035"/><path d="${path}" fill="none" stroke="#0066cc" stroke-width="2.2" stroke-linejoin="round"/>`;
    points.forEach(([x,y],i)=>{
      out+=`<circle cx="${x}" cy="${y}" r="${i===points.length-1?4:2.1}" fill="#0066cc"><title>${items[i].date} · ${vals[i].toFixed(decimals)}${unit}</title></circle>`;
      if(i===0||i===points.length-1||(i%7===0&&i<points.length-4))out+=`<text x="${x}" y="${h-4}" text-anchor="middle">${short(items[i].date)}</text>`;
    });
    out+=`<text class="last-label" x="${points.at(-1)[0]}" y="${points.at(-1)[1]-12}" text-anchor="end">${vals.at(-1).toFixed(decimals)}</text>`;
    return `<svg class="trend-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${metrics.find(m=>m.key===key).label}, ${items[0].date}부터 ${items.at(-1).date}까지의 변화">${out}</svg>`;
  }
  function overview(){
    const items=rows(),last=items.at(-1),first=items[0],metric=metrics.find(m=>m.key===state.metric),delta=last[metric.key]-first[metric.key];
    return `<section class="metric-grid" aria-label="최근 기록의 핵심 지표">${metrics.map(m=>`<button class="metric ${state.metric===m.key?'active':''}" data-metric="${m.key}" aria-pressed="${state.metric===m.key}"><div class="metric-label">${m.label}${icon('chevron')}</div><div class="metric-reading"><strong class="num">${last[m.key].toFixed(m.decimals)}</strong><small>${m.unit}</small></div><div class="metric-caption">최근 기록 · 기간 평균<strong>${average(items,m.key).toFixed(m.decimals)}${m.unit}</strong></div></button>`).join('')}</section>
      <div class="detail-grid"><section class="panel"><div class="panel-head"><h2>${metric.label} 추이</h2><span>${state.comparable?'동일 조건':'전체 조건'} · ${items.length}일 기록</span></div><div class="chart-summary"><span>기간 첫 기록 대비</span><strong class="num">${delta>=0?'+':''}${delta.toFixed(metric.decimals)} ${metric.unit==='%'?'%p':metric.unit}</strong><span>· ${short(first.date)} → ${short(last.date)}</span></div>${trendChart(items,metric.key,metric.decimals,metric.unit)}<div class="chart-foot"><span>최근 좌우 보폭<strong>왼쪽 ${last.left} cm</strong><strong>오른쪽 ${last.right} cm</strong></span><button class="text-button" data-view="records">원기록 보기${icon('chevron')}</button></div></section>
      <section class="panel"><div class="panel-head"><h2>측정 조건</h2><button class="text-button" data-action="conditions">상세 보기${icon('chevron')}</button></div><dl class="conditions"><div><dt>기기 · 보조 설정</dt><dd>Haier W1 · 보행 보조 2단계</dd></div><div><dt>보행 환경</dt><dd>${state.comparable?'실내 평지':'실내 평지 · 실외 경사'}</dd></div><div><dt>분석에 포함한 기록</dt><dd>${items.length}일 / 공유 ${allRows().length}일</dd></div></dl><div class="review-note">${icon('info')}<div><strong>의료진 검토 시 참고</strong><p>보조 조건과 보행 관찰·검사를 함께 확인해 주세요.<br>수치만으로 정상·위험이나 치료 효과를 판정하지 않습니다.</p></div></div></section></div>`;
  }
  function records(){
    const items=rows();return `<section class="panel records-panel"><div class="panel-head"><h2>공유된 보행 원기록</h2><button class="text-button" data-action="csv">CSV 저장${icon('download')}</button></div><p class="record-note">${rangeLabel()} · ${items.length}일 · 현재 기간과 측정 조건을 적용한 가상 기록</p><p class="mobile-table-hint">좌우로 밀어 전체 항목을 확인하세요.</p><div class="table-wrap" role="region" aria-label="공유된 보행 원기록 표" tabindex="0"><table><thead><tr><th>측정일</th><th>걸음 수</th><th>사용 시간</th><th>보행 속도</th><th>좌우 보폭</th><th>보폭 차이</th><th>보행 환경</th></tr></thead><tbody>${[...items].reverse().map(r=>`<tr><td>${r.date}</td><td>${fmt(r.steps)}</td><td>${r.minutes}분</td><td>${r.speed.toFixed(2)} m/s</td><td>${r.left} / ${r.right} cm</td><td>${r.difference.toFixed(1)}%</td><td>${r.terrain}</td></tr>`).join('')}</tbody></table></div></section>`;
  }
  function render(){
    $('#content').innerHTML=state.view==='overview'?overview():records();
    $('#subject-range').textContent=rangeLabel();
    document.querySelectorAll('[data-view]').forEach(button=>{
      const active=button.dataset.view===state.view;
      button.classList.toggle('active',active);
      if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
    });
  }
  function openDialog(title,body,actions=''){
    dialog.innerHTML=`<div class="dialog-head"><h2 id="dialog-title">${title}</h2><button data-action="close" aria-label="닫기">×</button></div><div class="dialog-body">${body}</div>${actions?`<div class="dialog-actions">${actions}</div>`:''}`;
    if(!dialog.open)dialog.showModal();
  }
  function reportDocument(){
    const items=rows(),last=items.at(-1);
    return `<article class="report-document"><h2>APXe Care · 보행 리포트</h2><p class="meta">가상 사용자 A · APX-0001<br>2026.${rangeLabel()} · ${items.length}일 기록 · ${state.comparable?'동일 측정 조건':'전체 측정 조건'}</p><h3>보행 지표 · 기간 평균</h3>${metrics.map(m=>`<div class="report-row"><span>${m.label}</span><strong>${average(items,m.key).toFixed(m.decimals)} ${m.unit}</strong></div>`).join('')}<div class="report-row"><span>일평균 걸음 수 / 사용 시간</span><strong>${fmt(average(items,'steps'))}걸음 / ${average(items,'minutes').toFixed(0)}분</strong></div><h3>측정 조건</h3><div class="report-row"><span>기기 · 설정</span><strong>Haier W1 · 보행 보조 2단계</strong></div><div class="report-row"><span>보행 환경</span><strong>${state.comparable?'실내 평지':'실내 평지 · 실외 경사'}</strong></div><div class="report-row"><span>최근 측정일</span><strong>${last.date}</strong></div><div class="report-note">이 리포트는 가상 데이터 예시이며 진단 결과가 아닙니다. 걸음·사용 시간 외 심화 보행 지표는 추가 센서 접근·검증 대상입니다. 측정 조건을 확인하고 보행 관찰·검사와 함께 해석합니다.</div></article>`;
  }
  function download(content,mime,filename){const url=URL.createObjectURL(new Blob([content],{type:mime})),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
  function reportHtml(){
    return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>APXe Care · 기관용 보행 리포트</title><style>body{max-width:750px;margin:40px auto;padding:0 25px;font:14px/1.65 -apple-system,'Apple SD Gothic Neo',sans-serif;color:#1d1d1f}h2{font-size:28px;letter-spacing:-.7px}h3{margin-top:28px}.meta{color:#6e6e73;font-size:12px}.report-row{display:flex;justify-content:space-between;gap:20px;border-bottom:1px solid #e5e5e7;padding:12px 0}.report-row span{color:#6e6e73}.report-note{background:#f5f5f7;color:#6e6e73;padding:18px;font-size:12px;margin-top:30px}button{background:#0066cc;color:white;border:0;border-radius:99px;padding:12px 20px;cursor:pointer}@media print{@page{size:A4;margin:16mm}body{margin:0;padding:0}button{display:none}}</style></head><body><button onclick="window.print()">인쇄 · PDF 저장</button>${reportDocument()}</body></html>`;
  }
  function csv(){
    const columns=[['date','측정일'],['steps','걸음 수'],['minutes','사용 시간(분)'],['speed','보행 속도(m/s)'],['left','왼쪽 보폭(cm)'],['right','오른쪽 보폭(cm)'],['difference','보폭 차이(%)'],['support','양발 지지 비율(%)'],['tilt','몸통 좌우 기울기(도)'],['terrain','보행 환경']];
    const quote=v=>'"'+String(v).replaceAll('"','""')+'"';
    return '\ufeff'+[columns.map(c=>quote(c[1])).join(','),...rows().map(r=>columns.map(([k])=>quote(k==='difference'?r[k].toFixed(1):r[k])).join(','))].join('\r\n');
  }
  document.addEventListener('click',e=>{
    const view=e.target.closest('[data-view]');if(view){state.view=view.dataset.view;render();if(view.closest('.provider-mobile-nav')||view.classList.contains('text-button')){$('#workspace').scrollIntoView({block:'start'});$('#workspace').focus({preventScroll:true});}return;}
    const metric=e.target.closest('[data-metric]');if(metric){state.metric=metric.dataset.metric;render();return;}
    const action=e.target.closest('[data-action]')?.dataset.action;if(!action)return;
    if(action==='close'){dialog.close();return;}
    if(action==='help')openDialog('기관용 화면 안내','<p>고객이 선택한 보행 기록의 변화를 살펴보고, 같은 측정 조건의 기록끼리 비교하는 기관용 화면입니다.</p><h3>예시 데이터</h3><p>모든 사용자·공유 상태·수치는 가상 예시입니다. 실제 기기나 의료기관에 연결되어 있지 않습니다. 양발 지지 비율을 포함한 심화 보행 지표는 센서 접근과 알고리즘 검증이 필요한 개발 항목입니다.</p>');
    if(action==='scope')openDialog('고객의 공유 범위','<p>가상 사용자 A가 다음 영역을 선택한 예시입니다.</p><ul><li>활동량·보행 리듬: 걸음 수, 사용 시간, 보행 속도</li><li>좌우 보행·자세: 보폭, 보폭 차이, 지지 비율, 기울기</li><li>측정 조건: 측정일, 기기, 보조 설정, 보행 환경</li></ul><p>실제 서비스에서는 고객의 동의·권한·공유 기간을 확인한 후 기록을 제공합니다.</p>');
    if(action==='conditions')openDialog('비교에 적용한 측정 조건',`<p>${rangeLabel()}의 공유 기록 ${allRows().length}일 중 ${rows().length}일을 분석했습니다.</p><ul><li>기기: Haier W1 · 가상 기록</li><li>설정: 보행 보조 · 강도 2단계</li><li>보행 환경: ${state.comparable?'실내 평지':'실내 평지와 실외 경사'}</li></ul><p>${state.comparable?`실외 경사 기록 ${allRows().length-rows().length}일을 제외했습니다.`:'다른 보행 환경을 포함해 비교하고 있습니다.'} 실제 측정에서는 센서 위치·산출 방식도 함께 확인해야 합니다.</p>`);
    if(action==='report')openDialog('리포트 확인',reportDocument(),'<button class="button" data-action="save">HTML 파일 저장</button><button class="button primary" data-action="print">인쇄 · PDF 저장</button>');
    if(action==='save')download(reportHtml(),'text/html;charset=utf-8','APXe_기관용_보행리포트_20260908.html');
    if(action==='print'){$('#print-root').innerHTML=reportDocument();window.print();}
    if(action==='csv')download(csv(),'text/csv;charset=utf-8','APXe_공유보행기록_20260908.csv');
  });
  $('#period').addEventListener('change',e=>{state.period=Number(e.target.value);render();});
  $('#comparable').addEventListener('change',e=>{state.comparable=e.target.checked;render();});
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  let resizeTimer,renderWidth=innerWidth;
  window.addEventListener("resize",()=>{if(innerWidth===renderWidth)return;renderWidth=innerWidth;clearTimeout(resizeTimer);resizeTimer=setTimeout(render,120);});
  window.APXeProvider={state,render,rows,allRows,csv,reportHtml};
  render();
})();
