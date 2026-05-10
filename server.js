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
    // Письмо тебе (владельцу)
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
        </div>
      `,
    });
    // Письмо клиенту
    await resend.emails.send({
      from: 'Web Klienti <info@webklienti.com>',
      to: email,
      subject: '✅ Vaša objednávka bola prijatá',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <h2>Ďakujeme, ${name}! 🎉</h2>
          <p>Vaša objednávka bola úspešne prijatá. Tešíme sa na spoluprácu!</p>
          <div style="background: #f5f2eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><b>Vybraný balík:</b> ${pkg}</p>
          </div>
          <p>Ozveme sa vám <b>do 24 hodín</b> s ďalšími krokmi.</p>
          <p>
            V prípade otázok nás kontaktujte:<br>
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
