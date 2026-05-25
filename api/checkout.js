const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
          key: 'guest_name',
          label: {
            type: 'custom',
            custom: 'Guest Name'
          },
          type: 'text',
          optional: false,
          text: {
            default_value: guestName
          }
        },
        {
          key: 'guest_phone',
          label: {
            type: 'custom',
            custom: 'Phone'
          },
          type: 'text',
          optional: false,
          text: {
            default_value: guestPhone
          }
        },
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
      success_url: `${process.env.DOMAIN}/success`,
      cancel_url: `${process.env.DOMAIN}/cancel`,
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

    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
};
