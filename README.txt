Noor Al-Quran — Fast Offline Update

What this update does
- Starts/resumes downloading the 604 Mushaf JPG pages automatically after the app is opened online.
- Downloads up to 8 pages at the same time to reduce total wait time.
- Skips pages already stored in Cache Storage.
- Retries temporary failures twice.
- Verifies that all 604 pages are actually present before showing 100%.
- Keeps the existing mushaf cache name v6 so previously cached pages are preserved.

Files
1. sw.js — replace the current service worker file.
2. offline-download.js — add this new file beside index.html.
3. index.html — add this script line immediately after the existing app.js script tag:

<script src="offline-download.js"></script>

For example, the bottom of index.html should contain:
<script src="app.js"></script>
<script src="offline-download.js"></script>
<script src="adhkar.js"></script>

Important
- Do not upload these changes to the live GitHub repository unless you choose to.
- The 604 images are still downloaded on the first online launch; they are not embedded inside the app installer.
- The 8-way concurrency is a practical mobile-friendly setting. Actual speed depends on the user's connection, device, hosting limits, and available storage.
- After the progress reaches 100%, test by closing the app, enabling airplane mode, and opening several different Mushaf pages.
- If the app-builder WebView does not support Service Worker / Cache Storage, this method will not work inside that wrapper.
