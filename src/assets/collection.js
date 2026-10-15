/* The Snug Collection 3D fitting room: six looks, swipe rail, drag to turn. */
(function(){
'use strict';
var $=function(id){ return document.getElementById(id); };
var RM=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var COARSE=window.matchMedia&&window.matchMedia('(pointer: coarse)').matches;
var LAUNCH_RING='#C9CBD0';
var DATA=[
 {key:'blush',name:'Blush Puff',status:'Launch look',color:'#D9A3A6',ring:'#D7A9AA',
  pitch:'Soft blush, head to toe: a puffy frame, a smooth sweater and a pearl strand charm.',
  price:'<b>$32</b> cover · <b>$72</b> with the base',
  spec:[['Frame','Puff edge, blush silicone'],['Sweater','Smooth knit, rolled cuff'],['Charms','Pearl strand and pearl heart']],
  vote:'/?look=blush#waitlist',voteLabel:'Vote for Blush Puff'},
 {key:'holly',name:'Holly Bow',status:'Launch look · holiday limited run',color:'#9B2F3A',ring:'#F1EADC',
  pitch:'Cranberry with an ivory bow for the holidays. The bow clips off in January and the frame stays.',
  price:'<b>$36</b> cover · <b>$76</b> with the base',
  spec:[['Frame','Puff edge, cranberry silicone'],['Sweater','Ivory rib knit'],['Topper','Ivory bow, clear of the camera'],['Charms','Ornament and gold star']],
  vote:'/?look=holly#waitlist',voteLabel:'Vote for Holly Bow'},
 {key:'oat',name:'Oat Puff',status:'Launch look',color:'#E3D6C3',ring:'#EAE1D2',
  pitch:'Warm oat and bouclé. Quiet enough for a shared counter, soft enough to notice.',
  price:'<b>$32</b> cover · <b>$72</b> with the base',
  spec:[['Frame','Puff edge, oat silicone'],['Sweater','Oat bouclé'],['Charms','Add your own']],
  vote:'/?look=oat#waitlist',voteLabel:'Vote for Oat Puff'},
 {key:'kitty',name:'Cocoa Kitty',status:'Next-drop candidate',color:'#8B6753',ring:'#6E5142',
  pitch:'Cat ears and a cloud edge turn the screen into a character.',
  price:'Price set after the vote',
  spec:[['Frame','Cloud edge, cocoa silicone'],['Topper','Cat ears with blush inner ears'],['Sweater','Cocoa bouclé'],['Charm','Blush heart']],
  vote:'/?next=kitty#waitlist',voteLabel:'Vote to make it next'},
 {key:'butter',name:'Butter Wave',status:'Next-drop candidate',color:'#EED27C',ring:'#F1E9D6',
  pitch:'Butter yellow on a wavy edge, with a daisy and pearls on the corner.',
  price:'Price set after the vote',
  spec:[['Frame','Wave edge, butter yellow'],['Sweater','Butter rib knit'],['Charms','Daisy and pearls']],
  vote:'/?next=butter#waitlist',voteLabel:'Vote to make it next'},
 {key:'pearl',name:'Pearl Bobbin',status:'Next-drop candidate',color:'#F2E9DB',ring:'#EFE6D8',
  pitch:'Pearl beads ring the frame, so it ships already accessorized.',
  price:'Price set after the vote',
  spec:[['Frame','Puff edge ringed with pearl beads'],['Sweater','Cream eyelet'],['Charms','None needed']],
  vote:'/?next=pearl#waitlist',voteLabel:'Vote to make it next'}
];
var N=DATA.length, idx=-1, mode='frame', ringMode='launch', G3=null;
var room=$('room'), rail=$('rail'), lookEl=$('look'), hint=$('hint'), still=$('still');
if(COARSE) hint.textContent='Drag sideways to turn · pinch to zoom · double-tap to reset';
var cards=Array.prototype.slice.call(rail.querySelectorAll('.lk'));
var stills=['{{A:img/frame-blush.webp}}','{{A:img/frame-holly.webp}}','{{A:img/frame-oat.webp}}','{{A:img/frame-kitty.webp}}','{{A:img/frame-butter.webp}}','{{A:img/frame-pearl.webp}}'];

function lookHTML(d){
  var ring='<div><dt>Swivel ring</dt><dd><div class="ring" role="group" aria-label="Ring color">'+
    '<button type="button" data-ring="launch" aria-pressed="'+(ringMode==='launch')+'" style="--rc:'+LAUNCH_RING+'"><i></i>Pearl grey · launching</button>'+
    '<button type="button" data-ring="match" aria-pressed="'+(ringMode==='match')+'" style="--rc:'+d.ring+'"><i></i>Matching · later drops</button></div></dd></div>';
  return '<h2 class="name">'+d.name+'</h2><div class="rule"></div>'+
    '<p class="pitch">'+d.pitch+'</p>'+
    '<div class="meta"><span class="pill status">'+d.status+'</span></div>'+
    '<p class="price">'+d.price+'</p>'+
    '<dl class="spec">'+d.spec.map(function(r){ return '<div><dt>'+r[0]+'</dt><dd>'+r[1]+'</dd></div>'; }).join('')+ring+'</dl>'+
    '<div class="actions"><a class="btn" href="'+d.vote+'">'+d.voteLabel+'</a><button class="btn ghost" type="button" id="shareLook">Share this look</button><span class="note" id="shared" aria-live="polite"></span></div>';
}
lookEl.addEventListener('click',function(e){
  var b=e.target.closest('[data-ring]');
  if(b){ ringMode=b.getAttribute('data-ring'); lookEl.querySelectorAll('[data-ring]').forEach(function(x){ x.setAttribute('aria-pressed',String(x.getAttribute('data-ring')===ringMode)); }); if(G3){ G3.rings(); if(mode!=='kit') setMode('kit'); } return; }
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
  room.style.setProperty('--look',d.color);
  lookEl.innerHTML=lookHTML(d);
  cards.forEach(function(c,k){ c.setAttribute('aria-current',String(k===i)); });
  $('bName').textContent=d.name;
  if(!G3){ still.src=stills[i]; still.alt=d.name+', 3D rendering'; }
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
  var canvas=$('c'), stage=$('stage'), renderer;
  try{ renderer=new T.WebGLRenderer({canvas:canvas,antialias:true,alpha:true}); }catch(e){ return null; }
  var rad=T.MathUtils.degToRad;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75)); renderer.setClearColor(0,0);
  renderer.outputEncoding=T.sRGBEncoding; renderer.toneMapping=T.ACESFilmicToneMapping; renderer.toneMappingExposure=1.0;
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=T.PCFSoftShadowMap;
  var scene=SV.makeScene(renderer), camera=new T.PerspectiveCamera(24,1,10,9000);
  scene.traverse(function(l){ if(l.isDirectionalLight&&l.shadow) l.shadow.mapSize.set(1024,1024); });
  var MODES={frame:{ty:84,tz:0,H:134,W:122,theta:0.42,phi:1.32},kit:{ty:76,tz:10,H:134,W:180,theta:0.32,phi:1.24}};
  var view={theta:MODES.frame.theta,phi:MODES.frame.phi,zoom:1};
  var cache={}, cur=null, anim=null, dirty=true, spinning=!RM, autoUntil=performance.now()+16000, spinBtn=$('spin');
  function ringFor(i){ return ringMode==='match'?DATA[i].ring:LAUNCH_RING; }
  function getModel(i,m){ var k=i+':'+m; if(cache[k]) return cache[k];
    var L=SV.LOOKS[DATA[i].key], root=new T.Group(), inner, cy=MODES[m].ty;
    if(m==='frame'){ inner=SV.buildFrame(L,{openBack:true}); inner.rotation.x=-rad(12); inner.position.y=84*Math.cos(rad(12))+SV.TR*Math.sin(rad(12))+0.5; }
    else { inner=SV.kit(L,{ring:ringFor(i)}); root.userData.ringMat=inner.userData.ringMat; root.userData.i=i; }
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
  canvas.hidden=false; requestAnimationFrame(function(){ canvas.classList.add('on'); still.classList.add('off'); });
  return {
    show:show,
    setMode:function(){ resetView(); show(idx,false); },
    rings:function(){ Object.keys(cache).forEach(function(k){ var o=cache[k]; if(o.userData.ringMat) o.userData.ringMat.color.copy(SV.lin(ringFor(o.userData.i))); }); dirty=true; }
  };
}

var start=0, h=(location.hash||'').slice(1);
DATA.forEach(function(d,i){ if(d.key===h) start=i; });
select(start,{instant:true,force:true,noHash:!h});

/* cheap capability hint only: creating a real context here would block the first paint (seconds on software GL); the renderer constructor is the real test and is wrapped in try/catch */
function canGL(){ return !!(window.WebGLRenderingContext||window.WebGL2RenderingContext); }
function loadScript(src,cb){ var s=document.createElement('script'); s.src=src; s.async=false; s.onload=cb; s.onerror=function(){}; document.head.appendChild(s); }
var started=false;
function start3D(){ if(started) return; started=true;
  loadScript('{{A:three.min.js}}',function(){ loadScript('{{A:viewer.js}}',function(){
    try{ G3=initGL(); }catch(e){ G3=null; if(window.console) console.warn('3D off:',e&&e.message); }
    if(G3) G3.show(idx,true); else { $('controls').hidden=true; hint.hidden=true; $('nogl').hidden=false; }
  }); });
}
if(canGL()){
  /* this page is the 3D, so start soon after load, but on phones not mid-scroll: wait for an idle moment or a tap on the stage */
  (COARSE?[]:['pointermove','pointerdown','wheel','keydown']).forEach(function(ev){ window.addEventListener(ev,start3D,{passive:true,once:true}); });
  $('stage').addEventListener('pointerdown',start3D,{passive:true,once:true});
  window.addEventListener('load',function(){ setTimeout(function(){ if(window.requestIdleCallback) requestIdleCallback(start3D,{timeout:2500}); else start3D(); },COARSE?1200:2500); });
} else { $('controls').hidden=true; hint.hidden=true; $('nogl').hidden=false; }
})();
