import nodemailer from "nodemailer";

type OtpPurpose = "signup" | "forgot_password";

export const sendOtpEmail = async (
  email: string,
  otp: string,
  purpose: OtpPurpose
) => {
  try {
    console.log("➡️ Preparing to send OTP email to:", email);

    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_PORT ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS
    ) {
      throw new Error(
        "SMTP configuration is incomplete in environment variables"
      );
    }

    console.log("➡️ SMTP configuration found, creating transporter...");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    console.log("➡️ Transporter created, preparing mail options...");
    const subject =
      purpose === "signup"
        ? "Unlock Your XPRDex Account - Verification Code"
        : "Unlock Your XPRDex Account - Password Reset Code";
    const mailOptions = {
      from: `"XPRDex" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background: #f9f9fb; padding: 20px; color: #333; text-align: center; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); display: block; min-height: 0;">
          <h1 style="color: #2a5298; font-size: 32px; margin: 10px 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">
            XPRDex Verification
          </h1>
          <p style="font-size: 18px; color: #666; margin: 15px 0; line-height: 1.6;">
            Your exclusive <strong>verification code</strong> is here to ${
              purpose === "signup" ? "unlock your account!" : "reset your password!"
            }
          </p>
          <div style="background: #ffffff; padding: 15px; border-radius: 10px; display: block; margin: 15px 0; border: 2px solid #e0e7ff; box-shadow: 0 2px 8px rgba(42, 82, 152, 0.1);">
            <span style="font-size: 40px; font-weight: bold; color: #2a5298; text-shadow: 0 1px 3px rgba(42, 82, 152, 0.2); user-select: text;">${otp}</span>
          </div>
          <p style="font-size: 16px; color: #777; margin: 15px 0; line-height: 1.5;">
            This code is valid for <strong>15 minutes</strong>. Please don’t share it with anyone. If this wasn’t you, ignore this email.
          </p>
          <div style="background: #f1f5f9; padding: 10px; border-radius: 10px; margin: 15px 0; border: 1px solid #e0e7ff;">
            <p style="font-size: 14px; color: #555;">Powered by <strong style="color: #2a5298;">XPRDex</strong> | © 2025 All rights reserved</p>
          </div>
        </div>
        <style type="text/css">
          @media (max-width: 600px) {
            div { max-width: 90%; padding: 15px; }
            h1 { font-size: 24px; }
            p { font-size: 16px; }
            div[style*="padding: 15px"] { padding: 10px; }
            span[style*="font-size: 40px"] { font-size: 30px; }
          }
        </style>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email successfully sent to ${email}`);
  } catch (err) {
    console.error("Failed to send OTP email:", err);
    throw err;
  }
};
