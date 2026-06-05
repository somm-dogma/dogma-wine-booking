const RESOS_API_KEY = process.env.RESOS_API_KEY;

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { date, time, partySize } = req.body;

  if (!date || !time || !partySize) {
    return res.status(400).json({ error: 'Missing date, time, or partySize' });
  }

  try {
    const auth = Buffer.from(`${RESOS_API_KEY}:`).toString('base64');
    
    // Build ISO datetime strings
    const fromDateTime = `${date}T${time}:00`;
    const toDateTime = `${date}T${time}:59`;

    const url = `https://api.resos.com/v1/bookingFlow/availableTables?people=${partySize}&fromDateTime=${encodeURIComponent(fromDateTime)}&toDateTime=${encodeURIComponent(toDateTime)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('ResOS error:', response.status);
      return res.status(500).json({ error: 'Could not fetch availability' });
    }

    const data = await response.json();
    
    return res.status(200).json({
      available: data || [],
      message: data?.length > 0 ? 'Tables available' : 'No tables available'
    });

  } catch (err) {
    console.error('Availability error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
