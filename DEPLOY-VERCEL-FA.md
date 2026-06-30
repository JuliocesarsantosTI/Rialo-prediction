# راه‌اندازی سایت روی Vercel (رایگان) — قدم‌به‌قدم

این پروژه یک **سایت مستقل** است (دیگر بات/Mini App تلگرام نیست): بازار پیش‌بینی + تب چت «Ask Rialo». همه روی Vercel اجرا می‌شود؛ چت با یک Serverless Function به Groq وصل است و کلید فقط سمت سرورِ Vercel می‌ماند.

محتوای پروژه:
```
index.html        ← خودِ سایت (دو تب: Market و Ask Rialo)
api/ask.js        ← تابع چت (Groq) — سمت سرور Vercel
api/rialo-docs.js ← فایل منبع داک‌های Rialo
```

> آدرس قراردادها و projectId را از قبل داخل `index.html` گذاشته‌ام. فقط دو کار مانده: گذاشتن داک‌ها و کلید Groq.

---

## ۱) داک‌های Rialo را بگذار

فایل `api/rialo-docs.js` را باز کن. متن بین دو بک‌تیک (`` ` ``) را پاک کن و داک‌های Rialo را آنجا بچسبان. (چند صفحه کافی است.)

---

## ۲) پروژه را روی Vercel بیاور

**روش ساده‌تر: از طریق GitHub**

۱. یک ریپوی جدید در GitHub بساز و این سه فایل/پوشه را داخلش بگذار (`index.html`، پوشه‌ی `api/`).
۲. برو https://vercel.com → با GitHub وارد شو → **Add New → Project** → همان ریپو را انتخاب کن.
۳. در صفحه‌ی تنظیمات:
   - **Framework Preset:** Other
   - بقیه را دست نزن (نیازی به build command نیست).
۴. قبل از Deploy، در همان صفحه بخش **Environment Variables** را باز کن و این را اضافه کن:
   - **Key:** `GROQ_API_KEY`
   - **Value:** کلید رایگانت از https://console.groq.com
   - (اختیاری) `GROQ_MODEL` = `llama-3.1-8b-instant`
۵. **Deploy** را بزن. چند ثانیه بعد یک آدرس مثل `https://prediction-arc-xxxx.vercel.app` می‌دهد.

**روش دوم: با Vercel CLI** (اگر GitHub نمی‌خواهی)

```bash
npm i -g vercel
cd prediction-arc-site
vercel            # وارد حساب شو و سوال‌ها را جواب بده
vercel env add GROQ_API_KEY      # کلید Groq را وارد کن (Production)
vercel --prod
```

---

## ۳) تست

آدرس Vercel را در مرورگر باز کن:
- تب **Market**: روی YES/NO شرط بزن (Connect wallet → MetaMask یا WalletConnect).
- تب **Ask Rialo**: یک سؤال درباره‌ی Rialo بپرس — باید از روی داک‌ها جواب بدهد.

اگر چت گفت «not configured»، یعنی `GROQ_API_KEY` را ست نکرده‌ای؛ اگر گفت «docs haven't been added»، یعنی هنوز داک‌ها را در `api/rialo-docs.js` نگذاشته‌ای. بعد از هر تغییر در فایل‌ها یا env، یک‌بار **Redeploy** کن.

---

## نکته‌ی مهم درباره‌ی تسویه‌ی بازار

این سایت کارِ **شرط‌بندی و چت** را انجام می‌دهد، ولی **تسویه‌ی بازار** (خواندن نتیجه از CoinGecko و زدن `resolve` روی قرارداد) هنوز کارِ **keeper** است که روی سرور VPS تو اجرا می‌شود.

- اگر می‌خواهی بازارها خودکار تسویه شوند، همان بک‌اند را روی VPS **روشن نگه دار** (بات تلگرامش حالا بی‌استفاده است ولی ضرری ندارد؛ فقط keeper مهم است). نیازی به Nginx/دامنه برای آن نیست چون فقط به بیرون وصل می‌شود.
- اگر سرور را خاموش کنی، باید بازار را **دستی** تسویه کنی (تابع `resolve(id, winner)` روی قرارداد، با همان کیف پول keeper).

> اگر خواستی keeper را هم از VPS جدا کنی و کاملاً سرورلس شود، باید آن را به یک Cron Job ورسل منتقل کنیم — کار جداگانه‌ای است، بگو تا انجامش بدهیم.

---

## خلاصه
1. داک‌ها → `api/rialo-docs.js`
2. دیپلوی روی Vercel + ست‌کردن `GROQ_API_KEY` در Environment Variables
3. تست هر دو تب
4. keeper را روی VPS روشن نگه‌دار تا بازار خودکار تسویه شود
