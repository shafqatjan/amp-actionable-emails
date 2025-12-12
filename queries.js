const db = require('./models/db');
const util = require('./utils/email');
const mailer = require('./nodemailer.conf');

var emailFields = '';
var jsonFieldQues = '';
var jsonFieldOptions = '';
var emailSubject = ``;
var emailHeading = ``;
var emailText = ``;
var emailTextAct = ``;
var emailContent = ``;
var doit = false;
var groupId = 0;
var emailId = 0;
var questionId = 0;
var optionIds = [];
var emailAlreadySent = [];
var emailImageAMP = ``;
var emailImageACT = ``;
const sendMainCompaignEmail2 = async (request, response) => {
    const { body, query, params, headers } = request;
    console.log("open ", JSON.stringify(body), JSON.stringify(query), JSON.stringify(params), headers);

    try {
        const q = `select c.group_id, g2.provider , es.* 
        from email_setups es 
        left join compaigns c on c.id = es.compaign_id 
        left join compaign_emails ce on ce.id = es.email_id 
        left join "groups" g2 on   g2.id = c.group_id 
        where c.id = ${params.id} and ce.is_main = 1 and c.group_id is not null;`;
        // console.log(q)
        const result = await db.pool.query(q)
        return result;

    } catch (error) {
        console.log(error)
        return error;
    }

}
const sentEmailExist = async (request, contact_id, email_id) => {
    const { body, query, params } = request;
    console.log("send email exist  ", JSON.stringify(body), JSON.stringify(query), JSON.stringify(params), contact_id, email_id);
    try {
        const result = await db.pool.query('SELECT * FROM sent_email_compaigns WHERE contact_id = $1 AND email_id = $2', [contact_id, email_id]);
        return result;
    } catch (error) {
        console.log(error)
        return error;
    }

}
const storeAndSend = async (contact, email_id, type, myEmailData2) => {
    console.log("store and send", contact.id, email_id, type, new Date())
    db.pool.query('INSERT INTO sent_email_compaigns (contact_id, email_id, created_at, email_data) VALUES ($1, $2, $3, $4)', [contact.id, email_id, new Date(), myEmailData2], (error, results) => {
        util.sendMail(myEmailData2, type);
    })

}
const sendFollowUp3 = async (request, whichFollowEmail) => {
    const { body, query, params } = request;
    console.log("open ", JSON.stringify(body), JSON.stringify(query), JSON.stringify(params));
    try {
        const q = `select es.* from email_setups es left join compaign_emails ce on ce.id = es.email_id where es.email_id = ${whichFollowEmail} ;`;

        const result = await db.pool.query(q)
        return result;

    } catch (error) {
        console.log(error)
        return error;
    }

}
const getContacts = async (request, group_id, contact_id = null) => {
    const { body, query, params } = request;
    console.log("get Contacts ", JSON.stringify(body), JSON.stringify(query), JSON.stringify(params));
    try {
        let q = `select * from contacts c where id in (select contact_id from group_contacts gc2 where 1=1 `;

        if (contact_id)
            q += ` AND c.id = ${contact_id}`;
        else
            q += ` AND group_id = ${group_id}`;

        q += `) order by id;`
        const result = await db.pool.query(q)
        return result;

    } catch (error) {
        console.log(error)
        return error;
    }

}
const sendMainCompaignEmail = async (request, response) => {
    const { body, query, params } = request;
    console.log(body, query, params);
    emailFields = '';
    emailSubject = ``;
    emailHeading = ``;
    emailText = ``;
    emailTextAct = ``;
    emailImageAMP = ``;
    emailImageACT = ``;
    emailContent = ``;
    doit = false;
    groupId = 0;
    emailId = 0;
    questionId = 0;
    optionIds = [];
    jsonFieldQues = '';
    jsonFieldOptions = '';
    const q = `select c.group_id, c2.name as course_name, c.id as compaig_id, ce.id as email_id, ceq.id as question_id, c.title  , ce.title as email, ce.heading ,
    ce.image , ce.subject , ce."text" , ceq.question,  ceq.type, ceq.required      
    from compaigns c     
    left join courses c2 on c2.id = c.course_id
    left join compaign_emails ce on ce.compaign_id = c.id    left join compaign_email_questions ceq on ceq.email_id = ce.id    
    left join compaign_email_question_options ceqo on ceqo.question_id = ceq.id    
    where c.id = ${params.id} and ce.is_main = 1   and (c.deleted_at is null and ce.deleted_at is null and ceq.deleted_at is null  and ceqo.deleted_at is null)      
    group by c2.id, c.id, ce.id , ceq.id  order by c.id asc;`
    setUpEmail(response, q);
}

