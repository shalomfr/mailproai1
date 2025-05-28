# 🚀 Email Configuration Manager - Vercel Edition

## 🎯 פריסה חינמית ב-Vercel + MongoDB Atlas

### מה זה כולל:
- ✅ React Frontend (מתקדם עם RTL)
- ✅ Node.js API (Express + MongoDB)
- ✅ אימות JWT מאובטח  
- ✅ תמיכה ב-Gmail, Outlook, Yahoo ועוד
- ✅ אוטו-השלמת מיילים חכמה

---

## 🛠️ דרישות:
1. **GitHub** (חינם)
2. **Vercel** (חינם) 
3. **MongoDB Atlas** (חינם)

---

## 📋 שלבי הפריסה:

### 1️⃣ MongoDB Atlas:
- עבור ל-https://cloud.mongodb.com
- צור Cluster חינם (M0)
- הגדר משתמש + סיסמה
- קבל connection string

### 2️⃣ GitHub:
- צור repository חדש
- העלה את הקוד

### 3️⃣ Vercel:
- חבר ל-GitHub
- בחר repository
- הגדר Environment Variables
- Deploy!

---

## ⚙️ Environment Variables נדרשים:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/emailconfig
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-key  
ENCRYPTION_KEY=your-32-char-key
CLIENT_URL=https://your-app.vercel.app
```

---

## 🏗️ מבנה הפרויקט:

```
🚀-vercel-deployment/
├── client/          (React App)
├── server/          (Node.js API)
│   ├── api/         (Vercel Functions)
│   └── src/         (Source Code)
├── vercel.json      (Vercel Config)
└── package.json     (Dependencies)
```

---

## 🚀 תוצאה סופית:

אתר מלא ומקצועי ב-URL כמו:
**https://email-config-manager.vercel.app**

---

**📞 צריך עזרה? ספר לי איפה אתה תקוע!** 