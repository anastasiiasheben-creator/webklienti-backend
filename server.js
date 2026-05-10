require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// ── База данных ──────────────────────────────────────────────
const db = new Database(path.join(__dirname, 'orders.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    package TEXT NOT NULL,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author TEXT NOT NULL,
    company TEXT,
    text TEXT NOT NULL,
    rating INTEGER DEFAULT 5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Добавим тестовые отзывы если таблица пустая
const reviewCount = db.prepare('SELECT COUNT(*) as c FROM reviews').get();
if (reviewCount.c === 0) {
  const insert = db.prepare('INSERT INTO reviews (author, company, text, rating) VALUES (?, ?, ?, ?)');
  insert.run('Marek Novák', 'Novák & syn s.r.o.', 'Vynikajúca práca! Web bol hotový za 5 dní a presne podľa našich predstáv. Odporúčam každému.', 5);
  insert.run('Jana Kováčová', 'Kaderníctvo Jana', 'Konečne mám pekný web! Komunikácia bola super, cena výborná. Zákazníci mi hovoria, že web vyzerá profesionálne.', 5);
  insert.run('Peter Horváth', 'AutoServis Horváth', 'Rýchlo, spoľahlivo a za rozumnú cenu. Určite budem spolupracovať aj pri ďalších projektoch.', 5);
}

// ── Email ────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── API Routes ───────────────────────────────────────────────

// POST /api/orders — новый заказ
app.post('/api/orders', async (req, res) => {
  const { name, email, phone, package: pkg, message } = req.body;

  if (!name || !email || !pkg) {
    return res.status(400).json({ error: 'Vyplňte všetky povinné polia' });
  }

  // Сохранить в БД
  const stmt = db.prepare('INSERT INTO orders (name, email, phone, package, message) VALUES (?, ?, ?, ?, ?)');
  const result = stmt.run(name, email, phone || '', pkg, message || '');

  // Отправить email
  try {
    await transporter.sendMail({
      from: '"Web Klienti" <info@webklienti.com>',
      to: 'info@webklienti.com',
      subject: `🆕 Nová objednávka #${result.lastInsertRowid} — ${pkg}`,
      html: `
        <h2>Nová objednávka z webu</h2>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">ID</td><td style="padding:8px;border:1px solid #ddd">#${result.lastInsertRowid}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Meno</td><td style="padding:8px;border:1px solid #ddd">${name}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #ddd">${email}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Telefón</td><td style="padding:8px;border:1px solid #ddd">${phone || '—'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Balík</td><td style="padding:8px;border:1px solid #ddd">${pkg}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Správa</td><td style="padding:8px;border:1px solid #ddd">${message || '—'}</td></tr>
        </table>
      `,
    });

    // Подтверждение клиенту
    await transporter.sendMail({
      from: '"Web Klienti" <info@webklienti.com>',
      to: email,
      subject: `✅ Objednávka prijatá — webstudio`,
      html: `
        <h2>Ďakujeme, ${name}!</h2>
        <p>Vaša objednávka <strong>#${result.lastInsertRowid}</strong> bola úspešne prijatá.</p>
        <p>Objednaný balík: <strong>${pkg}</strong></p>
        <p>Ozveme sa vám do 24 hodín.</p>
        <br>
        <p>S pozdravom,<br><strong>webstudio tím</strong></p>
      `,
    });
  } catch (emailErr) {
    console.error('Email error:', emailErr.message);
  }

  res.json({ success: true, id: result.lastInsertRowid });
});

// GET /api/orders — список заказов
app.get('/api/orders', (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  res.json(orders);
});

// GET /api/reviews — отзывы
app.get('/api/reviews', (req, res) => {
  const reviews = db.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all();
  res.json(reviews);
});

// ── Старт ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Server beží na porte ${PORT}`));