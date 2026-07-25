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

    // State Management
    const state = {
        currentView: 'home',
        surahs: [],
        currentSurah: 1,
        verses: [],
        reciter: 'ar.alafasy',
        theme: 'emerald-dark',
        tasbeehCount: 0
    };

    // DOM Elements
    const loadingScreen = document.getElementById('loading-screen');
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');
    const surahGrid = document.getElementById('surah-grid');
    const themeToggle = document.getElementById('theme-toggle');
    const tasbeehBtn = document.getElementById('tasbeeh-btn');
    const tasbeehCountEl = document.getElementById('tasbeeh-count');
    const tasbeehReset = document.getElementById('tasbeeh-reset');

    // Initialize App
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => loadingScreen.remove(), 500);
    }, 800);

    // Navigation Handler
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetView = btn.getAttribute('data-view');
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            views.forEach(v => v.classList.remove('active'));
            document.getElementById(`view-${targetView}`).classList.add('active');
            state.currentView = targetView;
        });
    });

    // Fetch Surahs from API
    async function fetchSurahs() {
        try {
            const response = await fetch('https://api.alquran.cloud/v1/surah');
            const data = await response.json();
            if (data.code === 200) {
                state.surahs = data.data;
                renderSurahs(state.surahs);
            }
        } catch (error) {
            console.error('Failed to fetch Surahs, loading local fallback structure.', error);
        }
    }

    // Render Surahs
    function renderSurahs(surahs) {
        surahGrid.innerHTML = surahs.map(surah => `
            <div class="surah-card" data-surah="${surah.number}">
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <div class="surah-number">${surah.number}</div>
                    <div class="surah-info">
                        <h4>${surah.englishName}</h4>
                        <p>${surah.englishNameTranslation} • ${surah.numberOfAyahs} Verses</p>
                    </div>
                </div>
                <div class="surah-arabic">${surah.name}</div>
            </div>
        `).join('');

        document.querySelectorAll('.surah-card').forEach(card => {
            card.addEventListener('click', () => {
                const surahNum = card.getAttribute('data-surah');
                loadSurahReader(surahNum);
            });
        });
    }

    // Load Surah Reader
    async function loadSurahReader(surahNumber) {
        try {
            const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,en.sahih`);
            const data = await response.json();
            if (data.code === 200) {
                const arabicVerses = data.data[0].ayahs;
                const englishVerses = data.data[1].ayahs;
                
                state.currentSurah = surahNumber;
                document.getElementById('current-surah-title').textContent = data.data[0].englishName;

                const container = document.getElementById('verses-container');
                container.innerHTML = arabicVerses.map((ayah, index) => `
                    <div class="verse-card">
                        <div class="verse-header">
                            <span>Ayah ${ayah.numberInSurah}</span>
                            <span>Juz ${ayah.juz}</span>
                        </div>
                        <div class="verse-arabic">${ayah.text}</div>
                        <div class="verse-translation">${englishVerses[index].text}</div>
                    </div>
                `).join('');

                // Switch to Reader View
                navButtons.forEach(b => b.classList.remove('active'));
                document.querySelector('[data-view="reader"]').classList.add('active');
                views.forEach(v => v.classList.remove('active'));
                document.getElementById('view-reader').classList.add('active');
            }
        } catch (error) {
            console.error('Failed to load verses.', error);
        }
    }

    // Theme Toggle
    themeToggle.addEventListener('click', () => {
        const html = document.documentElement;
        if (html.getAttribute('data-theme') === 'emerald-dark') {
            html.setAttribute('data-theme', 'light');
        } else {
            html.setAttribute('data-theme', 'emerald-dark');
        }
    });

    // Tasbeeh Logic
    tasbeehBtn.addEventListener('click', () => {
        state.tasbeehCount++;
        tasbeehCountEl.textContent = state.tasbeehCount;
    });

    tasbeehReset.addEventListener('click', () => {
        state.tasbeehCount = 0;
        tasbeehCountEl.textContent = state.tasbeehCount;
    });

    // Initial Data Fetch
    fetchSurahs();
});
