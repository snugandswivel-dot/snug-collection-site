/* AR test page: builds a Quick Look (iPhone) or Scene Viewer (Android) link per look. Lives in a file because the site CSP blocks inline scripts. */
(function(){
var looks=[['blush','Blush Puff'],['holly','Holly Bow'],['oat','Oat Puff']];
var ua=navigator.userAgent, ios=/iPhone|iPad|iPod/.test(ua), android=/Android/.test(ua), base=location.origin+'/lab/ar/';
document.getElementById('looks').innerHTML=looks.map(function(l){
  var k=l[0], usdz=base+k+'.usdz', glb=base+k+'.glb';
  var href=ios?usdz:'intent://arvr.google.com/scene-viewer/1.0?file='+encodeURIComponent(glb)+'&mode=ar_preferred&title='+encodeURIComponent(l[1])+'#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url='+encodeURIComponent(location.href)+';end;';
  var rel=ios?' rel="ar"':'';
  return '<div class="look"><a'+rel+' href="'+href+'"><img src="/lab/ar/'+k+'.webp" alt=""></a><div><b>'+l[1]+'</b><small>'+(ios?'AR Quick Look':android?'Scene Viewer':'Open on a phone to view in AR')+' · '+(k==='holly'?'2.1':k==='blush'?'1.8':'1.2')+' MB</small><br><a class="ar"'+rel+' href="'+href+'">View in your space</a></div></div>';
}).join('');
})();
