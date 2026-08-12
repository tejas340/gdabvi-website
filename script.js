/* ============================================================
   GDABVI site scripts — shared across all pages.
   Defensive: every feature is isolated in safe(), storage is
   guarded, so nothing can break the accessibility toolbar.
   ============================================================ */
(function(){
'use strict';
function safe(name, fn){ try{ fn(); }catch(err){ if(window.console) console.warn('GDABVI: '+name+' failed —', err); } }
var store = {
  get: function(k){ try{ return window.localStorage.getItem(k); }catch(e){ return null; } },
  set: function(k,v){ try{ window.localStorage.setItem(k,v); }catch(e){} }
};

/* ---------- Text-to-speech ---------- */
var synth = null;
try{ synth = window.speechSynthesis || null; }catch(e){}

/* Voice selection: prefer a calm, warm female voice.
   Browsers only expose voices installed on the device, so we
   score what's available and pick the warmest female option. */
var preferredVoice = null;
var FEMALE_NAMES = ['aria','jenny','sonia','libby','emma','ava','michelle','natasha','clara',
  'samantha','victoria','karen','moira','tessa','fiona','susan','zira','hazel','heera',
  'joanna','salli','kendra','kimberly','ivy','amy','nicole','female','woman'];
function scoreVoice(v){
  var n = (v.name||'').toLowerCase();
  var lang = (v.lang||'').toLowerCase();
  var s = 0;
  if(lang.indexOf('en')===0) s += 3;
  for(var i=0;i<FEMALE_NAMES.length;i++){
    if(n.indexOf(FEMALE_NAMES[i])!==-1){ s += 8; break; }
  }
  if(n.indexOf('natural')!==-1 || n.indexOf('online')!==-1) s += 4;
  if(n.indexOf('google')!==-1) s += 1;
  if(n.indexOf('male')!==-1 && n.indexOf('female')===-1) s -= 8;
  return s;
}
function pickVoice(){
  if(!synth) return;
  var voices = [];
  try{ voices = synth.getVoices() || []; }catch(e){ return; }
  if(!voices.length) return;
  var best = null, bestScore = -999;
  for(var i=0;i<voices.length;i++){
    var s = scoreVoice(voices[i]);
    if(s > bestScore){ bestScore = s; best = voices[i]; }
  }
  preferredVoice = best;
}
try{
  pickVoice();
  if(synth && typeof synth.addEventListener === 'function'){
    synth.addEventListener('voiceschanged', pickVoice);
  } else if(synth){
    synth.onvoiceschanged = pickVoice;
  }
}catch(e){}

var ttsStatus = document.getElementById('ttsStatus');
var btnListen = document.getElementById('btnListen');
var btnPause  = document.getElementById('btnPause');
var btnStop   = document.getElementById('btnStop');
var currentBtn = null;

function setStatus(msg){ if(ttsStatus) ttsStatus.textContent = msg; }
function cleanText(el){
  var clone = el.cloneNode(true);
  var junk = clone.querySelectorAll('.speak-btn, script, style');
  for(var i=0;i<junk.length;i++) junk[i].parentNode.removeChild(junk[i]);
  return (clone.textContent||'').replace(/\s+/g,' ').trim();
}
function resetTTSUI(){
  setStatus('');
  if(btnPause){ btnPause.hidden = true; btnPause.textContent = '⏸ Pause'; }
  if(btnStop) btnStop.hidden = true;
  if(btnListen) btnListen.setAttribute('aria-pressed','false');
  if(currentBtn){ currentBtn.classList.remove('speaking'); currentBtn = null; }
}
function stopSpeaking(){
  try{ if(synth && (synth.speaking || synth.paused)) synth.cancel(); }catch(e){}
  resetTTSUI();
}
function speak(text, sourceBtn){
  stopSpeaking();
  if(!synth || !window.SpeechSynthesisUtterance){
    setStatus('Sorry — read-aloud is not supported in this browser.');
    return;
  }
  if(!text){ setStatus('Nothing to read here.'); return; }
  var u = new SpeechSynthesisUtterance(text);
  u.rate = 0.88; u.pitch = 1.05; u.lang = 'en-US';
  if(!preferredVoice) pickVoice();
  if(preferredVoice){ u.voice = preferredVoice; u.lang = preferredVoice.lang || 'en-US'; }
  u.onend = resetTTSUI;
  u.onerror = resetTTSUI;
  setStatus('🔊 Reading aloud…');
  if(btnPause) btnPause.hidden = false;
  if(btnStop) btnStop.hidden = false;
  if(btnListen) btnListen.setAttribute('aria-pressed','true');
  if(sourceBtn){ sourceBtn.classList.add('speaking'); currentBtn = sourceBtn; }
  try{ synth.speak(u); }
  catch(e){ resetTTSUI(); setStatus('Read-aloud could not start in this browser.'); }
}

safe('tts-buttons', function(){
  if(btnListen) btnListen.addEventListener('click', function(){
    var main = document.querySelector('main');
    if(main) speak(cleanText(main), null);
  });
  if(btnPause) btnPause.addEventListener('click', function(){
    if(!synth) return;
    if(synth.paused){ synth.resume(); btnPause.textContent='⏸ Pause'; setStatus('🔊 Reading aloud…'); }
    else { synth.pause(); btnPause.textContent='▶ Resume'; setStatus('⏸ Paused'); }
  });
  if(btnStop) btnStop.addEventListener('click', stopSpeaking);
  window.addEventListener('beforeunload', function(){ try{ if(synth) synth.cancel(); }catch(e){} });
});

safe('tts-sections', function(){
  document.addEventListener('click', function(ev){
    var btn = ev.target.closest ? ev.target.closest('.speak-btn') : null;
    if(!btn) return;
    if(btn.classList.contains('speaking')){ stopSpeaking(); return; }
    var target = btn.getAttribute('data-speak')
      ? document.getElementById(btn.getAttribute('data-speak'))
      : btn.closest('section');
    if(target) speak(cleanText(target), btn);
  });
});

safe('a11y-widget', function(){
  var bar = document.querySelector('.a11y-bar');
  if(!bar) return;
  var fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'a11y-fab';
  fab.setAttribute('aria-expanded','false');
  fab.setAttribute('aria-controls','a11yPanel');
  fab.setAttribute('title','Accessibility tools: read aloud, text size, high contrast');
  fab.innerHTML = '♿<span class="sr-only"> Open accessibility tools</span>';
  document.body.appendChild(fab);
  bar.id = 'a11yPanel';
  bar.classList.add('a11y-panel');
  bar.hidden = true;
  function setOpen(open){
    bar.hidden = !open;
    fab.setAttribute('aria-expanded', String(open));
    if(open){
      var first = bar.querySelector('button:not([hidden])');
      if(first) first.focus();
    }
  }
  fab.addEventListener('click', function(){ setOpen(bar.hidden); });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && !bar.hidden){ setOpen(false); fab.focus(); }
  });
});

