/* Noor Al-Quran — first-launch offline download gate for all 604 Mushaf pages */
(() => {
  const TOTAL = 604;
  const READY_KEY = 'noor-mushaf-offline-ready-v1';
  const style = document.createElement('style');
  style.textContent = `
    #noor-offline-layer{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:22px;background:#071b17;direction:rtl;font-family:inherit}
    #noor-offline-layer.noor-offline-hidden{display:none}
    #noor-offline-panel{width:min(420px,100%);padding:30px 23px 26px;border:1px solid rgba(255,255,255,.14);border-radius:22px;background:#102b25;color:#fff;text-align:center;box-shadow:0 22px 70px rgba(0,0,0,.38)}
    #noor-offline-panel h2{margin:0 0 10px;font-size:21px;font-weight:800}
    #noor-offline-message{margin:0 0 22px;color:rgba(255,255,255,.82);font-size:14px;line-height:1.9}
    #noor-offline-track{height:11px;overflow:hidden;border-radius:30px;background:rgba(255,255,255,.14);direction:ltr}
    #noor-offline-fill{width:0%;height:100%;border-radius:inherit;background:linear-gradient(90deg,#b9e769,#e7c66c);transition:width .18s ease}
    #noor-offline-percent{display:block;margin-top:13px;color:#e7c66c;font-size:25px;font-weight:800;font-variant-numeric:tabular-nums}
    #noor-offline-retry{display:none;margin:17px auto 0;padding:11px 24px;border:0;border-radius:24px;background:#e7c66c;color:#14231e;font-weight:800;font-size:14px}
  `;
  document.head.appendChild(style);

  const layer = document.createElement('div');
  layer.id = 'noor-offline-layer';
  layer.innerHTML = `<div id="noor-offline-panel" role="status" aria-live="polite"><h2>Noor Al-Quran</h2><p id="noor-offline-message">يتم تجهيز صفحات المصحف للاستخدام دون إنترنت. يرجى الانتظار...</p><div id="noor-offline-track"><div id="noor-offline-fill"></div></div><span id="noor-offline-percent">0%</span><button id="noor-offline-retry" type="button">إعادة المحاولة</button></div>`;
  document.body.appendChild(layer);

  const message = layer.querySelector('#noor-offline-message');
  const fill = layer.querySelector('#noor-offline-fill');
  const percent = layer.querySelector('#noor-offline-percent');
  const retry = layer.querySelector('#noor-offline-retry');
  let registration = null;
  let requestPending = false;
  let ready = false;

  function show(){layer.classList.remove('noor-offline-hidden');}
  function hide(){layer.classList.add('noor-offline-hidden');}
  function progress(cached){const n=Math.max(0,Math.min(100,Math.floor((cached/TOTAL)*100)));fill.style.width=n+'%';percent.textContent=n+'%';}

  function requestDownload(){
    const worker=navigator.serviceWorker.controller||(registration&&registration.active);
    if(!worker||requestPending||ready)return;
    requestPending=true;retry.style.display='none';
    message.textContent='يرجى الانتظار حتى اكتمال تحميل صفحات المصحف';
    worker.postMessage({type:'CACHE_ALL_MUSHAF_PAGES'});
  }

  if(!('serviceWorker' in navigator)){
    show();message.textContent='هذا المتصفح لا يدعم التخزين دون إنترنت. افتح التطبيق من متصفح يدعم Service Worker.';percent.textContent='—';return;
  }

  navigator.serviceWorker.addEventListener('message',event=>{
    const data=event.data||{};
    if(data.type==='MUSHAF_CACHE_PROGRESS'){
      show();progress(data.cached||0);
      message.textContent=data.state==='checking'?'جارٍ فحص الصفحات المحفوظة واستكمال الناقص':'جارٍ تحميل صفحات المصحف وحفظها على جهازك';
    } else if(data.type==='MUSHAF_CACHE_COMPLETE'){
      requestPending=false;ready=true;progress(TOTAL);
      try{localStorage.setItem(READY_KEY,'yes');}catch(_){}
      message.textContent='اكتمل التحميل. المصحف جاهز الآن للاستخدام دون إنترنت.';
      retry.style.display='none';setTimeout(hide,900);
    } else if(data.type==='MUSHAF_CACHE_PARTIAL'){
      requestPending=false;show();progress(data.cached||0);
      message.textContent='لم يكتمل تحميل جميع الصفحات. اتصل بالإنترنت ثم اضغط إعادة المحاولة.';
      retry.style.display='inline-block';
    } else if(data.type==='MUSHAF_CACHE_ERROR'){
      requestPending=false;show();message.textContent='حدث خطأ أثناء تجهيز المصحف. تحقق من اتصال الإنترنت ثم أعد المحاولة.';retry.style.display='inline-block';
    }
  });

  retry.addEventListener('click',()=>{requestPending=false;requestDownload();});
  window.addEventListener('online',()=>{requestPending=false;requestDownload();});
  navigator.serviceWorker.addEventListener('controllerchange',requestDownload);

  (async()=>{
    try{
      show();message.textContent='جارٍ تشغيل نظام التخزين دون إنترنت...';
      registration=await navigator.serviceWorker.register('./sw.js');
      await navigator.serviceWorker.ready;
      requestDownload();
      if(!navigator.serviceWorker.controller&&registration.active){
        registration.active.postMessage({type:'CACHE_ALL_MUSHAF_PAGES'});requestPending=true;
      }
    }catch(error){
      requestPending=false;show();message.textContent='تعذر بدء نظام التحميل. تحقق من اتصال الإنترنت وأعد فتح التطبيق.';retry.style.display='inline-block';
    }
  })();
})();
