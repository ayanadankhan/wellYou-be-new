import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'akhtarsaharan336@gmail.com',
      pass: 'cexe znrw yubv gzrs',
    },
  });

  // mail.service.ts
async sendOtpEmail(to: string, otp: number) {
  try {
    const mailOptions = {
      from: '"BitsBuffer" <akhtarsaharan336@gmail.com>',
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
    originalPassword: string // Now accepting plain text temporary password
  ) {
    try {
      const mailOptions = {
        from: '"BitsBuffer" <akhtarsaharan336@gmail.com>',
        to,
        subject: 'Welcome to BitsBuffer Platform',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://bitsbuffer.com/logo.png" alt="BitsBuffer Logo" style="max-width: 150px;">
              <h1 style="color: #2c3e50;">Welcome to BitsBuffer</h1>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
              <h2 style="color: #2c3e50;">Assalam o Alaikum ${name},</h2>
              
              <p>Your account has been successfully created on BitsBuffer platform.</p>
              
              <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <h3 style="margin-top: 0; color: #2c3e50;">Your Login Credentials:</h3>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Password:</strong> ${originalPassword}</p>
              </div>
              
              <p>For security reasons, please change your password after first login.</p>
              
              <p style="font-size: 0.9em; color: #7f8c8d;">
                If you didn't request this account or need any assistance, 
                please contact our IT support team immediately.
              </p>
            </div>
            
            <div style="margin-top: 20px; text-align: center; font-size: 0.8em; color: #7f8c8d;">
              <p>© ${new Date().getFullYear()} BitsBuffer. All rights reserved.</p>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${email}`);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      throw error;
    }
  }
}