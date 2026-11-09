// ============================================================
// Bible Study App Client Engine (Paginated Book Edition)
// Optimized for E-ink Reader (Hanvon Clear)
// Supports: Traditional Chinese (和合本繁體) & Simplified Chinese (和合本简体)
// Features: 66 Books, Daily Prayer Guide (7 Steps with Card Mode), Bookmarks, Search
// ============================================================

let currentLang = localStorage.getItem('bible_lang') || 'sc'; // 'sc' (简体), 'tc' (繁體), or 'en' (English KJV)
if (currentLang !== 'sc' && currentLang !== 'tc' && currentLang !== 'en') {
  currentLang = 'sc';
}
let currentBook = null;
let currentChapter = 1;
let currentPage = 0;
let totalPages = 1;
let allBooks = [];
let currentPrayerStepIdx = 0;
let currentNameCardIdx = 0;     // 0 to 11 for God's 12 Names
let currentKingdomCardIdx = 0;  // 0 to 4 for Kingdom declarations
let viewHistory = ['catalog'];  // Navigation stack

document.addEventListener('DOMContentLoaded', () => {
  loadSavedFontSize();
  updateLanguageUI();
  initApp();
  renderPrayerGuide();
  window.addEventListener('resize', () => {
    if (viewHistory[viewHistory.length - 1] === 'reader') {
      recalculatePages();
    }
  });
});

function initApp() {
  try {
    if (window.BibleBridge) {
      const catData = window.BibleBridge.getCategories();
      allBooks = JSON.parse(catData || '[]');
      renderCatalog();
      updateContinueCard();
    }
  } catch (e) {
    console.error('Init error:', e);
  }
}

// -------------------------------------------------------------
// Language Localization Management
// -------------------------------------------------------------
function toggleLanguage() {
  if (currentLang === 'sc') {
    currentLang = 'tc';
  } else if (currentLang === 'tc') {
    currentLang = 'en';
  } else {
    currentLang = 'sc';
  }
  localStorage.setItem('bible_lang', currentLang);
  updateLanguageUI();

  // Re-render views
  renderCatalog();
  updateContinueCard();
  renderPrayerGuide();

  const currentView = viewHistory[viewHistory.length - 1];

  // If in chapter selector view
  if (currentView === 'chapters' && currentBook) {
    openChapterSelector(currentBook.id);
  }

  // If in reader view
  if (currentView === 'reader' && currentBook) {
    const savedPage = currentPage;
    openChapter(currentBook.id, currentChapter, savedPage);
  }

  // If in bookmarks tab
  const activeTab = document.querySelector('.tab-btn.active');
  if (activeTab && activeTab.dataset.tab === 'bm') {
    loadBookmarks();
  }
}

function updateLanguageUI() {
  const isEn = currentLang === 'en';
  const isSc = currentLang === 'sc';

  // Compact version badge for language: 简 | 繁 | EN
  const toggleText = isEn ? 'EN' : (isSc ? '简' : '繁');
  const langHint = isEn ? 'Version: KJV English (Tap to switch)' : (isSc ? '版本：和合本简体 (点击切换)' : '版本：和合本繁體 (點擊切換)');
  ['catalogLangBtn', 'chapLangBtn', 'readerLangBtn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = toggleText;
      el.title = langHint;
    }
  });

  // App header titles
  const mainTitle = document.getElementById('appMainTitle');
  if (mainTitle) {
    if (isEn) mainTitle.textContent = 'Bible Study · KJV';
    else if (isSc) mainTitle.textContent = '圣经研读 · 和合本';
    else mainTitle.textContent = '聖經研讀 · 和合本';
  }

  // Compact exit button with universal symbol
  const exitBtn = document.getElementById('appExitBtn');
  if (exitBtn) {
    exitBtn.textContent = '⏻';
    exitBtn.title = isEn ? 'Exit App' : '退出应用';
  }

  const verBadge = document.getElementById('appVersionBadge');
  if (verBadge) verBadge.textContent = 'v1.2';

  // Tabs
  const tabOT = document.getElementById('tabOT');
  if (tabOT) tabOT.textContent = isEn ? 'Old Testament (39)' : (isSc ? '旧约全书 (39)' : '舊約全書 (39)');

  const tabNT = document.getElementById('tabNT');
  if (tabNT) tabNT.textContent = isEn ? 'New Testament (27)' : (isSc ? '新约全书 (27)' : '新約全書 (27)');

  const tabPrayer = document.getElementById('tabPrayer');
  if (tabPrayer) tabPrayer.textContent = isEn ? 'Daily Prayer (🙏)' : (isSc ? '每日祷告 (🙏)' : '每日禱告 (🙏)');

  const tabBM = document.getElementById('tabBM');
  if (tabBM) tabBM.textContent = isEn ? 'Bookmarks (🔖)' : (isSc ? '书签 (🔖)' : '書籤 (🔖)');

  const tabSearch = document.getElementById('tabSearch');
  if (tabSearch) tabSearch.textContent = isEn ? 'Search (🔍)' : (isSc ? '搜索 (🔍)' : '搜尋 (🔍)');

  // Continue Card
  const contBadge = document.getElementById('continueBadge');
  if (contBadge) contBadge.textContent = isEn ? '📖 Continue Reading' : (isSc ? '📖 继续上次阅读' : '📖 繼續上次閱讀');

  const contArrow = document.getElementById('continueArrow');
  if (contArrow) contArrow.textContent = isEn ? 'Click to continue ➔' : (isSc ? '点击继续 ➔' : '點擊繼續 ➔');

  // Section titles
  const bmTitle = document.getElementById('bmSectionTitle');
  if (bmTitle) bmTitle.textContent = isEn ? 'My Bookmarks' : (isSc ? '我的圣经书签' : '我的聖經書籤');

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.placeholder = isEn 
      ? 'Search scripture keywords (e.g. love, beginning, faith)...' 
      : (isSc ? '搜索经文关键字 (例如：爱、起初、信心)...' : '搜尋經文關鍵字 (例如：愛、起初、信心)...');
  }

  const searchSubmitBtn = document.getElementById('searchSubmitBtn');
  if (searchSubmitBtn) searchSubmitBtn.textContent = isEn ? 'Search' : (isSc ? '搜索' : '搜尋');

  // Chapter view
  const chapBackBtn = document.getElementById('chapBackBtn');
  if (chapBackBtn) chapBackBtn.textContent = isEn ? '← Catalog' : (isSc ? '← 目录' : '← 目錄');

  const selectChapTitle = document.getElementById('selectChapTitle');
  if (selectChapTitle) selectChapTitle.textContent = isEn ? 'Select Chapter:' : (isSc ? '选择章节：' : '選擇章節：');

  // Reader view
  const readerBackBtn = document.getElementById('readerBackBtn');
  if (readerBackBtn) readerBackBtn.textContent = isEn ? '← Chapters' : (isSc ? '← 章节' : '← 章節');

  const btnBookmarkPage = document.getElementById('btnBookmarkPage');
  if (btnBookmarkPage) btnBookmarkPage.textContent = isEn ? '🔖 Bookmark' : (isSc ? '🔖 书签' : '🔖 書籤');

  const readerPrevChapBtn = document.getElementById('readerPrevChapBtn');
  if (readerPrevChapBtn) readerPrevChapBtn.textContent = isEn ? '◀ Prev Chapter' : '◀ 上一章';

  const readerCatalogBtn = document.getElementById('readerCatalogBtn');
  if (readerCatalogBtn) readerCatalogBtn.textContent = isEn ? 'Chapters' : (isSc ? '选章目录' : '選章目錄');

  const readerNextChapBtn = document.getElementById('readerNextChapBtn');
  if (readerNextChapBtn) readerNextChapBtn.textContent = isEn ? 'Next Chapter ▶' : '下一章 ▶';

  updatePageIndicator();
}

