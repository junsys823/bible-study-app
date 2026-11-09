# 📖 Bible Study E-Reader (圣经研读 · 和合本 / KJV)

<div align="center">

[![Release](https://img.shields.io/github/v/release/junsys823/bible-study-app?color=brightgreen&label=Release)](https://github.com/junsys823/bible-study-app/releases/latest)
[![Download APK](https://img.shields.io/badge/Direct%20Download-APK%20(v1.2.0)-blue?logo=android)](https://github.com/junsys823/bible-study-app/releases/download/v1.2.0/Bible-Study.apk)
[![Android](https://img.shields.io/badge/Android-8.0%2B%20(API%2026%2B)-success.svg)](https://developer.android.com)
[![Device](https://img.shields.io/badge/E--ink-Optimized-orange.svg)](#-pixel-perfect-e-ink-experience)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Stars](https://img.shields.io/github/stars/junsys823/bible-study-app?style=social)](https://github.com/junsys823/bible-study-app)

**A high-contrast, zero-latency, offline Bible study and daily prayer app meticulously engineered for Android E-ink readers and tablets.**

[📥 Download Latest APK (v1.2.0)](https://github.com/junsys823/bible-study-app/releases/download/v1.2.0/Bible-Study.apk) · [🌟 Star on GitHub](https://github.com/junsys823/bible-study-app) · [💬 Report Issue](https://github.com/junsys823/bible-study-app/issues)

</div>

---

## 💡 Why This App?

Most existing Bible apps are built for LCD/OLED mobile phones with colorful animations, continuous smooth-scrolling feeds, small line heights, and online network dependencies. When used on **E-ink electronic paper displays (Hanvon, Onyx Boox, Meebook, Kindle Fire, Bigme)**, they suffer from:
- ❌ Constant ghosting and slow screen refreshes due to vertical scrolling.
- ❌ Distracting multi-column peeking or chopped sentences on page boundaries.
- ❌ High battery drain and intrusive network trackers.

**Bible Study E-Reader solves this completely:**
- ✅ **Real Book Paginated Engine**: Renders text into pure horizontal book pages with zero column peeking and continuous sentence flow.
- ✅ **Hardware Button Page Turns**: Turn pages with physical side buttons (`Volume Up/Down`, `Page Up/Down`) or invisible screen-edge touch zones.
- ✅ **100% Offline & Lightweight**: Embedded 12.7 MB SQLite database containing 31,099 verses across 3 translations. No account, no internet, zero tracking.
- ✅ **Trilingual Scripture Switcher**: Instant one-tap cycle between **和合本繁體 (CUV Traditional)**, **和合本简体 (CUV Simplified)**, and **King James Version (KJV English)**.
- ✅ **Structured 7-Step Daily Prayer Guide**: Bilingual interactive prayer life guide featuring card-by-card steppers for God's 12 Names and Kingdom Authority declarations.

---

## ✨ Key Features

### 1. 🌐 Trilingual Scripture Engine (31,099 Verses)
- **和合本 繁體 (CUV Traditional)**: Classical Chinese Union Version in traditional characters.
- **和合本 简体 (CUV Simplified)**: Standard Simplified Chinese edition.
- **King James Version (KJV English)**: Complete 66 books (31,099 verses) with Strong's tags cleanly removed for natural English typography.
- **Instant Cycle**: A single compact badge (`简` ➔ `繁` ➔ `EN`) instantly translates catalog, chapters, search, and reading view.

### 2. ⚡ Pixel-Perfect E-ink Experience
- **Zero Column Peeking**: Custom CSS multi-column pagination engineered with subpixel boundaries (`column-width: 100vw; column-gap: 0px`). Next/previous pages never peek through the edges.
- **Continuous Flow**: Verses flow smoothly across paragraphs like a real printed Bible, using delicate superscript numbers (`sup.vn`) instead of abrupt line breaks.
- **Physical Button Support**: Instant hardware key mapping for `KEYCODE_PAGE_DOWN`, `KEYCODE_PAGE_UP`, `KEYCODE_VOLUME_DOWN`, and `KEYCODE_VOLUME_UP`.
- **E-ink Pure Black/White Theme**: Maximum visual clarity in any ambient lighting condition with zero backlight strain.
- **Quick Font Scaling**: Live `A-` / `A+` font adjustments saved persistently.

### 3. 👑 7-Step Daily Prayer Life Guide (with Card Steppers)
A comprehensive spiritual ladder based on the Lord's Prayer declaration principles:
1. **✦ About This Guide / 关于本指南**: Transition from a passive "beggar" to a kingdom "declarer".
2. **👑 God's 12 Names / 神的12个名字**: Interactive single-card view walking through God's 12 covenant names (*Elohim, Yahweh, El-Shaddai, Adonai, Jireh, Rapha, Nissi, M'kaddesh, Shalom, Roi, Zidkenu, Shammah*) with Praise Declarations & Extended Prayers.
3. **⚔️ God's Kingdom Comes / 国度权柄宣告**: 5-level card-by-card declarations (Self, Spouse, Family & Children, Church & Leaders, City & Nation).
4. **🍞 Daily Bread / 日用的饮食**: Abundance and supernatural provision declarations.
5. **🕊️ Saying Sorry & Forgiving / 赦免与饶恕**: Confession, repentance, and releasing forgiveness.
6. **🛡️ God's Armor Keeps Me Safe / 属灵军装保护**: Putting on the full armor of God, Ephesians 6:18-24, and Psalm 91 absolute protection.
7. **♾️ Praising God & Starting Again / 颂赞交托·循环**: Sovereign doxology and infinite prayer cycle.

### 4. 🔖 Bookmarks & Instant Search
- **One-Tap Bookmarks**: Mark any page with a single tap; persistent SQLite storage + LocalStorage dual cache.
- **Instant Keyword Search**: Fast multi-lingual full-text query across all 31,099 verses in Chinese and English.
- **Continue Reading**: Automatically remembers and resumes your exact book, chapter, and page.

---

## 📱 Hardware Tested & Compatible Devices

- **Hanvon (汉王)**: Clear, Clear 6, Clear 7, PA6, N10 series.
- **Onyx Boox (文石)**: Poke, Leaf, Page, Palma, Nova, Note, Tab series.
- **Meebook / Boyue (博阅)**: M6, M7, P78 Pro, P10.
- **Kindle Fire / Amazon Tablets** (with Android sideloading enabled).
- **Any Android 8.0+ (API 26+) Phone, Tablet, or E-reader**.

---

## 🏗️ Architecture & Tech Stack

```
com.bible.study.cuv/
├── src/com/bible/study/cuv/MainActivity.java  # Lightweight Native Android host + SQLite Bridge
├── assets/
│   ├── bible.db                               # 12.7 MB SQLite DB (31,101 verses, books index)
│   └── web/
│       ├── index.html                         # High-contrast E-ink DOM structure
│       ├── style.css                          # Pixel-perfect multi-column book layout
│       ├── prayer_data.js                     # 7-step prayer declarations (EN / SC / TC)
│       └── app.js                             # Client-side router, reader & pagination engine
├── res/                                       # High-res vector and raster launcher icons
├── AndroidManifest.xml                        # Manifest (Target API 34, Min API 26)
├── build_apk.sh                               # Portable, zero-dependency 3-second CLI build script
└── build.gradle                               # Standard Gradle configuration for Android Studio
```

---

## 🚀 Quick Start / How to Build

### Option 1: Install Pre-built APK (Fastest)
1. Download [`Bible-Study.apk`](https://github.com/junsys823/bible-study-app/releases/download/v1.2.0/Bible-Study.apk) directly from the Releases page.
2. Sideload onto your E-reader via USB or file manager and click install.

### Option 2: Fast CLI Build (Zero Gradle Dependencies)
```bash
git clone https://github.com/junsys823/bible-study-app.git
cd bible-study-app
chmod +x build_apk.sh
./build_apk.sh
```
The output signed APK will be generated at `outputs/Bible-Study.apk` in ~3 seconds.

### Option 3: Android Studio
Open the repository folder directly in Android Studio and click **Run** (▶) or `Build > Build Bundle(s) / APK(s)`.

---

## 🗄️ Database Schema

The app ships with a self-contained offline SQLite database (`assets/bible.db`, version 3):

```sql
CREATE TABLE books (
    id INTEGER PRIMARY KEY,
    name_cn TEXT,        -- Traditional Chinese name (e.g. 馬可福音)
    name_cns TEXT,       -- Simplified Chinese name (e.g. 马可福音)
    name_en TEXT,        -- English name (e.g. Mark)
    abbr_cn TEXT,        -- Traditional abbreviation (e.g. 可)
    abbr_cns TEXT,       -- Simplified abbreviation (e.g. 可)
    abbr_en TEXT,        -- English abbreviation (e.g. Mk)
    chapters INTEGER,    -- Chapter count
    testament TEXT,      -- 'OT' or 'NT'
    section_cn TEXT,     -- Traditional section (e.g. 四福音書)
    section_cns TEXT,    -- Simplified section (e.g. 四福音书)
    section_en TEXT      -- English section (e.g. Gospels)
);

CREATE TABLE verses (
    book INTEGER,
    chapter INTEGER,
    verse INTEGER,
    text_cn TEXT,        -- CUV Traditional
    text_cns TEXT,       -- CUV Simplified
    text_en TEXT,        -- KJV English
    PRIMARY KEY (book, chapter, verse)
);

CREATE TABLE bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book INTEGER,
    chapter INTEGER,
    verse INTEGER,
    title TEXT,
    snippet TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE last_read (
    id INTEGER PRIMARY KEY,
    book INTEGER,
    chapter INTEGER,
    verse INTEGER,
    updated_at DATETIME
);
```

---

## 🤝 Contributing

Contributions, feature requests, and bug reports are warmly welcome!
- Give a ⭐️ star if this project helps your spiritual reading journey!
- Open an [Issue](https://github.com/junsys823/bible-study-app/issues) for feedback or device testing reports.

---

## 📄 License

This project is open-sourced under the [MIT License](LICENSE).  
Scriptures are public domain (和合本 Chinese Union Version & King James Version).