safe('mobile-nav', function(){
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('mainNav');
  if(!toggle || !nav) return;
  toggle.addEventListener('click', function(){
    var open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
});

safe('font-size', function(){
  var FS_KEY = 'gdabvi-fs';
  var fs = parseInt(store.get(FS_KEY), 10);
  if(isNaN(fs) || fs < 16 || fs > 26) fs = 19;
  function applyFS(){
    document.documentElement.style.setProperty('--fs', fs+'px');
    store.set(FS_KEY, String(fs));
  }
  applyFS();
  var up = document.getElementById('fontUp');
  var down = document.getElementById('fontDown');
  var reset = document.getElementById('fontReset');
  if(up) up.addEventListener('click', function(){ if(fs<26){ fs++; applyFS(); } });
  if(down) down.addEventListener('click', function(){ if(fs>16){ fs--; applyFS(); } });
  if(reset) reset.addEventListener('click', function(){ fs=19; applyFS(); });
});

safe('high-contrast', function(){
  var HC_KEY = 'gdabvi-hc';
  var btn = document.getElementById('btnContrast');
  if(store.get(HC_KEY)==='1'){
    document.body.classList.add('high-contrast');
    if(btn) btn.setAttribute('aria-pressed','true');
  }
  if(btn) btn.addEventListener('click', function(){
    var on = document.body.classList.toggle('high-contrast');
    btn.setAttribute('aria-pressed', String(on));
    store.set(HC_KEY, on ? '1' : '0');
  });
});

safe('contact-form', function(){
  var form = document.getElementById('contactForm');
  if(!form) return;
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var name = ((form.first.value||'')+' '+(form.last.value||'')).trim();
    var body = encodeURIComponent(
      'Name: '+name+'\nEmail: '+form.email.value+'\nPhone: '+(form.phone.value||'')+'\n\nMessage:\n'+(form.message.value||'')
    );
    location.href = 'mailto:info@gdabvi.org?subject='
      + encodeURIComponent('Website inquiry from '+(name||form.email.value))
      + '&body=' + body;
  });
});

