/* The Snug Collection home page: hero stage (photo at rest, live 3D on request), waitlist, sharing, FAQ. */
(function(){
'use strict';
var $=function(id){ return document.getElementById(id); };
var SS=window.SS||{}, RM=SS.RM;
var NAMES={blush:'Blush Puff',holly:'Holly Bow',oat:'Oat Puff',kitty:'Cocoa Kitty',butter:'Butter Wave',pearl:'Pearl Bobbin',oak:'Oak & Oat',walnut:'Walnut & Cocoa',maple:'Maple & Sage'};
var FIN={cloud:'Cloud',aluminum:'Aluminum',graphite:'Graphite'};
/* the base finish each set is photographed with; the 3D matches it */
var SETFIN={blush:'cloud',holly:'aluminum',oat:'graphite'};
var FINMAT={cloud:{color:'#F3F1EE',m:0,r:0.32,cc:0.9,env:0.9},aluminum:{color:'#D3D4D7',m:0.95,r:0.28,cc:0,env:1.6},graphite:{color:'#2C2C30',m:0.8,r:0.4,cc:0,env:1.3}};
/* one price for every launch set; the set is the offer, single pieces are there for people who only want one */
var SETPRICE='<b>$49</b> the set, free shipping · cover or base alone $34', PRICE={blush:SETPRICE,holly:SETPRICE,oat:SETPRICE};

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

/* ---------- preselect votes from buttons, dots and links ---------- */
function check(name,v){ var r=document.querySelector('input[name='+name+'][value="'+v+'"]'); if(r) r.checked=true; return !!r; }
function pickLook(v){ if(v==='base'){ var b=$('i2'); if(b) b.checked=true; return; } check('look',v); }
function pickNext(v){ check('next_look',v); }
function pickFinish(v){ check('finish',v); }
document.querySelectorAll('[data-pick]').forEach(function(a){ a.addEventListener('click',function(){ pickLook(a.getAttribute('data-pick')); }); });
document.querySelectorAll('[data-next]').forEach(function(a){ a.addEventListener('click',function(){ pickNext(a.getAttribute('data-next')); }); });
var qs; try{ qs=new URL(location.href).searchParams; }catch(e){ qs=null; }
if(qs){ if(qs.get('look')) pickLook(qs.get('look')); if(qs.get('next')) pickNext(qs.get('next')); if(qs.get('finish')) pickFinish(qs.get('finish')); if(qs.get('want')==='base') pickLook('base'); }

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
  var payload=function(){ var fd=new FormData(form); return {email:String(fd.get('email')||'').trim(),interest:fd.getAll('interest'),look:fd.get('look')||'',next_look:fd.get('next_look')||'',finish:fd.get('finish')||'',room:fd.get('room')||'',hv_status:fd.get('hv_status')||'',hv_color:fd.get('hv_color')||'',price_ok:fd.get('price_ok')||'',note:String(fd.get('note')||'').slice(0,500),ref:ref,share_code:code,source:(SS.SRC||{}).source||'',landing:(SS.SRC||{}).landing||'',t:Math.round(performance.now()-SS.T0),website:fd.get('website')||''}; };
  var done=function(){
    var o=payload(), parts=[];
    if(NAMES[o.look]) parts.push('First drop: '+NAMES[o.look]);
    if(o.next_look&&NAMES[o.next_look]) parts.push('Next: '+NAMES[o.next_look]);
    if(o.finish&&FIN[o.finish]) parts.push('Base: '+FIN[o.finish]);
    $('okpick').textContent=parts.length?'Your votes. '+parts.join('. ')+'.':'';
    form.hidden=true; okBox.classList.add('on'); $('sharelink').textContent=shareURL();
    $('pinBtn').href='https://www.pinterest.com/pin/create/button/?url='+encodeURIComponent(shareURL())+'&media='+encodeURIComponent(location.origin+'/og.jpg')+'&description='+encodeURIComponent('Soft covers and a swivel base for the new Apple HomeView, from The Snug Collection');
    okBox.scrollIntoView({behavior:RM?'auto':'smooth',block:'center'}); okBox.focus({preventScroll:true});
    try{ localStorage.setItem('ss_joined','1'); }catch(e){}
  };
  form.addEventListener('submit',function(e){ e.preventDefault(); err.classList.remove('on');
    var o=payload(), bad=false;
    if(!SS.EMAIL.test(o.email)){ SS.setErr(email,$('email-err'),'Enter an email like you@example.com'); bad=true; } else SS.setErr(email,$('email-err'),'');
    if(bad){ email.focus(); return; }
    btn.disabled=true; btn.textContent='Joining…';
    SS.post(form.getAttribute('data-endpoint'),o,done,function(){ err.classList.add('on'); btn.disabled=false; btn.textContent='Join the waitlist'; });
  });
  $('copyBtn').addEventListener('click',function(){ var u=shareURL(), c=$('copied');
    var ok=function(){ c.textContent='Copied'; setTimeout(function(){ c.textContent=''; },2000); };
    var fallback=function(){ var r=document.createRange(); r.selectNodeContents($('sharelink')); var s=window.getSelection(); s.removeAllRanges(); s.addRange(r); try{ document.execCommand('copy'); ok(); }catch(e){ c.textContent='Select the link and copy it'; } };
    if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(u).then(ok,fallback); else fallback();
  });
  if(navigator.share){ $('shareBtn').addEventListener('click',function(){ navigator.share({title:'The Snug Collection',text:'Soft covers and a swivel base for the new Apple HomeView. Vote on the first drop:',url:shareURL()}).catch(function(){}); }); }
  else { $('shareBtn').hidden=true; }
}

/* ---------- hero stage: a photo of each look at rest; the live 3D model takes over when asked ---------- */
var stage=$('stage'), canvas=$('c'), hint=$('hint'), spinBtn=$('spinBtn'), picker=$('picker'), pname=$('pname'), prices=$('prices');
if(stage){
  var look='blush', show=null, started=false, live=false;
  var photos={}; stage.querySelectorAll('.ph').forEach(function(p){ photos[p.getAttribute('data-look')]=p; });
  var setLook=function(n,fromUser){ if(!NAMES[n]||!photos[n]) return; look=n;
    picker.querySelectorAll('.dot').forEach(function(d){ d.setAttribute('aria-pressed',String(d.getAttribute('data-look')===n)); });
    Object.keys(photos).forEach(function(k){ photos[k].classList.toggle('on',k===n); });
    pname.textContent=NAMES[n]; if(PRICE[n]) prices.innerHTML=PRICE[n];
    if(show) show(n,false);
  };
  picker.querySelectorAll('.dot').forEach(function(d){ d.addEventListener('click',function(){ setLook(d.getAttribute('data-look'),true); }); });
  if(qs&&qs.get('look')&&photos[qs.get('look')]) setLook(qs.get('look'),false);

  function loadScript(src,cb,fail){ var s=document.createElement('script'); s.src=src; s.async=false; s.onload=cb; s.onerror=fail; document.head.appendChild(s); }
  /* cheap capability hint only: creating a real context here would block the first paint (seconds on software GL); the renderer constructor is the real test */
  var canGL=!!(window.WebGLRenderingContext||window.WebGL2RenderingContext);
  var off=function(why){ if(window.console&&why) console.warn('3D stage off:',why); spinBtn.textContent='3D isn’t available in this browser'; spinBtn.disabled=true; setTimeout(function(){ spinBtn.hidden=true; },2600); };

  function initStage(){
    var THREE=window.THREE, SV=window.SnugViewer; if(!THREE||!SV) return off('viewer missing');
    var renderer;
    try{ renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true,alpha:true,powerPreference:'high-performance'}); }catch(e){ return off(e&&e.message); }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75)); renderer.setClearColor(0,0);
    renderer.outputEncoding=THREE.sRGBEncoding; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.0;
    renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    var scene=SV.makeScene(renderer), camera=new THREE.PerspectiveCamera(20,1,10,9000);
    scene.traverse(function(l){ if(l.isDirectionalLight&&l.shadow) l.shadow.mapSize.set(1024,1024); });
    var rad=THREE.MathUtils.degToRad;
    /* the same framing as the studio set photos, so the model lands where the photo's pieces are */
    var V={ty:70,tz:6,H:134,W:172,theta:0.32,phi:1.3};
    var orbit={theta:V.theta,phi:V.phi};
    var cache={}, cur=null, anim=null, dirty=true;
    var model=function(n){ if(!cache[n]){ var L=SV.LOOKS[n], inner=SV.kit(L,{sweaterX:72,sweaterZ:-70,baseX:-78,baseZ:54});
        var f=FINMAT[SETFIN[n]], bm=inner.userData.ringMat; if(f&&bm){ bm.color=SV.lin(f.color); bm.metalness=f.m; bm.roughness=f.r; bm.clearcoat=f.cc; bm.envMapIntensity=f.env; bm.needsUpdate=true; }
        var wrap=new THREE.Group(); wrap.add(inner); wrap.position.y=-V.ty; var g=new THREE.Group(); g.add(wrap); g.position.y=V.ty; cache[n]=g; } return cache[n]; };
    var easeOutBack=function(k){ var c1=1.5,c3=c1+1; return 1+c3*Math.pow(k-1,3)+c1*Math.pow(k-1,2); };
    var reset=function(o){ o.scale.setScalar(1); o.rotation.y=0; o.position.y=V.ty; };
    show=function(n,instant){ var next=model(n), prev=cur;
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
    var place=function(){ var t=Math.tan(rad(camera.fov/2)), r=Math.max(V.H/t,V.W/(camera.aspect*t))*1.1, s=Math.sin(orbit.phi);
      camera.position.set(r*s*Math.sin(orbit.theta),V.ty+r*Math.cos(orbit.phi),V.tz+r*s*Math.cos(orbit.theta)); camera.lookAt(0,V.ty,V.tz); };
    var resize=function(){ var w=Math.max(1,stage.clientWidth), h=Math.max(1,stage.clientHeight); renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); dirty=true; };
    if(window.ResizeObserver) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize',resize);
    resize();
    var drag=null, auto=!RM, autoUntil=performance.now()+9000, last=performance.now(), entrance=RM?null:{t0:performance.now()};
    var stopAuto=function(){ auto=false; hint.classList.add('gone'); };
    canvas.addEventListener('pointerdown',function(e){ drag={x:e.clientX,y:e.clientY,t:orbit.theta,p:orbit.phi,touch:e.pointerType==='touch'}; stopAuto(); try{ canvas.setPointerCapture(e.pointerId); }catch(_){} canvas.classList.add('dragging'); });
    canvas.addEventListener('pointermove',function(e){ if(!drag) return; orbit.theta=drag.t-(e.clientX-drag.x)*0.008; if(!drag.touch) orbit.phi=Math.min(1.5,Math.max(0.95,drag.p+(e.clientY-drag.y)*0.005)); dirty=true; });
    var up=function(){ drag=null; canvas.classList.remove('dragging'); };
    canvas.addEventListener('pointerup',up); canvas.addEventListener('pointercancel',up); canvas.addEventListener('lostpointercapture',up);
    canvas.addEventListener('dblclick',function(){ orbit.theta=V.theta; orbit.phi=V.phi; auto=!RM; autoUntil=performance.now()+9000; dirty=true; });
    canvas.addEventListener('keydown',function(e){ var k=e.key; if(k==='ArrowLeft'||k==='ArrowRight'){ e.preventDefault(); stopAuto(); orbit.theta+=(k==='ArrowLeft'?-1:1)*0.12; dirty=true; } else if(k==='ArrowUp'||k==='ArrowDown'){ e.preventDefault(); stopAuto(); orbit.phi=Math.min(1.5,Math.max(0.95,orbit.phi+(k==='ArrowUp'?-1:1)*0.06)); dirty=true; } });
    var visible=true; if('IntersectionObserver' in window) new IntersectionObserver(function(en){ visible=en[0].isIntersecting; },{threshold:0}).observe(stage);
    var lastY=window.scrollY; window.addEventListener('scroll',function(){ var y=window.scrollY, dy=y-lastY; lastY=y; if(!RM&&visible&&!drag&&Math.abs(dy)<300){ orbit.theta+=dy*0.0014; dirty=true; } },{passive:true});
    var frames=0, slow=0;
    var tick=function(now){ var dt=Math.min(0.05,(now-last)/1000); last=now;
      if(!document.hidden&&visible){
        if(auto&&now>autoUntil) auto=false;
        if(auto){ orbit.theta+=dt*0.22; dirty=true; }
        if(entrance){ var k=Math.min(1,(now-entrance.t0)/700); cur.scale.setScalar(0.9+0.1*easeOutBack(k)); if(k>=1){ reset(cur); entrance=null; } dirty=true; }
        if(anim){ step(now); dirty=true; }
        if(dirty){ var t1=performance.now(); place(); renderer.render(scene,camera); dirty=false; frames++; if(performance.now()-t1>45) slow++; if(frames===30&&slow>12){ auto=false; renderer.setPixelRatio(1); resize(); } }
      }
      requestAnimationFrame(tick);
    };
    show(look,true); place(); renderer.render(scene,camera); requestAnimationFrame(tick);
    live=true; canvas.hidden=false; canvas.tabIndex=0;
    requestAnimationFrame(function(){ stage.classList.add('live'); canvas.classList.add('on'); });
  }
  var start=function(){ if(started||!canGL) return; started=true;
    spinBtn.textContent='Loading 3D…'; spinBtn.setAttribute('aria-busy','true');
    loadScript('{{A:three.min.js}}',function(){ loadScript('{{A:viewer.js}}',function(){ try{ initStage(); }catch(e){ off(e&&e.message); } },function(){ off('viewer failed to load'); }); },function(){ off('three failed to load'); });
  };
  if(canGL){
    spinBtn.addEventListener('click',function(){ start(); if(live) canvas.focus({preventScroll:true}); });
    /* a touch or press on the picture itself also brings the model up */
    stage.addEventListener('pointerdown',function(e){ if(e.target.closest&&e.target.closest('a,button')) return; start(); },{passive:true});
  } else { spinBtn.hidden=true; }
  /* warm the scripts once the page is idle, so the first spin is quick; nothing runs until asked */
  if(canGL&&!RM){ window.addEventListener('load',function(){ setTimeout(function(){ var go=function(){ if(started) return; ['{{A:three.min.js}}','{{A:viewer.js}}'].forEach(function(u){ var l=document.createElement('link'); l.rel='prefetch'; l.as='script'; l.href=u; document.head.appendChild(l); }); }; if(window.requestIdleCallback) requestIdleCallback(go,{timeout:4000}); else go(); },4000); }); }
}
})();
