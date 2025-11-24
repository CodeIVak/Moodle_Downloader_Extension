# רשימת בדיקות לתוסף Moodle PDF Downloader

## בדיקות בסיסיות

### 1. התקנת התוסף
- [ ] פתח `chrome://extensions/`
- [ ] הפעל "מצב מפתח" (Developer mode)
- [ ] לחץ "טען תוסף לא ארוז" ובחר את התיקייה
- [ ] ודא שהתוסף נטען ללא שגיאות

### 2. בדיקת אייקונים
- [ ] ודא שהאייקון מופיע בסרגל הכלים
- [ ] ודא שהאייקון נראה תקין (לא שבור)

### 3. בדיקת Popup
- [ ] לחץ על אייקון התוסף
- [ ] ודא שהחלון הקופץ נפתח
- [ ] ודא שהעיצוב נראה תקין (צבעי ירוק בר אילן)
- [ ] ודא שהטקסט בעברית מופיע נכון (RTL)

### 4. בדיקת סריקה
- [ ] נווט לדף קורס: `https://lemida.biu.ac.il/course/view.php?id=104667`
- [ ] לחץ על התוסף
- [ ] לחץ "מצא קבצי PDF"
- [ ] פתח Console (F12) ובדוק לוגים:
  - `[Moodle PDF Downloader] Scanning page for PDF links...`
  - `[Moodle PDF Downloader] Found X total links`
  - `[Moodle PDF Downloader] Found pluginfile PDF: ...`
- [ ] ודא שמופיעה רשימת קבצים

### 5. בדיקת הורדה - קישור ישיר (pluginfile.php)
- [ ] מצא קישור מסוג `pluginfile.php` ברשימה
- [ ] לחץ "הורד קובץ זה"
- [ ] ודא שהקובץ נשמר כ-PDF (לא HTML)
- [ ] ודא ששם הקובץ נכון עם סיומת .pdf

### 6. בדיקת הורדה - קישור view.php (החשוב ביותר!)
- [ ] מצא קישור מסוג `view.php?id=XXX` ברשימה
- [ ] לחץ "הורד קובץ זה"
- [ ] פתח Console (F12) ובדוק לוגים:
  - `[Moodle PDF Downloader] Detected view.php URL, extracting direct link...`
  - `[Moodle PDF Downloader] Extracting direct link from: ...`
  - `[Moodle PDF Downloader] Extracted direct link: ...`
- [ ] ודא שהקובץ נשמר כ-PDF (לא HTML) ⚠️ **זה הבדיקה החשובה ביותר!**
- [ ] ודא ששם הקובץ נכון עם סיומת .pdf

### 7. בדיקת הורדה מרוכזת
- [ ] לחץ "הורד את כל הקבצים"
- [ ] ודא שכל הקבצים מורדים
- [ ] ודא שכל הקבצים נשמרים כ-PDF

### 8. בדיקת שגיאות
- [ ] פתח Console (F12)
- [ ] בדוק שאין שגיאות אדומות
- [ ] בדוק שאין אזהרות צהובות רלוונטיות

## בדיקות מתקדמות

### 9. בדיקת Background Script
- [ ] פתח `chrome://extensions/`
- [ ] לחץ על "Service worker" של התוסף
- [ ] ודא שאין שגיאות ב-console של ה-service worker

### 10. בדיקת Content Script
- [ ] נווט לדף קורס
- [ ] פתח Console (F12)
- [ ] בדוק שהודעות `[Moodle PDF Downloader]` מופיעות

### 11. בדיקת דף Resource View
- [ ] נווט ישירות לדף resource: `https://lemida.biu.ac.il/mod/resource/view.php?id=2874748`
- [ ] לחץ על התוסף
- [ ] לחץ "מצא קבצי PDF"
- [ ] ודא שנמצא קישור ישיר ל-pluginfile.php

## בעיות ידועות לבדיקה

### בעיה: קבצים נשמרים כ-HTML במקום PDF
**פתרון שיושם:**
- Background script פותח טאב נסתר עם דף view.php
- מחלץ את קישור pluginfile.php הישיר
- מוריד את הקובץ ישירות

**איך לבדוק:**
1. הורד קובץ מ-view.php
2. בדוק ב-Console שהלוגים מופיעים:
   - `Extracting direct link from: ...`
   - `Extracted direct link: ...`
3. בדוק שהקובץ שנשמר הוא PDF ולא HTML

### בעיה: לא נמצאים קישורי PDF
**פתרון שיושם:**
- חיפוש משופר ב-parent/grandparent elements
- חיפוש ב-activity containers
- חיפוש ב-iframes

**איך לבדוק:**
1. פתח Console (F12)
2. בדוק את הלוגים - כמה קישורים נמצאו
3. אם לא נמצאו, בדוק את מבנה ה-HTML של הדף

## דיווח על בעיות

אם נתקלת בבעיה:
1. צלם מסך של הבעיה
2. העתק את הלוגים מה-Console (F12)
3. שלח ל: idan.vaknin1@live.biu.ac.il

## הערות

- ודא שהתוסף מעודכן לגרסה 1.1
- ודא שיש הרשאות: activeTab, scripting, downloads, storage, tabs
- ודא שיש host_permissions ל-lemida.biu.ac.il

