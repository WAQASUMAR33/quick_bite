import nodemailer from 'nodemailer';

export async function sendVerificationEmail(email, token) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Ensure this is correct
    port: 587, // Use the correct port for non-secure connections
    secure: false, // Set to true if you switch to port 465 (SSL)
    auth: {
      user: 'ipkmurshad236@gmail.com', // Your email
      pass: 'cinjxfmhopgypxnf', // Your email password
    },
  });

  const verificationLink = `${process.env.BASE_URL}/api/verify/${token}`;


  const mailOptions = {
    from: 'pkmurshad236@gmail.com',
    to: email,
    subject: 'Verify Your Email Address',
    html: `<p>Thank you for registering. Please click the link below to verify your email address:</p><a href="${verificationLink}">Verify Email</a>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('Error sending verification email:', error);
  }
}
