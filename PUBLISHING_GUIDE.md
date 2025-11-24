# 🚀 מדריך פרסום מלא - Moodle PDF Downloader

מדריך זה מכיל את כל השלבים לפרסום התוסף ב-GitHub/GitLab וב-Chrome Web Store.

## 📋 תוכן עניינים

1. [העלאה ל-GitHub/GitLab](#githubgitlab)
2. [פרסום ב-Chrome Web Store](#chrome-web-store)
3. [קישורים שימושיים](#קישורים-שימושיים)

---

## 🌐 GitHub/GitLab

### שלב 1: יצירת Repository
1. צור repository חדש ב-GitHub או GitLab
2. שם מוצע: `moodle-downloader-extension`
3. הגדר כ-Public (מומלץ) או Private

### שלב 2: העלאת הקבצים
**אפשרויות:**
- **GitHub Desktop** (הכי קל)
- **Git Command Line** (למתקדמים)
- **העלאה ידנית** דרך הדפדפן

ראה את הקובץ `GITHUB_SETUP.md` להוראות מפורטות.

### שלב 3: יצירת Release
1. פתח את ה-repository
2. לחץ על "Releases" → "Create a new release"
3. העלה את `Moodle_Downloader_Extension_v1.3.1.zip`
4. מלא תיאור מ-`RELEASE_NOTES.md`

### שלב 4: עדכון README
עדכן את הקישורים ב-`README.md`:
- החלף `yourusername` בשם המשתמש שלך
- עדכן קישורים ל-releases

---

## 🏪 Chrome Web Store

### שלב 1: הכנת חשבון
1. היכנס ל-[Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. שלם $5 (USD) לרישום חד-פעמי
3. מלא את פרטי החשבון

### שלב 2: הכנת קבצים
**צריך להכין:**
- ✅ צילומי מסך (1280x800 מינימום)
- ✅ תמונות פרסום (אופציונלי)
- ✅ תיאור מלא (ראה `CHROME_WEB_STORE_PREPARATION.md`)

### שלב 3: יצירת ZIP לפרסום
```bash
# צור ZIP עם קבצים נדרשים בלבד
zip -r Moodle_Downloader_Extension_Store.zip \
  manifest.json \
  popup.html popup.js content.js utils.js background.js \
  styles.css guide.html \
  icons/
```

### שלב 4: העלאה ופרסום
1. לחץ על "New Item" ב-Dashboard
2. העלה את קובץ ה-ZIP
3. מלא את כל הפרטים:
   - שם קצר (45 תווים מקסימום)
   - תיאור מלא (16,000 תווים מקסימום)
   - קטגוריה: Productivity / Education
   - צילומי מסך
   - מילות מפתח
4. בחר Visibility (Public/Unlisted)
5. שלח לבדיקה

### שלב 5: בדיקה ואישור
- Google בודק את התוסף (מספר ימים)
- לאחר אישור, התוסף יפורסם

ראה את הקובץ `CHROME_WEB_STORE_PREPARATION.md` להוראות מפורטות.

---

## 📝 רשימת בדיקה לפני פרסום

### לפני העלאה ל-GitHub:
- [ ] כל הקבצים קיימים
- [ ] README.md מעודכן
- [ ] .gitignore קיים
- [ ] LICENSE קיים
- [ ] CHANGELOG.md מעודכן

### לפני פרסום ב-Chrome Web Store:
- [ ] התוסף עובד ללא שגיאות
- [ ] צילומי מסך מוכנים
- [ ] תיאור מלא כתוב
- [ ] Privacy Policy מוכן (אם נדרש)
- [ ] התוסף תואם ל-Chrome Web Store Policies

---

## 🔗 קישורים שימושיים

### GitHub:
- [GitHub](https://github.com)
- [GitHub Desktop](https://desktop.github.com/)
- [Git Documentation](https://git-scm.com/doc)

### Chrome Web Store:
- [Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [Store Policies](https://developer.chrome.com/docs/webstore/program-policies/)
- [Manifest V3 Docs](https://developer.chrome.com/docs/extensions/mv3/)
- [Review Process](https://developer.chrome.com/docs/webstore/review/)

### תיעוד:
- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/reference/)
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/mv3/intro/)

---

## 📧 תמיכה

לפניות תמיכה:
- **מייל:** idan.vaknin1@live.biu.ac.il
- **GitHub Issues:** (לאחר יצירת repository)

---

## ✅ סיכום

לאחר השלמת כל השלבים:
1. ✅ התוסף יהיה זמין ב-GitHub/GitLab
2. ✅ המשתמשים יוכלו להוריד מהקובץ המארז
3. ✅ התוסף יהיה זמין ב-Chrome Web Store (לאחר אישור)

**בהצלחה עם הפרסום! 🚀**

---

**© 2025 Idan Vaknin | אוניברסיטת בר אילן**


