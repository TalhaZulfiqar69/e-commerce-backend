const nodemailer = require('nodemailer');

const mailTransport = async () => {
  let transporter = await nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.MAILER_USERNAME, // generated ethereal user
      pass: process.env.MAILER_PASSWORD, // generated ethereal password
    },
  });
  return transporter;
};
const createAccountMessageHelper = async (user, verificationToken) => {
  try {
    const emailTransport = await mailTransport();

    // send mail with defined transport object
    const info = await emailTransport.sendMail({
      from: '"E-commerece', // sender address
      to: user?.dataValues?.email, // list of receivers
      subject: 'Welcome to E-commerece', // Subject line
      html: `<b>Dear ${user?.dataValues?.firstName} ${user?.dataValues?.lastName}</b>
                  <p>We're thrilled to welcome you to E-commerce platform! You've successfully created an account, and we're excited to have you as part of our community.</p>
                  <p>We've attached the account verification link below. Please click the link below to verify your account. <a href="${process.env.FRONTEND_BASE_URL}/${verificationToken}">ACCOUNT VERIFICATION LINK</a></p>
                  <p>Thank you for choosing E-commerce platform. We're looking forward to serving you!.</p>
                  Best regards<br/>
                  <b>E-commerce Support Team.</b>`, // html body
    });
    return info;
  } catch (error) {
    return error;
  }
};
const forgetPasswordMessageHelper = async (user, verificationToken) => {
  try {
    const emailTransport = await mailTransport();

    // send mail with defined transport object
    const info = await emailTransport.sendMail({
      from: '"E-commerece', // sender address
      to: user?.dataValues?.email, // list of receivers
      subject: 'Reset Your Password', // Subject line
      html: `<b>Dear ${user?.dataValues?.firstName} ${user?.dataValues?.lastName}</b>
                  <p>We have received a request to reset your password. To complete the process, please click on the following link:</p>
                  <a href="${process.env.FRONTEND_BASE_URL}/${verificationToken}">Link to password reset</a>
                  <p>If you did not make this request, you can safely ignore this email. Your account will remain secure.</p>
                  Thank you,<br/>
                  <b>E-commerce Support Team.</b>`, // html body
    });
    return info;
  } catch (error) {
    return error;
  }
};

module.exports = { createAccountMessageHelper, forgetPasswordMessageHelper };
