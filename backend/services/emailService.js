const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      // Check if required environment variables are set
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error(
          "Email credentials not configured. EMAIL_USER and EMAIL_PASS environment variables are required."
        );
        return;
      }

      this.transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS, // Gmail App Password
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      if (process.env.NODE_ENV === "development") {
        console.log(
          "✅ Email service initialized successfully with user:",
          process.env.EMAIL_USER
        );
      }

      // Verify connection immediately
      this.verifyConnection()
        .then((isValid) => {
          if (process.env.NODE_ENV === "development") {
            if (isValid) {
              console.log("✅ Email service connection verified successfully");
            } else {
              console.error("❌ Email service connection verification failed");
            }
          }
        })
        .catch((err) => {
          if (process.env.NODE_ENV === "development") {
            console.error(
              "❌ Email service connection verification error:",
              err.message
            );
          }
        });
    } catch (error) {
      console.error(
        "Failed to initialize email service:",
        process.env.NODE_ENV === "development" ? error : error.message
      );
    }
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      if (process.env.NODE_ENV === "development") {
        console.log("✅ Email service connection verified");
      }
      return true;
    } catch (error) {
      console.error(
        "Email service connection failed:",
        process.env.NODE_ENV === "development" ? error : error.message
      );
      return false;
    }
  }

  async generateTicketPDF(ticketData, eventData) {
    try {
      // Generate QR code as buffer
      let qrCodeBuffer;
      try {
        qrCodeBuffer = await QRCode.toBuffer(ticketData.qrCode, {
          errorCorrectionLevel: "M",
          type: "png",
          quality: 0.92,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
          width: 200,
        });

        if (process.env.NODE_ENV === "development") {
          console.log("✅ QR Code generated successfully for PDF");
        }
      } catch (qrError) {
        console.error("QR Code generation failed:", qrError.message);
        // Use a fallback QR code
        qrCodeBuffer = await QRCode.toBuffer(ticketData.qrCode || "FALLBACK", {
          errorCorrectionLevel: "L",
          width: 200,
        });
      }

      // Create PDF document
      const doc = new PDFDocument({
        size: "A4",
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50,
        },
      });

      // Create buffer to store PDF
      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));

      const pdfPromise = new Promise((resolve, reject) => {
        doc.on("end", () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on("error", reject);
      });

      // Set up colors
      const primaryColor = "#ff6500";
      const textColor = "#333333";
      const lightGray = "#666666";

      // Add border
      doc
        .rect(30, 30, doc.page.width - 60, doc.page.height - 60)
        .stroke(primaryColor)
        .lineWidth(2);

      // Header section
      doc
        .fontSize(24)
        .fillColor(primaryColor)
        .font("Helvetica-Bold")
        .text(eventData.name || "Garba Rass 2025", 50, 80, { align: "center" });

      // Event date and time
      const eventDate = new Date(eventData.date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      doc
        .fontSize(14)
        .fillColor(lightGray)
        .font("Helvetica")
        .text(eventDate, 50, 120, { align: "center" })
        .text(`${eventData.startTime} - ${eventData.endTime}`, 50, 140, {
          align: "center",
        });

      // Dashed line
      doc
        .moveTo(80, 170)
        .lineTo(doc.page.width - 80, 170)
        .dash(5, { space: 5 })
        .stroke(primaryColor)
        .undash();

      // QR Section background
      doc
        .rect(80, 190, doc.page.width - 160, 260)
        .fill("#f8f9fa")
        .stroke("#e9ecef");

      // QR Section title
      doc
        .fontSize(16)
        .fillColor(primaryColor)
        .font("Helvetica-Bold")
        .text("Your Entry Pass", 50, 210, { align: "center" });

      doc
        .fontSize(12)
        .fillColor(lightGray)
        .font("Helvetica")
        .text("Present this QR code at the venue entrance", 50, 235, {
          align: "center",
        });

      // Add QR code image
      const qrX = (doc.page.width - 150) / 2;
      doc.image(qrCodeBuffer, qrX, 260, { width: 150, height: 150 });

      // QR code border
      doc
        .rect(qrX - 2, 258, 154, 154)
        .stroke(primaryColor)
        .lineWidth(2);

      doc
        .fontSize(10)
        .fillColor(lightGray)
        .text("Scan this code for quick entry", 50, 430, { align: "center" });

      // Details section
      let yPosition = 480;

      // Venue detail
      doc
        .rect(80, yPosition, doc.page.width - 160, 60)
        .fill("#f8f9fa")
        .stroke("#e9ecef");

      doc.rect(80, yPosition, 4, 40).fill(primaryColor);

      doc
        .fontSize(12)
        .fillColor(textColor)
        .font("Helvetica-Bold")
        .text("Venue", 95, yPosition + 8);

      doc
        .fontSize(14)
        .fillColor(lightGray)
        .font("Helvetica")
        .text(eventData.venue, 95, yPosition + 22);

      yPosition += 50;

      // Price detail
      doc
        .rect(80, yPosition, doc.page.width - 160, 40)
        .fill("#f8f9fa")
        .stroke("#e9ecef");

      doc.rect(80, yPosition, 4, 40).fill(primaryColor);

      doc
        .fontSize(12)
        .fillColor(textColor)
        .font("Helvetica-Bold")
        .text("Price Paid", 95, yPosition + 8);

      doc
        .fontSize(14)
        .fillColor(lightGray)
        .font("Helvetica")
        .text(`₹${ticketData.price}`, 95, yPosition + 22);

      yPosition += 70;

      // Instructions section
      doc
        .rect(80, yPosition, doc.page.width - 160, 120)
        .fill("#fff3cd")
        .stroke("#ffeaa7");

      doc
        .fontSize(14)
        .fillColor("#856404")
        .font("Helvetica-Bold")
        .text("Important Instructions:", 95, yPosition + 15);

      const instructions = [
        "Arrive at the venue 30 minutes before the event starts",
        "Present this QR code at the entrance for scanning",
        "Keep this ticket safe and do not share with others",
        "Entry is subject to venue capacity and safety guidelines",
        "No outside food or beverages allowed",
        "Follow the dress code: Traditional Indian attire preferred",
      ];

      doc.fontSize(10).fillColor("#856404").font("Helvetica");

      let instructionY = yPosition + 35;
      instructions.forEach((instruction, index) => {
        doc.text(`• ${instruction}`, 100, instructionY + index * 12, {
          width: doc.page.width - 180,
        });
      });

      yPosition += 140;

      // Dashed line
      doc
        .moveTo(80, yPosition)
        .lineTo(doc.page.width - 80, yPosition)
        .dash(5, { space: 5 })
        .stroke(primaryColor)
        .undash();

      // Footer
      doc
        .fontSize(10)
        .fillColor(lightGray)
        .font("Helvetica")
        .text(
          `Thank you for choosing ${eventData.name || "Garba Rass 2025"}!`,
          50,
          yPosition + 20,
          { align: "center" }
        )
        .text(
          "For support, contact us at hyyevents@gmail.com",
          50,
          yPosition + 35,
          { align: "center" }
        );
        
      // Finalize the PDF
      doc.end();

      const pdfBuffer = await pdfPromise;

      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error("Generated PDF buffer is empty or invalid");
      }

      if (process.env.NODE_ENV === "development") {
        console.log(
          "✅ PDF generated successfully with PDFKit, size:",
          pdfBuffer.length,
          "bytes"
        );
      }

      return pdfBuffer;
    } catch (error) {
      console.error(
        "Error generating PDF with PDFKit:",
        process.env.NODE_ENV === "development" ? error : error.message
      );
      throw error;
    }
  }

  generatePurchaseEmailHTML(
    userData,
    ticketData,
    eventData,
    totalAmount,
    quantity
  ) {
    const savings = this.calculateSavings(quantity, eventData);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Ticket Confirmation</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #ff6500, #ffd700);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 30px;
            }
            .success-message {
              background: #d4edda;
              border: 1px solid #c3e6cb;
              color: #155724;
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 20px;
              text-align: center;
            }
            .event-details {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              padding-bottom: 10px;
              border-bottom: 1px solid #eee;
            }
            .detail-row:last-child {
              border-bottom: none;
              margin-bottom: 0;
            }
            .detail-label {
              font-weight: bold;
              color: #666;
            }
            .detail-value {
              color: #333;
            }
            .total-amount {
              background: linear-gradient(135deg, #ff6500, #ffd700);
              color: white;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
              margin: 20px 0;
            }
            .savings-highlight {
              background: #d1ecf1;
              border: 1px solid #bee5eb;
              color: #0c5460;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: center;
            }
            .instructions {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              color: #856404;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .instructions h3 {
              margin-top: 0;
              color: #856404;
            }
            .instructions ul {
              margin: 10px 0;
              padding-left: 20px;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #ff6500, #ffd700);
              color: white;
              padding: 12px 25px;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              margin: 10px 0;
            }
            @media (max-width: 600px) {
              .container {
                margin: 10px;
              }
              .content {
                padding: 20px;
              }
              .detail-row {
                flex-direction: column;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Ticket Confirmation</h1>
              <p>Your tickets for ${eventData.name} are confirmed!</p>
            </div>
            
            <div class="content">
              <div class="success-message">
                <h2>🎊 Congratulations ${userData.name}!</h2>
                <p>Your ticket purchase was successful. Get ready to dance the night away!</p>
              </div>
              
              <div class="event-details">
                <h3>📋 Event Details</h3>
                <div class="detail-row">
                  <span class="detail-label">🎭 Event:</span>
                  <span class="detail-value">${eventData.name}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">📅 Date:</span>
                  <span class="detail-value">${new Date(
                    eventData.date
                  ).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🕐 Time:</span>
                  <span class="detail-value">${eventData.startTime} - ${
      eventData.endTime
    }</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">📍 Venue:</span>
                  <span class="detail-value">${eventData.venue}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🎫 Tickets:</span>
                  <span class="detail-value">${quantity} ticket(s)</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">💰 Price per ticket:</span>
                  <span class="detail-value">₹${ticketData[0].price}</span>
                </div>
              </div>
              
              ${
                savings.amount > 0
                  ? `
                <div class="savings-highlight">
                  <h3>🎉 Group Discount Applied!</h3>
                  <p>Total savings: ₹${savings.amount * quantity}</p>
                </div>
              `
                  : ""
              }
              
              <div class="total-amount">
                <h3>💳 Total Amount Paid</h3>
                <h2>₹${totalAmount}</h2>
              </div>
              
                <h3>📱 QR Code Instructions</h3>
                <ul>
                  <li><strong>Your tickets are attached as PDF files</strong> - Download and save them</li>
                  <li><strong>Each ticket has a unique QR code</strong> - Present at venue entrance</li>
                  <li><strong>Arrive 30 minutes early</strong> for smooth entry</li>
                  <li><strong>Keep tickets safe</strong> - Screenshots work too!</li>
                  <li><strong>One QR code = One person entry</strong> - Don't share codes</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <p><strong>🎭 What to Expect:</strong></p>
                <p>Traditional Garba & Dandiya • Live DJ • Dance Competitions • Authentic Food • Cultural Performances</p>
              </div>
              
              <div style="text-align: center; margin: 20px 0;">
                <p>Questions? Contact us at <strong>hyyevents@gmail.com</strong></p>
              </div>
            </div>
            
            <div class="footer">
              <p>Thank you for choosing Garba Rass 2025!</p>
              <p>This is an automated email. Please do not reply to this email.</p>
              <p>© 2025 Garba Rass. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  generateCancellationEmailHTML(userData, ticketData, eventData) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Ticket Cancellation</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #dc3545, #fd7e14);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 30px;
            }
            .cancellation-message {
              background: #f8d7da;
              border: 1px solid #f5c6cb;
              color: #721c24;
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 20px;
              text-align: center;
            }
            .event-details {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              padding-bottom: 10px;
              border-bottom: 1px solid #eee;
            }
            .detail-row:last-child {
              border-bottom: none;
              margin-bottom: 0;
            }
            .detail-label {
              font-weight: bold;
              color: #666;
            }
            .detail-value {
              color: #333;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
            @media (max-width: 600px) {
              .container {
                margin: 10px;
              }
              .content {
                padding: 20px;
              }
              .detail-row {
                flex-direction: column;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❌ Ticket Cancellation</h1>
              <p>Your ticket has been cancelled</p>
            </div>
            
            <div class="content">
              <div class="cancellation-message">
                <h2>🚫 Ticket Cancelled</h2>
                <p>Hello ${userData.name}, your ticket for ${
      eventData.name
    } has been cancelled.</p>
              </div>
              
              <div class="event-details">
                <h3>📋 Cancelled Ticket Details</h3>
                <div class="detail-row">
                  <span class="detail-label">🎭 Event:</span>
                  <span class="detail-value">${eventData.name}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🎫 Ticket ID:</span>
                  <span class="detail-value">${ticketData.ticketId}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">📅 Event Date:</span>
                  <span class="detail-value">${new Date(
                    eventData.date
                  ).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">💰 Ticket Price:</span>
                  <span class="detail-value">₹${ticketData.price}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">📅 Cancellation Date:</span>
                  <span class="detail-value">${new Date().toLocaleDateString(
                    "en-US"
                  )}</span>
                </div>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <p>We're sorry to see you go! We hope to see you at future events.</p>
                <p>Questions? Contact us at <strong>hyyevents@gmail.com</strong></p>
              </div>
            </div>
            
            <div class="footer">
              <p>Thank you for your understanding.</p>
              <p>This is an automated email. Please do not reply to this email.</p>
              <p>© 2025 Garba Rass. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // Generate refund initiated email HTML
  generateRefundInitiatedEmailHTML(userData, ticketData, refundData) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Refund Initiated</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #3b82f6, #1d4ed8);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 30px;
            }
            .refund-message {
              background: #dbeafe;
              border: 1px solid #93c5fd;
              color: #1e40af;
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 20px;
              text-align: center;
            }
            .refund-details {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              padding-bottom: 10px;
              border-bottom: 1px solid #eee;
            }
            .detail-row:last-child {
              border-bottom: none;
              margin-bottom: 0;
            }
            .detail-label {
              font-weight: bold;
              color: #666;
            }
            .detail-value {
              color: #333;
            }
            .status-timeline {
              background: #f0f9ff;
              border: 1px solid #0ea5e9;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
            @media (max-width: 600px) {
              .container {
                margin: 10px;
              }
              .content {
                padding: 20px;
              }
              .detail-row {
                flex-direction: column;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔄 Refund Initiated</h1>
              <p>Your refund request is being processed</p>
            </div>
            
            <div class="content">
              <div class="refund-message">
                <h2>💳 Refund Processing Started</h2>
                <p>Hello ${userData.name}, your refund request for ${ticketData.eventName} has been initiated and is currently being processed.</p>
              </div>
              
              <div class="refund-details">
                <h3>📋 Refund Details</h3>
                <div class="detail-row">
                  <span class="detail-label">🎫 Ticket ID:</span>
                  <span class="detail-value">${ticketData.ticketId}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🆔 Refund ID:</span>
                  <span class="detail-value">${refundData.refundId}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">💰 Original Amount:</span>
                  <span class="detail-value">₹${refundData.originalAmount}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">💸 Processing Fee:</span>
                  <span class="detail-value">₹${refundData.processingFee}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">💵 Refund Amount:</span>
                  <span class="detail-value"><strong>₹${refundData.refundAmount}</strong></span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">📅 Requested On:</span>
                  <span class="detail-value">${new Date(refundData.createdAt).toLocaleDateString("en-US")}</span>
                </div>
              </div>
              
              <div class="status-timeline">
                <h3>📊 Refund Status: Processing</h3>
                <p>Your refund is currently being processed by our payment partner. Here's what happens next:</p>
                <ul>
                  <li>✅ <strong>Refund Initiated</strong> - Your request has been submitted</li>
                  <li>🔄 <strong>Processing</strong> - Payment gateway is processing the refund</li>
                  <li>⏳ <strong>Completion</strong> - Funds will be credited to your original payment method</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <p><strong>⏱️ Expected Timeline:</strong></p>
                <p>Refunds typically take 5-10 business days to appear in your account, depending on your bank or payment method.</p>
              </div>
              
              <div style="text-align: center; margin: 20px 0;">
                <p>Questions? Contact us at <strong>hyyevents@gmail.com</strong></p>
                <p>Reference your Refund ID: <strong>${refundData.refundId}</strong></p>
              </div>
            </div>
            
            <div class="footer">
              <p>Thank you for your understanding.</p>
              <p>This is an automated email. Please do not reply to this email.</p>
              <p>© 2025 Garba Rass. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // Generate refund completed email HTML
  generateRefundCompletedEmailHTML(userData, ticketData, refundData) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Refund Completed</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #10b981, #059669);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 30px;
            }
            .success-message {
              background: #d1fae5;
              border: 1px solid #6ee7b7;
              color: #065f46;
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 20px;
              text-align: center;
            }
            .refund-details {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              padding-bottom: 10px;
              border-bottom: 1px solid #eee;
            }
            .detail-row:last-child {
              border-bottom: none;
              margin-bottom: 0;
            }
            .detail-label {
              font-weight: bold;
              color: #666;
            }
            .detail-value {
              color: #333;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
            @media (max-width: 600px) {
              .container {
                margin: 10px;
              }
              .content {
                padding: 20px;
              }
              .detail-row {
                flex-direction: column;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Refund Completed</h1>
              <p>Your refund has been successfully processed</p>
            </div>
            
            <div class="content">
              <div class="success-message">
                <h2>🎉 Refund Successful!</h2>
                <p>Hello ${userData.name}, your refund for ${ticketData.eventName} has been completed successfully.</p>
              </div>
              
              <div class="refund-details">
                <h3>📋 Refund Summary</h3>
                <div class="detail-row">
                  <span class="detail-label">🆔 Refund ID:</span>
                  <span class="detail-value">${refundData.refundId}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">💵 Refunded Amount:</span>
                  <span class="detail-value"><strong>₹${refundData.refundAmount}</strong></span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">📅 Processed On:</span>
                  <span class="detail-value">${new Date(refundData.processedAt).toLocaleDateString("en-US")}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">⏱️ Processing Time:</span>
                  <span class="detail-value">${refundData.processingTime || 0} hours</span>
                </div>
              </div>
              
              <div style="background: #ecfdf5; border: 1px solid #6ee7b7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>💳 Payment Information</h3>
                <p>The refund amount of <strong>₹${refundData.refundAmount}</strong> has been credited back to your original payment method.</p>
                <p><strong>Note:</strong> It may take 5-10 business days for the amount to reflect in your account, depending on your bank or payment provider.</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <p>If you don't see the refund in your account within 10 business days, please contact your bank or payment provider.</p>
              </div>
              
              <div style="text-align: center; margin: 20px 0;">
                <p>Questions? Contact us at <strong>hyyevents@gmail.com</strong></p>
                <p>Reference your Refund ID: <strong>${refundData.refundId}</strong></p>
              </div>
            </div>
            
            <div class="footer">
              <p>Thank you for choosing Garba Rass 2025!</p>
              <p>This is an automated email. Please do not reply to this email.</p>
              <p>© 2025 Garba Rass. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // Generate refund failed email HTML
  generateRefundFailedEmailHTML(userData, ticketData, refundData) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Refund Failed</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #ef4444, #dc2626);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 30px;
            }
            .error-message {
              background: #fee2e2;
              border: 1px solid #fca5a5;
              color: #991b1b;
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 20px;
              text-align: center;
            }
            .refund-details {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              padding-bottom: 10px;
              border-bottom: 1px solid #eee;
            }
            .detail-row:last-child {
              border-bottom: none;
              margin-bottom: 0;
            }
            .detail-label {
              font-weight: bold;
              color: #666;
            }
            .detail-value {
              color: #333;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
            @media (max-width: 600px) {
              .container {
                margin: 10px;
              }
              .content {
                padding: 20px;
              }
              .detail-row {
                flex-direction: column;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❌ Refund Failed</h1>
              <p>There was an issue processing your refund</p>
            </div>
            
            <div class="content">
              <div class="error-message">
                <h2>⚠️ Refund Processing Failed</h2>
                <p>Hello ${userData.name}, unfortunately your refund request for ${ticketData.eventName} could not be processed automatically.</p>
              </div>
              
              <div class="refund-details">
                <h3>📋 Refund Details</h3>
                <div class="detail-row">
                  <span class="detail-label">🆔 Refund ID:</span>
                  <span class="detail-value">${refundData.refundId}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">💵 Refund Amount:</span>
                  <span class="detail-value">₹${refundData.refundAmount}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">❌ Failure Reason:</span>
                  <span class="detail-value">${refundData.failureReason || "Technical issue"}</span>
                </div>
              </div>
              
              <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>🔧 Next Steps</h3>
                <p>Don't worry! Our support team has been notified and will process your refund manually.</p>
                <ul>
                  <li>We will contact you within 24 hours</li>
                  <li>Manual processing typically takes 3-5 business days</li>
                  <li>You will receive confirmation once completed</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <p>For immediate assistance, contact us at <strong>hyyevents@gmail.com</strong></p>
                <p>Reference your Refund ID: <strong>${refundData.refundId}</strong></p>
              </div>
            </div>
            
            <div class="footer">
              <p>We apologize for the inconvenience.</p>
              <p>This is an automated email. Please do not reply to this email.</p>
              <p>© 2025 Garba Rass. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  calculateSavings(quantity, eventData) {
    const individualPrice = eventData.ticketPrice;
    let actualPrice, tier;

    if (quantity >= 4) {
      actualPrice = eventData.groupPrice4;
      tier = "as a group of 4+";
    } else {
      actualPrice = individualPrice;
      tier = "";
    }

    const savings = individualPrice - actualPrice;
    return {
      amount: Math.max(0, savings),
      tier: tier,
    };
  }

  async sendTicketPurchaseEmail(
    userData,
    ticketData,
    eventData,
    totalAmount,
    quantity
  ) {
    try {
      if (process.env.NODE_ENV === "development") {
        console.log("📧 Starting email send process...");
      }

      if (!this.transporter) {
        throw new Error(
          "Email service not initialized - check EMAIL_USER and EMAIL_PASS environment variables"
        );
      }

      if (process.env.NODE_ENV === "development") {
        console.log(
          `📧 Sending purchase confirmation email to ${userData.email}`
        );
      }

      const attachments = [];
      const maxRetries = 3; // Increased retries

      for (let i = 0; i < ticketData.length; i++) {
        const ticket = ticketData[i];
        if (process.env.NODE_ENV === "development") {
          console.log(
            `📄 Generating PDF for ticket ${i + 1}/${ticketData.length}: ${
              ticket.ticketId
            }`
          );
        }

        let pdfGenerated = false;
        let retryCount = 0;

        while (!pdfGenerated && retryCount < maxRetries) {
          try {
            const pdfBuffer = await this.generateTicketPDF(ticket, eventData);

            if (!pdfBuffer || pdfBuffer.length === 0) {
              throw new Error("Generated PDF buffer is empty");
            }

            attachments.push({
              filename: `garba-ticket-${ticket.ticketId}.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
            });

            if (process.env.NODE_ENV === "development") {
              console.log(
                `✅ PDF generated for ticket ${ticket.ticketId} (${pdfBuffer.length} bytes)`
              );
            }

            pdfGenerated = true;
          } catch (pdfError) {
            retryCount++;
            console.error(
              `Failed to generate PDF for ticket ${ticket.ticketId} (attempt ${retryCount}/${maxRetries}):`,
              pdfError.message
            );

            if (retryCount < maxRetries) {
              // Wait longer before retry, especially for resource-related errors
              const waitTime =
                pdfError.message.includes("Target closed") ||
                pdfError.message.includes("Session closed") ||
                pdfError.message.includes("resource constraints")
                  ? 8000 * retryCount // Longer exponential backoff for severe errors
                  : 3000; // Shorter wait for other errors

              if (process.env.NODE_ENV === "development") {
                console.log(`⏳ Waiting ${waitTime}ms before retry...`);
              }

              await new Promise((resolve) => setTimeout(resolve, waitTime));
            }
          }
        }

        if (!pdfGenerated) {
          console.error(
            `❌ Failed to generate PDF for ticket ${ticket.ticketId} after ${maxRetries} attempts. Email will be sent without this PDF.`
          );
          // You might want to log this failure to a dedicated monitoring system
        }
      }

      // Check PDF generation results
      if (attachments.length === 0) {
        console.error(
          "⚠️ No PDF attachments generated for any ticket. Sending email without attachments."
        );
      } else if (attachments.length < ticketData.length) {
        console.warn(
          `⚠️ Only ${attachments.length}/${ticketData.length} PDF attachments generated successfully. Check logs for details.`
        );
      } else {
        if (process.env.NODE_ENV === "development") {
          console.log(
            `✅ All ${attachments.length} PDF attachments generated successfully`
          );
        }
      }

      const mailOptions = {
        from: {
          name: "Garba Rass 2025",
          address: process.env.EMAIL_USER,
        },
        to: userData.email,
        subject: "🎉 Ticket Confirmation - Garba Rass 2025",
        html: this.generatePurchaseEmailHTML(
          userData,
          ticketData,
          eventData,
          totalAmount,
          quantity
        ),
        attachments: attachments,
      };

      if (process.env.NODE_ENV === "development") {
        console.log("📤 Sending email with options:", {
          from: mailOptions.from,
          to: mailOptions.to,
          subject: mailOptions.subject,
          attachmentCount: mailOptions.attachments.length,
        });
      }

      const result = await this.transporter.sendMail(mailOptions);
      if (process.env.NODE_ENV === "development") {
        console.log(
          "✅ Purchase confirmation email sent successfully:",
          result.messageId,
          `with ${attachments.length} PDF attachments`
        );
      }
      return { ...result, attachmentCount: attachments.length };
    } catch (error) {
      console.error(
        "Failed to send purchase confirmation email:",
        process.env.NODE_ENV === "development" ? error : error.message
      );
      throw error;
    }
  }

  async sendTicketCancellationEmail(userData, ticketData, eventData) {
    try {
      if (process.env.NODE_ENV === "development") {
        console.log("📧 Starting cancellation email send process...");
      }

      if (!this.transporter) {
        throw new Error(
          "Email service not initialized - check EMAIL_USER and EMAIL_PASS environment variables"
        );
      }

      if (process.env.NODE_ENV === "development") {
        console.log(`📧 Sending cancellation email to ${userData.email}`);
      }

      const mailOptions = {
        from: {
          name: "Garba Rass 2025",
          address: process.env.EMAIL_USER,
        },
        to: userData.email,
        subject: "❌ Ticket Cancellation - Garba Rass 2025",
        html: this.generateCancellationEmailHTML(
          userData,
          ticketData,
          eventData
        ),
      };

      if (process.env.NODE_ENV === "development") {
        console.log("📤 Sending cancellation email with options:", {
          from: mailOptions.from,
          to: mailOptions.to,
          subject: mailOptions.subject,
        });
      }

      const result = await this.transporter.sendMail(mailOptions);
      if (process.env.NODE_ENV === "development") {
        console.log(
          "✅ Cancellation email sent successfully:",
          result.messageId
        );
      }
      return result;
    } catch (error) {
      console.error(
        "Failed to send cancellation email:",
        process.env.NODE_ENV === "development" ? error : error.message
      );
      throw error;
    }
  }

  // Send refund initiated email
  async sendRefundInitiatedEmail(userData, ticketData, refundData) {
    try {
      if (!this.transporter) {
        throw new Error("Email service not initialized");
      }

      const mailOptions = {
        from: {
          name: "Garba Rass 2025",
          address: process.env.EMAIL_USER,
        },
        to: userData.email,
        subject: "🔄 Refund Initiated - Garba Rass 2025",
        html: this.generateRefundInitiatedEmailHTML(userData, ticketData, refundData),
      };

      const result = await this.transporter.sendMail(mailOptions);
      if (process.env.NODE_ENV === "development") {
        console.log("✅ Refund initiated email sent:", result.messageId);
      }
      return result;
    } catch (error) {
      console.error("Failed to send refund initiated email:", error);
      throw error;
    }
  }

  // Send refund completed email
  async sendRefundCompletedEmail(userData, ticketData, refundData) {
    try {
      if (!this.transporter) {
        throw new Error("Email service not initialized");
      }

      const mailOptions = {
        from: {
          name: "Garba Rass 2025",
          address: process.env.EMAIL_USER,
        },
        to: userData.email,
        subject: "✅ Refund Completed - Garba Rass 2025",
        html: this.generateRefundCompletedEmailHTML(userData, ticketData, refundData),
      };

      const result = await this.transporter.sendMail(mailOptions);
      if (process.env.NODE_ENV === "development") {
        console.log("✅ Refund completed email sent:", result.messageId);
      }
      return result;
    } catch (error) {
      console.error("Failed to send refund completed email:", error);
      throw error;
    }
  }

  // Send refund failed email
  async sendRefundFailedEmail(userData, ticketData, refundData) {
    try {
      if (!this.transporter) {
        throw new Error("Email service not initialized");
      }

      const mailOptions = {
        from: {
          name: "Garba Rass 2025",
          address: process.env.EMAIL_USER,
        },
        to: userData.email,
        subject: "❌ Refund Processing Issue - Garba Rass 2025",
        html: this.generateRefundFailedEmailHTML(userData, ticketData, refundData),
      };

      const result = await this.transporter.sendMail(mailOptions);
      if (process.env.NODE_ENV === "development") {
        console.log("✅ Refund failed email sent:", result.messageId);
      }
      return result;
    } catch (error) {
      console.error("Failed to send refund failed email:", error);
      throw error;
    }
  }

  // Generic method for future email triggers
  async sendCustomEmail(to, subject, htmlContent, attachments = []) {
    try {
      if (!this.transporter) {
        throw new Error("Email service not initialized");
      }

      const mailOptions = {
        from: {
          name: "Garba Rass 2025",
          address: process.env.EMAIL_USER,
        },
        to: to,
        subject: subject,
        html: htmlContent,
        attachments: attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      if (process.env.NODE_ENV === "development") {
        console.log("✅ Custom email sent successfully:", result.messageId);
      }
      return result;
    } catch (error) {
      console.error(
        "Failed to send custom email:",
        process.env.NODE_ENV === "development" ? error : error.message
      );
      throw error;
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;