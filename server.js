require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');

const app = express();
app.use(cors());
app.use(express.json());

const resend = new Resend(process.env.RESEND_API_KEY);

app.post('/api/orders', async (req, res) => {
  const { name, email, phone, package: pkg, message } = req.body;
  if (!name || !email || !pkg) return res.status(400).json({ error: 'Vyplňte všetky povinné polia' });
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'anastasiia.sheben@gmail.com',
      subject: `🆕 Nová objednávka — ${pkg}`,
      html: `<h2>Nová objednávka</h2>
        <p><b>Meno:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Telefón:</b> ${phone || '—'}</p>
        <p><b>Balík:</b> ${pkg}</p>
        <p><b>Správa:</b> ${message || '—'}</p>`,
    });
    await resend.emails.send({
      from: 'onboarding@resend.dev',
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
