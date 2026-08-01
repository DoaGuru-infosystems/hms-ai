const cron = require('node-cron');
const { getMasterPool } = require('../config/masterDb');
const { generateInvoice } = require('../services/billingService');
const { sendNotification, processScheduledNotifications } = require('../services/notificationService');

const initCronJobs = () => {
  // Process Scheduled Notifications every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log("Running Scheduled Notifications Cron Job...");
    await processScheduledNotifications();
  });
  // Run every day at 01:00 AM
  cron.schedule('0 1 * * *', async () => {
    console.log("Running Daily Billing & Reminder Cron Job...");
    const masterPool = getMasterPool();

    try {
      // 1. GENERATE INVOICES
      // Find hospitals that need a new invoice (e.g., it's been exactly 1 month since their last invoice, or they have NO invoices and just started)
      const [subscriptions] = await masterPool.query(`
        SELECT h.id, s.start_date 
        FROM hospitals h 
        JOIN subscriptions s ON h.id = s.hospital_id 
        WHERE s.status = 'Active'
      `);

      for (const sub of subscriptions) {
        // Find latest invoice date
        const [lastInvoices] = await masterPool.query(`SELECT created_at FROM invoices WHERE hospital_id = ? ORDER BY created_at DESC LIMIT 1`, [sub.id]);
        
        let shouldGenerate = false;
        const now = new Date();

        if (lastInvoices.length === 0) {
          // No invoice generated yet. Let's assume we bill on start_date
          const startDate = new Date(sub.start_date);
          if (now >= startDate) {
            shouldGenerate = true;
          }
        } else {
          // Bill every 30 days
          const lastInvoiceDate = new Date(lastInvoices[0].created_at);
          const diffTime = Math.abs(now - lastInvoiceDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays >= 30) {
            shouldGenerate = true;
          }
        }

        if (shouldGenerate) {
          try {
            await generateInvoice(sub.id);
            console.log(`Generated automated invoice for hospital ${sub.id}`);
          } catch (err) {
            console.error(`Failed to generate automated invoice for hospital ${sub.id}:`, err);
          }
        }
      }

      // 2. SEND AUTOMATED REMINDERS
      // Fetch all Pending/Overdue invoices
      const [pendingInvoices] = await masterPool.query(`
        SELECT id, hospital_id, amount, due_date, status, invoice_number 
        FROM invoices 
        WHERE status IN ('Pending', 'Overdue')
      `);

      for (const inv of pendingInvoices) {
        const dueDate = new Date(inv.due_date);
        const today = new Date();
        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let reminderType = null;
        let message = '';

        if (diffDays === 3 && inv.status === 'Pending') {
          reminderType = 'reminder';
          message = `Friendly reminder: Your invoice {invoice_number} for {amount_due} is due in 3 days on {due_date}.`;
        } else if (diffDays === 0 && inv.status === 'Pending') {
          reminderType = 'reminder';
          message = `Action required: Your invoice {invoice_number} for {amount_due} is due TODAY.`;
        } else if (diffDays < 0) {
          // Mark as Overdue if not already
          if (inv.status !== 'Overdue') {
            await masterPool.query(`UPDATE invoices SET status = 'Overdue' WHERE id = ?`, [inv.id]);
          }
          // Send reminder every 7 days when overdue
          if (Math.abs(diffDays) % 7 === 0) {
            reminderType = 'alert';
            message = `URGENT: Your invoice {invoice_number} for {amount_due} is OVERDUE since {due_date}. Please pay immediately to avoid service suspension.`;
          }
        }

        if (reminderType) {
          const formattedDate = dueDate.toLocaleDateString('en-IN');
          const finalMsg = message.replace('{invoice_number}', inv.invoice_number);
          
          await sendNotification(
            [inv.hospital_id], 
            reminderType, 
            ['email', 'whatsapp'], 
            finalMsg, 
            { amount_due: inv.amount, due_date: formattedDate }
          );
        }
      }

    } catch (error) {
      console.error("Error in billing cron job:", error);
    }
  });
};

module.exports = initCronJobs;
