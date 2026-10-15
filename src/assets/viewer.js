/* The Snug Collection product viewer: accessories only, no device drawn. Units mm. Works in the site and in the render harness. */
(function(global){
'use strict';
var T=THREE, rad=T.MathUtils.degToRad;
function lin(c){ return new T.Color(c).convertSRGBToLinear(); }
function pmat(color,o){ o=o||{}; var p={color:lin(color),roughness:o.r!=null?o.r:0.5,metalness:o.m||0,clearcoat:o.cc||0,clearcoatRoughness:o.ccr!=null?o.ccr:0.2,envMapIntensity:o.env!=null?o.env:0.8};
  if(o.map) p.map=o.map; if(o.bump){ p.bumpMap=o.bump; p.bumpScale=o.bs||0.6; } if(o.sheen) p.sheen=lin(o.sheen); if(o.side) p.side=o.side; return new T.MeshPhysicalMaterial(p); }
function sh(o){ o.traverse(function(c){ if(c.isMesh){ c.castShadow=true; c.receiveShadow=true; } }); return o; }
var S=512, texCache={};
function mk(key,draw,rep){ if(texCache[key]) { var t0=texCache[key].clone(); t0.needsUpdate=true; if(rep) t0.repeat.set(rep[0],rep[1]); return t0; }
  var cv=document.createElement('canvas'); cv.width=cv.height=S; var g=cv.getContext('2d'); draw(g); var t=new T.CanvasTexture(cv); t.wrapS=t.wrapT=T.RepeatWrapping; t.anisotropy=8; texCache[key]=t; var t1=t.clone(); t1.needsUpdate=true; if(rep) t1.repeat.set(rep[0],rep[1]); return t1; }
function rnd(seed){ var s=seed; return function(){ s=(s*9301+49297)%233280; return s/233280; }; }
var TEX={
  soft:function(rep){ return mk('soft',function(g){ g.fillStyle='#808080'; g.fillRect(0,0,S,S); var r=rnd(3); for(var i=0;i<14000;i++){ var v=110+r()*40|0; g.fillStyle='rgb('+v+','+v+','+v+')'; g.fillRect(r()*S,r()*S,1.5,1.5); } },rep); },
  rib:function(rep){ return mk('rib',function(g){ for(var x=0;x<S;x++){ var p=(x%32)/32, v=Math.round(128+110*Math.cos(p*Math.PI*2)); g.fillStyle='rgb('+v+','+v+','+v+')'; g.fillRect(x,0,1,S); }
    g.strokeStyle='rgba(40,40,40,0.35)'; g.lineWidth=2; for(var cx=16;cx<S;cx+=32) for(var y=0;y<S;y+=16){ g.beginPath(); g.moveTo(cx-9,y); g.lineTo(cx,y+9); g.lineTo(cx+9,y); g.stroke(); } },rep); },
  boucle:function(rep){ return mk('boucle',function(g){ g.fillStyle='#707070'; g.fillRect(0,0,S,S); var r=rnd(17); for(var i=0;i<2600;i++){ var x=r()*S,y=r()*S,rr=3+r()*6, v=150+r()*100|0; g.strokeStyle='rgb('+v+','+v+','+v+')'; g.lineWidth=1.6+r()*1.6; g.beginPath(); g.arc(x,y,rr,0,Math.PI*2*(0.6+r()*0.4)); g.stroke(); } },rep); },
  eyeletColor:function(base,hole,rep){ return mk('eyeC'+base+hole,function(g){ g.fillStyle=base; g.fillRect(0,0,S,S); var p=64;
    for(var j=0;j<S/p+1;j++) for(var i=0;i<S/p+1;i++){ var x=i*p+(j%2?p/2:0), y=j*p; g.fillStyle=hole; g.beginPath(); g.ellipse(x,y,7,9,0,0,Math.PI*2); g.fill();
      for(var k=0;k<6;k++){ var a=k*Math.PI/3; g.beginPath(); g.ellipse(x+Math.cos(a)*19,y+Math.sin(a)*19,4,2.4,a,0,Math.PI*2); g.fill(); } } },rep); },
  eyeletBump:function(rep){ return mk('eyeB',function(g){ g.fillStyle='#808080'; g.fillRect(0,0,S,S); var p=64;
    for(var j=0;j<S/p+1;j++) for(var i=0;i<S/p+1;i++){ var x=i*p+(j%2?p/2:0), y=j*p;
      g.strokeStyle='#f0f0f0'; g.lineWidth=4; g.beginPath(); g.ellipse(x,y,10,12,0,0,Math.PI*2); g.stroke();
      g.fillStyle='#202020'; g.beginPath(); g.ellipse(x,y,7,9,0,0,Math.PI*2); g.fill();
      for(var k=0;k<6;k++){ var a=k*Math.PI/3; g.strokeStyle='#e0e0e0'; g.lineWidth=2.5; g.beginPath(); g.ellipse(x+Math.cos(a)*19,y+Math.sin(a)*19,6,4,a,0,Math.PI*2); g.stroke(); } } },rep); },
  quilt:function(rep){ return mk('quilt',function(g){ var img=g.createImageData(S,S), d=img.data, p=64; for(var y=0;y<S;y++) for(var x=0;x<S;x++){ var u=((x+y)%p)/p, w=((x-y+S*4)%p)/p; var a=Math.min(u,1-u), b=Math.min(w,1-w); var m=Math.min(a,b)*2; var v=Math.round(255*Math.pow(Math.sin(Math.min(1,m*1.6)*Math.PI/2),0.6)); var i=(y*S+x)*4; d[i]=d[i+1]=d[i+2]=v; d[i+3]=255; } g.putImageData(img,0,0); },rep); }
};
/* outline of the display frame. HomeView's display is 145.9 x 145.5 mm, corner R27.1, 9.8 thick (measured from Apple's AR model);
   the puff's centerline runs 1.4 mm outside its edge. Matches the v5 mold files. */
function rrSample(a,rc,N){ var e=a-rc, pts=[], Ls=2*e, La=Math.PI/2*rc, L=4*(Ls+La);
  for(var i=0;i<N;i++){ var s=(i/N)*L, t=s, r, th;
    function edge(x0,y0,x1,y1,nx,ny,len){ var f=t/len; return {p:[x0+(x1-x0)*f,y0+(y1-y0)*f],n:[nx,ny]}; }
    if(t<e){ r=edge(0,a,e,a,0,1,e); }
    else if((t-=e)<La){ th=Math.PI/2-t/rc; r={p:[e+rc*Math.cos(th),e+rc*Math.sin(th)],n:[Math.cos(th),Math.sin(th)]}; }
    else if((t-=La)<Ls){ r=edge(a,e,a,-e,1,0,Ls); }
    else if((t-=Ls)<La){ th=-t/rc; r={p:[e+rc*Math.cos(th),-e+rc*Math.sin(th)],n:[Math.cos(th),Math.sin(th)]}; }
    else if((t-=La)<Ls){ r=edge(e,-a,-e,-a,0,-1,Ls); }
    else if((t-=Ls)<La){ th=-Math.PI/2-t/rc; r={p:[-e+rc*Math.cos(th),-e+rc*Math.sin(th)],n:[Math.cos(th),Math.sin(th)]}; }
    else if((t-=La)<Ls){ r=edge(-a,-e,-a,e,-1,0,Ls); }
    else if((t-=Ls)<La){ th=Math.PI-t/rc; r={p:[-e+rc*Math.cos(th),e+rc*Math.sin(th)],n:[Math.cos(th),Math.sin(th)]}; }
    else { t-=La; r=edge(-e,a,0,a,0,1,e); }
    r.s=s/L; pts.push(r); }
  return {pts:pts,L:L}; }
function outline(kind){ var N=720, base=rrSample(74.35,28.5,N), L=base.L, out=[];
  if(kind==='oval'){ for(var i=0;i<N;i++){ var t=Math.PI/2-i/N*Math.PI*2, n=2.25, c=Math.cos(t), s=Math.sin(t); out.push([86*Math.sign(c)*Math.pow(Math.abs(c),2/n), 3+93*Math.sign(s)*Math.pow(Math.abs(s),2/n)]); } return out; }
  base.pts.forEach(function(q){ var d=0,k; if(kind==='wave'){ k=Math.round(L/30); d=3.4*Math.cos(2*Math.PI*k*q.s)+2.6; } else if(kind==='scallop'){ k=Math.round(L/24); d=5.2*Math.abs(Math.cos(Math.PI*k*q.s))-0.8; } else if(kind==='cloud'){ k=Math.round(L/50); d=10*Math.pow(Math.abs(Math.cos(Math.PI*k*q.s)),0.55)-1; }
    out.push([q.p[0]+q.n[0]*d,q.p[1]+q.n[1]*d]); });
  return out; }
/* front opening; 'bay' opens the top center so nothing sits in front of the camera (4.9 mm below the top edge) */
function holePath(h,top,bay){ top=top||0; return rrSample(h,16,400).pts.map(function(q){ var x=q.p[0], y=q.p[1]; if(y>0&&top){ var f=bay?Math.max(0,Math.min(1,(bay+8-Math.abs(x))/8)):1; y+=top*f*Math.min(1,(y/(h-16))); } return [x,y]; }); }
function rrNotch(w,h,r,bw,bh){ var p=new T.Path(), x=-w/2, y=-h/2, t=h/2, c=2; p.moveTo(x+r,y); p.lineTo(x+w-r,y); p.quadraticCurveTo(x+w,y,x+w,y+r); p.lineTo(x+w,t-r); p.quadraticCurveTo(x+w,t,x+w-r,t);
  p.lineTo(bw/2+c,t); p.quadraticCurveTo(bw/2,t,bw/2,t+c); p.lineTo(bw/2,t+bh-c); p.quadraticCurveTo(bw/2,t+bh,bw/2-c,t+bh); p.lineTo(-bw/2+c,t+bh); p.quadraticCurveTo(-bw/2,t+bh,-bw/2,t+bh-c); p.lineTo(-bw/2,t+c); p.quadraticCurveTo(-bw/2,t,-bw/2-c,t);
  p.lineTo(x+r,t); p.quadraticCurveTo(x,t,x,t-r); p.lineTo(x,y+r); p.quadraticCurveTo(x,y,x+r,y); return p; }
function toShape(outer,hole){ var s=new T.Shape(); s.moveTo(outer[0][0],outer[0][1]); for(var i=1;i<outer.length;i++) s.lineTo(outer[i][0],outer[i][1]); s.closePath();
  if(hole){ var h=new T.Path(); h.moveTo(hole[0][0],hole[0][1]); for(i=1;i<hole.length;i++) h.lineTo(hole[i][0],hole[i][1]); h.closePath(); s.holes.push(h); } return s; }
function tubeAlong(pts,z,r,mat,segMul){ var v=pts.map(function(p){ return new T.Vector3(p[0],p[1],z); }); var c=new T.CatmullRomCurve3(v,true,'centripetal'); return new T.Mesh(new T.TubeGeometry(c,Math.round(pts.length*(segMul||1)),r,24,true),mat); }
function normals2(pts){ var n=pts.length, res=[]; for(var i=0;i<n;i++){ var a=pts[(i-1+n)%n], b=pts[(i+1)%n]; var tx=b[0]-a[0], ty=b[1]-a[1], l=Math.hypot(tx,ty)||1; res.push([-ty/l,tx/l]); } return res; }
var TR=9;
function ruffle(out,mat){ var n=out.length, nm=normals2(out), M=12, W=12, flutes=26, pos=[], idx=[];
  for(var i=0;i<=n;i++){ var k=i%n, ph=Math.sin(i/n*Math.PI*2*flutes); for(var j=0;j<=M;j++){ var f=j/M, off=TR-2.5+W*f; var amp=4.2*Math.pow(f,1.3); pos.push(out[k][0]+nm[k][0]*off, out[k][1]+nm[k][1]*off, ph*amp-2.5*f*f); } }
  for(i=0;i<n;i++) for(j=0;j<M;j++){ var a=i*(M+1)+j, b=(i+1)*(M+1)+j; idx.push(a,b,a+1, b,b+1,a+1); }
  var g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals(); var m=mat.clone(); m.side=T.DoubleSide; return new T.Mesh(g,m); }
function bobbins(G,out,mat){ var nm=normals2(out), n=out.length, acc=0, step=9.2, last=null; for(var i=0;i<n;i++){ if(last) acc+=Math.hypot(out[i][0]-last[0],out[i][1]-last[1]); last=out[i]; if(acc>=step||i===0){ acc=0; var b=new T.Mesh(new T.SphereGeometry(4.3,18,12),mat); b.position.set(out[i][0]+nm[i][0]*(TR+2.2),out[i][1]+nm[i][1]*(TR+2.2),0); G.add(b); } } }
function cornerPoint(out,sx,sy){ var best=null,bv=-1e9; out.forEach(function(p){ var v=sx*p[0]+sy*p[1]; if(v>bv){ bv=v; best=p; } }); var l=Math.hypot(best[0],best[1]); return [best[0]+best[0]/l*(TR+1.5), best[1]+best[1]/l*(TR+1.5)]; }
/* wood: grain textures are baked image files, loaded on first use; the page redraws when they arrive */
var WOODTEX={oak:['{{A:img/wood-oak-map.webp}}','{{A:img/wood-oak-bump.webp}}'],walnut:['{{A:img/wood-walnut-map.webp}}','{{A:img/wood-walnut-bump.webp}}'],maple:['{{A:img/wood-maple-map.webp}}','{{A:img/wood-maple-bump.webp}}']};
var WOODTINT={oak:'#B98E5E',walnut:'#5A3A26',maple:'#DCC197'}, WT={}, woodWait={};
function woodTex(key,cb){ if(WT[key]){ cb(WT[key]); return; } var q=woodWait[key]=woodWait[key]||[]; q.push(cb); if(q.length>1) return;
  var got={}, n=0, ld=new T.TextureLoader(), done=function(){ if(++n<2) return; WT[key]=got; q.forEach(function(f){ f(got); }); woodWait[key]=[]; var sv=global.SnugViewer; if(sv&&sv.onChange) sv.onChange(); };
  ld.load(WOODTEX[key][0],function(t){ t.encoding=T.sRGBEncoding; t.wrapS=t.wrapT=T.RepeatWrapping; t.anisotropy=8; got.map=t; done(); });
  ld.load(WOODTEX[key][1],function(t){ t.wrapS=t.wrapT=T.RepeatWrapping; got.bump=t; done(); }); }
function woodMat(key,o){ o=o||{}; var m=new T.MeshPhysicalMaterial({color:lin(WOODTINT[key]),roughness:0.55,clearcoat:0.1,clearcoatRoughness:0.45,envMapIntensity:0.42});
  woodTex(key,function(t){ var map=t.map.clone(), bump=t.bump.clone(); map.needsUpdate=bump.needsUpdate=true; map.repeat.set(o.rx||1/260,o.ry||1/140); bump.repeat.copy(map.repeat);
    if(o.off){ map.offset.set(o.off[0],o.off[1]); bump.offset.copy(map.offset); } m.map=map; m.bumpMap=bump; m.bumpScale=0.25; m.color.set(0xffffff); m.needsUpdate=true; });
  return m; }
function rrShape(w,h,r,path){ var s=path?new T.Path():new T.Shape(), x=-w/2, y=-h/2; s.moveTo(x+r,y); s.lineTo(x+w-r,y); s.quadraticCurveTo(x+w,y,x+w,y+r); s.lineTo(x+w,y+h-r); s.quadraticCurveTo(x+w,y+h,x+w-r,y+h); s.lineTo(x+r,y+h); s.quadraticCurveTo(x,y+h,x,y+h-r); s.lineTo(x,y+r); s.quadraticCurveTo(x,y,x+r,y); return s; }
function buildWoodFrame(L){ var G=new T.Group();
  var bs=rrShape(166.6,166.6,32.7); bs.holes.push(rrNotch(131,131,16,40,6));
  var base=new T.Mesh(new T.ExtrudeGeometry(bs,{depth:8,bevelEnabled:true,bevelThickness:2.5,bevelSize:2.5,bevelSegments:6,curveSegments:24}),pmat(L.color,{r:0.72,env:0.55})); base.position.z=-6.5; G.add(base);
  var ws=rrShape(161.7,161.7,29.8); ws.holes.push(rrNotch(135.9,135.9,17.9,40,3.6));
  var ring=new T.Mesh(new T.ExtrudeGeometry(ws,{depth:2.2,bevelEnabled:true,bevelThickness:0.5,bevelSize:0.5,bevelSegments:2,curveSegments:24}),[woodMat(L.wood,{off:[0.31,0.2]}),woodMat(L.wood,{rx:1/60,ry:1/20})]);
  ring.position.z=3.1; G.add(ring); return sh(G); }
function buildFrame(L,opts){ opts=opts||{}; if(L.wood) return buildWoodFrame(L);
  var G=new T.Group(), fm=pmat(L.color,{r:0.72,env:0.55,bump:TEX.soft([3,3]),bs:0.2});
  var kind=L.shape, out=outline(kind==='ruffle'||kind==='bobbin'?'puff':kind), hole=holePath(66.5,6,20), holeB=holePath(66.5,0);
  var pm=fm.clone(); pm.side=T.DoubleSide;
  var front=new T.Mesh(new T.ShapeGeometry(toShape(out,hole),1),pm); front.position.z=TR; G.add(front);
  var back=new T.Mesh(new T.ShapeGeometry(toShape(out,holeB),1),pm); back.position.z=-TR; G.add(back);
  var bs=new T.Shape(); (function(){ var w=134.8,h=134.4,r=25,x=-w/2,y=-h/2; bs.moveTo(x+r,y); bs.lineTo(x+w-r,y); bs.quadraticCurveTo(x+w,y,x+w,y+r); bs.lineTo(x+w,y+h-r); bs.quadraticCurveTo(x+w,y+h,x+w-r,y+h); bs.lineTo(x+r,y+h); bs.quadraticCurveTo(x,y+h,x,y+h-r); bs.lineTo(x,y+r); bs.quadraticCurveTo(x,y,x+r,y); })();
  /* closed back is not used: the hinge arm (30 mm below center, 20 wide) would block it from sliding on */ var hh=new T.Path(); hh.absarc(0,-30,12,0,Math.PI*2,true); bs.holes.push(hh);
  if(!opts.openBack){ var bp=new T.Mesh(new T.ShapeGeometry(bs,16),pm); bp.position.z=-6.2; G.add(bp); }
  G.add(tubeAlong(out,0,TR,fm,1.0)); G.add(tubeAlong(hole,TR-2.4,2.4,fm,0.8));
  var trim=L.trim==='pearl'?pmat('#f4efe8',{r:0.2,cc:1,ccr:0.08,env:1.3}):fm;
  if(kind==='ruffle') G.add(ruffle(out,trim)); if(kind==='bobbin') bobbins(G,out,trim);
  if(L.topper==='ears'){ var inner=pmat(L.inner||'#E3B9B3',{r:0.7}); [-1,1].forEach(function(sx){ var e=new T.Group(); e.add(new T.Mesh(ext(earShape(30,30),5,3.2),fm)); var i=new T.Mesh(ext(earShape(17,19),2,1.2),inner); i.position.set(0,4,4.2); e.add(i); e.position.set(sx*47,TR+71,0); e.rotation.z=-sx*0.22; G.add(e); }); }
  if(L.topper==='bow'){ var b=bow(pmat(L.bowColor,{r:0.38,cc:0.35})); b.scale.setScalar(1.7); b.position.set(-50,72+TR+4,6); b.rotation.z=0.12; G.add(b); }
  if(L.charms&&L.charms.length){ var cp=cornerPoint(out,1,-1); var lp=new T.Mesh(new T.TorusGeometry(2.6,0.9,8,18),fm); lp.position.set(cp[0],cp[1],0); lp.rotation.y=Math.PI/2; G.add(lp);
    var cm=pmat('#d3b06a',{r:0.35,m:0.6}); L.charms.forEach(function(it){ var g=new T.Group(); g.position.set(cp[0]+(it.dx||0),cp[1]-2.6,(it.dz||0)); var c=new T.Mesh(new T.CylinderGeometry(0.45,0.45,it.drop,8),cm); c.position.y=-it.drop/2; g.add(c); var pc=CH[it.k].apply(null,it.a||[]); pc.position.y=-it.drop; pc.rotation.y=0.4; g.add(pc); G.add(g); }); }
  G.userData.out=out; return sh(G); }
function ext(shape,depth,bev){ var g=new T.ExtrudeGeometry(shape,{depth:depth,bevelEnabled:true,bevelThickness:bev,bevelSize:bev*0.9,bevelSegments:4,curveSegments:20}); g.translate(0,0,-depth/2); g.computeVertexNormals(); return g; }
function earShape(w,h){ var s=new T.Shape(); s.moveTo(-w/2,0); s.quadraticCurveTo(-w*0.42,h*0.62,-w*0.08,h*0.98); s.quadraticCurveTo(0,h*1.04,w*0.08,h*0.98); s.quadraticCurveTo(w*0.42,h*0.62,w/2,0); s.closePath(); return s; }
function lobe(sx){ var s=new T.Shape(); s.moveTo(0,0); s.bezierCurveTo(sx*-3,7,sx*-13,12.5,sx*-15.5,6); s.bezierCurveTo(sx*-17.5,0,sx*-14,-7,sx*-8,-6.2); s.bezierCurveTo(sx*-4,-5.5,sx*-2,-2,0,0); return s; }
function tail(sx){ var s=new T.Shape(); s.moveTo(sx*-1.5,-1); s.lineTo(sx*-9.5,-17); s.lineTo(sx*-6.4,-15); s.lineTo(sx*-4.2,-18.4); s.lineTo(sx*2,-2.5); s.closePath(); return s; }
function bow(mat){ var g=new T.Group(); [-1,1].forEach(function(sx){ g.add(new T.Mesh(ext(lobe(sx),3.4,1.8),mat)); var t=new T.Mesh(ext(tail(sx),2,1.1),mat); t.position.z=-1; g.add(t); }); var k=new T.Mesh(new T.SphereGeometry(4,20,14),mat); k.scale.set(1,1.2,0.8); k.position.z=1.6; g.add(k); return sh(g); }
function heartShape(){ var s=new T.Shape(); s.moveTo(0,-8); s.bezierCurveTo(-2,-6,-10,-1,-10,4); s.bezierCurveTo(-10,9.5,-3.5,10.5,0,6); s.bezierCurveTo(3.5,10.5,10,9.5,10,4); s.bezierCurveTo(10,-1,2,-6,0,-8); return s; }
function starShape(ro,ri){ var s=new T.Shape(); for(var i=0;i<10;i++){ var a=Math.PI/2+i*Math.PI/5, r=i%2?ri:ro; if(i===0) s.moveTo(Math.cos(a)*r,Math.sin(a)*r); else s.lineTo(Math.cos(a)*r,Math.sin(a)*r); } s.closePath(); return s; }
var PEARL=function(){ return pmat('#f4efe8',{r:0.2,cc:1,ccr:0.08,env:1.3}); };
var CH={
  pearls:function(n){ var g=new T.Group(), m=PEARL(); for(var i=0;i<n;i++){ var p=new T.Mesh(new T.SphereGeometry(i===n-1?4.2:3,18,12),m); p.position.y=-3-i*6.2-(i===n-1?1.2:0); g.add(p); } return sh(g); },
  heart:function(color){ var g=new T.Group(); var m=color?pmat(color,{r:0.3,cc:0.7,env:1.1}):PEARL(); var h=new T.Mesh(ext(heartShape(),3,1.5),m); h.scale.setScalar(0.85); h.position.y=-7.6; g.add(h); return sh(g); },
  star:function(color){ var g=new T.Group(); var s=new T.Mesh(ext(starShape(9,4.2),2.6,1.3),color?pmat(color,{r:0.35,cc:0.5}):pmat('#d3b06a',{r:0.32,m:0.75,env:1.1})); s.position.y=-9; g.add(s); return sh(g); },
  flower:function(petal,center){ var g=new T.Group(), pm=pmat(petal,{r:0.35,cc:0.6,env:1}), cm=pmat(center,{r:0.35,cc:0.5});
    for(var k=0;k<5;k++){ var a=k*Math.PI*2/5+Math.PI/2; var p=new T.Mesh(new T.SphereGeometry(4.2,18,12),pm); p.scale.set(1,1,0.55); p.position.set(Math.cos(a)*5,-11+Math.sin(a)*5,0); g.add(p); }
    var c=new T.Mesh(new T.SphereGeometry(2.8,16,12),cm); c.position.set(0,-11,1.6); g.add(c); return sh(g); },
  ornament:function(){ var g=new T.Group(); var b=new T.Mesh(new T.SphereGeometry(8,24,16),pmat('#f3e9ee',{r:0.15,cc:1,ccr:0.05,env:1.4})); b.position.y=-12; g.add(b); var c=new T.Mesh(new T.CylinderGeometry(2.6,2.6,3,16),pmat('#d3b06a',{r:0.32,m:0.75,env:1.1})); c.position.y=-3.5; g.add(c); return sh(g); }
};
function buildSweater(L){
  /* the sweater is cast silicone like the frame: a sleeve for the body with a domed cap and a rolled lip */
  var R=42.1, th=1.8, h=25, capH=38.2, G=new T.Group(), col=L.sleeveColor||L.color;
  var mat=pmat(col,{r:0.72,env:0.55,bump:TEX.soft([3,3]),bs:0.2});
  var cyl=new T.Mesh(new T.CylinderGeometry(R+th,R+th,h,72,1,true),mat); cyl.position.y=h/2; cyl.material.side=T.DoubleSide; G.add(cyl);
  var dome=new T.Mesh(new T.SphereGeometry(R+th,72,28,0,Math.PI*2,0,Math.PI/2),mat); dome.position.y=h; dome.scale.y=(capH+th)/(R+th); G.add(dome);
  var cuff=new T.Mesh(new T.TorusGeometry(R+th+0.4,2.6,12,96),mat); cuff.rotation.x=Math.PI/2; cuff.position.y=2.4; G.add(cuff);
  return sh(G); }
function buildBase(L){
  var col=L.baseColor, mat=pmat(col,{r:0.3,cc:0.9,ccr:0.25,env:0.9}), G=new T.Group();
  var plate=new T.Mesh(new T.CylinderGeometry(48,48,1.6,96),mat); plate.position.y=0.8; G.add(plate);
  var wall=new T.Mesh(new T.CylinderGeometry(49.2,49.6,11.2,96,1,false),mat); wall.position.y=5.8; G.add(wall);
  var lip=new T.Mesh(new T.TorusGeometry(48.2,1.6,12,96),mat); lip.rotation.x=Math.PI/2; lip.position.y=11.4; G.add(lip);
  var top=new T.Mesh(new T.RingGeometry(28,48.4,96),mat); top.rotation.x=-Math.PI/2; top.position.y=12.95; G.add(top);
  var cup=new T.Mesh(new T.CylinderGeometry(28,28,1.5,64),pmat('#d8d4cc',{r:0.85,env:0.3})); cup.position.y=12.2; G.add(cup);
  var seam=new T.Mesh(new T.TorusGeometry(49.4,0.35,8,96),pmat('#ffffff',{r:0.4})); seam.rotation.x=Math.PI/2; seam.position.y=1.9; G.add(seam);
  G.userData.mat=mat; return sh(G); }
var LOOKS={
  blush:{sku:'SS-CV-BLUSH-01',name:'Blush Puff',shape:'puff',color:'#D9A3A6',sleeve:'smooth',baseColor:'#C9CBD0',charms:[{k:'pearls',a:[5],drop:3,dx:1.2,dz:-3.4},{k:'heart',a:[null],drop:10,dx:7,dz:3.4}]},
  holly:{sku:'SS-CV-HOLLY-01',name:'Holly Bow',shape:'puff',color:'#9B2F3A',sleeve:'rib',sleeveColor:'#F1EADC',baseColor:'#C9CBD0',topper:'bow',bowColor:'#F1EADC',charms:[{k:'ornament',drop:3,dx:1.2,dz:-3.4},{k:'star',drop:14,dx:7,dz:3.4}]},
  oat:{sku:'SS-CV-OAT-01',name:'Oat Puff',shape:'puff',color:'#E3D6C3',sleeve:'boucle',sleeveColor:'#EAE1D2',baseColor:'#C9CBD0',charms:[]},
  kitty:{sku:'SS-CV-KITTY-02',name:'Cocoa Kitty',shape:'cloud',color:'#8B6753',sleeve:'boucle',baseColor:'#C9CBD0',topper:'ears',inner:'#E3B9B3',charms:[{k:'heart',a:['#E3B9B3'],drop:3,dx:1.2,dz:-3.4}]},
  butter:{sku:'SS-CV-BUTTER-02',name:'Butter Wave',shape:'wave',color:'#EED27C',sleeve:'rib',baseColor:'#C9CBD0',charms:[{k:'flower',a:['#fffaf0','#e7b84a'],drop:3,dx:1.2,dz:-3.4},{k:'pearls',a:[3],drop:12,dx:7,dz:3.4}]},
  pearl:{sku:'SS-CV-PEARL-02',name:'Pearl Bobbin',shape:'bobbin',color:'#F2E9DB',sleeve:'eyelet',holeColor:'#cdbfa8',baseColor:'#C9CBD0',trim:'pearl',charms:[]},
  /* wood looks: a 3 mm real-wood face set into a silicone frame; sweater stays silicone; the base gets wood sides and top */
  oak:{sku:'SS-WD-OAK-03',name:'Oak & Oat',shape:'puff',wood:'oak',color:'#E6DCCB',sleeve:'smooth',sleeveColor:'#E6DCCB',baseColor:'#C9CBD0',charms:[]},
  walnut:{sku:'SS-WD-WALNUT-03',name:'Walnut & Cocoa',shape:'puff',wood:'walnut',color:'#6B5547',sleeve:'smooth',sleeveColor:'#6B5547',baseColor:'#C9CBD0',charms:[]},
  maple:{sku:'SS-WD-MAPLE-03',name:'Maple & Sage',shape:'puff',wood:'maple',color:'#93A085',sleeve:'smooth',sleeveColor:'#93A085',baseColor:'#C9CBD0',charms:[]}
};
/* scene helpers */
function makeScene(renderer){
  var scene=new T.Scene();
  scene.add(new T.HemisphereLight(0xfff6ec,0x9a8f86,0.46));
  var key=new T.DirectionalLight(0xfff1e0,1.05); key.position.set(520,640,380); key.castShadow=true; key.shadow.mapSize.set(2048,2048);
  key.shadow.camera.left=-500; key.shadow.camera.right=500; key.shadow.camera.top=500; key.shadow.camera.bottom=-500; key.shadow.camera.near=50; key.shadow.camera.far=2600; key.shadow.bias=-0.0004; key.shadow.normalBias=0.4; key.shadow.radius=6; scene.add(key);
  var fill=new T.DirectionalLight(0xf2f4ff,0.34); fill.position.set(-420,260,260); scene.add(fill);
  var rim=new T.DirectionalLight(0xffffff,0.32); rim.position.set(80,300,-480); scene.add(rim);
  try{ var pm=new T.PMREMGenerator(renderer), es=new T.Scene(); es.add(new T.Mesh(new T.BoxGeometry(20,20,20),new T.MeshBasicMaterial({color:0x48433e,side:T.BackSide})));
    var envPanel=function(w,h,x,y,z,rx,ry,b){ var m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:new T.Color(b,b*0.97,b*0.93)})); m.position.set(x,y,z); m.rotation.set(rx,ry,0); es.add(m); };
    envPanel(8,3,0,9.9,0,Math.PI/2,0,2.4); envPanel(6,6,9.9,3,0,0,-Math.PI/2,2.0); envPanel(6,6,-9.9,3,0,0,Math.PI/2,0.8); envPanel(10,4,0,3,9.9,0,Math.PI,1.0); envPanel(10,4,0,3,-9.9,0,0,0.8);
    scene.environment=pm.fromScene(es,0.04).texture; pm.dispose(); }catch(e){}
  var floor=new T.Mesh(new T.PlaneGeometry(9000,9000),new T.ShadowMaterial({opacity:0.16})); floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
  return scene; }
