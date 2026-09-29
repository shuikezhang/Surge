// MissAV detail pages: remove observed ads/pop trigger, keep playback and magnet copying.
const body = $response.body;
if (typeof body !== 'string' || !/<\/body\s*>/i.test(body) || !/magnet:\?xt=urn:btih:/i.test(body)) {
  $done({});
} else {
  const adHosts = '(?:creative\\.myavlive\\.com|go\\.mayzaent\\.com|t\\.snaptrckr\\.fun|cdn\\.tsyndicate\\.com)';
  let cleaned = body
    // Remove observed third-party ad frames/scripts before the browser loads them.
    .replace(new RegExp('<iframe\\b(?=[^>]*\\bsrc=["\\\'](?:https?:)?\\/\\/' + adHosts + '\\/)\\s*[^>]*>\\s*<\\/iframe\\s*>', 'gi'), '')
    .replace(new RegExp('<script\\b(?=[^>]*\\bsrc=["\\\'](?:https?:)?\\/\\/' + adHosts + '\\/)\\s*[^>]*>\\s*<\\/script\\s*>', 'gi'), '')
    // The player opens a same-site /pop tab through these Alpine event attributes.
    .replace(/\s@(?:click|keyup\.space\.window)=["']pop\(\)["']/g, '');
  const injection = `<script id="missav-magnet-copy-helper">(function(){
    function init(){
      if(document.getElementById('missav-magnet-copy-style'))return;
      var css=document.createElement('style'); css.id='missav-magnet-copy-style';
      css.textContent='.magnet-copy-btn{margin-left:8px;padding:5px 9px;border:1px solid #e11d48;border-radius:6px;color:#fff;background:#be123c;font-size:13px;white-space:nowrap;cursor:pointer}';
      document.head.appendChild(css);
      // Also remove empty ad slots and dynamically inserted ad frames, without touching video resources.
      function removeAds(){
        document.querySelectorAll('iframe[src],script[src]').forEach(function(el){
          try{if(!/^(creative\\.myavlive\\.com|go\\.mayzaent\\.com|t\\.snaptrckr\\.fun|cdn\\.tsyndicate\\.com)$/.test(new URL(el.src,location.href).hostname))return}catch(_){return}
          var slot=el.closest('.under_player,.space-y-6.mb-6');
          if(slot&&slot.classList.contains('under_player')){el.parentElement&&el.parentElement.remove();return}
          if(slot&&el.tagName==='IFRAME'&&el.parentElement&&el.parentElement.parentElement){el.parentElement.parentElement.remove();return}
          el.remove();
        });
        document.querySelectorAll('.under_player').forEach(function(slot){if(!slot.querySelector('iframe,img,video'))slot.remove()});
      }
      removeAds();
      var pending=false;new MutationObserver(function(){if(pending)return;pending=true;setTimeout(function(){pending=false;removeAds()},100)}).observe(document.body,{childList:true,subtree:true});
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
  $done({body: cleaned.replace(/<\/body\s*>/i, injection + '</body>')});
}
