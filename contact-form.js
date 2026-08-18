(function(){
'use strict';
var form = document.getElementById('contactForm');
if(!form) return;

var button = form.querySelector('button[type="submit"]');
var status = document.getElementById('contactStatus');
var endpoint = 'https://formsubmit.co/ajax/information@gdabvi.org';
var busy = false;

function setStatus(message, type){
  if(!status) return;
  status.textContent = message;
  status.className = 'contact-status' + (type ? ' ' + type : '');
  if(type === 'success' || type === 'error'){
    status.setAttribute('tabindex','-1');
    try{ status.focus(); }catch(e){}
  }
}

form.addEventListener('submit', function(event){
  /* Capture this submission here so the legacy mailto handler in
     the shared script never opens a local email application. */
  event.preventDefault();
  event.stopImmediatePropagation();
  if(busy) return;

  if(!form.checkValidity()){
    form.reportValidity();
    return;
  }

  busy = true;
  if(button){
    button.disabled = true;
    button.setAttribute('aria-disabled','true');
    button.dataset.originalText = button.textContent;
    button.textContent = 'Sending…';
  }
  setStatus('Sending your message…','sending');

  var first = (form.elements.first && form.elements.first.value || '').trim();
  var last = (form.elements.last && form.elements.last.value || '').trim();
  var email = (form.elements.email && form.elements.email.value || '').trim();
  var phone = (form.elements.phone && form.elements.phone.value || '').trim();
  var message = (form.elements.message && form.elements.message.value || '').trim();

  var payload = {
    name: (first + ' ' + last).trim(),
    first_name: first,
    last_name: last,
    email: email,
    phone: phone,
    message: message,
    _replyto: email,
    _subject: 'New inquiry from the GDABVI website',
    _template: 'table',
    _url: window.location.href
  };

  fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  .then(function(response){
    if(!response.ok) throw new Error('Submission failed');
    return response.json();
  })
  .then(function(){
    form.reset();
    setStatus('Thank you. Your message has been sent to GDABVI. A staff member will follow up with you.','success');
  })
  .catch(function(){
    setStatus('We could not send your message right now. Please call GDABVI at 313-272-3900 for assistance.','error');
  })
  .finally(function(){
    busy = false;
    if(button){
      button.disabled = false;
      button.removeAttribute('aria-disabled');
      button.textContent = button.dataset.originalText || 'Send Message';
    }
  });
}, true);
})();
