# Quran Text Verification — v2.8

- Embedded Quran dataset contains 6236 ayahs across 114 surahs and 604 pages.
- Surah ayah counts match the embedded metadata.
- Ayah numbering within every surah is sequential from 1 to the declared count.
- No duplicate adjacent ayah texts were found.
- The display layer removes only the private `\\qt@no{...}` metadata marker and the Unicode pause glyphs `ۖ ۗ ۘ ۙ ۚ ۛ ۜ`.
- Quran letters and harakat are not normalized or rewritten for display.
- The source dataset is Uthmani-style text; authoritative verification should be done against a trusted Quran text source before publication.
