
module.exports = app => {
      const cors = require("cors");

      var morgan = require('morgan');
      var multer = require('multer');
      var multipart = multer();
      const mailer = require('./nodemailer.conf');
      const util = require('./utils/email');
      const db = require('./queries');
      const p = require('./models/db');

      var bodyParser = require('body-parser');
      app.use(bodyParser.urlencoded({ extended: true }))
      app.use(bodyParser.json())
      /////////////

      var morgan = require('morgan');
      app.use(morgan('combined'));

      const whitelist = [
            "GuzzleHttp/7",
            "https://playground.amp.dev",
            "https://mail.google.com",
            "https://amp.gmail.dev",
            "http://localhost:3000",
            "http://localhost:3001",
            "https://compaign.test",
            "http://compaign.test",
            "https://amp.servicesbilling.com",
            "https://amp-api.servicesbilling.com",
            "https://dev-amp.servicesbilling.com",
            "https://dev-amp-api.servicesbilling.com"
      ];

      let resOrigin = "";

      const corsOptions = {
            origin: function (origin, callback) {
                  resOrigin = origin
                  console.log("origin", origin);
                  if (!origin) {
                        return callback(null, true);
                  }
                  if (whitelist.indexOf(origin) !== -1) {
                        return callback(null, true);
                  } else {
                        return callback(new Error("Origin not in whitelist"));
                  }
            }
      };

      app.use(cors(corsOptions));
      app.use((req, res, next) => {
            // console.error(res)
            res.set("AMP-Access-Control-Allow-Source-Origin", mailer.from_email); //I've changed this to my sender email address when testing from Gmail
            res.set("From", mailer.from_email); //I've changed this to my sender email address when testing from Gmail
            res.set("Return-Path", mailer.from_email); //I've changed this to my sender email address when testing from Gmail
            res.set("Access-Control-Expose-Headers", "AMP-Access-Control-Allow-Source-Origin");
            res.set("Content-Type", 'text/x-amp-html');
            next();
      });
      var router = require("express").Router();
      router.get('/setemail/:id', function (req, res) {

            // return res.json(email);
            const nodemailer = require('nodemailer');
            // const amp = require('nodemailer-amp');

            // create reusable transporter object using the default SMTP transport
            db.sendFollowUp3(req, req.params.id).then((d) => {
                  res.setHeader('Content-Type', 'text/html');
                  //Outlook
                  const ampEmail3 = d.rows[0].outlook_email_data;
                  // console.log(ampEmail3); return false;
                  let transporter = mailer.transporterLive;

                  ampEmail3.from = util.replace(ampEmail3.from, '!!MAIL_FROM_NAME!!', mailer.from_name);
                  ampEmail3.from = util.replace(ampEmail3.from, '!!MAIL_FROM_EMAIL!!', mailer.from_email2);
                  ampEmail3.html = util.replace(ampEmail3.html, '!!MAIL_LIVE_ORIGNATOR!!', mailer.originator);
                  ampEmail3.html = util.replace(ampEmail3.html, '!!contact_id!!', 1);
                  ampEmail3.html = util.replace(ampEmail3.html, '!!contact_id!!', 1);
                  ampEmail3.html = util.replace(ampEmail3.html, '!!contact_id!!', 1);
                  // return res.send(ampEmail3.html);
                  // console.log(ampEmail3); return false;
                  let ampEmailO = {
                        to: 'shafqat_jani@hotmail.com,AndreyMaslov@MasDyne.onmicrosoft.com,DanielAndrews@MasDyne.onmicrosoft.com ',
                        subject: 'Example AMP email',
                        html: ampEmail3.html,
                        text: 'This is a plain text version of the email.'
                  };
                  // console.log(ampEmailO);
                  // return false;

                  transporter.sendMail(ampEmailO, (error, info) => {
                        if (error) {
                              console.log(error);
                        } else {
                              console.log('Email sent: ' + info.response);
                        }
                  });
                  return false;
                  //gmail
                  transporter = mailer.transporterGmail;

                  const ampEmail2 = d.rows[0].google_email_data;
                  let ampEmail = {
                        to: 'shafqatjan86@gmail.com,maslov.andrey@gmail.com',
                        subject: 'Example AMP email',
                        headers: {
                              'Return-Path': `<${mailer.from_email}>`
                        },
                        amp: ampEmail2.amp,
                        html: '<!doctype html><html><head><meta charset="utf-8"></head><body><p>This is a fallback HTML version of the email.</p></body></html>',
                        text: 'This is a plain text version of the email.'
                  };
                  console.log(ampEmail);

                  transporter.sendMail(ampEmail, (error, info) => {
                        if (error) {
                              console.log(error);
                        } else {
                              console.log('Email sent: ' + info.response);
                        }
                  });
                  // return res.send(d.rows[0].google_email_data.amp);
            });
            return false
            // set up the AMP email
            let ampEmail = {
                  to: 'shafqatjan86@gmail.com,maslov.andrey@gmail.com',
                  subject: 'Example AMP email',
                  amp: `<!doctype html>
                  <html ⚡4email>
                    <head>
                      <meta charset="utf-8">
                      <style amp4email-boilerplate>body{visibility:hidden}</style>
                      <script async src="https://cdn.ampproject.org/v0.js"></script>
                      <script async custom-element="amp-anim" src="https://cdn.ampproject.org/v0/amp-anim-0.1.js"></script>
                    </head>
                    <body>
                      <p>Image: <amp-img src="https://cldup.com/P0b1bUmEet.png" width="16" height="16"/></p>
                      <p>GIF (requires "amp-anim" script in header):<br/>
                        <amp-anim src="https://cldup.com/D72zpdwI-i.gif" width="500" height="350"/></p>

                        <amp-img src="https://preview.amp.dev/static/samples/img/amp.jpg" width="1" height="2" layout="responsive" alt="AMP"></amp-img>

                    </body>
                  </html>`,
                  html: '<!doctype html><html><head><meta charset="utf-8"></head><body><p>This is a fallback HTML version of the email.</p></body></html>',
                  text: 'This is a plain text version of the email.'
            };
            // res.setHeader('Content-Type', 'text/html');

            // res.send("<html> <head>server Response</head><body><h1> This page was render direcly from the server <p>Hello there welcome to my website</p></h1></body></html>");

            // return res.send(ampEmail.amp);
            // use the amp plugin to set the correct MIME types and add the fallback version
            // transporter.use('compile', amp());

            // send the email
            transporter.sendMail(ampEmail, (error, info) => {
                  if (error) {
                        console.log(error);
                  } else {
                        console.log('Email sent: ' + info.response);
                  }
            });

      });
      router.get('/send/actionable', function (req, res) {

            let mailOptions = {
                  from: process.env.MAIL_LIVE_USERNAME,
                  to: `${process.env.MAIL_LIVE_USERNAME2}`,
                  subject: "AMP Actionable " + Math.random(), // Subject line
                  text: `Kuch b`,
                  html: `   
    <html>
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <script type="application/adaptivecard+json">
      {
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "type": "AdaptiveCard",
        "version": "1.0",
        "originator": "${process.env.MAIL_LIVE_ORIGNATOR}",
        "body": [
            {
                "type": "Input.Text",
                "id":"lastName",
                "name":"lastName",
                "placeholder": "What is your last name?"
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
                              "url": "${mailer.api_url}",
                              "headers": [
                                  {
                                      "name": "Content-Type",
                                      "value": "application/x-www-form-urlencoded"
                                  }
                              ],
                              "body": "lastName={{lastName.value}}",
                              "isPrimary": true,
                              "style": "positive"
                          }
                      ]
                  }
              ],
              "spacing": "None"
          }
        ],
        "actions": [
            {
                "type": "Action.Submit",
                "title": "Action.Submit",
                "data": "hello"
            }
        ]
    }
      </script>
    </head>
      <body>
        Visit the <a href="https://nam12.safelinks.protection.outlook.com/?url=https%3A%2F%2Fdocs.microsoft.com%2Foutlook%2Factionable-messages&amp;data=05%7C01%7C%7C3dd4f953f57145f59f0608da96f1f6bc%7C84df9e7fe9f640afb435aaaaaaaaaaaa%7C1%7C0%7C637988263214464852%7CUnknown%7CTWFpbGZsb3d8eyJWIjoiMC4wLjAwMDAiLCJQIjoiV2luMzIiLCJBTiI6Ik1haWwiLCJXVCI6Mn0%3D%7C3000%7C%7C%7C&amp;sdata=zeCS2aayL9%2FRIAIVm6YuBgbioyr5gL9pJXuBqL6trIw%3D&amp;reserved=0" originalsrc="https://docs.microsoft.com/outlook/actionable-messages" shash="p+tC2cfgWlqkarcUWAwVsqKOmzabxFwVZza9iGj/SAb45Vt4Oik5rwJW02ATWqyR1tN4YUAw7SGCV9/G55MS88RiTE2ZV0rS5Oo/Bcpy3BcMl+fqtXE1FrrGKSHtaSQ0SlfmjaQcOdrMPTXwFM/rP7mTc2H8xP+jdv/fl15fuKU=">Outlook Dev Portal</a> to learn more about Actionable Messages. 
      </body>
    </html>
`
            };

            mailer.transporterLive.sendMail(mailOptions, (error, info) => {
                  if (error) {
                        console.log("Error" + error);
                        return res.status(401).json(error);
                  }
                  console.log('Message %s sent: %s', info.messageId, info.response);
                  res.status(200).json("Email sent");
            });
      });

      router.get('/send/amp', function (req, res) {
            let mailOptions = {
                  from: mailer.from_email,
                  headers: {
                        'Return-Path': '<' + mailer.from_email + '>'
                  },
                  to: "shafqatjan86@gmail.com", // list of receivers
                  subject: "AMP subject " + Math.random(), // Subject line
                  text: 'For clients with plaintext support only',
                  html: '<p>For clients that do not support AMP4EMAIL or amp content is not valid</p>',
                  // dkim: {
                  //       domainName: "servicesbilling.com",
                  //       keySelector: "2017",
                  //       privateKey: "-----BEGIN RSA PRIVATE KEY-----\nMIICXAIBAAKBgQCxev+d7lZUGx3qw9P/gjSD1SFiOy0iTQMzoElLUxw7h6bRPR7G\npYNFvmRHmtZiK5NCtMl+6sMxmpHMk1sLNMJKsyazH8+Jcaolq4Fa66eewJvdWpPL\nK1EPPHG/JYhVmVpfGIF25MUckTCj+869Yd4ZSkOVD8NIdIl6BWLuHEwfewIDAQAB\nAoGAUDjPh9xuSxACwtYHYkvBXwGcWGF1MjbrRo+h8Zk8fq//OD7PRW0U3BaGD1Ou\nqasWoiVDmsmUtzwtwPGuSm9rjkWShhL+lnpg9slbHsfvfiq8hGz2poRuw2UCvfJQ\nJfq6A2/eN1I9PwQKBjaDZuY00d17/Hp5XibM+learMyOXPkCQQDaKQwerI7VTgmT\nxxhen9a4qi9zrH2w6NuYfUsEZqJFn8XA2iRaglLnCEpB4V//QR/rM4fMdlhO6WJr\nfw+c9WeNAkEA0EOlfNTgsaQc5vqvNJhZ9O0HTqhtrWIlLQGSjG3XkFOCCT+TCh89\nxD9NIV2njb0lvISSQh4wPiQzQBMIh5/9JwJBAI7RwHV0Ui2iYPK1rGaGDXPnNhls\nGvzt9JTnsWy4JBOgfT27kYEPQGavLq3idY4NfG/l1EkuULGYaC4niHkgzyECQBWL\nqgcsDsLR85uBu7Z5PHU2QFdG3XHegXISg5K7ml14Bi/mv9OAP+eZlOUqxzbGpqzG\nGkt0zBDhtdufHHbLemkCQGXbG2vxLRUaC01pqFPtsmc43H/29pjXWxCMoseC1Mde\nLDO/x87Wm6ymynH+8lfG7S2rm4KbEpN8Chl3PABPEgw=\n-----END RSA PRIVATE KEY-----"
                  // },
                  amp: `
                  < !doctype html>
      <html ⚡4email data - css - strict>

      <head>
            <meta charset="utf-8">
            <script async src="https://cdn.ampproject.org/v0.js"></script>
            <script async custom-element="amp-form" src="https://cdn.ampproject.org/v0/amp-form-0.1.js"></script>
            <script async custom-template="amp-mustache"
                  src="https://cdn.ampproject.org/v0/amp-mustache-0.2.js"></script>
            <style amp4email-boilerplate>
                  body {
                        visibility: hidden
                  }
            </style>
            <style amp-custom>
                  body {
                        padding-bottom: 40px;
                  }

                  h1 {
                        margin: 1rem;
                  }
            </style>
      </head>

      <body>
            <form method="post"
                  action-xhr="https://playground.amp.dev/documentation/examples/api/submit-form-input-text-xhr">
                  <p>Form Submission with Page Update</p>
                  <div>
                        <input type="text" name="name" placeholder="Name..." required>
                        <input type="email" name="email" placeholder="Email..." required>
                  </div>
                  <input type="submit" value="Subscribe">
                  <div submit-success>
                        <template type="amp-mustache">
                              Success! Thanks {{name}} for trying the
                              <code>amp-form</code> demo! Try to insert the word "error" as a name input in the form to
                              see how
                              <code>amp-form</code> handles errors.
                        </template>
                  </div>
                  <div submit-error>
                        <template type="amp-mustache">
                              Error! Thanks {{name}} for trying the
                              <code>amp-form</code> demo with an error response.
                        </template>
                  </div>
                  <amp-img src="https://preview.amp.dev/static/samples/img/amp.jpg" width="1080" height="610"
                        layout="responsive" alt="AMP"></amp-img>

            </form>
      </body>

      </html>
                  `
            };

            mailer.transporterGmail.sendMail(mailOptions, (error, info) => {
                  if (error) {
                        console.log("Error" + error);
                        return res.status(401).json(error);
                  }
                  console.log('Message %s sent: %s', info.messageId, info.response);
                  res.status(200).json("Email sent");
            });
      });

      app.use('/', router);

};
