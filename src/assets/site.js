/* The Snug Collection shared behavior: header, reveals, contact form, form posting helper. */
(function(){
'use strict';
var $=function(id){ return document.getElementById(id); };
var RM=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var T0=performance.now();
var EMAIL=/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

function setErr(input,errEl,msg){
  if(msg){ input.setAttribute('aria-invalid','true'); errEl.textContent=msg; errEl.classList.add('on'); }
  else { input.removeAttribute('aria-invalid'); errEl.textContent=''; errEl.classList.remove('on'); }
}

/* POST JSON; if CORS or the network blocks it, fall back to a hidden form post */
function post(url,o,onOk,onFail){
  var ctrl=('AbortController' in window)?new AbortController():null;
  var t=setTimeout(function(){ if(ctrl) ctrl.abort(); },9000);
  fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(o),signal:ctrl?ctrl.signal:undefined,mode:'cors'})
    .then(function(r){ clearTimeout(t); if(r.ok) onOk(); else onFail(); }, function(){ clearTimeout(t);
      /* only a network or CORS failure falls back to a plain form post; a server that answered "no" is a real failure */
      try{
        var name='ssf'+Date.now(), ifr=document.createElement('iframe'); ifr.name=name; ifr.title='form'; ifr.hidden=true; document.body.appendChild(ifr);
        var f=document.createElement('form'); f.method='POST'; f.action=url; f.target=name; f.hidden=true;
        Object.keys(o).forEach(function(k){ var v=o[k]; (Array.isArray(v)?v:[v]).forEach(function(x){ var i=document.createElement('input'); i.type='hidden'; i.name=k; i.value=x; f.appendChild(i); }); });
        document.body.appendChild(f); f.submit(); setTimeout(onOk,900);
      }catch(e){ onFail(); }
    });
}
window.SS={post:post,setErr:setErr,EMAIL:EMAIL,RM:RM,T0:T0};

/* header shadow once the page scrolls */
var hdr=$('hdr');
if(hdr){ var onScroll=function(){ hdr.classList.toggle('scrolled',window.scrollY>8); }; window.addEventListener('scroll',onScroll,{passive:true}); onScroll(); }

/* mark the current page in the nav */
document.querySelectorAll('.links a').forEach(function(a){ if(a.getAttribute('href')===location.pathname) a.setAttribute('aria-current','page'); });

/* contact form */
var cbtn=$('contactBtn'), cform=$('contact');
if(cbtn&&cform){
  cbtn.addEventListener('click',function(){ var on=cform.classList.toggle('on'); cbtn.setAttribute('aria-expanded',String(on)); if(on) $('cemail').focus(); });
  cform.addEventListener('submit',function(e){ e.preventDefault();
    var em=$('cemail'), ms=$('cmsg'), st=$('cstatus'), bad=false;
    if(!EMAIL.test(em.value.trim())){ setErr(em,$('cemail-err'),'Enter an email so we can reply.'); bad=true; } else setErr(em,$('cemail-err'),'');
    if(ms.value.trim().length<2){ setErr(ms,$('cmsg-err'),'Write a message first.'); bad=true; } else setErr(ms,$('cmsg-err'),'');
    if(bad){ (cform.querySelector('[aria-invalid="true"]')||em).focus(); return; }
    var sb=$('csubmit'); sb.disabled=true; st.textContent='Sending…';
    var o={email:em.value.trim(),message:ms.value.trim().slice(0,4000),topic:'site',page:location.pathname,t:Math.round(performance.now()-T0),website:(new FormData(cform)).get('website')||''};
    post(cform.getAttribute('data-endpoint'),o,function(){ st.textContent='Sent. We read every message.'; em.value=''; ms.value=''; sb.disabled=false; },function(){ st.textContent='That didn’t send. Try again in a minute.'; sb.disabled=false; });
  });
}
})();
