
/*
 * Noor Al-Quran — Adhkar
 * The repeat counts below follow commonly used narrations compiled in Hisn Al-Muslim.
 * Source reference for the developer: https://hisnmuslim.com/
 *
 * UI behavior:
 * - Each dhikr has its own fixed repeat count.
 * - Once the required count is reached, the counter is locked.
 * - The user must press "التالي" to move to the next dhikr.
 * - A short offline Web Audio tone is played on each tap.
 */
(function () {
    'use strict';

    const DATA = {
        morning: {
            title: 'أذكار الصباح',
            icon: '☀',
            items: [
                {
                    label: 'آية الكرسي',
                    count: 1,
                    text: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ.'
                },
                {
                    label: 'المعوذات',
                    count: 3,
                    surahs: [
                        {
                            name: 'سورة الإخلاص',
                            text: `قُلْ هُوَ ٱللَّهُ أَحَدٌ ۝١
ٱللَّهُ ٱلصَّمَدُ ۝٢
لَمْ يَلِدْ وَلَمْ يُولَدْ ۝٣
وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌ ۝٤`
                        },
                        {
                            name: 'سورة الفلق',
                            text: `قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ ۝١
مِن شَرِّ مَا خَلَقَ ۝٢
وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝٣
وَمِن شَرِّ ٱلنَّفَّـٰثَـٰتِ فِى ٱلْعُقَدِ ۝٤
وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ ۝٥`
                        },
                        {
                            name: 'سورة الناس',
                            text: `قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ ۝١
مَلِكِ ٱلنَّاسِ ۝٢
إِلَـٰهِ ٱلنَّاسِ ۝٣
مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ ۝٤
ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ ۝٥
مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ ۝٦`
                        }
                    ]
                },
                {
                    label: 'دعاء التوكل',
                    count: 7,
                    text: 'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ ۖ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ.'
                },
                {
                    label: 'الحفظ من الضرر',
                    count: 3,
                    text: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ.'
                },
                {
                    label: 'الرضا بالله',
                    count: 3,
                    text: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا.'
                },
                {
                    label: 'التسبيح',
                    count: 100,
                    text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ.'
                },
                {
                    label: 'التهليل',
                    count: 10,
                    text: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ.'
                },
                {
                    label: 'تسبيح خاص',
                    count: 3,
                    text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ.'
                }
            ]
        },
        evening: {
            title: 'أذكار المساء',
            icon: '☾',
            items: [
                {
                    label: 'آية الكرسي',
                    count: 1,
                    text: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ.'
                },
                {
                    label: 'المعوذات',
                    count: 3,
                    surahs: [
                        {
                            name: 'سورة الإخلاص',
                            text: `قُلْ هُوَ ٱللَّهُ أَحَدٌ ۝١
ٱللَّهُ ٱلصَّمَدُ ۝٢
لَمْ يَلِدْ وَلَمْ يُولَدْ ۝٣
وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌ ۝٤`
                        },
                        {
                            name: 'سورة الفلق',
                            text: `قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ ۝١
مِن شَرِّ مَا خَلَقَ ۝٢
وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝٣
وَمِن شَرِّ ٱلنَّفَّـٰثَـٰتِ فِى ٱلْعُقَدِ ۝٤
وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ ۝٥`
                        },
                        {
                            name: 'سورة الناس',
                            text: `قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ ۝١
مَلِكِ ٱلنَّاسِ ۝٢
إِلَـٰهِ ٱلنَّاسِ ۝٣
مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ ۝٤
ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ ۝٥
مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ ۝٦`
                        }
                    ]
                },
                {
                    label: 'الاستعاذة من الكفر والفقر',
                    count: 3,
                    text: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ، وَالْفَقْرِ، وَأَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ، لَا إِلَهَ إِلَّا أَنْتَ.'
                },
                {
                    label: 'دعاء التوكل',
                    count: 7,
                    text: 'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ ۖ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ.'
                },
                {
                    label: 'الحفظ من الضرر',
                    count: 3,
                    text: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ.'
                },
                {
                    label: 'الرضا بالله',
                    count: 3,
                    text: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا.'
                },
                {
                    label: 'التسبيح',
                    count: 100,
                    text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ.'
                },
                {
                    label: 'التهليل',
                    count: 10,
                    text: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ.'
                },
                {
                    label: 'الاستعاذة عند المساء',
                    count: 3,
                    text: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ.'
                }
            ]
        },
        sleep: {
            title: 'أذكار النوم',
            icon: '◐',
            items: [
                {
                    label: 'المعوذات',
                    count: 3,
                    surahs: [
                        {
                            name: 'سورة الإخلاص',
                            text: `قُلْ هُوَ ٱللَّهُ أَحَدٌ ۝١
ٱللَّهُ ٱلصَّمَدُ ۝٢
لَمْ يَلِدْ وَلَمْ يُولَدْ ۝٣
وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌ ۝٤`
                        },
                        {
                            name: 'سورة الفلق',
                            text: `قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ ۝١
مِن شَرِّ مَا خَلَقَ ۝٢
وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝٣
وَمِن شَرِّ ٱلنَّفَّـٰثَـٰتِ فِى ٱلْعُقَدِ ۝٤
وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ ۝٥`
                        },
                        {
                            name: 'سورة الناس',
                            text: `قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ ۝١
مَلِكِ ٱلنَّاسِ ۝٢
إِلَـٰهِ ٱلنَّاسِ ۝٣
مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ ۝٤
ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ ۝٥
مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ ۝٦`
                        }
                    ]
                },
                {
                    label: 'آية الكرسي',
                    count: 1,
                    text: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ.'
                },
                {
                    label: 'دعاء النوم',
                    count: 1,
                    text: 'بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا، بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ.'
                },
                {
                    label: 'دعاء العافية',
                    count: 1,
                    text: 'اللَّهُمَّ إِنَّكَ خَلَقْتَ نَفْسِي وَأَنْتَ تَوَفَّاهَا، لَكَ مَمَاتُهَا وَمَحْيَاهَا، إِنْ أَحْيَيْتَهَا فَاحْفَظْهَا، وَإِنْ أَمَتَّهَا فَاغْفِرْ لَهَا. اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ.'
                },
                {
                    label: 'دعاء الوقاية',
                    count: 1,
                    text: 'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ.'
                },
                {
                    label: 'باسمك اللهم أموت وأحيا',
                    count: 1,
                    text: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا.'
                },
                {
                    label: 'التسبيح قبل النوم',
                    count: 33,
                    text: 'سُبْحَانَ اللَّهِ.'
                },
                {
                    label: 'التحميد قبل النوم',
                    count: 33,
                    text: 'الْحَمْدُ لِلَّهِ.'
                },
                {
                    label: 'التكبير قبل النوم',
                    count: 34,
                    text: 'اللَّهُ أَكْبَرُ.'
                },
                {
                    label: 'دعاء الاستسلام',
                    count: 1,
                    text: 'اللَّهُمَّ أَسْلَمْتُ نَفْسِي إِلَيْكَ، وَفَوَّضْتُ أَمْرِي إِلَيْكَ، وَوَجَّهْتُ وَجْهِي إِلَيْكَ، وَأَلْجَأْتُ ظَهْرِي إِلَيْكَ، رَغْبَةً وَرَهْبَةً إِلَيْكَ، لَا مَلْجَأَ وَلَا مَنْجَا مِنْكَ إِلَّا إِلَيْكَ، آمَنْتُ بِكِتَابِكَ الَّذِي أَنْزَلْتَ، وَبِنَبِيِّكَ الَّذِي أَرْسَلْتَ.'
                }
            ]
        },
        prayer: {
            title: 'أذكار الصلاة',
            icon: '🕌',
            items: [
                {
                    label: 'الاستغفار',
                    count: 3,
                    text: 'أَسْتَغْفِرُ اللَّهَ.'
                },
                {
                    label: 'السلام',
                    count: 1,
                    text: 'اللَّهُمَّ أَنْتَ السَّلَامُ، وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ.'
                },
                {
                    label: 'التوحيد',
                    count: 3,
                    text: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ. اللَّهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ، وَلَا مُعْطِيَ لِمَا مَنَعْتَ، وَلَا يَنْفَعُ ذَا الْجَدِّ مِنْكَ الْجَدُّ.'
                },
                {
                    label: 'الذكر بعد الصلاة',
                    count: 1,
                    text: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ. لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ، لَا إِلَهَ إِلَّا اللَّهُ، وَلَا نَعْبُدُ إِلَّا إِيَّاهُ، لَهُ النِّعْمَةُ وَلَهُ الْفَضْلُ وَلَهُ الثَّنَاءُ الْحَسَنُ، لَا إِلَهَ إِلَّا اللَّهُ مُخْلِصِينَ لَهُ الدِّينَ وَلَوْ كَرِهَ الْكَافِرُونَ.'
                },
                {
                    label: 'التسبيح',
                    count: 33,
                    text: 'سُبْحَانَ اللَّهِ.'
                },
                {
                    label: 'التحميد',
                    count: 33,
                    text: 'الْحَمْدُ لِلَّهِ.'
                },
                {
                    label: 'التكبير',
                    count: 33,
                    text: 'اللَّهُ أَكْبَرُ.'
                },
                {
                    label: 'خاتمة التسبيح',
                    count: 1,
                    text: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ.'
                },
                {
                    label: 'المعوذات',
                    count: 1,
                    surahs: [
                        {
                            name: 'سورة الإخلاص',
                            text: `قُلْ هُوَ ٱللَّهُ أَحَدٌ ۝١
ٱللَّهُ ٱلصَّمَدُ ۝٢
لَمْ يَلِدْ وَلَمْ يُولَدْ ۝٣
وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌ ۝٤`
                        },
                        {
                            name: 'سورة الفلق',
                            text: `قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ ۝١
مِن شَرِّ مَا خَلَقَ ۝٢
وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝٣
وَمِن شَرِّ ٱلنَّفَّـٰثَـٰتِ فِى ٱلْعُقَدِ ۝٤
وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ ۝٥`
                        },
                        {
                            name: 'سورة الناس',
                            text: `قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ ۝١
مَلِكِ ٱلنَّاسِ ۝٢
إِلَـٰهِ ٱلنَّاسِ ۝٣
مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ ۝٤
ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ ۝٥
مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ ۝٦`
                        }
                    ]
                },
                {
                    label: 'آية الكرسي',
                    count: 1,
                    text: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ.'
                }
            ]
        }
    };

    const state = {
        category: null,
        itemIndex: 0,
        count: 0
    };

    const $ = id => document.getElementById(id);
    const categories = $('adhkar-categories');
    const reader = $('adhkar-reader');
    const title = $('adhkar-category-title');
    const itemProgress = $('adhkar-item-progress');
    const itemLabel = $('adhkar-item-label');
    const required = $('adhkar-required');
    const text = $('adhkar-text');
    const countEl = $('adhkar-count');
    const targetEl = $('adhkar-target-count');
    const progressBar = $('adhkar-progress-bar');
    const countBtn = $('adhkar-count-btn');
    const nextBtn = $('adhkar-next-btn');
    const backBtn = $('adhkar-back');

    function playSoftTap() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 720;
            gain.gain.setValueAtTime(0.0001, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 0.008);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.055);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.06);
            setTimeout(() => ctx.close().catch(() => {}), 120);
        } catch (_) {}
    }

    function showCategories() {
        categories.classList.remove('hidden');
        reader.classList.add('hidden');
        state.category = null;
        state.itemIndex = 0;
        state.count = 0;
    }

    function formatTimes(n) {
        return n === 1 ? 'مرة واحدة' : `${n} مرات`;
    }

    function renderQuranSurahs(surahs) {
        return surahs.map(surah => `
            <section class="adhkar-surah">
                <h3>${surah.name}</h3>
                <div class="adhkar-surah-text">${surah.text.replace(/\n/g, '<br>')}</div>
            </section>
        `).join('');
    }

    function renderItem() {
        const group = DATA[state.category];
        const item = group.items[state.itemIndex];
        state.count = 0;

        title.textContent = `${group.icon} ${group.title}`;
        itemProgress.textContent = `الذكر ${state.itemIndex + 1} من ${group.items.length}`;
        itemLabel.textContent = item.label;
        required.textContent = formatTimes(item.count);
        if (item.surahs) {
            text.innerHTML = renderQuranSurahs(item.surahs);
            text.classList.add('adhkar-quran-text');
        } else {
            text.textContent = item.text;
            text.classList.remove('adhkar-quran-text');
        }
        countEl.textContent = '0';
        targetEl.textContent = String(item.count);
        progressBar.style.width = '0%';

        countBtn.disabled = false;
        countBtn.classList.remove('hidden');
        nextBtn.classList.add('hidden');
        countBtn.textContent = item.count === 1 ? 'تمت قراءة الذكر' : 'تكرار الذكر';
    }

    function openCategory(key) {
        if (!DATA[key]) return;
        state.category = key;
        state.itemIndex = 0;
        categories.classList.add('hidden');
        reader.classList.remove('hidden');
        renderItem();
    }

    function finishItem() {
        countBtn.disabled = true;
        countBtn.textContent = 'تم إكمال العدد ✓';
        countBtn.classList.add('adhkar-completed');
        nextBtn.classList.remove('hidden');
    }

    document.querySelectorAll('[data-adhkar-category]').forEach(btn => {
        btn.addEventListener('click', () => openCategory(btn.dataset.adhkarCategory));
    });

    countBtn.addEventListener('click', () => {
        const item = DATA[state.category].items[state.itemIndex];
        if (state.count >= item.count) return;

        state.count += 1;
        countEl.textContent = String(state.count);
        progressBar.style.width = `${Math.min(100, (state.count / item.count) * 100)}%`;
        playSoftTap();
        if (navigator.vibrate) navigator.vibrate(12);

        if (state.count >= item.count) finishItem();
    });

    nextBtn.addEventListener('click', () => {
        const group = DATA[state.category];
        if (state.itemIndex < group.items.length - 1) {
            state.itemIndex += 1;
            renderItem();
        } else {
            showCategories();
            alert('أحسنت، أتممت أذكار هذا القسم 🤍');
        }
    });

    backBtn.addEventListener('click', showCategories);

    // Expose only a tiny bridge for the main app if needed later.
    window.NoorAdhkar = {
        openCategory,
        showCategories
    };
})();