// -------------------------------------------------------------
// Catalog & Topics Rendering
// -------------------------------------------------------------
function renderCatalog() {
  const otContainer = document.getElementById('otSectionsContainer');
  const ntContainer = document.getElementById('ntSectionsContainer');
  if (!otContainer || !ntContainer) return;

  const otBooks = allBooks.filter(b => b.testament === 'OT');
  const ntBooks = allBooks.filter(b => b.testament === 'NT');

  otContainer.innerHTML = buildGroupedHtml(otBooks);
  ntContainer.innerHTML = buildGroupedHtml(ntBooks);
}

function buildGroupedHtml(books) {
  const isEn = currentLang === 'en';
  const isSc = currentLang === 'sc';
  const groups = {};
  books.forEach(b => {
    const sec = isEn ? (b.section_en || b.section_cn) : (isSc ? (b.section_cns || b.section_cn) : b.section_cn);
    if (!groups[sec]) groups[sec] = [];
    groups[sec].push(b);
  });

  let html = '';
  for (const [sectionName, bList] of Object.entries(groups)) {
    const countText = isEn ? (bList.length === 1 ? '1 book' : `${bList.length} books`) : `${bList.length} 卷`;
    html += `
      <div class="topic-group">
        <div class="topic-header">
          <span>${getTopicIcon(sectionName)} ${sectionName}</span>
          <span class="topic-count">${countText}</span>
        </div>
        <div class="books-grid">
          ${bList.map(b => {
            const bName = isEn ? b.name_en : (isSc ? (b.name_cns || b.name_cn) : b.name_cn);
            const subName = isEn ? b.name_cn : b.name_en;
            const chapText = isEn ? (b.chapters === 1 ? '1 chap' : `${b.chapters} chaps`) : `${b.chapters} 章`;
            return `
              <div class="book-card" onclick="selectBook(${b.id})">
                <div class="book-card-name">${bName}</div>
                <div class="book-card-meta">${subName} · ${chapText}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
  return html;
}

function getTopicIcon(section) {
  if (!section) return '📖';
  const s = section.toLowerCase();
  if (s.includes('律法') || s.includes('law') || s.includes('pentateuch')) return '📜';
  if (s.includes('歷史') || s.includes('历史') || s.includes('history')) return '🏰';
  if (s.includes('詩歌') || s.includes('诗歌') || s.includes('poetry') || s.includes('wisdom')) return '🎵';
  if (s.includes('大先知') || s.includes('major prophet')) return '🕊️';
  if (s.includes('小先知') || s.includes('minor prophet')) return '🎺';
  if (s.includes('福音') || s.includes('gospel')) return '✝️';
  if (s.includes('教會歷史') || s.includes('教会历史') || s.includes('church history') || s.includes('acts')) return '🏛️';
  if (s.includes('保羅') || s.includes('保罗') || s.includes('pauline')) return '✉️';
  if (s.includes('普通書信') || s.includes('普通书信') || s.includes('general epistle')) return '📜';
  if (s.includes('啟示') || s.includes('启示') || s.includes('prophecy') || s.includes('revelation')) return '👑';
  return '📖';
}

// -------------------------------------------------------------
// Tabs Switching
// -------------------------------------------------------------
function switchTab(tabKey) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabKey);
  });

  document.getElementById('panelOT').classList.toggle('active', tabKey === 'ot');
  document.getElementById('panelNT').classList.toggle('active', tabKey === 'nt');
  document.getElementById('panelPrayer').classList.toggle('active', tabKey === 'prayer');
  document.getElementById('panelBM').classList.toggle('active', tabKey === 'bm');
  document.getElementById('panelSearch').classList.toggle('active', tabKey === 'search');

  if (tabKey === 'bm') {
    loadBookmarks();
  } else if (tabKey === 'prayer') {
    renderPrayerGuide();
    scrollToPrayerCard();
  }
}

