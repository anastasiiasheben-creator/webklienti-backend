require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const reviews = [
  { author: 'Marek Novák', company: 'Novák & syn s.r.o.', text: 'Vynikajúca práca! Web bol hotový za 5 dní a presne podľa našich predstáv. Odporúčam každému.', rating: 5 },
  { author: 'Jana Kováčová', company: 'Kaderníctvo Jana', text: 'Konečne mám pekný web! Komunikácia bola super, cena výborná. Zákazníci mi hovoria, že web vyzerá profesionálne.', rating: 5 },
  { author: 'Peter Horváth', company: 'AutoServis Horváth', text: 'Rýchlo, spoľahlivo a za rozumnú cenu. Určite budem spolupracovať aj pri ďalších projektoch.', rating: 5 },
];

app.get('/api/reviews', (req, res) => res.json(reviews));

app.post('/api/orders', async (req, res) => {
  const { name, email, phone, package: pkg, message } = req.body;
  if (!name || !email || !pkg) return res.status(400).json({ error: 'Vyplňte všetky povinné polia' });

  try {
    await transporter.sendMail({
      from: '"Web Klienti" <info@webklienti.com>',
      to: 'info@webklienti.com',
      subject: `🆕 Nová objednávka — ${pkg}`,
      html: `<h2>Nová objednávka</h2>
        <p><b>Meno:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Telefón:</b> ${phone || '—'}</p>
        <p><b>Balík:</b> ${pkg}</p>
        <p><b>Správa:</b> ${message || '—'}</p>`,
    });
    await transporter.sendMail({
      from: '"Web Klienti" <info@webklienti.com>',
      to: email,
      subject: '✅ Objednávka prijatá',
      html: `<h2>Ďakujeme, ${name}!</h2>
        <p>Vaša objednávka bola prijatá.</p>
        <p>Balík: <b>${pkg}</b></p>
        <p>Ozveme sa vám do 24 hodín.</p>`,
    });
  } catch (err) {
    console.error('Email error:', err.message);
  }

  res.json({ success: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Server beží na porte ${PORT}`));
