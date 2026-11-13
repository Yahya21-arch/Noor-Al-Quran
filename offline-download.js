/* Noor Al-Quran — mandatory first-launch offline update */
(() => {
  const TOTAL = 604;
  const READY_KEY = 'noor-mushaf-offline-ready-v1';

  const style = document.createElement('style');
  style.textContent = `
    #noor-offline-layer {
      position: fixed; inset: 0; z-index: 2147483647;
      display: flex; align-items: center; justify-content: center;
      padding: 22px; background: #061512;
      direction: rtl; font-family: inherit;
      touch-action: none;
    }
    #noor-offline-layer.noor-offline-hidden { display: none; }
    #noor-offline-panel {
      width: min(460px, 100%); padding: 30px 24px 26px;
      border: 1px solid rgba(255,255,255,.14); border-radius: 22px;
      background: #102b25; color: #fff; text-align: center;
      box-shadow: 0 22px 70px rgba(0,0,0,.48);
    }
    #noor-offline-panel h2 {
      margin: 0 0 10px; font-size: 22px; font-weight: 800;
    }
    #noor-offline-message {
      margin: 0 0 22px; color: rgba(255,255,255,.82);
      font-size: 15px; line-height: 1.9;
    }
    #noor-offline-track {
      height: 12px; overflow: hidden; border-radius: 30px;
      background: rgba(255,255,255,.14); direction: ltr;
    }
    #noor-offline-fill {
      width: 0%; height: 100%; border-radius: inherit;
      background: linear-gradient(90deg,#b9e769,#e7c66c);
      transition: width .18s ease;
    }
    #noor-offline-percent {
      display: block; margin-top: 13px; color: #e7c66c;
      font-size: 26px; font-weight: 800;
      font-variant-numeric: tabular-nums;
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

  const wasReady = localStorage.getItem(READY_KEY) === 'yes';
  if (wasReady) layer.className = 'noor-offline-hidden';

  layer.innerHTML = `
    <div id="noor-offline-panel" role="status" aria-live="polite">
      <h2>جاري تحديث التطبيق</h2>
      <p id="noor-offline-message">لا تخرج قبل اكتمال التحديث</p>
      <div id="noor-offline-track">
        <div id="noor-offline-fill"></div>
      </div>
      <span id="noor-offline-percent">0%</span>
      <button id="noor-offline-retry" type="button">إعادة المحاولة</button>
    </div>
  `;

  document.body.appendChild(layer);

  const message = layer.querySelector('#noor-offline-message');
  const fill = layer.querySelector('#noor-offline-fill');
  const percent = layer.querySelector('#noor-offline-percent');
  const retry = layer.querySelector('#noor-offline-retry');

  let started = false;

  function show() {
    layer.classList.remove('noor-offline-hidden');
  }

  function setProgress(cached) {
    const safe = Math.max(0, Math.min(TOTAL, Number(cached) || 0));
    const value = Math.floor((safe / TOTAL) * 100);
    fill.style.width = value + '%';
    percent.textContent = value + '%';
  }

  async function requestDownload() {
    if (started) return;

    if (!('serviceWorker' in navigator)) {
      show();
      message.textContent = 'هذا الإصدار لا يدعم التحديث دون إنترنت.';
      percent.textContent = '—';
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const worker = navigator.serviceWorker.controller || registration.active || registration.waiting;

      if (!worker) return;

      started = true;
      show();
      retry.style.display = 'none';
      message.textContent = 'لا تخرج قبل اكتمال التحديث';
      worker.postMessage({ type: 'CACHE_ALL_MUSHAF_PAGES' });
    } catch (error) {
      started = false;
      show();
      message.textContent = 'تعذر بدء التحديث. تأكد من اتصال الإنترنت ثم أعد المحاولة.';
      retry.style.display = 'inline-block';
    }
  }

  navigator.serviceWorker?.addEventListener('message', event => {
    const data = event.data || {};

    if (data.type === 'MUSHAF_CACHE_PROGRESS') {
      show();
      setProgress(data.cached || 0);

      if (data.state === 'checking') {
        message.textContent = 'جاري فحص الصفحات واستكمال الناقص — لا تخرج قبل اكتمال التحديث';
      } else {
        message.textContent = 'جاري تحديث التطبيق — لا تخرج قبل اكتمال التحديث';
      }
    }

    if (data.type === 'MUSHAF_CACHE_COMPLETE') {
      setProgress(TOTAL);
      localStorage.setItem(READY_KEY, 'yes');
      message.textContent = 'اكتمل تحديث التطبيق';
      retry.style.display = 'none';

      setTimeout(() => {
        layer.classList.add('noor-offline-hidden');
      }, 900);
    }

    if (data.type === 'MUSHAF_CACHE_PARTIAL') {
      started = false;
      show();
      setProgress(data.cached || 0);
      message.textContent = 'تعذر تحميل بعض الصفحات — تأكد من الإنترنت واضغط إعادة المحاولة';
      retry.style.display = 'inline-block';
      localStorage.removeItem(READY_KEY);
    }

    if (data.type === 'MUSHAF_CACHE_ERROR') {
      started = false;
      show();
      message.textContent = 'حدث خطأ أثناء التحديث — تأكد من الإنترنت واضغط إعادة المحاولة';
      retry.style.display = 'inline-block';
      localStorage.removeItem(READY_KEY);
    }
  });

  retry.addEventListener('click', requestDownload);
  navigator.serviceWorker?.addEventListener('controllerchange', () => {
    started = false;
    requestDownload();
  });
  window.addEventListener('online', () => {
    started = false;
    requestDownload();
  });

  if (!wasReady) {
    requestDownload();
  } else {
    /*
     * The flag is only an optimization. If the Service Worker/cache was cleared,
     * the service worker itself will request the missing pages when needed.
     * The overlay stays hidden for an already-completed first run.
     */
  }
})();
