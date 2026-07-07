/* Forge IT & AI — site behavior */
(function () {
  'use strict';

  var doc = document;

  /* ── Theme ───────────────────────────────────── */
  var root = doc.documentElement;
  var themeToggle = doc.getElementById('themeToggle');

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem('forge-theme', theme); } catch (e) {}
  }
  (function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem('forge-theme'); } catch (e) {}
    if (saved === 'light' || saved === 'dark') { setTheme(saved); return; }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) setTheme('light');
  })();
  themeToggle.addEventListener('click', function () {
    setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* ── i18n ────────────────────────────────────── */
  var enDefaults = {};   // captured from the DOM on first load
  var currentLang = 'en';

  doc.querySelectorAll('[data-i18n]').forEach(function (el) {
    var key = el.getAttribute('data-i18n');
    if (!(key in enDefaults)) enDefaults[key] = el.innerHTML;
  });
  doc.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
    var key = 'ph:' + el.getAttribute('data-i18n-ph');
    if (!(key in enDefaults)) enDefaults[key] = el.getAttribute('placeholder') || '';
  });

  function applyLang(lang) {
    var dict = (window.I18N && window.I18N[lang]) || {};
    currentLang = lang;
    doc.documentElement.setAttribute('lang', lang);
    doc.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var val = lang === 'en' ? enDefaults[key] : (dict[key] != null ? dict[key] : enDefaults[key]);
      if (el.getAttribute('data-i18n-html') === '1' || /<br|<span/.test(val)) el.innerHTML = val;
      else el.textContent = stripTags(val);
    });
    doc.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-ph');
      var val = lang === 'en' ? enDefaults['ph:' + key] : (dict[key] != null ? dict[key] : enDefaults['ph:' + key]);
      el.setAttribute('placeholder', val);
    });
    var label = doc.getElementById('langLabel');
    if (label) label.textContent = lang.toUpperCase();
    doc.querySelectorAll('.lang-option').forEach(function (opt) {
      var active = opt.getAttribute('data-lang') === lang;
      opt.classList.toggle('active', active);
      opt.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    try { localStorage.setItem('forge-lang', lang); } catch (e) {}
  }
  function stripTags(html) {
    var tmp = doc.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent;
  }

  var langSelect = doc.getElementById('langSelect');
  var langBtn = doc.getElementById('langBtn');
  langBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    var open = langSelect.classList.toggle('open');
    langBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  doc.querySelectorAll('.lang-option').forEach(function (opt) {
    opt.addEventListener('click', function () {
      applyLang(opt.getAttribute('data-lang'));
      langSelect.classList.remove('open');
      langBtn.setAttribute('aria-expanded', 'false');
    });
  });
  doc.addEventListener('click', function () {
    langSelect.classList.remove('open');
    langBtn.setAttribute('aria-expanded', 'false');
  });

  (function initLang() {
    var saved = null;
    try { saved = localStorage.getItem('forge-lang'); } catch (e) {}
    if (saved && saved !== 'en' && window.I18N && window.I18N[saved]) applyLang(saved);
  })();

  /* ── Mobile menu ─────────────────────────────── */
  var hamburger = doc.getElementById('hamburgerBtn');
  var mobileMenu = doc.getElementById('mobileMenu');
  hamburger.addEventListener('click', function () {
    var open = mobileMenu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  mobileMenu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      mobileMenu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });

  /* ── Scroll reveal ───────────────────────────── */
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window) || reduceMotion) {
    doc.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('visible'); });
  } else {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.08 });
    doc.querySelectorAll('.reveal').forEach(function (el) { obs.observe(el); });
  }

  /* ── Active nav highlight ────────────────────── */
  var navLinks = Array.prototype.slice.call(doc.querySelectorAll('.nav-links a'));
  var sections = navLinks
    .map(function (a) { return doc.querySelector(a.getAttribute('href')); })
    .filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ── Service filters ─────────────────────────── */
  var filterBtns = doc.querySelectorAll('.filter-btn');
  var serviceCards = doc.querySelectorAll('#servicesGrid .service-card');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var f = btn.getAttribute('data-filter');
      serviceCards.forEach(function (card) {
        card.classList.toggle('hidden', f !== 'all' && card.getAttribute('data-cat') !== f);
      });
    });
  });

  /* ── Pricing billing toggle ──────────────────── */
  var billingToggle = doc.getElementById('billingToggle');
  var labelMonthly = doc.getElementById('labelMonthly');
  var labelAnnual = doc.getElementById('labelAnnual');
  billingToggle.addEventListener('click', function () {
    var annual = billingToggle.getAttribute('aria-checked') !== 'true';
    billingToggle.setAttribute('aria-checked', annual ? 'true' : 'false');
    labelMonthly.classList.toggle('active', !annual);
    labelAnnual.classList.toggle('active', annual);
    doc.querySelectorAll('.price-num').forEach(function (el) {
      el.textContent = el.getAttribute(annual ? 'data-annual' : 'data-monthly');
    });
  });

  /* ── Chat demo ───────────────────────────────── */
  var chatForm = doc.getElementById('chatForm');
  var chatInput = doc.getElementById('chatInput');
  var chatBody = doc.getElementById('chatDemo');

  var chatReplies = [
    { re: /price|pricing|cost|cheap|цен|цін|стоим|варт/i,
      en: "Managed IT starts at $110/user/mo, AI chatbots at $80/mo, and websites at $780 one-time — every service is $20 below market average. Want a detailed quote? Use the contact form below.",
      ru: "Управляемые IT — от $110/пользователя в месяц, ИИ-чатботы — от $80/мес, сайты — от $780 разово. Каждая услуга на $20 ниже рынка. Нужна детальная смета? Заполните форму ниже.",
      uk: "Керовані IT — від $110/користувача на місяць, ШІ-чатботи — від $80/міс, сайти — від $780 разово. Кожна послуга на $20 нижча за ринок. Потрібен детальний кошторис? Заповніть форму нижче." },
    { re: /secur|cmmc|nist|firewall|hack|защит|безопас|безпек|захист/i,
      en: "Security is our specialty: SentinelOne EDR, FortiGate hardening, network segmentation, and real CMMC/NIST 800-171 experience from live defense environments. A free audit is the best first step.",
      ru: "Безопасность — наша специализация: SentinelOne EDR, харденинг FortiGate, сегментация сети и реальный опыт CMMC/NIST 800-171 в оборонных средах. Лучший первый шаг — бесплатный аудит.",
      uk: "Безпека — наша спеціалізація: SentinelOne EDR, харденінг FortiGate, сегментація мережі та реальний досвід CMMC/NIST 800-171 в оборонних середовищах. Найкращий перший крок — безкоштовний аудит." },
    { re: /audit|аудит/i,
      en: "The free IT audit reviews your network, endpoints, M365, backups, and security posture — then you get a plain-English report. No sales pitch, no invoice. Book it via the contact form below!",
      ru: "Бесплатный аудит охватывает сеть, устройства, M365, бэкапы и безопасность — вы получите понятный отчёт. Без продаж и счетов. Запишитесь через форму ниже!",
      uk: "Безкоштовний аудит охоплює мережу, пристрої, M365, бекапи та безпеку — ви отримаєте зрозумілий звіт. Без продажів і рахунків. Запишіться через форму нижче!" },
    { re: /chatbot|bot|automat|agent|ai|ии|ші|чатбот|автоматиза/i,
      en: "I build custom AI chatbots (from $80/mo), workflow automation (from $380/mo), and full AI agents on your infrastructure. Most deployments go live within 2 weeks.",
      ru: "Я создаю кастомные ИИ-чатботы (от $80/мес), автоматизацию процессов (от $380/мес) и полноценных ИИ-агентов на вашей инфраструктуре. Большинство запусков — за 2 недели.",
      uk: "Я створюю кастомні ШІ-чатботи (від $80/міс), автоматизацію процесів (від $380/міс) і повноцінних ШІ-агентів на вашій інфраструктурі. Більшість запусків — за 2 тижні." },
    { re: /contact|call|phone|email|звон|телефон|пошт|почт|связ|зв'яз/i,
      en: "Call or text (503) 609-0554, or email nikitazimin@forgeitai.com. Business hours are Mon–Fri, 8 AM–6 PM PT — response in under 2 hours.",
      ru: "Позвоните или напишите SMS: (503) 609-0554, либо на email nikitazimin@forgeitai.com. Рабочие часы: пн–пт, 8:00–18:00 (PT), ответ — до 2 часов.",
      uk: "Зателефонуйте або надішліть SMS: (503) 609-0554, або на email nikitazimin@forgeitai.com. Робочі години: пн–пт, 8:00–18:00 (PT), відповідь — до 2 годин." }
  ];
  var chatFallback = {
    en: "Great question! I cover managed IT, cybersecurity, AI automation, and web development for businesses in Vancouver, WA & Portland (remote nationwide). Ask about pricing, security, or the free audit — or reach out via the contact form below.",
    ru: "Отличный вопрос! Я занимаюсь управляемыми IT, кибербезопасностью, ИИ-автоматизацией и веб-разработкой для бизнеса в Ванкувере (WA) и Портленде (удалённо — по всей стране). Спросите о ценах, безопасности или бесплатном аудите — либо напишите через форму ниже.",
    uk: "Чудове запитання! Я займаюся керованими IT, кібербезпекою, ШІ-автоматизацією та веб-розробкою для бізнесу у Ванкувері (WA) та Портленді (віддалено — по всій країні). Запитайте про ціни, безпеку чи безкоштовний аудит — або напишіть через форму нижче."
  };

  function addChatMsg(kind, text) {
    var div = doc.createElement('div');
    div.className = 'chat-msg ' + kind;
    if (kind === 'bot') {
      var name = doc.createElement('span');
      name.className = 'bot-name';
      name.textContent = 'Forge AI';
      div.appendChild(name);
      div.appendChild(doc.createTextNode(text));
    } else {
      div.textContent = text;
    }
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
    return div;
  }

  chatForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = chatInput.value.trim();
    if (!text) return;
    addChatMsg('user', text);
    chatInput.value = '';

    var typing = doc.createElement('div');
    typing.className = 'chat-msg bot typing';
    typing.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    chatBody.appendChild(typing);
    chatBody.scrollTop = chatBody.scrollHeight;

    var reply = chatFallback[currentLang] || chatFallback.en;
    for (var i = 0; i < chatReplies.length; i++) {
      if (chatReplies[i].re.test(text)) { reply = chatReplies[i][currentLang] || chatReplies[i].en; break; }
    }
    setTimeout(function () {
      typing.remove();
      addChatMsg('bot', reply);
    }, reduceMotion ? 50 : 900);
  });

  /* ── Contact form (Formspree) ────────────────── */
  var contactForm = doc.getElementById('contactForm');
  var submitBtn = doc.getElementById('submitBtn');
  var formSuccess = doc.getElementById('formSuccess');
  var formError = doc.getElementById('formError');
  var emailInput = doc.getElementById('f-email');
  var emailError = emailInput.parentElement.querySelector('.field-error');

  emailInput.addEventListener('blur', function () {
    var bad = emailInput.value !== '' && !emailInput.checkValidity();
    emailInput.setAttribute('aria-invalid', bad ? 'true' : 'false');
    emailError.hidden = !bad;
  });

  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    formSuccess.hidden = true;
    formError.hidden = true;

    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      var firstInvalid = contactForm.querySelector(':invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    submitBtn.disabled = true;
    fetch('https://formspree.io/f/xaqllrgn', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(contactForm)
    }).then(function (res) {
      if (res.ok) {
        contactForm.reset();
        formSuccess.hidden = false;
        formSuccess.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      } else {
        formError.hidden = false;
      }
    }).catch(function () {
      formError.hidden = false;
    }).finally(function () {
      submitBtn.disabled = false;
    });
  });

  /* ── Footer year ─────────────────────────────── */
  var yearEl = doc.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
