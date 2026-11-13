Noor Al-Quran — Offline download screen integration patch

Root cause confirmed in the GitHub repository:
- index.html did not include offline-download.js.
- app.js in the repository is empty.
- The existing offline-download.js expected another part of the app to register sw.js, but no active registration exists in the fetched index/app.js.

Apply this patch:
1) Replace the repository's offline-download.js with the file in this package.
2) In index.html, add this line immediately before </body> (after app.js and adhkar.js is fine):
   <script src="offline-download.js"></script>
3) Keep sw.js and the mushaf-pages/ folder in the repository root as they currently are.
4) Deploy the updated GitHub Pages site, then test in a fresh app install / cleared site data.

The script registers ./sw.js itself, shows a full-screen gate, listens for real cache progress, and only hides the gate after MUSHAF_CACHE_COMPLETE. It requires HTTPS (GitHub Pages is HTTPS).

Note: this patch has not been committed to GitHub because the GitHub write action was declined. It has not been tested inside the Android wrapper yet.