const setUpEmail = async (response, query, contactId = null) => {
    jsonFieldQues = '';
    jsonFieldOptions = '';
    emailText = '';
    emailTextAct = '';
    await db.pool.query(query, (error, emails) => {
        if (error) {
            console.log(error)
            // return response.status(409).json(error.message)
        }
        if (emails.rows.length > 0) {

            emailId = emails.rows[0].email_id;
            // emailFields += `<input type="hidden" name="email_id" value="${emailId}"></input>`;
            emails.rows.forEach((row, e) => {
                groupId = `${row.group_id}`;
                emailSubject = `${row.subject}`;
                emailHeading = `${row.heading}`;
                emailText = ``;//`${row.text}`;
                emailTextAct = ``;
                const splitText = row.text.split('\r\n');

                if (splitText.length) {
                    splitText.forEach(t => {
                        emailText += `<p>${t}</p> `;
                        emailTextAct += `{
                            "type": "TextBlock",
                            "size": "Medium",
                            "text": "${t}",
                            "wrap": true
                        },`;
                    });
                }
                if (row.image) {
                    emailImageAMP = `<p><amp-img width="1" height="0.3" src="${mailer.site_url}/storage/img/${row.image}" layout="responsive" /></amp-img></p>`;
                    emailImageACT = ` {
                        "type": "Image",
                        "horizontalAlignment": "Center",
                        "url": "${mailer.site_url}/storage/img/${row.image}",
                    }`;
                }

                const isRequired = row.required ? 'required' : '';
                db.pool.query('SELECT * FROM compaign_email_question_options WHERE question_id = ' + row.question_id + '  and deleted_at is null ORDER by id asc', (error, results) => {
                    if (error) {
                        console.log(error)
                        // return response.status(409).json(error.message)
                    }
                    if (results.rowCount > 0) {
                        // emailFields += `<input type="hidden" name="question[${row.question_id}][q]" value="${row.question_id}"></input>`;

                        emailFields += `<div class="question"><h4>${row.question}</h4><div class="options">`;
                        jsonFieldQues = `${row.question}`;
                        results.rows.forEach(field => {
                            questionId = field.question_id;
                            optionIds.push(field.id)

                            emailFields += `<div class="option"><input id="option_${field.id}" ${isRequired} type="radio" name="question_${row.question_id}" value="${field.id}"> <label for="option_${field.id}"> ${field.option}</label></div>`;
                            jsonFieldOptions += `{ "title": "${field.option}", "value": "${field.id}" },`;

                        });
                        emailFields += `</div></div>`;
                    }

                });
                if (emails.rowCount - 1 == e) doit = true

            });

            if (doit) sendEmail(response, contactId);

        }
    });
}

const sendEmail = async (response, contactId = null) => {
    let q = `select g.provider, c2.* from contacts c2 
  left join group_contacts gc on gc.contact_id = c2.id
  left join groups g on gc.group_id = g.id where 1=1  and c2.deleted_at is null and g.deleted_at is null `
    if (contactId)
        q += ` and c2.id = ${contactId};`;
    else
        q += ` and gc.group_id = ${groupId}`;

    db.pool.query(q, (error, results) => {
        if (error) {
            console.log("error", error)
            // return response.status(409).json(error.message)
        }

        if (results.rowCount > 0) {
            results.rows.forEach(field => {

                if (util.providerGmail.indexOf(field.provider) != -1)
                    sendEmailGmail(response, field, contactId);
                else if (util.providerOutlook.indexOf(field.provider) != -1)
                    sendEmailOutlook(response, field, contactId);
                else {
                    console.log("error: Not allowed provider")
                    // return response.status(400).json({ "name": "error", "error": "Not allowed provider" })
                }

            });


        }

    });
}

