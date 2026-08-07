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
})();
