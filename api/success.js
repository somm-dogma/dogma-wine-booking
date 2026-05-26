const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  
  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).send(`
      <html>
        <head><title>Error</title></head>
        <body style="font-family: Georgia, serif; text-align: center; padding: 50px; background: #f5f0e8;">
          <h1>Invalid Session</h1>
          <p><a href="https://dogmawinebar.com/bookatasting" style="color: #5c1a1b;">Back to booking</a></p>
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
          <title>Reservation Confirmed | Dogma Wine Bar</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Georgia, 'Times New Roman', serif; 
              background: #f5f0e8; 
              min-height: 100vh;
              padding: 40px 20px;
              color: #2a2a2a;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: #fdfaf4; 
              padding: 60px 40px; 
              border: 1px solid #d4c5a9;
              box-shadow: 0 4px 20px rgba(92, 26, 27, 0.08);
            }
            .logo {
              text-align: center;
              font-size: 12px;
              letter-spacing: 4px;
              color: #5c1a1b;
              margin-bottom: 40px;
              text-transform: uppercase;
            }
            h1 { 
              color: #5c1a1b; 
              text-align: center; 
              font-size: 32px;
              font-weight: normal;
              margin-bottom: 10px;
              letter-spacing: 1px;
            }
            .subtitle {
              text-align: center;
              color: #8a6f4f;
              margin-bottom: 40px;
              font-style: italic;
              font-size: 16px;
            }
            .details { 
              background: #f5f0e8; 
              padding: 30px; 
              border-left: 3px solid #5c1a1b; 
              margin: 30px 0;
            }
            .detail-row { 
              display: flex; 
              justify-content: space-between; 
              padding: 12px 0; 
              border-bottom: 1px solid #d4c5a9;
              font-size: 15px;
            }
            .detail-row:last-of-type { border-bottom: none; }
            .label { font-weight: bold; color: #5c1a1b; }
            .value { color: #2a2a2a; text-align: right; }
            .total { 
              font-size: 22px; 
              font-weight: bold; 
              color: #5c1a1b; 
              text-align: right; 
              margin-top: 20px;
              padding-top: 20px;
              border-top: 2px solid #5c1a1b;
            }
            .footer { 
              text-align: center; 
              margin-top: 40px; 
              color: #8a6f4f; 
              font-size: 14px;
              line-height: 1.8;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #5c1a1b;
              color: #fdfaf4;
              text-decoration: none;
              margin-top: 20px;
              letter-spacing: 2px;
              font-size: 13px;
              text-transform: uppercase;
              transition: background 0.3s;
            }
            .button:hover { background: #7a2425; }
            .divider {
              width: 60px;
              height: 1px;
              background: #5c1a1b;
              margin: 20px auto;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">DOGMA WINE BAR</div>
            
            <h1>Reservation Confirmed</h1>
            <div class="divider"></div>
            <p class="subtitle">Thank you, ${guestName}</p>
            
            <div class="details">
              <div class="detail-row">
                <span class="label">Tasting</span>
                <span class="value">${tastingName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Date</span>
                <span class="value">${bookingDate}</span>
              </div>
              <div class="detail-row">
                <span class="label">Time</span>
                <span class="value">${bookingTime}</span>
              </div>
              <div class="detail-row">
                <span class="label">Party Size</span>
                <span class="value">${partySize} ${partySize > 1 ? 'persons' : 'person'}</span>
              </div>
              <div class="total">Total: €${amount}</div>
            </div>
            
            <p style="text-align: center; color: #8a6f4f; margin: 30px 0; line-height: 1.6;">
              We look forward to welcoming you<br>
              at <strong style="color: #5c1a1b;">Dogma Wine Bar</strong> in Porto.
            </p>
            
            <div style="text-align: center;">
              <a href="https://dogmawinebar.com/bookatasting" class="button">Book Another Tasting</a>
            </div>
            
            <div class="footer">
              <p>Dogma Wine Bar • Porto, Portugal</p>
              <p><a href="https://dogmawinebar.com" style="color: #5c1a1b; text-decoration: none;">dogmawinebar.com</a></p>
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
