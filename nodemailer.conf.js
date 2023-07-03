const nodemailer = require("nodemailer");

require('dotenv').config()
// const db = require('./models/db');
// db.pool.query('select * from smtp_setting ss order by id asc;', [], (error, results) => {
//       if (error) {
//             console.log("Error", error)
//       }
//       if (results.rowCount > 0) {

//       }
// })
const transporterGmail = nodemailer.createTransport({
      host: process.env.MAIL_GMAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: true,
      auth: {
            user: process.env.MAIL_GMAIL_USERNAME,
            pass: process.env.MAIL_GMAIL_PASSWORD,
      }
});

const transporterLive = nodemailer.createTransport({
      host: process.env.MAIL_LIVE_HOST,
      port: process.env.MAIL_LIVE_PORT,
      ssl: false,
      tls: true,
      auth: {
            user: process.env.MAIL_LIVE_USERNAME,
            pass: process.env.MAIL_LIVE_PASSWORD
      }
});

module.exports = {
      transporterGmail,
      transporterLive,
      api_url: process.env.API_URL,
      site_url: process.env.SITE_URL,
      from_email: process.env.MAIL_GMAIL_USERNAME,
      from_email2: process.env.MAIL_LIVE_USERNAME,
      from_name: process.env.MAIL_FROM_NAME,
      port: process.env.SERVER_PORT,
      originator: process.env.MAIL_LIVE_ORIGNATOR,
      api_key: process.env.APP_KEY
};