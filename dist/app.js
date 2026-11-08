(function () {
  'use strict';
  const $=id=>document.getElementById(id), {recipes,catalog,makeFold,FOLD}=PaperRecipes;
  const frame=$('engine-frame');
  let recipe=recipes[0], model=makeFold(recipe), position=0, engineReady=false, loaded=false, playing=false, timer=null, patternMode=false, custom=false, activeColor=recipe.color;
  let toastTimer, engineFailed=false;
  const icon=name=>`<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const overall=()=>custom||recipe.mode==='overall';
  function loadCurrent(){if(recipe.pattern)send('loadSVG',{pattern:recipe.pattern});else send('load',{...model,step:position});}
  function send(type,data={}) { frame.contentWindow?.postMessage({source:'paper-studio',type,...data},location.origin); }
  function toast(message) { $('toast').textContent=message; $('toast').hidden=false; clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('toast').hidden=true,4500); }
  function stop(notify=false) { playing=false;clearTimeout(timer);timer=null;updatePlay();if(notify)send('pause'); }
  function updatePlay() { $('play').innerHTML=icon(playing?'pause':'play');$('play').setAttribute('aria-label',playing?'일시정지':'전체 순서 재생'); }
  function select(next,scroll=false) {
    stop(true);recipe=next;custom=false;position=0;model=makeFold(recipe);activeColor=recipe.color;loaded=false;
    $('stage-error').hidden=true;
    renderRecipe(); if(engineReady&&!engineFailed)loadCurrent();renderPattern();setColor(activeColor);
    if(scroll)$('studio').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function renderRecipe() {
    $('recipe-title').textContent=recipe.name;$('recipe-description').textContent=recipe.description;
    $('recipe-category').textContent=recipe.category;$('recipe-number').textContent=custom?'YOUR PATTERN':`RECIPE ${String(recipes.indexOf(recipe)+1).padStart(2,'0')}`;
    $('recipe-time').textContent=custom?'내 도안':`약 ${recipe.time}분`;$('recipe-level').textContent=recipe.level;
    $('step-count').textContent=overall()?'전체 접힘 탐색':`${recipe.steps.length}단계`;
    $('recipe-paper').textContent=recipe.paper;$('recipe-size').textContent=recipe.size;
    $('recipe-tip').textContent=recipe.tip;$('timeline').max=recipe.steps.length;
    $('recipe-steps').innerHTML=recipe.steps.map((step,i)=>`<li data-step="${i+1}"><button class="step-button" data-goto="${i+1}" aria-label="${i+1}단계: ${escape(step[0])}"><span class="step-number">${String(i+1).padStart(2,'0')}</span><span class="step-body"><strong>${escape(step[0])}</strong><p class="step-description" hidden>${escape(step[1])}</p></span></button></li>`).join('');
    updatePosition();
  }
  function updatePosition() {
    const total=recipe.steps.length,step=Math.ceil(position-0.001),done=position>=total-.001;
    $('timeline').value=position;$('timeline').style.background=`linear-gradient(to right,#71835e ${position/total*100}%,#dce2d1 ${position/total*100}%)`;
    $('timeline-count').textContent=`${Math.round(position*10)/10} / ${total}`;
    $('step-progress').textContent=position===0?`준비 / ${total}`:done?'모두 접었어요!':`${step} / ${total}`;
    $('current-step-label').textContent=position===0?'접을 준비':`${step}단계${done?' · 완성!':''}`;
    $('stage-label').textContent=position===0?(custom?'가져온 도안의 펼친 상태':'정사각형 한 장에서 시작'):recipe.steps[step-1][0];
    document.querySelectorAll('#recipe-steps li').forEach((li,i)=>{
      li.classList.toggle('selected',i===step-1);li.classList.toggle('complete',i<step-1);
      li.querySelector('.step-number').innerHTML=i<step-1?icon('check'):String(i+1).padStart(2,'0');
      li.querySelector('p').hidden=i!==step-1;li.querySelector('button').setAttribute('aria-current',i===step-1?'step':'false');
    });
    $('previous').disabled=position<=0;$('next').disabled=done;
    if(position>0)$('recipe-tip').textContent=recipe.steps[step-1][2];else $('recipe-tip').textContent=recipe.tip;
    if(patternMode)renderPattern();
  }
  function go(value,{duration=650}={}) {
    position=Math.max(0,Math.min(recipe.steps.length,value));updatePosition();
    if(engineReady&&loaded&&!engineFailed&&!patternMode)send('step',{step:overall()?1:position,fraction:overall()?position:1,duration});
    else if(!patternMode)toast('시뮬레이션을 준비 중이에요. 잠시만 기다려주세요.');
  }
  function play() {
    if(playing){stop(true);return;}
    if(engineFailed&&!patternMode){toast('3D 모드를 사용할 수 없어 전개도를 보여드릴게요.');setView(true);}
    if(!loaded&&!patternMode){toast('시뮬레이션이 준비되면 재생할 수 있어요.');return;}
    if(position>=recipe.steps.length)go(0,{duration:500});
    playing=true;updatePlay();
    const next=()=>{
      if(!playing)return;
      if(position>=recipe.steps.length){stop();toast('한 장의 종이가 새로운 모양이 되었어요!');return;}
      const speed=Number($('speed').value);go(Math.min(recipe.steps.length,Math.floor(position)+1),{duration:900/speed});
      timer=setTimeout(next,3000/speed);
    };
    timer=setTimeout(next,position===0?500:100);
  }
  function setColor(color) {
    activeColor=color;
    document.querySelectorAll('[data-color]').forEach(button=>{const chosen=button.dataset.color===color;button.classList.toggle('chosen',chosen);button.setAttribute('aria-pressed',String(chosen));});
    if(engineReady)send('color',{color});if(patternMode)renderPattern();
  }
  function setView(pattern) {
    patternMode=pattern;$('view-pattern').classList.toggle('selected',pattern);$('view-3d').classList.toggle('selected',!pattern);
    $('view-pattern').setAttribute('aria-pressed',String(pattern));$('view-3d').setAttribute('aria-pressed',String(!pattern));
    $('pattern-view').hidden=!pattern;frame.style.visibility=pattern?'hidden':'visible';
    $('camera-top').hidden=pattern;$('camera-reset').hidden=pattern;
    $('canvas-hint').textContent=pattern?'파란 점선: 골접기 · 붉은 점선: 산접기':'드래그로 돌려보기 · 스크롤로 확대';
    if(pattern){stop(true);renderPattern();}else if(!engineFailed&&loaded){send('step',{step:overall()?1:position,fraction:overall()?position:1,duration:300});}
  }
  function renderPattern() {
    const fold=model.fold,vertices=fold.vertices_coords;
    const xs=vertices.map(p=>p[0]),ys=vertices.map(p=>p.length===2?p[1]:p[2]);
    const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),size=Math.max(maxX-minX,maxY-minY)||1,margin=size*.1;
    let content=fold.faces_vertices.map(face=>`<polygon points="${face.map(i=>`${xs[i]},${ys[i]}`).join(' ')}" fill="#${activeColor}" fill-opacity=".13"/>`).join('');
    content+=fold.edges_vertices.map((edge,i)=>{
      const a=edge[0],b=edge[1],assignment=fold.edges_assignment[i],boundary=assignment==='B',active=(model.groups[i]||1)===Math.ceil(position);
      const stroke=boundary?'#727e66':assignment==='M'?'#bc684e':assignment==='F'?'#b7bdac':'#708e9d';
      return `<line x1="${xs[a]}" y1="${ys[a]}" x2="${xs[b]}" y2="${ys[b]}" stroke="${stroke}" stroke-width="${size*(active&&!boundary?.009:.004)}" ${!boundary&&assignment!=='F'?`stroke-dasharray="${size*.026} ${size*.018}"`:''} opacity="${assignment==='F'?.35:1}"/>`;
    }).join('');
    $('pattern-view').innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escape(recipe.name)} 전개도. 파란 점선은 골접기, 붉은 점선은 산접기입니다." viewBox="${minX-margin} ${minY-margin} ${maxX-minX+2*margin} ${maxY-minY+2*margin}">${content}</svg>`;
  }
  function search(query) {
    query=query.trim().toLowerCase();
    if(!query){$('search-message').hidden=false;$('search-message').textContent='만들고 싶은 모양을 입력해주세요. 동물과 생활 소품 20개를 찾아볼 수 있어요.';return;}
    const result=[...catalog,...recipes].map(item=>({item,score:Math.max(...[item.name,item.short,...item.aliases].map(text=>{const word=text.toLowerCase();return word===query?1000+word.length:query.includes(word)?word.length:word.includes(query)?query.length/2:0;}))})).filter(match=>match.score>0).sort((a,b)=>b.score-a.score)[0]?.item;
    if(result){$('search-message').hidden=true;openEntry(result);toast(`‘${result.name}’ 종이접기를 찾았어요.`);}
    else{$('search-message').hidden=false;$('search-message').textContent=`‘${query}’는 현재 20개 목록에 없어요. 학·고양이·토끼·비행기·배·하트 등을 찾아보세요. 가지고 있는 .fold 도안도 직접 열 수 있어요.`;}
  }
  function illustration(shape,color) {
    if(shape==='envelope')return `<g transform="rotate(-12 100 75)"><path d="m25 65 75-48 75 48-75 65z" fill="${color}" opacity=".65"/><path d="M25 65h150v81H25z" fill="${color}"/><path d="m25 65 75 51 75-51" fill="#efd4b4"/><path d="m25 146 56-48 19 16 19-16 56 48z" fill="#d58e6b"/><path d="m25 146 56-48m94 48-56-48" fill="none" stroke="#bc7d5d" stroke-width=".6"/></g>`;
    if(shape==='gate')return `<g transform="rotate(-13 100 80)"><path d="m33 31 67 10 67-10v105l-67 13-67-13z" fill="${color}" opacity=".45"/><path d="m33 31 67 10v108l-67-13z" fill="${color}"/><path d="m100 41 67-10v105l-67 13z" fill="#a7b69b"/><path d="M100 41v108" stroke="#6f8468" stroke-width="1"/></g>`;
    if(shape==='accordion')return `<g transform="rotate(-12 100 80)">${Array.from({length:6},(_,i)=>`<path d="m${30+i*24} ${i%2?46:29} 24 ${i%2?-17:17}v90l-24 ${i%2?17:-17}z" fill="${i%2?'#b3975b':color}"/>`).join('')}</g>`;
    return `<g transform="rotate(-13 100 80)"><path d="m25 122 75-106 75 106z" fill="${color}"/><path d="m25 122 75-106-13 100z" fill="#92acb9"/><path d="m87 116 88 6-75-106z" fill="#aec3cb" opacity=".65"/><path d="m25 122 62-6 88 6" fill="none" stroke="#6c8e9f" stroke-width=".6"/></g>`;
  }
  function openEntry(entry){const simulation=recipes.find(r=>r.id===(entry.simulation||entry.id));if(simulation)select(simulation,true);else guide(entry);}
  function catalogArt(shape,color){
    if(shape==='envelope')return illustration('envelope',color);
    const outline='#576349',line=`stroke="${outline}" stroke-width=".8" opacity=".4"`;
    if(['cat','dog','fox','rabbit'].includes(shape)){
      const ears=shape==='rabbit'?`<path d="m62 83-6-69 32 57m22 0 33-57-7 70" fill="${color}"/><path d="m64 62-2-37 21 43m34 0 22-43-8 38" fill="#eadbd3"/>`:shape==='dog'?`<path d="m55 48-30 62 39-13m81-49 30 62-40-13" fill="${color}"/>`:`<path d="m47 75 9-54 39 35 45-35 15 55" fill="${color}"/>`;
      return `<g transform="rotate(-7 100 80)">${ears}<path d="m48 62 52-19 52 19-10 65-42 28-42-28z" fill="${color}"/><path d="m49 78 51 61 51-61-9 49-42 28-42-28z" fill="#f2e4ce"/><path d="m48 62 52 77 52-77" fill="none" ${line}/><circle cx="76" cy="91" r="3" fill="${outline}"/><circle cx="125" cy="91" r="3" fill="${outline}"/><path d="m94 118 6 6 6-6z" fill="${outline}"/></g>`;
    }
    if(shape==='crane')return `<g transform="rotate(-6 100 80)"><path d="m18 49 71 53 13-85 23 86 51-16-26 31-25 23-22-10-58 5 44-34z" fill="${color}"/><path d="m89 102 13-85 10 96 13 28-22-10z" fill="#abc1c8"/><path d="m125 103 27-45 21 2 10-12-3 23-20 0-10 47z" fill="${color}"/><path d="m18 49 71 53-44 34 58-5 9-18" fill="none" ${line}/></g>`;
    if(shape==='fish')return `<g transform="rotate(-8 100 80)"><path d="m37 87 70-54 47 53-47 52z" fill="${color}"/><path d="m45 88-31-35v69z" fill="#a2bac3"/><path d="m107 33-14 53 14 52 12-51z" fill="#dce7df" opacity=".6"/><circle cx="137" cy="84" r="3" fill="${outline}"/></g>`;
    if(shape==='whale')return `<g transform="rotate(-7 100 90)"><path d="m23 72 80-36 39 34 28-32-4 35-25 27-32 25-72-6z" fill="${color}"/><path d="m37 119 72 6 32-25-91 7z" fill="#e4e9d9"/><circle cx="45" cy="83" r="3" fill="${outline}"/><path d="m23 72 80 14 39-16" fill="none" ${line}/></g>`;
    if(shape==='swan')return `<path d="m28 116 68-62 33 57 6-80 28-12 14 14-28-1 1 88-37 24z" fill="${color}"/><path d="m28 116 101-5-16 33z" fill="#e5e8dc"/><path d="m96 54 17 90 16-33" fill="none" ${line}/>`;
    if(shape==='frog')return `<g transform="rotate(-8 100 85)"><path d="m58 71-31-29 2 53 33 25-26 24 47-5 17-28 17 28 47 5-26-24 33-25 2-53-31 29" fill="${color}"/><path d="m58 71 42-24 42 24-9 45-33 17-33-17z" fill="#aabb8c"/><path d="m58 71 42 62 42-62" fill="none" ${line}/><circle cx="76" cy="75" r="5" fill="#f8f7e7"/><circle cx="124" cy="75" r="5" fill="#f8f7e7"/><circle cx="76" cy="75" r="2" fill="${outline}"/><circle cx="124" cy="75" r="2" fill="${outline}"/></g>`;
    if(shape==='butterfly')return `<g transform="rotate(-10 100 85)"><path d="m100 95-73-58 7 76 55 25 11-43 11 43 55-25 7-76z" fill="${color}"/><path d="m100 95-66 18 55 25z" fill="#dac3c6"/><path d="m100 95 66 18-55 25z" fill="#dac3c6"/><path d="m95 74 5 65 5-65z" fill="#8f7488"/></g>`;
    if(shape==='airplane')return `<g transform="rotate(-12 100 85)"><path d="m22 100 156-68-46 108-36-29-24 34 7-45z" fill="${color}"/><path d="m178 32-82 79-17-11z" fill="#f1e1c7"/><path d="m96 111 36 29 46-108z" fill="#a6bac0"/><path d="m79 100-7 45 24-34" fill="#6a8795"/></g>`;
    if(shape==='boat')return `<path d="m22 94 40 47h82l35-47z" fill="${color}"/><path d="M61 94V37l40 57z" fill="#ead9b9"/><path d="m101 94 42-68v68z" fill="#f5ecda"/><path d="m22 94 81 25 76-25" fill="none" ${line}/>`;
    if(shape==='heart')return `<g transform="rotate(-8 100 85)"><path d="m27 76 18-31 31-5 24 20 24-20 31 5 18 31-73 71z" fill="${color}"/><path d="m100 60v87l73-71-18-31-31-5z" fill="#d4ac9e"/><path d="m27 76 73 71V60" fill="none" ${line}/></g>`;
    if(shape==='lily'||shape==='lotus')return `<g transform="rotate(-5 100 85)"><path d="m100 143-65-33-18-57 67 35 16-67 21 67 62-35-18 57z" fill="${color}"/><path d="m100 143-16-55 16-67 21 67z" fill="#e4bcb5"/><path d="m35 110 65 33 65-33-43-21-22 43-23-43z" fill="#ead5bd"/><path d="m100 143-65-33m65 33 65-33" fill="none" ${line}/>${shape==='lotus'?`<path d="m22 130 78 24 78-24-55-4-23 17-23-17z" fill="#96a481"/>`:''}</g>`;
    if(shape==='star')return `<g transform="rotate(-10 100 85)"><path d="m100 20 21 43 48 7-35 34 8 48-42-23-43 23 9-48-35-34 48-7z" fill="${color}"/><path d="m100 20 0 80 42 52-8-48 35-34-69 30-43 52 9-48-35-34 69 30z" fill="#ddc995" opacity=".65"/></g>`;
    if(shape==='box')return `<g transform="rotate(-7 100 85)"><path d="m31 58 70-27 69 27-4 64-65 29-65-29z" fill="${color}"/><path d="m31 58 70 28 69-28-69-27z" fill="#f0dfbd"/><path d="m101 86 69-28-4 64-65 29z" fill="#a98558"/><path d="M101 86v65" fill="none" ${line}/></g>`;
    if(shape==='cup')return `<g transform="rotate(-9 100 85)"><path d="m41 52 59-23 59 23-15 88H56z" fill="${color}"/><path d="m41 52 59 35 59-35-59-23z" fill="#f0dfbd"/><path d="m41 52 103 88-88 0z" fill="#c3a977"/><path d="m41 52 103 88" fill="none" ${line}/></g>`;
    if(shape==='hat')return `<g transform="rotate(-9 100 85)"><path d="m40 119 60-91 60 91z" fill="${color}"/><path d="m100 28 15 91h45z" fill="#b99281"/><path d="M26 112h148v28H26z" fill="#e3c8b3"/><path d="M26 112h148" fill="none" ${line}/></g>`;
    return illustration('triangle',color);
  }
  function renderCards(filter='all'){
    const items=catalog.filter(r=>filter==='all'||filter==='simulation'&&r.simulation||r.group===filter);
    $('recipe-cards').innerHTML=items.map((r,i)=>`<button class="recipe-card" data-entry="${r.id}" aria-label="${r.name} ${r.simulation?'3D 열기':'접기 안내 열기'}"><div class="card-art" style="--card-bg:${['#f0e8dc','#e9ede2','#f2eddf','#e8edef','#efe7e9'][i%5]}"><span class="card-tag">${escape(r.level)}</span><svg viewBox="0 0 200 170" aria-hidden="true">${catalogArt(r.shape,'#'+r.color)}</svg><span class="card-status ${r.simulation?'available':''}">${r.simulation?'3D':'접기 안내'}</span></div><div class="card-copy"><strong>${escape(r.name)}</strong><span>${icon('clock')} 약 ${r.time}분</span></div><p>${r.category} · ${r.simulation==='letter'?'단계별 3D':r.simulation?'전체 접힘 3D':'사진 안내 연결'}</p></button>`).join('');
    document.querySelector('.collection-count').textContent=`${items.length}개의 종이접기`;
  }
  function guide(entry){dialog(`<p class="eyebrow">${escape(entry.category)} · ORIGAMI COLLECTION</p><div class="guide-art"><svg viewBox="0 0 200 170" aria-hidden="true">${catalogArt(entry.shape,'#'+entry.color)}</svg></div><h2>${escape(entry.name)}</h2><p>${escape(entry.description)}</p><div class="guide-meta"><span>${escape(entry.level)}</span><span>약 ${entry.time}분</span><span>${escape(entry.paper)}</span></div><h3>먼저 준비해요</h3><p>준비할 종이: ${escape(entry.size)}. 모서리를 정확히 맞추고, 한 단계를 접을 때마다 접힌 선을 가볍게 눌러주세요.</p><a class="guide-link" href="${entry.reference}" target="_blank" rel="noopener">사진으로 접는 순서 보기 ↗</a><p class="guide-source">Origami Guide의 원본 튜토리얼을 새 창에서 엽니다. 이 항목은 현재 3D 시뮬레이션을 지원하지 않습니다. 본인 도안이 있다면 .fold 파일로 열어볼 수 있어요.</p>`);}
  renderCards();
  $('recipe-cards').addEventListener('click',event=>{const button=event.target.closest('[data-entry]');if(button)openEntry(catalog.find(r=>r.id===button.dataset.entry));});
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});renderCards(button.dataset.filter);}));
  function dialog(content) { $('dialog-content').innerHTML=content;$('info-dialog').showModal(); }
  function help() { dialog(`<p class="eyebrow">WELCOME TO YOUR FOLDING TABLE</p><h2>처음 오셨나요?</h2><ol><li>원하는 모양을 검색하거나 아래 레시피를 고르세요.</li><li>재생 버튼을 누르면 순서대로 접혀요. 왼쪽 단계를 눌러 바로 이동할 수도 있습니다.</li><li>마우스로 종이를 돌리고, 스크롤로 확대해보세요. 휴대폰에서는 손가락으로 돌릴 수 있어요.</li><li>‘전개도’에서는 산접기와 골접기 선을 확인할 수 있어요.</li></ol><h3>내 도안도 열 수 있어요</h3><p>꼭짓점·면·접힘선이 담긴 .fold 파일을 가져오세요. 내 도안은 전체 접힘을 재생하며, 사람을 위한 단계별 레시피를 자동 생성하지는 않습니다. 파일은 이 브라우저 안에서만 처리됩니다.</p><h3>조금 가볍게, 천천히</h3><p>접힘 계산은 초당 최대 24프레임으로 제한하고, 짧게 동작한 뒤 자동으로 쉽니다. 화면이 오래 느려지거나 탭을 떠나면 계산을 멈춥니다. 이 기능은 시스템 CPU·GPU 사용률을 직접 읽지는 않습니다.</p>`); }
  function about() { dialog(`<p class="eyebrow">ONE SHEET. ENDLESS POSSIBILITIES.</p><h2>한 장에서 시작하는<br>작은 즐거움.</h2><p>종이의 레시피는 접는 방법과 움직이는 도안을 함께 보는 작은 종이접기 작업실입니다. 동물 10종을 포함한 20개 목록을 제공합니다. 봉투는 단계별 3D, 학과 비행기는 전체 접힘 3D로 볼 수 있고, 나머지는 원본 접기 안내에 연결합니다. 검색은 준비된 레시피를 찾으며, 임의의 모양에서 새 접기 순서를 생성하지 않습니다.</p><p>화면은 접힌 선의 목표 각도를 단계별로 바꾸는 물리 시뮬레이션입니다. 종이 두께·충돌·모서리 끼워넣기는 구현되어 있지 않아, 실제 결과와 조금 다를 수 있습니다.</p><h3>함께 만든 오픈소스</h3><p>Amanda Ghassaei의 <a href="https://github.com/amandaghassaei/OrigamiSimulator/tree/7855983" target="_blank" rel="noopener">OrigamiSimulator</a>와 Erik Demaine, Jason Ku, Robert Lang의 <a href="https://github.com/edemaine/fold" target="_blank" rel="noopener">FOLD</a>를 활용합니다. 두 프로젝트 모두 MIT 라이선스입니다.</p>`); }
  function licenses() { dialog(`<p class="eyebrow">OPEN SOURCE, OPEN POSSIBILITIES</p><h2>오픈소스 안내</h2><h3>OrigamiSimulator · MIT</h3><p>Copyright © 2018 Amanda Ghassaei.<br>기준 소스: 커밋 7855983.<br>GPU 접힘 계산·모델·셰이더를 사용하며, 단계별 접힘 각도 제어와 부하를 줄이는 렌더 루프를 추가했습니다.<br><a href="licenses/OrigamiSimulator-MIT.txt" target="_blank">라이선스 전문</a> · <a href="https://github.com/amandaghassaei/OrigamiSimulator/tree/7855983" target="_blank" rel="noopener">원본 코드</a></p><h3>FOLD · MIT</h3><p>Copyright © 2016 Erik Demaine, Jason Ku, Robert Lang.<br>도안의 면·선 데이터 구성, 가져오기와 내보내기에 사용합니다. 시뮬레이터에 포함된 호환 버전을 이용합니다.<br><a href="licenses/FOLD-MIT.txt" target="_blank">라이선스 전문</a> · <a href="https://github.com/edemaine/fold" target="_blank" rel="noopener">원본 코드</a></p><p>원본 엔진에 포함된 Three.js, jQuery, Underscore, Earcut, numeric.js 등의 의존성은 파일 내 원저작권 표시를 유지했습니다.</p>`); }
  function validateFold(data) {
    if(!data||typeof data!=='object'||!Array.isArray(data.vertices_coords)||data.vertices_coords.length<3||data.vertices_coords.length>500)throw new Error('꼭짓점이 3~500개인 FOLD 도안만 열 수 있어요.');
    if(!data.vertices_coords.every(p=>Array.isArray(p)&&(p.length===2||p.length===3)&&p.every(v=>Number.isFinite(v)&&Math.abs(v)<1e8)))throw new Error('꼭짓점 좌표가 올바르지 않아요.');
    const validIndex=i=>Number.isInteger(i)&&i>=0&&i<data.vertices_coords.length;
    if(data.edges_vertices&&(!Array.isArray(data.edges_vertices)||data.edges_vertices.length>1500||!data.edges_vertices.every(e=>Array.isArray(e)&&e.length===2&&e.every(validIndex)&&e[0]!==e[1])))throw new Error('접힘선 데이터가 올바르지 않거나 선이 너무 많아요.');
    if(!data.faces_vertices){if(!data.edges_vertices)throw new Error('면 또는 접힘선 데이터가 필요해요.');if(!data.vertices_coords.every(p=>p.length===2))throw new Error('3D 도안은 faces_vertices 면 데이터가 필요해요.');FOLD.convert.edges_vertices_to_faces_vertices(data);}
    if(!Array.isArray(data.faces_vertices)||data.faces_vertices.length<1||data.faces_vertices.length>1000||!data.faces_vertices.every(f=>Array.isArray(f)&&f.length>=3&&f.length<=30&&f.every(validIndex)&&new Set(f).size===f.length))throw new Error('면 데이터가 올바르지 않거나 지원하는 크기를 넘었어요.');
    if(!data.edges_vertices)FOLD.convert.faces_vertices_to_edges(data);
    data.edges_assignment=data.edges_vertices.map((_,i)=>['B','M','V','F','U'].includes(data.edges_assignment?.[i])?data.edges_assignment[i]:'F');
    data.edges_foldAngle=data.edges_vertices.map((_,i)=>{
      const value=data.edges_foldAngle?.[i],assignment=data.edges_assignment[i];
      if(assignment==='B')return null;
      return Number.isFinite(value)?Math.min(180,Math.max(-180,value)):assignment==='M'?-174:assignment==='V'?174:0;
    });
    const min=[0,1,2].map(axis=>Math.min(...data.vertices_coords.map(p=>p[axis]||0))),max=[0,1,2].map(axis=>Math.max(...data.vertices_coords.map(p=>p[axis]||0)));
    if(Math.max(...min.map((v,i)=>max[i]-v))<1e-8)throw new Error('도안의 크기가 0이라 표시할 수 없어요.');
    // Accept geometry fields only; external metadata is never interpreted as markup or URLs.
    return {file_spec:1.1,file_creator:'Paper Recipe import',frame_classes:['creasePattern'],vertices_coords:data.vertices_coords,edges_vertices:data.edges_vertices,edges_assignment:data.edges_assignment,edges_foldAngle:data.edges_foldAngle,faces_vertices:data.faces_vertices};
  }
  async function importFile(file) {
    if(!file)return;
    try {
      if(file.size>300000)throw new Error('가벼운 실행을 위해 300KB 이하의 .fold 파일만 열 수 있어요.');
      if(!/\.fold$/i.test(file.name))throw new Error('.fold 형식의 파일을 골라주세요.');
      const data=validateFold(JSON.parse(await file.text()));
      stop(true);custom=true;position=0;model={fold:data,groups:data.edges_vertices.map(()=>1)};
      recipe={name:file.name.replace(/\.fold$/i,'').slice(0,45),category:'내가 가져온 도안',description:'내 도안의 접힌 선을 함께 움직여 모양을 살펴보세요.',time:0,level:'직접 탐색',paper:'내 FOLD 도안',size:`꼭짓점 ${data.vertices_coords.length}개`,tip:'모든 선을 동시에 접는 탐색 모드입니다. 단계별 레시피 자동 생성은 지원하지 않아요.',steps:[['전체 접힘 살펴보기','접힘 비율을 움직여 모든 선이 함께 접히는 모습을 살펴보세요.','도안에 저장된 산접기·골접기와 목표 각도를 사용합니다.']]};
      loaded=false;renderRecipe();renderPattern();if(engineReady&&!engineFailed)send('load',{...model,step:0});$('studio').scrollIntoView({behavior:'smooth'});toast('내 도안을 열었어요. 파일은 서버로 전송되지 않습니다.');
    }catch(error){toast(error instanceof SyntaxError?'FOLD 파일의 JSON 형식을 읽을 수 없어요.':error.message);}
    finally{$('fold-file').value='';}
  }
  function download(data,name) {
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  window.addEventListener('message',event=>{
    if(event.source!==frame.contentWindow||event.origin!==location.origin||event.data?.source!=='paper-engine')return;
    const data=event.data;
    if(data.type==='ready'){if(engineReady)return;engineReady=true;engineFailed=false;loadCurrent();}
    else if(data.type==='loaded'){if(data.fold){model={fold:data.fold,groups:data.groups};renderPattern();}loaded=true;$('engine-state').innerHTML='<i></i>준비됐어요';send('color',{color:activeColor});if(patternMode)send('pause');else if(position>0)send('step',{step:overall()?1:position,fraction:overall()?position:1,duration:650});}
    else if(data.type==='state'){
      $('engine-state').classList.toggle('running',!!data.running);
      $('engine-state').innerHTML=`<i></i>${data.running?'접는 중':data.reason==='budget'?'부하로 일시정지':'쉬는 중'}`;
      if(['budget','hidden'].includes(data.reason)){stop();if(data.reason==='budget')toast('화면 처리에 시간이 걸려 계산을 쉬고 있어요. 재생 버튼으로 이어갈 수 있어요.');}
    }
    else if(data.type==='error'){
      engineFailed=true;stop();$('engine-state').innerHTML='<i></i>전개도 이용 가능';$('stage-error').hidden=patternMode;
      $('stage-error').querySelector('p').textContent=`3D 시뮬레이션을 준비하지 못했어요. ${data.message}`;
    }
    else if(data.type==='warning'){toast(data.message);}
    else if(data.type==='export'){
      const exported=data.fold;exported.file_title=recipe.name;exported.file_creator='Paper Recipe · OrigamiSimulator + FOLD';exported.frame_attributes=['3D'];delete exported.edges_foldAngle;
      download(exported,`${recipe.name}-접힌모양.fold`);toast('지금 접힌 모양을 FOLD 파일로 저장했어요.');
    }
  });
  $('search-form').addEventListener('submit',e=>{e.preventDefault();search($('search-input').value);});
  document.querySelectorAll('[data-search]').forEach(button=>button.addEventListener('click',()=>{$('search-input').value=button.dataset.search;search(button.dataset.search);}));
  document.querySelectorAll('[data-recipe]').forEach(button=>button.addEventListener('click',()=>select(recipes.find(r=>r.id===button.dataset.recipe),true)));
  $('recipe-steps').addEventListener('click',event=>{const button=event.target.closest('[data-goto]');if(button){stop();go(Number(button.dataset.goto));}});
  $('play').addEventListener('click',play);$('previous').addEventListener('click',()=>{stop();go(Math.ceil(position)-1);});$('next').addEventListener('click',()=>{stop();go(Math.floor(position)+1);});
  $('restart').addEventListener('click',()=>{stop();go(0,{duration:900});});
  let sliderFrame=0;
  $('timeline').addEventListener('input',()=>{stop();if(sliderFrame)cancelAnimationFrame(sliderFrame);sliderFrame=requestAnimationFrame(()=>{go(Number($('timeline').value),{duration:120});sliderFrame=0;});});
  document.querySelectorAll('[data-color]').forEach(button=>button.addEventListener('click',()=>setColor(button.dataset.color)));
  $('view-3d').addEventListener('click',()=>setView(false));$('view-pattern').addEventListener('click',()=>setView(true));$('error-pattern').addEventListener('click',()=>{$('stage-error').hidden=true;setView(true);});
  $('camera-reset').addEventListener('click',()=>send('camera',{mode:'iso'}));$('camera-top').addEventListener('click',()=>send('camera',{mode:'top'}));
  $('simulation-pause').addEventListener('click',()=>{stop(true);toast('접힘 계산을 멈췄어요. 재생하거나 단계를 누르면 다시 움직여요.');});
  $('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('simulator').requestFullscreen();}catch{toast('이 브라우저에서는 전체 화면을 사용할 수 없어요.');}});
  $('help-open').addEventListener('click',help);$('about-open').addEventListener('click',about);$('licenses-open').addEventListener('click',licenses);$('dialog-close').addEventListener('click',()=>$('info-dialog').close());
  $('info-dialog').addEventListener('click',event=>{if(event.target===$('info-dialog')){const rect=$('info-dialog').getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)$('info-dialog').close();}});
  $('import-button').addEventListener('click',()=>$('fold-file').click());$('fold-file').addEventListener('change',()=>importFile($('fold-file').files[0]));
  $('export-fold').addEventListener('click',()=>{if(loaded&&!engineFailed&&!patternMode)send('snapshot',{title:recipe.name});else{download({...model.fold,file_title:recipe.name},`${recipe.name}-전개도.fold`);toast('전개도를 FOLD 파일로 저장했어요.');}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop(true);});
  frame.addEventListener('load',()=>send('ping'));
  renderRecipe();renderPattern();send('ping');
  window.PaperStudio={getState:()=>({recipe:recipe.id||'custom',position,playing,loaded,engineReady,engineFailed,patternMode,vertices:model.fold.vertices_coords.length})};
})();
