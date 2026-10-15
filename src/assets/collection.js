/* The Snug Collection 3D fitting room: nine looks (six silicone, three wood), swipe rail, drag to turn, base finishes. */
(function(){
'use strict';
var $=function(id){ return document.getElementById(id); };
var RM=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var COARSE=window.matchMedia&&window.matchMedia('(pointer: coarse)').matches;
/* base finishes: the swivel ring material. Kept in one table so new finishes are one line. */
var FINISHES={cloud:{name:'Cloud',sw:'#F3F1EE',color:'#F3F1EE',m:0,r:0.32,cc:0.9,env:0.9},aluminum:{name:'Aluminum',sw:'#C9CBD0',color:'#D3D4D7',m:0.95,r:0.28,cc:0,env:1.6},graphite:{name:'Graphite',sw:'#2C2C30',color:'#2C2C30',m:0.8,r:0.4,cc:0,env:1.3}};
var DATA=[
 {key:'blush',name:'Blush Puff',status:'Launch look',color:'#D9A3A6',
  pitch:'Soft blush, head to toe: a puffy frame, a smooth sweater and a pearl strand charm.',
  price:'<b>$49</b> the set with base · <b>$34</b> cover only',
  spec:[['Frame','Puff edge, blush silicone'],['Sweater','Blush silicone, rolled lip'],['Charms','Pearl strand and pearl heart']],
  vote:'/?look=blush#waitlist',voteLabel:'Vote for Blush Puff'},
 {key:'holly',name:'Holly Bow',status:'Launch look · holiday limited run',color:'#9B2F3A',
  pitch:'Cranberry with an ivory bow for the holidays. The bow clips off in January and the frame stays.',
  price:'<b>$49</b> the set with base · <b>$34</b> cover only',
  spec:[['Frame','Puff edge, cranberry silicone'],['Sweater','Ivory silicone, rolled lip'],['Topper','Molded ivory bow, placed to clear the camera'],['Charms','Ornament and gold star']],
  vote:'/?look=holly#waitlist',voteLabel:'Vote for Holly Bow'},
 {key:'oat',name:'Oat Puff',status:'Launch look',color:'#E3D6C3',
  pitch:'Warm oat, frame and sweater. Quiet enough for a shared counter, soft enough to notice.',
  price:'<b>$49</b> the set with base · <b>$34</b> cover only',
  spec:[['Frame','Puff edge, oat silicone'],['Sweater','Oat silicone, rolled lip'],['Charms','Add your own']],
  vote:'/?look=oat#waitlist',voteLabel:'Vote for Oat Puff'},
 {key:'kitty',name:'Cocoa Kitty',status:'Next-drop candidate',color:'#8B6753',
  pitch:'Cat ears and a cloud edge turn the screen into a character.',
  price:'Price set after the vote',
  spec:[['Frame','Cloud edge, cocoa silicone'],['Topper','Cat ears with blush inner ears'],['Sweater','Cocoa silicone'],['Charm','Blush heart']],
  vote:'/?next=kitty#waitlist',voteLabel:'Vote to make it next'},
 {key:'butter',name:'Butter Wave',status:'Next-drop candidate',color:'#EED27C',
  pitch:'Butter yellow on a wavy edge, with a daisy and pearls on the corner.',
  price:'Price set after the vote',
  spec:[['Frame','Wave edge, butter yellow'],['Sweater','Butter silicone'],['Charms','Daisy and pearls']],
  vote:'/?next=butter#waitlist',voteLabel:'Vote to make it next'},
 {key:'pearl',name:'Pearl Bobbin',status:'Next-drop candidate',color:'#F2E9DB',
  pitch:'Pearl beads ring the frame, so it ships already accessorized.',
  price:'Price set after the vote',
  spec:[['Frame','Puff edge ringed with pearl beads'],['Sweater','Cream silicone'],['Charms','None needed']],
  vote:'/?next=pearl#waitlist',voteLabel:'Vote to make it next'},
 {key:'oak',name:'Oak & Oat',status:'Wood · in development',color:'#C49A68',wood:true,
  pitch:'A thin face of real white oak set into an oat silicone frame. Slips on like the soft covers and feels like wood where you touch it.',
  price:'<b>$59</b> the set with base · <b>$44</b> cover only',
  spec:[['Face','White oak, 3 mm, oiled'],['Frame','Oat silicone, grips the screen edge'],['Sweater','Oat silicone'],['Base','Oak sides and top']],
  vote:'/?next=oak#waitlist',voteLabel:'Vote to make it next'},
 {key:'walnut',name:'Walnut & Cocoa',status:'Wood · in development',color:'#6B4A33',wood:true,
  pitch:'American walnut on a cocoa silicone frame. The darker one, for walnut cabinets and warm kitchens.',
  price:'<b>$59</b> the set with base · <b>$44</b> cover only',
  spec:[['Face','American walnut, 3 mm, oiled'],['Frame','Cocoa silicone, grips the screen edge'],['Sweater','Cocoa silicone'],['Base','Walnut sides and top']],
  vote:'/?next=walnut#waitlist',voteLabel:'Vote to make it next'},
 {key:'maple',name:'Maple & Sage',status:'Wood · in development',color:'#D9BE93',wood:true,
  pitch:'Pale maple on a sage silicone frame. A cottage kitchen in one piece.',
  price:'<b>$59</b> the set with base · <b>$44</b> cover only',
  spec:[['Face','Hard maple, 3 mm, oiled'],['Frame','Sage silicone, grips the screen edge'],['Sweater','Sage silicone'],['Base','Maple sides and top']],
  vote:'/?next=maple#waitlist',voteLabel:'Vote to make it next'}
];
var N=DATA.length, idx=-1, mode='frame', finish='aluminum', finTouched=false, G3=null;
var room=$('room'), rail=$('rail'), lookEl=$('look'), hint=$('hint'), still=$('still'), stageEl=$('stage'), badge=$('badge');
var cards=Array.prototype.slice.call(rail.querySelectorAll('.lk'));
var stills=['{{A:img/photo-blush.webp}}','{{A:img/photo-holly.webp}}','{{A:img/photo-oat.webp}}','{{A:img/photo-kitty.webp}}','{{A:img/photo-butter.webp}}','{{A:img/photo-pearl.webp}}','{{A:img/look-oak.webp}}','{{A:img/look-walnut.webp}}','{{A:img/look-maple.webp}}'];
var ALTS=['a soft pink silicone frame on a white counter','a cranberry silicone frame with an ivory bow','a cream silicone frame','a cocoa cloud-edged frame with cat ears','a butter-yellow wave-edged frame','a cream frame ringed with pearl beads','an oak-faced frame with an oat silicone rim, oat sweater and oak base','a walnut-faced frame with a cocoa silicone rim, cocoa sweater and walnut base','a maple-faced frame with a sage silicone rim, sage sweater and maple base'];
function voteHref(d){ return (finTouched&&!d.wood)?d.vote.replace('#','&finish='+finish+'#'):d.vote; }

function lookHTML(d){
  var fin=d.wood?'':'<div class="finrow"><dt>Base finish</dt><dd><div class="fin" role="group" aria-label="Base finish">'+Object.keys(FINISHES).map(function(k){ var f=FINISHES[k]; return '<button type="button" data-fin="'+k+'" aria-pressed="'+(finish===k)+'" style="--rc:'+f.sw+'"><i></i>'+f.name+'</button>'; }).join('')+'</div></dd></div>';
  return '<h2 class="name">'+d.name+'</h2><span class="status">'+d.status+'</span>'+
    '<p class="pitch">'+d.pitch+'</p>'+
    '<p class="price">'+d.price+'</p>'+
    '<dl class="spec">'+d.spec.map(function(r){ return '<div><dt>'+r[0]+'</dt><dd>'+r[1]+'</dd></div>'; }).join('')+fin+'</dl>'+
    '<div class="actions"><a class="btn" id="voteBtn" href="'+voteHref(d)+'">'+d.voteLabel+'</a><button class="btn ghost" type="button" id="shareLook">Share this look</button><span class="note" id="shared" aria-live="polite"></span></div>';
}
lookEl.addEventListener('click',function(e){
  var b=e.target.closest('[data-fin]');
  if(b){ finish=b.getAttribute('data-fin'); finTouched=true; lookEl.querySelectorAll('[data-fin]').forEach(function(x){ x.setAttribute('aria-pressed',String(x.getAttribute('data-fin')===finish)); }); var v=$('voteBtn'); if(v) v.href=voteHref(DATA[idx]); if(G3){ G3.finish(); if(mode!=='kit') setMode('kit'); } else { setMode('kit'); start3D(); } return; }
  if(e.target.closest('#shareLook')){
    var d=DATA[idx], url=location.origin+'/collection/#'+d.key, msg=$('shared');
    if(navigator.share){ navigator.share({title:d.name+' · The Snug Collection',text:d.name+', a cozy cover for the new Apple HomeView. Spin it in 3D:',url:url}).catch(function(){}); return; }
    var ok=function(){ msg.textContent='Link copied'; setTimeout(function(){ msg.textContent=''; },2000); };
    if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok,function(){ msg.textContent=url; }); else msg.textContent=url;
  }
});

/* rail: click, swipe on phones, keyboard */
var prog=false, progT=null, railT=null, SWIPE=window.matchMedia?window.matchMedia('(max-width: 899px)'):{matches:false};
function railScrolls(){ return rail.scrollWidth>rail.clientWidth+4; }
function scrollRail(i,smooth){ if(!railScrolls()) return; var c=cards[i], left=c.offsetLeft-(rail.clientWidth-c.offsetWidth)/2; prog=true; clearTimeout(progT); progT=setTimeout(function(){ prog=false; },1200); try{ rail.scrollTo({left:left,behavior:(smooth&&!RM)?'smooth':'auto'}); }catch(e){ rail.scrollLeft=left; } }
cards.forEach(function(c,i){ c.addEventListener('click',function(){ select(i,{}); }); });
if('onscrollend' in window) rail.addEventListener('scrollend',function(){ if(prog){ clearTimeout(progT); progT=setTimeout(function(){ prog=false; },80); } });
rail.addEventListener('scroll',function(){ if(prog||!SWIPE.matches||!railScrolls()) return; clearTimeout(railT); railT=setTimeout(function(){ var mid=rail.scrollLeft+rail.clientWidth/2, best=0, bd=1e9; cards.forEach(function(c,i){ var dd=Math.abs(c.offsetLeft+c.offsetWidth/2-mid); if(dd<bd){ bd=dd; best=i; } }); if(best!==idx) select(best,{fromRail:true}); },130); },{passive:true});
$('prev').addEventListener('click',function(){ select(idx-1,{}); });
$('next').addEventListener('click',function(){ select(idx+1,{}); });
document.addEventListener('keydown',function(e){ var t=e.target; if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable)) return; if(e.key==='ArrowRight') select(idx+1,{}); else if(e.key==='ArrowLeft') select(idx-1,{}); });

