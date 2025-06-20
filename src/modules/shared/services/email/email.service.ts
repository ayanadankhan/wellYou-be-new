// import { Injectable } from "@nestjs/common";
// import AWS from "aws-sdk";
// import sgMail from "@sendgrid/mail";
// import { ConfigService } from "@nestjs/config";

// // create reusable transporter object using the default SMTP transport
// // let nmTransporter = nodemailer.createTransport({
// //   host: "smtp.transip.email",
// //   port: 465,
// //   secure: true, // true for 465, false for other ports
// //   auth: {
// //     user: process.env.SMTP_EMAIL,
// //     pass: process.env.SMTP_PASSWORD,
// //   },
// // });

// @Injectable()
// export class EmailService {
//   public domain = process.env.APP_DOMAIN;

//   constructor(private readonly configService: ConfigService) {
//   }

//   loadTemplate(identifier: string, data: any){
//     switch (identifier) {
//       case "account-verification": {
//         const link = this.domain + "/verify-account/" + data[`email`] + "/" + data[`verification`];
//         return `
//           <h1>Hello! Greetings of the day.</h1>
//           Please click on the link to verify your account<br>
//           <a href="${link}">${link}</a>
//         `;
//       }
//       case "forgot-password": {
//         return `
//           <h1>Hello! Greetings of the day.</h1>
//           Please use this pin to reset your password <strong>${data?.pin}</strong>
//         `;
//       }
//       case "login-otp": {
//         return `
//           <h1>Hello! Greetings of the day.</h1>
//           Please use this otp to login <strong>${data?.pin}</strong>
//         `;
//       }
//       case "published-item": {
//         const allLanguages = Object.keys(data[0].languages);
//         const todayDate = new Date();
//         const currentTime = todayDate.toLocaleTimeString('en-US', { hour12: false }); // 24-hour format
//         const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
//         const groupedByBrand = data.reduce((acc: { [x: string]: any[]; }, item: { brandName: any; }) => {
//           const brandName = item.brandName;
//           if (!acc[brandName]) {
//             acc[brandName] = [];
//           }
//           acc[brandName].push(item);
//           return acc;
//         }, {});
      
//         const tables = Object.keys(groupedByBrand).map(brandName => {
//           const brandData = groupedByBrand[brandName];
//           const languageHeaders = allLanguages.map(lang => `<th style="padding: 8px; border: 1px solid #dee2e6;">${lang}</th>`).join("");
      
//           const rows = brandData.map((item: { languages: { [x: string]: any; }; orientation: any; }, index: number) => {
//             const languageCounts = allLanguages.map(lang => `<td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${item.languages[lang] || '-'}</td>`).join("");
//             return `
//               <tr style="background-color: ${index > 0 ? (index % 2 === 0 ? "#f8f9fa" : "#fff") : "transparent"};">
//                 <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${item.orientation}</td>
//                 ${languageCounts}
//               </tr>
//             `;
//           }).join("");
      
//           return `
//             <p style="margin: 0;">This report is created on ${currentTime} according to time zone of ${timeZone}</p>
//             <h2 style="margin: 0; margin-bottom: 10px;">${brandName}</h2>
//             <table style="width: 100%; border-collapse: collapse;">
//               <thead style="background-color: #f8f9fa; border-bottom: 2px solid #dee2e6;">
//                 <tr>
//                   <th style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">Orientation</th>
//                   ${languageHeaders}
//                 </tr>
//               </thead>
//               <tbody>
//                 ${rows}
//               </tbody>
//             </table>
//           `;
//         }).join("");
      
//         return `
//           <h1 style="margin-bottom: 20px;">Daily Report of Published Items</h1>
//           ${tables}
//         `;
//       }
      

//       default:
//         break;
//     }
//   }

//   async sendUsingSendGrid(
//     to: string,
//     subject: string,
//     body: string,
//     text = ''
//   ) {
//     // return nmTransporter.sendMail({
//     //   from: process.env.SMTP_EMAIL,
//     //   to: toEmail, // comma separated emails.
//     //   subject: subject, // Subject line
//     //   text: textMessage, // plain text body
//     //   html: htmlPage, // html body
//     // });
//     try {
//       sgMail.setApiKey(this.configService.get("sendGridApiKey"));
//       return await sgMail
//         .send({
//           from: this.configService.get("fromEmail"),
//           to: to,
//           subject: subject,
//           text: text || body,
//           html: body, // html body
//         });
//     } catch (error) {
//       console.error(error.response);
//     }
//   }

//   async sendUsingSes({
//     to,
//     subject,
//     body,
//     source = this.configService.get("fromEmail"),
//   }: { to: string[] | string; subject: string; body: string; source?: string }) {
//     AWS.config.update({
//       region: this.configService.get("region"),
//       accessKeyId: this.configService.get("accessKeyId"),
//       secretAccessKey: this.configService.get("secretAccessKey")
//     });
//     const ses = new AWS.SES({ apiVersion: '2010-12-01' });

//     const params = {
//       Destination: {
//         ToAddresses: Array.isArray(to) ? to : [to],
//       },
//       Message: {
//         Body: {
//           Html: {
//             Charset: 'UTF-8',
//             Data: body,
//           },
//         },
//         Subject: {
//           Charset: 'UTF-8',
//           Data: subject,
//         },
//       },
//       Source: source,
//     };

//     return new Promise((resolve, reject) => {
//       ses.sendEmail(params, (err, data) => {
//         if (err) {
//           console.error('Error sending email:', err);
//           reject(err);
//           return;
//         }
//         resolve(data);
//       });
//     })
//   }
// }
