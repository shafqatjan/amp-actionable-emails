const nodemailer = require('../nodemailer.conf');
const db = require('../models/db');
const _ = require("lodash");
const providerGmail = ["Google", "google.com", "gmail.com"];
const providerOutlook = ["Outlook", "outlook.com", "hotmail.com", "live.com"];

async function isValidToken(request) {
  const csrf = require('csrf-token');
  const { headers } = request;
  console.log("Validate ", headers)
  const token = headers.authorization;
  console.log(token, csrf.verify(nodemailer.api_key,token))
  if (!token) return false;

  return await csrf.verify(nodemailer.api_key,token);
}
const doEncodeBase65 = (str) => {
  return Buffer.from(str).toString('base64')
}

const doDecodeBase65 = (str) => {
  return Buffer.from(str, 'base64').toString('ascii')
}
// async function sendMail(req, user, userEmail, userName){
//   try{
//     const accessToken = await oAuth2Client.getAccessToken()
//     const transport = nodemailer.createTransport({
//       service: 'gmail',
//       secure: false,
//       auth: {
//         type: 'OAuth2',
//         user: process.env.USER_EMAIL,
//         clientId: process.env.CLIENT_ID,
//         clientSecret: process.env.CLIENT_SECRET,
//         refreshToken: process.env.REFRESH_TOKEN,
//         accessToken: accessToken,
//         },
//         tls:{
//           rejectUnauthorized: false
//         }
//       });
//       const mailOptions ={
//         from: `Email App <${process.env.USER_EMAIL}>`,
//         to: `${userName} <${userEmail}>`,        
//         subject: `New Registration ${userName}`,
//         html: verifyEmailTemplate(user, req),
//        }
//       const result = await transport.sendMail(mailOptions)
//       return result