function select(i,o){
  o=o||{}; i=((i%N)+N)%N; if(i===idx&&!o.force) return; idx=i; var d=DATA[i];
  badge.style.setProperty('--c',d.color);
  lookEl.innerHTML=lookHTML(d);
  cards.forEach(function(c,k){ c.setAttribute('aria-current',String(k===i)); });
  $('bName').textContent=d.name;
  still.src=stills[i]; still.alt=d.name+', '+ALTS[i];
  if(!o.fromRail) scrollRail(i,!o.instant);
  if(!o.noHash){ try{ history.replaceState(null,'','#'+d.key); }catch(e){} }
  if(G3) G3.show(i,o.instant);
}
function setMode(m){ mode=m; document.querySelectorAll('.seg [data-mode]').forEach(function(b){ b.setAttribute('aria-pressed',String(b.getAttribute('data-mode')===m)); }); if(G3) G3.setMode(); }
document.querySelectorAll('.seg [data-mode]').forEach(function(b){ b.addEventListener('click',function(){ setMode(b.getAttribute('data-mode')); }); });
window.addEventListener('hashchange',function(){ var h=location.hash.slice(1); DATA.forEach(function(d,i){ if(d.key===h&&i!==idx) select(i,{noHash:true}); }); });

/* ---------- 3D ---------- */
function initGL(){
  var T=window.THREE, SV=window.SnugViewer; if(!T||!SV) return null;
  SV.onChange=function(){ dirty=true; };
  var canvas=$('c'), stage=$('stage'), renderer;
  try{ renderer=new T.WebGLRenderer({canvas:canvas,antialias:true,alpha:true}); }catch(e){ return null; }
  var rad=T.MathUtils.degToRad;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75)); renderer.setClearColor(0,0);
  renderer.outputEncoding=T.sRGBEncoding; renderer.toneMapping=T.ACESFilmicToneMapping; renderer.toneMappingExposure=1.0;
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=T.PCFSoftShadowMap;
  var scene=SV.makeScene(renderer), camera=new T.PerspectiveCamera(20,1,10,9000);
  scene.traverse(function(l){ if(l.isDirectionalLight&&l.shadow) l.shadow.mapSize.set(1024,1024); });
  var MODES={frame:{ty:82,tz:0,H:132,W:126,theta:0.38,phi:1.36},kit:{ty:72,tz:8,H:134,W:180,theta:0.32,phi:1.28}};
  var view={theta:MODES.frame.theta,phi:MODES.frame.phi,zoom:1};
  var cache={}, cur=null, anim=null, dirty=true, spinning=!RM, autoUntil=performance.now()+16000, spinBtn=$('spin');
  function applyFinish(mat){ var f=FINISHES[finish]; if(!mat||!f) return; mat.color=SV.lin(f.color); mat.metalness=f.m; mat.roughness=f.r; mat.clearcoat=f.cc; mat.envMapIntensity=f.env; mat.needsUpdate=true; }
  function getModel(i,m){ var k=i+':'+m; if(cache[k]) return cache[k];
    var L=SV.LOOKS[DATA[i].key], root=new T.Group(), inner, cy=MODES[m].ty;
    if(m==='frame'){ inner=SV.buildFrame(L,{openBack:true}); inner.rotation.x=-rad(12); inner.position.y=84*Math.cos(rad(12))+SV.TR*Math.sin(rad(12))+0.5; }
    else { inner=SV.kit(L,{}); root.userData.ringMat=inner.userData.ringMat; applyFinish(root.userData.ringMat); }
    var wrap=new T.Group(); wrap.add(inner); wrap.position.y=-cy; root.add(wrap); root.position.y=cy; cache[k]=root; return root; }
  function place(){ var v=MODES[mode], t=Math.tan(rad(camera.fov/2)); var r=Math.max(v.H/t,v.W/(camera.aspect*t))*1.06*view.zoom, s=Math.sin(view.phi);
    camera.position.set(r*s*Math.sin(view.theta),v.ty+r*Math.cos(view.phi),v.tz+r*s*Math.cos(view.theta)); camera.lookAt(0,v.ty,v.tz); }
  function resize(){ var w=Math.max(1,stage.clientWidth), h=Math.max(1,stage.clientHeight); renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); dirty=true; }
  if(window.ResizeObserver) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize',resize);
  resize();
  function reset(o){ o.scale.setScalar(1); o.rotation.y=0; }
  function easeOutBack(k){ var c1=1.5,c3=c1+1; return 1+c3*Math.pow(k-1,3)+c1*Math.pow(k-1,2); }
  function show(i,instant){ var next=getModel(i,mode), prev=cur;
    if(anim){ scene.remove(anim.prev); reset(anim.prev); if(anim.added){ scene.remove(anim.next); reset(anim.next); } prev=anim.added?anim.next:anim.prev; if(prev.parent!==scene) scene.add(prev); anim=null; }
    if(next===prev){ cur=next; dirty=true; return; }
    cur=next;
    if(instant||RM||!prev){ if(prev) scene.remove(prev); reset(next); scene.add(next); dirty=true; return; }
    anim={prev:prev,next:next,t0:performance.now(),added:false};
  }
  function step(now){ var a=anim, t=now-a.t0, OUT=170, IN=620;
    if(t<OUT){ var k=t/OUT; a.prev.scale.setScalar(1-0.3*k*k); a.prev.rotation.y=0.55*k*k; return; }
    if(!a.added){ scene.remove(a.prev); reset(a.prev); a.next.scale.setScalar(0.7); scene.add(a.next); a.added=true; }
    var k2=Math.min(1,(t-OUT)/IN); a.next.scale.setScalar(0.7+0.3*easeOutBack(k2)); a.next.rotation.y=-0.7*(1-Math.pow(1-k2,3)); if(k2>=1){ reset(a.next); anim=null; }
  }
  /* pointer: drag to turn, pinch or wheel to zoom, double-click to reset */
  var ptrs={}, drag=null, pinch=null, hinted=false;
  function hideHint(){ if(!hinted){ hinted=true; hint.classList.add('gone'); } }
  function setSpin(on){ spinning=on; if(on) autoUntil=performance.now()+16000; spinBtn.setAttribute('aria-pressed',String(on)); spinBtn.setAttribute('aria-label',on?'Pause spin':'Spin');
    $('spinIcon').innerHTML=on?'<rect x="6.5" y="5" width="4" height="14" rx="1"/><rect x="13.5" y="5" width="4" height="14" rx="1"/>':'<path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/>'; }
  setSpin(spinning);
  function count(){ return Object.keys(ptrs).length; }
  function pdist(){ var k=Object.keys(ptrs), a=ptrs[k[0]], b=ptrs[k[1]]; return Math.hypot(a.x-b.x,a.y-b.y)||1; }
  canvas.addEventListener('pointerdown',function(e){ ptrs[e.pointerId]={x:e.clientX,y:e.clientY}; try{ canvas.setPointerCapture(e.pointerId); }catch(_){}
    hideHint(); if(spinning) setSpin(false);
    if(count()===1){ drag={x:e.clientX,y:e.clientY,t:view.theta,p:view.phi,touch:e.pointerType==='touch'}; canvas.classList.add('dragging'); }
    else if(count()===2){ drag=null; pinch={d:pdist(),z:view.zoom}; } });
  canvas.addEventListener('pointermove',function(e){ if(!ptrs[e.pointerId]) return; ptrs[e.pointerId]={x:e.clientX,y:e.clientY};
    if(pinch&&count()>=2){ view.zoom=Math.min(1.7,Math.max(0.55,pinch.z*pinch.d/pdist())); dirty=true; }
    else if(drag){ view.theta=drag.t-(e.clientX-drag.x)*0.008; if(!drag.touch) view.phi=Math.min(1.52,Math.max(0.78,drag.p+(e.clientY-drag.y)*0.005)); dirty=true; } });
  function up(e){ delete ptrs[e.pointerId]; if(count()<2) pinch=null; if(count()===0){ drag=null; canvas.classList.remove('dragging'); } }
  canvas.addEventListener('pointerup',up); canvas.addEventListener('pointercancel',up); canvas.addEventListener('lostpointercapture',up);
  canvas.addEventListener('wheel',function(e){ e.preventDefault(); hideHint(); view.zoom=Math.min(1.7,Math.max(0.55,view.zoom*Math.exp(e.deltaY*0.0012))); dirty=true; },{passive:false});
  function resetView(){ var v=MODES[mode]; view.theta=v.theta; view.phi=v.phi; view.zoom=1; dirty=true; }
  canvas.addEventListener('dblclick',resetView);
  $('reset').addEventListener('click',resetView);
  $('zoomIn').addEventListener('click',function(){ view.zoom=Math.max(0.55,view.zoom/1.18); dirty=true; });
  $('zoomOut').addEventListener('click',function(){ view.zoom=Math.min(1.7,view.zoom*1.18); dirty=true; });
  spinBtn.addEventListener('click',function(){ setSpin(!spinning); });
  var visible=true; if('IntersectionObserver' in window) new IntersectionObserver(function(en){ visible=en[0].isIntersecting; },{threshold:0}).observe(stage);
  var last=performance.now(), frames=0, slow=0;
  function tick(now){ var dt=Math.min(0.05,(now-last)/1000); last=now;
    if(!document.hidden&&visible){
      if(spinning&&now>autoUntil) setSpin(false);
      if(spinning){ view.theta+=dt*0.3; dirty=true; }
      if(anim){ step(now); dirty=true; }
      if(dirty){ var t1=performance.now(); place(); renderer.render(scene,camera); dirty=false; frames++; if(performance.now()-t1>45) slow++; if(frames===30&&slow>12){ setSpin(false); renderer.setPixelRatio(1); resize(); } }
    }
    requestAnimationFrame(tick); }
  requestAnimationFrame(tick);
  canvas.hidden=false; requestAnimationFrame(function(){ canvas.classList.add('on'); stageEl.classList.remove('ask'); stageEl.classList.add('live'); hint.textContent=COARSE?'Drag sideways to turn · pinch to zoom · double-tap to reset':'Drag to turn · scroll to zoom · double-click to reset'; });
  return {
    show:show,
    setMode:function(){ resetView(); show(idx,false); },
    finish:function(){ Object.keys(cache).forEach(function(k){ applyFinish(cache[k].userData.ringMat); }); dirty=true; }
  };
}

