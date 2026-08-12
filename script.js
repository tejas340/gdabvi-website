(function(){
  var link=document.createElement('link');
  link.rel='stylesheet';
  link.href='popup-top.css';
  document.head.appendChild(link);

  var core=document.createElement('script');
  core.src='script-core.js';
  core.async=false;
  document.body.appendChild(core);
})();
