(function(){
  var VISIT_KEY = 'gdabvi-topgolf-site-visited';
  var navType = 'navigate';
  var visited = false;

  try {
    var navEntries = window.performance && window.performance.getEntriesByType
      ? window.performance.getEntriesByType('navigation')
      : [];
    if (navEntries && navEntries.length && navEntries[0].type) {
      navType = navEntries[0].type;
    } else if (window.performance && window.performance.navigation) {
      navType = window.performance.navigation.type === 1 ? 'reload' : 'navigate';
    }
  } catch (e) {}

  try {
    visited = window.sessionStorage.getItem(VISIT_KEY) === '1';
    window.sessionStorage.setItem(VISIT_KEY, '1');
  } catch (e) {}

  /* Show on first entry into the site and on a real browser refresh.
     Do not show again while the visitor moves between GDABVI pages. */
  var showTopGolf = navType === 'reload' || !visited;
  var suppressStyle = null;

  if (!showTopGolf) {
    document.documentElement.classList.add('gdabvi-suppress-topgolf');
    suppressStyle = document.createElement('style');
    suppressStyle.id = 'gdabvi-popup-suppress';
    suppressStyle.textContent = '.gdabvi-suppress-topgolf .tg-overlay{display:none!important}';
    document.head.appendChild(suppressStyle);
  }

  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'popup-top.css';
  document.head.appendChild(link);

  var core = document.createElement('script');
  core.src = 'script-core.js';
  core.async = false;
  core.onload = function(){
    if (!showTopGolf) {
      var overlay = document.querySelector('.tg-overlay');
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      document.body.classList.remove('tg-modal-open');
      var popupStyles = document.getElementById('topgolf-popup-styles');
      if (popupStyles && popupStyles.parentNode) popupStyles.parentNode.removeChild(popupStyles);
      document.documentElement.classList.remove('gdabvi-suppress-topgolf');
      if (suppressStyle && suppressStyle.parentNode) suppressStyle.parentNode.removeChild(suppressStyle);
    }
  };
  document.body.appendChild(core);
})();
