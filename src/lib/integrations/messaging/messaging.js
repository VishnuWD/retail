export class WhatsAppProvider {
  async sendInvoice({ to, invoiceNumber, customerName, amount, downloadUrl }) {
    console.log(`[WhatsApp] Sending invoice ${invoiceNumber} to ${to} for ${customerName}. Amount: ${amount}`);
    return { success: true, messageId: 'wa_msg_' + Math.random().toString(36).substring(2, 10) };
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