var start=0, h=(location.hash||'').slice(1);
DATA.forEach(function(d,i){ if(d.key===h) start=i; });
select(start,{instant:true,force:true,noHash:!h});

/* cheap capability hint only: creating a real context here would block the first paint (seconds on software GL); the renderer constructor is the real test and is wrapped in try/catch */
function canGL(){ return !!(window.WebGLRenderingContext||window.WebGL2RenderingContext); }
function loadScript(src,cb){ var s=document.createElement('script'); s.src=src; s.async=false; s.onload=cb; s.onerror=function(){}; document.head.appendChild(s); }
var started=false;
function start3D(){ if(started||!canGL()) return; started=true;
  loadScript('{{A:three.min.js}}',function(){ loadScript('{{A:viewer.js}}',function(){
    try{ G3=initGL(); }catch(e){ G3=null; if(window.console) console.warn('3D off:',e&&e.message); }
    if(G3) G3.show(idx,true); else { $('controls').hidden=true; hint.hidden=true; $('nogl').hidden=false; }
  }); });
}
if(canGL()){
  /* the photo is the resting state; the model loads on the first sign of intent, never on a timer (the scene build is a long main-thread job, worst on phones mid-scroll).
     Desktop: the first mouse move, wheel or key. Phones: a tap on the picture or its controls. */
  (COARSE?[]:['pointermove','wheel','keydown']).forEach(function(ev){ window.addEventListener(ev,start3D,{passive:true,once:true}); });
  stageEl.addEventListener('pointerdown',start3D,{passive:true,once:true});
  if(COARSE){ hint.textContent='Tap to spin in 3D'; stageEl.classList.add('ask'); }
} else { $('controls').hidden=true; hint.hidden=true; $('nogl').hidden=false; }
})();
