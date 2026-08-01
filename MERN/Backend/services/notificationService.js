const nodemailer = require('nodemailer');
const axios = require('axios');
const { getMasterPool } = require('../config/masterDb');
require('dotenv').config();

// Initialize Nodemailer Transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Sends notifications via Email and/or WhatsApp
 * @param {Array<Number>} hospitalIds - Array of hospital IDs
 * @param {String} type - 'reminder' | 'broadcast' | 'alert'
 * @param {Array<String>} channels - Array containing 'email' and/or 'whatsapp'
 * @param {String} messageTemplate - The message content
 * @param {Object} data - Object containing replacement data for placeholders (optional)
 * @param {String} scheduledAt - ISO Date string if scheduling for later (optional)
 */
exports.sendNotification = async (hospitalIds, type, channels, messageTemplate, data = {}, scheduledAt = null) => {
  if (!hospitalIds || hospitalIds.length === 0) return;
  const masterPool = getMasterPool();

  try {
    // Fetch hospital details
    const [hospitals] = await masterPool.query(
      `SELECT id, hospital_name, admin_email, contact_number FROM hospitals WHERE id IN (?)`,
      [hospitalIds]
    );

    for (const hospital of hospitals) {
      // Replace placeholders in the message
      let finalMessage = messageTemplate
        .replace(/{hospital_name}/g, hospital.hospital_name || '')
        .replace(/{amount_due}/g, data.amount_due ? `Rs ${data.amount_due}` : '')
        .replace(/{due_date}/g, data.due_date || '');

      let sentStatus = 'sent';

      // 1. Send Email & WhatsApp ONLY IF NOT SCHEDULED
      if (!scheduledAt) {
        if (channels.includes('email') && hospital.admin_email) {
          try {
            await transporter.sendMail({
              from: `"HMS Super Admin" <${process.env.SMTP_USER}>`,
              to: hospital.admin_email,
              subject: type === 'reminder' ? 'Payment Reminder - HMS Subscription' : 'Important Broadcast from HMS',
              text: finalMessage,
              html: `<div style="font-family: sans-serif; padding: 20px; line-height: 1.5; color: #333;">${finalMessage.replace(/\n/g, '<br/>')}</div>`
            });
          } catch (err) {
            console.error(`Email sending failed for hospital ${hospital.id}:`, err);
            sentStatus = 'failed';
          }
        }

        if (channels.includes('whatsapp') && hospital.contact_number) {
          try {
            const waToken = process.env.WHATSAPP_API_KEY;
            const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

            if (waToken && waPhoneId) {
              let phoneStr = String(hospital.contact_number).replace(/[^0-9]/g, '');
              if (phoneStr.length === 10) phoneStr = '91' + phoneStr;

              await axios.post(
                `https://graph.facebook.com/v17.0/${waPhoneId}/messages`,
                {
                  messaging_product: "whatsapp",
                  recipient_type: "individual",
                  to: phoneStr,
                  type: "text",
                  text: { preview_url: false, body: finalMessage }
                },
                { headers: { 'Authorization': `Bearer ${waToken}`, 'Content-Type': 'application/json' } }
              );
            } else {
              sentStatus = 'failed';
            }
          } catch (err) {
            console.error(`WhatsApp failed for ${hospital.id}:`, err?.response?.data || err.message);
            sentStatus = 'failed';
          }
        }
      } else {
        // If scheduled, it's not sent yet
        sentStatus = 'scheduled';
      }

      // 3. Log Notification
      const channelStr = channels.length === 2 ? 'both' : channels[0];
      await masterPool.query(
        `INSERT INTO notification_logs (hospital_id, type, channel, message, status, scheduled_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [hospital.id, type, channelStr, finalMessage, sentStatus, scheduledAt ? new Date(scheduledAt) : null]
      );
    }
  } catch (error) {
    console.error("Error in sendNotification:", error);
  }
};

/**
 * Processes and sends scheduled notifications whose scheduled time has arrived.
 */
exports.processScheduledNotifications = async () => {
  const masterPool = getMasterPool();
  try {
    const [logs] = await masterPool.query(`
      SELECT n.*, h.admin_email, h.contact_number 
      FROM notification_logs n
      JOIN hospitals h ON n.hospital_id = h.id
      WHERE n.status = 'scheduled' AND n.scheduled_at <= NOW()
    `);

    for (const log of logs) {
      let sentStatus = 'sent';

      // Send Email
      if ((log.channel === 'email' || log.channel === 'both') && log.admin_email) {
        try {
          await transporter.sendMail({
            from: `"HMS Super Admin" <${process.env.SMTP_USER}>`,
            to: log.admin_email,
            subject: log.type === 'reminder' ? 'Payment Reminder - HMS Subscription' : 'Important Broadcast from HMS',
            text: log.message,
            html: `<div style="font-family: sans-serif; padding: 20px; line-height: 1.5; color: #333;">${log.message.replace(/\n/g, '<br/>')}</div>`
          });
        } catch (err) {
          console.error(`Scheduled Email sending failed for log ${log.id}:`, err);
          sentStatus = 'failed';
        }
      }

      // Send WhatsApp
      if ((log.channel === 'whatsapp' || log.channel === 'both') && log.contact_number) {
        try {
          const waToken = process.env.WHATSAPP_API_KEY;
          const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

          if (waToken && waPhoneId) {
            let phoneStr = String(log.contact_number).replace(/[^0-9]/g, '');
            if (phoneStr.length === 10) phoneStr = '91' + phoneStr;

            await axios.post(
              `https://graph.facebook.com/v17.0/${waPhoneId}/messages`,
              {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: phoneStr,
                type: "text",
                text: { preview_url: false, body: log.message }
              },
              { headers: { 'Authorization': `Bearer ${waToken}`, 'Content-Type': 'application/json' } }
            );
          } else {
            sentStatus = 'failed';
          }
        } catch (err) {
          console.error(`Scheduled WhatsApp failed for log ${log.id}:`, err?.response?.data || err.message);
          sentStatus = 'failed';
        }
      }

      // Update log status
      await masterPool.query(
        `UPDATE notification_logs SET status = ?, sent_at = NOW() WHERE id = ?`,
        [sentStatus, log.id]
      );
    }
  } catch (error) {
    console.error("Error in processScheduledNotifications:", error);
  }
};