// -------------------------------------------------------------
// Last Read & Resume Functionality
// -------------------------------------------------------------
function updateContinueCard() {
  if (!window.BibleBridge) return;
  try {
    const raw = window.BibleBridge.getLastRead(currentLang);
    const data = JSON.parse(raw || '{}');
    const card = document.getElementById('continueCard');
    const titleEl = document.getElementById('lastReadText');

    if (data && data.bookId && data.bookName) {
      card.classList.remove('hidden');
      const isEn = currentLang === 'en';
      titleEl.textContent = isEn 
        ? `${data.bookName} Chapter ${data.chapter}` 
        : `${data.bookName} 第 ${data.chapter} 章`;
      card.dataset.bookId = data.bookId;
      card.dataset.chapter = data.chapter;
      card.dataset.verse = data.verse || 1;
    } else {
      card.classList.add('hidden');
    }
  } catch (e) {
    console.error('Update continue card error:', e);
  }
}

function resumeLastRead() {
  const card = document.getElementById('continueCard');
  if (!card) return;
  const bookId = parseInt(card.dataset.bookId);
  const chapter = parseInt(card.dataset.chapter) || 1;
  const verse = parseInt(card.dataset.verse) || 1;
  if (bookId) {
    const page = Math.max(0, verse - 1);
    openChapter(bookId, chapter, page);
  }
}

// -------------------------------------------------------------
// Chapter Selection View
// -------------------------------------------------------------
function selectBook(bookId) {
  openChapterSelector(bookId);
}

function openChapterSelector(bookId) {
  if (bookId) {
    currentBook = allBooks.find(b => b.id === bookId);
  }
  if (!currentBook) return;

  const isEn = currentLang === 'en';
  const isSc = currentLang === 'sc';
  const bookName = isEn ? currentBook.name_en : (isSc ? (currentBook.name_cns || currentBook.name_cn) : currentBook.name_cn);
  const secName = isEn ? (currentBook.section_en || currentBook.section_cn) : (isSc ? (currentBook.section_cns || currentBook.section_cn) : currentBook.section_cn);
  const subName = isEn ? currentBook.name_cn : currentBook.name_en;

  document.getElementById('chapBookTitle').textContent = bookName;
  document.getElementById('chapBookSub').textContent = isEn
    ? `${bookName} (${subName}) · ${secName} · Total ${currentBook.chapters} Chapters`
    : `${bookName} (${subName}) · ${secName} · 共 ${currentBook.chapters} 章`;

  const grid = document.getElementById('chapterGrid');
  let html = '';
  for (let c = 1; c <= currentBook.chapters; c++) {
    html += `<button class="chapter-btn" onclick="openChapter(${currentBook.id}, ${c})">${c}</button>`;
  }
  grid.innerHTML = html;

  showView('chapters');
}

// -------------------------------------------------------------
// Paginated Scripture Reader (Book Mode)
// -------------------------------------------------------------
function openChapter(bookId, chapter, targetPage = 0) {
  currentBook = allBooks.find(b => b.id === bookId);
  currentChapter = chapter;

  if (!window.BibleBridge) return;

  try {
    const raw = window.BibleBridge.getChapter(bookId, chapter, currentLang);
    const data = JSON.parse(raw || '{}');
    const isEn = currentLang === 'en';
    const isSc = currentLang === 'sc';

    const readerContent = document.getElementById('readerContent');
    const topTitle = document.getElementById('readerTopTitle');
    const bookFooter = document.getElementById('readerInfoBook');

    const chapHeader = isEn 
      ? `${data.bookName} Chapter ${chapter}` 
      : `${data.bookName} 第 ${chapter} 章`;
    if (topTitle) topTitle.textContent = chapHeader;
    if (bookFooter) bookFooter.textContent = chapHeader;

    const subText = isEn 
      ? `Chapter ${chapter} · ${data.section}` 
      : `第 ${chapter} 章 · ${data.section}`;

    // Continuous Book Style: Verses flow naturally inline with small superscript numbers
    let html = `
      <div class="book-chapter-header">
        <h1 class="book-chapter-title">${data.bookName}</h1>
        <p class="book-chapter-sub">${subText}</p>
      </div>
      <div class="bible-text ${isEn ? 'lang-en' : ''}">
    `;

    (data.verses || []).forEach(v => {
      let t = v.text || '';
      t = t.replace(/<sup>/g, '<sup class="fn">');
      html += `<span class="v-unit"><sup class="vn">${v.verse}</sup>${t}</span> `;
    });

    html += `</div>`;
    readerContent.innerHTML = html;

    // Reset controls to hidden by default for full immersive reading
    hideReaderControls();

    showView('reader');

    // Calculate pages after DOM renders layout
    setTimeout(() => {
      recalculatePages();
      if (targetPage === -1) {
        goToPage(totalPages - 1);
      } else {
        goToPage(targetPage || 0);
      }
    }, 60);

  } catch (e) {
    console.error('Open chapter error:', e);
  }
}

function recalculatePages() {
  const content = document.getElementById('readerContent');
  if (!content) return;
  const w = content.clientWidth;
  if (w <= 0) return;
  
  const scrollW = content.scrollWidth;
  totalPages = Math.max(1, Math.round(scrollW / w));
  if (currentPage >= totalPages) currentPage = totalPages - 1;
  updatePageIndicator();
}

function goToPage(pageIdx) {
  const content = document.getElementById('readerContent');
  if (!content) return;

  if (pageIdx < 0) pageIdx = 0;
  if (pageIdx >= totalPages) pageIdx = totalPages - 1;
  currentPage = pageIdx;

  content.scrollLeft = Math.round(currentPage * content.clientWidth);
  updatePageIndicator();
  saveReadingProgress();
}

