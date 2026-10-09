// import nodemailer from "nodemailer";

// export default defineEventHandler(async (event) => {
//   try {
//     const body = await readBody(event);

//     console.log("BODY EMAIL:", body);

//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: "muhammadnoval280405@gmail.com",
//         pass: "tjit qpfs ltqq mohh",
//       },
//     });

//     const mailOptions = {
//       from: "muhammadnoval280405@gmail.com",
//       to: body.to,
//       cc: body.cc,
//       bcc: body.bcc,
//       subject: body.subject,
//       html: body.html,

//       attachments: (body.attachments || []).map((url: string, i: number) => ({
//         filename: `file-${i + 1}.pdf`,
//         path: url,
//       })),
//     };

//     const result = await transporter.sendMail(mailOptions);

//     console.log("EMAIL SUCCESS:", result);

//     return { status: "ok" };
//   } catch (error: any) {
//     console.error("EMAIL ERROR:", error);

//     return {
//       status: "error",
//       message: error.message,
//     };
//   }
// });

import nodemailer from "nodemailer";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "marketingkreasiaresa@gmail.com",
        pass: "adma aexw ohsb aini",
      },
    });

    const formatEmails = (emails: string[] | string) => {
      if (!emails) return undefined;

      const list = Array.isArray(emails) ? emails : [emails];

      return list
        .filter((e) => e.includes("@"))
        .join(",");
    };

    // ✅ ubah mailOptions di sini
    const mailOptions = {
      from: `"PT. KARYA ARESA MANDIRI" <marketingkreasiaresa@gmail.com>`,
      to: body.to,
      cc: formatEmails(body.cc),
      bcc: formatEmails(body.bcc),
      subject: body.subject,
      html: body.html,
      attachments: (body.attachments || []).map((url: string, i: number) => ({
        filename: `file-${i + 1}.pdf`,
        path: url,
      })),
    };

    const result = await transporter.sendMail(mailOptions);

    return { status: "ok" };
  } catch (error: any) {
    console.error("EMAIL ERROR:", error);
    return { status: "error", message: error.message };
  }
});