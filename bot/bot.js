/* مساعد دار المراسم — شات بوت بدون ذكاء اصطناعي.
   يرد فقط من بيانات المنيوهات واللائحة المعتمدة (bot/kb.js)، ويحوّل للحجز أو المعاينة عبر واتساب. */
(function () {
  'use strict';
  if (window.__dmBot) return; window.__dmBot = true;

  const BASE = (document.currentScript && document.currentScript.src || '').replace(/[^/]*$/, '') || 'bot/';
  const WA = '201111117958';
  const PHONES = ['01111117958', '01010107958', '01222227958'];
  const MAP = 'https://maps.app.goo.gl/WXWC2jJhyESubBve9';
  const ADDRESS = 'شارع حديقة الزهرية، أمام برج القاهرة، الزمالك – القاهرة';
  const DOCNAME = { akhenaten: 'منيو قاعة أخناتون', isis: 'منيو قاعة إيزيس', lotus: 'منيو قاعة اللوتس', mawadda: 'منيو قاعة المودة والرحمة', birthday: 'منيو أعياد الميلاد', special: 'منيو المناسبات الخاصة', photo: 'منيو الفوتو سيشن', rules: 'لائحة تنظيم حجز وإقامة الحفلات' };
  let K = null;

  /* ---------------- text helpers ---------------- */
  const AD = s => String(s).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  const fmt = n => AD(String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '٬'));
  const money = n => fmt(n) + ' ج';
  const ar = s => AD(String(s).replace(/(\d),(\d{3})/g, '$1٬$2'));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const A = s => ar(esc(s));
  function norm(s) {
    return ' ' + String(s || '').toLowerCase()
      .replace(/[ً-ْـٰ]/g, '')
      .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
      .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
      .replace(/(\d)[,٬](\d{3})/g, '$1$2')
      .replace(/[^ء-يa-z0-9%/+-]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  }
  const has = (t, list) => list.some(w => t.includes(w));
  const PRE = '(?:و|ف|ب|ل|ال|وال|فال|بال|لل|وب|ول)?';
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wordRe = (list, suf) => new RegExp(' ' + PRE + '(?:' + list.map(w => reEsc(norm(w).trim())).join('|') + ')' + (suf ? '(?:ي|نا|ها|ه|كم|ك|ات|ين)?' : '') + '(?= )');
  const hasW = (t, list) => list.some(w => t.includes(' ' + w + ' ') || t.includes(' ال' + w + ' ') || t.includes(' و' + w + ' ') || t.includes(' ب' + w + ' '));

  /* ---------------- entities ---------------- */
  const HALLS = {
    akhenaten: ['اخناتون', 'اخنتون', 'اخناتن', 'اخناطون', 'akhenaten', 'akhnaton'],
    isis: ['ايزيس', 'ازيس', 'ايزس', 'ايسيس', 'isis'],
    lotus: ['لوتس', 'لوتاس', 'lotus'],
    mawadda: ['المودة', 'الموده', 'موده والرحمه', 'المودة والرحمة', 'الرحمه', 'mawadda'],
    roof: ['روف', 'roof', 'رووف'],
    glass: ['زجاجيه', 'الزجاج', 'اوبن اير', 'اوبن ايير', 'open air', 'الخيمه', 'خيمه', 'جلاس'],
    lulu: ['لولوه', 'اللولو', 'لولو'],
    marasem: ['قاعه المراسم', 'قاعة المراسم']
  };
  const HALLNAME = { akhenaten: 'قاعة أخناتون', isis: 'قاعة إيزيس', lotus: 'قاعة اللوتس', mawadda: 'قاعة المودة والرحمة', roof: 'الروف توب', glass: 'القاعة الزجاجية (أوبن إير)', lulu: 'قاعة اللؤلؤة', marasem: 'قاعة المراسم' };
  const HALLRE = Object.fromEntries(Object.entries(HALLS).map(([k, ws]) => [k, wordRe(ws)]));
  function findHalls(t) {
    const out = [];
    for (const k of Object.keys(HALLS)) if (HALLRE[k].test(t)) out.push(k);
    if (!out.includes('marasem') && / المراسم /.test(t) && !/ دار المراسم /.test(t) && has(t, [' قاعه ', ' قاعات '])) out.push('marasem');
    return out;
  }
  const EVENTS = {
    katb: ['كتب كتاب', 'كتب الكتاب', 'كتب كتابي', 'كتب كتابنا', 'عقد قران', 'عقد القران', 'قران', 'katb'],
    birthday: ['عيد ميلاد', 'عيد الميلاد', 'اعياد الميلاد', 'اعياد ميلاد', 'بيرث داي', 'بيرثداي', 'birthday', 'بيرزداي'],
    aqiqa: ['عقيقه', 'سبوع', 'aqiqa'],
    special: ['موتمر', 'موتمرات', 'اجتماع', 'ندوه', 'ندوات', 'كوفي بريك', 'coffee', 'ورشه', 'سيمنار', 'مناسبه خاصه', 'مناسبات خاصه', 'محاضره', 'تدريب', 'حفل شركه'],
    photo: ['فوتو سيشن', 'فوتوسيشن', 'photo session', 'سيشن تصوير', 'جلسه تصوير'],
    engagement: ['خطوبه', 'خطوبتي', 'خطوبتنا', 'خطبه', 'engagement'],
    wedding: ['فرح', 'افراح', 'الفرح', 'زفاف', 'زواج', 'جواز', 'wedding', 'عرس', 'الدخله']
  };
  const EVNAME = { wedding: 'حفل زفاف', engagement: 'خطوبة', katb: 'عقد قران', birthday: 'عيد ميلاد', aqiqa: 'عقيقة', special: 'مناسبة خاصة / مؤتمر', photo: 'فوتو سيشن' };
  const EVRE = Object.fromEntries(Object.entries(EVENTS).map(([k, ws]) => [k, wordRe(ws, true)]));
  function findEvent(t) {
    for (const k of Object.keys(EVENTS)) if (EVRE[k].test(t)) return k;
    return null;
  }
  const NUMW = { 'ميه': 100, 'ميت': 100, 'مية': 100, 'ميتين': 200, 'مييتين': 200, 'تلتميه': 300, 'تلاتميه': 300, 'ثلاثمايه': 300, 'ثلاثمائه': 300, 'ربعميه': 400, 'اربعميه': 400, 'اربعمايه': 400, 'خمسميه': 500, 'خمسمايه': 500, 'ستميه': 600, 'ستمايه': 600, 'خمسين': 50, 'ستين': 60, 'سبعين': 70, 'تمانين': 80, 'ثمانين': 80, 'تسعين': 90, 'اربعين': 40, 'تلاتين': 30, 'ثلاثين': 30, 'عشرين': 20 };
  function findCount(t, loose) {
    const unit = '(?:فرد|افراد|شخص|اشخاص|نفر|انفار|معزوم|معازيم|مدعو|مدعوين|ضيف|ضيوف|واحد|حد|كرسي|بني ادم|نفس|طفل|اطفال|عيل|عيال|ولد|بنت|person|persons|people|pax|guests?)';
    let m = t.match(new RegExp('(\\d{1,4}) ?' + unit)) || t.match(new RegExp(' (?:عدد|حوالي|تقريبا|العدد|لعدد|ل|عددنا|هنكون|هيكونوا|حضور|حضورنا|معزومين) ?(\\d{1,4}) '));
    if (m) return +m[1];
    for (const [w, v] of Object.entries(NUMW)) if (new RegExp(' ' + w + ' ?' + unit).test(t)) return v;
    if (loose) {
      m = t.match(/ (\d{1,4}) /);
      if (m && !new RegExp(' ' + m[1] + ' ?(?:الف|ج|جنيه|ك|كيلو|ساعه|م |ص |%|يوم|شهر|سنه)').test(t) && +m[1] >= 5) return +m[1];
      for (const [w, v] of Object.entries(NUMW)) if (t.includes(' ' + w + ' ')) return v;
    }
    return null;
  }
  const WD = ['الاحد', 'الاتنين', 'الاثنين', 'التلات', 'الثلاثاء', 'التلاتاء', 'الاربع', 'الاربعاء'];
  const WE = ['الخميس', 'الجمعه', 'السبت', 'خميس', 'جمعه', 'سبت'];
  const MONTHS = { 'يناير': 1, 'فبراير': 2, 'مارس': 3, 'ابريل': 4, 'مايو': 5, 'يونيو': 6, 'يوليو': 7, 'اغسطس': 8, 'سبتمبر': 9, 'اكتوبر': 10, 'نوفمبر': 11, 'ديسمبر': 12 };
  const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const MON = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  function mkDate(y, mo, d) {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    if (!y) { y = now.getFullYear(); if (new Date(y, mo - 1, d) < now) y++; }
    if (y < 100) y += 2000;
    const t = new Date(y, mo - 1, d);
    return t.getMonth() === mo - 1 && t.getDate() === d ? t : null;
  }
  function findDate(t) {
    let m = t.match(/ (\d{4})-(\d{1,2})-(\d{1,2}) /);
    if (m) return mkDate(+m[1], +m[2], +m[3]);
    m = t.match(/ (\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))? /);
    if (m) return mkDate(m[3] ? +m[3] : 0, +m[2], +m[1]);
    for (const [w, mo] of Object.entries(MONTHS)) {
      m = t.match(new RegExp(' (\\d{1,2}) ?(?:من )?(?:شهر )?' + w + '(?: (\\d{4}))? '));
      if (m) return mkDate(m[2] ? +m[2] : 0, mo, +m[1]);
    }
    return null;
  }
  const dateTxt = d => `${DAYS[d.getDay()]} ${AD(d.getDate())} ${MON[d.getMonth()]} ${AD(d.getFullYear())}`;
  const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  function findDay(t, date) {
    if (date) return [4, 5, 6].includes(date.getDay()) ? 'we' : 'wd';
    if (has(t, [' ويك اند', ' ويكند', 'weekend', 'نهايه الاسبوع', 'اخر الاسبوع', 'اخر الاسبوع', ' اجازه', ' عطله', ' العيد ', ' عيد الفطر', ' عيد الاضحي', ' الاعياد'])) return 'we';
    if (has(t, ['وسط الاسبوع', 'منتصف الاسبوع', 'ايام الاسبوع العاديه', 'weekday', 'يوم عادي', 'ايام عادي'])) return 'wd';
    if (hasW(t, WE)) return 'we';
    if (hasW(t, WD) || / يوم (?:ال)?حد /.test(t)) return 'wd';
    return null;
  }
  const ORD = { 'الاول': 1, 'الأول': 1, 'التاني': 2, 'الثاني': 2, 'التالت': 3, 'الثالث': 3, 'الرابع': 4, 'الخامس': 5, 'واحد': 1, 'اتنين': 2, 'تلاته': 3, 'ثلاثه': 3, 'اربعه': 4, 'خمسه': 5 };
  function findMenu(t) {
    const num = s => { s = s.replace(/^ ?رقم/, ''); const m = s.match(/^ ?(\d)/); if (m) return +m[1]; for (const [w, v] of Object.entries(ORD)) if (s.startsWith(' ' + norm(w).trim()) || s.startsWith(norm(w).trim())) return v; return 0; };
    let m;
    if (!/هاي ?تي ?ب|هاي ?تابل|high ?table/.test(t) && (m = t.match(/(?:هاي ?تي|high ?tea)/))) return { k: 'ht', n: 0 };
    if ((m = t.match(/(?:كوفي ?بريك|coffee ?break)(.{0,8})/))) return { k: 'cb', n: num(m[1]) };
    if ((m = t.match(/اسبيشيال ?(?:ست|سيت|set) ?منيو(.{0,8})/))) return { k: 'ssm', n: num(m[1]) };
    if (!/اوبن ?اي/.test(t) && (m = t.match(/(?:اوبن ?بوفيه|open ?buffet|بوفيه ?مفتوح|البوفيه المفتوح|اوبن)(.{0,8})/))) return { k: 'ob', n: num(m[1]) };
    if ((m = t.match(/(?:ست ?منيو|سيت ?منيو|set ?menu|سيت|ست منيوه)(.{0,8})/))) return { k: 'sm', n: num(m[1]) };
    if ((m = t.match(/(?:منيو|المنيو|منيوه) (?:رقم )?(\d|الاول|التاني|الثاني|التالت|الثالث|الرابع|الخامس) /))) return { k: 'sm', n: num(' ' + m[1]), loose: true };
    if ((m = t.match(/ (?:باكدج|باقه|باكيدج) (?:رقم )?(\d) /))) return { k: 'pk', n: +m[1] };
    return null;
  }

  /* ---------------- KB lookups ---------------- */
  const src = (doc, pg) => `<p class="dmb-src">المصدر: ${DOCNAME[doc]}${pg ? ' – صفحة ' + AD(pg) : ''}</p>`;
  function contentHTML(c) {
    return c.map(s => {
      let h = s.h ? `<b>${A(s.h)}</b>` : '', ul = [];
      const flush = () => { if (ul.length) { h += `<ul>${ul.join('')}</ul>`; ul = []; } };
      (s.o || []).forEach(([k, x]) => { if (k === 'i') ul.push(`<li>${A(x)}</li>`); else { flush(); h += `<p>${A(x)}</p>`; } });
      flush();
      return `<div class="dmb-sec">${h}</div>`;
    }).join('');
  }
  function hallMenu(hid, mq) {
    const h = K.halls[hid]; if (!h || !mq) return null;
    const pre = { sm: 'sm', ob: 'ob', ht: 'ht' }[mq.k] || (mq.k === 'pk' ? 'sm' : null);
    if (!pre) return null;
    if (pre === 'ht') return h.menus.find(m => m.id === 'ht') || null;
    if (!mq.n) return null;
    return h.menus.find(m => m.id === pre + mq.n) || null;
  }
  function tierCost(extra, t) {
    const a = Math.min(extra, 50), b = Math.min(Math.max(extra - 50, 0), 50), c = Math.max(extra - 100, 0);
    return { total: a * t[0] + b * t[1] + c * t[2], parts: [[a, t[0], 'أول ٥٠ وجبة'], [b, t[1], 'من ٥١ إلى ١٠٠ وجبة'], [c, t[2], 'ما زاد عن ١٠٠ وجبة']].filter(p => p[0] > 0) };
  }
  function addonsOf(scope, test) { return K.addons.filter(a => a.s === scope && test(norm(a.n))); }

  /* ---------------- UI ---------------- */
  const CSS = `
.dmb-launch{--b:#C9A45C;position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:30;height:60px;padding:0 8px 0 18px;border:1px solid rgba(201,164,92,.7);border-radius:28px;background:#14203A;color:#F3E7CC;display:flex;align-items:center;gap:10px;font:600 15px/1 "IBM Plex Sans Arabic","Segoe UI",Tahoma,sans-serif;box-shadow:0 10px 28px rgba(3,8,18,.55);cursor:pointer;direction:rtl;transition:transform .2s ease}
.dmb-launch:hover{transform:translateY(-2px)}
.dmb-launch .dmb-lt{display:inline-grid;gap:4px;line-height:1.15}
.dmb-launch .dmb-lt .en{font:700 17px/1 "Segoe UI","Helvetica Neue",Arial,sans-serif;color:#F3E7CC;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;direction:ltr}
.dmb-launch .dmb-lt .ar{width:0;min-width:100%;font:600 15px/1.2 "IBM Plex Sans Arabic","Segoe UI",sans-serif;color:#C9A45C;text-align:center;white-space:nowrap;overflow:hidden}
.dmb-launch .dmb-ic{width:42px;height:42px;border-radius:50%;background:linear-gradient(145deg,#DDBE7C,#A9843E);color:#14203A;display:flex;align-items:center;justify-content:center;flex:none;order:-1}
.dmb-launch svg{width:22px;height:22px}
.dmb-launch:focus-visible{outline:2px solid #F3E7CC;outline-offset:3px}
.dmb-open .dmb-launch{display:none}
@media(max-width:420px){.dmb-launch{right:12px;padding:0 6px 0 14px;gap:8px}.dmb-launch .dmb-lt .en{font-size:15px}.dmb-launch .dmb-lt .ar{font-size:13.5px}.dmb-launch .dmb-ic{width:44px;height:44px}}
body.printing .dmb-launch,body.printing .dmb-panel{display:none!important}
@media(max-width:560px){html.dmb-open,html.dmb-open body{overflow:hidden}}
.dmb-panel{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:130;width:min(410px,calc(100vw - 32px));height:min(660px,calc(100dvh - 32px));display:flex;flex-direction:column;background:#0E1729;color:#F3E7CC;border:1px solid rgba(201,164,92,.45);border-radius:20px;box-shadow:0 24px 60px rgba(3,8,18,.7);overflow:hidden;direction:rtl;font-family:"IBM Plex Sans Arabic","Segoe UI",Tahoma,sans-serif;font-size:15px;line-height:1.75}
.dmb-panel[hidden]{display:none}
@media(max-width:560px){.dmb-panel{left:0;right:0;top:0;bottom:auto;width:auto;height:100dvh;border-radius:0;border:0;padding-bottom:env(safe-area-inset-bottom,0px)}.dmb-m{max-width:96%}}
.dmb-hd{display:flex;align-items:center;gap:12px;padding:14px 16px 13px;background:#14203A;border-bottom:1px solid #C9A45C;box-shadow:0 3px 0 -2px rgba(201,164,92,.35)}
.dmb-hd img{width:46px;height:auto;flex:none}
.dmb-hd .dmb-tt{flex:1;min-width:0;display:flex;justify-content:flex-start}
.dmb-hd .dmb-nm{display:inline-grid;gap:3px;max-width:100%}
.dmb-hd b{display:block;font-family:"Amiri","Noto Naskh Arabic",serif;font-weight:700;font-size:20px;color:#F3E7CC;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@media(max-width:420px){.dmb-hd b{font-size:18px}.dmb-hd img{width:38px}}
.dmb-hd b.en{font:700 19px/1.25 "Segoe UI","Helvetica Neue",Arial,sans-serif;letter-spacing:.07em;text-transform:uppercase;direction:ltr;text-align:right}
@media(max-width:420px){.dmb-hd b.en{font-size:16.5px}}
.dmb-hd small{width:0;min-width:100%;display:flex;align-items:center;justify-content:center;gap:6px;color:#C9A45C;font-size:15px;font-weight:600;line-height:1.5;margin-top:2px;letter-spacing:.02em}
.dmb-hd small .ar{white-space:nowrap;overflow:hidden}
.dmb-hd small i{width:7px;height:7px;border-radius:50%;background:#4FC27E;box-shadow:0 0 0 3px rgba(79,194,126,.18)}
.dmb-hd button{flex:none;width:36px;height:36px;border-radius:50%;border:1px solid rgba(243,231,204,.22);background:transparent;color:#F3E7CC;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.dmb-hd button:hover{border-color:#C9A45C;color:#C9A45C}
.dmb-hd button:focus-visible,.dmb-chips button:focus-visible,.dmb-btn:focus-visible{outline:2px solid #C9A45C;outline-offset:2px}
.dmb-log{flex:1;overflow-y:auto;padding:16px 14px 8px;display:flex;flex-direction:column;gap:12px;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:rgba(201,164,92,.4) transparent}
.dmb-m{max-width:94%;word-wrap:break-word}
.dmb-b{align-self:flex-start;background:#FBF7EE;color:#1F2B42;border:1px solid #E3D3AE;border-radius:4px 16px 16px 16px;padding:13px 15px 12px;box-shadow:0 2px 0 rgba(169,132,62,.25)}
.dmb-u{align-self:flex-end;background:#24375A;color:#F6EEDB;border:1px solid rgba(201,164,92,.35);border-radius:16px 4px 16px 16px;padding:9px 14px;font-weight:500}
.dmb-m p{margin:0 0 7px}.dmb-m p:last-child{margin-bottom:0}
.dmb-m ul,.dmb-m ol{margin:4px 0 9px;padding-inline-start:20px}.dmb-m li{margin:2px 0}
.dmb-b ul li::marker{color:#A9843E}.dmb-b ol li::marker{color:#8A6A2C;font-weight:700}
.dmb-b b{color:#14203A}
.dmb-b a{color:#7A5B22}
.dmb-sec{margin:8px 0 6px}.dmb-sec>b{display:block;color:#8A6A2C;font-size:14px;font-weight:700;margin-bottom:1px}
.dmb-sec p{color:#5D667A;font-size:13px;margin:0}
.dmb-h{font-family:"Amiri","Noto Naskh Arabic",serif;font-weight:700;font-size:20px;color:#14203A;margin:0 0 6px!important;line-height:1.35;padding-bottom:6px;border-bottom:1px solid #E3D3AE}
.dmb-t{width:100%;border-collapse:collapse;margin:8px 0 10px;font-size:13.5px}
.dmb-t th,.dmb-t td{padding:7px 6px;border-bottom:1px dotted #D9C79F;text-align:right;vertical-align:top}
.dmb-t th{color:#8A6A2C;font-weight:700;font-size:12px;border-bottom:1px solid #C9A45C}
.dmb-t small{color:#6B7385}
.dmb-t td.n{white-space:nowrap;font-weight:700;color:#14203A;text-align:left;font-variant-numeric:tabular-nums}
.dmb-t tr.tot td{background:#14203A;color:#F3E7CC;border:0;font-weight:700;padding:9px 10px}
.dmb-t tr.tot td.n{color:#E4C27F}
.dmb-t tr.tot td:first-child{border-radius:0 8px 8px 0}.dmb-t tr.tot td:last-child{border-radius:8px 0 0 8px}
.dmb-note{font-size:12.5px;color:#4C566B;background:#F4ECDB;border-inline-start:3px solid #C9A45C;padding:6px 10px;border-radius:0 6px 6px 0;margin:7px 0!important}
.dmb-src{font-size:11.5px;color:#8A8F9C;margin-top:9px!important;padding-top:7px;border-top:1px solid #EADFC4}
.dmb-law summary{cursor:pointer;color:#7A5B22;font-size:13px;font-weight:600;margin-top:8px}
.dmb-law p{font-size:12.5px;color:#3E485C;background:#F4ECDB;padding:8px 10px;border-radius:8px;margin:6px 0!important;line-height:1.8}
.dmb-acts{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px}
.dmb-btn{display:inline-flex;align-items:center;gap:7px;padding:7px 13px;border-radius:999px;border:1px solid #14203A;background:transparent;color:#14203A;font:600 13px/1.3 inherit;font-family:inherit;cursor:pointer;text-decoration:none}
.dmb-btn:hover{background:#14203A;color:#F3E7CC}
.dmb-btn.wa{background:#1DA851;border-color:#1DA851;color:#fff}
.dmb-btn.wa:hover{background:#168A42;border-color:#168A42}
.dmb-btn.pri{background:#14203A;color:#F3E7CC}
.dmb-btn.pri:hover{background:#24375A}
.dmb-chips{display:flex;flex-wrap:wrap;gap:7px;padding:6px 14px 10px}
.dmb-chips:empty{display:none}
.dmb-chips button{padding:6px 13px;border-radius:999px;border:1px solid rgba(201,164,92,.55);background:transparent;color:#F3E7CC;font:500 13px/1.35 inherit;font-family:inherit;cursor:pointer}
.dmb-chips button:hover{background:#C9A45C;color:#14203A}
.dmb-in{display:flex;gap:8px;padding:11px 14px;border-top:1px solid rgba(201,164,92,.3);background:#14203A}
.dmb-in input{flex:1;min-width:0;height:46px;border-radius:23px;border:1px solid transparent;background:#FBF7EE;color:#1F2B42;padding:0 18px;font:16px inherit;font-family:inherit;direction:rtl}
.dmb-in input:focus{outline:none;border-color:#C9A45C;box-shadow:0 0 0 3px rgba(201,164,92,.3)}
.dmb-in input::placeholder{color:#8A8F9C}
.dmb-in button{flex:none;height:46px;min-width:46px;padding:0 16px;gap:6px;border-radius:23px;border:0;font:700 15px/1 inherit;font-family:inherit;background:linear-gradient(145deg,#DDBE7C,#A9843E);color:#14203A;cursor:pointer;display:flex;align-items:center;justify-content:center}
.dmb-in button svg{width:20px;height:20px;transform:scaleX(-1)}
.dmb-typing{align-self:flex-start;display:flex;gap:5px;padding:14px 16px;background:#FBF7EE;border:1px solid #E3D3AE;border-radius:4px 16px 16px 16px}
.dmb-typing i{width:7px;height:7px;border-radius:50%;background:#A9843E;animation:dmbB 1s infinite ease-in-out}
.dmb-typing i:nth-child(2){animation-delay:.15s}.dmb-typing i:nth-child(3){animation-delay:.3s}
@keyframes dmbB{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}
.dmb-wide{max-width:100%;width:100%;align-self:stretch}
.dmb-form{display:flex;flex-direction:column;gap:9px;margin-top:10px}
.dmb-form input{width:100%;box-sizing:border-box;height:52px;border-radius:12px;border:1.5px solid #C9A45C;background:#fff;color:#14203A;padding:0 14px;font:17px inherit;font-family:inherit;color-scheme:light;cursor:pointer}
.dmb-form input:focus{outline:none;box-shadow:0 0 0 3px rgba(201,164,92,.35)}
.dmb-form .dmb-btn{width:100%;justify-content:center;height:50px;font-size:16px;border-radius:12px}
.dmb-form .dmb-btn:disabled{opacity:.55;cursor:default}
.dmb-form .dmb-hint{font-size:12.5px;color:#6B7385;margin:0}
.dmb-hr{border:0;border-top:1px solid #E3D3AE;margin:12px 0}
@media(prefers-reduced-motion:reduce){.dmb-typing i{animation:none}.dmb-launch{transition:none}}
`;
  const ICON_CHAT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3C6.5 3 2 6.8 2 11.5c0 2.4 1.2 4.6 3.1 6.1L4.4 21l3.9-1.9c1.2.4 2.4.6 3.7.6 5.5 0 10-3.8 10-8.5S17.5 3 12 3zm-4 9.7a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4zm4 0a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4zm4 0a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4z"/></svg>';
  const ICON_SEND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z"/></svg>';
  const ICON_WA = '<svg viewBox="0 0 32 32" width="16" height="16" aria-hidden="true"><path fill="#fff" d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3zm5.8 15.7c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1a8.7 8.7 0 0 1-4.3-3.8c-.3-.6.3-.5.9-1.7.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.7 3.7 0 0 0-1.1 2.7 6.4 6.4 0 0 0 1.3 3.4 14.6 14.6 0 0 0 5.6 5c2.1.9 2.9 1 4 .8a3.4 3.4 0 0 0 2.2-1.6 2.8 2.8 0 0 0 .2-1.6c-.1-.1-.3-.2-.6-.4z"/></svg>';

  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const launch = document.createElement('button');
  launch.type = 'button'; launch.className = 'dmb-launch'; launch.setAttribute('aria-label', 'مساعد دار المراسم الذكي – اسأل عن القاعات والأسعار');
  launch.innerHTML = '<span class="dmb-ic">' + ICON_CHAT + '</span><span class="dmb-lt"><b class="en">Dar El-Marasem AI</b><small class="ar">مساعد دار المراسم الذكي</small></span>';
  const panel = document.createElement('section');
  panel.className = 'dmb-panel'; panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'مساعد دار المراسم الذكي');
  panel.innerHTML = `<div class="dmb-hd"><img src="logo.png" alt=""><div class="dmb-tt"><div class="dmb-nm"><b class="en">Dar El-Marasem AI</b><small><i aria-hidden="true"></i><span class="ar">مساعد دار المراسم الذكي</span></small></div></div><button type="button" class="dmb-rs" aria-label="محادثة جديدة" title="محادثة جديدة">↺</button><button type="button" class="dmb-x" aria-label="إغلاق" title="إغلاق">✕</button></div>
<div class="dmb-log" aria-live="polite"></div><div class="dmb-chips"></div>
<form class="dmb-in" autocomplete="off"><input type="text" enterkeyhint="send" placeholder="اكتبوا سؤالكم… مثال: سعر قاعة إيزيس لـ ٢٠٠ فرد" aria-label="اكتبوا سؤالكم"><button type="submit" aria-label="إرسال">${ICON_SEND}<span>إرسال</span></button></form>`;
  document.body.appendChild(launch); document.body.appendChild(panel);
  const log = panel.querySelector('.dmb-log'), chipsEl = panel.querySelector('.dmb-chips'), form = panel.querySelector('form'), input = form.querySelector('input');

  let S = {}, FLOW = null, started = false, ACT = [];
  function reset() { S = { hall: null, event: null, count: null, day: null, date: null, menu: null }; FLOW = null; }
  reset();

  function scroll() { requestAnimationFrame(() => { log.scrollTop = log.scrollHeight; }); }
  function addUser(t) { const d = document.createElement('div'); d.className = 'dmb-m dmb-u'; d.textContent = t; log.appendChild(d); scroll(); }
  function bot(html, acts) {
    const d = document.createElement('div'); d.className = 'dmb-m dmb-b'; d.innerHTML = html;
    if (acts && acts.length) {
      const w = document.createElement('div'); w.className = 'dmb-acts';
      acts.forEach(a => {
        const el = document.createElement(a.href ? 'a' : 'button');
        el.className = 'dmb-btn' + (a.cls ? ' ' + a.cls : '');
        el.innerHTML = (a.cls === 'wa' ? ICON_WA : '') + esc(a.t);
        if (a.href) { el.href = a.href; if (/^https?:|^tel:/.test(a.href)) { el.target = a.href.startsWith('tel:') ? '' : '_blank'; el.rel = 'noopener'; } }
        else el.type = 'button';
        if (a.go) el.addEventListener('click', e => { e.preventDefault(); goTo(a.go); });
        if (a.fn) el.addEventListener('click', () => { a.fn(); });
        w.appendChild(el);
      });
      d.appendChild(w);
    }
    log.appendChild(d); scroll(); return d;
  }
  function chips(list) {
    ACT = list || [];
    chipsEl.innerHTML = '';
    ACT.forEach(c => { const b = document.createElement('button'); b.type = 'button'; b.textContent = ar(c.t); b.addEventListener('click', () => { addUser(ar(c.t)); chips([]); think(() => c.fn ? c.fn() : respond(c.q || c.t)); }); chipsEl.appendChild(b); });
  }
  function think(fn) {
    const t = document.createElement('div'); t.className = 'dmb-typing'; t.innerHTML = '<i></i><i></i><i></i>'; log.appendChild(t); scroll();
    setTimeout(() => { t.remove(); try { fn(); } catch (e) { console.error(e); fallback(); } }, 260);
  }
  function goTo(hash) {
    try { history.pushState(null, '', '#' + hash); } catch (e) { location.hash = hash; }
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    if (matchMedia('(max-width:560px)').matches) close();
  }
  const waURL = msg => `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
  const waAct = (msg, t) => ({ t: t || 'تواصلوا مع فريق الحفلات عبر واتساب', href: waURL(msg), cls: 'wa' });

  let KBQ = null;
  function loadKB(cb) {
    if (K) return cb();
    if (window.DMKB) { K = window.DMKB; return cb(); }
    if (KBQ) { KBQ.push(cb); return; }
    KBQ = [cb];
    const s = document.createElement('script'); s.src = BASE + 'kb.js';
    s.onload = () => { K = window.DMKB; const q = KBQ; KBQ = null; q.forEach(f => f()); };
    s.onerror = () => { const q = KBQ; KBQ = null; if (!panel.hidden || q.length > 1) bot('<p>تعذّر تحميل بيانات المساعد. يُرجى إعادة فتح الصفحة، أو التواصل مع فريق الحفلات.</p>', [waAct('دار المراسم لضباط الشرطة – أرغب في الاستفسار عن حجز حفل')]); };
    document.head.appendChild(s);
  }

  function open() {
    panel.hidden = false; document.documentElement.classList.add('dmb-open'); fitVV();
    loadKB(() => { if (!started) { started = true; welcome(); } });
    setTimeout(() => input.focus({ preventScroll: true }), 60);
  }
  const vv = window.visualViewport;
  function fitVV() {
    if (!vv || panel.hidden || !matchMedia('(max-width:560px)').matches) { panel.style.height = ''; panel.style.top = ''; return; }
    panel.style.height = vv.height + 'px'; panel.style.top = vv.offsetTop + 'px'; scroll();
  }
  if (vv) { vv.addEventListener('resize', fitVV); vv.addEventListener('scroll', fitVV); }
  input.addEventListener('focus', () => setTimeout(fitVV, 300));
  function close() { panel.hidden = true; document.documentElement.classList.remove('dmb-open'); launch.focus({ preventScroll: true }); }
  launch.addEventListener('click', open);
  const preload = () => loadKB(() => {});
  if ('requestIdleCallback' in window) requestIdleCallback(preload, { timeout: 4000 }); else setTimeout(preload, 2500);
  panel.querySelector('.dmb-x').addEventListener('click', close);
  panel.querySelector('.dmb-rs').addEventListener('click', () => { log.innerHTML = ''; reset(); welcome(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) close(); });
  form.addEventListener('submit', e => {
    e.preventDefault(); const v = input.value.trim(); if (!v || !K) return;
    input.value = ''; addUser(v); chips([]); think(() => respond(v));
  });

  /* ---------------- conversation ---------------- */
  const MAIN = () => [
    { t: 'أسعار القاعات', q: 'أسعار القاعات' }, { t: 'ترشيح قاعة مناسبة', fn: () => startRec() },
    { t: 'المنيوهات', q: 'المنيوهات' }, { t: 'سياسة الحجز والسداد', q: 'ازاي احجز' },
    { t: 'حجز موعد معاينة', fn: () => startVisit() }, { t: 'العنوان والتواصل', q: 'العنوان والتليفون' }
  ];
  function welcome() {
    bot(`<p class="dmb-h">مرحباً بكم في دار المراسم لضباط الشرطة</p><p>أنا <b>مساعد دار المراسم الذكي</b>، وأستطيع مساعدتكم في:</p><ul><li>أسعار القاعات والباكدجات ومحتوى كل منيو</li><li>أي خدمة أو إضافة: هل هي مشمولة في الباكدج وسعرها إن وُجد</li><li>حساب تكلفة تقديرية حسب العدد ويوم الحفل</li><li>اختيار القاعة المناسبة لمناسبتكم</li><li>شروط الحجز والسداد والإلغاء وفق اللائحة</li><li>تجهيز طلب الحجز أو موعد المعاينة وإرساله لفريق الحفلات</li></ul><p>اكتبوا سؤالكم بأي صيغة، أو اختاروا من الاقتراحات.</p><p class="dmb-src">جميع الإجابات مستندة إلى المنيوهات واللائحة المعتمدة بالدار.</p>`);
    chips(MAIN());
  }
  function fallback(t) {
    bot(`<p>هذه المعلومة غير واردة في المنيوهات واللائحة المعتمدة، لذلك لا أستطيع تأكيدها.</p><p>ويسعد فريق الحفلات الرد على استفساركم مباشرةً عبر واتساب أو الهاتف.</p>`,
      [waAct('دار المراسم لضباط الشرطة – استفسار' + (t ? ':\n' + t : '')), { t: 'اتصلوا بنا', fn: contact }]);
    chips(MAIN());
  }

  let LASTT = '';
  function respond(raw) {
    const t = norm(raw); LASTT = t;
    const halls = findHalls(t), ev = findEvent(t), date = findDate(t);
    const menuQ = findMenu(t);
    const nw = t.trim().split(' ').length;
    const count = findCount(t, (FLOW && FLOW.wantCount) || nw <= 3 || / (?:لو|طب|طيب|وللو|ول) \d/.test(t));
    const day = findDay(t, date);
    if (FLOW && FLOW.step) { if (FLOW.step(raw, t, { halls, ev, count, date, day })) return; }
    const prevHall = S.hall;
    if (halls.length && halls[0] !== S.hall && !menuQ) S.menu = null;
    if (halls.length) S.hall = halls[0];
    if (ev && ev !== S.event && !halls.length && !(ev === 'katb' && ['lotus', 'mawadda'].includes(S.hall))) S.hall = null;
    if (ev) S.event = ev;
    else if (halls.some(h => ['akhenaten', 'isis'].includes(h)) && S.event && !['wedding', 'engagement'].includes(S.event)) S.event = null;
    if (count) S.count = count;
    if (date) S.date = date;
    if (day) S.day = day;
    if (menuQ) S.menu = menuQ;

    const W = (...ws) => wordRe(ws).test(t);
    const short = nw <= 4;

    if (short && W('شكرا', 'متشكر', 'تسلم', 'ميرسي', 'thank', 'thanks', 'جزاك', 'الف شكر')) { bot('<p>العفو، يسعدنا خدمتكم دائماً، ونحن في خدمتكم لأي استفسار آخر.</p>'); chips(MAIN()); return; }
    if (short && !menuQ && W('اهلا', 'السلام', 'سلام عليكم', 'هاي', 'hi', 'hello', 'صباح', 'مساء', 'الو', 'ازيك', 'ازيكم') && !halls.length && !ev && !hasItemWord(t)) { bot('<p>أهلاً وسهلاً بكم في دار المراسم لضباط الشرطة. كيف يمكننا خدمتكم؟</p><p>يمكنكم السؤال عن أسعار القاعات والمنيوهات وأي خدمة أو إضافة، أو طلب ترشيح القاعة المناسبة وحساب التكلفة.</p>'); chips(MAIN()); return; }

    // viewing & booking
    if (W('معاينه', 'اعاين', 'اشوف القاعه', 'اشوف القاعات', 'اتفرج علي القاعه', 'زياره', 'اجي اشوف', 'نيجي نشوف', 'اجي ازوركم')) {
      if (W('مواعيد', 'امتي', 'الساعه كام', 'وقت') && !W('احجز', 'عاوز', 'عايز', 'ابغي', 'اريد', 'حابب')) return visitInfo();
      return startVisit();
    }
    const wantBook = W('احجز', 'نحجز', 'عاوز حجز', 'عايز حجز', 'اريد حجز', 'ابغي احجز', 'حابب احجز', 'ابدا الحجز', 'طلب حجز', 'اعمل حجز');
    if (W('ازاي احجز', 'كيف احجز', 'طريقه الحجز', 'خطوات الحجز', 'الحجز ازاي', 'الحجز بيتم ازاي', 'ازاي الحجز', 'سياسه الحجز', 'اجراءات الحجز', 'تفاصيل الحجز', 'معلومات الحجز', 'نظام الحجز', 'احجز اونلاين', 'الحجز اونلاين')) return topic('howbook');

    // regulation topics
    const tp = ruleTopic(t);
    if (tp && !(wantBook && tp === 'deposit' && !W('مقدم', 'عربون'))) return topic(tp);
    if ((date || W('يوم', 'تاريخ', 'ميعاد')) && W('متاح', 'فاضي', 'فاضيه', 'محجوز', 'محجوزه', 'available', 'متاحه', 'ينفع')) return topic('avail');
    if (W('المواعيد المتاحه', 'في ميعاد فاضي', 'ايام فاضيه')) return topic('avail');
    if (wantBook) return startBook();

    if (W('العنوان', 'عنوان', 'مكانكم', 'لوكيشن', 'location', 'address', 'خريطه', 'اوصل', 'اوصلكم', 'انتو فين', 'انتم فين', 'الدار فين', 'مكان الدار') || (W('فين') && short && !findMenu(t) && !hasItemWord(t) && !has(t, [' منيو', ' المنيو', ' سعر', ' اسعار', ' كوش', ' الكوش', ' ديكور', ' الديكور', ' صور', ' الصور']) && !halls.length)) return contact(true);
    if (W('رقم التليفون', 'رقم تليفون', 'رقم الموبايل', 'رقمكم', 'ارقامكم', 'الارقام', 'ارقام', 'رقم للتواصل', 'رقم الواتس', 'تليفون', 'تلفون', 'موبايل', 'اتصل', 'نتواصل', 'تواصل', 'واتس', 'whatsapp', 'هاتف', 'phone', 'فيسبوك', 'انستجرام', 'انستا', 'صفحتكم', 'اتكلم مع', 'اكلم حد', 'اكلمكم', 'حد يكلمني', 'موظف', 'خدمه العملاء', 'customer service')) return contact();

    const priceW = W('سعر', 'اسعار', 'بكام', 'بكم', 'تكلفه', 'تكاليف', 'تتكلف', 'يتكلف', 'هيتكلف', 'كام', 'فلوس', 'ميزانيه', 'ميزانيتي', 'كلفه', 'price', 'cost', 'how much', 'احسب', 'احسبلي', 'حساب', 'اجمالي', 'الاجمالي', 'توتال', 'هدفع', 'ادفع كام', 'الحسبه');
    const menuW = W('منيو', 'منيوهات', 'المنيو', 'اكل', 'الاكل', 'اصناف', 'الاصناف', 'اطباق', 'وجبه', 'وجبات', 'الوجبات', 'بوفيه', 'عشا', 'العشا', 'بتقدموا', 'بيتقدم', 'تقدموا ايه', 'فيه ايه', 'فيها ايه', 'مكونات', 'محتوي', 'menu');
    const incW = W('بيشمل', 'يشمل', 'بتشمل', 'شامل', 'بيتضمن', 'يتضمن', 'متضمن', 'ضمن الباكدج', 'الباكدج فيه', 'الباكدج فيها', 'معاه ايه', 'جوه الباكدج', 'مع الباكدج', 'مجاني', 'ببلاش');
    const capW = W('سعه', 'تساع', 'تستوعب', 'تكفي', 'كام فرد', 'كام شخص', 'كام نفر', 'بتاخد كام', 'تاخد كام', 'بتشيل', 'تشيل', 'اقصي عدد', 'اكبر عدد', 'اقل عدد', 'الحد الادني', 'الحد الاقصي', 'capacity');
    const recW = W('انسب', 'ترشح', 'رشحلي', 'رشح', 'تنصح', 'تنصحني', 'اختار', 'انهي قاعه', 'اي قاعه', 'ايه القاعه', 'قاعه مناسبه', 'مناسبه لعدد', 'ايه المناسب', 'ايه الافضل', 'افضل قاعه', 'تقترح', 'اقتراح');
    const cheapW = W('ارخص', 'اقل سعر', 'اقتصادي', 'اقل تكلفه', 'ارخص حاجه', 'الارخص');
    const dearW = W('اغلي', 'اعلي سعر', 'اغلي باكدج', 'اغلي حاجه', 'الاغلي');
    const decorW = W('ديكور', 'ديكورات', 'كوشه', 'كوشات', 'الكوشه');
    const timeW = W('مواعيد', 'ميعاد', 'معاد', 'الساعه كام', 'امتي', 'الساعه');
    const vendorW = W('من بره', 'من برا', 'من الخارج', 'خارجي');

    // knowledge search over every document
    const R = search(t);
    const itemish = hasItemWord(t) || (R.best >= 3.5 && R.cover >= 0.7);
    const strongItem = R.res.length && R.cover >= 0.6 && !menuQ && itemish;

    const otherItem = ITEMWORDS.filter(w => w !== 'كوشه').some(w => canon(t).includes(' ' + w + ' '));
    if (S.event === 'katb' && timeW && (!priceW || W('الساعه كام')) && !otherItem) return katbTimes();
    if (halls.length && short && !priceW && !count && ['katb', 'birthday', 'special', 'aqiqa'].includes(S.event) && !ev) {
      if (S.event === 'katb' && ['lotus', 'mawadda'].includes(halls[0])) return katb(halls[0]);
      if (S.event === 'birthday' && ['lotus', 'roof', 'glass'].includes(halls[0])) return halls[0] === 'lotus' ? birthday() : hallBrief(halls[0]);
      if (S.event === 'special') return ['lulu', 'marasem'].includes(halls[0]) ? hallBrief(halls[0]) : special();
    }
    if (W('سمك', 'اسماك', 'سي فود', 'ماكولات بحريه', 'seafood', 'fish')) return knowledge(norm('سيمون سالمون جمبري'), raw, null, null, { lead: '<p>لا يوجد طبق سمك رئيسي في منيوهات الأفراح، وتتوفر الأصناف البحرية التالية:</p>', minCover: 0.3, rel: 0.5 }) || fallback(raw);
    if (dearW) return mostExpensive();
    if (cheapW) return cheapest();
    if (W('اكبر قاعه', 'اصغر قاعه', 'اقل قاعه', 'اكبر سعه', 'اقل سعه', 'سعه القاعات', 'سعات القاعات', 'اصغر حاجه', 'اكبر حاجه')) return capacities();
    if (decorW && !otherItem && W('اشوف', 'صور', 'شكل', 'اتفرج', 'نشوف', 'وريني', 'كتالوج')) return decor(true);
    if (vendorW && strongItem) return vendorsAns(TOPICS.vendors, t);
    if (menuQ && menuQ.k === 'ht' && !halls.length) S.hall = 'lotus';
    if (W('الوجبه الاضافيه', 'وجبه اضافيه', 'وجبات اضافيه', 'الوجبات الاضافيه', 'الوجبه الزياده', 'وجبه زياده', 'وجبات زياده', 'الفرد الاضافي', 'سعر الفرد الزياده', 'فرد زياده', 'الفرد الزياده') && !has(t, [' تجهيزات'])) return extraMeal(menuQ);
    const dishHit = R.res.some(r => r.e.k === 'dish' && r.cover >= 0.8);
    if (menuQ && dishHit && W('فيه', 'فيها', 'بيقدم', 'بتقدم', 'موجود', 'عندكم', 'هل', 'يوجد') && knowledge(t, raw, R, menuQ)) return;
    if (menuQ && menuQ.k === 'ob' && !K.halls[S.hall]) return obNoHall(menuQ, t);
    if (menuQ && !(menuQ.loose && !S.hall)) {
      const two = t.match(/(?:منيو|بوفيه|بريك) ?(\d) (?:و|او|ولا|مع|vs) ?(?:ال)?(?:ست منيو |اوبن بوفيه |منيو )?(\d) /);
      if (two && menuQ.k !== 'pk') return compareMenus(menuQ.k, +two[1], +two[2]);
      if (count && K.halls[S.hall] && menuQ.k !== 'cb' && menuQ.k !== 'ssm' && hallMenu(S.hall, menuQ)) return estimate();
      return menuDetail(menuQ, count);
    }
    if (strongItem && !(incW && !hasItemWord(t))) { if (W('دقيقه', 'دقايق', 'مدتها', 'مدته', 'بتاخد قد ايه', 'وقتها')) bot('<p>مدة الفقرة غير مذكورة في المنيوهات المعتمدة، ويحددها فريق الحفلات. وهذه البيانات الواردة:</p>'); if (knowledge(t, raw, R)) return; }
    if (decorW && !otherItem) return decor();
    if (incW && (S.hall || S.event)) return included();

    // event-specific
    const about = !!ev || priceW || menuW || incW || !!count || capW || timeW;
    if (S.event === 'katb' && about && !recW) {
      if (timeW && !priceW) return katbTimes();
      if (capW && (halls.includes('mawadda') || S.hall === 'mawadda')) return capacity('mawadda');
      return katb(['lotus', 'mawadda'].includes(S.hall) ? S.hall : null);
    }
    if (S.event === 'aqiqa' && about) return aqiqa();
    if (S.event === 'birthday' && about && !halls.some(h => ['akhenaten', 'isis', 'mawadda'].includes(h))) return ['roof', 'glass'].includes(S.hall) && halls.length ? hallBrief(S.hall) : birthday();
    if (S.event === 'special' && (about || halls.length)) return ['lulu', 'marasem'].includes(S.hall) && halls.length && !count ? hallBrief(S.hall) : special();
    if (S.event === 'photo' && (about || short)) return photo();
    if (S.hall === 'mawadda' && halls.length) return capW ? capacity('mawadda') : katb('mawadda');
    if (['roof', 'glass', 'lulu', 'marasem'].includes(S.hall) && halls.length) return capW && !priceW ? capacity(S.hall) : hallBrief(S.hall);

    if (capW && halls.length) return capacity(halls[0]);
    if (recW || (capW && !halls.length)) return recommend();
    if (count && !K.halls[S.hall] && !halls.length) return S.event ? recommend() : askEvent();
    if (halls.length && count) return estimate();
    if (count && K.halls[S.hall]) return estimate();
    if ((day || date) && K.halls[S.hall] && !menuW && !ev) return S.count ? estimate() : (priceW ? hallPrices(S.hall) : askCount());
    if (priceW && W('احسب', 'احسبلي', 'اجمالي', 'الاجمالي', 'توتال', 'هيتكلف', 'هدفع', 'الحسبه', 'التكلفه')) return S.count ? (K.halls[S.hall] ? estimate() : recommend()) : askCount(() => (K.halls[S.hall] ? estimate() : recommend()));
    if (menuW && !halls.length && !S.hall) return menusList();
    if (menuW && K.halls[S.hall]) return hallPrices(S.hall, true);
    if (priceW && (halls.length || K.halls[S.hall])) return hallPrices(halls[0] || S.hall);
    if (ev && (priceW || short)) return eventIntro(ev, priceW);
    if (priceW || W('القاعات', 'قاعاتكم', 'عندكم قاعات', 'كام قاعه', 'انواع القاعات', 'halls')) return overview();
    if (halls.length) return hallPrices(halls[0]);
    if (R.res.length && R.cover >= 0.5 && knowledge(t, raw, R)) return;
    if (ev) return eventIntro(ev, priceW);
    const law = lawSearch(t);
    if (law) return law();
    if (ev) return eventIntro(ev, priceW);
    fallback(raw);
  }

  /* ---------------- answers ---------------- */
  function overview() {
    const H = K.halls;
    const row = (name, cap, from, note, go) => `<tr><td><b>${name}</b><br><small>${cap}</small></td><td class="n">${from}</td><td><small>${note}</small></td></tr>`;
    bot(`<p class="dmb-h">مقارنة سريعة بين القاعات</p>