/* ---------- Temporary TopGolf fundraiser popup ----------
   Event ends September 17, 2026 at 9:00 PM America/Detroit.
   At that moment Detroit is on EDT (UTC-4), so the absolute
   cutoff is September 18, 2026 at 01:00 UTC.
   The popup intentionally appears on every page load until then.
   -------------------------------------------------------- */
safe('topgolf-event-popup', function(){
  var EVENT_END = Date.parse('2026-09-18T01:00:00Z');
  var now = Date.now();
  if(!EVENT_END || now >= EVENT_END) return;

  var style = document.createElement('style');
  style.id = 'topgolf-popup-styles';
  style.textContent = [
    '.tg-overlay{position:fixed;inset:0;z-index:10000;background:rgba(5,22,29,.78);display:flex;align-items:center;justify-content:center;padding:18px;backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}',
    '.tg-modal{position:relative;width:min(760px,96vw);max-height:94vh;overflow:auto;border-radius:20px;background:#07531e;box-shadow:0 28px 80px rgba(0,0,0,.5);font-family:Atkinson Hyperlegible,Arial,sans-serif;color:#fff;outline:none}',
    '.tg-close{position:sticky;top:12px;float:right;z-index:4;margin:12px 12px -62px 0;width:48px;height:48px;border:0;border-radius:50%;background:#fff;color:#16251c;font-size:31px;line-height:1;cursor:pointer;box-shadow:0 5px 18px rgba(0,0,0,.28)}',
    '.tg-close:hover,.tg-close:focus-visible{background:#e9f4fb;outline:4px solid #4db0e6;outline-offset:2px}',
    '.tg-poster{position:relative;overflow:hidden;background:linear-gradient(180deg,#5c8e73 0 36%,#3b8911 36% 51%,#07551d 51% 100%)}',
    '.tg-top{position:relative;padding:30px 68px 24px;text-align:center;min-height:285px}',
    '.tg-logo{position:absolute;top:30px;left:34px;width:118px;height:118px;object-fit:contain;background:#fff;padding:8px}',
    '.tg-title{margin:0 72px 5px;font-family:Georgia,serif;font-size:clamp(28px,4.8vw,43px);font-weight:400;color:#fff;line-height:1.08}',
    '.tg-topgolf{margin:4px 0 6px;font-family:Georgia,serif;font-size:clamp(38px,6vw,59px);font-weight:700;color:#fff;line-height:1}',
    '.tg-place{margin:15px auto 0;max-width:520px;font-family:Georgia,serif;font-size:clamp(20px,3.1vw,31px);font-weight:700;line-height:1.3}',
    '.tg-fee{position:relative;padding:17px 34px 26px;background:rgba(47,125,7,.72);text-align:left}',
    '.tg-fee-label{font-size:clamp(22px,3.2vw,33px);font-weight:800}',
    '.tg-fee-price{font-size:clamp(30px,4.6vw,48px);font-weight:900;line-height:1.15}',
    '.tg-fee p{max-width:650px;margin:14px auto 0;text-align:center;font-size:clamp(16px,2.15vw,22px);font-weight:700;line-height:1.35}',
    '.tg-lower{position:relative;padding:29px 48px 24px;text-align:center;background:linear-gradient(180deg,#07551d,#014918)}',
    '.tg-date{margin:0;font-size:clamp(29px,4.4vw,45px);font-weight:900;line-height:1.25}',
    '.tg-time{margin:0 0 26px;font-size:clamp(26px,4vw,40px);font-weight:900}',
    '.tg-included-title{font-size:clamp(19px,2.7vw,28px);font-weight:900;text-decoration:underline;margin-bottom:12px}',
    '.tg-included{max-width:620px;margin:0 auto 25px;display:grid;grid-template-columns:1fr 1fr;gap:7px 34px;text-align:left;font-size:clamp(16px,2vw,21px);font-weight:700}',
    '.tg-included div:before{content:"•";margin-right:10px}',
    '.tg-actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:22px}',
    '.tg-action{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:10px 20px;border-radius:999px;text-decoration:none!important;font-weight:900;font-size:17px}',
    '.tg-buy{background:#fff;color:#07551d!important}',
    '.tg-sponsor{background:#f0b53f;color:#17351d!important}',
    '.tg-action:focus-visible{outline:4px solid #4db0e6;outline-offset:3px}',
    '.tg-note{margin:15px 0 0;font-size:14px;color:#eef8ee}',
    '.tg-ball{position:absolute;border-radius:50%;background:radial-gradient(circle at 38% 32%,#fff 0 12%,#e7e7e7 36%,#b8b8b8 72%,#8e8e8e 100%);box-shadow:inset -8px -10px 18px rgba(0,0,0,.18),0 8px 18px rgba(0,0,0,.22);opacity:.98}',
    '.tg-ball:after{content:"";position:absolute;inset:10%;border-radius:50%;background-image:radial-gradient(circle,#aaa 1.3px,transparent 1.8px);background-size:10px 10px;opacity:.35}',
    '.tg-ball.one{width:118px;height:118px;right:-25px;top:-18px}',
    '.tg-ball.two{width:92px;height:92px;left:-34px;top:285px}',
    '.tg-ball.three{width:102px;height:102px;right:-30px;bottom:145px}',
    '.tg-ball.four{width:48px;height:48px;left:58px;top:390px}',
    'body.tg-modal-open{overflow:hidden}',
    '@media(max-width:650px){.tg-overlay{padding:9px}.tg-modal{width:100%;max-height:96vh;border-radius:14px}.tg-close{width:44px;height:44px;margin:9px 9px -54px 0}.tg-top{padding:22px 24px 18px;min-height:255px}.tg-logo{position:relative;top:auto;left:auto;width:92px;height:92px;margin:0 auto 8px}.tg-title{margin:0;font-size:27px}.tg-topgolf{font-size:42px}.tg-place{font-size:20px}.tg-fee{padding:15px 22px 20px}.tg-lower{padding:24px 24px 22px}.tg-date{font-size:27px}.tg-time{font-size:24px}.tg-included{grid-template-columns:1fr;font-size:17px;gap:4px}.tg-ball.one{width:74px;height:74px}.tg-ball.two{width:65px;height:65px;top:330px}.tg-ball.three{width:66px;height:66px;bottom:155px}.tg-ball.four{display:none}}'
  ].join('');
  document.head.appendChild(style);

  var overlay = document.createElement('div');
  overlay.className = 'tg-overlay';
  overlay.setAttribute('aria-hidden','false');
  overlay.innerHTML = '<div class="tg-modal" role="dialog" aria-modal="true" aria-labelledby="tgPopupTitle" aria-describedby="tgPopupDesc" tabindex="-1">'
    + '<button class="tg-close" type="button" aria-label="Close TopGolf fundraiser announcement">×</button>'
    + '<div class="tg-poster">'
    + '<span class="tg-ball one" aria-hidden="true"></span><span class="tg-ball two" aria-hidden="true"></span><span class="tg-ball three" aria-hidden="true"></span><span class="tg-ball four" aria-hidden="true"></span>'
    + '<div class="tg-top">'
    + '<img class="tg-logo" src="images/gdabvi-logo-square.png" alt="GDABVI logo">'
    + '<h2 class="tg-title" id="tgPopupTitle">Charity Fundraiser</h2>'
    + '<div class="tg-topgolf">TopGolf</div>'
    + '<div class="tg-place">500 Great Lakes Crossing Dr.<br>Auburn Hills, MI 48326</div>'
    + '</div>'
    + '<div class="tg-fee" id="tgPopupDesc"><div class="tg-fee-label">Entry Fee</div><div class="tg-fee-price">$100 per person <span style="font-size:.62em">(6 players per Bay)</span></div>'
    + '<p>Join us for an esteemed golf tournament that brings together players for friendly competition, networking opportunities, and enjoyable experiences—all for a wonderful cause!</p></div>'
    + '<div class="tg-lower">'
    + '<p class="tg-date">Thursday, September 17, 2026</p><p class="tg-time">6:00 pm to 9:00 pm</p>'
    + '<div class="tg-included-title">What’s Included?</div>'
    + '<div class="tg-included"><div>Entrance</div><div>Exclusive Player Welcome Kit</div><div>Dinner</div><div>Tournament Entry And Prizes</div><div>1 Beer or Wine per player</div></div>'
    + '<div class="tg-actions"><a class="tg-action tg-buy" href="https://www.paypal.com/ncp/payment/E9QQLZAJMFHVU" target="_blank" rel="noopener">Buy Tickets</a><a class="tg-action tg-sponsor" href="https://forms.gle/S4jvcjUJXnz4BUws8" target="_blank" rel="noopener">Sponsorship Opportunities</a></div>'
    + '<p class="tg-note">This event announcement automatically stops appearing after September 17, 2026 at 9:00 PM.</p>'
    + '</div></div></div>';

  document.body.appendChild(overlay);
  document.body.classList.add('tg-modal-open');
  var modal = overlay.querySelector('.tg-modal');
  var closeBtn = overlay.querySelector('.tg-close');
  var previousFocus = document.activeElement;

  function removePopup(){
    if(!overlay.parentNode) return;
    overlay.setAttribute('aria-hidden','true');
    overlay.parentNode.removeChild(overlay);
    document.body.classList.remove('tg-modal-open');
    if(style.parentNode) style.parentNode.removeChild(style);
    if(previousFocus && previousFocus.focus) try{ previousFocus.focus(); }catch(e){}
  }

  closeBtn.addEventListener('click', removePopup);
  overlay.addEventListener('click', function(e){ if(e.target===overlay) removePopup(); });
  document.addEventListener('keydown', function(e){
    if(e.key==='Escape' && overlay.parentNode){ e.preventDefault(); removePopup(); }
    if(e.key==='Tab' && overlay.parentNode){
      var focusable = overlay.querySelectorAll('button,a[href]');
      if(!focusable.length) return;
      var first = focusable[0], last = focusable[focusable.length-1];
      if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
    }
  });
  if(closeBtn) closeBtn.focus(); else if(modal) modal.focus();

  var expiryCheck = window.setInterval(function(){
    if(Date.now() >= EVENT_END){ window.clearInterval(expiryCheck); removePopup(); }
  }, 60000);
});
})();