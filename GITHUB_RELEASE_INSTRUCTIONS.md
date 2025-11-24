# 🚀 הוראות ליצירת GitHub Release

## שלב 1: יצירת Repository ב-GitHub

1. היכנס ל-[GitHub](https://github.com) והתחבר לחשבון שלך
2. לחץ על הכפתור **"+"** בפינה הימנית העליונה
3. בחר **"New repository"**
4. מלא את הפרטים:
   - **Repository name:** `moodle-downloader-extension`
   - **Description:** `Chrome extension for downloading PDFs and recordings from Moodle course pages (Bar Ilan University)`
   - **Visibility:** Public (מומלץ) או Private
   - **⚠️ אל תסמן** "Initialize with README" (כבר יש לנו README)
   - **⚠️ אל תסמן** "Add .gitignore" (כבר יש לנו)
   - **⚠️ אל תסמן** "Choose a license" (כבר יש לנו LICENSE)
5. לחץ על **"Create repository"**

## שלב 2: חיבור Repository המקומי ל-GitHub

לאחר יצירת ה-repository, GitHub יציג לך הוראות. בחר **"push an existing repository from the command line"**

הפעל את הפקודות הבאות (החלף `YOUR_USERNAME` בשם המשתמש שלך ב-GitHub):

```bash
git remote add origin https://github.com/YOUR_USERNAME/moodle-downloader-extension.git
git branch -M main
git push -u origin main
```

**או אם אתה משתמש ב-SSH:**
```bash
git remote add origin git@github.com:YOUR_USERNAME/moodle-downloader-extension.git
git branch -M main
git push -u origin main
```

## שלב 3: יצירת Release

1. פתח את ה-repository ב-GitHub
2. לחץ על **"Releases"** בתפריט הימני (או עבור ישירות ל: `https://github.com/YOUR_USERNAME/moodle-downloader-extension/releases`)
3. לחץ על **"Create a new release"** (או **"Draft a new release"**)
4. מלא את הפרטים:
   - **Choose a tag:** `v1.3.1` (או לחץ על "Create new tag: v1.3.1")
   - **Target:** `main` (או `master` אם זה השם של ה-branch שלך)
   - **Release title:** `Moodle PDF Downloader v1.3.1`
   - **Describe this release:** העתק את התוכן מ-`RELEASE_NOTES.md` או כתוב:
   
   ```markdown
   ## 🎉 גרסה 1.3.1 - עדכון שיפורים
   
   ### תאריך שחרור
   2025-11-24
   
   ### מה חדש?
   
   #### ✨ תכונות חדשות
   - **כפתור תמיכה עם פרטים מוסתרים** - פרטי התמיכה מוסתרים כברירת מחדל ומופיעים בלחיצה על כפתור "תמיכה"
   - **שיפורים נרחבים למדריך השימוש** - איורים ASCII משופרים עם הדגשות אדומות לכל שלב
   
   #### 🔧 שיפורים
   - עדכון כל ההודעות והצהרות מ-"Moodle" ל-"למדא" בכל הקבצים
   - שיפור המדריך עם איורים ויזואליים מפורטים במקום תמונות
   - שיפור חוויית המשתמש במדריך עם הדגשות אדומות וסימונים ברורים
   
   #### 🐛 תיקונים
   - תיקון כל אזכורי "Moodle" ל-"למדא" בכל הקבצים
   
   ### 📦 הורדה
   הורד את הקובץ `Moodle_Downloader_Extension_v1.3.1.zip` למטה והתקן לפי ההוראות ב-`INSTALLATION_INSTRUCTIONS.md`
   
   ### 📧 תמיכה
   לשאלות או בעיות: idan.vaknin1@live.biu.ac.il
   ```

5. **חשוב:** גרור את הקובץ `Moodle_Downloader_Extension_v1.3.1.zip` לאזור **"Attach binaries by dropping them here or selecting them"**
6. לחץ על **"Publish release"** (או **"Save draft"** אם אתה רוצה לבדוק קודם)

## שלב 4: קבלת קישור הורדה

לאחר יצירת ה-Release, הקישור להורדה יהיה:

```
https://github.com/YOUR_USERNAME/moodle-downloader-extension/releases/download/v1.3.1/Moodle_Downloader_Extension_v1.3.1.zip
```

**החלף `YOUR_USERNAME` בשם המשתמש שלך ב-GitHub**

## ✅ אימות

לאחר יצירת ה-Release, בדוק:
1. שהקובץ ZIP מופיע ב-Assets
2. שהקישור להורדה עובד
3. שהתיאור מופיע נכון

## 💡 טיפים

- **תגיות (Tags):** GitHub יוצר תגית אוטומטית `v1.3.1` שתוכל להשתמש בה בעתיד
- **עדכונים עתידיים:** כשתשחרר גרסה חדשה, פשוט צור Release חדש עם תגית חדשה
- **קישור ישיר:** הקישור להורדה תמיד יהיה באותו פורמט: `releases/download/TAG/FILENAME`

---

**🎉 מזל טוב! התוסף שלך מוכן להפצה!**

