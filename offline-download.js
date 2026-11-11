/* Noor Al-Quran — first-launch offline download UI */
(() => {
  const TOTAL = 604;
  const READY_KEY = 'noor-mushaf-offline-ready-v1';

  const style = document.createElement('style');
  style.textContent = `
    #noor-offline-layer {
      position: fixed; inset: 0; z-index: 999999;
      display: flex; align-items: center; justify-content: center;
      padding: 22px; background: rgba(5, 18, 16, .78);
      backdrop-filter: blur(7px); -webkit-backdrop-filter: blur(7px);
      direction: rtl; font-family: inherit;
    }
    #noor-offline-layer.noor-offline-hidden { display: none; }
    #noor-offline-panel {
      width: min(420px, 100%); padding: 27px 23px 24px;
      border: 1px solid rgba(255,255,255,.14); border-radius: 22px;
      background: #102b25; color: #fff; text-align: center;
      box-shadow: 0 22px 70px rgba(0,0,0,.38);
    }
    #noor-offline-panel h2 { margin: 0 0 10px; font-size: 21px; font-weight: 800; }
    #noor-offline-message { margin: 0 0 22px; color: rgba(255,255,255,.78); font-size: 14px; line-height: 1.8; }
    #noor-offline-track {
      height: 11px; overflow: hidden; border-radius: 30px;
      background: rgba(255,255,255,.14); direction: ltr;
    }
    #noor-offline-fill {
      width: 0%; height: 100%; border-radius: inherit;
      background: linear-gradient(90deg,#b9e769,#e7c66c);
      transition: width .18s ease;
    }
    #noor-offline-percent {
      display: block; margin-top: 13px; color: #e7c66c;
      font-size: 25px; font-weight: 800; font-variant-numeric: tabular-nums;
    }
    #noor-offline-retry {
      display: none; margin: 17px auto 0; padding: 10px 22px;
      border: 0; border-radius: 24px; background: #e7c66c;
      color: #14231e; font-weight: 800; font-size: 14px;
    }
  `;
  document.head.appendChild(style);

  const layer = document.createElement('div');
  layer.id = 'noor-offline-layer';
  if (localStorage.getItem(READY_KEY) === 'yes') {
    layer.className = 'noor-offline-hidden';
  }
  layer.innerHTML = `
    <div id="noor-offline-panel" role="status" aria-live="polite">
      <h2>يتم تحديث محتوى التطبيق</h2>
      <p id="noor-offline-message">يرجى الانتظار حتى اكتمال التحديث</p>
      <div id="noor-offline-track"><div id="noor-offline-fill"></div></div>
      <span id="noor-offline-percent">0%</span>
      <button id="noor-offline-retry" type="button">إعادة المحاولة</button>
    </div>
  `;
  document.body.appendChild(layer);

  const message = layer.querySelector('#noor-offline-message');
  const fill = layer.querySelector('#noor-offline-fill');
  const percent = layer.querySelector('#noor-offline-percent');
  const retry = layer.querySelector('#noor-offline-retry');

  function show() {
    layer.classList.remove('noor-offline-hidden');
  }

  function setProgress(cached) {
    const value = Math.max(0, Math.min(100, Math.floor(cached / TOTAL * 100)));
    fill.style.width = value + '%';
    percent.textContent = value + '%';
  }

  function requestDownload() {
    const worker = navigator.serviceWorker && navigator.serviceWorker.controller;
    if (worker) {
      retry.style.display = 'none';
      message.textContent = 'يرجى الانتظار حتى اكتمال التحديث';
      worker.postMessage({ type: 'CACHE_ALL_MUSHAF_PAGES' });
    }
  }

  if (!('serviceWorker' in navigator)) {
    show();
    message.textContent = 'هذا الإصدار من التطبيق لا يدعم التخزين دون إنترنت. افتح التطبيق من متصفح يدعم Service Worker.';
    percent.textContent = '—';
    retry.style.display = 'none';
    return;
  }

  navigator.serviceWorker.addEventListener('message', event => {
    const data = event.data || {};

    if (data.type === 'MUSHAF_CACHE_PROGRESS') {
      if (data.percent < 100) show();
      setProgress(data.cached || 0);
      if (data.state === 'checking') {
        message.textContent = 'جارٍ فحص الصفحات المحفوظة واستكمال الناقص';
      } else {
        message.textContent = 'يرجى الانتظار حتى اكتمال التحديث';
      }
    }

    if (data.type === 'MUSHAF_CACHE_COMPLETE') {
      setProgress(TOTAL);
      localStorage.setItem(READY_KEY, 'yes');
      message.textContent = 'اكتمل التحديث وأصبحت صفحات المصحف جاهزة للاستخدام دون إنترنت';
      retry.style.display = 'none';
      setTimeout(() => layer.classList.add('noor-offline-hidden'), 1100);
    }

    if (data.type === 'MUSHAF_CACHE_PARTIAL') {
      show();
      setProgress(data.cached || 0);
      message.textContent = 'تعذر تحميل بعض الصفحات. تأكد من اتصال الإنترنت ثم أعد المحاولة.';
      retry.style.display = 'inline-block';
      localStorage.removeItem(READY_KEY);
    }

    if (data.type === 'MUSHAF_CACHE_ERROR') {
      show();
      message.textContent = 'حدث خطأ أثناء التحميل. تأكد من اتصال الإنترنت ثم أعد المحاولة.';
      retry.style.display = 'inline-block';
    }
  });

  retry.addEventListener('click', requestDownload);
  navigator.serviceWorker.addEventListener('controllerchange', requestDownload);
  window.addEventListener('online', requestDownload);

  // The existing app registers sw.js and starts the download automatically.
  // This extra request covers cases where its registration completed just before this listener.
  if (navigator.serviceWorker.controller) requestDownload();
})();