/* a "kit" arrangement: frame standing (tilted like on the device), sweater behind-left, base front-right */
function kit(L,opts){ opts=opts||{}; var G=new T.Group();
  var F=buildFrame(L,{openBack:true}); var tilt=opts.tilt!=null?opts.tilt:12; F.rotation.x=-rad(tilt); F.position.set(0,84+ (L.topper==='ears'?0:0),0); F.position.y=84*Math.cos(rad(tilt))+TR*Math.sin(rad(tilt))+0.5; G.add(F);
  if(opts.sweater!==false){ var W=buildSweater(L); W.position.set(opts.sweaterX!=null?opts.sweaterX:92,0,opts.sweaterZ!=null?opts.sweaterZ:-52); G.add(W); }
  if(opts.base!==false){ var B=buildBase(opts.ring?Object.assign({},L,{baseColor:opts.ring}):L); B.position.set(opts.baseX!=null?opts.baseX:-96,0,opts.baseZ!=null?opts.baseZ:70); G.add(B); G.userData.ringMat=B.userData.mat;
    if(L.wood){ var bm=B.userData.mat, side=woodMat(L.wood,{rx:1.6,ry:0.07,off:[0.1,0.3]}), top=woodMat(L.wood,{rx:0.42,ry:0.42,off:[0.3,0.2]});
      B.traverse(function(o){ if(o.isMesh&&o.material===bm){ var gt=o.geometry.type; o.material=(gt==='RingGeometry'||gt==='TorusGeometry'||(gt==='CylinderGeometry'&&o.geometry.parameters.height<2))?top:side; } });
      G.userData.ringMat=null; } }
  return G; }
global.SnugViewer={LOOKS:LOOKS,buildFrame:buildFrame,buildSweater:buildSweater,buildBase:buildBase,kit:kit,makeScene:makeScene,TR:TR,lin:lin};
})(window);