function nextPage() {
  if (currentPage < totalPages - 1) {
    goToPage(currentPage + 1);
  } else {
    navChapter(1, 0);
  }
}

function prevPage() {
  if (currentPage > 0) {
    goToPage(currentPage - 1);
  } else {
    navChapter(-1, -1);
  }
}

function updatePageIndicator() {
  const ind = document.getElementById('readerInfoPage');
  if (ind) {
    const isEn = currentLang === 'en';
    const isSc = currentLang === 'sc';
    ind.textContent = isEn
      ? `Page ${currentPage + 1} of ${totalPages}`
      : (isSc ? `第 ${currentPage + 1} / ${totalPages} 页` : `第 ${currentPage + 1} / ${totalPages} 頁`);
  }
}

function saveReadingProgress() {
  if (!window.BibleBridge || !currentBook) return;
  window.BibleBridge.saveLastRead(currentBook.id, currentChapter, currentPage + 1);
}

function navChapter(delta, startPage = 0) {
  if (!currentBook) return;
  const isEn = currentLang === 'en';
  const isSc = currentLang === 'sc';
  const targetCh = currentChapter + delta;
  if (targetCh >= 1 && targetCh <= currentBook.chapters) {
    openChapter(currentBook.id, targetCh, startPage);
  } else if (targetCh > currentBook.chapters) {
    const nextBook = allBooks.find(b => b.id === currentBook.id + 1);
    if (nextBook) {
      openChapter(nextBook.id, 1, 0);
    } else {
      const msg = isEn ? 'Already at the end of Revelation (last chapter of the Bible)!' : (isSc ? '已是圣经最后一卷（启示录）末章！' : '已是聖經最後一卷（啟示錄）末章！');
      alert(msg);
    }
  } else if (targetCh < 1) {
    const prevBook = allBooks.find(b => b.id === currentBook.id - 1);
    if (prevBook) {
      openChapter(prevBook.id, prevBook.chapters, startPage);
    } else {
      const msg = isEn ? 'Already at Genesis 1 (first chapter of the Bible)!' : (isSc ? '已是圣经第一卷（创世记）首章！' : '已是聖經第一卷（創世記）首章！');
      alert(msg);
    }
  }
}

// -------------------------------------------------------------
// Reader Controls Toggle (Tap Center Screen)
// -------------------------------------------------------------
function toggleReaderControls() {
  const header = document.getElementById('readerHeader');
  const bottom = document.getElementById('readerBottomBar');
  const isCurrentlyHidden = header.classList.contains('hidden');
  
  if (isCurrentlyHidden) {
    header.classList.remove('hidden');
    bottom.classList.remove('hidden');
  } else {
    header.classList.add('hidden');
    bottom.classList.add('hidden');
  }
}

function hideReaderControls() {
  document.getElementById('readerHeader').classList.add('hidden');
  document.getElementById('readerBottomBar').classList.add('hidden');
}

function closeReader() {
  openChapterSelector(currentBook ? currentBook.id : null);
}

