const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const TELEGRAM_BOT_TOKEN = '8767199626:AAFSU1s7-jIcXV7MkOpCoUOHbP66qS__8DI';
const TELEGRAM_CHAT_ID = '774478570';

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    tastingId,
    tastingName,
    price,
    guestName,
    guestEmail,
    guestPhone,
    bookingDate,
    bookingTime,
    partySize
  } = req.body;

  if (!tastingId || !guestEmail || !bookingDate || !bookingTime || !partySize) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const total = Math.round(price * partySize * 100); // Convert to cents

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: tastingName,
              description: `${partySize} person${partySize > 1 ? 's' : ''} | ${bookingDate} at ${bookingTime}`
            },
            unit_amount: Math.round(price * 100)
          },
          quantity: partySize
        }
      ],
      mode: 'payment',
      customer_email: guestEmail,
      custom_fields: [
        {
          key: 'booking_date',
          label: {
            type: 'custom',
            custom: 'Booking Date'
          },
          type: 'text',
          optional: false,
          text: {
            default_value: bookingDate
          }
        },
        {
          key: 'booking_time',
          label: {
            type: 'custom',
            custom: 'Booking Time'
          },
          type: 'text',
          optional: false,
          text: {
            default_value: bookingTime
          }
        },
        {
          key: 'party_size',
          label: {
            type: 'custom',
            custom: 'Party Size'
          },
          type: 'text',
          optional: false,
          text: {
            default_value: partySize.toString()
          }
        }
      ],
      success_url: `https://dogma-wine-booking.vercel.app/api/success?session_id={CHECKOUT_SESSION_ID}`,
cancel_url: 'https://dogmawinebar.com',
      metadata: {
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        tasting_name: tastingName,
        booking_date: bookingDate,
        booking_time: bookingTime,
        party_size: partySize
      }
    });
// Send Telegram notification
    const telegramMessage = `🍷 *NOVA RESERVA!*

*Tasting:* ${tastingName}
*Preço:* €${price} × ${partySize} pessoas

👤 *Guest:*
Nome: ${guestName}
Email: ${guestEmail}
Phone: ${guestPhone}

📅 *Detalhes:*
Data: ${bookingDate}
Hora: ${bookingTime}
Pessoas: ${partySize}`;

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
      console.log('Telegram notification error (non-blocking):', err.message);
    }
    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
};
