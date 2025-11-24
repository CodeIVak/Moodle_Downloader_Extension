# 🖥️ מדריך מפורט - GitHub Desktop

## שלב 1: התקנת GitHub Desktop

1. הורד את GitHub Desktop מ-[https://desktop.github.com/](https://desktop.github.com/)
2. התקן את התוכנה
3. התחבר לחשבון GitHub שלך דרך התוכנה

## שלב 2: יצירת Repository ב-GitHub (דרך הדפדפן)

לפני שתשתמש ב-GitHub Desktop, צריך ליצור את ה-repository ב-GitHub:

1. היכנס ל-[GitHub](https://github.com) והתחבר
2. לחץ על הכפתור **"+"** בפינה הימנית העליונה
3. בחר **"New repository"**
4. מלא את הפרטים:
   - **Repository name:** `moodle-downloader-extension`
   - **Description:** `Chrome extension for downloading PDFs and recordings from Moodle course pages (Bar Ilan University)`
   - **Visibility:** Public (מומלץ) או Private
   - **⚠️ אל תסמן** "Initialize with README"
   - **⚠️ אל תסמן** "Add .gitignore"
   - **⚠️ אל תסמן** "Choose a license"
5. לחץ על **"Create repository"**

## שלב 3: פתיחת הפרויקט ב-GitHub Desktop

### אופציה A: אם כבר יש לך repository מקומי (המקרה שלך)

1. פתח את **GitHub Desktop**
2. לחץ על **"File"** → **"Add Local Repository"**
3. לחץ על **"Choose..."** ובחר את התיקייה:
   ```
   C:\Users\idan2\OneDrive - Open University of Israel\BIU\2026\Moodle_Downloader_Extension
   ```
4. לחץ על **"Add Repository"**

### אופציה B: אם אין לך repository מקומי

1. פתח את **GitHub Desktop**
2. לחץ על **"File"** → **"New Repository"**
3. מלא את הפרטים:
   - **Name:** `moodle-downloader-extension`
   - **Local path:** בחר את התיקייה של הפרויקט
   - **Description:** `Chrome extension for downloading PDFs and recordings from Moodle course pages`
   - **⚠️ אל תסמן** "Initialize this repository with a README"
4. לחץ על **"Create Repository"**

## שלב 4: חיבור ל-GitHub Repository

1. ב-GitHub Desktop, לחץ על **"Publish repository"** (אם זה repository חדש)
   - או לחץ על **"Repository"** → **"Repository Settings"** → **"Remote"** → הוסף את ה-URL

2. אם לחצת על "Publish repository":
   - **Name:** `moodle-downloader-extension`
   - **Description:** `Chrome extension for downloading PDFs and recordings from Moodle course pages (Bar Ilan University)`
   - **Keep this code private:** בטל סימון (אם אתה רוצה Public)
   - לחץ על **"Publish Repository"**

3. אם אתה משתמש ב-repository קיים:
   - לחץ על **"Repository"** → **"Repository Settings"**
   - לחץ על **"Remote"**
   - הוסף את ה-URL: `https://github.com/YOUR_USERNAME/moodle-downloader-extension.git`
   - החלף `YOUR_USERNAME` בשם המשתמש שלך

## שלב 5: העלאת הקבצים

1. ב-GitHub Desktop, תראה את כל הקבצים ב-**"Changes"** (בצד שמאל)
2. בדוק שכל הקבצים מסומנים (כולל `Moodle_Downloader_Extension_v1.3.1.zip`)
3. בתחתית, כתוב הודעת commit:
   ```
   Initial commit: Moodle PDF Downloader v1.3.1
   ```
4. לחץ על **"Commit to main"** (או "Commit to master")
5. לחץ על **"Push origin"** (או **"Publish branch"** אם זה הפעם הראשונה)

## שלב 6: יצירת Release (דרך הדפדפן)

GitHub Desktop לא תומך ביצירת Releases, אז צריך לעשות את זה דרך הדפדפן:

1. פתח את ה-repository ב-GitHub:
   ```
   https://github.com/YOUR_USERNAME/moodle-downloader-extension
   ```

2. לחץ על **"Releases"** בתפריט הימני
   - או עבור ישירות ל: `https://github.com/YOUR_USERNAME/moodle-downloader-extension/releases`

3. לחץ על **"Create a new release"** (או **"Draft a new release"**)

4. מלא את הפרטים:
   - **Choose a tag:** לחץ על **"Create new tag: v1.3.1"** וכתוב `v1.3.1`
   - **Target:** בחר `main` (או `master` אם זה השם של ה-branch שלך)
   - **Release title:** `Moodle PDF Downloader v1.3.1`
   - **Describe this release:** העתק את התוכן הבא:

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

5. **חשוב מאוד:** גרור את הקובץ `Moodle_Downloader_Extension_v1.3.1.zip` לאזור **"Attach binaries by dropping them here or selecting them"**
   - הקובץ נמצא בתיקייה: `C:\Users\idan2\OneDrive - Open University of Israel\BIU\2026\Moodle_Downloader_Extension\Moodle_Downloader_Extension_v1.3.1.zip`

6. לחץ על **"Publish release"** (או **"Save draft"** אם אתה רוצה לבדוק קודם)

## שלב 7: קבלת קישור הורדה

לאחר יצירת ה-Release, הקישור להורדה יהיה:

```
https://github.com/YOUR_USERNAME/moodle-downloader-extension/releases/download/v1.3.1/Moodle_Downloader_Extension_v1.3.1.zip
```

**החלף `YOUR_USERNAME` בשם המשתמש שלך ב-GitHub**

## ✅ אימות

לאחר יצירת ה-Release, בדוק:
1. ✅ שהקובץ ZIP מופיע ב-Assets (בצד ימין)
2. ✅ שהקישור להורדה עובד (לחץ על הקובץ)
3. ✅ שהתיאור מופיע נכון

## 🔄 עדכונים עתידיים

כשתשחרר גרסה חדשה:
1. עדכן את הקבצים ב-GitHub Desktop
2. צור commit חדש עם הודעה כמו: `Update to v1.3.2`
3. לחץ על **"Push origin"**
4. צור Release חדש ב-GitHub עם תגית חדשה (למשל `v1.3.2`)
5. צרף את הקובץ ZIP החדש

## 💡 טיפים

- **תגיות (Tags):** GitHub יוצר תגית אוטומטית `v1.3.1` שתוכל להשתמש בה בעתיד
- **קישור ישיר:** הקישור להורדה תמיד יהיה באותו פורמט: `releases/download/TAG/FILENAME`
- **עדכון README:** אם תרצה, עדכן את הקישורים ב-`README.md` לקישור ה-GitHub שלך

---

**🎉 מזל טוב! התוסף שלך מוכן להפצה!**

