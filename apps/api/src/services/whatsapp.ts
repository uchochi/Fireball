const API_VERSION = 'v18.0';

interface WhatsAppConfig {
  token: string;
  phoneNumberId: string;
}

function getConfig(): WhatsAppConfig {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    throw new Error('WhatsApp not configured');
  }
  return { token, phoneNumberId };
}

const BASE = `https://graph.facebook.com/${API_VERSION}`;

export async function sendImageStatus(
  to: string,
  imageUrl: string,
  caption?: string,
) {
  const { token, phoneNumberId } = getConfig();

  const res = await fetch(`${BASE}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'image',
      image: {
        link: imageUrl,
        caption: caption || '',
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp API error: ${err}`);
  }

  return res.json();
}

export async function uploadMedia(fileUrl: string) {
  const { token, phoneNumberId } = getConfig();

  // First download the file
  const fileRes = await fetch(fileUrl);
  const fileBuffer = await fileRes.arrayBuffer();

  // Upload to WhatsApp
  const formData = new FormData();
  formData.append('file', new Blob([fileBuffer], { type: 'image/jpeg' }), 'status.jpeg');
  formData.append('type', 'image/jpeg');
  formData.append('messaging_product', 'whatsapp');

  const res = await fetch(`${BASE}/${phoneNumberId}/media`, {
    method: 'POST',
    headers: {
          Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp media upload error: ${err}`);
  }

  return res.json();
}
