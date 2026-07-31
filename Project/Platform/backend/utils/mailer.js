const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: process.env.EMAIL_SECURE === "true", // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendResetEmail = async (to, resetLink) => {
  if (!to || !resetLink) throw new Error("Missing recipient email or reset link");
  if (!to.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) throw new Error("Invalid email address");

  try {
    await transporter.sendMail({
      from: '"Cedar Capital Group Security Team" <no-reply@cfdpro.com>', // should match your domain SPF/DKIM
      to,
      subject: "Important: Reset Your Password Securely",
      html: `
        <div style="max-width: 600px; margin: auto; background-color: #0a0f2c; padding: 40px; font-family: Arial, sans-serif; border-radius: 12px; color: #ffffff; border: 2px solid #00eaff; box-shadow: 0 0 20px #00eaff33;">
          <h1 style="color: #00eaff; text-align: center; text-shadow: 0 0 10px #00eaff;">Reset Your Password</h1>
          <p style="font-size: 16px;">Hi there,</p>
          <p style="font-size: 15px; line-height: 1.6;">
            We received a request to reset your password for your Cedar Capital Group account.
            If you made this request, please click the button below to set a new password.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="display: inline-block; background: linear-gradient(to right, #00eaff, #00b4d8); padding: 14px 28px; color: #000000; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 0 10px #00eaff;">Reset Password</a>
          </div>
          <p style="font-size: 14px; color: #ffcc00; margin-top: 20px;"><strong>⚠️ This link will expire in 1 hour and can only be used once.</strong></p>
          <hr style="border: none; border-top: 1px solid #00eaff44; margin: 30px 0;">
          <p style="font-size: 14px; color: #ff4f4f;"><strong>Didn't request a password reset?</strong></p>
          <p style="font-size: 14px;">
            If you didn't request this, please ignore this email. No changes will be made unless you use the link above.
          </p>
          <p style="margin-top: 40px; font-size: 14px; color: #cccccc;">Thanks,<br>The Cedar Capital Group Security Team</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw new Error("Failed to send reset email");
  }
};

module.exports = sendResetEmail;

