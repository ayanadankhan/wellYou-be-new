import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'teambitsbuffer@gmail.com',
      pass: 'kyco uixt ntee qupu',
    },
  });

  // mail.service.ts
  async sendOtpEmail(to: string, otp: string) {
    try {
      const mailOptions = {
        from: '"BitsBuffer" <teambitsbuffer@gmail.com>',
        to,
        subject: 'Your Password Reset OTP',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://bitsbuffer.com/logo.png" alt="BitsBuffer Logo" style="max-width: 150px;">
              <h1 style="color: #2c3e50;">Password Reset Request</h1>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
              <p>You requested to reset your password. Here's your OTP:</p>
              
              <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center; font-size: 24px; font-weight: bold;">
                ${otp}
              </div>
              
              <p>This OTP is valid for 15 minutes. Please don't share it with anyone.</p>
              
              <p style="font-size: 0.9em; color: #7f8c8d;">
                If you didn't request this password reset, please contact our IT support team immediately.
              </p>
            </div>
            
            <div style="margin-top: 20px; text-align: center; font-size: 0.8em; color: #7f8c8d;">
              <p>© ${new Date().getFullYear()} BitsBuffer. All rights reserved.</p>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${to}`);
    } catch (error) {
        console.error('Failed to send OTP email:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(
  to: string,
  name: string,
  email: string,
  originalPassword: string
  ) {
    try {
      const mailOptions = {
        from: '"WellYou" <teambitsbuffer@gmail.com>',
        to,
        subject: 'Welcome to WellYou – Your Modern HRMS Solution',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #eaeaea;">
            
            <!-- Header -->
            <div style="background: linear-gradient(90deg, #4e73df, #1cc88a); padding: 20px; text-align: center;">
              <img src="https://bitsbuffer.com/logo.png" alt="WellYou Logo" style="max-width: 160px; margin-bottom: 10px;">
              <h1 style="color: #fff; margin: 0; font-size: 24px;">Welcome to WellYou</h1>
              <p style="color: #eaf2f8; margin: 5px 0 0;">Your Modern HRMS Solution</p>
            </div>

            <!-- Body -->
            <div style="padding: 25px; color: #2c3e50;">
              <h3 style="margin-top: 0;">Dear ${name},</h3>
              
              <p>
                We’re thrilled to welcome you to <strong>WellYou</strong> — a modern Human Resource Management System designed to simplify and elevate the way you manage your people.
              </p>

              <p>
                Once logged in, you’ll have access to our intuitive dashboard where you can manage employee records, track attendance, process payroll, and much more—all in one place.
              </p>
              
              <p>
                Use the credentials below to log in and begin exploring the platform:
              </p>

              <!-- Credentials Card -->
              <div style="background-color: #f8f9fa; border: 1px solid #e1e5eb; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #4e73df;">Your Login Credentials</h3>
                <p><strong>Login Link:</strong> <a href="https://hrms.bitsbuffer.com/" style="color: #1cc88a; text-decoration: none;">https://hrms.bitsbuffer.com/</a></p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Temporary Password:</strong> ${originalPassword}</p>
              </div>

              <p><em>🔒 For security reasons, please change your password after your first login.</em></p>

              <p>
                If you need any assistance, our support team is just an email away at 
                <a href="mailto:teambitsbuffer@gmail.com" style="color:#4e73df; text-decoration:none;">teambitsbuffer@gmail.com</a>.
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f4f6f8; padding: 15px; text-align: center; font-size: 12px; color: #7f8c8d;">
              <p>© ${new Date().getFullYear()} WellYou by BitsBuffer. All rights reserved.</p>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log("Welcome email sent to:", {email});
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      throw error;
    }
  }
}