const sendEmailGmail = async (response, field, contactId = null) => {
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
      }
      .email-container .email-inner {
        padding-left: 10px;
        padding-right: 10px;    
      }
      .email-container .header{
        text-align: center;
        background-color:#f5f5f5;
        padding:5px;    
        border-bottom: 1px solid black;
        border-top: 1px solid black;
      }
      .email-container .subheading{
        padding:5px;  
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
        font-size:0.9rem;
        line-height: 22px;
      }
      .form {
        padding-left: 10px;
        padding-right: 10px;
      }
      .question { margin-bottom:10px; }
      .question h3 {}
      .options {        border-bottom: 1px solid black;}
      .option {margin-bottom: 10px;}
      .option label { background-color:#dedede; padding:5px 10px; display:inline-block; margin-bottom:5px; font-size: 0.9rem;}
      .option label:hover { background-color:#d6d6d6; }
      .option input {   opacity: 0; position: absolute; z-index: -1;  }
      .option input:checked + label { background-color:#6666ff; color:#FFF; }
      .submit { border:0; background:#5555ff; color:#FFF; padding:8px 16px; cursor:pointer; border-radius:3px ; font-size: 20px; margin-top: 5px}
      .submit:hover { background:#6666ff; }
      .resp-error { background-color: #e74a3b; color:#FFF; padding: 10px; margin-top: 10px; background-size: cover; }
      .resp-success { background-color: #090; color:#FFF; padding: 10px; margin-top: 10px; background-size: cover; }
    </style>
  </head>
  <body>
  <div class="email-container">
  <form method="post"
    action-xhr="${mailer.api_url}/response/${emailId}/${field.id}">
    <div style="width:1px;height:1px">
    <amp-img
    alt=""
    src="${mailer.api_url}/opened/${emailId}/${field.id}"
    width="1"
    height="1"
    layout="responsive"
    style="opacity:0"
  >
  </amp-img>
  </div>
  <div class="email-inner">
    <input type="hidden" name="email" value="${field.email}"></input>
    <input type="hidden" name="name" value="${field.name}"></input>

    <div class="header">    <h2>${emailHeading}</h2>    </div>
    <div class="subheading">    ${emailText}  ${emailImageAMP}  </div>
    <div class="desc"> 
      ${emailFields}    
      <input type="submit" class="submit" value="Send">
      <br>
      <div  submit-success ><template type="amp-mustache"><div class="resp-success">Success! Thanks ${field.name} for your response</div></template></div>
      <div  submit-error ><template type="amp-mustache"><div class="resp-error">Error! Thanks ${field.name} for your response, You have already submitted you response.</div></template></div>
      </div>
    </div>
  </form>
  </div>
  </body>
    </html>`;
    // return response.status(200).send(emailContent);
    let mailOptions = {
        from: process.env.MAIL_FROM_EMAIL,
        to: field.email, //"shafqatjan86@gmail.com", // list of receivers
        subject: emailSubject,
        text: emailText,
        html: `<p>For clients that do not support AMP4EMAIL or amp content is not valid</p><img alt="" src="${mailer.api_url}/opened/${emailId}/${field.id}?has=error" width="1" height="1" layout="responsive" style="opacity:0" ></img>`,
        amp: `${emailContent}`,
        provider: 'Google',
        questionId: questionId,
        optionIds: optionIds.join(',')
    };
    // return response.status(200).send(emailContent);
    db.pool.query('SELECT * FROM sent_email_compaigns WHERE contact_id = $1 AND email_id = $2', [field.id, emailId], (error, setresults) => {
        if (error) {
            throw error
        }

        // response.status(200).json(setresults.rows)
        if (setresults.rowCount == 0) {
            mailer.transporterGmail.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log("Error" + error);
                    // return response.status(401).json(error);
                    db.pool.query('INSERT INTO sent_email_compaigns (contact_id, email_id, reason, created_at) VALUES ($1, $2, $3, $4)', [field.id, emailId, error, new Date()], (error, results) => { })

                }
                console.log('Message %s sent: %s', info.messageId, info.response);

                db.pool.query('INSERT INTO sent_email_compaigns (contact_id, email_id, created_at, email_data) VALUES ($1, $2, $3, $4)', [field.id, emailId, new Date(), mailOptions], (error, results) => {
                })
            });
        } else {
            console.log("error", "Already sent email to " + field.email);
            emailAlreadySent.push(field.email);
            // return response.status(400).json({ "name": "error", "error": " Email already sent to " + field.email })
        }
    });
}

const sendEmailOutlook = async (response, field, contactId = null) => {
    const html = ` <html>
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
                    ${emailTextAct}
                    ${emailImageACT}                  
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
                                "url": "${mailer.api_url}/response/${emailId}/${field.id}",
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
      src="${mailer.api_url}/opened/${emailId}/${field.id}"
      width="1"
      height="1"
      layout="responsive"
      style="opacity:0"
    >
    </img>
  </div>
    Visit the <a href="https://docs.microsoft.com/outlook/actionable-messages">Outlook Dev Portal</a> to learn more about Actionable Messages.
    <img alt="" src="${mailer.api_url}/opened/${emailId}/${field.id}?has=error" width="1" height="1" layout="responsive" style="opacity:0" ></img>
    </body>
  </html>`;
    //   return response.status(200).send(html);

    let mailOptions = {
        from: process.env.MAIL_LIVE_USERNAME,
        to: field.email, // list of receivers
        subject: emailSubject, // Subject line
        text: emailText,
        html: html,
        provider: 'Outlook',
        questionId: questionId,
        optionIds: optionIds.join(',')
    };


    // return response.status(200).send(html);
    db.pool.query('SELECT * FROM sent_email_compaigns WHERE contact_id = $1 AND email_id = $2', [field.id, emailId], (error, setresults) => {
        if (error) {
            throw error
        }

        // response.status(200).json(setresults.rows)
        if (setresults.rowCount == 0) {
            mailer.transporterLive.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log("Error" + error);
                    return res.status(401).json(error);
                }
                console.log('Message %s sent: %s', info.messageId, info.response);

                db.pool.query('INSERT INTO sent_email_compaigns (contact_id, email_id, created_at, email_data) VALUES ($1, $2, $3, $4)', [field.id, emailId, new Date(), mailOptions], (error, results) => { })
            });
        } else {
            console.log("error", "Already sent email to " + field.email);
            emailAlreadySent.push(field.email);
            // return response.status(400).json({ "name": "error", "error": " Email already sent to " + field.email })
        }
    });
}

const storeEmailResponse = async (request, response, origin) => {
    const { body, query, params, headers } = request;
    console.log(JSON.stringify(body), JSON.stringify(query), JSON.stringify(params), headers);
    // sendFollowUp(request, response, 1, params.contactId);
    // return false;
    const keys = Object.keys(body);
    await keys.forEach(el => {
        const split = el.split('_');

        if (split.length == 2) {
            db.pool.query('SELECT * FROM compaign_email_question_responses WHERE contact_id = $1 AND email_id = $2 AND question_id = $3', [params.contactId, params.emailId, split[1]], (error1, results) => {
                if (error1) {
                    console.log("error", error1);
                    return response.status(400).json({ "name": "error", "error": error1 })
                }
                // response.status(200).json(results.rows)
                if (results.rowCount == 0) {
                    db.pool.query('INSERT INTO compaign_email_question_responses (email_id, question_id, option_id, contact_id, sender_email, origin, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)', [params.emailId, split[1], body[el], params.contactId, body.email, origin, new Date()], (error2, iresults) => {
                        if (error2) {
                            console.log("error", error2);
                            return response.status(400).json({ "name": "error", "error": error2 })
                        }
                        isOpened(request, 'response_back');
                        sendFollowUp2(request, response, body[el], params.contactId);
                        return response.status(200).json({ "name": "success" })
                    })

                } else {
                    console.log("error", "Already response");
                    return response.status(400).json({ "name": "error", "error": "Response already sent" })
                }
            })
        }

    })

}

const isOpened = async (request, col) => {
    const { body, query, params } = request;
    console.log("open ", JSON.stringify(body), JSON.stringify(query), JSON.stringify(params));
    await db.pool.query('SELECT * FROM sent_email_compaigns WHERE contact_id = $1 AND email_id = $2 limit 1', [params.contactId, params.emailId], (error, results) => {
        if (error) {
            console.log("Error", error)
        }
        if (results.rowCount > 0) {
            if (results.rows[0].response_back === 0) {

                let alsochange = '';
                const curDate = new Date().toISOString().split('T');
                console.log(curDate[0] + ' ' + curDate[1]);
                if (col == 'is_open') {
                    alsochange = ', has_error = 0, response_back = 0, open_date = \'' + curDate[0] + ' ' + curDate[1] + '\', ';
                }
                if (col == 'response_back') {
                    alsochange = ', has_error = 0, is_open = 0,';
                }

                let myq = `UPDATE sent_email_compaigns set ${col} = 1 ${alsochange} updated_at = $2 WHERE id = $1`;

                if (query.has != undefined) {
                    //results.rows[0].is_open = 1 is already opened change error to 0
                    if (results.rows[0].is_open === 1) {
                        myq = 'UPDATE sent_email_compaigns set has_error = 0, updated_at = $2 WHERE id = $1';
                    } else {
                        myq = 'UPDATE sent_email_compaigns set has_error = 1, open_date = \'' + curDate[0] + ' ' + curDate[1] + '\', updated_at = $2 WHERE id = $1';
                    }
                }
                // console.log(myq);
                db.pool.query(myq, [results.rows[0].id, new Date()], (error, iresults) => {
                    if (error) {
                        console.log("Error", error)
                    }
                    // return response.status(200).json({ "name": "success" })
                    return true;
                })
            }
        }
    })

}

const resendEmail = async (request) => {
    const { body, query, params } = request;
    console.log("resend ", JSON.stringify(body), JSON.stringify(query), JSON.stringify(params));
    try {
        const result = await db.pool.query(`  SELECT  c."name" , c.email,sec.* FROM sent_email_compaigns sec 
      left join contacts c on c.id = sec.contact_id 
     WHERE sec.response_back = 0 and sec.has_error = 0;`)
        return result;

    } catch (error) {
        console.log(error)
        return error;
    }
}

const sendFollowUp = async (request, response, optionId, contactId) => {
    const { body, query, params } = request;
    console.log("follow", JSON.stringify(body), JSON.stringify(query), JSON.stringify(params));
    emailFields = '';
    emailSubject = ``;
    emailHeading = ``;
    emailContent = ``;
    doit = false;
    groupId = 0;
    emailId = 0;
    jsonFieldQues = '';
    jsonFieldOptions = '';
    emailImageAMP = ``;
    emailImageACT = ``;
    emailText = '';
    emailTextAct = '';
    optionIds = [];
    //compaign variable and option variable will do add  than 
    //Option Variable

    const q1 = `Select cv."name" , ov.variable_id as opt_variable_id , ov.value as option_value, ceqo.variable_id , ceqo."operator" , ceqo.value as optioninfo, ce.compaign_id
  from option_variables ov
  left join compaign_email_question_options  ceqo on ceqo.id = ov.option_id 
  left join compaign_email_questions ceq on ceq.id = ceqo.question_id 
  left join compaign_emails ce on ce.id = ceq.email_id
  left join course_variables cv on cv.id = ov.variable_id 
  where ceqo.id = ${optionId} and ov.option_id  = ${optionId}  and (ce.deleted_at is null and ceq.deleted_at is null  and ceqo.deleted_at is null)`;

    let whichFollow = '';
    let rnd = Math.floor(Math.random() * 10);

    db.pool.query(q1, [], (oerror, oresult) => {
        if (oerror) throw oerror;

        if (oresult.rowCount > 0) {
            let doit = false;
            oresult.rows.forEach((ores, index) => {
                //Course variable of this email compaign
                db.pool.query(`select cv.* , c.id as compaign_id,
        ( select value from contact_variables cv where compaign_id = ${ores.compaign_id} and variable_id = ${ores.opt_variable_id} and contact_id = ${contactId}) as contact_value
          from course_variables cv 
          left join compaign_emails ce on ce.id = $1
          left join compaigns c on c.id = ce.compaign_id 
          left join courses c2 on c2.id = c.course_id 
          where cv.course_id = c2.id and cv.id = $2  and (c.deleted_at  is null and ce.deleted_at is null )`, [params.emailId, ores.opt_variable_id], (cerror, cresult) => {
                    if (cerror) throw oerror;

                    if (cresult.rowCount > 0) {
                        whichFollow = '';
                        let condValue = 0;
                        let optValue = 0;
                        let iniVariable = 0;
                        let sum = 0;
                        if (ores.variable_id === 0) {
                            condValue = parseFloat(ores.optioninfo);
                            optValue = parseFloat(ores.option_value);
                            iniVariable = parseFloat(cresult.rows[0].value)
                            sum = (optValue + iniVariable);
                            //addition here
                        } else {
                            condValue = parseFloat(ores.optioninfo);
                            optValue = parseFloat(ores.option_value);
                            rnd = parseFloat(ores.value);
                            iniVariable = parseFloat(cresult.rows[0].contact_value)
                            sum = (optValue + iniVariable);
                        }

                        if (ores.operator === '=>') {
                            whichFollow = (rnd >= condValue) ? '' : '_2';
                        } else {
                            whichFollow = (rnd <= condValue) ? '' : '_2';
                        }

                        db.pool.query(`delete from contact_variables where contact_id = $1 and compaign_id = $2 and variable_id = $3`, [contactId, cresult.rows[0].compaign_id, ores.opt_variable_id]);

                        db.pool.query(`insert into contact_variables (contact_id, compaign_id, variable_id, value) values($1, $2, $3, $4)`, [contactId, cresult.rows[0].compaign_id, ores.opt_variable_id, sum]);
                    }
                });
                if ((oresult.rowCount - 1) == index)
                    doit = true;
            })
            const myinter = setInterval(() => {
                if (doit) {
                    const q = `select c2.name as course_name, ce.id as email_id, ce.subject ,ce.title ,ce."text" ,ce.heading ,  ceq.id as question_id,ceq.question,c.id as compaign_id,c.group_id , ceqo.option, ceqo.followup_email_id , ceqo.followup_email_id_2 
        from compaign_email_question_options ceqo   
        left join compaign_emails ce on ce.id = ceqo.followup_email_id${whichFollow}   
        left join compaign_email_questions ceq on ce.id = ceq.email_id  
        left join compaigns c on c.id = ce.compaign_id  
        left join courses c2 on c2.id = c.course_id 
        where ceqo.followup_email_id${whichFollow} is not null and ceqo.id = ${optionId}   and (c.deleted_at  is null and ce.deleted_at is null and ceq.deleted_at is null and ceq.deleted_at is null and ceqo.deleted_at is null);`;
                    setUpEmail(response, q, contactId);
                    clearInterval(myinter);
                }
            }, 500);

        }
    });
    return false;
}
const sendFollowUp2 = async (request, response, optionId, contactId) => {
    const { body, query, params } = request;
    console.log("follow", JSON.stringify(body), JSON.stringify(query), JSON.stringify(params));
    emailFields = '';
    emailSubject = ``;
    emailHeading = ``;
    emailContent = ``;
    doit = false;
    groupId = 0;
    emailId = 0;
    jsonFieldQues = '';
    jsonFieldOptions = '';
    emailImageAMP = ``;
    emailImageACT = ``;
    emailText = '';
    emailTextAct = '';
    optionIds = [];
    //compaign variable and option variable will do add  than 
    //Option Variable

    const q1 = `Select ceqo.followup_email_id, ceqo.followup_email_id_2,cv."name" , ov.variable_id as opt_variable_id , ov.value as option_value, ceqo.variable_id , ceqo."operator" , ceqo.value as optioninfo, ce.compaign_id
  from option_variables ov
  left join compaign_email_question_options  ceqo on ceqo.id = ov.option_id 
  left join compaign_email_questions ceq on ceq.id = ceqo.question_id 
  left join compaign_emails ce on ce.id = ceq.email_id
  left join course_variables cv on cv.id = ov.variable_id 
  where ceqo.id = ${optionId} and ov.option_id  = ${optionId}  and (ce.deleted_at is null and ceq.deleted_at is null  and ceqo.deleted_at is null)`;

    let whichFollow = '';
    let whichFollowEmail = '';
    let rnd = Math.floor(Math.random() * 10);

    db.pool.query(q1, [], (oerror, oresult) => {
        if (oerror) throw oerror;

        if (oresult.rowCount > 0) {
            let doit = false;
            oresult.rows.forEach((ores, index) => {
                //Course variable of this email compaign
                const iq = `select cv.* , c.id as compaign_id,
                ( select value from contact_variables cv where compaign_id = ${ores.compaign_id} and variable_id = ${ores.opt_variable_id} and contact_id = ${contactId} limit 1) as contact_value
                  from course_variables cv 
                  left join compaign_emails ce on ce.id = $1
                  left join compaigns c on c.id = ce.compaign_id 
                  left join courses c2 on c2.id = c.course_id 
                  where cv.course_id = c2.id and cv.id = $2  and (c.deleted_at  is null and ce.deleted_at is null )`;

                db.pool.query(iq, [params.emailId, ores.opt_variable_id], (cerror, cresult) => {
                    if (cerror) throw cerror;

                    if (cresult.rowCount > 0) {
                        whichFollow = '';
                        whichFollowEmail = '';
                        let condValue = 0;
                        let optValue = 0;
                        let iniVariable = 0;
                        let sum = 0;
                        if (ores.variable_id === 0) {
                            condValue = parseFloat(ores.optioninfo);
                            optValue = parseFloat(ores.option_value);
                            iniVariable = parseFloat(cresult.rows[0].value)
                            sum = (optValue + iniVariable);
                            //addition here
                        } else {
                            condValue = parseFloat(ores.optioninfo);
                            optValue = parseFloat(ores.option_value);
                            rnd = parseFloat(ores.value);
                            iniVariable = parseFloat(cresult.rows[0].contact_value)
                            sum = (optValue + iniVariable);
                        }
                        console.log("RND => ", rnd, "condValue => ", condValue, "condition => ", (rnd >= condValue), "optValue => ", optValue, "inivariable => ", iniVariable, "sum =>", sum)

                        if (ores.operator === '=>') {
                            whichFollow = (rnd >= condValue) ? '' : '_2';
                            whichFollowEmail = (rnd >= condValue) ? ores.followup_email_id : ores.followup_email_id_2;
                        } else {
                            whichFollow = (rnd <= condValue) ? '' : '_2';
                            whichFollowEmail = (rnd <= condValue) ? ores.followup_email_id : ores.followup_email_id_2;
                        }

                        db.pool.query(`delete from contact_variables where contact_id = $1 and compaign_id = $2 and variable_id = $3`, [contactId, cresult.rows[0].compaign_id, ores.opt_variable_id]);

                        db.pool.query(`insert into contact_variables (contact_id, compaign_id, variable_id, value) values($1, $2, $3, $4)`, [contactId, cresult.rows[0].compaign_id, ores.opt_variable_id, sum]);
                    }
                });
                if ((oresult.rowCount - 1) == index && whichFollowEmail != undefined)
                    doit = true;
            })
            const myinter = setInterval(() => {
                if (doit) {
                    const pResult = sendFollowUp3(request, whichFollowEmail);
                    pResult.then((emails) => {
                        if (emails.rows.length > 0) {
                            const cResult = getContacts(request, emails.rows[0].group_id, contactId);

                            cResult.then((contacts) => {

                                contacts.rows.forEach(contact => {
                                    const myEmailData = util.providerGmail.indexOf(contact.provider) != -1 ? emails.rows[0].google_email_data : emails.rows[0].outlook_email_data;

                                    console.log("1-", contact.provider, util.providerGmail.indexOf(contact.provider), util.providerOutlook.indexOf(contact.provider));

                                    // if (!email.provider)
                                    //       return response.status(400).json({ "name": "error", "error": "Not allowed provider" })
                                    let myEmailData2 = { ...myEmailData };
                                    myEmailData2.to = util.replace(myEmailData2.to, '!!reciever_email!!', contact.email);

                                    if (util.providerGmail.indexOf(contact.provider) != -1) {
                                        myEmailData2.from = util.replace(myEmailData2.from, '!!MAIL_FROM_EMAIL!!', mailer.from_email);
                                        myEmailData2.amp = util.replace(myEmailData2.amp, '!!email_address!!', contact.email);
                                        myEmailData2.amp = util.replace(myEmailData2.amp, '!!contact_name!!', contact.name);
                                        myEmailData2.amp = util.replace(myEmailData2.amp, '!!contact_name!!', contact.name);
                                        myEmailData2.amp = util.replace(myEmailData2.amp, '!!contact_name!!', contact.name);
                                        myEmailData2.amp = util.replace(myEmailData2.amp, '!!contact_id!!', contact.id);
                                        myEmailData2.amp = util.replace(myEmailData2.amp, '!!contact_id!!', contact.id);
                                        myEmailData2.html = util.replace(myEmailData2.html, '!!contact_id!!', contact.id);
                                        storeAndSend(contact, emails.rows[0].email_id, contact.provider, myEmailData2);
                                    }
                                    else if (util.providerOutlook.indexOf(contact.provider) != -1) {
                                        myEmailData2.from = util.replace(myEmailData2.from, '!!MAIL_FROM_EMAIL!!', mailer.from_email2);
                                        myEmailData2.html = util.replace(myEmailData2.html, '!!MAIL_LIVE_ORIGNATOR!!', mailer.originator);
                                        myEmailData2.html = util.replace(myEmailData2.html, '!!contact_id!!', contact.id);
                                        myEmailData2.html = util.replace(myEmailData2.html, '!!contact_id!!', contact.id);
                                        myEmailData2.html = util.replace(myEmailData2.html, '!!contact_id!!', contact.id);
                                        storeAndSend(contact, emails.rows[0].email_id, contact.provider, myEmailData2);
                                    }

                                    else {
                                        console.log("error: Not allowed provider")
                                        // return response.status(400).json({ "name": "error", "error": "Not allowed provider" })
                                    }
                                });
                            });
                        }

                    })
                    // setUpEmail(response, q, contactId);
                    clearInterval(myinter);
                }
            }, 500);

        }
    });
    return false;
}

module.exports = {
    sendMainCompaignEmail,
    sendMainCompaignEmail2,
    storeEmailResponse,
    isOpened,
    sendFollowUp,
    resendEmail,
    emailAlreadySent,
    getContacts,
    sentEmailExist,
    storeAndSend,
    sendFollowUp3
}