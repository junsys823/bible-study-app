# 📖 Bible Study E-Reader (圣经研读 · 和合本 / KJV)

[![Release](https://img.shields.io/badge/version-1.2.0-blue.svg)](https://github.com)
[![Android](https://img.shields.io/badge/Android-8.0%2B%20(API%2026%2B)-green.svg)](https://developer.android.com)
[![Device](https://img.shields.io/badge/Device-E--ink%20Optimized-orange.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A high-contrast, offline Bible study and daily prayer app meticulously crafted for **Android E-ink devices** (Hanvon Clear PA6, Onyx Boox, Meebook, Bigme, Kindle Fire) and standard Android devices.

Featuring pixel-perfect column pagination, hardware button page turns, trilingual Scripture support (**Chinese Union Version Traditional**, **CUV Simplified**, and **King James Version English**), and a structured 7-step **Daily Prayer Life Guide** with interactive card steppers.

---

## ✨ Key Features

### 1. 🌐 Trilingual Bible Engine (31,099 Verses)
- **和合本 繁體 (CUV Traditional)**: Authentic Chinese Union Version in Traditional Chinese.
- **和合本 简体 (CUV Simplified)**: Standard Simplified Chinese edition.
- **King James Version (KJV English)**: Complete 66 books (31,099 verses) with Strong's tags cleanly removed for natural reading typography.
- **One-Tap Cycle**: Seamlessly switch between `简` ➔ `繁` ➔ `EN` at any time across catalog, chapter selector, and scripture reader.

### 2. ⚡ Real Book Paginated Engine (E-ink Optimized)
- **Zero Column Peeking**: Engineered using single-viewport columns (`column-width: 100vw; column-gap: 0px`) and integer subpixel snap. No peeking of adjacent columns on refresh.
- **Continuous Flow**: Verses flow smoothly across pages like a printed book with inline superscript verse numbers (`sup.vn`), avoiding distracting per-verse line breaks.
- **Hardware Button Turns**: Turn pages instantly using physical buttons (`PAGE_DOWN` / `PAGE_UP`, `VOLUME_DOWN` / `VOLUME_UP`, or Back button).
- **Touch Zones**: Tap left 30% for previous page, tap right 35% for next page, and tap center 35% to toggle minimal navigation bars.
- **Font Sizing**: Live `A-` / `A+` font scaling saved to local preferences.

### 3. 👑 7-Step Daily Prayer Life Guide (with Card Steppers)
A structured prayer guide based on the Lord's Prayer declaration principles:
1. **✦ About This Guide / 关于本指南**: Transforming from "beggar" to "declarer".
2. **👑 God's 12 Names / 神的12个名字**: Interactive single-card view stepping through the 12 covenant names of God (Elohim, Yahweh, El-Shaddai, Adonai, Jehovah-Jireh, Rapha, Nissi, M'kaddesh, Shalom, Roi, Zidkenu, Shammah) with Praise Declarations and Extended Prayers.
3. **⚔️ God's Kingdom Comes / 国度权柄宣告**: 5-level card-by-card declarations (Self, Spouse, Family & Children, Church & Leaders, City & Nation).
4. **🍞 Daily Bread / 日用的饮食**: Abundance and supernatural provision declarations.
5. **🕊️ Saying Sorry & Forgiving / 赦免与饶恕**: Confession, repentance, and releasing forgiveness.
6. **🛡️ God's Armor Keeps Me Safe / 属灵军装保护**: Putting on the full armor of God, Ephesians 6:18-24, and Psalm 91 absolute protection.
7. **♾️ Praising God & Starting Again / 颂赞交托·循环**: Sovereign doxology and infinite prayer cycle.

### 4. 🔖 Bookmarks & Search
- Dual SQLite & LocalStorage persistent bookmarking with one tap.
- Instant full-text search across all 31,099 verses in Chinese and English.
- Automatic resume from last read chapter and page.

---

## 🏗️ Architecture & Tech Stack

```
com.bible.study.cuv/
├── src/com/bible/study/cuv/MainActivity.java  # Native Android WebView host + SQLite Bridge
├── assets/
│   ├── bible.db                               # 12.7 MB SQLite DB (31,101 verses, books index)
│   └── web/
│       ├── index.html                         # High-contrast E-ink DOM structure
│       ├── style.css                          # Pixel-perfect multi-column book layout
│       ├── prayer_data.js                     # 7-step prayer declarations (EN / SC / TC)
│       └── app.js                             # Client-side router, reader & pagination engine
├── res/                                       # App icon, values, strings
├── AndroidManifest.xml                        # Manifest (Target API 34, Min API 26)
└── build_apk.sh                               # Zero-dependency, 3-second CLI build script
```

---

## 🚀 How to Build

### Prerequisites
- JDK 17 (or JDK 8+)
- Android SDK (API 26+ platform, build-tools 34.0.0+)

### Fast CLI Build (Recommended)
You do not need Gradle installed. Run the portable build script directly:

```bash
chmod +x build_apk.sh
./build_apk.sh
```

The signed, zip-aligned APK will be output to:
```
outputs/Bible-Study.apk
```

### Install onto Device via ADB
```bash
adb install -r outputs/Bible-Study.apk
```

---

## 🗄️ Database Schema

The app ships with an offline SQLite database (`assets/bible.db`, version 3):

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

## 📄 License

This project is licensed under the [MIT License](LICENSE).
Scriptures are public domain (CUV 和合本 & King James Version).