// -------------------------------------------------------------
// Daily Prayer Life Guide (7 Steps with Card-by-Card Experience)
// -------------------------------------------------------------
function renderPrayerGuide() {
  if (typeof PRAYER_GUIDE_DATA === 'undefined') return;

  const isEn = currentLang === 'en';
  const isSc = currentLang === 'sc';
  const navContainer = document.getElementById('prayerStepNav');
  const contentContainer = document.getElementById('prayerStepContent');
  if (!navContainer || !contentContainer) return;

  // 1. Render Sub Nav Buttons
  navContainer.innerHTML = PRAYER_GUIDE_DATA.map((step, idx) => {
    let title = isEn ? (step.title_en || step.title_sc) : (isSc ? step.title_sc : step.title_tc);
    let shortTitle = title.split(' (')[0];
    return `
      <button class="prayer-step-btn ${idx === currentPrayerStepIdx ? 'active' : ''}" 
              onclick="selectPrayerStep(${idx})">
        ${shortTitle}
      </button>
    `;
  }).join('');

  // 2. Render Active Step Content
  const step = PRAYER_GUIDE_DATA[currentPrayerStepIdx];
  if (!step) return;

  const title = isEn ? (step.title_en || step.title_sc) : (isSc ? step.title_sc : step.title_tc);
  const subtitle = isEn ? (step.subtitle_en || step.subtitle_sc) : (isSc ? step.subtitle_sc : step.subtitle_tc);

  let bodyHtml = '';

  // ---------------------------------------------------------
  // Step 1: Intro
  // ---------------------------------------------------------
  if (step.id === 'step1_intro') {
    const contents = isEn ? (step.content_en || step.content_sc) : (isSc ? step.content_sc : step.content_tc);
    bodyHtml = contents.map(c => `
      <div class="prayer-card">
        <div class="prayer-card-header">
          <span class="prayer-card-name">${c.title}</span>
        </div>
        <div class="${c.type === 'declaration' ? 'prayer-box' : 'prayer-instruction'}">${c.body}</div>
      </div>
    `).join('');

    const proceedText = isEn 
      ? "Step 1: 👑 God's 12 Names ➔" 
      : (isSc ? '进入第一步：👑 神的12个名字 ➔' : '進入第一步：👑 神的12個名字 ➔');

    bodyHtml += `
      <div class="prayer-step-footer-nav">
        <div></div>
        <button class="prayer-nav-btn primary" onclick="selectPrayerStep(1)">${proceedText}</button>
      </div>
    `;
  } 
  // ---------------------------------------------------------
  // Step 2: 12 Names of God (SINGLE CARD MODE)
  // ---------------------------------------------------------
  else if (step.id === 'step2_names') {
    const totalNames = step.items.length;
    const it = step.items[currentNameCardIdx] || step.items[0];
    const meaning = isEn ? (it.meaning_en || it.meaning_sc) : (isSc ? it.meaning_sc : it.meaning_tc);
    const praise = isEn ? (it.praise_en || it.praise_sc) : (isSc ? it.praise_sc : it.praise_tc);
    const extended = isEn ? (it.extended_en || it.extended_sc) : (isSc ? it.extended_sc : it.extended_tc);
    const action = isEn ? (it.action_en || it.action_sc) : (isSc ? it.action_sc : it.action_tc);

    // Pills for quick jumping
    const pillsHtml = `
      <div class="card-pill-row">
        ${step.items.map((item, idx) => `
          <button class="card-pill-btn ${idx === currentNameCardIdx ? 'active' : ''}" 
                  onclick="selectNameCard(${idx})">
            ${item.num}
          </button>
        `).join('')}
      </div>
    `;

    const badgeLabel = isEn 
      ? `👑 God's 12 Names · #${currentNameCardIdx + 1} of ${totalNames}` 
      : `👑 ${isSc ? '神的12个名字' : '神的12個名字'} · 第 ${currentNameCardIdx + 1} / ${totalNames} 个`;
    const praiseLabel = isEn ? '🗣 Praise Declaration:' : (isSc ? '🗣 赞美宣告 (Praise Declaration)：' : '🗣 讚美宣告 (Praise Declaration)：');
    const extLabel = isEn ? '🙏 Extended Prayer:' : (isSc ? '🙏 延伸祷告 (Extended Prayer)：' : '🙏 延伸禱告 (Extended Prayer)：');
    const tapHint = isEn ? '👈 Tap left side for previous | Tap right side for next 👉' : (isSc ? '👈 轻触卡片左侧翻上一个 | 轻触右侧翻下一个 👉' : '👈 輕觸卡片左側翻上一個 | 輕觸右側翻下一個 👉');
    const prevBtnText = isEn ? '◀ Prev Name' : (isSc ? '◀ 上一个名字' : '◀ 上一個名字');
    const nextBtnText = currentNameCardIdx === totalNames - 1 
      ? (isEn ? 'Step 2: ⚔️ Kingdom Comes ➔' : (isSc ? '进入下一步：⚔️ 国度权柄 ➔' : '進入下一步：⚔️ 國度權柄 ➔')) 
      : (isEn ? 'Next Name ▶' : (isSc ? '下一个名字 ▶' : '下一個名字 ▶'));

    bodyHtml = `
      ${pillsHtml}
      <div class="card-stepper-container" onclick="handleCardClick(event, 'names')">
        <div class="card-stepper-badge">
          <span>${badgeLabel}</span>
          <span style="font-weight:bold;color:#000;">${meaning}</span>
        </div>
        <div class="card-stepper-header">${it.num}. ${it.name}</div>

        <div class="card-section-label">${praiseLabel}</div>
        <div class="prayer-box">“${praise}”</div>

        <div class="card-section-label">${extLabel}</div>
        <div class="prayer-box">“${extended}”</div>

        <div class="prayer-action-prompt">${action}</div>

        <div class="card-side-tap-hint">${tapHint}</div>

        <div class="card-stepper-actions" onclick="event.stopPropagation()">
          <button class="prayer-nav-btn" onclick="prevNameCard()" ${currentNameCardIdx === 0 ? 'disabled style="opacity:0.35;"' : ''}>
            ${prevBtnText}
          </button>
          <button class="prayer-nav-btn primary" onclick="nextNameCard()">
            ${nextBtnText}
          </button>
        </div>
      </div>
    `;
  } 
  // ---------------------------------------------------------
  // Step 3: Kingdom Declaration (SINGLE CARD MODE)
  // ---------------------------------------------------------
  else if (step.id === 'step3_kingdom') {
    const totalCards = step.items.length;
    const card = step.items[currentKingdomCardIdx] || step.items[0];
    const target = isEn ? (card.target_en || card.target_sc) : (isSc ? card.target_sc : card.target_tc);
    const subTitle = isEn ? (card.sub_title_en || card.sub_title_sc) : (isSc ? card.sub_title_sc : card.sub_title_tc);
    const instr = isEn ? (card.instruction_en || card.instruction_sc) : (isSc ? card.instruction_sc : card.instruction_tc);
    const prayer = isEn ? (card.prayer_en || card.prayer_sc) : (isSc ? card.prayer_sc : card.prayer_tc);

    // Pills for quick jumping
    const pillsHtml = `
      <div class="card-pill-row">
        ${step.items.map((item, idx) => `
          <button class="card-pill-btn ${idx === currentKingdomCardIdx ? 'active' : ''}" 
                  onclick="selectKingdomCard(${idx})">
            ${item.card_num}
          </button>
        `).join('')}
      </div>
    `;

    const badgeLabel = isEn 
      ? `⚔️ Kingdom Comes · Level ${currentKingdomCardIdx + 1} of ${totalCards}` 
      : `⚔️ ${isSc ? '国度权柄宣告' : '國度權柄宣告'} · 第 ${currentKingdomCardIdx + 1} / ${totalCards} 层面`;
    const declLabel = isEn ? '🗣 Prayer Declaration:' : (isSc ? '🗣 宣告祷告词：' : '🗣 宣告禱告詞：');
    const tapHint = isEn ? '👈 Tap left side for previous | Tap right side for next 👉' : (isSc ? '👈 轻触卡片左侧翻上一个 | 轻触右侧翻下一个 👉' : '👈 輕觸卡片左側翻上一個 | 輕觸右側翻下一個 👉');
    const prevBtnText = isEn ? '◀ Prev Level' : (isSc ? '◀ 上一个宣告' : '◀ 上一個宣告');
    const nextBtnText = currentKingdomCardIdx === totalCards - 1 
      ? (isEn ? 'Step 3: 🍞 Daily Bread ➔' : (isSc ? '进入下一步：🍞 日用饮食 ➔' : '進入下一步：🍞 日用飲食 ➔')) 
      : (isEn ? 'Next Level ▶' : (isSc ? '下一个宣告 ▶' : '下一個宣告 ▶'));

    bodyHtml = `
      ${pillsHtml}
      <div class="card-stepper-container" onclick="handleCardClick(event, 'kingdom')">
        <div class="card-stepper-badge">
          <span>${badgeLabel}</span>
          <span>${card.card_num} / 0${totalCards}</span>
        </div>
        <div class="card-stepper-header">${target}</div>
        <div class="prayer-banner-sub" style="margin-bottom:8px;">${subTitle}</div>

        <div class="prayer-instruction">${instr}</div>

        <div class="card-section-label">${declLabel}</div>
        <div class="prayer-box">${prayer}</div>

        <div class="card-side-tap-hint">${tapHint}</div>

        <div class="card-stepper-actions" onclick="event.stopPropagation()">
          <button class="prayer-nav-btn" onclick="prevKingdomCard()" ${currentKingdomCardIdx === 0 ? 'disabled style="opacity:0.35;"' : ''}>
            ${prevBtnText}
          </button>
          <button class="prayer-nav-btn primary" onclick="nextKingdomCard()">
            ${nextBtnText}
          </button>
        </div>
      </div>
    `;
  }
  // ---------------------------------------------------------
  // Steps 4, 5, 6, 7: Scroll Declarations
  // ---------------------------------------------------------
  else if (step.sections) {
    bodyHtml = step.sections.map(sec => {
      const target = isEn ? (sec.target_en || sec.target_sc) : (isSc ? sec.target_sc : sec.target_tc);
      const instr = isEn ? (sec.instruction_en || sec.instruction_sc) : (isSc ? sec.instruction_sc : sec.instruction_tc);
      const prayer = isEn ? (sec.prayer_en || sec.prayer_sc) : (isSc ? sec.prayer_sc : sec.prayer_tc);
      return `
        <div class="prayer-card">
          <div class="prayer-card-header">
            <span class="prayer-card-name">${target}</span>
          </div>
          <div class="prayer-instruction">${instr}</div>
          <div class="prayer-box">${prayer}</div>
        </div>
      `;
    }).join('');

    const prevDisabled = currentPrayerStepIdx === 0;
    const isLast = currentPrayerStepIdx === PRAYER_GUIDE_DATA.length - 1;
    const prevText = isEn ? '◀ Previous Step' : '◀ 上一步';
    const nextText = isLast 
      ? (isEn ? '🔁 Restart Cycle ➔' : (isSc ? '🔁 重新开始循环 ➔' : '🔁 重新開始循環 ➔')) 
      : (isEn ? 'Next Step ➔' : (isSc ? '下一步 ➔' : '下一步 ➔'));

    bodyHtml += `
      <div class="prayer-step-footer-nav">
        ${!prevDisabled ? `<button class="prayer-nav-btn" onclick="selectPrayerStep(${currentPrayerStepIdx - 1})">${prevText}</button>` : `<div></div>`}
        <button class="prayer-nav-btn primary" onclick="selectPrayerStep(${isLast ? 0 : currentPrayerStepIdx + 1})">${nextText}</button>
      </div>
    `;
  }

  // If card mode, omit redundant top banner so the card starts immediately on screen!
  if (step.is_card_mode) {
    contentContainer.innerHTML = `
      <div class="prayer-items-list">
        ${bodyHtml}
      </div>
    `;
  } else {
    contentContainer.innerHTML = `
      <div class="prayer-banner" style="margin-bottom:10px;padding:8px 12px;">
        <div class="prayer-banner-title" style="font-size:1.05em;">${title}</div>
        <div class="prayer-banner-sub">${subtitle}</div>
      </div>
      <div class="prayer-items-list">
        ${bodyHtml}
      </div>
    `;
  }
}

