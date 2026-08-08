/*
--------------------------------------------------
Project Name : Noor Al-Quran
Designed & Developed By : Eng. Yahya Nabil
Copyright © 2026 Eng. Yahya Nabil
All Rights Reserved.
--------------------------------------------------
*/

document.addEventListener('DOMContentLoaded', () => {
    console.log("Noor Al-Quran Initialized. Designed & Developed by Eng. Yahya Nabil.");

    const API = 'https://api.alquran.cloud/v1';
    const TOTAL_PAGES = 604;

    const state = {
        currentView: 'home',
        surahs: [],
        currentSurah: 1,
        currentPage: Number(localStorage.getItem('noorCurrentPage')) || 1,
        currentPageData: null,
        pageCache: new Map(),
        reciter: localStorage.getItem('noorReciter') || 'ar.alafasy',
        tasbeehCount: Number(localStorage.getItem('noorTasbeehCount')) || 0,
        currentAyahIndex: -1,
        currentAyah: null,
        audioMode: 'ayah',
        repeatAyah: false,
        isPlaying: false,
        searchTimer: null,
        touchStartX: 0,
        touchStartY: 0
    };

    const $ = id => document.getElementById(id);

    const loadingScreen = $('loading-screen');
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');
    const surahGrid = $('surah-grid');
    const themeToggle = $('theme-toggle');
    const tasbeehBtn = $('tasbeeh-btn');
    const tasbeehCountEl = $('tasbeeh-count');
    const tasbeehReset = $('tasbeeh-reset');
    const container = $('verses-container');
    const audio = $('audio-element');

    const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[c]));

    function showView(name) {
        navButtons.forEach(b => b.classList.toggle('active', b.dataset.view === name));
        views.forEach(v => v.classList.toggle('active', v.id === `view-${name}`));
        state.currentView = name;
    }

    function setLoading(visible, text = 'Loading Mushaf page…') {
        const el = $('page-loading');
        if (!el) return;
        el.textContent = text;
        el.classList.toggle('hidden', !visible);
    }

    async function fetchJSON(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data.code && data.code !== 200) throw new Error(data.status || 'API error');
        return data.data;
    }

    async function fetchSurahs() {
        try {
            state.surahs = await fetchJSON(`${API}/surah`);
            renderSurahs(state.surahs);
            populateSurahSelect();
        } catch (error) {
            console.error('Failed to fetch Surahs:', error);
        }
    }

    function renderSurahs(surahs) {
        surahGrid.innerHTML = surahs.map(surah => `
            <div class="surah-card" data-surah="${surah.number}">
                <div style="display:flex;gap:1rem;align-items:center;">
                    <div class="surah-number">${surah.number}</div>
                    <div class="surah-info">
                        <h4>${escapeHTML(surah.englishName)}</h4>
                        <p>${escapeHTML(surah.englishNameTranslation)} • ${surah.numberOfAyahs} Verses</p>
                    </div>
                </div>
                <div class="surah-arabic">${escapeHTML(surah.name)}</div>
            </div>
        `).join('');

        document.querySelectorAll('.surah-card').forEach(card => {
            card.addEventListener('click', () => openSurah(Number(card.dataset.surah)));
        });
    }

    function populateSurahSelect() {
        const select = $('surah-select');
        select.innerHTML = '<option value="">Select Surah</option>' +
            state.surahs.map(s => `<option value="${s.number}">${s.number}. ${escapeHTML(s.name)} — ${escapeHTML(s.englishName)}</option>`).join('');
    }

    function populateJuzSelect() {
        const select = $('juz-select');
        select.innerHTML = '<option value="">Select Juz</option>' +
            Array.from({length: 30}, (_, i) => `<option value="${i + 1}">Juz ${i + 1}</option>`).join('');
    }

    async function getPage(page, useCache = true) {
        page = Math.max(1, Math.min(TOTAL_PAGES, Number(page)));
        if (useCache && state.pageCache.has(page)) return state.pageCache.get(page);

        const data = await fetchJSON(`${API}/page/${page}/quran-uthmani`);
        state.pageCache.set(page, data);

        // Keep only current/previous/next page in memory.
        [page - 2, page + 2].forEach(p => {
            if (state.pageCache.has(p)) state.pageCache.delete(p);
        });
        return data;
    }

    function pageTitle(ayahs) {
        const first = ayahs?.[0];
        if (!first) return 'Mushaf';
        return first.surah?.englishName || first.surah?.name || 'Mushaf';
    }

    function renderPage(data, focusAyahNumber = null) {
        const ayahs = data.ayahs || [];
        const first = ayahs[0];
        const last = ayahs[ayahs.length - 1];

        if (first?.surah) {
            state.currentSurah = first.surah.number;
            $('current-surah-title').textContent = first.surah.englishName || first.surah.name;
        }

        const surahBreaks = [];
        ayahs.forEach((a, i) => {
            if (i === 0 || a.surah?.number !== ayahs[i - 1].surah?.number) {
                surahBreaks.push(a);
            }
        });

        const headings = surahBreaks.map(a => `
            <div class="mushaf-surah-heading">
                <span>${escapeHTML(a.surah?.name || '')}</span>
            </div>
            ${a.numberInSurah === 1 && a.surah?.number !== 9 ? '<div class="basmala">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>' : ''}
        `).join('');

        const text = ayahs.map(a => {
            const active = Number(a.number) === Number(focusAyahNumber) ? ' active-ayah' : '';
            return `<span class="mushaf-ayah${active}" data-ayah="${a.number}" data-surah="${a.surah?.number}" data-ayah-in-surah="${a.numberInSurah}" tabindex="0">${escapeHTML(a.text)} <span class="ayah-marker">${toArabicDigits(a.numberInSurah)}</span></span>`;
        }).join(' ');

        container.innerHTML = `
            <div class="mushaf-inner">
                ${headings}
                <div class="mushaf-text" lang="ar">${text}</div>
                <div class="mushaf-meta">
                    <span>Juz ${first?.juz || ''}</span>
                    <span>Hizb ${first?.hizbQuarter || ''}</span>
                    <span class="mushaf-page-number">${toArabicDigits(data.page || state.currentPage)}</span>
                    <span>${escapeHTML(pageTitle(ayahs))}</span>
                </div>
            </div>
        `;

        if (focusAyahNumber) {
            requestAnimationFrame(() => {
                const el = container.querySelector(`[data-ayah="${focusAyahNumber}"]`);
                if (el) el.scrollIntoView({behavior: 'smooth', block: 'center'});
            });
        }
    }

    function toArabicDigits(value) {
        return String(value).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
    }

    async function renderReaderPage(page, focusAyahNumber = null, pushHistory = true) {
        page = Math.max(1, Math.min(TOTAL_PAGES, Number(page) || 1));
        setLoading(true);
        try {
            const data = await getPage(page);
            state.currentPage = page;
            state.currentPageData = data;
            localStorage.setItem('noorCurrentPage', String(page));

            renderPage(data, focusAyahNumber);

            $('page-input').value = page;
            $('page-indicator').textContent = `${page} / ${TOTAL_PAGES}`;
            $('reader-status').textContent = `Page ${page} of ${TOTAL_PAGES}`;
            $('prev-page').disabled = page === 1;
            $('next-page').disabled = page === TOTAL_PAGES;
            $('prev-page-bottom').disabled = page === 1;
            $('next-page-bottom').disabled = page === TOTAL_PAGES;

            if (pushHistory) {
                const url = new URL(location.href);
                url.hash = `page-${page}`;
                history.replaceState(null, '', url);
            }

            // Prefetch only adjacent pages (lazy loading).
            Promise.allSettled([
                page > 1 ? getPage(page - 1) : Promise.resolve(),
                page < TOTAL_PAGES ? getPage(page + 1) : Promise.resolve()
            ]);

            updateBookmarkButton();
        } catch (error) {
            console.error('Failed to load Quran page:', error);
            container.innerHTML = `<div class="page-error">Unable to load this page. Please check your connection and try again.</div>`;
        } finally {
            setLoading(false);
        }
    }

    async function openSurah(surahNumber) {
        const surah = state.surahs.find(s => s.number === Number(surahNumber));
        if (!surah) return;

        try {
            // The Surah endpoint gives the canonical page field for its first ayah.
            const data = await fetchJSON(`${API}/surah/${surahNumber}/quran-uthmani`);
            const firstAyah = data.ayahs?.[0];
            const page = firstAyah?.page || 1;
            showView('reader');
            await renderReaderPage(page, firstAyah?.number, true);
        } catch (error) {
            console.error('Failed to open Surah:', error);
        }
    }

    async function openJuz(juz) {
        if (!juz) return;
        try {
            const data = await fetchJSON(`${API}/juz/${juz}/quran-uthmani`);
            const firstAyah = data.ayahs?.[0];
            showView('reader');
            await renderReaderPage(firstAyah?.page || 1, firstAyah?.number, true);
        } catch (error) {
            console.error('Failed to open Juz:', error);
        }
    }

    function showSearchResults(results) {
        const box = $('search-results');
        if (!results.length) {
            box.innerHTML = '<div class="search-empty">No Quran results found.</div>';
            box.classList.remove('hidden');
            return;
        }

        box.innerHTML = `
            <div class="search-results-header">Search Results</div>
            ${results.slice(0, 40).map((r, i) => `
                <button class="search-result" data-result-index="${i}">
                    <strong>${escapeHTML(r.surah?.name || r.surah?.englishName || '')}</strong>
                    <span>Ayah ${r.numberInSurah} • Page ${r.page}</span>
                    <p>${escapeHTML(r.text)}</p>
                </button>
            `).join('')}
        `;
        box.classList.remove('hidden');

        box.querySelectorAll('.search-result').forEach(btn => {
            btn.addEventListener('click', async () => {
                const r = results[Number(btn.dataset.resultIndex)];
                showView('reader');
                await renderReaderPage(r.page, r.number, true);
            });
        });
    }

    async function searchQuran(query) {
        const clean = query.trim();
        if (!clean) {
            $('search-results').classList.add('hidden');
            return;
        }

        try {
            const data = await fetchJSON(`${API}/search/${encodeURIComponent(clean)}/all/quran-uthmani`);
            showSearchResults(data.matches || []);
        } catch (error) {
            console.error('Search failed:', error);
            $('search-results').innerHTML = '<div class="search-empty">Search is temporarily unavailable.</div>';
            $('search-results').classList.remove('hidden');
        }
    }

    function updateBookmarkButton() {
        const bookmarks = JSON.parse(localStorage.getItem('noorBookmarks') || '[]');
        const exists = bookmarks.some(b => Number(b.page) === state.currentPage);
        $('bookmark-page').textContent = exists ? '★ Bookmarked' : '☆ Bookmark';
    }

    function saveCurrentPage() {
        const bookmarks = JSON.parse(localStorage.getItem('noorBookmarks') || '[]');
        const existing = bookmarks.findIndex(b => Number(b.page) === state.currentPage);

        if (existing >= 0) {
            bookmarks.splice(existing, 1);
        } else {
            bookmarks.push({
                page: state.currentPage,
                title: $('current-surah-title').textContent,
                createdAt: new Date().toISOString()
            });
        }

        localStorage.setItem('noorBookmarks', JSON.stringify(bookmarks));
        updateBookmarkButton();
        renderBookmarks();
    }

    function renderBookmarks() {
        const list = $('bookmarks-list');
        const bookmarks = JSON.parse(localStorage.getItem('noorBookmarks') || '[]');

        if (!bookmarks.length) {
            list.innerHTML = '<p class="empty-state">No bookmarks saved yet.</p>';
            return;
        }

        list.innerHTML = bookmarks
            .sort((a, b) => Number(a.page) - Number(b.page))
            .map(b => `
                <button class="bookmark-item" data-page="${b.page}">
                    <span>📖 Page ${b.page}</span>
                    <small>${escapeHTML(b.title || 'Mushaf')}</small>
                </button>
            `).join('');

        list.querySelectorAll('.bookmark-item').forEach(btn => {
            btn.addEventListener('click', async () => {
                showView('reader');
                await renderReaderPage(Number(btn.dataset.page));
            });
        });
    }

    function getPageAyahs() {
        return state.currentPageData?.ayahs || [];
    }

    function updatePlayerUI(status = null) {
        const ayah = state.currentAyah;
        $('floating-player').classList.toggle('hidden', !ayah && !state.isPlaying);

        if (ayah) {
            const surahName = ayah.surah?.englishName || ayah.surah?.name || 'Quran';
            $('player-title').textContent = `${surahName} • Ayah ${ayah.numberInSurah}`;
        }
        $('player-reciter').textContent = getReciterName(state.reciter);
        if (status) $('audio-status').textContent = status;
        $('player-play-pause').textContent = state.isPlaying ? '⏸' : '▶';
    }

    function getReciterName(id) {
        return {
            'ar.alafasy': 'Mishary Rashid Alafasy',
            'ar.abdulbasit': 'Abdul Basit',
            'ar.sudais': 'Abdurrahman As-Sudais'
        }[id] || id;
    }

    async function playAyah(ayah, options = {}) {
        if (!ayah) return;

        state.currentAyah = ayah;
        state.audioMode = options.mode || state.audioMode;
        state.isPlaying = false;
        updatePlayerUI('Loading audio…');

        try {
            // Direct CDN audio is stable and is documented by Al Quran Cloud.
            audio.src = `https://cdn.islamic.network/quran/audio/128/${encodeURIComponent(state.reciter)}/${ayah.number}.mp3`;
            audio.currentTime = 0;
            await audio.play();
            state.isPlaying = true;
            updatePlayerUI('Playing');
            await revealAyah(ayah);
        } catch (error) {
            console.error('Audio load/play error:', error);
            state.isPlaying = false;
            updatePlayerUI('Audio unavailable — try again');
        }
    }

    async function revealAyah(ayah) {
        showView('reader');
        if (Number(ayah.page) !== Number(state.currentPage)) {
            await renderReaderPage(ayah.page, ayah.number, false);
        } else {
            document.querySelectorAll('.mushaf-ayah').forEach(el => el.classList.remove('active-ayah'));
            const el = container.querySelector(`[data-ayah="${ayah.number}"]`);
            if (el) {
                el.classList.add('active-ayah');
                el.scrollIntoView({behavior: 'smooth', block: 'center'});
            }
        }
    }

    function playCurrentSurah() {
        const surahNumber = Number(state.currentSurah);
        if (!surahNumber) return;

        fetchJSON(`${API}/surah/${surahNumber}/quran-uthmani`)
            .then(data => {
                const ayahs = data.ayahs || [];
                if (!ayahs.length) return;
                state.audioMode = 'surah';
                state.currentAyahIndex = 0;
                playAyah(ayahs[0], {mode: 'surah'});
            })
            .catch(error => {
                console.error('Failed to load Surah audio list:', error);
                updatePlayerUI('Unable to load Surah');
            });
    }

    async function playAdjacentAyah(direction) {
        if (!state.currentAyah) return;

        const current = state.currentAyah;
        const surahNumber = Number(current.surah?.number);

        if (state.audioMode === 'surah') {
            try {
                const data = await fetchJSON(`${API}/surah/${surahNumber}/quran-uthmani`);
                const ayahs = data.ayahs || [];
                const index = ayahs.findIndex(a => Number(a.number) === Number(current.number));
                const nextIndex = index + direction;

                if (nextIndex >= 0 && nextIndex < ayahs.length) {
                    state.currentAyahIndex = nextIndex;
                    await playAyah(ayahs[nextIndex], {mode: 'surah'});
                } else if (direction > 0) {
                    state.isPlaying = false;
                    audio.pause();
                    updatePlayerUI('Surah finished');
                }
            } catch (error) {
                console.error(error);
            }
            return;
        }

        // For normal ayah mode, navigate within the current page.
        const ayahs = getPageAyahs();
        const index = ayahs.findIndex(a => Number(a.number) === Number(current.number));
        const next = ayahs[index + direction];

        if (next) {
            await playAyah(next, {mode: 'ayah'});
        }
    }

    audio.addEventListener('play', () => {
        state.isPlaying = true;
        updatePlayerUI('Playing');
    });

    audio.addEventListener('pause', () => {
        if (!audio.ended) {
            state.isPlaying = false;
            updatePlayerUI('Paused');
        }
    });

    audio.addEventListener('error', () => {
        state.isPlaying = false;
        updatePlayerUI('Audio error');
    });

    audio.addEventListener('ended', async () => {
        state.isPlaying = false;

        if (state.repeatAyah && state.currentAyah) {
            await playAyah(state.currentAyah, {mode: state.audioMode});
            return;
        }

        if (state.audioMode === 'surah') {
            await playAdjacentAyah(1);
        } else {
            await playAdjacentAyah(1);
        }
    });

    function togglePlayPause() {
        if (!state.currentAyah) {
            playCurrentSurah();
            return;
        }

        if (audio.paused) {
            audio.play().catch(() => updatePlayerUI('Unable to resume'));
        } else {
            audio.pause();
        }
    }

    function stopAudio() {
        audio.pause();
        audio.currentTime = 0;
        state.isPlaying = false;
        updatePlayerUI('Stopped');
    }

    // Navigation.
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            showView(btn.dataset.view);
            if (btn.dataset.view === 'bookmarks') renderBookmarks();
        });
    });

    $('prev-page').addEventListener('click', () => renderReaderPage(state.currentPage - 1));
    $('next-page').addEventListener('click', () => renderReaderPage(state.currentPage + 1));
    $('prev-page-bottom').addEventListener('click', () => renderReaderPage(state.currentPage - 1));
    $('next-page-bottom').addEventListener('click', () => renderReaderPage(state.currentPage + 1));

    $('go-page').addEventListener('click', () => renderReaderPage(Number($('page-input').value)));
    $('page-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') renderReaderPage(Number(e.target.value));
    });

    $('surah-select').addEventListener('change', e => {
        if (e.target.value) openSurah(Number(e.target.value));
        e.target.value = '';
    });

    $('juz-select').addEventListener('change', e => {
        if (e.target.value) openJuz(Number(e.target.value));
        e.target.value = '';
    });

    $('bookmark-page').addEventListener('click', saveCurrentPage);
    $('play-surah-audio').addEventListener('click', playCurrentSurah);
    $('audio-quick-play').addEventListener('click', () => {
        showView('reader');
        if (state.currentAyah) togglePlayPause();
        else playCurrentSurah();
    });

    $('player-play-pause').addEventListener('click', togglePlayPause);
    $('player-stop').addEventListener('click', stopAudio);
    $('player-next').addEventListener('click', () => playAdjacentAyah(1));
    $('player-previous').addEventListener('click', () => playAdjacentAyah(-1));
    $('player-repeat').addEventListener('click', () => {
        state.repeatAyah = !state.repeatAyah;
        $('player-repeat').classList.toggle('active-control', state.repeatAyah);
    });
    $('player-close').addEventListener('click', () => {
        stopAudio();
        $('floating-player').classList.add('hidden');
    });

    $('reciter-select').value = state.reciter;
    $('reciter-select').addEventListener('change', e => {
        state.reciter = e.target.value;
        localStorage.setItem('noorReciter', state.reciter);
        updatePlayerUI('Reciter changed');
        if (state.currentAyah) playAyah(state.currentAyah, {mode: state.audioMode});
    });

    themeToggle.addEventListener('click', () => {
        const html = document.documentElement;
        html.setAttribute('data-theme',
            html.getAttribute('data-theme') === 'emerald-dark' ? 'light' : 'emerald-dark'
        );
    });

    // Search.
    $('global-search').addEventListener('input', e => {
        clearTimeout(state.searchTimer);
        const query = e.target.value;
        state.searchTimer = setTimeout(() => searchQuran(query), 450);
    });

    // Click any ayah in the Mushaf to start its recitation.
    container.addEventListener('click', e => {
        const ayahEl = e.target.closest('.mushaf-ayah');
        if (!ayahEl) return;
        const number = Number(ayahEl.dataset.ayah);
        const ayah = getPageAyahs().find(a => Number(a.number) === number);
        if (ayah) playAyah(ayah, {mode: 'ayah'});
    });

    // Keyboard page navigation: Left = next, Right = previous.
    document.addEventListener('keydown', e => {
        if (e.target.matches('input, textarea, select')) return;
        if (state.currentView !== 'reader') return;

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            renderReaderPage(state.currentPage + 1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            renderReaderPage(state.currentPage - 1);
        } else if (e.key === ' ') {
            e.preventDefault();
            togglePlayPause();
        }
    });

    // Mobile swipe: left = next, right = previous.
    container.addEventListener('touchstart', e => {
        const t = e.changedTouches[0];
        state.touchStartX = t.clientX;
        state.touchStartY = t.clientY;
    }, {passive: true});

    container.addEventListener('touchend', e => {
        const t = e.changedTouches[0];
        const dx = t.clientX - state.touchStartX;
        const dy = t.clientY - state.touchStartY;
        if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy)) return;

        if (dx < 0) renderReaderPage(state.currentPage + 1);
        else renderReaderPage(state.currentPage - 1);
    }, {passive: true});

    // Font settings already present in the project.
    $('font-size-range').addEventListener('input', e => {
        document.documentElement.style.setProperty('--reader-font-size', `${e.target.value}px`);
        localStorage.setItem('noorFontSize', e.target.value);
    });

    $('font-family-select').addEventListener('change', e => {
        document.documentElement.style.setProperty('--font-arabic', `'${e.target.value}', serif`);
        localStorage.setItem('noorFontFamily', e.target.value);
    });

    // Filters already present in the original home view.
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const filter = tab.dataset.filter;
            if (filter === 'all') renderSurahs(state.surahs);
            else renderSurahs(state.surahs.filter(s => s.revelationType?.toLowerCase() === filter));
        });
    });

    // Tasbeeh.
    tasbeehCountEl.textContent = state.tasbeehCount;
    tasbeehBtn.addEventListener('click', () => {
        state.tasbeehCount++;
        tasbeehCountEl.textContent = state.tasbeehCount;
        localStorage.setItem('noorTasbeehCount', state.tasbeehCount);
    });

    tasbeehReset.addEventListener('click', () => {
        state.tasbeehCount = 0;
        tasbeehCountEl.textContent = state.tasbeehCount;
        localStorage.setItem('noorTasbeehCount', 0);
    });

    // Initial state.
    const savedFontSize = localStorage.getItem('noorFontSize');
    const savedFontFamily = localStorage.getItem('noorFontFamily');
    if (savedFontSize) {
        $('font-size-range').value = savedFontSize;
        document.documentElement.style.setProperty('--reader-font-size', `${savedFontSize}px`);
    }
    if (savedFontFamily) {
        $('font-family-select').value = savedFontFamily;
        document.documentElement.style.setProperty('--font-arabic', `'${savedFontFamily}', serif`);
    }

    populateJuzSelect();
    fetchSurahs();
    renderBookmarks();

    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => loadingScreen.remove(), 500);
    }, 800);

    // Restore last reading page.
    renderReaderPage(state.currentPage, null, false);
});
