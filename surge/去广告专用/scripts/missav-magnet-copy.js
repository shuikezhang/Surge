// MissAV HTML response: remove observed ad scheduler and slots, preserve media/player.
const body = $response.body;
const headers = $response.headers || {};
const contentType = Object.keys(headers).find(k => k.toLowerCase() === 'content-type');
if (typeof body !== 'string' || !/<\/body\s*>/i.test(body) ||
    (contentType && !/text\/html/i.test(headers[contentType])) ||
    !/(?:htmlAdIndexes|magnet:\?xt=urn:btih:)/i.test(body)) {
  $done({});
} else {
  let cleaned = body;
  // This site's randomized ad scheduler exclusively creates the bottom-right popup ads.
  cleaned = cleaned.replace(/<script\b[^>]*>\s*let htmlAds\s*=\s*\[\][\s\S]*?shuffle\(htmlAdIndexes\)\s*;?\s*<\/script>/i, '');
  cleaned = cleaned.replace(/<script\b[^>]*>\s*if\s*\(htmlAds\[htmlAdIndexes\[0\]\]\)\s*\{\s*htmlAds\[htmlAdIndexes\[0\]\]\(\)\s*\}\s*<\/script>/i, '');
  // Video overlay's own /pop?url= navigation is independent of third-party DNS rules.
  cleaned = cleaned.replace(/\s@(?:click|keyup\.space\.window)=["']pop\(\)["']/g, '');
  const style = `<style id="missav-clean-style">
    .magnet-copy-btn{margin-left:8px;padding:5px 9px;border:1px solid #e11d48;border-radius:6px;color:#fff;background:#be123c;font-size:13px;white-space:nowrap;cursor:pointer}
    div.pt-16.pb-4:has(iframe[src*="go.mayzaent.com/smartpop/"]),
    .under_player:has(iframe[src*="go.mayzaent.com/"]),
    body>div.fixed.right-2.bottom-2:has(iframe[src*="rallytrck.website/"]),
    body>div.fixed.right-2.bottom-2:has(img[src*="partwithner.com/partners/"]),
    div.space-y-5.mb-5:has(script[src*="cdn.tsyndicate.com/sdk/"]){display:none!important}
  </style>`;
  // CSS runs before external ad resources and prevents empty white slot flashes.
  cleaned = cleaned.replace(/<\/head\s*>/i, style + '</head>');
  const injection = `<script id="missav-magnet-copy-helper">(function(){
    if(window.__missavCleanInstalled)return;window.__missavCleanInstalled=true;
    var ads=/^(?:creative\\.myavlive\\.com|go\\.mayzaent\\.com|t\\.snaptrckr\\.fun|t\\.rallytrck\\.website|cdn\\.tsyndicate\\.com|partwithner\\.com)$/;
    function adSource(el){try{return ads.test(new URL(el.getAttribute('src'),location.href).hostname)}catch(_){return false}}
    function clean(){
      document.querySelectorAll('iframe[src],script[src],img[src]').forEach(function(el){
        if(!adSource(el))return;
        // Homepage slots have only two ad iframes; never remove their video-list siblings.
        var home=el.closest('div.pt-16.pb-4');
        if(home && home.querySelector('iframe[src*="go.mayzaent.com/"]') && !home.querySelector('video,.thumbnail')){home.remove();return}
        var float=el.closest('body > div.fixed.right-2.bottom-2');
        if(float){float.remove();return}
        var slot=el.closest('.under_player,.space-y-5.mb-5,.space-y-6.mb-6');
        if(slot && slot.classList.contains('under_player')){slot.remove();return}
        if(slot && el.parentElement && el.parentElement.parentElement && !el.parentElement.parentElement.querySelector('video,.thumbnail')){el.parentElement.parentElement.remove();return}
        el.remove();
      });
      document.querySelectorAll('body > div.fixed.right-2.bottom-2').forEach(function(el){
        if(el.querySelector('iframe[src*="rallytrck.website/"],img[src*="partwithner.com/partners/"]'))el.remove();
      });
      document.querySelectorAll('.under_player').forEach(function(el){if(!el.querySelector('video,.thumbnail'))el.remove()});
      document.querySelectorAll('a[href^="magnet:"]').forEach(function(a){
        if(a.dataset.magnetCopyAdded)return;a.dataset.magnetCopyAdded='1';
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
    function init(){clean();var pending=false;new MutationObserver(function(){if(pending)return;pending=true;setTimeout(function(){pending=false;clean()},100)}).observe(document.body,{childList:true,subtree:true})}
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  })();</script>`;
  $done({body: cleaned.replace(/<\/body\s*>/i, injection + '</body>')});
}
