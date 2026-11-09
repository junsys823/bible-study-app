package com.bible.study.cuv;

import android.app.Activity;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.os.Bundle;
import android.view.KeyEvent;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends Activity {
    private WebView webView;
    private SQLiteDatabase db;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        initDatabase();

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setDatabaseEnabled(true);
        settings.setTextZoom(100);

        webView.setWebViewClient(new WebViewClient());
        webView.addJavascriptInterface(new BibleBridge(), "BibleBridge");

        webView.loadUrl("file:///android_asset/web/index.html");
    }

    private void initDatabase() {
        try {
            File dbDir = new File(getFilesDir().getParent(), "databases");
            if (!dbDir.exists()) dbDir.mkdirs();

            File dbFile = new File(dbDir, "bible.db");
            boolean needCopy = false;

            if (!dbFile.exists() || dbFile.length() < 2000000) {
                needCopy = true;
            } else {
                // Check if current db is version 2 with text_cns and name_cns
                try {
                    SQLiteDatabase testDb = SQLiteDatabase.openDatabase(dbFile.getAbsolutePath(), null, SQLiteDatabase.OPEN_READONLY);
                    Cursor c = testDb.rawQuery("PRAGMA user_version", null);
                    int ver = 0;
                    if (c.moveToFirst()) ver = c.getInt(0);
                    c.close();
                    if (ver < 3) {
                        needCopy = true;
                    }
                    testDb.close();
                } catch (Exception e) {
                    needCopy = true;
                }
            }

            if (needCopy) {
                // Backup existing bookmarks & last_read
                List<BookmarkBackup> bmBackups = new ArrayList<BookmarkBackup>();
                LastReadBackup lrBackup = null;
                if (dbFile.exists()) {
                    try {
                        SQLiteDatabase oldDb = SQLiteDatabase.openDatabase(dbFile.getAbsolutePath(), null, SQLiteDatabase.OPEN_READONLY);
                        Cursor bmc = oldDb.rawQuery("SELECT book, chapter, verse FROM bookmarks", null);
                        while (bmc.moveToNext()) {
                            BookmarkBackup b = new BookmarkBackup();
                            b.book = bmc.getInt(0);
                            b.chapter = bmc.getInt(1);
                            b.verse = bmc.getInt(2);
                            b.title = "";
                            b.snippet = "";
                            bmBackups.add(b);
                        }
                        bmc.close();

                        Cursor lrc = oldDb.rawQuery("SELECT book, chapter, verse FROM last_read WHERE id = 1", null);
                        if (lrc.moveToFirst()) {
                            lrBackup = new LastReadBackup();
                            lrBackup.book = lrc.getInt(0);
                            lrBackup.chapter = lrc.getInt(1);
                            lrBackup.verse = lrc.getInt(2);
                        }
                        lrc.close();
                        oldDb.close();
                    } catch (Exception ignored) {}
                }

                // Copy asset
                InputStream is = getAssets().open("bible.db");
                OutputStream os = new FileOutputStream(dbFile);
                byte[] buffer = new byte[8192];
                int length;
                while ((length = is.read(buffer)) > 0) {
                    os.write(buffer, 0, length);
                }
                os.flush();
                os.close();
                is.close();

                // Restore bookmarks & last_read
                SQLiteDatabase restoredDb = SQLiteDatabase.openDatabase(dbFile.getAbsolutePath(), null, SQLiteDatabase.OPEN_READWRITE);
                for (BookmarkBackup b : bmBackups) {
                    try {
                        restoredDb.execSQL("INSERT INTO bookmarks (book, chapter, verse, title, snippet) VALUES (?, ?, ?, ?, ?)",
                                new Object[]{b.book, b.chapter, b.verse, b.title, b.snippet});
                    } catch (Exception ignored) {}
                }
                if (lrBackup != null) {
                    try {
                        restoredDb.execSQL("INSERT OR REPLACE INTO last_read (id, book, chapter, verse, updated_at) VALUES (1, ?, ?, ?, datetime('now', 'localtime'))",
                                new Object[]{lrBackup.book, lrBackup.chapter, lrBackup.verse});
                    } catch (Exception ignored) {}
                }
                restoredDb.close();
            }

            db = SQLiteDatabase.openDatabase(dbFile.getAbsolutePath(), null, SQLiteDatabase.OPEN_READWRITE);

            // Ensure bookmarks table schema is up to date
            try {
                db.execSQL("CREATE TABLE IF NOT EXISTS bookmarks (id INTEGER PRIMARY KEY AUTOINCREMENT, book INTEGER, chapter INTEGER, verse INTEGER, title TEXT, snippet TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
                Cursor c = db.rawQuery("PRAGMA table_info(bookmarks)", null);
                boolean hasTitle = false, hasSnippet = false;
                while (c.moveToNext()) {
                    String col = c.getString(1);
                    if ("title".equalsIgnoreCase(col)) hasTitle = true;
                    if ("snippet".equalsIgnoreCase(col)) hasSnippet = true;
                }
                c.close();
                if (!hasTitle) {
                    db.execSQL("ALTER TABLE bookmarks ADD COLUMN title TEXT");
                }
                if (!hasSnippet) {
                    db.execSQL("ALTER TABLE bookmarks ADD COLUMN snippet TEXT");
                }
            } catch (Exception e) {
                e.printStackTrace();
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static class BookmarkBackup {
        int book, chapter, verse;
        String title, snippet;
    }

    private static class LastReadBackup {
        int book, chapter, verse;
    }

    public class BibleBridge {
        @JavascriptInterface
        public String getCategories() {
            JSONArray array = new JSONArray();
            if (db == null) return array.toString();
            try {
                Cursor c = db.rawQuery("SELECT id, name_cn, name_cns, name_en, abbr_cn, abbr_cns, abbr_en, chapters, testament, section_cn, section_cns, section_en FROM books ORDER BY id ASC", null);
                while (c.moveToNext()) {
                    JSONObject obj = new JSONObject();
                    obj.put("id", c.getInt(0));
                    obj.put("name_cn", c.getString(1));
                    obj.put("name_cns", c.getString(2));
                    obj.put("name_en", c.getString(3));
                    obj.put("abbr_cn", c.getString(4));
                    obj.put("abbr_cns", c.getString(5));
                    obj.put("abbr_en", c.getString(6));
                    obj.put("chapters", c.getInt(7));
                    obj.put("testament", c.getString(8));
                    obj.put("section_cn", c.getString(9));
                    obj.put("section_cns", c.getString(10));
                    obj.put("section_en", c.getString(11));
                    array.put(obj);
                }
                c.close();
            } catch (Exception e) {
                e.printStackTrace();
            }
            return array.toString();
        }

        @JavascriptInterface
        public String getChapter(int bookId, int chapter, String lang) {
            boolean isEn = "en".equalsIgnoreCase(lang);
            boolean isSimplified = "sc".equalsIgnoreCase(lang) || "simplified".equalsIgnoreCase(lang);
            JSONObject result = new JSONObject();
            if (db == null) return result.toString();
            try {
                Cursor bc = db.rawQuery("SELECT name_cn, name_cns, name_en, chapters, testament, section_cn, section_cns, section_en FROM books WHERE id = ?", new String[]{String.valueOf(bookId)});
                if (bc.moveToFirst()) {
                    result.put("bookId", bookId);
                    String bookName = isEn ? bc.getString(2) : (isSimplified ? bc.getString(1) : bc.getString(0));
                    result.put("bookName", bookName);
                    result.put("bookNameCn", bc.getString(0));
                    result.put("bookNameCns", bc.getString(1));
                    result.put("bookNameEn", bc.getString(2));
                    result.put("totalChapters", bc.getInt(3));
                    result.put("testament", bc.getString(4));
                    String sectionName = isEn ? bc.getString(7) : (isSimplified ? bc.getString(6) : bc.getString(5));
                    result.put("section", sectionName);
                }
                bc.close();
                result.put("chapter", chapter);
                result.put("lang", isEn ? "en" : (isSimplified ? "sc" : "tc"));

                // Verses
                JSONArray verses = new JSONArray();
                String textCol = isEn ? "text_en" : (isSimplified ? "text_cns" : "text_cn");
                Cursor vc = db.rawQuery("SELECT verse, " + textCol + " FROM verses WHERE book = ? AND chapter = ? ORDER BY verse ASC", 
                                        new String[]{String.valueOf(bookId), String.valueOf(chapter)});
                while (vc.moveToNext()) {
                    JSONObject v = new JSONObject();
                    v.put("verse", vc.getInt(0));
                    v.put("text", vc.getString(1));
                    verses.put(v);
                }
                vc.close();
                result.put("verses", verses);

                // Bookmarked verses
                JSONArray bms = new JSONArray();
                Cursor bmc = db.rawQuery("SELECT verse FROM bookmarks WHERE book = ? AND chapter = ?", 
                                         new String[]{String.valueOf(bookId), String.valueOf(chapter)});
                while (bmc.moveToNext()) {
                    bms.put(bmc.getInt(0));
                }
                bmc.close();
                result.put("bookmarkedVerses", bms);

            } catch (Exception e) {
                e.printStackTrace();
            }
            return result.toString();
        }

        @JavascriptInterface
        public String getLastRead(String lang) {
            boolean isEn = "en".equalsIgnoreCase(lang);
            boolean isSimplified = "sc".equalsIgnoreCase(lang);
            JSONObject obj = new JSONObject();
            if (db == null) return obj.toString();
            try {
                Cursor c = db.rawQuery("SELECT l.book, l.chapter, l.verse, b.name_cn, b.name_cns, b.chapters, b.name_en " +
                                       "FROM last_read l LEFT JOIN books b ON b.id = l.book WHERE l.id = 1", null);
                if (c.moveToFirst()) {
                    obj.put("bookId", c.getInt(0));
                    obj.put("chapter", c.getInt(1));
                    obj.put("verse", c.getInt(2));
                    String bName = isEn ? c.getString(6) : (isSimplified ? c.getString(4) : c.getString(3));
                    obj.put("bookName", bName != null ? bName : "");
                    obj.put("totalChapters", c.getInt(5));
                }
                c.close();
            } catch (Exception e) {
                e.printStackTrace();
            }
            return obj.toString();
        }

        @JavascriptInterface
        public void saveLastRead(int bookId, int chapter, int verse) {
            if (db == null) return;
            try {
                db.execSQL("INSERT OR REPLACE INTO last_read (id, book, chapter, verse, updated_at) VALUES (1, ?, ?, ?, datetime('now', 'localtime'))", 
                           new Object[]{bookId, chapter, verse});
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        @JavascriptInterface
        public String getBookmarks(String lang) {
            boolean isEn = "en".equalsIgnoreCase(lang);
            boolean isSimplified = "sc".equalsIgnoreCase(lang);
            JSONArray array = new JSONArray();
            if (db == null) return array.toString();
            try {
                Cursor c = db.rawQuery("SELECT bm.id, bm.book, bm.chapter, bm.verse, bm.title, bm.snippet, bm.created_at, b.name_cn, b.name_cns, b.name_en " +
                                       "FROM bookmarks bm LEFT JOIN books b ON b.id = bm.book ORDER BY bm.id DESC", null);
                while (c.moveToNext()) {
                    JSONObject obj = new JSONObject();
                    obj.put("id", c.getInt(0));
                    obj.put("bookId", c.getInt(1));
                    obj.put("chapter", c.getInt(2));
                    obj.put("verse", c.getInt(3));
                    obj.put("title", c.getString(4) != null ? c.getString(4) : "");
                    obj.put("snippet", c.getString(5) != null ? c.getString(5) : "");
                    obj.put("created_at", c.getString(6) != null ? c.getString(6) : "");
                    String bName = isEn ? c.getString(9) : (isSimplified ? c.getString(8) : c.getString(7));
                    obj.put("bookName", bName != null ? bName : "");
                    array.put(obj);
                }
                c.close();
            } catch (Exception e) {
                e.printStackTrace();
            }
            return array.toString();
        }

        @JavascriptInterface
        public boolean toggleBookmark(int bookId, int chapter, int verse, String title, String snippet) {
            if (db == null) return false;
            try {
                Cursor c = db.rawQuery("SELECT id FROM bookmarks WHERE book = ? AND chapter = ? AND verse = ?", 
                                       new String[]{String.valueOf(bookId), String.valueOf(chapter), String.valueOf(verse)});
                if (c.moveToFirst()) {
                    int id = c.getInt(0);
                    c.close();
                    db.execSQL("DELETE FROM bookmarks WHERE id = ?", new Object[]{id});
                    return false; // Removed
                } else {
                    c.close();
                    db.execSQL("INSERT INTO bookmarks (book, chapter, verse, title, snippet) VALUES (?, ?, ?, ?, ?)", 
                               new Object[]{bookId, chapter, verse, title, snippet});
                    return true; // Added
                }
            } catch (Exception e) {
                e.printStackTrace();
                return false;
            }
        }

        @JavascriptInterface
        public boolean deleteBookmark(int id) {
            if (db == null) return false;
            try {
                db.execSQL("DELETE FROM bookmarks WHERE id = ?", new Object[]{id});
                return true;
            } catch (Exception e) {
                e.printStackTrace();
                return false;
            }
        }

        @JavascriptInterface
        public String search(String query, String lang) {
            boolean isEn = "en".equalsIgnoreCase(lang);
            boolean isSimplified = "sc".equalsIgnoreCase(lang);
            JSONArray array = new JSONArray();
            if (db == null || query == null || query.trim().isEmpty()) return array.toString();
            try {
                String pattern = "%" + query.trim() + "%";
                String textCol = isEn ? "v.text_en" : (isSimplified ? "v.text_cns" : "v.text_cn");
                String nameCol = isEn ? "b.name_en" : (isSimplified ? "b.name_cns" : "b.name_cn");
                String sql = "SELECT v.book, v.chapter, v.verse, " + textCol + ", " + nameCol + " " +
                             "FROM verses v JOIN books b ON b.id = v.book " +
                             "WHERE " + textCol + " LIKE ? ORDER BY v.book ASC, v.chapter ASC, v.verse ASC LIMIT 80";
                Cursor c = db.rawQuery(sql, new String[]{pattern});
                while (c.moveToNext()) {
                    JSONObject obj = new JSONObject();
                    obj.put("bookId", c.getInt(0));
                    obj.put("chapter", c.getInt(1));
                    obj.put("verse", c.getInt(2));
                    obj.put("text", c.getString(3));
                    obj.put("bookName", c.getString(4));
                    array.put(obj);
                }
                c.close();
            } catch (Exception e) {
                e.printStackTrace();
            }
            return array.toString();
        }

        @JavascriptInterface
        public void exitApp() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    finish();
                }
            });
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_PAGE_DOWN || keyCode == KeyEvent.KEYCODE_VOLUME_DOWN) {
            webView.evaluateJavascript("window.onPageTurn && window.onPageTurn('next')", null);
            return true;
        } else if (keyCode == KeyEvent.KEYCODE_PAGE_UP || keyCode == KeyEvent.KEYCODE_VOLUME_UP) {
            webView.evaluateJavascript("window.onPageTurn && window.onPageTurn('prev')", null);
            return true;
        } else if (keyCode == KeyEvent.KEYCODE_BACK) {
            webView.evaluateJavascript("window.onBackPressed && window.onBackPressed()", null);
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onDestroy() {
        if (db != null && db.isOpen()) {
            db.close();
        }
        super.onDestroy();
    }
}
