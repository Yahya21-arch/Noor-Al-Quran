# Privacy Policy Integration

Added `privacy-policy.html` to the Noor Al-Quran project.

A privacy-policy link was added to the main `index.html` without changing application logic. The policy is bilingual and responsive.

Important: Android APK permissions depend on the APK wrapper/build configuration. If the APK uses additional permissions, ads, analytics, authentication, or other external services, update the policy before publishing it as the official privacy policy.


Contact information added:
Email: an.21601474@gmail.com
Phone: 01146638731


Mobile navigation update: added a fixed five-item bottom navigation for Home/Surahs, Reader, Tools, Bookmarks, and Settings. Existing data-view navigation is reused; desktop sidebar remains unchanged.


Bottom navigation fixed: the five bottom buttons now use the same `showView()` navigation handler as the desktop sidebar, so Home/Surahs, Reader, Tools & Qibla, Bookmarks, and Settings actually switch views. The bottom navigation is loaded before app.js so its click handlers are registered.
