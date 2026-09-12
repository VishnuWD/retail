export class WhatsAppProvider {
  async sendInvoice({ to, invoiceNumber, customerName, amount, downloadUrl, mediaType = 'document', caption = '' }) {
    const token = process.env.WHATSAPP_API_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    const cleanTo = String(to || '').replace(/\D/g, '');

    console.log(`[WhatsApp] Dispatching invoice ${invoiceNumber} to ${cleanTo} for ${customerName}. Amount: ${amount}. Media: ${mediaType}`);

    // If Meta WhatsApp Cloud API credentials are provided in environment
    if (token && phoneId && cleanTo) {
      try {
        const payload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanTo,
          type: mediaType === 'image' ? 'image' : 'document'
        };

        if (mediaType === 'image') {
          payload.image = {
            link: downloadUrl,
            caption: caption || `Tax Invoice #${invoiceNumber} from Green Mart Kirana. Amount: ₹${amount}`
          };
        } else {
          payload.document = {
            link: downloadUrl,
            caption: caption || `Tax Invoice #${invoiceNumber} from Green Mart Kirana. Amount: ₹${amount}`,
            filename: `Invoice-${invoiceNumber}.pdf`
          };
        }

        const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
          console.warn('[WhatsApp Cloud API] Meta API response:', data);
          return {
            success: false,
            error: data.error?.message || 'Failed to dispatch via WhatsApp Cloud API',
            mode: 'CLOUD_API'
          };
        }

        return {
          success: true,
          messageId: data.messages?.[0]?.id || 'wa_msg_' + Date.now(),
          mode: 'CLOUD_API'
        };
      } catch (err) {
        console.error('[WhatsApp Cloud API] Network error:', err);
        return { success: false, error: err.message, mode: 'CLOUD_API' };
      }
    }

    // Development / Simulated mode
    return { 
      success: true, 
      messageId: 'wa_sim_' + Math.random().toString(36).substring(2, 10),
      mode: 'SIMULATED'
    };
  }

  async sendPaymentLink({ to, customerName, amount, paymentUrl, expiry }) {
    console.log(`[WhatsApp] Sending payment link to ${to} for ${amount}. Link: ${paymentUrl}`);
    return { success: true, messageId: 'wa_link_' + Math.random().toString(36).substring(2, 10) };
  }

  async sendReminder({ to, customerName, amountDue, dueDate }) {
    console.log(`[WhatsApp] Sending reminder to ${to}. Due: ${amountDue} on ${dueDate}`);
    return { success: true, messageId: 'wa_rem_' + Math.random().toString(36).substring(2, 10) };
  }
}

export class EmailProvider {
  async sendEmail({ to, subject, html, text }) {
    console.log(`[Email] Sending email to ${to} with subject "${subject}"`);
    return { success: true, messageId: 'em_msg_' + Math.random().toString(36).substring(2, 10) };
  }
}

export class SMSProvider {
  async sendSMS({ to, text }) {
    console.log(`[SMS] Sending SMS to ${to}: "${text}"`);
    return { success: true, messageId: 'sms_msg_' + Math.random().toString(36).substring(2, 10) };
  }
}

export class PushProvider {
  async sendNotification({ userId, title, body, data = {} }) {
    console.log(`[Push] Sending push notification to User ${userId}: "${title} - ${body}"`);
    return { success: true, notificationId: 'push_msg_' + Math.random().toString(36).substring(2, 10) };
  }
}
