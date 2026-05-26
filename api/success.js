const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  
  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).send(`
      <html>
        <head><title>Error</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>❌ Invalid Session</h1>
          <p><a href="/bookatasting">Back to booking</a></p>
        </body>
      </html>
    `);
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    const guestName = session.metadata.guest_name;
    const tastingName = session.metadata.tasting_name;
    const bookingDate = session.metadata.booking_date;
    const bookingTime = session.metadata.booking_time;
    const partySize = session.metadata.party_size;
    const amount = session.amount_total / 100;

    return res.send(`
      <html>
        <head>
          <title>Reservation Confirmed</title>
          <style>
            body { font-family: Arial; background: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #2d5016; text-align: center; }
            .success-icon { font-size: 60px; text-align: center; margin-bottom: 20px; }
            .details { background: #f9f9f9; padding: 20px; border-left: 4px solid #8b0000; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-row:last-child { border-bottom: none; }
            .label { font-weight: bold; color: #333; }
            .value { color: #666; }
            .total { font-size: 24px; font-weight: bold; color: #8b0000; text-align: right; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #999; font-size: 14px; }
            a { color: #8b0000; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✅</div>
            <h1>Reservation Confirmed!</h1>
            
            <p style="text-align: center; color: #666;">Thank you, <strong>${guestName}</strong>. Your tasting has been booked.</p>
            
            <div class="details">
              <div class="detail-row">
                <span class="label">🍷 Tasting:</span>
                <span class="value">${tastingName}</span>
              </div>
              <div class="detail-row">
                <span class="label">📅 Date:</span>
                <span class="value">${bookingDate}</span>
              </div>
              <div class="detail-row">
                <span class="label">🕐 Time:</span>
                <span class="value">${bookingTime}</span>
              </div>
              <div class="detail-row">
                <span class="label">👥 Party Size:</span>
                <span class="value">${partySize} person${partySize > 1 ? 's' : ''}</span>
              </div>
              <div class="total">Total: €${amount}</div>
            </div>
            
            <p style="text-align: center; color: #666; margin: 30px 0;">
              A confirmation email has been sent to your email address.<br>
              We look forward to welcoming you at <strong>Dogma Wine Bar</strong>!
            </p>
            
            <div class="footer">
              <p>Dogma Wine Bar • Porto, Portugal</p>
              <p><a href="/bookatasting">Book another tasting</a></p>
            </div>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).send('<h1>Error retrieving session</h1>');
  }
};