function scrollToPrayerCard() {
  requestAnimationFrame(() => {
    const card = document.querySelector('.card-stepper-container');
    const panel = document.getElementById('viewCatalog');
    if (card && panel) {
      const cardRect = card.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const currentScroll = panel.scrollTop;
      const targetTop = currentScroll + (cardRect.top - panelRect.top) - 8;
      panel.scrollTop = Math.max(0, targetTop);
    } else if (panel) {
      const content = document.getElementById('prayerStepContent');
      if (content) {
        const contentRect = content.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        const currentScroll = panel.scrollTop;
        const targetTop = currentScroll + (contentRect.top - panelRect.top) - 6;
        panel.scrollTop = Math.max(0, targetTop);
      }
    }
  });
}

function selectPrayerStep(idx) {
  currentPrayerStepIdx = Math.max(0, Math.min(PRAYER_GUIDE_DATA.length - 1, idx));
  renderPrayerGuide();
  scrollToPrayerCard();
}

// -------------------------------------------------------------
// Card Stepper Navigation Helpers
// -------------------------------------------------------------
function selectNameCard(idx) {
  currentNameCardIdx = idx;
  renderPrayerGuide();
  scrollToPrayerCard();
}

function nextNameCard() {
  const step = PRAYER_GUIDE_DATA[1];
  if (!step || !step.items) return;
  if (currentNameCardIdx < step.items.length - 1) {
    currentNameCardIdx++;
    renderPrayerGuide();
    scrollToPrayerCard();
  } else {
    // Finished all 12 names, advance to Kingdom declarations (Step 3)
    selectPrayerStep(2);
  }
}

function prevNameCard() {
  if (currentNameCardIdx > 0) {
    currentNameCardIdx--;
    renderPrayerGuide();
    scrollToPrayerCard();
  }
}

