const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');

const TELEGRAM_BOT_TOKEN = '8767199626:AAFSU1s7-jIcXV7MkOpCoUOHbP66qS__8DI';
const TELEGRAM_CHAT_ID = '774478570';

// Configure email
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhook_secret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhook_secret);
  } catch (err) {
    return res.status(400).json({ error: `Webhook signature verification failed.` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const guestName = session.metadata.guest_name;
    const guestEmail = session.metadata.guest_email;
    const guestPhone = session.metadata.guest_phone;
    const tastingName = session.metadata.tasting_name;
    const bookingDate = session.metadata.booking_date;
    const bookingTime = session.metadata.booking_time;
    const partySize = session.metadata.party_size;
    const amount = session.amount_total / 100;

    // Send Telegram notification
    const telegramMessage = `✅ *PAGAMENTO CONFIRMADO!*

🍷 *${tastingName}*
💶 €${amount}

👤 *Guest:*
${guestName}
${guestEmail}
${guestPhone}

📅 *Data:* ${bookingDate}
🕐 *Hora:* ${bookingTime}
👥 *Pessoas:* ${partySize}`;

    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: telegramMessage,
          parse_mode: 'Markdown'
        })
      });
    } catch (err) {
      console.log('Telegram error:', err.message);
    }

    // Send confirmation email to guest
    const emailHTML = `
    <h2>Your Dogma Wine Tasting Reservation</h2>
    <p>Hi ${guestName},</p>
    <p>Your payment has been confirmed! Here are your booking details:</p>
    <hr>
    <p><strong>Tasting:</strong> ${tastingName}</p>
    <p><strong>Date:</strong> ${bookingDate}</p>
    <p><strong>Time:</strong> ${bookingTime}</p>
    <p><strong>Party Size:</strong> ${partySize} person${partySize > 1 ? 's' : ''}</p>
    <p><strong>Total:</strong> €${amount}</p>
    <hr>
    <p>We look forward to welcoming you!</p>
    <p>Dogma Wine Bar<br>Porto, Portugal</p>
    `;

    try {
      await emailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to: guestEmail,
        subject: `Dogma Wine Tasting - Reservation Confirmed`,
        html: emailHTML
      });
    } catch (err) {
      console.log('Email error:', err.message);
    }
  }

  res.status(200).json({ received: true });
};