//   }catch(error){
//     return error
//   }
// }
function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
}
async function getInitialVariables(q) {
  // console.log("Waiting " + q);
  data = [];
  try {
    const result = await db.pool.query(q)
    console.log("Waiting.....");
    return result;

  } catch (error) {
    console.log(error)
    return error;
  }
  console.log("Waiting Done");
}
async function sendMail(emailOptions, type) {
  // console.log("2-", type)
  try {
    const obj = (providerGmail.indexOf(type) != -1) ? nodemailer.transporterGmail : nodemailer.transporterLive;
    // console.log(obj)
    result = await obj.sendMail(emailOptions, (error, info) => {
      if (error) {
        console.log("Error" + error);
      }
      console.log('Message %s sent: %s', info.messageId, info.response);
    })
    return result

  } catch (error) {
    return error
  }
}
function replace(data, from, to) {
  // console.log(data, from, to, _.replace(data, from, to))
  return _.replace(data, from, to)
}
async function sendEmailGmail(response, field, contactId = null) {
  try {
    console.log("Starting sending gmail email", contactId);

    emailContent = `<!doctype html>
  <html ⚡4email data-css-strict>
  <head>
    <meta charset="utf-8">
    <script async src="https://cdn.ampproject.org/v0.js"></script>
    <script async custom-element="amp-form" src="https://cdn.ampproject.org/v0/amp-form-0.1.js"></script>
    <script async custom-template="amp-mustache" src="https://cdn.ampproject.org/v0/amp-mustache-0.2.js"></script>
    <style amp4email-boilerplate>body{visibility:hidden}</style>
    <style amp-custom>
      body { padding-bottom: 40px; font-family:'Arial'; }
      .email-container {
        margin: 10px auto;
        max-width:750px;  
        border: 2px solid black      
      }
      .email-container .header{
        background-color:#f5f5f5;
        padding:5px;    
        border-bottom: 1px solid black;
      }
      .email-container .subheading{
        padding:5px;  
        border-bottom: 1px solid black  
      }
      .email-container .desc{
        padding:5px;  
      }
      h1 {
        font-size:1.5rem;  
      }
      h2 {
        font-size:1.3rem
      }
      p {
        font-size:1rem;
      }

      .question { margin-bottom:10px; }
      .question h3 {}
      .options {}
      .tick {display:none}
      .option label { background-color:#dedede; padding:5px 10px; display:inline-block; margin-bottom:5px; }
      .option label:hover { background-color:#d6d6d6; }
      .option input {   opacity: 0; position: absolute; z-index: -1;  }
      .option input:checked + label { background-color:#0dcaf0; color:#FFF; }
      .option input:checked + label .tick { display:inline-block }
      .submit { border:0; background:#5555ff; color:#FFF; padding:8px 16px; cursor:pointer; border-radius:3px }
      .submit:hover { background:#6666ff; }
      .resp-error { background-color: #e74a3b; color:#FFF; padding: 10px; margin-top: 10px; background-size: cover; }
      .resp-success { background-color: #090; color:#FFF; padding: 10px; margin-top: 10px; background-size: cover; }
    </style>
  </head>
  <body>
  <div class="email-container">
  <form method="post"
    action-xhr="https://amp-api.servicesbilling.com/response/${emailId}/${field.id}">
    <div style="width:1px;height:1px">
    <amp-img
    alt=""
    src="https://amp-api.servicesbilling.com/opened/${emailId}/${field.id}"
    width="1"
    height="1"
    layout="responsive"
    style="opacity:0"
  >
  </amp-img>
  </div>
    <input type="hidden" name="email" value="${field.email}"></input>
    <input type="hidden" name="name" value="${field.name}"></input>

    <div class="header">    <h2>${emailHeading}</h2>    </div>
    <div class="subheading">    <p>${emailText}</p>     </div>
    
    <div class="desc"> 
      ${emailFields}
    
      <input type="submit" class="submit" value="Send">
      <div  submit-success ><template type="amp-mustache"><div class="resp-success">Success! Thanks ${field.name} for your response</div></template></div>
      <div  submit-error ><template type="amp-mustache"><div class="resp-error">Error! Thanks ${field.name} for your response, You have already submitted you response.</div></template></div>
      </div>
  </form>
  </div>
  </body>
    </html>`;
    // return response.status(200).send(emailContent);
    let mailOptions = {
      from: process.env.MAIL_GMAIL_USERNAME,
      to: field.email,//"shafqatjan86@gmail.com", // list of receivers
      subject: emailSubject,
      text: emailText,
      html: `<p>For clients that do not support AMP4EMAIL or amp content is not valid</p><img alt="" src="https://amp-api.servicesbilling.com/opened/${emailId}/${field.id}?has=error" width="1" height="1" layout="responsive" style="opacity:0" ></img>`,
      amp: `${emailContent}`
    };
    // return response.status(200).send(emailContent);
    const dbresult = await db.pool.query('SELECT * FROM sent_email_compaigns WHERE contact_id = $1 AND email_id = $2', [field.id, emailId], (error, setresults) => {
      if (error) {
        throw error
      }
      // console.log(setresults.rows)

      // response.status(200).json(setresults.rows)
      if (setresults.rowCount == 0) {
        nodemailer.transporterGmail.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log("Error" + error);
            db.pool.query('INSERT INTO sent_email_compaigns (contact_id, email_id, reason, created_at) VALUES ($1, $2, $3, $4)', [field.id, emailId, error, new Date()], (error, results) => { })
          }
          console.log('Message %s sent: %s', info.messageId, info.response);
          db.pool.query('INSERT INTO sent_email_compaigns (contact_id, email_id, created_at) VALUES ($1, $2, $3)', [field.id, emailId, new Date()], (error, results) => { })
        });
      }
    });

    console.log("End sending gmail email")
    return dbresult;

  } catch (error) {
    return error
  }
}
async function sendEmailOutlook(response, field, contactId = null) {
  try {
    console.log("Starting sending outlook email", contactId);
    // console.log(jsonFieldOptions);
    let mailOptions = {
      from: process.env.MAIL_LIVE_USERNAME,
      to: field.email, // list of receivers
      subject: emailSubject, // Subject line
      text: emailText,
      html: `
    <html>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <script type="application/adaptivecard+json">{
          "type": "AdaptiveCard",
          "originator": "${process.env.MAIL_LIVE_ORIGNATOR}",
          "body": [
              {
                  "type": "Container",
                  "style": "emphasis",
                  "items": [
                      {
                          "type": "TextBlock",
                          "text": "${emailHeading}",
                          "wrap": true
                      }
                  ],
                  "padding": "Default"
              },
              {
                  "type": "Container",
                  "id": "d96d06ec-2a33-c8cc-4698-430ae87f772f",
                  "padding": "Default",
                  "items": [
                      {
                          "type": "TextBlock",
                          "size": "Medium",
                          "weight": "Bolder",
                          "text": "${emailText}",
                          "wrap": true
                      }
                  ],
                  "spacing": "None",
                  "separator": true
              },
              {
                  "type": "Container",
                  "id": "885220a9-5ab1-95dd-5b66-20f42c452fa9",
                  "padding": "Default",
                  "items": [
                      {
                          "type": "TextBlock",
                          "weight": "Bolder",
                          "text": "${jsonFieldQues}",
                          "wrap": true
                      }
                  ],
                  "separator": true,
                  "spacing": "None"
              },
              {
                  "type": "Container",
                  "id": "10017c5a-5ee9-46c5-537a-bdd9ab61225c",
                  "padding": {
                      "top": "None",
                      "bottom": "Default",
                      "left": "Default",
                      "right": "Default"
                  },
                  "items": [
                      {
                          "type": "Input.ChoiceSet",
                          "id": "question_${questionId}",
                          "spacing": "None",
                          "placeholder": "${jsonFieldQues}",
                          "label": "${jsonFieldQues}",
                          "choices": [${jsonFieldOptions}],
                          "style": "expanded"
                      }
                  ],
                  "spacing": "None"
              },
              {
                  "type": "Container",
                  "id": "a27409f1-a48e-982f-8e26-594bdd1468e8",
                  "padding": "Default",
                  "items": [
                      {
                          "type": "ActionSet",
                          "horizontalAlignment": "Left",
                          "actions": [
                              {
                                  "type": "Action.Http",
                                  "title": "Submit",
                                  "method": "POST",
                                  "url": "https://amp-api.servicesbilling.com/response/${emailId}/${field.id}",
                                  "headers": [
                                      {
                                          "name": "Content-Type",
                                          "value": "application/x-www-form-urlencoded"
                                      }
                                  ],
                                  "body": "question_${questionId}={{question_${questionId}.value}}",
                                  "isPrimary": true,
                                  "style": "positive"
                              }
                          ]
                      }
                  ],
                  "spacing": "None"
              }
          ],
          "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
          "version": "1.0",
          "padding": "None"
      }
        </script>
      </head>
      <body>
      <div style="width:1px;height:1px">
      <img
        alt=""
        src="https://amp-api.servicesbilling.com/opened/${emailId}/${field.id}"
        width="1"
        height="1"
        layout="responsive"
        style="opacity:0"
      >
      </img>
    </div>
      Visit the <a href="https://docs.microsoft.com/outlook/actionable-messages">Outlook Dev Portal</a> to learn more about Actionable Messages.
      <img alt="" src="https://amp-api.servicesbilling.com/opened/${emailId}/${field.id}?has=error" width="1" height="1" layout="responsive" style="opacity:0" ></img>
      </body>
    </html>
  `
    };

    // return response.status(200).send(emailContent);
    const dbresult = db.pool.query('SELECT * FROM sent_email_compaigns WHERE contact_id = $1 AND email_id = $2', [field.id, emailId], (error, setresults) => {
      if (error) {
        throw error
      }
      // console.log(setresults.rows)

      // response.status(200).json(setresults.rows)
      if (setresults.rowCount == 0) {
        mailer.transporterLive.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log("Error" + error);
            return res.status(401).json(error);
          }
          console.log('Message %s sent: %s', info.messageId, info.response);
          db.pool.query('INSERT INTO sent_email_compaigns (contact_id, email_id, created_at) VALUES ($1, $2, $3)', [field.id, emailId, new Date()], (error, results) => { })

          res.status(200).json("Email sent");
        });
      }
    });
    console.log("End sending outlook email");
    return dbresult;
  } catch (error) {
    return error
  }
}

module.exports = {
  sendMail, sendEmailGmail, sendEmailOutlook, getInitialVariables, getRandomIntInclusive, replace, providerGmail, providerOutlook,
  isValidToken, doDecodeBase65, doEncodeBase65
}