function selectKingdomCard(idx) {
  currentKingdomCardIdx = idx;
  renderPrayerGuide();
  scrollToPrayerCard();
}

function nextKingdomCard() {
  const step = PRAYER_GUIDE_DATA[2];
  if (!step || !step.items) return;
  if (currentKingdomCardIdx < step.items.length - 1) {
    currentKingdomCardIdx++;
    renderPrayerGuide();
    scrollToPrayerCard();
  } else {
    // Finished all 5 kingdom cards, advance to Daily Bread (Step 4)
    selectPrayerStep(3);
  }
}

function prevKingdomCard() {
  if (currentKingdomCardIdx > 0) {
    currentKingdomCardIdx--;
    renderPrayerGuide();
    scrollToPrayerCard();
  }
}

function handleCardClick(event, type) {
  if (event.target.tagName === 'BUTTON' || event.target.closest('button')) return;
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const width = rect.width;
  if (x < width * 0.35) {
    if (type === 'names') prevNameCard();
    else if (type === 'kingdom') prevKingdomCard();
  } else if (x > width * 0.65) {
    if (type === 'names') nextNameCard();
    else if (type === 'kingdom') nextKingdomCard();
  }
}

// -------------------------------------------------------------
// Bookmarks Management (Dual SQLite & LocalStorage Storage)
// -------------------------------------------------------------
function getLocalBookmarks() {
  try {
    return JSON.parse(localStorage.getItem('bible_bookmarks_v1') || '[]');
  } catch (e) {
    return [];
  }
}

function saveLocalBookmarks(list) {
  try {
    localStorage.setItem('bible_bookmarks_v1', JSON.stringify(list));
  } catch (e) {
    console.error('Save local bookmarks error:', e);
  }
}

function bookmarkCurrentPage() {
  if (!currentBook) return;
  const isEn = currentLang === 'en';
  const isSc = currentLang === 'sc';
  const bName = isEn ? currentBook.name_en : (isSc ? (currentBook.name_cns || currentBook.name_cn) : currentBook.name_cn);
  const title = isEn
    ? `${bName} Chapter ${currentChapter} (Page ${currentPage + 1})`
    : (isSc ? `${bName} 第 ${currentChapter} 章 (第 ${currentPage + 1} 页)` : `${bName} 第 ${currentChapter} 章 (第 ${currentPage + 1} 頁)`);
  const snippet = isEn
    ? `Progress: ${bName} Chapter ${currentChapter} · Page ${currentPage + 1} of ${totalPages}`
    : (isSc ? `阅读进度：${bName} 第 ${currentChapter} 章 · 第 ${currentPage + 1} / ${totalPages} 页` : `閱讀進度：${bName} 第 ${currentChapter} 章 · 第 ${currentPage + 1} / ${totalPages} 頁`);

  let isAdded = true;

  // 1. Save in Java SQLite Bridge
  if (window.BibleBridge && window.BibleBridge.toggleBookmark) {
    try {
      isAdded = window.BibleBridge.toggleBookmark(currentBook.id, currentChapter, currentPage + 1, title, snippet);
    } catch (e) {
      console.error('toggleBookmark Java call error:', e);
    }
  }

  // 2. Also save in LocalStorage as reliable cache
  let localList = getLocalBookmarks();
  const existingIdx = localList.findIndex(item => item.bookId === currentBook.id && item.chapter === currentChapter && item.verse === (currentPage + 1));
  if (existingIdx >= 0) {
    localList.splice(existingIdx, 1);
    isAdded = false;
  } else {
    localList.unshift({
      id: Date.now(),
      bookId: currentBook.id,
      chapter: currentChapter,
      verse: currentPage + 1,
      title: title,
      snippet: snippet,
      created_at: new Date().toLocaleDateString()
    });
    isAdded = true;
  }
  saveLocalBookmarks(localList);

  // 3. User feedback
  if (isAdded) {
    alert(isEn ? `✓ Added [${title}] to bookmarks!` : (isSc ? `✓ 已将【${title}】加入书签！` : `✓ 已將【${title}】加入書籤！`));
  } else {
    alert(isEn ? `Bookmark removed!` : (isSc ? `已取消书签！` : `已取消書籤！`));
  }

  loadBookmarks();
}

