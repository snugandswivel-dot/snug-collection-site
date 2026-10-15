/* The Snug Collection home page: 3D stage, waitlist, sharing, FAQ. */
(function(){
'use strict';
var $=function(id){ return document.getElementById(id); };
var SS=window.SS||{}, RM=SS.RM;

/* ---------- FAQ: animated open and close ---------- */
var faq=$('faqwrap');
if(faq&&!RM){
  faq.classList.add('anim');
  faq.querySelectorAll('details').forEach(function(d){
    if(d.open) d.classList.add('open');
    d.querySelector('summary').addEventListener('click',function(e){ e.preventDefault();
      if(d.open){ d.classList.remove('open'); setTimeout(function(){ d.open=false; },480); }
      else { d.open=true; requestAnimationFrame(function(){ requestAnimationFrame(function(){ d.classList.add('open'); }); }); }
    });
  });
}

/* ---------- preselect votes from buttons and links ---------- */
function pickLook(v){ if(v==='base'){ $('i2').checked=true; return; } var r=document.querySelector('input[name=look][value="'+v+'"]'); if(r) r.checked=true; }
function pickNext(v){ var r=document.querySelector('input[name=next_look][value="'+v+'"]'); if(r) r.checked=true; }
document.querySelectorAll('[data-pick]').forEach(function(a){ a.addEventListener('click',function(){ pickLook(a.getAttribute('data-pick')); }); });
document.querySelectorAll('[data-next]').forEach(function(a){ a.addEventListener('click',function(){ pickNext(a.getAttribute('data-next')); }); });
var qs; try{ qs=new URL(location.href).searchParams; }catch(e){ qs=null; }
if(qs){ if(qs.get('look')) pickLook(qs.get('look')); if(qs.get('next')) pickNext(qs.get('next')); if(qs.get('want')==='base') pickLook('base'); }

/* ---------- referral and share code ---------- */
var ref=qs?(qs.get('ref')||'').replace(/[^a-z0-9]/gi,'').slice(0,12):'';
var code=''; try{ code=localStorage.getItem('ss_code')||''; }catch(e){}
if(!/^[a-z0-9]{6}$/.test(code)){
  var a=new Uint8Array(6);
  if(window.crypto&&crypto.getRandomValues) crypto.getRandomValues(a); else for(var i=0;i<6;i++) a[i]=Math.random()*256|0;
  code=Array.prototype.map.call(a,function(b){ return (b%36).toString(36); }).join('');
  try{ localStorage.setItem('ss_code',code); }catch(e){}
}
function shareURL(){ return location.origin+'/?ref='+code; }

/* ---------- waitlist ---------- */
var form=$('wl'), err=$('err'), okBox=$('ok'), btn=$('submit'), email=$('email');
if(form){
  email.addEventListener('input',function(){ if(email.getAttribute('aria-invalid')) SS.setErr(email,$('email-err'),SS.EMAIL.test(email.value.trim())?'':'Enter an email like you@example.com'); });
  var payload=function(){ var fd=new FormData(form); return {email:String(fd.get('email')||'').trim(),interest:fd.getAll('interest'),look:fd.get('look')||'',next_look:fd.get('next_look')||'',room:fd.get('room')||'',hv_status:fd.get('hv_status')||'',hv_color:fd.get('hv_color')||'',price_ok:fd.get('price_ok')||'',note:String(fd.get('note')||'').slice(0,500),ref:ref,share_code:code,t:Math.round(performance.now()-SS.T0),website:fd.get('website')||''}; };
  var done=function(){
    var NAMES={blush:'Blush Puff',holly:'Holly Bow',oat:'Oat Puff',kitty:'Cocoa Kitty',butter:'Butter Wave',pearl:'Pearl Bobbin'}, o=payload();
    $('okpick').textContent='Your vote for the first drop: '+(NAMES[o.look]||'')+(o.next_look&&NAMES[o.next_look]?'. Next: '+NAMES[o.next_look]:'')+'.';
    form.hidden=true; okBox.classList.add('on'); $('sharelink').textContent=shareURL();
    var pin='https://www.pinterest.com/pin/create/button/?url='+encodeURIComponent(shareURL())+'&media='+encodeURIComponent(location.origin+'/og.jpg')+'&description='+encodeURIComponent('Cozy covers and a swivel base for the new Apple HomeView, from The Snug Collection');
    $('pinBtn').href=pin;
    okBox.scrollIntoView({behavior:RM?'auto':'smooth',block:'center'}); okBox.focus({preventScroll:true});
    try{ localStorage.setItem('ss_joined','1'); }catch(e){}
  };
  form.addEventListener('submit',function(e){ e.preventDefault(); err.classList.remove('on');
    var o=payload(), bad=false, ie=$('interest-err');
    if(!SS.EMAIL.test(o.email)){ SS.setErr(email,$('email-err'),'Enter an email like you@example.com'); bad=true; } else SS.setErr(email,$('email-err'),'');
    if(!o.interest.length){ ie.textContent='Pick at least one.'; ie.classList.add('on'); bad=true; } else { ie.textContent=''; ie.classList.remove('on'); }
    if(bad){ email.getAttribute('aria-invalid')?email.focus():$('i1').focus(); return; }
    btn.disabled=true; btn.textContent='Joining…';
    SS.post(form.getAttribute('data-endpoint'),o,done,function(){ err.classList.add('on'); btn.disabled=false; btn.textContent='Join the waitlist'; });
  });
  $('copyBtn').addEventListener('click',function(){ var u=shareURL(), c=$('copied');
    var ok=function(){ c.textContent='Copied'; setTimeout(function(){ c.textContent=''; },2000); };
    var fallback=function(){ var r=document.createRange(); r.selectNodeContents($('sharelink')); var s=window.getSelection(); s.removeAllRanges(); s.addRange(r); try{ document.execCommand('copy'); ok(); }catch(e){ c.textContent='Select the link and copy it'; } };
    if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(u).then(ok,fallback); else fallback();
  });
  if(navigator.share){ $('shareBtn').addEventListener('click',function(){ navigator.share({title:'The Snug Collection',text:'Cozy covers and a swivel base for the new Apple HomeView. Vote on the first drop:',url:shareURL()}).catch(function(){}); }); }
  else { $('shareBtn').hidden=true; }
}

/* ---------- 3D stage: three.js loads only when the stage is near the screen ---------- */
var stage=$('stage'), canvas=$('c'), fallback=$('fallback'), hint=$('hint'), seg=$('seg');
var LOOKC={blush:'#D9A3A6',holly:'#9B2F3A',oat:'#E3D6C3'};
function setChip(n){ seg.querySelectorAll('.chip').forEach(function(x){ x.setAttribute('aria-pressed',String(x.getAttribute('data-look')===n)); }); stage.style.setProperty('--look',LOOKC[n]||'#D9A3A6'); }
var show=null;
seg.querySelectorAll('.chip').forEach(function(b){ b.addEventListener('click',function(){ var n=b.getAttribute('data-look'); setChip(n); if(show) show(n,false); else if(typeof start==='function') start(); }); });

function loadScript(src,cb){ var s=document.createElement('script'); s.src=src; s.async=false; s.onload=cb; s.onerror=function(){}; document.head.appendChild(s); }
/* cheap capability hint only: creating a real context here would block the first paint (seconds on software GL); the renderer constructor is the real test and is wrapped in try/catch */
function canGL(){ return !!(window.WebGLRenderingContext||window.WebGL2RenderingContext); }

function initStage(){
  try{
    var THREE=window.THREE, SV=window.SnugViewer; if(!THREE||!SV) return;
    var renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true,alpha:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75)); renderer.setClearColor(0,0);
    renderer.outputEncoding=THREE.sRGBEncoding; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.0;
    renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    var scene=SV.makeScene(renderer), camera=new THREE.PerspectiveCamera(24,1,10,6000);
    scene.traverse(function(l){ if(l.isDirectionalLight&&l.shadow) l.shadow.mapSize.set(1024,1024); });
    var rad=THREE.MathUtils.degToRad;
    /* two framings: the full set packed tight on wide stages, the frame alone on phones, both fitted to the stage so the hero fills it */
    var VIEWS={kit:{ty:74,tz:6,H:134,W:160,theta:0.34,phi:1.25},frame:{ty:84,tz:0,H:134,W:122,theta:0.42,phi:1.32}};
    var mode=stage.clientWidth<500?'frame':'kit', V=function(){ return VIEWS[mode]; };
    var orbit={theta:V().theta,phi:V().phi};
    var cache={}, cur=null, curName=null, anim=null, dirty=true;
    var model=function(n){ var key=n+':'+mode; if(!cache[key]){ var L=SV.LOOKS[n], g=new THREE.Group(), inner;
        if(mode==='frame'){ inner=SV.buildFrame(L,{openBack:true}); inner.rotation.x=-rad(12); inner.position.y=84*Math.cos(rad(12))+SV.TR*Math.sin(rad(12))+0.5; }
        else inner=SV.kit(L,{sweaterX:72,sweaterZ:-70,baseX:-78,baseZ:54});
        var cy=V().ty, wrap=new THREE.Group(); wrap.add(inner); wrap.position.y=-cy; g.add(wrap); g.position.y=cy; cache[key]=g; } return cache[key]; };
    var easeOutBack=function(k){ var c1=1.5,c3=c1+1; return 1+c3*Math.pow(k-1,3)+c1*Math.pow(k-1,2); };
    var reset=function(o){ o.scale.setScalar(1); o.rotation.y=0; o.position.y=V().ty; };
    show=function(n,instant){ curName=n; var next=model(n), prev=cur;
      if(anim){ scene.remove(anim.prev); reset(anim.prev); if(anim.added){ scene.remove(anim.next); reset(anim.next); } prev=anim.added?anim.next:anim.prev; if(prev.parent!==scene) scene.add(prev); anim=null; }
      if(next===prev){ cur=next; dirty=true; return; }
      cur=next;
      if(instant||RM||!prev){ if(prev) scene.remove(prev); reset(next); scene.add(next); dirty=true; return; }
      anim={prev:prev,next:next,t0:performance.now(),added:false};
    };
    var step=function(now){ var a=anim, t=now-a.t0, OUT=170, IN=620;
      if(t<OUT){ var k=t/OUT; a.prev.scale.setScalar(1-0.28*k*k); a.prev.rotation.y=0.5*k*k; return; }
      if(!a.added){ scene.remove(a.prev); reset(a.prev); a.next.scale.setScalar(0.72); scene.add(a.next); a.added=true; }
      var k2=Math.min(1,(t-OUT)/IN); a.next.scale.setScalar(0.72+0.28*easeOutBack(k2)); a.next.rotation.y=-0.6*(1-Math.pow(1-k2,3));
      if(k2>=1){ reset(a.next); anim=null; }
    };
    var place=function(){ var v=V(), t=Math.tan(rad(camera.fov/2)), r=Math.max(v.H/t,v.W/(camera.aspect*t))*1.03, s=Math.sin(orbit.phi);
      camera.position.set(r*s*Math.sin(orbit.theta),v.ty+r*Math.cos(orbit.phi),v.tz+r*s*Math.cos(orbit.theta)); camera.lookAt(0,v.ty,v.tz); };
    var resize=function(){ var w=Math.max(1,stage.clientWidth), h=Math.max(1,stage.clientHeight); renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
      var m=w<500?'frame':'kit'; if(m!==mode){ mode=m; orbit.theta=V().theta; orbit.phi=V().phi; if(curName){ if(anim){ scene.remove(anim.prev); if(anim.added) scene.remove(anim.next); anim=null; } if(cur){ scene.remove(cur); } cur=null; show(curName,true); } }
      dirty=true; };
    if(window.ResizeObserver) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize',resize);
    resize();
    var drag=null, auto=!RM, autoUntil=performance.now()+16000, last=performance.now(), entrance=RM?null:{t0:performance.now()};
    canvas.addEventListener('pointerdown',function(e){ drag={x:e.clientX,y:e.clientY,t:orbit.theta,p:orbit.phi,touch:e.pointerType==='touch'}; auto=false; try{ canvas.setPointerCapture(e.pointerId); }catch(_){} canvas.classList.add('dragging'); hint.classList.add('gone'); });
    canvas.addEventListener('pointermove',function(e){ if(!drag) return; orbit.theta=drag.t-(e.clientX-drag.x)*0.008; if(!drag.touch) orbit.phi=Math.min(1.5,Math.max(0.9,drag.p+(e.clientY-drag.y)*0.005)); dirty=true; });
    var up=function(){ drag=null; canvas.classList.remove('dragging'); };
    canvas.addEventListener('pointerup',up); canvas.addEventListener('pointercancel',up); canvas.addEventListener('lostpointercapture',up);
    canvas.addEventListener('dblclick',function(){ orbit.theta=0.35; orbit.phi=1.3; auto=!RM; autoUntil=performance.now()+16000; dirty=true; });
    var lastY=window.scrollY; window.addEventListener('scroll',function(){ var y=window.scrollY, dy=y-lastY; lastY=y; if(!RM&&visible&&Math.abs(dy)<300){ orbit.theta+=dy*0.0016; dirty=true; } },{passive:true});
    var visible=true; if('IntersectionObserver' in window) new IntersectionObserver(function(en){ visible=en[0].isIntersecting; },{threshold:0}).observe(stage);
    var frames=0, slow=0;
    var tick=function(now){ var dt=Math.min(0.05,(now-last)/1000); last=now;
      if(!document.hidden&&visible){
        if(auto&&now>autoUntil) auto=false;
        if(auto){ orbit.theta+=dt*0.25; dirty=true; }
        if(entrance){ var k=Math.min(1,(now-entrance.t0)/800); cur.scale.setScalar(0.8+0.2*easeOutBack(k)); cur.position.y=V().ty+36*(1-k)*(1-k); if(k>=1){ reset(cur); entrance=null; } dirty=true; }
        if(anim){ step(now); dirty=true; }
        if(dirty){ var t1=performance.now(); place(); renderer.render(scene,camera); dirty=false; frames++; if(performance.now()-t1>45) slow++; if(frames===30&&slow>12){ auto=false; renderer.setPixelRatio(1); resize(); } }
      }
      requestAnimationFrame(tick);
    };
    var first=(document.querySelector('#seg [aria-pressed="true"]')||{}).getAttribute?document.querySelector('#seg [aria-pressed="true"]').getAttribute('data-look'):'blush';
    show(first,true); requestAnimationFrame(tick);
    canvas.hidden=false;
    requestAnimationFrame(function(){ canvas.classList.add('on'); fallback.classList.add('off'); hint.textContent='Drag to turn · 3D rendering'; });
  }catch(e){ if(window.console) console.warn('3D stage off:',e&&e.message); }
}
if(canGL()){
  var started=false;
  var start=function(){ if(started) return; started=true; loadScript('{{A:three.min.js}}',function(){ loadScript('{{A:viewer.js}}',initStage); }); };
  /* load the 3D after the first sign of interest, so the first paint stays light */
  var near=false, wake=function(){ if(near) start(); else want=true; }, want=false;
  var coarse=!!(window.matchMedia&&window.matchMedia('(pointer:coarse)').matches);
  /* phones: the scene build is a ~1s main-thread job, so never start it on a scroll or first touch (that is mid-gesture); wait for idle, or a tap on the stage itself */
  (coarse?[]:['pointermove','pointerdown','wheel','keydown','scroll']).forEach(function(ev){ window.addEventListener(ev,function h(){ window.removeEventListener(ev,h,{passive:true}); wake(); },{passive:true,once:true}); });
  stage.addEventListener('pointerdown',function(){ start(); },{passive:true,once:true});
  if(coarse&&!RM) hint.textContent='Tap to spin · 3D rendering';
  if('IntersectionObserver' in window) new IntersectionObserver(function(en){ near=en[0].isIntersecting; if(near&&want) start(); },{rootMargin:'200px'}).observe(stage); else near=true;
  window.addEventListener('load',function(){ setTimeout(function(){ var go=function(){ if(near) start(); else want=true; }; if(window.requestIdleCallback) requestIdleCallback(go,{timeout:3000}); else go(); },8000); });
}
})();
