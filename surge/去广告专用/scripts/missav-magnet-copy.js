// MissAV magnet copy helper: only modifies matching HTML pages.
const body = $response.body;
if (typeof body !== 'string' || !/<\/body\s*>/i.test(body) || !/magnet:\?xt=urn:btih:/i.test(body)) {
  $done({});
} else {
  const injection = `<script id="missav-magnet-copy-helper">(function(){
    function init(){
      if(document.getElementById('missav-magnet-copy-style'))return;
      var css=document.createElement('style'); css.id='missav-magnet-copy-style';
      css.textContent='.magnet-copy-btn{margin-left:8px;padding:5px 9px;border:1px solid #e11d48;border-radius:6px;color:#fff;background:#be123c;font-size:13px;white-space:nowrap;cursor:pointer}';
      document.head.appendChild(css);
      document.querySelectorAll('a[href^="magnet:"]').forEach(function(a){
        if(a.dataset.magnetCopyAdded)return; a.dataset.magnetCopyAdded='1';
        var b=document.createElement('button');b.type='button';b.className='magnet-copy-btn';b.textContent='复制磁力';
        b.addEventListener('click',async function(e){
          e.preventDefault();e.stopPropagation();var url=a.href,ok=false;
          try{await navigator.clipboard.writeText(url);ok=true}catch(_){}
          if(!ok){var t=document.createElement('textarea');t.value=url;t.style.cssText='position:fixed;left:-9999px;top:0';document.body.appendChild(t);t.focus();t.select();try{ok=document.execCommand('copy')}catch(_){}t.remove()}
          if(ok){b.textContent='已复制 ✓';setTimeout(function(){b.textContent='复制磁力'},1800)}
          else window.prompt('自动复制失败，请长按选中下方完整地址复制：',url);
        });a.insertAdjacentElement('afterend',b);
      });
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  })();</script>`;
  $done({body: body.replace(/<\/body\s*>/i, injection + '</body>')});
}