function loadBookmarks() {
  const isEn = currentLang === 'en';
  const isSc = currentLang === 'sc';
  const container = document.getElementById('bookmarksList');
  if (!container) return;

  let list = [];

  // 1. Try fetching from Java Bridge
  if (window.BibleBridge && window.BibleBridge.getBookmarks) {
    try {
      const raw = window.BibleBridge.getBookmarks(currentLang);
      const parsed = JSON.parse(raw || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    } catch (e) {
      console.error('Load bookmarks from bridge error:', e);
    }
  }

  // 2. Fallback to LocalStorage if bridge returned empty
  if (list.length === 0) {
    list = getLocalBookmarks();
  } else {
    // Keep LocalStorage in sync
    saveLocalBookmarks(list);
  }

  if (list.length === 0) {
    const emptyMsg = isEn
      ? '<div class="empty-state">No bookmarks yet.<br/>While reading scripture, tap center of screen and tap "🔖 Bookmark" at top right to save!</div>'
      : (isSc ? '<div class="empty-state">尚无书签。<br/>阅读经文时点击屏幕中央，轻触右上角「🔖 书签」即可快速收藏！</div>'
              : '<div class="empty-state">尚無書籤。<br/>閱讀經文時點擊螢幕中央，輕觸右上角「🔖 書籤」即可快速收藏！</div>');
    container.innerHTML = emptyMsg;
    return;
  }

  container.innerHTML = list.map(item => {
    const defaultTitle = isEn ? `${item.bookName} Chapter ${item.chapter}` : `${item.bookName} 第 ${item.chapter} 章`;
    const delText = isEn ? 'Delete' : (isSc ? '删除' : '刪除');
    const gotoText = isEn ? 'Read ➔' : (isSc ? '前往阅读 ➔' : '前往閱讀 ➔');
    return `
      <div class="bm-item">
        <div class="bm-header">
          <span class="bm-title">${item.title || defaultTitle}</span>
          <button class="bm-del-btn" onclick="deleteBookmark(${item.id})">${delText}</button>
        </div>
        <div class="bm-snippet">${item.snippet || '—'}</div>
        <div class="bm-footer">
          <span>${item.created_at || ''}</span>
          <button class="bm-goto-btn" onclick="openChapter(${item.bookId}, ${item.chapter}, ${item.verse ? item.verse - 1 : 0})">${gotoText}</button>
        </div>
      </div>
    `;
  }).join('');
}

function deleteBookmark(id) {
  // Delete from Java bridge
  if (window.BibleBridge && window.BibleBridge.deleteBookmark) {
    try {
      window.BibleBridge.deleteBookmark(id);
    } catch (e) {
      console.error('Delete bookmark from bridge error:', e);
    }
  }

  // Delete from LocalStorage
  let localList = getLocalBookmarks();
  localList = localList.filter(item => item.id !== id);
  saveLocalBookmarks(localList);

  loadBookmarks();
}

// -------------------------------------------------------------
// Search Feature
// -------------------------------------------------------------
function executeSearch() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query || !window.BibleBridge) return;
  const isEn = currentLang === 'en';
  const isSc = currentLang === 'sc';

  try {
    const raw = window.BibleBridge.search(query, currentLang);
    const results = JSON.parse(raw || '[]');
    const container = document.getElementById('searchResults');
    
    if (results.length === 0) {
      container.innerHTML = isEn
        ? '<div class="empty-state">No verses found matching this keyword.</div>'
        : (isSc ? '<div class="empty-state">未找到包含此关键字的经文。</div>' : '<div class="empty-state">未找到包含此關鍵字的經文。</div>');
      return;
    }

    const countText = isEn
      ? `Found ${results.length} verses:`
      : (isSc ? `共找到 ${results.length} 节经文：` : `共找到 ${results.length} 節經文：`);

    container.innerHTML = `
      <div style="font-size:0.85em;color:#555;margin-bottom:8px;">${countText}</div>
      ${results.map(r => `
        <div class="search-item" onclick="openChapter(${r.bookId}, ${r.chapter}, 0)">
          <div class="search-item-title">${r.bookName} ${r.chapter}:${r.verse}</div>
          <div class="search-item-text">${r.text.replace(/<[^>]+>/g, '')}</div>
        </div>
      `).join('')}
    `;
  } catch (e) {
    console.error('Search error:', e);
  }
}

// -------------------------------------------------------------
// Navigation & History Management
// -------------------------------------------------------------
function showView(viewName) {
  document.getElementById('viewCatalog').classList.toggle('active', viewName === 'catalog');
  document.getElementById('viewChapters').classList.toggle('active', viewName === 'chapters');
  document.getElementById('viewReader').classList.toggle('active', viewName === 'reader');

  if (viewName === 'catalog') {
    updateContinueCard();
    viewHistory = ['catalog'];
  } else if (viewName === 'chapters') {
    if (viewHistory[viewHistory.length - 1] !== 'chapters') viewHistory.push('chapters');
  } else if (viewName === 'reader') {
    if (viewHistory[viewHistory.length - 1] !== 'reader') viewHistory.push('reader');
  }
}

function goBack() {
  if (viewHistory.length > 1) {
    viewHistory.pop();
    const prevView = viewHistory[viewHistory.length - 1];
    showView(prevView);
  } else {
    showView('catalog');
  }
}

function exitApp() {
  if (window.BibleBridge && window.BibleBridge.exitApp) {
    window.BibleBridge.exitApp();
  } else {
    window.close();
  }
}

// Physical Hardware Back Key
window.onBackPressed = function() {
  const currentView = viewHistory[viewHistory.length - 1];
  if (currentView === 'reader') {
    openChapterSelector();
  } else if (currentView === 'chapters') {
    showView('catalog');
  } else {
    // In catalog root: exit the app cleanly!
    exitApp();
  }
};

// Physical Hardware Volume / Page-turn Keys on Hanvon Clear
window.onPageTurn = function(direction) {
  if (viewHistory[viewHistory.length - 1] === 'reader') {
    if (direction === 'next') {
      nextPage();
    } else {
      prevPage();
    }
  } else if (viewHistory[viewHistory.length - 1] === 'catalog') {
    // Check if user is in prayer tab with cards!
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab && activeTab.dataset.tab === 'prayer') {
      if (currentPrayerStepIdx === 1) { // 12 Names
        if (direction === 'next') nextNameCard();
        else prevNameCard();
      } else if (currentPrayerStepIdx === 2) { // Kingdom
        if (direction === 'next') nextKingdomCard();
        else prevKingdomCard();
      }
    }
  }
};

// -------------------------------------------------------------
// Font Scaling
// -------------------------------------------------------------
function adjustFontSize(delta) {
  let currentSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--base-font-size')) || 20;
  currentSize = Math.max(15, Math.min(32, currentSize + delta));
  document.documentElement.style.setProperty('--base-font-size', currentSize + 'px');
  localStorage.setItem('bible_app_font_size', currentSize);

  if (viewHistory[viewHistory.length - 1] === 'reader') {
    setTimeout(recalculatePages, 80);
  }
}

function loadSavedFontSize() {
  const saved = localStorage.getItem('bible_app_font_size');
  if (saved) {
    document.documentElement.style.setProperty('--base-font-size', saved + 'px');
  }
}