<table class="dmb-t"><tr><th>القاعة / المناسبة</th><th>يبدأ من</th><th>الأساس</th></tr>
${row('قاعة أخناتون', 'من ٢٥٠ حتى ٦٠٠ فرد', money(H.akhenaten.menus[0].wd), 'باكدج زفاف منتصف الأسبوع لـ ٢٥٠ فرد')}
${row('قاعة إيزيس', 'من ١٥٠ حتى ٣٠٠ فرد', money(H.isis.menus[0].price), 'باكدج زفاف لـ ١٥٠ فرد')}
${row('قاعة اللوتس', 'من ١٠٠ حتى ٢٠٠ فرد', money(H.lotus.menus[0].price), 'باكدج زفاف (هاي تي) لـ ١٠٠ فرد')}
${row('قاعة المودة والرحمة', 'من ١٠٠ حتى ١٥٠ فرد', money(K.katb.mawadda.price), 'باكدج عقد قران لـ ١٠٠ فرد')}
${row('أعياد الميلاد', 'اللوتس – الروف توب – الزجاجية', money(5000), 'الروف توب (٢٠ – ٤٠ فرد)')}
${row('المناسبات الخاصة', 'مؤتمرات – اجتماعات – كوفي بريك', money(5000), 'حجز قاعة اللؤلؤة، والمنيو بالفرد')}
${row('فوتو سيشن', 'حتى ٦ أفراد', money(5000), 'رسوم الجلسة')}</table>
<p class="dmb-note">الأسعار وفق المنيوهات المعتمدة، وتختلف حسب العدد والمنيو المختار ويوم الحفل.</p>`,
      []);
    chips([{ t: 'أسعار أخناتون', q: 'أسعار قاعة أخناتون' }, { t: 'أسعار إيزيس', q: 'أسعار قاعة إيزيس' }, { t: 'أسعار اللوتس', q: 'أسعار قاعة اللوتس' }, { t: 'كتب الكتاب', q: 'كتب الكتاب' }, { t: 'ترشيح قاعة حسب العدد', fn: () => startRec() }]);
  }

  function hallPrices(hid, menuFocus) {
    if (hid === 'mawadda') return katb('mawadda');
    if (hid === 'roof' || hid === 'glass') return birthday();
    if (hid === 'lulu' || hid === 'marasem') return special();
    const h = K.halls[hid]; S.hall = hid;
    let tb, notes = '';
    if (h.pk.type === 'wk' && S.day) {
      const d = S.day, P = h.pk[d];
      tb = `<p>${S.date ? dateTxt(S.date) : (d === 'we' ? 'أيام الخميس والجمعة والسبت' : 'أيام الأحد إلى الأربعاء')} ${d === 'we' ? 'تُحتسب ضمن باكدج نهاية الأسبوع' : 'تُحتسب ضمن باكدج منتصف الأسبوع'} لعدد ${AD(P.n)} فرد، ويبدأ من <b>${money(h.menus[0][d])}</b> حتى ${money(Math.max(...h.menus.map(m => m[d])))}.</p><table class="dmb-t"><tr><th>المنيو</th><th>${d === 'we' ? 'نهاية الأسبوع' : 'منتصف الأسبوع'} (${AD(P.n)} فرد)</th></tr>${h.menus.map(m => `<tr><td>${A(m.name)}</td><td class="n">${money(m[d])}</td></tr>`).join('')}</table>`;
      notes = `<p class="dmb-note">الوجبة الإضافية بسعر متدرج حسب المنيو (أول ٥٠، ثم من ٥١ إلى ١٠٠، ثم ما زاد عن ١٠٠).</p>`;
    } else if (h.pk.type === 'wk') {
      tb = `<p>تبدأ الأسعار من <b>${money(h.menus[0].wd)}</b> (منتصف الأسبوع، ${AD(h.pk.wd.n)} فرد) ومن <b>${money(h.menus[0].we)}</b> (نهاية الأسبوع، ${AD(h.pk.we.n)} فرد).</p><table class="dmb-t"><tr><th>المنيو</th><th>منتصف الأسبوع<br><small>${AD(h.pk.wd.n)} فرد</small></th><th>نهاية الأسبوع<br><small>${AD(h.pk.we.n)} فرد</small></th></tr>${h.menus.map(m => `<tr><td>${A(m.name)}</td><td class="n">${money(m.wd)}</td><td class="n">${money(m.we)}</td></tr>`).join('')}</table>`;
      notes = `<p class="dmb-note">منتصف الأسبوع: ${A(h.pk.wd.days)} — نهاية الأسبوع: ${A(h.pk.we.days)}. الباكدج شامل ${AD(h.pk.wd.n)} أو ${AD(h.pk.we.n)} وجبة حسب اليوم، والوجبة الإضافية بسعر متدرج حسب المنيو.</p>`;
    } else {
      tb = `<p>تبدأ الأسعار من <b>${money(h.menus[0].price)}</b> لباكدج ${AD(h.pk.n)} فرد${S.day === 'we' ? `، ويُضاف ${money(h.pk.fee)} لأن اليوم المطلوب من أيام نهاية الأسبوع` : ''}.</p><table class="dmb-t"><tr><th>المنيو</th><th>سعر الباكدج<br><small>${AD(h.pk.n)} فرد</small></th><th>الوجبة الإضافية</th></tr>${h.menus.map(m => `<tr><td>${A(m.name)}</td><td class="n">${money(m.price)}</td><td class="n">${m.tiers ? 'من ' + money(m.tiers[2]) + ' إلى ' + money(m.tiers[0]) : money(m.extra)}</td></tr>`).join('')}</table>`;
      notes = `<p class="dmb-note">يُضاف ${money(h.pk.fee)} رسوم لأيام نهاية الأسبوع (الخميس – الجمعة – السبت) والأعياد والعطلات الرسمية.${h.menus[0].tiers ? ' سعر الوجبة الإضافية متدرج: أول ٥٠ وجبة، ثم من ٥١ إلى ١٠٠، ثم ما زاد عن ١٠٠.' : ''}</p>`;
    }
    bot(`<p class="dmb-h">${h.name}</p><p>السعة من ${AD(h.min)} حتى ${AD(h.max)} فرد — ${A(h.use)}.</p>${tb}${notes}${src(hid, h.pk.type === 'wk' ? '' : h.pk.pg)}`,
      [{ t: 'عرض منيو ' + h.name, go: h.menu }, { t: 'صور الديكورات', go: h.decor }]);
    const c = h.menus.slice(0, 3).map(m => ({ t: 'محتوى ' + m.name, fn: () => menuDetail({ k: m.id.slice(0, 2), n: +m.id.slice(2) || 0 }) }));
    chips([...c, { t: 'ما يشمله الباكدج', fn: included }, { t: 'احسب التكلفة لعدد معين', fn: () => askCount() }, ...(hid === 'lotus' ? [{ t: 'كتب الكتاب في اللوتس', fn: () => katb('lotus') }] : [])]);
  }

  function included() {
    const hid = S.hall;
    if (S.event === 'katb' || hid === 'mawadda') return katb(hid === 'lotus' ? 'lotus' : 'mawadda');
    if (S.event === 'birthday' || hid === 'roof' || hid === 'glass') return birthday();
    if (S.event === 'special') return special();
    if (S.event === 'aqiqa') return aqiqa();
    if (!K.halls[hid]) { bot('يُرجى تحديد القاعة:'); chips(['akhenaten', 'isis', 'lotus'].map(h => ({ t: HALLNAME[h], fn: () => { S.hall = h; included(); } }))); return; }
    const h = K.halls[hid];
    let extra = '';
    if (hid === 'akhenaten') extra = `<p class="dmb-note">في باكدج نهاية الأسبوع (الخميس – السبت) نفس الخدمات لعدد ٣٠٠ فرد و٣٠٠ وجبة.</p>`;
    bot(`<p class="dmb-h">ما يتضمّنه باكدج ${h.name}</p>${contentHTML(h.inc)}${extra}${src(hid, h.incpg)}`, [{ t: 'عرض المنيو', go: h.menu }]);
    chips([{ t: 'أسعار ' + h.name, fn: () => hallPrices(hid) }, { t: 'احسب التكلفة لعدد معين', fn: () => askCount() }, { t: 'الإضافات خارج الباكدج', q: 'الاضافات خارج الباكدج ' + h.name }]);
  }

  function menuDetail(mq, count) {
    if (mq.k === 'cb' || mq.k === 'ssm') {
      const pre = mq.k === 'cb' ? 'cb' : 'ssm';
      const list = K.special.menus.filter(m => m.id.startsWith(pre));
      const m = list.find(x => x.id === pre + mq.n);
      if (!m) {
        bot(`<p class="dmb-h">${mq.k === 'cb' ? 'الكوفي بريك' : 'اسبيشيال ست منيو'} – المناسبات الخاصة</p><table class="dmb-t"><tr><th>المنيو</th><th>سعر الفرد</th></tr>${list.map(x => `<tr><td>${A(x.name)}${x.pcs ? ` <small>(${pcs(x.pcs)})</small>` : ''}</td><td class="n">${money(x.pp)}${S.count ? `<br><small>${money(x.pp * S.count)} لـ ${AD(S.count)}</small>` : ''}</td></tr>`).join('')}</table>${S.count ? (() => { const f = K.special.halls.filter(h => h.n >= S.count).sort((a, b) => a.price - b.price)[0]; return `<p class="dmb-note">بخلاف رسوم حجز القاعة${f ? `، وتناسب هذا العدد ${f.name} (باكدج ${AD(f.n)} فرد بقيمة ${money(f.price)})` : ''}.</p>`; })() : ''}${src('special', mq.k === 'cb' ? '٨ – ١٢' : '٤ – ٧')}`, [{ t: 'عرض منيو المناسبات الخاصة', go: 'special' }]);
        chips(list.map(x => ({ t: 'محتوى ' + x.name, fn: () => menuDetail({ k: mq.k, n: +x.id.slice(pre.length) }) })));
        return;
      }
      const cnt = count || S.count;
      bot(`<p class="dmb-h">${A(m.name)}</p>${contentHTML(m.c)}<table class="dmb-t"><tr><td>سعر الفرد</td><td class="n">${money(m.pp)}</td></tr>${cnt ? `<tr class="tot"><td>لعدد ${AD(cnt)} فرد</td><td class="n">${money(m.pp * cnt)}</td></tr>` : ''}</table>${cnt ? '<p class="dmb-note">بخلاف رسوم حجز القاعة.</p>' : ''}${src('special', m.pg)}`, [{ t: 'عرض منيو المناسبات الخاصة', go: 'special' }]);
      chips([{ t: 'أسعار حجز القاعات للمناسبات', fn: special }, { t: 'إضافات القاعات', q: 'اضافات المناسبات الخاصه' }]);
      return;
    }
    let hid = S.hall;
    if (!K.halls[hid]) {
      bot('يُرجى تحديد القاعة، فلكل قاعة منيوهاتها وأسعارها:');
      chips(['akhenaten', 'isis', 'lotus'].map(h => ({ t: HALLNAME[h], fn: () => { S.hall = h; menuDetail(mq, count); } })));
      return;
    }
    const h = K.halls[hid], m = hallMenu(hid, mq);
    if (!m) {
      const avail = h.menus.map(x => x.name).join('، ');
      bot(`<p>المنيوهات المتاحة في ${h.name}: ${A(avail)}.</p>`);
      chips(h.menus.map(x => ({ t: x.name, fn: () => menuDetail({ k: x.id.slice(0, 2), n: +x.id.slice(2) || 0 }) })));
      return;
    }
    S.menu = { k: m.id.slice(0, 2), n: +m.id.slice(2) || 0 };
    let price;
    if (h.pk.type === 'wk') price = `<tr><td>منتصف الأسبوع (${AD(h.pk.wd.n)} فرد)</td><td class="n">${money(m.wd)}</td></tr><tr><td>نهاية الأسبوع (${AD(h.pk.we.n)} فرد)</td><td class="n">${money(m.we)}</td></tr>`;
    else price = `<tr><td>باكدج القاعة (${AD(h.pk.n)} فرد)</td><td class="n">${money(m.price)}</td></tr><tr><td>نهاية الأسبوع والأعياد والعطلات الرسمية</td><td class="n">+ ${money(h.pk.fee)}</td></tr>`;
    const extra = m.tiers ? `<tr><th colspan="2">سعر الوجبة الإضافية</th></tr><tr><td>أول ٥٠ وجبة</td><td class="n">${money(m.tiers[0])}</td></tr><tr><td>من ٥١ إلى ١٠٠ وجبة</td><td class="n">${money(m.tiers[1])}</td></tr><tr><td>ما زاد عن ١٠٠ وجبة</td><td class="n">${money(m.tiers[2])}</td></tr>` : `<tr><td>الوجبة الإضافية (للفرد)</td><td class="n">${money(m.extra)}</td></tr>`;
    const same = hid !== 'lotus' && m.id === 'ob2' ? '<p class="dmb-note">أصناف أوبن بوفيه (٢) مطبوعة في المنيو مطابقة لأوبن بوفيه (١)، والاختلاف في السعر.</p>' : '';
    bot(`<p class="dmb-h">${A(m.name)} – ${h.name}</p>${contentHTML(m.c)}${same}<table class="dmb-t">${price}${extra}</table>${src(hid, m.pg)}`, [{ t: 'عرض المنيو كاملاً', go: h.menu }]);
    const others = h.menus.filter(x => x.id !== m.id).slice(0, 3);
    chips([{ t: 'احسب التكلفة لعدد معين', fn: () => (count || S.count) ? estimate() : askCount() }, ...others.map(x => ({ t: x.name, fn: () => menuDetail({ k: x.id.slice(0, 2), n: +x.id.slice(2) || 0 }) }))]);
  }

  function askCount(then) {
    bot('ما العدد المتوقع للمدعوين؟ اكتبوا العدد (مثال: ٢٨٠).');
    FLOW = { wantCount: true, step: (raw, t, e) => {
      const n = e.count || findCount(t, true);
      if (!n) { FLOW = null; return false; }
      FLOW = null; S.count = n; if (e.halls.length) S.hall = e.halls[0]; if (e.day) S.day = e.day; if (e.date) S.date = e.date;
      (then || estimate)(); return true;
    } };
    chips([{ t: '١٠٠', q: '100 فرد' }, { t: '١٥٠', q: '150 فرد' }, { t: '٢٥٠', q: '250 فرد' }, { t: '٣٠٠', q: '300 فرد' }, { t: '٤٠٠', q: '400 فرد' }]);
  }

  function estimate() {
    const hid = S.hall, n = S.count;
    if (hid === 'mawadda' || (S.event === 'katb' && (hid === 'lotus' || !hid))) return katb(hid === 'lotus' ? 'lotus' : hid === 'mawadda' ? 'mawadda' : null);
    if (S.event === 'aqiqa') return aqiqa();
    if (S.event === 'birthday' || hid === 'roof' || hid === 'glass') return birthday();
    if (S.event === 'special' || hid === 'lulu' || hid === 'marasem') return special();
    if (!K.halls[hid]) return recommend();
    if (!n) return askCount();
    const h = K.halls[hid];
    if (n > h.max) {
      bot(`<p>العدد ${AD(n)} فرد أكبر من سعة ${h.name} (حتى ${AD(h.max)} فرد).</p>`);
      return recommend();
    }
    const mq = S.menu && hallMenu(hid, S.menu);
    const menus = mq ? [mq] : h.menus;
    let day = S.day;
    if (h.pk.type === 'wk' && !day) {
      bot(`<p>في ${h.name} يختلف السعر حسب يوم الحفل. ما اليوم المطلوب؟</p>`);
      FLOW = { step: (raw, t, e) => { const d = e.day || findDay(t, e.date); if (!d) { FLOW = null; return false; } FLOW = null; S.day = d; if (e.date) S.date = e.date; estimate(); return true; } };
      chips([{ t: 'منتصف الأسبوع (الأحد – الأربعاء)', fn: () => { S.day = 'wd'; estimate(); } }, { t: 'نهاية الأسبوع (الخميس – السبت)', fn: () => { S.day = 'we'; estimate(); } }]);
      return;
    }
    const rows = [];
    let base, baseN;
    const one = m => {
      if (h.pk.type === 'wk') { baseN = h.pk[day].n; base = m[day]; }
      else { baseN = h.pk.n; base = m.price + (day === 'we' ? h.pk.fee : 0); }
      const ex = Math.max(n - baseN, 0);
      const ec = m.tiers ? tierCost(ex, m.tiers) : { total: ex * m.extra, parts: ex ? [[ex, m.extra, 'وجبة إضافية']] : [] };
      return { m, base, ex, ec, total: base + ec.total };
    };
    const dayTxt = h.pk.type === 'wk' ? (day === 'we' ? 'نهاية الأسبوع' : 'منتصف الأسبوع') : (day === 'we' ? 'نهاية الأسبوع / عطلة' : day === 'wd' ? 'منتصف الأسبوع' : '');
    const dateNote = S.date ? ` (${dateTxt(S.date)})` : '';
    if (menus.length === 1) {
      const r = one(menus[0]);
      rows.push(`<tr><td>${A(r.m.name)} – باكدج ${AD(baseN)} فرد${h.pk.type !== 'wk' && day === 'we' ? ' + رسوم نهاية الأسبوع' : ''}</td><td class="n">${money(r.base)}</td></tr>`);
      r.ec.parts.forEach(p => rows.push(`<tr><td>${AD(p[0])} وجبة × ${money(p[1])} <small>(${p[2]})</small></td><td class="n">${money(p[0] * p[1])}</td></tr>`));
      rows.push(`<tr class="tot"><td>الإجمالي التقديري لعدد ${AD(Math.max(n, baseN))} فرد</td><td class="n">${money(r.total)}</td></tr>`);
      bot(`<p class="dmb-h">تكلفة تقديرية – ${h.name}</p><p>${AD(n)} فرد${dayTxt ? ' – ' + dayTxt : ''}${dateNote}</p><table class="dmb-t">${rows.join('')}</table>${notesFor(h, n, baseN, day)}${src(hid, r.m.pg)}`, [{ t: 'تجهيز طلب الحجز', fn: () => startBook(), cls: 'pri' }]);
    } else {
      menus.forEach(m => { const r = one(m); rows.push(`<tr><td>${A(m.name)}${r.ex ? `<br><small>الباكدج ${money(r.base)} + ${AD(r.ex)} وجبة إضافية</small>` : ''}</td><td class="n">${money(r.total)}</td></tr>`); });
      bot(`<p class="dmb-h">تكلفة تقديرية – ${h.name}</p><p>${AD(n)} فرد${dayTxt ? ' – ' + dayTxt : ''}${dateNote}</p><table class="dmb-t"><tr><th>المنيو</th><th>الإجمالي التقديري</th></tr>${rows.join('')}</table>${notesFor(h, n, baseN, day)}${src(hid)}`, [{ t: 'تجهيز طلب الحجز', fn: () => startBook(), cls: 'pri' }]);
    }
    chips([...h.menus.slice(0, 4).map(m => ({ t: 'محتوى ' + m.name, fn: () => menuDetail({ k: m.id.slice(0, 2), n: +m.id.slice(2) || 0 }) })), { t: 'تغيير العدد', fn: () => askCount() }, ...(h.pk.type === 'wk' || day ? [{ t: day === 'we' ? 'احسب لمنتصف الأسبوع' : 'احسب لنهاية الأسبوع', fn: () => { S.day = day === 'we' ? 'wd' : 'we'; S.date = null; estimate(); } }] : [])]);
  }
  function notesFor(h, n, baseN, day) {
    const L = [];
    if (n < baseN) L.push(`الباكدج محسوب على ${AD(baseN)} فرد كحد أدنى مضمون، ولا يقل السعر بانخفاض العدد (اللائحة م ٢٠، م ٢٥).`);
    if (h.pk.type !== 'wk' && !day) L.push(`وإذا أُقيم الحفل يوم الخميس أو الجمعة أو السبت أو في الأعياد والعطلات الرسمية، يُضاف ${money(h.pk.fee)}.`);
    if (S.date && h.pk.type !== 'wk') L.push('تُضاف رسوم الأعياد والعطلات الرسمية إذا وافق التاريخ عطلة رسمية.');
    L.push('التقدير لا يشمل التأمين ولا الإضافات خارج الباكدج، والسعر النهائي يؤكده فريق الحفلات عند التعاقد.');
    const fee = K.addons.find(a => a.s === S.hall && norm(a.n).includes('فرد اضافي'));
    if (fee && n > baseN) L.push(`يوجد في قائمة الإضافات بند «${A(fee.n)}» بسعر ${ar(fee.p)} للفرد — يُرجى تأكيد انطباقه مع فريق الحفلات.`);
    return L.map(x => `<p class="dmb-note">${x}</p>`).join('');
  }

  function capacity(hid) {
    const h = K.halls[hid];
    const n = S.count;
    if (h && n) { bot(`<p>${n >= h.min && n <= h.max ? `<b>نعم</b>، تتسع ${h.name} لعدد ${AD(n)} فرد؛ فسعتها من ${AD(h.min)} حتى ${AD(h.max)} فرد.` : n > h.max ? `<b>لا</b>، العدد ${AD(n)} فرد يتجاوز سعة ${h.name} (حتى ${AD(h.max)} فرد).` : `سعة ${h.name} من ${AD(h.min)} حتى ${AD(h.max)} فرد، والباكدج محسوب على ${AD(h.pk.type === 'wk' ? h.pk.wd.n : h.pk.n)} فرد كحد أدنى مضمون حتى لو كان العدد ${AD(n)} فرد.`}</p>${src(hid, 1)}`); chips([{ t: 'احسب التكلفة لعدد ' + n, fn: () => { S.hall = hid; estimate(); } }, { t: 'ترشيح قاعة حسب العدد', fn: () => recommend() }]); return; }
    if (h) bot(`<p>تتسع <b>${h.name}</b> من ${AD(h.min)} حتى ${AD(h.max)} فرد، والباكدج محسوب على ${h.pk.type === 'wk' ? `${AD(h.pk.wd.n)} فرد منتصف الأسبوع و${AD(h.pk.we.n)} فرد نهاية الأسبوع` : `${AD(h.pk.n)} فرد`} كحد أدنى.</p>${src(hid, 1)}`);
    else if (hid === 'mawadda') bot(`<p>تتسع <b>قاعة المودة والرحمة</b> من ١٠٠ حتى ١٥٠ فرد، وهي مخصصة لعقد القران. الباكدج لعدد ١٠٠ فرد بقيمة ${money(K.katb.mawadda.price)}، والفرد الإضافي ${money(K.katb.mawadda.extra)}.</p>${src('mawadda', 1)}`);
    else if (hid === 'roof' || hid === 'glass') { const b = K.birthday.find(x => x.id === hid); bot(`<p>${b.name}: ${b.cap}، وباكدج أعياد الميلاد بها ${money(b.price)}.</p>${src('birthday', 2)}`); }
    else if (hid === 'lulu' || hid === 'marasem') { const s = K.special.halls.find(x => x.id === hid); bot(`<p>${s.name}: باكدج المناسبات الخاصة لعدد ${AD(s.n)} فرد بقيمة ${money(s.price)}. أما السعة القصوى فغير منشورة في المنيو، ويُرجى تأكيدها مع فريق الحفلات.</p>${src('special', 2)}`); }
    chips([{ t: 'الأسعار', fn: () => (K.halls[hid] ? hallPrices(hid) : hid === 'mawadda' ? katb('mawadda') : hallBrief(hid)) }, { t: 'سعات جميع القاعات', fn: capacities }, { t: 'ترشيح قاعة حسب العدد', fn: () => startRec() }]);
  }


  function extraMeal(mq) {
    const hid = S.hall;
    if (S.event === 'katb' || hid === 'mawadda') return katb(hid === 'lotus' ? 'lotus' : hid === 'mawadda' ? 'mawadda' : null);
    if (S.event === 'aqiqa') return aqiqa();
    if (!K.halls[hid]) { bot('سعر الوجبة الإضافية يختلف حسب القاعة والمنيو. أي قاعة؟'); chips(['akhenaten', 'isis', 'lotus'].map(h => ({ t: HALLNAME[h], fn: () => { S.hall = h; extraMeal(mq); } })).concat([{ t: 'كتب الكتاب', fn: () => katb() }, { t: 'العقيقة', fn: aqiqa }])); return; }
    const h = K.halls[hid];
    const tb = h.menus[0].tiers
      ? `<table class="dmb-t"><tr><th>المنيو</th><th>أول ٥٠</th><th>٥١ – ١٠٠</th><th>أكثر من ١٠٠</th></tr>${h.menus.map(m => `<tr><td>${A(m.name)}</td><td class="n">${money(m.tiers[0])}</td><td class="n">${money(m.tiers[1])}</td><td class="n">${money(m.tiers[2])}</td></tr>`).join('')}</table>`
      : `<table class="dmb-t"><tr><th>المنيو</th><th>الوجبة الإضافية (للفرد)</th></tr>${h.menus.map(m => `<tr><td>${A(m.name)}</td><td class="n">${money(m.extra)}</td></tr>`).join('')}</table>`;
    const base = h.pk.type === 'wk' ? `${AD(h.pk.wd.n)} فرد منتصف الأسبوع و${AD(h.pk.we.n)} فرد نهاية الأسبوع` : `${AD(h.pk.n)} فرد`;
    bot(`<p class="dmb-h">سعر الوجبة الإضافية – ${h.name}</p><p>تُحسب الوجبات الإضافية فوق عدد الباكدج (${base}).</p>${tb}${src(hid, h.menus[0].pg + ' – ' + h.menus[h.menus.length - 1].pg)}`);
    chips([{ t: 'احسب التكلفة لعدد معين', fn: () => askCount() }, { t: 'أسعار ' + h.name, fn: () => hallPrices(hid) }]);
  }
  function capacities() {
    bot(`<p class="dmb-h">سعات القاعات</p><table class="dmb-t"><tr><td>قاعة أخناتون (أكبر القاعات)</td><td class="n">٢٥٠ – ٦٠٠ فرد</td></tr><tr><td>قاعة إيزيس</td><td class="n">١٥٠ – ٣٠٠ فرد</td></tr><tr><td>قاعة اللوتس</td><td class="n">١٠٠ – ٢٠٠ فرد</td></tr><tr><td>قاعة المودة والرحمة (عقد القران)</td><td class="n">١٠٠ – ١٥٠ فرد</td></tr><tr><td>القاعة الزجاجية (أوبن إير) – أعياد الميلاد</td><td class="n">٣٠ – ٦٠ فرد</td></tr><tr><td>الروف توب – أعياد الميلاد</td><td class="n">٢٠ – ٤٠ فرد</td></tr></table><p class="dmb-note">للمناسبات الخاصة: قاعة اللؤلؤة باكدج لـ ٥٠ فرد، وقاعة المراسم باكدج لـ ١٠٠ فرد.</p><p class="dmb-src">المصدر: أغلفة المنيوهات ومنيو أعياد الميلاد (ص ٢) والمناسبات الخاصة (ص ٢)</p>`);
    chips([{ t: 'ترشيح قاعة حسب العدد', fn: () => startRec() }, { t: 'أسعار القاعات', q: 'أسعار القاعات' }]);
  }
  function startRec() {
    if (S.event && S.count) return recommend();
    bot('<p>يُرجى اختيار نوع المناسبة:</p>');
    chips(['wedding', 'engagement', 'katb', 'birthday', 'aqiqa', 'special', 'photo'].map(e => ({ t: EVNAME[e], fn: () => { S.event = e; if (e === 'photo') return photo(); if (e === 'aqiqa') return aqiqa(); S.count ? recommend() : askCount(recommend); } })));
  }
  function recommend() {
    const n = S.count, ev = S.event || 'wedding';
    if (!n) return askCount(recommend);
    if (ev === 'katb') return katb(null);
    if (ev === 'birthday') return birthday();
    if (ev === 'special') return special();
    if (ev === 'aqiqa') return aqiqa();
    const fits = ['lotus', 'isis', 'akhenaten'].filter(h => n >= K.halls[h].min && n <= K.halls[h].max);
    if (fits.length === 1 && !S.hall) { S.hall = fits[0]; S.menu = null; bot(`<p>لعدد ${AD(n)} فرد، القاعة المناسبة هي <b>${HALLNAME[fits[0]]}</b> (السعة ${AD(K.halls[fits[0]].min)} – ${AD(K.halls[fits[0]].max)} فرد).</p>`); return estimate(); }
    let html = `<p>القاعات المناسبة ل${EVNAME[ev] || 'الحفل'} لعدد <b>${AD(n)} فرد</b>:</p>`;
    if (!fits.length && n < 100) { html += `<p>أصغر باكدجات الأفراح بقاعة اللوتس لعدد ١٠٠ فرد كحد أدنى مضمون، ويبدأ من ${money(K.halls.lotus.menus[0].price)}.</p>`; fits.push('lotus'); }
    else if (!fits.length) { bot(`<p>العدد ${AD(n)} فرد يتجاوز أكبر سعة منشورة لقاعات الدار (قاعة أخناتون حتى ٦٠٠ فرد)، ويُرجى التواصل مع فريق الحفلات لدراسة الطلب.</p>`, [waAct(`دار المراسم لضباط الشرطة – استفسار عن حفل لعدد ${n} فرد`, 'تواصلوا مع فريق الحفلات عبر واتساب')]); chips([{ t: 'سعات القاعات', fn: capacities }, { t: 'التواصل', fn: contact }]); return; }
    else {
      const rows = fits.map(h => {
        const H = K.halls[h], rng = d => { const v = H.menus.map(m => estTotal(H, m, n, d)); return [Math.min(...v), Math.max(...v)]; };
        if (!S.day) { const a = rng('wd'), b = rng('we'); return `<tr><td><b>${H.name}</b><br><small>السعة ${AD(H.min)} – ${AD(H.max)} فرد</small></td><td class="n"><small>منتصف الأسبوع</small><br>${money(a[0])} – ${money(a[1])}<br><small>نهاية الأسبوع</small><br>${money(b[0])} – ${money(b[1])}</td></tr>`; }
        const r = rng(S.day);
        return `<tr><td><b>${H.name}</b><br><small>السعة ${AD(H.min)} – ${AD(H.max)} فرد – ${S.day === 'we' ? 'نهاية الأسبوع' : 'منتصف الأسبوع'}</small></td><td class="n">${money(r[0])}<br><small>حتى ${money(r[1])}</small></td></tr>`;
      }).join('');
      html += `<table class="dmb-t"><tr><th>القاعة</th><th>التكلفة التقديرية</th></tr>${rows}</table><p class="dmb-note">الأرقام شاملة الباكدج والوجبات الإضافية لعدد ${AD(n)} فرد، من أقل منيو إلى أعلاه${S.day ? '' : '، ونهاية الأسبوع تشمل رسوم الخميس والجمعة والسبت (إيزيس واللوتس) أو باكدج نهاية الأسبوع (أخناتون)'}${S.day === 'we' ? '، شاملة رسوم نهاية الأسبوع' : ''}.</p>`;
    }
    bot(html + '<p>يُرجى اختيار القاعة لعرض التفاصيل لكل منيو.</p>');
    chips(fits.map(h => ({ t: 'التفاصيل في ' + HALLNAME[h], fn: () => { S.hall = h; S.menu = null; estimate(); } })));
  }

  function cheapest() {
    const ev = S.event;
    if (ev === 'katb') return katb();
    if (ev === 'birthday') return birthday();
    if (ev === 'special') return special();
    const H = K.halls;
    bot(`<p>أقل الباكدجات سعراً حسب كل قاعة:</p><ul><li>قاعة اللوتس: هاي تي لـ ١٠٠ فرد — ${money(H.lotus.menus[0].price)} (ست منيو (١): ${money(H.lotus.menus[1].price)})</li><li>قاعة إيزيس: ست منيو (١) لـ ١٥٠ فرد — ${money(H.isis.menus[0].price)}</li><li>قاعة أخناتون: ست منيو (١) لـ ٢٥٠ فرد منتصف الأسبوع — ${money(H.akhenaten.menus[0].wd)}</li><li>عقد القران: قاعة المودة والرحمة لـ ١٠٠ فرد — ${money(K.katb.mawadda.price)}</li></ul><p class="dmb-note">الاختيار الأنسب يعتمد على عدد المدعوين، لأن كل باكدج محسوب على حد أدنى من الأفراد.</p>`);
    chips([{ t: 'ترشيح قاعة حسب العدد', fn: () => startRec() }, { t: 'أسعار اللوتس', fn: () => hallPrices('lotus') }]);
  }

  function katb(which) {
    S.event = 'katb';
    const k = K.katb;
    const n = S.count;
    if (!which && n > 150 && n <= 200) which = 'lotus';
    if (n > 200) { bot(`<p>العدد ${AD(n)} فرد يتجاوز سعة قاعتي عقد القران (المودة والرحمة حتى ١٥٠ فرد، واللوتس حتى ٢٠٠ فرد)؛ يُرجى التواصل مع فريق الحفلات لترتيب البديل المناسب.</p>`, [waAct(`دار المراسم لضباط الشرطة – استفسار عن عقد قران لعدد ${n} فرد`, 'تواصلوا مع فريق الحفلات عبر واتساب')]); chips([{ t: 'أسعار عقد القران', fn: () => { S.count = null; katb(); } }, { t: 'التواصل', fn: contact }]); return; }
    const show = which ? [which] : ['mawadda', 'lotus'];
    const leadTxt = show.map(id => { const x = k[id]; const ex = n ? Math.max(n - x.n, 0) : 0; return `${x.name}: <b>${money(x.price + ex * x.extra)}</b>${n ? ` لعدد ${AD(Math.max(n, x.n))} فرد` : ` لعدد ${AD(x.n)} فرد`}`; }).join('، و');
    const lead = `<p>${n ? 'التكلفة التقديرية لعقد القران — ' : 'أسعار باكدج عقد القران — '}${leadTxt}. ومدة الحفل ساعة ونصف.</p>${n > 150 && !which ? '' : ''}`;
    const html = show.map(id => {
      const x = k[id]; const ex = n ? Math.max(n - x.n, 0) : 0;
      const tot = n ? `<tr class="tot"><td>التكلفة التقديرية لعدد ${AD(Math.max(n, x.n))} فرد${ex ? ` (${AD(ex)} فرد إضافي)` : ''}</td><td class="n">${money(x.price + ex * x.extra)}</td></tr>` : '';
      const over = n && id === 'mawadda' && n > 150 ? '<p class="dmb-note">العدد أكبر من سعة القاعة (حتى ١٥٠ فرد).</p>' : n && id === 'lotus' && n > 200 ? '<p class="dmb-note">العدد أكبر من سعة قاعة اللوتس (حتى ٢٠٠ فرد).</p>' : '';
      return `<p class="dmb-h">عقد القران – ${x.name}</p>${contentHTML(x.c.filter(s => !/مده الحفل/.test(norm(s.h))))}<p><b>المدة:</b> ${x.dur}</p><p><b>المواعيد:</b></p><ul>${x.slots.map(s => `<li>${A(s)}</li>`).join('')}</ul><table class="dmb-t"><tr><td>سعر الباكدج (${AD(x.n)} فرد)</td><td class="n">${money(x.price)}</td></tr><tr><td>الفرد الإضافي</td><td class="n">${money(x.extra)}</td></tr>${tot}</table>${over}${src(x.menu, id === 'mawadda' ? '٢ – ٣' : x.pg)}`;
    }).join('<hr class="dmb-hr">');
    bot(lead + `<details class="dmb-law" ${show.length === 1 ? 'open' : ''}><summary>تفاصيل الباكدج والمواعيد</summary>${html}</details>`, show.map(id => ({ t: 'عرض منيو ' + k[id].name, go: k[id].menu })));
    chips([...(which ? [{ t: which === 'mawadda' ? 'عقد القران بقاعة اللوتس' : 'قاعة المودة والرحمة', fn: () => { S.hall = which === 'mawadda' ? 'lotus' : 'mawadda'; katb(S.hall); } }] : []), { t: 'مواعيد عقد القران', fn: katbTimes }, { t: 'إضافات عقد القران', fn: () => { const sc = which === 'mawadda' ? 'mawadda' : 'lotusk'; const L = K.addons.filter(a => a.s === sc); bot(`<p class="dmb-h">إضافات عقد القران – ${K.scopes[sc]}</p><table class="dmb-t">${L.map(a => `<tr><td>${A(a.n)}<br><small>${A(a.g)}</small></td><td class="n">${ar(a.p)}</td></tr>`).join('')}</table>${src(K.docOf[sc], sc === 'mawadda' ? '٤ – ٦' : 12)}`); chips([{ t: 'تجهيز طلب الحجز', fn: () => startBook() }]); } }, { t: 'احسب لعدد معين', fn: () => askCount(() => katb(which)) }, { t: 'تجهيز طلب الحجز', fn: () => startBook() }]);
  }
  function aqiqa() {
    S.event = 'aqiqa';
    const n = S.count;
    const html = K.aqiqa.map(p => { const ex = n ? Math.max(n - p.n, 0) : 0; return `<div class="dmb-sec"><b>${A(p.name)} – لعدد ${AD(p.n)} فرد</b><ul>${p.i.map(x => `<li>${A(x)}</li>`).join('')}</ul></div><table class="dmb-t"><tr><td>سعر الباكدج</td><td class="n">${money(p.price)}</td></tr><tr><td>الفرد الإضافي <small>(شامل الوجبة + الكرسي + الترابيزة)</small></td><td class="n">${money(p.extra)}</td></tr>${n && n > p.n ? `<tr class="tot"><td>التكلفة التقديرية لعدد ${AD(n)} فرد</td><td class="n">${money(p.price + ex * p.extra)}</td></tr>` : ''}</table>`; }).join('');
    const tsw = K.addons.filter(a => a.s === 'aqiqa');
    const lead = `<p>${/سبوع/.test(LASTT) ? 'العقيقة (السبوع) ' : 'باكدجات العقيقة '}بقاعة اللوتس لعدد ٧٥ فرد: <b>${money(K.aqiqa[0].price)}</b> (باكدج ١) و<b>${money(K.aqiqa[1].price)}</b> (باكدج ٢)${n && n > 75 ? `، والتكلفة التقديرية لعدد ${AD(n)} فرد: ${money(K.aqiqa[0].price + (n - 75) * K.aqiqa[0].extra)} و${money(K.aqiqa[1].price + (n - 75) * K.aqiqa[1].extra)}` : ''}.</p>`;
    bot(`<p class="dmb-h">العقيقة – قاعة اللوتس</p>${lead}${html}<div class="dmb-sec"><b>التسويات (خاصة بالعقيقة فقط)</b><ul>${tsw.map(a => `<li>${A(a.n)}: ${ar(a.p)}</li>`).join('')}</ul><p>التسوية شاملة ٣ ك أرز بسمتي بالمكسرات للسرفيس الواحد (للخروف – الفخدة – الديك الرومي).</p></div>${src('lotus', 13)}`, [{ t: 'عرض منيو اللوتس', go: 'lotus' }]);
    chips([{ t: 'احسب لعدد معين', fn: () => askCount(aqiqa) }, { t: 'تجهيز طلب الحجز', fn: () => startBook() }]);
  }
  function birthday() {
    S.event = 'birthday';
    const n = S.count;
    const rows = K.birthday.map(b => `<tr><td><b>${b.name}</b><br><small>${b.cap}</small></td><td class="n">${money(b.price)}</td></tr>`).join('');
    let rec = '';
    if (n) {
      const ok = K.birthday.filter(b => n <= b.max && (b.id === 'lotus' || n >= b.min));
      rec = ok.length ? `<p class="dmb-note">لعدد ${AD(n)} فرد، المناسب: ${ok.map(b => b.name).join('، ')}.</p>` : `<p class="dmb-note">العدد ${AD(n)} فرد أكبر من سعات باكدجات أعياد الميلاد المنشورة؛ يُرجى التواصل مع فريق الحفلات.</p>`;
    }
    bot(`<p class="dmb-h">باكدجات أعياد الميلاد</p><p>كل الباكدجات تشمل: حجز القاعة، كراسي + ترابيزات، ساوند سيستم SPEAKERS.</p><table class="dmb-t">${rows}</table>${rec}${src('birthday', 2)}`, [{ t: 'عرض منيو أعياد الميلاد', go: 'birthday' }]);
    chips([{ t: 'الديكورات والبالونات', q: 'ديكور بالونات عيد ميلاد' }, { t: 'التورت', q: 'اسعار التورت عيد ميلاد' }, { t: 'السندوتشات', q: 'السندوتشات عيد ميلاد' }, { t: 'إدخال تورتة من الخارج', q: 'تورته من بره عيد ميلاد' }, { t: 'تجهيز طلب الحجز', fn: () => startBook() }]);
  }
  function special() {
    S.event = 'special';
    const sp = K.special, n = S.count;
    const CAP = { lotus: 200, isis: 300, akhenaten: 600 };
    let lead = '', opts = [];
    if (n) {
      opts = sp.halls.map(h => { if (n <= h.n) return { h, extra: 0, cost: h.price }; if (CAP[h.id] && n <= CAP[h.id]) return { h, extra: n - h.n, cost: h.price + (n - h.n) * 50 }; return null; }).filter(Boolean).sort((a, b) => a.cost - b.cost);
      lead = opts.length ? `<p>لعدد <b>${AD(n)} فرد</b>، القاعات المناسبة حسب تكلفة الحجز:</p><table class="dmb-t">${opts.slice(0, 4).map(o => `<tr><td>${o.h.name}${o.extra ? `<br><small>باكدج ${AD(o.h.n)} فرد ${money(o.h.price)} + ${AD(o.extra)} ترابيزة وكرسي إضافي × ${money(50)}</small>` : `<br><small>باكدج لعدد ${AD(o.h.n)} فرد</small>`}</td><td class="n">${money(o.cost)}</td></tr>`).join('')}</table><p>ويُضاف المنيو بسعر الفرد، مثل: اسبيشيال ست منيو (١) ${money(450)} × ${AD(n)} = <b>${money(450 * n)}</b>، أو كوفي بريك (١) ${money(345)} × ${AD(n)} = <b>${money(345 * n)}</b>.</p><p class="dmb-note">حُسبت الزيادة عن عدد الباكدج ببند «ترابيزة + كرسي إضافي» (${money(50)}) الوارد بالمنيو، والسعة القصوى لقاعتي اللؤلؤة والمراسم غير منشورة؛ يُرجى تأكيد الترتيب النهائي مع فريق الحفلات.</p>` : `<p>العدد ${AD(n)} فرد يتجاوز السعات المنشورة (قاعة أخناتون حتى ٦٠٠ فرد)؛ يُرجى التواصل مع فريق الحفلات.</p>`;
    }
    const table = `<div class="dmb-sec"><b>حجز القاعات (شامل الكراسي والترابيزات)</b></div><table class="dmb-t">${sp.halls.map(h => `<tr><td>${h.name}<br><small>الباكدج لعدد ${AD(h.n)} فرد</small></td><td class="n">${money(h.price)}</td></tr>`).join('')}</table><div class="dmb-sec"><b>المنيوهات (بالفرد)</b></div><table class="dmb-t">${sp.menus.map(m => `<tr><td>${A(m.name)}${m.pcs ? ` <small>(${pcs(m.pcs)})</small>` : ''}</td><td class="n">${money(m.pp)}</td></tr>`).join('')}</table>`;
    bot(`<p class="dmb-h">المناسبات الخاصة والمؤتمرات</p>${lead}${n ? `<details class="dmb-law"><summary>جميع أسعار القاعات والمنيوهات</summary>${table}</details>` : table}${src('special', '٢، ٤ – ١٢')}`, [{ t: 'عرض منيو المناسبات الخاصة', go: 'special' }]);
    chips([{ t: 'محتوى الكوفي بريك', fn: () => menuDetail({ k: 'cb', n: 0 }) }, { t: 'محتوى اسبيشيال ست منيو', fn: () => menuDetail({ k: 'ssm', n: 0 }) }, { t: 'إضافات القاعات (صوت – شاشات – تصوير)', q: 'اضافات المناسبات الخاصه صوت شاشات تصوير' }, { t: 'احسب لعدد معين', fn: () => askCount(special) }]);
  }

  function photo() {
    S.event = 'photo';
    const L = K.addons.filter(a => a.s === 'photo');
    bot(`<p class="dmb-h">فوتو سيشن</p><p>رسوم جلسة الفوتو سيشن <b>${ar(L[0].p)}</b> (بحد أقصى ٦ أفراد). ويُضاف حسب الطلب:</p><table class="dmb-t">${L.slice(1).map(a => `<tr><td>${A(a.n)}</td><td class="n">${ar(a.p)}</td></tr>`).join('')}</table><p class="dmb-note">أماكن التصوير داخل الدار غير مذكورة في المنيو؛ ويُرجى تأكيدها مع فريق الحفلات.</p>${src('photo', 2)}`, [{ t: 'عرض منيو الفوتو سيشن', go: 'photo' }, waAct('دار المراسم لضباط الشرطة – أرغب في حجز فوتو سيشن', 'احجزوا فوتو سيشن عبر واتساب')]);
    chips([{ t: 'التصوير الفوتوغرافي في الأفراح', q: 'سعر التصوير الفوتوغرافي' }, { t: 'التواصل', fn: contact }]);
  }

  function eventIntro(ev, priceAsked) {
    if (ev === 'katb') return katb(); if (ev === 'birthday') return birthday(); if (ev === 'special') return special(); if (ev === 'aqiqa') return aqiqa(); if (ev === 'photo') return photo();
    S.event = ev;
    if (S.count) return recommend();
    const H = K.halls;
    bot(`<p class="dmb-h">${ev === 'engagement' ? 'حفلات الخطوبة' : 'حفلات الزفاف'}</p><p>تبدأ أسعار الباكدجات من:</p><table class="dmb-t"><tr><td>قاعة اللوتس <small>(السعة ١٠٠ – ٢٠٠ فرد، الباكدج لـ ١٠٠ فرد)</small></td><td class="n">${money(H.lotus.menus[0].price)}</td></tr><tr><td>قاعة إيزيس <small>(السعة ١٥٠ – ٣٠٠ فرد، الباكدج لـ ١٥٠ فرد)</small></td><td class="n">${money(H.isis.menus[0].price)}</td></tr><tr><td>قاعة أخناتون <small>(السعة ٢٥٠ – ٦٠٠ فرد، الباكدج لـ ٢٥٠ فرد منتصف الأسبوع)</small></td><td class="n">${money(H.akhenaten.menus[0].wd)}</td></tr></table><p>يُرجى إفادتنا بالعدد المتوقع للمدعوين، لنرشّح لكم القاعة الأنسب ونحسب التكلفة التقديرية.</p>`);
    FLOW = { wantCount: true, step: (raw, t, e) => { const n = e.count || findCount(t, true); if (!n) { FLOW = null; return false; } FLOW = null; S.count = n; recommend(); return true; } };
    chips(['lotus', 'isis', 'akhenaten'].map(h => ({ t: 'أسعار ' + HALLNAME[h], fn: () => hallPrices(h) })));
  }

  function menusList() {
    bot(`<p>لكل قاعة ومناسبة منيو كامل بالباكدجات والأسعار والإضافات. اختاروا لعرض التفاصيل هنا، أو افتحوا المنيو المصوّر:</p>`,
      [['akhenaten', 'قاعة أخناتون'], ['isis', 'قاعة إيزيس'], ['lotus', 'قاعة اللوتس'], ['mawadda', 'المودة والرحمة'], ['birthday', 'أعياد الميلاد'], ['special', 'المناسبات الخاصة'], ['photo', 'فوتو سيشن']].map(([g, t]) => ({ t: 'منيو ' + t, go: g })));
    chips([{ t: 'منيوهات أخناتون', fn: () => hallPrices('akhenaten', true) }, { t: 'منيوهات إيزيس', fn: () => hallPrices('isis', true) }, { t: 'منيوهات اللوتس', fn: () => hallPrices('lotus', true) }, { t: 'الكوفي بريك', fn: () => menuDetail({ k: 'cb', n: 0 }) }]);
  }
  function decor(photosFirst) {
    const hid = K.halls[S.hall] ? S.hall : null;
    const ds = hid ? [hid] : ['akhenaten', 'isis', 'lotus'];
    const links = ds.map(h => ({ t: 'صور ديكورات ' + HALLNAME[h], go: K.halls[h].decor }));
    if (photosFirst) {
      bot(`<p>يمكنكم استعراض أحدث الكوشات والديكورات لكل قاعة من الروابط التالية، واختيار رقم التصميم وإرساله لفريق الحفلات.</p><p class="dmb-note">الكوشة والسنتربيس مشمولان في باكدجات الأفراح${hid === 'lotus' ? '' : '، مع إمكانية الترقية إلى الكوشة الاسبيشيال بإضافة ٤٬٠٠٠ ج بقاعتي أخناتون وإيزيس'}.</p>`, links);
      chips(ds.map(h => ({ t: 'أسعار ديكورات ' + HALLNAME[h], fn: () => { S.hall = h; decor(); } })));
      return;
    }
    const items = hid ? K.addons.filter(a => a.s === hid && a.g === 'الديكورات') : [];
    bot(`<p>يشمل كل باكدج أفراح <b>ديكور (كوشة – سنتربيس)</b> من تشكيلة كوشات القاعة${hid === 'akhenaten' || hid === 'isis' ? '، مع إمكانية الترقية إلى الكوشة الاسبيشيال بإضافة ٤٬٠٠٠ ج' : ''}. ويمكنكم تصفّح صور الكوشات والديكورات واختيار رقم التصميم وإرساله لفريق الحفلات.</p>${items.length ? `<div class="dmb-sec"><b>أسعار الديكورات الإضافية – ${HALLNAME[hid]}:</b></div><table class="dmb-t">${items.map(a => `<tr><td>${A(a.n)}</td><td class="n">${ar(a.p)}</td></tr>`).join('')}</table>${src(hid, items[0].pg)}` : ''}`, links);
    if (!hid) chips(ds.map(h => ({ t: 'أسعار ديكورات ' + HALLNAME[h], fn: () => { S.hall = h; decor(); } })));
    else chips([{ t: 'أسعار ' + HALLNAME[hid], fn: () => hallPrices(hid) }, { t: 'ما يشمله الباكدج', fn: included }]);
  }

  function contact(addrFirst) {
    bot(`<p class="dmb-h">للحجز والاستفسار</p><p><b>العنوان:</b> ${ADDRESS}</p><p><b>المعاينة:</b> يومياً من ١٠ صباحاً حتى ١٠ مساءً</p><p><b>التليفون:</b> <span dir="ltr">${PHONES.map(p => `<a href="tel:${p}" style="color:inherit">${p}</a>`).join(' / ')}</span></p><p><b>واتساب:</b> <span dir="ltr">01111117958</span></p>`,
      [{ t: 'الموقع على الخريطة', href: MAP }, waAct('دار المراسم لضباط الشرطة – أرغب في الاستفسار عن حجز حفل'), { t: 'اتصلوا: ' + PHONES[1], href: 'tel:' + PHONES[1] }, { t: 'إنستجرام', href: 'https://www.instagram.com/darelmarasem' }, { t: 'فيسبوك', href: 'https://www.facebook.com/share/1FXFmzZdxc/' }]);
    chips([{ t: 'حجز موعد معاينة', fn: () => startVisit() }, { t: 'تجهيز طلب الحجز', fn: () => startBook() }]);
  }
  function visitInfo() {
    bot('<p>معاينة القاعات متاحة <b>يومياً من ١٠ صباحاً حتى ١٠ مساءً</b>. اختاروا اليوم والساعة وسأجهّز رسالة التأكيد لفريق الحفلات عبر واتساب.</p>');
    chips([{ t: 'حجز موعد معاينة', fn: () => startVisit() }, { t: 'العنوان', fn: () => contact(true) }]);
  }

  function askEvent() {
    const n = S.count;
    if (n > 600) { bot(`<p>العدد ${AD(n)} فرد يتجاوز أكبر سعة منشورة لقاعات الدار (قاعة أخناتون حتى ٦٠٠ فرد)، ويُرجى التواصل مع فريق الحفلات لدراسة الطلب.</p>`, [waAct(`دار المراسم لضباط الشرطة – استفسار عن مناسبة لعدد ${n} فرد`, 'تواصلوا مع فريق الحفلات عبر واتساب')]); chips([{ t: 'سعات القاعات', fn: capacities }, { t: 'التواصل', fn: contact }]); return; }
    bot(`<p>لعدد ${AD(n)} فرد، ما نوع المناسبة؟ تختلف القاعات والباكدجات حسب المناسبة.</p>`);
    chips(['wedding', 'engagement', 'katb', 'birthday', 'aqiqa', 'special'].map(e => ({ t: EVNAME[e], fn: () => { S.event = e; recommend(); } })));
  }
  function mostExpensive() {
    const H = K.halls, a = H.akhenaten.menus.find(m => m.id === 'ob3'), i = H.isis.menus.find(m => m.id === 'ob3'), l = H.lotus.menus.find(m => m.id === 'sm3');
    bot(`<p>أعلى الباكدجات سعراً هو <b>أوبن بوفيه (٣) بقاعة أخناتون</b>: ${money(a.we)} لعدد ٣٠٠ فرد في نهاية الأسبوع، و${money(a.wd)} لعدد ٢٥٠ فرد في منتصف الأسبوع.</p><table class="dmb-t"><tr><th>القاعة</th><th>أعلى باكدج</th><th>السعر</th></tr><tr><td>قاعة أخناتون</td><td>أوبن بوفيه (٣)</td><td class="n">${money(a.we)}</td></tr><tr><td>قاعة إيزيس</td><td>أوبن بوفيه (٣) – ١٥٠ فرد</td><td class="n">${money(i.price)}</td></tr><tr><td>قاعة اللوتس</td><td>ست منيو (٣) – ١٠٠ فرد</td><td class="n">${money(l.price)}</td></tr></table><p class="dmb-note">يُضاف ${money(5000)} بقاعة إيزيس و${money(2500)} بقاعة اللوتس لأيام نهاية الأسبوع والأعياد والعطلات الرسمية.</p>${src('akhenaten', 12)}`);
    chips([{ t: 'محتوى أوبن بوفيه (٣)', fn: () => { S.hall = 'akhenaten'; menuDetail({ k: 'ob', n: 3 }); } }, { t: 'أقل الباكدجات سعراً', fn: cheapest }, { t: 'ترشيح قاعة مناسبة', fn: () => startRec() }]);
  }
  function obNoHall(mq, t) {
    if (mq.n === 0 && / (?:فيه ايه|فيها ايه|بيقدم|اصناف|محتوي|مكونات|بيشمل|ايه اللي)/.test(t)) {
      S.hall = 'akhenaten';
      bot('<p>الأوبن بوفيه متاح بقاعتي <b>أخناتون وإيزيس</b> بنفس الأصناف، وأصناف أوبن بوفيه (١) و(٢) متطابقة. هذه أصناف أوبن بوفيه (١):</p>');
      return menuDetail({ k: 'ob', n: 1 });
    }
    if (mq.n === 0 || / ?1 .*2 | 1 و ?2 /.test(t)) {
      const A1 = K.halls.akhenaten.menus, I1 = K.halls.isis.menus, f = (L, id) => L.find(m => m.id === id);
      bot(`<p>الأوبن بوفيه متاح بقاعتي <b>أخناتون وإيزيس</b> بثلاثة اختيارات (قاعة اللوتس تقدّم الهاي تي والست منيو فقط). وأصناف أوبن بوفيه (١) و(٢) متطابقة كما هي مطبوعة في المنيو، والاختلاف في السعر فقط.</p><table class="dmb-t"><tr><th>المنيو</th><th>أخناتون <small>(منتصف/نهاية الأسبوع)</small></th><th>إيزيس <small>(١٥٠ فرد)</small></th></tr>${['ob1', 'ob2', 'ob3'].map(id => `<tr><td>${A(f(A1, id).name)}</td><td class="n">${money(f(A1, id).wd)}<br><small>${money(f(A1, id).we)}</small></td><td class="n">${money(f(I1, id).price)}</td></tr>`).join('')}</table>${src('akhenaten', '١٠ – ١٢')}`);
      chips([1, 2, 3].map(n => ({ t: 'محتوى أوبن بوفيه (' + AD(n) + ')', fn: () => { S.hall = S.hall && K.halls[S.hall] && S.hall !== 'lotus' ? S.hall : 'akhenaten'; menuDetail({ k: 'ob', n }); } })));
      return;
    }
    S.hall = 'akhenaten';
    bot('<p>الأوبن بوفيه متاح بقاعتي أخناتون وإيزيس بنفس الأصناف؛ وهذه تفاصيله بقاعة أخناتون:</p>');
    menuDetail(mq);
    chips([{ t: 'السعر بقاعة إيزيس', fn: () => { S.hall = 'isis'; menuDetail(mq); } }, { t: 'احسب التكلفة لعدد معين', fn: () => askCount() }]);
  }
  function compareMenus(k, a, b) {
    const hid = K.halls[S.hall] ? S.hall : null;
    if (k === 'ob' && (!hid || hid === 'lotus') && [a, b].sort().join() === '1,2') return obNoHall({ k: 'ob', n: 0 }, ' 1 و 2 ');
    if (!hid && k !== 'cb' && k !== 'ssm') { bot('<p>يُرجى تحديد القاعة للمقارنة بين المنيوهين:</p>'); chips(['akhenaten', 'isis', 'lotus'].map(h => ({ t: HALLNAME[h], fn: () => { S.hall = h; compareMenus(k, a, b); } }))); return; }
    const get = n => k === 'cb' || k === 'ssm' ? K.special.menus.find(m => m.id === k + n) : hallMenu(hid, { k, n });
    const m1 = get(a), m2 = get(b);
    if (!m1 || !m2) return menuDetail({ k, n: a });
    const price = m => m.pp ? money(m.pp) + ' للفرد' : m.wd ? money(m.wd) + ' / ' + money(m.we) : money(m.price);
    const same = JSON.stringify(m1.c) === JSON.stringify(m2.c);
    bot(`<p class="dmb-h">مقارنة: ${A(m1.name)} و${A(m2.name)}${hid ? ' – ' + HALLNAME[hid] : ''}</p>${same ? '<p><b>الأصناف متطابقة كما هي مطبوعة في المنيو، والاختلاف في السعر فقط.</b></p>' : ''}<table class="dmb-t"><tr><th></th><th>${A(m1.name)}</th><th>${A(m2.name)}</th></tr><tr><td>السعر</td><td class="n">${price(m1)}</td><td class="n">${price(m2)}</td></tr>${same ? '' : m1.c.map(s1 => { const s2 = m2.c.find(x => x.h === s1.h); const L = s => s ? s.o.filter(o => o[0] === 'i').map(o => A(o[1])).join('، ') : '—'; return `<tr><td><b>${A(s1.h)}</b></td><td><small>${L(s1)}</small></td><td><small>${L(s2)}</small></td></tr>`; }).join('')}</table>${src(hid || 'special', m1.pg + ' و' + m2.pg)}`);
    chips([{ t: 'احسب التكلفة لعدد معين', fn: () => askCount() }, { t: 'تجهيز طلب الحجز', fn: () => startBook() }]);
  }
  function katbTimes() {
    const k = K.katb;
    bot(`<p>مدة عقد القران <b>ساعة ونصف</b>، والمواعيد المحددة:</p><div class="dmb-sec"><b>قاعة المودة والرحمة</b><ul><li>من السبت إلى الخميس: الساعة ٣ أو ٥ أو ٧ أو ١٠ مساءً</li><li>يوم الجمعة: الساعة ٥ أو ١٠ مساءً</li></ul></div><div class="dmb-sec"><b>قاعة اللوتس</b><ul>${k.lotus.slots.map(s => `<li>${A(s)}</li>`).join('')}</ul></div>${src('mawadda', 2)}`);
    chips([{ t: 'أسعار عقد القران', fn: () => katb() }, { t: 'تجهيز طلب الحجز', fn: () => startBook() }]);
  }
  function hallBrief(hid) {
    const dep = K.deposit.find(r => r[0] === { roof: 'الروف توب', glass: 'الخيمة VIP', lulu: 'قاعة اللؤلؤة', marasem: 'قاعة المراسم' }[hid]);
    const depTxt = dep && hid !== 'glass' ? `<p class="dmb-note">مقدم الحجز ${money(dep[1])} والتأمين ${money(dep[2])} (اللائحة، ص ١٠).</p>` : '';
    if (hid === 'roof' || hid === 'glass') {
      const b = K.birthday.find(x => x.id === (hid === 'roof' ? 'roof' : 'glass'));
      bot(`<p><b>${b.name}</b>: باكدج أعياد الميلاد <b>${money(b.price)}</b>، و${b.cap}.</p><p>يشمل الباكدج حجز القاعة والكراسي والترابيزات وساوند سيستم SPEAKERS.</p>${depTxt}${src('birthday', 2)}`, [{ t: 'عرض منيو أعياد الميلاد', go: 'birthday' }]);
      chips([{ t: 'إضافات أعياد الميلاد', q: 'ديكور بالونات عيد ميلاد' }, { t: 'باكدجات أعياد الميلاد كلها', fn: birthday }, { t: 'تجهيز طلب الحجز', fn: () => startBook() }]);
      return;
    }
    const h = K.special.halls.find(x => x.id === hid);
    bot(`<p><b>${h.name}</b>: حجز القاعة للمناسبات الخاصة <b>${money(h.price)}</b> لعدد ${AD(h.n)} فرد، شامل الكراسي والترابيزات، والمنيو يُحتسب بالفرد (اسبيشيال ست منيو من ${money(450)}، كوفي بريك من ${money(345)}).</p><p class="dmb-note">السعة القصوى للقاعة غير منشورة في المنيو؛ ويوجد بند «ترابيزة + كرسي إضافي» بسعر ${money(50)}.</p>${depTxt}${src('special', '٢ – ٣')}`, [{ t: 'عرض منيو المناسبات الخاصة', go: 'special' }]);
    chips([{ t: 'محتوى الكوفي بريك', fn: () => menuDetail({ k: 'cb', n: 0 }) }, { t: 'محتوى اسبيشيال ست منيو', fn: () => menuDetail({ k: 'ssm', n: 0 }) }, { t: 'احسب لعدد معين', fn: () => askCount(special) }]);
  }
  const pcs = n => AD(n) + (n >= 3 && n <= 10 ? ' قطع' : ' قطعة');
  function estTotal(H, m, n, day) {
    let base, baseN;
    if (H.pk.type === 'wk') { baseN = H.pk[day || 'wd'].n; base = m[day || 'wd']; }
    else { baseN = H.pk.n; base = m.price + (day === 'we' ? H.pk.fee : 0); }
    const ex = Math.max(n - baseN, 0);
    return base + (m.tiers ? tierCost(ex, m.tiers).total : ex * m.extra);
  }
  /* ---------------- knowledge engine: searches everything the venue documents say ---------------- */
  const STOPW = new Set(['سعر', 'اسعار', 'بكام', 'بكم', 'كام', 'عاوز', 'عايز', 'ابغي', 'اريد', 'ايه', 'هو', 'هي', 'في', 'فى', 'من', 'علي', 'عن', 'لو', 'ممكن', 'يا', 'و', 'او', 'اللي', 'ده', 'دي', 'دا', 'قاعه', 'عندكم', 'عندك', 'فيه', 'فيها', 'بتاع', 'بتاعه', 'بتاعت', 'الف', 'جنيه', 'حفل', 'فرح', 'افراح', 'تمن', 'ثمن', 'تكلفه', 'كم', 'هل', 'انا', 'احنا', 'لينا', 'ليا', 'بيبقي', 'يبقي', 'بقي', 'اعرف', 'تقولي', 'قولي', 'محتاج', 'نفسي', 'لما', 'مع', 'شويه', 'حاجه', 'ازاي', 'ليه', 'كده', 'برضه', 'اضافه', 'اضافات', 'خارج', 'باكدج', 'باكيدج', 'باقه', 'منيو', 'رسوم', 'سعرها', 'سعره', 'فرد', 'افراد', 'شخص', 'اشخاص', 'نفر', 'معزوم', 'معازيم', 'عدد', 'تقريبا', 'حوالي', 'يوم', 'خميس', 'جمعه', 'سبت', 'كتب', 'كتاب', 'عقد', 'قران', 'عيد', 'ميلاد', 'زفاف', 'خطوبه', 'سعه', 'تساع', 'قاعات', 'قاعتين', 'باكدجات', 'منيوهات', 'ارخص', 'اغلي', 'فين', 'كله', 'كلها', 'كل', 'بس', 'طيب', 'طب', 'تمام', 'ok', 'موجود', 'موجوده', 'متاح', 'متاحه', 'متوفر', 'متوفره', 'ينفع', 'مسموح', 'ضمن', 'شامل', 'بيشمل', 'يشمل', 'مجاني', 'ببلاش', 'بفلوس', 'مدفوع', 'معاه', 'معاها', 'عندها', 'بتقدموا', 'تقدموا', 'بتعملوا', 'اقدر', 'نقدر', 'اجيب', 'نجيب', 'نعمل', 'اعمل', 'عشان', 'علشان', 'لازم', 'محتاجين', 'عايزين', 'عاوزين', 'الدار', 'دار', 'المراسم', 'مراسم', 'ج', 'ك', 'كيلو', 'دخوله', 'دخولها', 'دخولهم', 'بره', 'برا', 'الخارج', 'خارجي', 'نجيبه', 'اجيبه', 'ندخل', 'ادخل', 'دخول', 'بوفيه', 'اوبن', 'ست', 'سيت', 'هاي', 'تي', 'كوفي', 'بريك', 'مفتوح', 'the', 'is', 'a', 'of', 'for', 'how', 'much', 'price', 'do', 'you', 'have']);
  const SYN = [[['ميك اب', 'ميكاب', 'ميكب', 'ميكير', 'makeup', 'ميك اب ارتست', 'ميكاب ارتست', 'ميكب ارتيست', 'ميكب ارتست'], 'ميكب'], [['كوافير', 'كوفير', 'هير دريسر', 'هيردريسر', 'hair', 'هير', 'كوافيره'], 'هير'], [['مصوراتي', 'فوتوجرافر', 'فوتوغرافر', 'photographer', 'مصور', 'مصوره'], 'مصور'],
    [['زفه', 'دمياطي', 'زفاف دمياطي', 'زفات'], 'زفه'], [['تورته', 'torta', 'كيكه', 'الكيكه', 'تورت', 'cake'], 'تورته'], [['جناح', 'سويتات', 'سويت', 'suite', 'اجنحه'], 'سويت'], [['اوضه', 'اوض', 'غرفه', 'روم', 'room', 'غرف'], 'غرفه'],
    [['شاشه', 'شاشات', 'screen', 'سكرين'], 'شاشه'], [['دي جي', 'dj', 'ديجي', 'دى جى'], 'ديجي'], [['فاير', 'شو النار', 'fire'], 'فاير'], [['ماذون', 'مازون', 'ماذونين'], 'ماذون'], [['الساعه الزياده', 'الساعه الاضافيه', 'ساعه الزياده', 'ساعات الزياده', 'ساعه زياده', 'ساعه اضافيه', 'ساعات زياده', 'ساعات اضافيه', 'وقت اضافي', 'وقت زياده', 'مد الوقت', 'تمديد'], 'ساعه اضافيه'],
    [['كراسي', 'كرسي', 'chairs'], 'كرسي'], [['ترابيزات', 'ترابيزه', 'طرابيزه', 'تربيزه', 'طاولات', 'طاوله'], 'ترابيزه'], [['بالونات', 'بلالين', 'بالونه', 'بالون'], 'بالون'], [['ويلكم بورد', 'ويلكم', 'welcome'], 'welcome'], [['جيست بوك', 'جيستبوك', 'guest book', 'guest'], 'جيست'], [['ويدنج بلانر', 'wedding planner', 'ويدينج بلانر', 'ويدنج', 'منظم حفلات', 'منظمه حفلات', 'بلانر', 'planner', 'كوردينيتور'], 'planner'], [['ايطالي', 'الايطالي', 'italian'], 'italian'],
    [['هاي تيبلز', 'هاي تيبل', 'هاي تابل', 'هاي تيبلس', 'high tables', 'high table'], 'هايتيبل'], [['درون', 'drone'], 'درون'], [['ورا', 'وراء', 'خلف'], 'خلف'], [['فيديوهات', 'فيديو', 'video'], 'فيديو'], [['تصوير', 'تصويري'], 'تصوير'], [['فوتوغرافي', 'فوتوغراف', 'صور فوتوغرافيه', 'photo', 'فوتو'], 'فوتوغرافي'], [['البوم', 'البومات', 'album'], 'البوم'], [['فلاشه', 'usb'], 'فلاشه'],
    [['مشروبات', 'حاجه ساقعه', 'ساقع', 'بيبسي', 'كانز', 'soft', 'سوفت درينك', 'سوفت', 'درينك', 'drinks', 'مشروب'], 'مشروبات'], [['عصير', 'عصاير', 'juice'], 'عصير'], [['مايه', 'مياه', 'ميه معدنيه', 'مياه معدنيه', 'water'], 'مياه'], [['شاي', 'قهوه', 'نسكافيه', 'مشروب سخن', 'مشروبات سخنه', 'ساخن'], 'ساخن'],
    [['فرد زياده', 'فرد اضافي', 'شخص زياده'], 'فرد اضافي'], [['سندوتش', 'سندوتشات', 'ساندوتش', 'ساندوتشات', 'سندويتش', 'سندويتشات', 'sandwich', 'sandwiches'], 'سندوتشات'], [['حلويات شرقي', 'حلو شرقي', 'حلويات شرقيه', 'شرقي'], 'شرقي'], [['حلويات', 'حلو', 'ديزرت', 'dessert'], 'حلويات'], [['فخده', 'فخذه'], 'فخده'], [['خروف', 'خرفان', 'لحم ضاني', 'ضاني'], 'خروف'], [['ديك رومي', 'رومي'], 'رومي'], [['سمك', 'اسماك', 'سي فود', 'ماكولات بحريه', 'seafood', 'fish'], 'سمك'],
    [['ليزر', 'laser'], 'ليزر'], [['مايك', 'ميكروفون', 'مايكات', 'mic'], 'مايك'], [['ساوند', 'سماعات', 'speakers', 'ساوند سيستم', 'صوتيات'], 'ساوند'], [['بوديوم', 'منصه'], 'بوديوم'], [['دانس فلور', 'دانس'], 'دانس'], [['هولوجرام'], 'هولوجرام'], [['vip', 'في اي بي'], 'vip'], [['بابلز', 'فقاقيع', 'bubbles'], 'بابلز'], [['شربات'], 'شربات'], [['سنتر بيس', 'سنتربيس'], 'سنتربيس'],
    [['كوشه', 'كوشات', 'kosha'], 'كوشه'], [['استيدج', 'ستيدج', 'stage', 'مسرح'], 'استيدج'], [['كات ووك', 'catwalk'], 'كاتووك'], [['محشي', 'محاشي'], 'محاشي'], [['اضاءه', 'لايتنج', 'lighting', 'لايت'], 'ليزر'], [['دخان', 'سموك', 'smoke', 'فوج', 'fog'], 'دخان'], [['فوتو بوث', 'فوتوبوث', 'بوز', 'booth'], 'بوز'], [['شوكولاته', 'شيكولاته', 'شوكلت', 'شيكولاتة'], 'شيكولاته']];
  const SYNRE = SYN.map(([ws, c]) => [new RegExp(' ' + PRE + '(?:' + ws.map(w => reEsc(norm(w).trim())).sort((a, b) => b.length - a.length).join('|') + ')(?= )', 'g'), ' ' + c + ' ']);
  const ITEMWORDS = SYN.map(x => x[1]);
  function canon(t) { let s = ' ' + String(t).trim() + ' '; SYNRE.forEach(([re, w]) => { s = s.replace(re, w); }); return s.replace(/\s+/g, ' '); }
  function hasItemWord(t) { const c = canon(t); return ITEMWORDS.some(w => c.includes(' ' + w + ' ')); }
  const strip = w => { const m = w.match(/^(?:وال|بال|فال|لل|ال)(.{2,})$/); return m ? m[1] : w; };
  const stems = w => { const o = [w]; if (w.length >= 4 && w.endsWith('ه')) o.push(w.slice(0, -1)); if (w.length >= 5 && /(?:ات|ين)$/.test(w)) o.push(w.slice(0, -2)); return o; };
  function wordset(s) { const out = new Set(); canon(norm(s)).trim().split(' ').forEach(w => { if (!w) return; [w, strip(w)].forEach(x => stems(x).forEach(y => out.add(y))); }); return out; }
  let IDX = null;
  function buildIndex() {
    const E = [];
    const halls = { akhenaten: 'قاعة أخناتون', isis: 'قاعة إيزيس', lotus: 'قاعة اللوتس' };
    for (const [hid, name] of Object.entries(halls)) {
      const h = K.halls[hid];
      h.inc.forEach(sec => sec.o.forEach(([k, x]) => { if (k === 'i') E.push({ k: 'inc', where: 'باكدج الأفراح – ' + name, doc: hid, pg: h.incpg, x }); }));
      h.menus.forEach(m => m.c.forEach(sec => sec.o.forEach(([k, x]) => { if (k === 'i' || !/مجموعه|تشكيله|يقدم|سيرفيس|اختيار/.test(norm(x)) || /كارفن/.test(norm(sec.h))) E.push({ k: 'dish', where: m.name, hall: name, doc: hid, pg: m.pg, x }); })));
    }
    for (const [id, x] of Object.entries(K.katb)) x.c.forEach(sec => sec.o.forEach(([k, v]) => { if (k === 'i' && !/^من \d/.test(v)) E.push({ k: 'inc', where: 'عقد القران – ' + x.name, doc: x.menu, pg: x.pg, x: v }); }));
    K.aqiqa.forEach(p => p.i.forEach(v => E.push({ k: 'inc', where: 'العقيقة ' + p.name + ' – قاعة اللوتس', doc: 'lotus', pg: 13, x: v })));
    ['حجز القاعة', 'كراسي + ترابيزات', 'ساوند سيستم SPEAKERS'].forEach(v => E.push({ k: 'inc', where: 'باكدجات أعياد الميلاد', doc: 'birthday', pg: 2, x: v }));
    E.push({ k: 'inc', where: 'حجز قاعات المناسبات الخاصة', doc: 'special', pg: 2, x: 'الكراسي والترابيزات' });
    K.special.menus.forEach(m => m.c.forEach(sec => sec.o.forEach(([k, x]) => { if (k === 'i') E.push({ k: 'dish', where: m.name, hall: 'المناسبات الخاصة', doc: 'special', pg: m.pg, x }); })));
    K.addons.forEach(a => E.push({ k: 'add', s: a.s, g: a.g, x: a.n, p: a.p, doc: K.docOf[a.s], pg: a.pg }));
    E.forEach(e => { e.ws = wordset(e.x); e.gs = e.g ? wordset(e.g) : null; });
    const df = {};
    E.forEach(e => new Set([...e.ws, ...(e.gs || [])]).forEach(w => { df[w] = (df[w] || 0) + 1; }));
    IDX = { E, df, N: E.length };
  }
  function qTokens(t) {
    const hallTok = new Set(); Object.values(HALLS).forEach(ws => ws.forEach(w => norm(w).trim().split(' ').forEach(x => { hallTok.add(x); hallTok.add(strip(x)); })));
    Object.values(EVENTS).forEach(ws => ws.forEach(w => { const x = norm(w).trim(); if (!x.includes(' ')) { hallTok.add(x); hallTok.add(strip(x)); } }));
    return [...new Set(canon(t).trim().split(' ').map(w => [w, strip(w)]).filter(([w, s]) => w.length >= 2 && !STOPW.has(w) && !STOPW.has(s) && !hallTok.has(w) && !hallTok.has(s) && !/^\d+$/.test(w)).map(([w, s]) => s))];
  }
  const idf = w => Math.log(1 + IDX.N / (IDX.df[w] || 0.5));
  function wHit(ws, w) {
    if (ws.has(w)) return 1;
    for (const x of stems(w).slice(1)) if (ws.has(x)) return 0.95;
    if (w.length >= 5) for (const x of ws) if (x.length >= 5 && (x.startsWith(w) || w.startsWith(x))) return 0.8;
    return 0;
  }
  function search(t) {
    if (!IDX) buildIndex();
    const toks = qTokens(t);
    if (!toks.length) return { toks, res: [], best: 0, cover: 0 };
    const total = toks.reduce((s, w) => s + idf(w), 0);
    const qn = t.match(/\d+/g) || [];
    const res = [];
    for (const e of IDX.E) {
      let sc = 0, hit = 0;
      for (const w of toks) {
        let h = wHit(e.ws, w);
        if (!h && e.gs) h = wHit(e.gs, w);
        if (h) { sc += h * idf(w); hit++; }
      }
      if (!hit) continue;
      const an = norm(e.x).match(/\d+/g) || [];
      if (qn.length && an.length) sc += qn.some(x => an.includes(x)) ? 1.5 : -0.5;
      if (/ديكور|تزيين/.test(norm(e.x)) && !/ديكور|تزيين|زين/.test(t)) sc -= 1;
      if (/رسوم|دخول/.test(norm(e.x)) && !/رسوم|دخول|بره|برا|الخارج|خارجي/.test(t)) sc -= 0.8;
      if (/ بوز/.test(' ' + norm(e.x)) && !/بوز|بوث|booth/.test(t)) sc -= 1.5;
      if (/خلف الكوشه/.test(norm(e.x)) && !/شاشه|شاشات|screen/.test(t)) sc -= 2;
      res.push({ e, sc, cover: sc / total, hit });
    }
    res.sort((a, b) => b.sc - a.sc);
    return { toks, res, best: res[0] ? res[0].sc : 0, cover: res[0] ? res[0].cover : 0 };
  }
  const dispKey = s => norm(s).replace(/^\d+ /, '').replace(/ ?\+ ?سياره|بالسياره/g, ' سياره').replace(/\s+/g, ' ').trim();
  const scopeOrder = ['akhenaten', 'isis', 'lotus', 'lotusk', 'mawadda', 'aqiqa', 'birthday', 'special', 'photo'];
  function ctxScope() {
    if (S.event === 'katb') return S.hall === 'lotus' ? 'lotusk' : S.hall === 'mawadda' ? 'mawadda' : null;
    if (['birthday', 'special', 'photo', 'aqiqa'].includes(S.event)) return S.event;
    if (K.halls[S.hall]) return S.hall;
    if (S.hall === 'mawadda') return 'mawadda';
    return null;
  }
  function knowledge(t, raw, R, mq, opts) {
    R = R || search(t);
    const top = R.best, keep = R.res.filter(r => r.sc >= top * (opts && opts.rel || 0.72) && r.cover >= (opts && opts.minCover || 0.45));
    if (!keep.length) return false;
    const scope = ctxScope();
    const askInc = / (?:ضمن|مع|شامل|بيشمل|يشمل|مشمول|مجاني|ببلاش|بفلوس)(?: |ال)/.test(t);
    const menuAsk = / (?:منيو|المنيو|المنيوهات|الاكل|اصناف|الاصناف|بتقدموا|بيتقدم|في البوفيه|طبق|اطباق)/.test(t);
    const inc = keep.filter(r => r.e.k === 'inc'), add = keep.filter(r => r.e.k === 'add');
    const MQ = { sm: 'ست منيو', ob: 'أوبن بوفيه', ht: 'هاي تي', cb: 'كوفي بريك', ssm: 'اسبيشيال' };
    let dish = keep.filter(r => r.e.k === 'dish' && (menuAsk || mq || !(inc.length || add.length) || r.cover >= 0.95));
    let notIn = '';
    if (mq && MQ[mq.k]) {
      const all = dish, label = MQ[mq.k] + (mq.n ? ' (' + AD(mq.n) + ')' : '');
      dish = dish.filter(r => r.e.where.includes(MQ[mq.k]) && (!mq.n || r.e.where.includes('(' + mq.n + ')')));
      if (dish.length) { inc.length = 0; add.length = 0; }
      else if (all.length) { notIn = `<p><b>لا</b>، هذا الصنف غير وارد في ${label}${K.halls[S.hall] ? ' – ' + HALLNAME[S.hall] : ''}، ويوجد في المنيوهات التالية:</p>`; dish = all; inc.length = 0; add.length = 0; }
    }
    if (!inc.length && !add.length && !dish.length) return false;
    const parts = [], used = new Set();
    // included in packages
    if (inc.length) {
      const g = {};
      inc.forEach(({ e }) => { const k = dispKey(e.x); (g[k] = g[k] || { x: e.x, w: [] }).w.includes(e.where) || g[k].w.push(e.where); used.add(DOCNAME[e.doc] + ' ص ' + AD(e.pg)); });
      const compact = ws => { const m = {}; ws.forEach(w => { const [a, b] = w.split(' – '); const pm = a.match(/ (باكدج \(\d\))$/); const key = a.replace(/ باكدج \(\d\)$/, ''); const val = pm ? pm[1] : (b || '').replace('قاعة ', ''); (m[key] = m[key] || []).includes(val) || m[key].push(val); }); return Object.entries(m).map(([k, v]) => v.filter(Boolean).length ? `${k} (${v.filter(Boolean).join('، ')})` : k).join('؛ '); };
      parts.push(`<div class="dmb-sec">${askInc ? '' : '<b>مشمول ضمن الباكدج في:</b>'}<ul>${Object.values(g).slice(0, 6).map(v => `<li><b>${A(v.x)}</b><br><small>${ar(compact(v.w))}</small></li>`).join('')}</ul></div>`);
    }
    // add-ons
    if (add.length) {
      let list = add.map(r => r.e);
      const inScope = scope ? list.filter(e => e.s === scope) : [];
      if (inScope.length) list = inScope;
      const g = {}, order = [];
      list.sort((a, b) => scopeOrder.indexOf(a.s) - scopeOrder.indexOf(b.s)).forEach(e => { const k = dispKey(e.x); if (!g[k]) { g[k] = []; order.push(k); } g[k].push(e); used.add(DOCNAME[e.doc] + ' ص ' + AD(e.pg)); });
      const oneScope = new Set(list.map(e => e.s)).size === 1;
      const LIM = order.length <= 16 || oneScope ? Math.min(order.length, 40) : 10;
      const rows = order.slice(0, LIM).map(k => {
        const L = g[k], prices = [...new Set(L.map(e => e.p))];
        const where = [...new Set(L.map(e => K.scopes[e.s]))];
        const wl = inScope.length ? K.scopes[scope] : where.length >= 5 ? 'جميع القاعات والمناسبات الواردة بها' : where.join('، ');
        if (prices.length === 1) return `<tr><td>${A(L[0].x)}<br><small>${wl}</small></td><td class="n">${ar(prices[0])}</td></tr>`;
        return `<tr><td colspan="2"><b>${A(L[0].x)}</b></td></tr>` + L.map(e => `<tr><td><small>${K.scopes[e.s]}</small></td><td class="n">${ar(e.p)}</td></tr>`).join('');
      }).join('');
      if (rows) parts.push(`${inc.length ? '<div class="dmb-sec"><b>ومتاح كإضافة خارج الباكدج:</b></div>' : ''}<table class="dmb-t">${rows}</table>${order.length > LIM ? `<p class="dmb-note">ويوجد ${AD(order.length - LIM)} ${order.length - LIM <= 10 && order.length - LIM >= 3 ? 'بنود أخرى مرتبطة' : 'بنداً آخر مرتبطاً'}؛ يُرجى تحديد القاعة أو اسم البند لعرضها.</p>` : ''}`);
    }
    // dishes in menus
    if (dish.length) {
      const g = {};
      dish.forEach(({ e }) => { const k = dispKey(e.x); g[k] = g[k] || { x: e.x, h: {} }; (g[k].h[e.hall] = g[k].h[e.hall] || []).includes(e.where) || g[k].h[e.hall].push(e.where); used.add(DOCNAME[e.doc]); });
      parts.push(`<div class="dmb-sec"><b>ضمن أصناف المنيوهات:</b><ul>${Object.values(g).slice(0, 5).map(v => `<li><b>${A(v.x)}</b>: ${Object.entries(v.h).map(([h, ms]) => `${h} (${ms.map(A).join('، ')})`).join('؛ ')}</li>`).join('')}</ul></div>`);
    }
    const lead = opts && opts.lead ? opts.lead : notIn ? notIn : mq && dish.length ? '<p><b>نعم</b>، ضمن أصناف المنيو:</p>' : askInc ? (inc.length ? '<p><b>نعم، مشمول ضمن الباكدج</b> في الحالات التالية:</p>' : '<p><b>غير مشمول ضمن الباكدج</b>، ويُطلب كإضافة:</p>') : inc.length ? '<p><b>نعم، متوفر.</b></p>' : add.length && !dish.length ? '<p><b>نعم، متاح كإضافة</b> بالأسعار التالية:</p>' : '<p><b>نعم، متوفر.</b></p>';
    const ct = canon(t);
    if (/ (?:ليزر|دخان|فاير|شموع) /.test(ct)) parts.push('<p class="dmb-note">وفقاً للائحة (م ٧٤، ٧٥): تخضع مؤثرات الليزر والدخان والشموع لموافقة الإدارة المسبقة وإشرافها، ويُحظر استخدام الألعاب النارية وأي مؤثرات خطرة؛ ويُرجى تأكيد عروض الشو فاير والفاير ورك مع فريق الحفلات.</p>');
    if (/ (?:سندوتشات) /.test(ct) && add.some(r => r.e.s === 'birthday')) setTimeout(() => chips([{ t: 'السندوتشات الباردة', q: 'السندوتشات الباردة عيد ميلاد' }, { t: 'السندوتشات الساخنة', q: 'السندوتشات الساخنة عيد ميلاد' }, { t: 'سندوتشات الكايزر', q: 'برجر كايزر عيد ميلاد' }]), 0);
    const srcs = [...used].slice(0, 4).join('، ');
    bot(lead + parts.join('') + `<p class="dmb-src">المصدر: ${srcs}</p>`);
    const scopes = [...new Set(add.map(r => r.e.s))];
    const ch = [];
    if (!scope && scopes.length > 1) scopes.filter(s => ['akhenaten', 'isis', 'lotus', 'lotusk', 'mawadda', 'birthday'].includes(s)).slice(0, 4).forEach(s => ch.push({ t: 'في ' + K.scopes[s], fn: () => { setScope(s); knowledge(t, raw); } }));
    chips(ch.length ? ch : RELATED());
    return true;
  }
  function setScope(s) {
    if (s === 'lotusk') { S.event = 'katb'; S.hall = 'lotus'; }
    else if (s === 'mawadda') { S.event = 'katb'; S.hall = 'mawadda'; }
    else if (['birthday', 'special', 'photo', 'aqiqa'].includes(s)) { S.event = s; S.hall = null; }
    else { S.hall = s; if (!['wedding', 'engagement'].includes(S.event)) S.event = null; }
  }
  const RELATED = () => [{ t: 'أسعار القاعات', q: 'أسعار القاعات' }, { t: 'ترشيح قاعة مناسبة', fn: () => startRec() }, { t: 'تجهيز طلب الحجز', fn: () => startBook() }, { t: 'التواصل مع فريق الحفلات', fn: contact }];

  /* ---------------- rules (اللائحة) ---------------- */
  const TOPICS = {
    deposit: { k: ['مقدم', 'عربون', 'تثبيت الحجز', 'اثبت الحجز', 'تاكيد الحجز', 'ادفع كام عشان احجز', 'احجز بكام', 'الحجز بكام', 'مقدم الحجز', 'اول دفعه'], a: [6, 7, 46], fn: depositAns },
    insurance: { k: ['تامين', 'التامين', 'ضمان', 'الضمان', 'ديبوزيت', 'deposit'], a: [42, 43, 44], fn: insuranceAns },
    payment: { k: ['السداد', 'جدول السداد', 'الدفعات', 'دفعات', 'اقساط', 'تقسيط', 'قسط', 'ادفع امتي', 'الدفع ازاي', 'الباقي امتي', 'الدفعه التانيه', 'الدفعه الثانيه', 'نظام الدفع', 'باقي المبلغ', 'باقي الفلوس'], a: [33, 39], s: 'جدول السداد حسب اللائحة:<ol><li><b>مقدم الحجز:</b> يُسدَّد كاملاً عند التعاقد.</li><li><b>خلال شهر من التعاقد:</b> اختيار الباكدج والخدمات وسداد ٥٠٪ على الأقل من قيمة الباكدج.</li><li><b>باقي القيمة:</b> كامل قيمة الحفل بما فيها الإضافات والتأمين، قبل موعد الحفل بشهر على الأكثر.</li></ol>وإذا أُبرم التعاقد قبل موعد الحفل بأقل من شهر: تُسدَّد القيمة كاملة والتأمين دفعة واحدة عند التعاقد.<p class="dmb-note">لا يُعتد بالدفعة الثانية إلا مع اختيار الباكدج، وبانقضاء الشهر دون ذلك يُعد المتعاقد متأخراً في السداد (م ٣٩). وسداد باقي القيمة شرط لانعقاد الحفل.</p>' },
    methods: { k: ['بالفيزا', 'الدفع بالفيزا', 'فيزا', 'visa', 'كاش', 'نقدي', 'نقدا', 'انستاباي', 'انستا باي', 'instapay', 'كارت', 'بطاقه ائتمان', 'كريدت', 'تحويل', 'فودافون كاش', 'وسائل الدفع', 'طرق الدفع', 'ادفع ازاي', 'وسيله الدفع'], a: [38, 40], s: 'السداد متاح <b>نقداً</b>، أو <b>ببطاقات الدفع (فيزا)</b>، أو <b>عبر إنستاباي</b> على حساب الدار المعتمد. يُرسل إيصال السداد للدار لاعتماده، ولا يُعتد بأي سداد إلا بإيصال معتمد صادر من الدار.' },
    pricelock: { k: ['الاسعار تزيد', 'الاسعار ممكن تزيد', 'السعر ممكن يزيد', 'الاسعار بتزيد', 'الاسعار هتعلي', 'زياده في الاسعار', 'هتزودوا', 'تثبيت السعر', 'تثبيت الاسعار', 'السعر ثابت', 'الاسعار ثابته', 'الاسعار هتزيد', 'السعر هيزيد', 'هتغلي', 'زياده الاسعار', 'الاسعار هتتغير'], a: [34], s: 'الأسعار قابلة للتغيير حسب أوضاع السوق، و<b>لا تُثبَّت إلا باختيار الباكدج وسداد كامل قيمته خلال ٣٠ يوماً من تاريخ سداد المقدم</b>؛ وفيما عدا ذلك تُطبَّق الأسعار السارية وقت الاستكمال.' },
    discount: { k: ['خصم', 'خصومات', 'تخفيض', 'تفاوض', 'عرض خاص', 'اقل من كده', 'تنزلوا السعر', 'تنزل السعر', 'نزلي', 'سعر خاص', 'خصم للضباط'], a: [36, 35], s: 'أسعار القاعات والباكدجات والإضافات الواردة بالقوائم المعتمدة <b>نهائية وغير قابلة للتفاوض أو التخفيض</b>، ولا يُعتد بأي وعد أو اتفاق شفهي بخصم. والأسعار الواردة بالعقد شاملة الضرائب والرسوم المقررة ما لم يُنص على خلاف ذلك.' },
    late: { k: ['اتاخرت في القسط', 'تاخرت في القسط', 'تاخير القسط', 'اتاخرت', 'تاخرت', 'معرفتش ادفع', 'تاخير السداد', 'تاخير الدفع', 'اتاخرت في الدفع', 'تاخرت في الدفع', 'تاخرت في السداد', 'اتاخرت في السداد', 'غرامه', 'غرامات', 'متاخر في السداد', 'متاخر في الدفع'], a: [39, 49], s: 'عند التأخر في السداد عن المواعيد <b>يحق للدار فرض غرامة تأخير ٥٠ جنيهاً عن كل يوم تأخير</b>. وإذا تجاوز التأخير <b>٤٥ يوماً</b> يحق للدار إلغاء الحجز ويكون المقدم غير مسترد، ويُرد ما زاد عنه بشيك بنكي.' },
    cancel: { k: ['الغاء', 'الغي', 'الغيت', 'هلغي', 'كنسل', 'cancel', 'استرداد', 'استرجاع', 'ارجاع الفلوس', 'فلوسي', 'ترجعوا', 'هترجع', 'رجوع المبلغ', 'لو لغيت'], a: [46, 47, 48, 49, 41], s: 'طلب الإلغاء يُقدَّم <b>كتابةً</b> على النموذج المعتمد (لا يُعتد بالإلغاء الشفهي).<ul><li><b>مقدم الحجز غير مسترد</b>، إلا في حالة واحدة فقط: إعادة حجز القاعة في نفس التاريخ لمتعاقد آخر.</li><li>يُرد إليكم ما سددتموه زيادةً على قيمة المقدم <b>بشيك بنكي</b> باسم من قام بالسداد، ولا تُرد أي مبالغ نقداً.</li></ul>' },
    postpone: {   k: ['تاجيل', 'اجل', 'ناجل', 'اغير ميعاد', 'تغيير ميعاد', 'نغير ميعاد', 'اغير معاد', 'نغير معاد', 'تغيير معاد', 'اغير التاريخ', 'نغير التاريخ', 'يتاجل', 'اجلنا', 'تغيير الميعاد', 'تغيير التاريخ', 'اغير الميعاد', 'اغير التاريخ', 'نغير الميعاد', 'تغيير معاد', 'اغير المعاد'], a: [51, 52, 53, 54], s: '<ul><li>التأجيل مسموح <b>مرة واحدة فقط</b>، بطلب كتابي قبل الموعد الأصلي بـ <b>٣٠ يوماً على الأقل</b>، بشرط توافر الموعد الجديد وموافقة الإدارة، و<b>ألا يتجاوز الموعد الجديد ٣ أشهر</b> من الموعد الأصلي.</li><li><b>الرسوم:</b> ٥٬٠٠٠ ج إذا كان الموعد الجديد في نفس الشهر، و١٠٬٠٠٠ ج إذا كان في شهر آخر، مع تحمل أي فروق أسعار (تغيّر الموسم أو الانتقال لنهاية الأسبوع أو العطلات).</li><li>طلب التأجيل قبل الحفل بأقل من ٣٠ يوماً يُعامل معاملة الإلغاء.</li></ul>' },
    modify: { k: ['تعديل الحجز', 'اعدل', 'تعديل المنيو', 'اغير المنيو', 'تغيير المنيو', 'اضيف خدمه', 'الغي خدمه', 'تعديل', 'اغير الباكدج'], a: [15, 55, 56, 57], s: '<ul><li><b>تعديل المنيو:</b> كتابةً قبل الحفل بـ ٧ أيام على الأقل، مع تحمل فروق الأسعار، ولا تُقبل تعديلات جوهرية بعد هذه المدة إلا بتقدير الإدارة.</li><li><b>إلغاء أو تعديل أو إضافة أي بند:</b> بإخطار كتابي قبل الحفل بـ ٤٨ ساعة على الأقل.</li><li>أي فرق لصالحك يُوجَّه إلى خدمات إضافية ولا يُسترد نقداً، وإلغاء خدمة ضمن الباكدج لا يترتب عليه بالضرورة خصم من قيمته.</li></ul>' },
    count: { k: ['ناس زياده', 'جه ناس', 'عدد زياده', 'زياده في العدد', 'العدد زياده', 'حضر عدد', 'جه عدد', 'ابلغ العدد', 'العدد النهائي', 'اكد العدد', 'تاكيد العدد', 'عدد المعازيم', 'زياده العدد', 'العدد زاد', 'العدد قل', 'نقص العدد', 'عدد اقل', 'جه عدد', 'حضروا اقل', 'حضروا اكتر', 'معازيم زياده'], a: [20, 21, 22, 23, 25], fn: countAns },
    duration: {  k: ['اتاخر ساعه', 'اتاخرنا', 'الفرح اتاخر', 'الحفل اتاخر', 'لو اتاخر', 'تاخير في الانتهاء', 'مده الحفل', 'كام ساعه', 'بتخلص', 'بيخلص', 'يخلص امتي', 'تخلص امتي', 'الحفل بيبدا', 'الفرح بيبدا', 'الحفل كام ساعه', 'الحفل بياخد', 'مده الفرح', 'وقت الحفل', 'الفرح كام ساعه', 'عدد الساعات', 'ساعات الحفل', 'بيخلص الساعه', 'لحد الساعه كام'], a: [27, 30, 31, 32], fn: durationAns },
    food: { k: ['اكل من بره', 'اكل من الخارج', 'اجيب اكل', 'نجيب اكل', 'تورته من بره', 'تورته من الخارج', 'نجيب تورته', 'اجيب تورته', 'حلويات من بره', 'مشروبات من بره', 'كيك من بره', 'اكل من برا', 'تورته من برا', 'نجيب حاجه من بره'], a: [3], fn: foodAns },
    banned: { k: ['العاب ناريه', 'شماريخ', 'صواريخ', 'بمب', 'سلاح', 'اسلحه', 'كحول', 'خمره', 'خمور', 'بيره', 'ممنوعات', 'الممنوع', 'المحظور', 'ممنوع ايه'], a: [3, 74], s: 'يُحظر إدخال أو حيازة أو استخدام <b>الأسلحة أو الألعاب النارية أو المواد القابلة للاشتعال أو المشروبات الكحولية</b> أو أي مواد محظورة قانوناً، ويُحظر استخدام الألعاب النارية وأي مؤثرات خطرة داخل الدار، وكذلك إدخال أطعمة أو مشروبات من خارج الدار. ومؤثرات الليزر والدخان تخضع لموافقة الإدارة المسبقة وإشرافها، ولها منعها.<p class="dmb-note">ترد عروض الشو فاير والفاير ورك بقوائم إضافات القاعات؛ يُرجى تأكيد إمكانية تقديمها مع فريق الحفلات.</p>' },
    smoking: { k: ['تدخين', 'سجاير', 'سجائر', 'شيشه', 'ادخن', 'التدخين'], a: [73], s: 'يُسمح بالتدخين في الأماكن المخصصة له فقط (إن وُجدت)، ويُحظر فيما عداها من أرجاء الدار.' },
    vendors: { k: ['من بره', 'من الخارج', 'من برا', 'مصور خارجي', 'مطرب', 'فنان', 'فرقه', 'مغني', 'ساوند من بره', 'دي جي من بره', 'ميكب من بره', 'كوافير من بره', 'مورد خارجي'], a: [67, 68, 69], fn: vendorsAns },
    guestlist: { k: ['كشف', 'كشف المدعوين', 'اسماء المعازيم', 'اسماء المدعوين', 'قايمه المعازيم', 'الدعوات', 'كروت الدعوه'], a: [72], s: 'يلتزم المتعاقد بتسليم الدار <b>كشفاً بأسماء المدعوين قبل الحفل بـ ٤٨ ساعة على الأقل</b>، وللدار تنظيم الدخول وفقاً له.' },
    photos: {  k: ['الصور هتوصل', 'استلام الصور', 'تتسلم', 'الصور امتي', 'الفيديو امتي', 'استلم الصور', 'استلم الفيديو', 'استلام الفيديو', 'الفيديو هيوصل', 'مده الاحتفاظ', 'ملفات التصوير', 'الصور الاصليه', 'امتي استلم', 'حقوق الصور', 'تنشروا صوري', 'تنزلوا صوري'], a: [64, 65], s: '<ul><li>يحتفظ مورد التصوير المعتمد لدى الدار بالصور الأصلية <b>٣ أشهر</b> وبالفيديو <b>شهراً واحداً</b> من تاريخ الحفل؛ يُرجى الاستلام وطلب النسخ أو التعديلات قبل انتهاء المدة.</li><li>حقوق صور وفيديو المناسبة كاملةً للمتعاقد، ولا تستخدمها الدار إلا بموافقته الكتابية.</li></ul>' },
    lost: { k: ['ضاع', 'ضاعت', 'نسيت', 'مفقودات', 'فقدت', 'اتسرق', 'حاجتي'], a: [83, 4], s: 'تُحفظ المفقودات المعثور عليها لدى الإدارة <b>٣٠ يوماً</b> من تاريخ الحفل، وتُسلَّم لصاحبها بعد إثبات ملكيته. والدار لا تتحمل مسؤولية فقدان أو تلف المتعلقات الشخصية داخل الدار.' },
    kids: { k: ['اطفال', 'الاطفال', 'عيال', 'العيال', 'ولاد صغيره', 'اطفال مسموح'], a: [4], s: 'اللائحة لا تمنع حضور الأطفال، ومسؤولية رعايتهم وسلامتهم طوال تواجدهم بالدار على ذويهم ومرافقيهم.' },
    complaint: { k: ['شكوي', 'شكاوي', 'اشتكي', 'مشكله حصلت', 'اعتراض'], a: [103, 104], s: '<ul><li><b>أثناء الحفل:</b> أي ملاحظة على القاعة أو الطعام أو الخدمة أو السويت أو التصوير والفقرات تُبلَّغ <b>فوراً</b> لإدارة الدار أثناء الحفل، ولا يُعتد بها بعد انتهائه.</li><li><b>الشكاوى الأخرى</b> (الحجز، المسائل المالية، رد المبالغ، التأمين، المفقودات…): تُقدَّم كتابةً على النموذج المعتمد بالدار خلال <b>٧ أيام</b>، ويُرد عليها كتابةً خلال <b>١٥ يوماً</b>.</li></ul>' },
    force: {  k: ['قوه قاهره', 'وفاه', 'توفي', 'اتوفي', 'اتوفت', 'حداد', 'حاله وفاه', 'ظرف طارئ', 'ظروف طارئه', 'وباء', 'كورونا', 'قرار حكومي', 'كارثه'], a: [99, 100, 102], s: 'القوة القاهرة في اللائحة هي: <b>القرار الحكومي، الكارثة الطبيعية، الوباء، أو وفاة أحد أقارب العروسين من الدرجة الأولى</b>. عندها يجوز باتفاق الطرفين <b>تأجيل الحفل دون رسوم</b> لأقرب موعد متاح خلال ٣ أشهر، بشرط الإخطار كتابةً خلال ٧ أيام من الواقعة.' },
    leftover: { k: ['الاكل الزياده', 'باقي الاكل', 'الاكل اللي يفضل', 'اخد الاكل', 'ناخد الاكل', 'تيك اواي', 'الاكل الفاضل', 'بواقي'], a: [19], s: 'من حقك اصطحاب ما تبقى من طعام حفلك، وتنتهي مسؤولية الدار عن سلامته بمجرد خروجه من الدار.' },
    docs: { k: ['بطاقه', 'رقم قومي', 'الرقم القومي', 'ورق مطلوب', 'المستندات', 'الاوراق', 'العقد', 'توقيع', 'استماره'], a: [6, 9, 11], s: 'للتعاقد: تقديم بياناتك كاملة وصحيحة <b>(الاسم – الرقم القومي – وسيلة الاتصال)</b>، والتوقيع على استمارة الحجز ورقياً أو إلكترونياً عبر نظام الدار، واللائحة جزء من الاستمارة. ولا يُعد الحجز مؤكداً إلا بعد سداد مقدم الحجز كاملاً وتوقيع الاستمارة.' },
    transfer: { k: ['اتنازل', 'تنازل', 'انقل الحجز', 'الحجز لحد تاني', 'اديه لحد', 'حواله الحجز'], a: [111], s: 'لا يجوز التنازل عن الحجز أو تحويله لشخص آخر إلا بموافقة الدار الكتابية المسبقة.' },
    tax: { k: ['ضريبه', 'ضرايب', 'ضرائب', 'خدمه ١٢', 'شامل الضريبه', 'القيمه المضافه', 'رسوم خدمه'], a: [35], s: 'جميع الأسعار الواردة بالعقد <b>شاملة كافة الضرائب والرسوم المقررة</b>، ما لم يُنص صراحةً على خلاف ذلك.' },
    candles: { k: ['شموع', 'شمع', 'لهب', 'ليزر مسموح', 'الدخان مسموح'], a: [75, 74], s: 'الشموع واللهب المكشوف لا تُستخدم إلا في نطاق آمن وبموافقة الإدارة المسبقة وتحت إشرافها، ومؤثرات الليزر والدخان كذلك تخضع لموافقة الإدارة وإشرافها.' },
    damage: { k: ['تلف', 'تلفيات', 'اتكسر', 'خساره'], a: [80, 44, 45], s: 'المتعاقد مسؤول عن أي تلفيات تلحق بممتلكات الدار منه أو من مدعويه أو الجهات الخارجية، وتُقدَّر بمحضر معاينة مشترك وتُخصم من التأمين، وإذا زادت عن التأمين يُسدَّد الفرق. وإذا لم تحضر المعاينة يُعتد بمحضر الدار.' },
    setup: { k: ['تركيب', 'التجهيز قبل', 'نجهز امتي', 'ندخل امتي', 'ميعاد التركيب', 'الفك'], a: [60], s: 'أعمال التركيب والتجهيز للجهات الخارجية تتم في المواعيد التي تحددها الإدارة قبل الحفل، ويُفك كل شيء ويُخرج فور انتهاء الحفل.' },
    privacy: { k: ['بياناتي', 'خصوصيه', 'سريه البيانات'], a: [96, 97], s: 'تُستخدم بياناتك لأغراض التعاقد والتشغيل وتنفيذ الحفل فقط، وتلتزم الدار بسريتها وعدم إفشائها لغير المختصين أو لغير الأغراض المتفق عليها إلا بحكم قضائي أو التزام قانوني.' },
    suite: { k: ['سويت العروسه', 'جناح العروس', 'غرفه العروسه', 'اوضه العروسه', 'اوضه لبس', 'تجهيز العروسه', 'سويت', 'ميكب العروسه', 'تحضيرات', 'day use'], a: [61], fn: suiteAns },
    disputes: { k: ['قضيه', 'محكمه', 'محاكم', 'نزاع', 'قانوني'], a: [106, 107, 108], s: 'أي خلاف يُعرض أولاً على إدارة الدار كتابةً للتسوية الودية خلال ١٥ يوماً، ثم يجوز اللجوء للقضاء؛ ويخضع العقد للقانون المدني المصري، وتختص محاكم مدينة القاهرة.' }
  };
  function ruleTopic(t) {
    let best = null, bl = 0;
    for (const [id, tp] of Object.entries(TOPICS)) for (const k of tp.k) { const w = norm(k).trim(); if (w.length > bl && new RegExp(' (?:و|ف|ب|ل|ال|وال|بال|لل|ه|هن|هت|ن|ي|ت|ا|بت|بي|بن)?' + reEsc(w)).test(t)) { best = id; bl = w.length; } }
    if (best === 'suite' && has(t, [' سعر', ' بكام', ' اسعار', ' اضافي', ' زياده'])) return null;
    if (best === 'vendors' && !new RegExp(' ' + PRE + '(?:' + [' مصور', ' مطرب', ' فنان', ' فرقه', ' مغني', ' ساوند', ' دي جي', ' ميك', ' كوافير', ' هير', ' مورد', ' ديكور', ' منظم', ' بلانر', ' ماذون', ' مصوراتي', ' فوتوجرافر', ' اجهزه', ' معدات'].map(x => x.trim()).join('|') + ')').test(t)) return has(t, [' اكل', ' تورته', ' حلويات', ' مشروبات', ' كيك']) ? 'food' : null;
    if (best === 'docs' && has(t, [' بطاقه ائتمان', ' بطاقات الدفع'])) return 'methods';
    if (best === 'count' && !/ (?:ال)?(?:نهائي|اكد|تاكيد|زاد|قل|نقص|اقل|زياده|اكتر|ابلغ|حضر|ناس)/.test(t)) return null;
    return best;
  }
  function lawHTML(nums) {
    return `<details class="dmb-law"><summary>نص اللائحة (م ${nums.map(AD).join('، ')})</summary>${nums.map(n => { const a = K.rules[n - 1]; return `<p><b>م ${AD(a.n)} ${esc(a.t)}:</b> ${A(a.x)}</p>`; }).join('')}</details>`;
  }
  function topic(id) {
    if (id === 'howbook') return howBook();
    if (id === 'avail') return avail();
    const tp = TOPICS[id];
    if (tp.fn) return tp.fn(tp, LASTT);
    bot(`<div>${tp.s}</div>${lawHTML(tp.a)}${src('rules')}`, [{ t: 'قراءة اللائحة كاملة', go: 'rules' }]);
    chips(relatedChips(id));
  }
  function relatedChips(id) {
    const all = [['deposit', 'مقدم الحجز'], ['payment', 'جدول السداد'], ['methods', 'وسائل الدفع'], ['insurance', 'التأمين'], ['cancel', 'الإلغاء والاسترداد'], ['postpone', 'التأجيل'], ['duration', 'مدة الحفل'], ['vendors', 'مورد أو فنان من الخارج'], ['count', 'العدد النهائي']];
    return all.filter(x => x[0] !== id).slice(0, 5).map(x => ({ t: x[1], fn: () => topic(x[0]) }));
  }
  function depTable(filter) {
    const rows = K.deposit.filter(r => !filter || r[0] === filter);
    const unit = filter ? '' : `<tr><td>السويت <small>(سعر الوحدة كاملاً بدون مقدم)</small></td><td class="n">${money(4500)}</td><td class="n">${money(2000)}</td></tr><tr><td>الغرفة <small>(سعر الوحدة كاملاً بدون مقدم)</small></td><td class="n">${money(3500)}</td><td class="n">${money(1500)}</td></tr>`;
    return `<table class="dmb-t"><tr><th>القاعة / الوحدة</th><th>مقدم الحجز</th><th>التأمين</th></tr>${rows.map(r => `<tr><td>${r[0]}</td><td class="n">${money(r[1])}</td><td class="n">${money(r[2])}</td></tr>`).join('')}${unit}</table>`;
  }
  const hallLabel = () => ({ akhenaten: 'قاعة أخناتون', isis: 'قاعة إيزيس', lotus: 'قاعة اللوتس', mawadda: 'قاعة المودة والرحمة', marasem: 'قاعة المراسم', lulu: 'قاعة اللؤلؤة', roof: 'الروف توب', glass: 'الخيمة VIP' }[S.hall] || null);
  function depositAns(tp) {
    const f = hallLabel(); const useF = f && K.deposit.some(r => r[0] === f);
    bot(`<p>الحجز <b>لا يُعد مؤكداً إلا بعد سداد مقدم الحجز كاملاً وتوقيع استمارة التعاقد</b>، ولا يُحتفظ بالتاريخ قبل ذلك (المواعيد بأسبقية استيفاء الحجز).</p>${depTable(useF ? f : null)}<p class="dmb-note">مقدم الحجز غير مسترد، إلا في حالة إعادة حجز القاعة في نفس التاريخ لمتعاقد آخر. والتأمين يُسدَّد مع آخر دفعة، أو عند التعاقد إذا كان موعد الحفل بعد أقل من شهر.</p>${lawHTML([6, 8, 42, 46, 48])}${src('rules', 10)}`, [{ t: 'قراءة اللائحة كاملة', go: 'rules' }]);
    chips(useF ? [{ t: 'كل القاعات', fn: () => { const h = S.hall; S.hall = null; depositAns(tp); S.hall = h; } }, ...relatedChips('deposit')] : relatedChips('deposit'));
  }
  function insuranceAns(tp) {
    const f = hallLabel(); const useF = f && K.deposit.some(r => r[0] === f);
    bot(`<p>يُسدَّد <b>تأمين عن كل قاعة</b> (وكذلك عن السويت والغرفة) لضمان سلامة القاعة وممتلكات الدار، مع آخر دفعة من قيمة الحفل (أو عند التعاقد إذا كان موعد الحفل بعد أقل من شهر). ويُرد <b>بشيك بنكي خلال ٤٥ يوماً</b> من تاريخ الحفل بعد التأكد من سلامة القاعة، ويُخصم منه أي تلفيات أو مستحقات بمحضر معاينة.</p>${depTable(useF ? f : null)}${lawHTML(tp.a)}${src('rules', 10)}`, [{ t: 'قراءة اللائحة كاملة', go: 'rules' }]);
    chips(relatedChips('insurance'));
  }
  function durationAns(tp) {
    const hrs = [['akhenaten', 'قاعة أخناتون'], ['isis', 'قاعة إيزيس'], ['lotus', 'قاعة اللوتس (الأفراح)'], ['lotusk', 'عقد القران بقاعة اللوتس']].map(([s, n]) => { const a = K.addons.find(x => x.s === s && norm(x.n).trim() === 'ساعه اضافيه'); return a ? `<tr><td>${n}</td><td class="n">${ar(a.p)}</td></tr>` : ''; }).join('');
    bot(`<ul><li>مدة الحفل في كل القاعات <b>٤ ساعات</b>، عدا <b>كتب الكتاب بقاعتي اللوتس والمودة والرحمة: ساعة ونصف</b>.</li><li>المدة تُحسب من موعد البدء في العقد، والتأخر في البدء لا يمد موعد الانتهاء.</li><li>التمديد بموافقة الإدارة المسبقة وحسب توافر القاعة، ويُحسب <b>بالساعة الكاملة</b> (كسر الساعة يُحسب ساعة).</li><li>التأخر في إنهاء الحفل يُستحق عنه مقابل الساعة كاملة بمجرد تجاوز موعد الانتهاء، ويجوز خصمه من التأمين.</li></ul><p><b>سعر الساعة الإضافية حسب المنيوهات:</b></p><table class="dmb-t">${hrs}</table>${lawHTML(tp.a)}${src('rules')}`, [{ t: 'قراءة اللائحة كاملة', go: 'rules' }]);
    chips([{ t: 'مواعيد كتب الكتاب', fn: () => katb() }, ...relatedChips('duration').slice(0, 3)]);
  }
  function countAns(tp, q) {
    q = q || '';
    const extra = / (?:ال)?(?:زياده|اكتر|زاد|ناس)/.test(q);
    const less = / (?:اقل|قل|نقص)/.test(q);
    const lead = extra ? '<p><b>عند زيادة العدد عن المتفق عليه</b> تُحتسب كل وجبة إضافية بسعر الوجبة الإضافية للمنيو المختار، وتُسدَّد فوراً قبل السماح بدخول الزيادة، ولا يجوز تجاوز السعة القصوى للقاعة.</p>'
      : less ? '<p><b>العدد المكتوب في العقد هو الحد الأدنى المضمون</b>، وتُستحق قيمة الباكدج كاملة ولو حضر عدد أقل، ولا يترتب على نقص العدد أي تخفيض.</p>'
      : '<p>يلزم <b>تأكيد العدد النهائي للمدعوين كتابةً قبل الحفل بسبعة أيام على الأقل</b>.</p>';
    bot(`${lead}<ul>${extra ? '' : '<li>زيادة العدد تُحتسب بسعر الوجبة الإضافية وتُسدَّد قبل دخول الزيادة.</li>'}${less ? '' : '<li>العدد المكتوب في العقد حد أدنى مضمون تُستحق قيمته ولو حضر عدد أقل.</li>'}${/نهائي|اكد|ابلغ/.test(q) ? '' : '<li>يُؤكَّد العدد النهائي كتابةً قبل الحفل بـ ٧ أيام على الأقل.</li>'}</ul>${lawHTML([20, 21, 22, 23, 25, 26])}${src('rules', 6)}`, [{ t: 'قراءة اللائحة كاملة', go: 'rules' }]);
    chips([{ t: 'سعر الوجبة الإضافية', fn: () => extraMeal() }, ...relatedChips('count').slice(0, 3)]);
  }
  function foodAns(tp, q) {
    const cake = K.addons.find(a => a.s === 'birthday' && norm(a.n).includes('تورته من الخارج'));
    if (cake && (S.event === 'birthday' || / (?:عيد|ميلاد|بيرث)/.test(q || '')) && /تورت|كيك/.test(q || '')) {
      bot(`<p>يتضمن منيو أعياد الميلاد بند <b>«${A(cake.n)}» بقيمة ${ar(cake.p)}</b>، كما يتضمن بند «رسوم دخول بالونات من الخارج» ٥٠٠ ج.</p><p class="dmb-note">مع العلم بأن اللائحة تحظر إدخال الأطعمة من خارج الدار (م ٣) وتُقدَّم أحكامها عند التعارض (م ٢)؛ لذا يُرجى تأكيد ذلك مع فريق الحفلات قبل التعاقد.</p>${src('birthday', 3)}`);
      chips([{ t: 'أسعار التورت لدى الدار', q: 'اسعار التورت عيد ميلاد' }, { t: 'باكدجات أعياد الميلاد', fn: birthday }]);
      return;
    }
    bot(`<p>وفقاً لأحكام اللائحة <b>يُحظر إدخال أو تقديم أي أطعمة أو مشروبات من خارج الدار</b> حفاظاً على السلامة الغذائية.</p>${cake ? `<p class="dmb-note">يوجد في منيو أعياد الميلاد بند «${A(cake.n)}» بسعر ${ar(cake.p)}؛ يُرجى تأكيد السماح بها مع فريق الحفلات قبل التعاقد، لأن اللائحة تحظر إدخال الأطعمة من الخارج وتُقدَّم أحكامها عند التعارض (م ٢).</p>` : ''}${lawHTML([3])}${src('rules', 3)}`, [{ t: 'قراءة اللائحة كاملة', go: 'rules' }]);
    chips([{ t: 'إضافات البوفيه والتورت', q: 'اسعار التورت' }, ...relatedChips('food').slice(0, 3)]);
  }
  function vendorsAns(tp, q) {
    const sc = ctxScope() && K.scopes[ctxScope()] && ['akhenaten', 'isis', 'lotus', 'lotusk', 'mawadda', 'photo', 'birthday', 'special'].includes(ctxScope()) ? ctxScope() : 'akhenaten';
    const fees = K.addons.filter(a => a.s === sc && (a.g.startsWith('رسوم') || /رسوم/.test(a.n)));
    const c = q ? canon(q) : '';
    const pick = [['ميكب', 'ميكب'], ['هير', 'هير'], ['مصور', 'مصور'], ['ماذون', 'ماذون'], ['planner', 'planner'], ['بوز', 'بوز'], ['ساوند', 'معدات'], ['ديجي', 'معدات'], ['فنان', 'فنانين'], ['مطرب', 'فنانين'], ['فرقه', 'فنانين'], ['مغني', 'فنانين'], ['بالون', 'بالونات'], ['تورته', 'تورته']].filter(([w]) => c.includes(' ' + w + ' ') || c.includes(w));
    const hit = pick.length ? fees.filter(a => pick.some(([, f]) => canon(norm(a.n)).includes(f))) : [];
    const same = h => ['akhenaten', 'isis', 'lotus'].every(x => { const o = K.addons.find(a => a.s === x && norm(a.n) === norm(h.n)); return o && o.p === h.p; });
    const fee = a => /فنانين/.test(a.n) ? `نسبة ${ar(a.p).replace('%', '٪')} من أجر الفنان أو الفرقة، وفقاً لقائمة الفنانين المعتمدين بالدار` : `«${A(a.n)}» ${ar(a.p)}`;
    const lead = hit.length ? `<p><b>نعم، يُسمح بذلك</b> مقابل ${hit.map(fee).join('، و')}${hit.every(same) ? ' (بجميع القاعات)' : ' — ' + K.scopes[sc]}، بشرط الإخطار الكتابي قبل الحفل بـ ٤٨ ساعة على الأقل والحصول على موافقة الإدارة المسبقة.</p>` : `<p>يُسمح بالاستعانة بجهات من الخارج (فنانين، فرق، صوتيات، إضاءة، تصوير، ديكور، ميك أب) بشرط <b>الإخطار الكتابي قبل الحفل بـ ٤٨ ساعة على الأقل والحصول على موافقة الإدارة المسبقة</b>.</p>`;
    bot(`${lead}<ul><li>نسبة الدار <b>٢٠٪</b> من إجمالي أجر الفنان أو الفرقة، ورسوم دخول الأجهزة الصوتية الخارجية <b>٥٬٠٠٠ ج</b> بخلاف نسبة الـ ٢٠٪.</li><li>لا تتحمل الدار مسؤولية أعطال أجهزة الجهات الخارجية، ولا ملفات التصوير لدى المصورين من الخارج.</li></ul><details class="dmb-law"><summary>جميع رسوم الدخول — ${K.scopes[sc]}</summary><table class="dmb-t">${fees.map(a => `<tr><td>${A(a.n)}</td><td class="n">${ar(a.p)}</td></tr>`).join('')}</table></details>${lawHTML(tp.a)}${src(K.docOf[sc], fees[0] && fees[0].pg)}`, [{ t: 'قراءة اللائحة كاملة', go: 'rules' }]);
    chips(['akhenaten', 'isis', 'lotus'].filter(h => h !== sc).map(h => ({ t: 'الرسوم في ' + HALLNAME[h], fn: () => { S.hall = h; S.event = null; vendorsAns(tp, q); } })));
  }

  function suiteAns(tp) {
    const sc = K.halls[S.hall] ? S.hall : 'akhenaten';
    const L = K.addons.filter(a => a.s === sc && a.g === 'السويت والغرف');
    const D = K.addons.filter(a => a.s === sc && /سويت/.test(a.n) && a.g !== 'السويت والغرف');
    bot(`<p><b>نعم،</b> تشمل باكدجات الأفراح بقاعات أخناتون وإيزيس واللوتس <b>سويت DAY USE للعروسة من ١٢ م حتى ٧ م</b> دون مقابل إضافي.</p><div class="dmb-sec"><b>إضافات السويت والغرف – ${HALLNAME[sc]}:</b></div><table class="dmb-t">${[...L, ...D].map(a => `<tr><td>${A(a.n)}</td><td class="n">${ar(a.p)}</td></tr>`).join('')}</table><p class="dmb-note">يُسدَّد عن السويت الإضافي تأمين ٢٬٠٠٠ ج وعن الغرفة تأمين ١٬٥٠٠ ج يُرد وفق أحكام اللائحة (م ٤٢، ٤٣).</p>${src(sc, L[0].pg)}`);
    chips([{ t: 'السويت في عقد القران', fn: () => { S.event = 'katb'; S.hall = 'lotus'; knowledge(norm('سويت غرفه'), 'سويت'); } }, { t: 'رسوم الميكب والكوافير', q: 'رسوم ميكب وكوافير من بره' }]);
  }

  function howBook() {
    bot(`<p class="dmb-h">خطوات الحجز</p><ol><li>اختيار القاعة والمنيو المناسبين (يمكنني المساعدة وحساب التكلفة).</li><li>التواصل مع فريق الحفلات لتأكيد توافر التاريخ، أو احجز موعد معاينة (يومياً ١٠ ص – ١٠ م).</li><li>يُثبَّت الحجز بسداد <b>مقدم الحجز</b> كاملاً وتوقيع <b>استمارة التعاقد</b> (بالاسم والرقم القومي ووسيلة الاتصال).</li><li>خلال شهر من التعاقد: اختيار الباكدج وسداد ٥٠٪ على الأقل من قيمته.</li><li>باقي القيمة مع الإضافات والتأمين: قبل الحفل بشهر على الأكثر.</li></ol>${lawHTML([6, 9, 33])}`, [{ t: 'تجهيز طلب الحجز', fn: () => startBook(), cls: 'pri' }, { t: 'حجز موعد معاينة', fn: () => startVisit() }]);
    chips([{ t: 'مقدم الحجز لكل قاعة', fn: () => topic('deposit') }, { t: 'وسائل الدفع', fn: () => topic('methods') }, { t: 'الإلغاء والاسترداد', fn: () => topic('cancel') }]);
  }
  function avail() {
    bot(`<p>لا أستطيع الاطلاع على جدول الحجوزات؛ <b>توافر التاريخ يؤكده فريق الحفلات</b>. والمواعيد تُخصَّص بأسبقية استيفاء الحجز (سداد المقدم وتوقيع الاستمارة)، ولا يُحتفظ بأي تاريخ قبل ذلك.</p>${lawHTML([6, 8])}`, [waAct('دار المراسم لضباط الشرطة – أرغب في الاستفسار عن توافر موعد' + (S.date ? ' يوم ' + dateTxt(S.date) : '') + (S.hall ? ' في ' + HALLNAME[S.hall] : ''), 'اسأل عن التاريخ عبر واتساب'), { t: 'تجهيز طلب الحجز', fn: () => startBook() }]);
    chips(MAIN());
  }
  function lawSearch(t) {
    const toks = t.split(' ').filter(w => w.length >= 4 && !STOPW.has(w) && !STOPW.has(strip(w))).map(strip);
    if (!toks.length) return null;
    let best = null, bs = 0;
    for (const a of K.rules) { const x = norm(a.t + ' ' + a.x); let s = 0; toks.forEach(w => { if (x.includes(w)) s += norm(a.t).includes(w) ? 3 : 1; }); if (s > bs) { bs = s; best = a; } }
    if (!best || bs < 3) return null;
    return () => { bot(`<p>وفقاً للمادة (${AD(best.n)}) من لائحة تنظيم حجز وإقامة الحفلات — <b>${esc(best.t)}</b>:</p><p>${A(best.x)}</p>${src('rules', best.pg)}`, [{ t: 'قراءة اللائحة كاملة', go: 'rules' }]); chips(relatedChips('')); };
  }


  /* ---------------- booking & visit flows → WhatsApp ---------------- */
  function dateInput(cb, label) {
    const d = bot(`<p>${label}</p><div class="dmb-form"><input type="date" aria-label="${label}"><p class="dmb-hint">اضغطوا على الخانة لاختيار التاريخ من التقويم، ثم «تأكيد التاريخ».</p><button type="button" class="dmb-btn pri" disabled>تأكيد التاريخ</button></div>`);
    d.classList.add('dmb-wide');
    const inp = d.querySelector('input'), b = d.querySelector('button');
    const t = new Date(); inp.min = ymd(t);
    inp.addEventListener('click', () => { try { inp.showPicker(); } catch (e) { } });
    inp.addEventListener('change', () => { b.disabled = !inp.value; if (inp.value) { const [y, m, dd] = inp.value.split('-').map(Number); b.textContent = 'تأكيد: ' + dateTxt(new Date(y, m - 1, dd)); } });
    setTimeout(() => d.scrollIntoView({ block: 'end', behavior: 'smooth' }), 50);
    b.addEventListener('click', () => { if (!inp.value) { inp.focus(); return; } const [y, m, dd] = inp.value.split('-').map(Number); const dt = new Date(y, m - 1, dd); addUser(dateTxt(dt)); b.disabled = true; inp.disabled = true; chips([]); think(() => cb(dt)); });
    return d;
  }
  function startBook() {
    const B = { event: S.event, hall: S.hall, count: S.count, date: S.date, name: '', menu: null };
    if (S.menu && K.halls[S.hall]) { const m = hallMenu(S.hall, S.menu); if (m) B.menu = m.name; }
    const next = () => {
      if (!B.event) {
        bot('<p class="dmb-h">طلب حجز</p><p>يُرجى اختيار نوع المناسبة:</p>');
        FLOW = { step: (raw, t, e) => { if (e.ev) { B.event = e.ev; FLOW = null; next(); return true; } FLOW = null; return false; } };
        chips(['wedding', 'engagement', 'katb', 'birthday', 'aqiqa', 'special', 'photo'].map(ev => ({ t: EVNAME[ev], fn: () => { B.event = ev; next(); } })));
        return;
      }
      if (!B.count && B.event !== 'photo') {
        bot('ما العدد المتوقع للمدعوين؟');
        FLOW = { wantCount: true, step: (raw, t, e) => { const n = e.count || findCount(t, true); if (!n) { bot('يُرجى كتابة العدد بالأرقام (مثال: ٢٠٠).'); return true; } B.count = n; FLOW = null; next(); return true; } };
        chips([{ t: 'لم أحدد بعد', fn: () => { B.count = -1; next(); } }]);
        return;
      }
      if (!B.hall) {
        const opts = hallOptions(B.event, B.count);
        bot('القاعة المفضلة:');
        FLOW = { step: (raw, t, e) => { if (e.halls.length) { B.hall = e.halls[0]; FLOW = null; next(); return true; } FLOW = null; return false; } };
        chips([...opts.map(h => ({ t: HALLNAME[h], fn: () => { B.hall = h; next(); } })), { t: 'لم أحدد بعد', fn: () => { B.hall = '-'; next(); } }]);
        return;
      }
      if (!B.date) {
        dateInput(dt => { B.date = dt; next(); }, 'التاريخ المطلوب:');
        chips([{ t: 'لم أحدد بعد', fn: () => { B.date = '-'; next(); } }]);
        return;
      }
      if (!B.name) {
        bot('الاسم الكريم:');
        FLOW = { step: raw => { if (/[?؟]/.test(raw) || raw.trim().split(/\s+/).length > 5) { FLOW = null; return false; } B.name = raw.trim().slice(0, 60); FLOW = null; next(); return true; } };
        input.focus();
        return;
      }
      FLOW = null;
      const L = ['دار المراسم لضباط الشرطة – طلب حجز / استفسار', '', 'الاسم: ' + B.name, 'المناسبة: ' + EVNAME[B.event], 'القاعة: ' + (B.hall && B.hall !== '-' ? HALLNAME[B.hall] : 'لم أحدد بعد')];
      if (B.menu) L.push('المنيو: ' + B.menu);
      if (B.date && B.date !== '-') L.push('التاريخ المطلوب: ' + dateTxt(B.date));
      if (B.count > 0) L.push('العدد المتوقع: ' + AD(B.count) + ' فرد');
      L.push('', '(تم التجهيز عبر مساعد دار المراسم الذكي)');
      const msg = L.join('\n');
      bot(`<p class="dmb-h">ملخص طلبك</p><p style="white-space:pre-line">${esc(L.slice(2, -2).join('\n'))}</p><p>بالضغط على الزر يُرسل الطلب لفريق الحفلات عبر واتساب، وسيتم التواصل معكم لتأكيد التوافر والتفاصيل.</p><p class="dmb-note">الحجز لا يُثبَّت إلا بسداد مقدم الحجز وتوقيع استمارة التعاقد.</p>`, [waAct(msg, 'إرسال الطلب عبر واتساب')]);
      chips(MAIN());
    };
    next();
  }
  function hallOptions(ev, n) {
    if (ev === 'katb') return ['mawadda', 'lotus'];
    if (ev === 'birthday') return ['lotus', 'glass', 'roof'];
    if (ev === 'aqiqa') return ['lotus'];
    if (ev === 'special') return ['lulu', 'lotus', 'isis', 'marasem', 'akhenaten'];
    if (ev === 'photo') return [];
    const all = ['lotus', 'isis', 'akhenaten'];
    if (!n || n < 0) return all;
    const f = all.filter(h => n >= K.halls[h].min && n <= K.halls[h].max);
    return f.length ? f : all;
  }
  const HRS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map(h => { const h12 = h > 12 ? h - 12 : h, p = h < 12 ? 'صباحاً' : (h < 17 ? 'ظهراً' : 'مساءً'); return `الساعة ${AD(h12)} ${h === 12 ? 'ظهراً' : p}`; });
  function startVisit() {
    const V = { name: '', date: S.date || null, time: '', hall: S.hall || null };
    const next = () => {
      if (!V.date) { dateInput(dt => { V.date = dt; next(); }, 'المعاينة يومياً من ١٠ صباحاً حتى ١٠ مساءً. اختاروا اليوم:'); return; }
      if (!V.time) {
        bot('الساعة المناسبة:');
        chips(HRS.map(h => ({ t: h.replace('الساعة ', ''), fn: () => { V.time = h; next(); } })));
        return;
      }
      if (!V.hall) {
        bot('القاعة المطلوب معاينتها:');
        chips([{ t: 'كل القاعات', fn: () => { V.hall = 'all'; next(); } }, ...['akhenaten', 'isis', 'lotus', 'mawadda', 'roof', 'glass', 'lulu', 'marasem'].map(h => ({ t: HALLNAME[h], fn: () => { V.hall = h; next(); } }))]);
        return;
      }
      if (!V.name) {
        bot('الاسم الكريم:');
        FLOW = { step: raw => { if (/[?؟]/.test(raw) || raw.trim().split(/\s+/).length > 5) { FLOW = null; return false; } V.name = raw.trim().slice(0, 60); FLOW = null; next(); return true; } };
        input.focus();
        return;
      }
      const msg = ['دار المراسم لضباط الشرطة – طلب موعد معاينة', '', 'الاسم: ' + V.name, 'اليوم: ' + dateTxt(V.date), 'الموعد: ' + V.time, 'القاعة: ' + (V.hall === 'all' ? 'كل القاعات' : HALLNAME[V.hall] || 'كل القاعات'), '', '(تم التجهيز عبر مساعد دار المراسم الذكي)'].join('\n');
      bot(`<p class="dmb-h">موعد المعاينة</p><p>${esc(V.name)} – ${dateTxt(V.date)} – ${V.time} – ${V.hall === 'all' ? 'كل القاعات' : HALLNAME[V.hall]}</p><p>بالضغط على الزر يُرسل الموعد لفريق الحفلات عبر واتساب لتأكيده.</p><p><b>العنوان:</b> ${ADDRESS}</p>`, [waAct(msg, 'تأكيد الموعد عبر واتساب'), { t: 'الموقع على الخريطة', href: MAP }]);
      chips(MAIN());
    };
    next();
  }

  // expose a tiny API for testing
  window.DMBot = { _search: q => search(norm(q)), open, respond: q => { if (!K) return; addUser(q); respond(q); }, norm, state: () => S, _ready: () => !!K };
})();
