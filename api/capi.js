export default async function handler(req, res) {
  // Solo permitimos requests POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { eventName, sourceUrl } = req.body;
    
    // Obtener las credenciales desde las variables de entorno de Vercel
    // Si no están, usamos las hardcodeadas temporalmente (aunque lo ideal es usar env vars)
    const PIXEL_ID = process.env.PIXEL_ID || "594728869711090";
    const CAPI_TOKEN = process.env.CAPI_TOKEN || "EAAJB7NRuFGUBRCtzCTpjyztkqjxTkntz5qihy9jBbqcG74oXg7kwof3KQKJXc4AEFuqewLi73LxOPL156qkjXxZBDqfztumXNLvGbQlR08iCKE6RX9Ogd0WkcJgjUeedxWXJyiF5TRyvZBmdZBX3msNnQeyQeS2XT0h0UrldsZCvaU7VmZAsobylZBvqT8jQZDZD";

    // Extraer la IP del cliente (Vercel la envía en estos headers)
    const clientIp = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    // Extraer cookies para fbp / fbc (Mejora la calidad del evento)
    const cookies = req.headers.cookie || '';
    let fbp = '';
    let fbc = '';
    
    if (cookies) {
      const matchFbp = cookies.match(/_fbp=([^;]*)/);
      if (matchFbp) fbp = matchFbp[1];
      
      const matchFbc = cookies.match(/_fbc=([^;]*)/);
      if (matchFbc) fbc = matchFbc[1];
    }

    const payload = {
      data: [
        {
          event_name: eventName || 'PageView',
          event_time: Math.floor(Date.now() / 1000),
          event_source_url: sourceUrl,
          action_source: "website",
          user_data: {
            client_ip_address: clientIp.split(',')[0], // Aseguramos que sea una IP limpia
            client_user_agent: userAgent,
            fbp: fbp || undefined,
            fbc: fbc || undefined
          }
        }
      ]
    };

    // Hacemos el POST al Graph API desde el servidor de Vercel
    const response = await fetch(`https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${CAPI_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error desde Meta:', data);
      return res.status(400).json({ success: false, error: data });
    }

    return res.status(200).json({ success: true, data });
    
  } catch (error) {
    console.error('Error interno en API:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
