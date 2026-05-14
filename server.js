require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');

const app = express();
app.use(cors());
app.use(express.json());

// Redirect HTTP → HTTPS a www → non-www
app.use((req, res, next) => {
  const host = req.headers.host;
  const proto = req.headers['x-forwarded-proto'];

  if (proto && proto !== 'https') {
    return res.redirect(301, 'https://' + host.replace(/^www\./, '') + req.url);
  }

  if (host && host.startsWith('www.')) {
    return res.redirect(301, 'https://' + host.slice(4) + req.url);
  }

  next();
});

const resend = new Resend(process.env.RESEND_API_KEY);

const translations = {
  sk: {
    subject: '✅ Vaša objednávka bola prijatá',
    thanks: 'Ďakujeme',
    received: 'Vaša objednávka bola úspešne prijatá. Tešíme sa na spoluprácu!',
    package: 'Vybraný balík',
    reply: 'Ozveme sa vám <b>do 24 hodín</b> s ďalšími krokmi.',
    contact: 'V prípade otázok nás kontaktujte',
  },
  cz: {
    subject: '✅ Vaša objednávka byla přijata',
    thanks: 'Děkujeme',
    received: 'Vaše objednávka byla úspěšně přijata. Těšíme se na spolupráci!',
    package: 'Vybraný balíček',
    reply: 'Ozveme se vám <b>do 24 hodin</b> s dalšími kroky.',
    contact: 'V případě dotazů nás kontaktujte',
  },
  en: {
    subject: '✅ Your order has been received',
    thanks: 'Thank you',
    received: 'Your order has been successfully received. We look forward to working with you!',
    package: 'Selected plan',
    reply: 'We will get back to you <b>within 24 hours</b> with next steps.',
    contact: 'If you have any questions, contact us',
  },
};

app.post('/api/orders', async (req, res) => {
  const { name, email, phone, package: pkg, message, lang } = req.body;
  if (!name || !email || !pkg) return res.status(400).json({ error: 'Vyplňte všetky povinné polia' });

  const t = translations[lang] || translations.sk;

  try {
    await resend.emails.send({
      from: 'Web Klienti <info@webklienti.com>',
      to: 'anastasiia.sheben@gmail.com',
      subject: `🆕 Nová objednávka — ${pkg}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2>🆕 Nová objednávka</h2>
          <p><b>Meno:</b> ${name}</p>
          <p><b>Email:</b> ${email}</p>
          <p><b>Telefón:</b> ${phone || '—'}</p>
          <p><b>Balík:</b> ${pkg}</p>
          <p><b>Správa:</b> ${message || '—'}</p>
          <p><b>Jazyk:</b> ${lang || 'sk'}</p>
        </div>
      `,
    });
    await resend.emails.send({
      from: 'Web Klienti <info@webklienti.com>',
      to: email,
      subject: t.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <h2>${t.thanks}, ${name}! 🎉</h2>
          <p>${t.received}</p>
          <div style="background: #f5f2eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><b>${t.package}:</b> ${pkg}</p>
          </div>
          <p>${t.reply}</p>
          <p>
            ${t.contact}:<br>
            📧 info@webklienti.com<br>
            📞 +421 907 890 600
          </p>
          <p style="color: #888; font-size: 12px; margin-top: 40px;">Web Klienti · webklienti.com</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Email error:', err.message);
  }
  res.json({ success: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Server beží na porte ${PORT}`));
