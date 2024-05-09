import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });
import nodemailer from "nodemailer";
import * as fs from "fs";
import * as path from "path";
import SMTPTransport from "nodemailer/lib/smtp-transport";

/**
 * Nodemailer transporter
 */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_GMAIL_USER,
    pass: process.env.SMTP_GMAIL_PASS,
  },
});

export const sendMail = async (transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>, opts: { html: string, plainText: string, subject: string, to: string }) => {
  await transporter.sendMail({
    from: "ammarahmed.ca <ammar@ammarahmed.ca>",
    to: opts.to,
    html: opts.html,
    text: opts.plainText,
    subject: opts.subject
  });
}

export default transporter;
