# הוראות להעלאה ל-GitHub/GitLab

## 🚀 שלב 1: יצירת Repository

### ב-GitHub:
1. היכנס ל-[GitHub](https://github.com) והתחבר
2. לחץ על הכפתור "+" בפינה הימנית העליונה
3. בחר "New repository"
4. מלא את הפרטים:
   - **Repository name:** `moodle-downloader-extension`
   - **Description:** `Chrome extension for downloading PDFs and recordings from Moodle course pages (Bar Ilan University)`
   - **Visibility:** Public (מומלץ) או Private
   - **אל תסמן** "Initialize with README" (כבר יש לנו README)
5. לחץ על "Create repository"

### ב-GitLab:
1. היכנס ל-[GitLab](https://gitlab.com) והתחבר
2. לחץ על הכפתור "+" → "New project"
3. בחר "Create blank project"
4. מלא את הפרטים דומה ל-GitHub
5. לחץ על "Create project"

## 📦 שלב 2: העלאת הקבצים

### שיטה 1: GitHub Desktop (קלה ביותר)
1. הורד והתקן [GitHub Desktop](https://desktop.github.com/)
2. פתח את GitHub Desktop
3. לחץ על "File" → "Add Local Repository"
4. בחר את התיקייה `Moodle_Downloader_Extension`
5. לחץ על "Publish repository"
6. בחר את ה-repository שיצרת
7. לחץ על "Publish repository"

### שיטה 2: Git Command Line
```bash
# נווט לתיקיית התוסף
cd "C:\Users\idan2\OneDrive - Open University of Israel\BIU\2026\Moodle_Downloader_Extension"

# אתחל repository
git init

# הוסף את כל הקבצים
git add .

# צור commit ראשון
git commit -m "Initial commit: Moodle PDF Downloader v1.3.1"

# הוסף את ה-remote repository
git remote add origin https://github.com/YOUR_USERNAME/moodle-downloader-extension.git

# העלה את הקבצים
git branch -M main
git push -u origin main
```

### שיטה 3: העלאה ידנית דרך הדפדפן
1. פתח את ה-repository שיצרת
2. לחץ על "uploading an existing file"
3. גרור ושחרר את כל הקבצים (או בחר אותם)
4. לחץ על "Commit changes"

## 🏷️ שלב 3: יצירת Release

### דרך GitHub:
1. פתח את ה-repository
2. לחץ על "Releases" בצד ימין
3. לחץ על "Create a new release"
4. מלא את הפרטים:
   - **Tag version:** `v1.3.1`
   - **Release title:** `Moodle PDF Downloader v1.3.1`
   - **Description:** העתק מ-`CHANGELOG.md` (גרסה 1.3.1)
5. גרור את הקובץ `Moodle_Downloader_Extension_v1.3.1.zip` ל-"Attach binaries"
6. לחץ על "Publish release"

### דרך GitLab:
1. פתח את ה-repository
2. לחץ על "Releases" בתפריט השמאלי
3. לחץ על "New release"
4. מלא את הפרטים דומה ל-GitHub
5. העלה את קובץ ה-ZIP
6. לחץ על "Create release"

## 📝 שלב 4: עדכון README

עדכן את הקישורים ב-`README.md`:
- החלף `yourusername` בשם המשתמש שלך
- החלף קישורים ל-releases

## 🔗 שלב 5: הוספת Badges (אופציונלי)

ב-`README.md`, עדכן את ה-badges:
```markdown
[![Version](https://img.shields.io/badge/version-1.3.1-blue.svg)](https://github.com/YOUR_USERNAME/moodle-downloader-extension)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chrome](https://img.shields.io/badge/Chrome-88%2B-blue.svg)](https://www.google.com/chrome/)
```

## 📋 רשימת קבצים להעלאה

### קבצים שצריך להעלות:
- ✅ כל קבצי ה-JavaScript (popup.js, content.js, utils.js, background.js)
- ✅ כל קבצי ה-HTML (popup.html, guide.html)
- ✅ כל קבצי ה-CSS (styles.css)
- ✅ manifest.json
- ✅ תיקיית icons/ (עם כל האייקונים)
- ✅ README.md
- ✅ LICENSE
- ✅ CHANGELOG.md
- ✅ .gitignore
- ✅ כל קבצי התיעוד

### קבצים שלא צריך להעלות:
- ❌ `Moodle_Downloader_Extension_v1.3.1.zip` (יכול להיות ב-Releases)
- ❌ קבצי Python cache (__pycache__)
- ❌ קבצי editor (.vscode, .idea)
- ❌ קבצי OS (.DS_Store, Thumbs.db)

## 🎯 לאחר ההעלאה

### עדכון קישורים:
1. עדכן את הקישורים ב-`README.md`
2. עדכן את הקישורים ב-`INSTALLATION_INSTRUCTIONS.md`
3. עדכן את הקישורים ב-`CHROME_WEB_STORE_PREPARATION.md`

### הוספת Topics (GitHub):
הוסף topics ל-repository:
- `chrome-extension`
- `moodle`
- `pdf-downloader`
- `bar-ilan-university`
- `hebrew`
- `education`

### הוספת About (GitHub):
בדף ה-repository, לחץ על ⚙️ ליד "About" והוסף:
- **Website:** (אם יש)
- **Description:** Chrome extension for downloading PDFs and recordings from Moodle
- **Topics:** (ראה למעלה)

## 📧 קישור שיתוף

לאחר ההעלאה, תוכל לשתף את הקישור:
```
https://github.com/YOUR_USERNAME/moodle-downloader-extension
```

או קישור ישיר להורדה:
```
https://github.com/YOUR_USERNAME/moodle-downloader-extension/releases/latest
```

---

**הערה:** ודא שכל הקבצים הפרטיים (אם יש) לא נכללים ב-repository.


