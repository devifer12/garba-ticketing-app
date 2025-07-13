const nodemailer = require("nodemailer");
let puppeteer;
let chromium;
if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION) {
  chromium = require("chrome-aws-lambda");
  puppeteer = require("puppeteer-core");
} else {
  puppeteer = require("puppeteer-core");
}
const QRCode = require("qrcode");

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
          "Email credentials not configured. EMAIL_USER and EMAIL_PASS environment variables are required.",
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
          process.env.EMAIL_USER,
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
              err.message,
            );
          }
        });
    } catch (error) {
      console.error(
        "Failed to initialize email service:",
        process.env.NODE_ENV === "development" ? error : error.message,
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
        process.env.NODE_ENV === "development" ? error : error.message,
      );
      return false;
    }
  }

  async generateTicketPDF(ticketData, eventData) {
    let browser;
    let page;
    try {
      // Generate QR code first to avoid browser resource waste if this fails
      let qrCodeDataURL;
      try {
        qrCodeDataURL = await QRCode.toDataURL(ticketData.qrCode, {
          errorCorrectionLevel: "M",
          type: "image/png",
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
        // Use a fallback QR code or text
        qrCodeDataURL =
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
      }


      let puppeteerConfig;
      if (chromium) {
        puppeteerConfig = {
          args: chromium.args,
          executablePath: await chromium.executablePath,
          headless: chromium.headless,
          defaultViewport: chromium.defaultViewport,
          timeout: 60000,
        };
      } else {
        // Local/dev/other environments
        const fs = require("fs");
        const path = require("path");
        const chromePaths = [
          "/usr/bin/google-chrome-stable",
          "/usr/bin/google-chrome",
          "/usr/bin/chromium-browser",
          "/usr/bin/chromium",
          "/opt/google/chrome/chrome",
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        ];
        let chromeExecutablePath = null;
        for (const chromePath of chromePaths) {
          try {
            if (fs.existsSync(chromePath)) {
              chromeExecutablePath = chromePath;
              if (process.env.NODE_ENV === "development") {
                console.log(`✅ Found Chrome at: ${chromePath}`);
              }
              break;
            }
          } catch (err) {}
        }
        puppeteerConfig = {
          headless: "new",
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--disable-gpu",
            "--disable-web-security",
            "--disable-features=VizDisplayCompositor",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
            "--disable-ipc-flooding-protection",
            "--disable-hang-monitor",
            "--disable-prompt-on-repost",
            "--disable-domain-reliability",
            "--disable-component-extensions-with-background-pages",
          ],
          timeout: 60000,
          protocolTimeout: 60000,
        };
        if (chromeExecutablePath) {
          puppeteerConfig.executablePath = chromeExecutablePath;
        }
      }

      browser = await puppeteer.launch(puppeteerConfig);

      // Add browser disconnect handler
      browser.on("disconnected", () => {
        if (process.env.NODE_ENV === "development") {
          console.log("⚠️ Browser disconnected during PDF generation");
        }
      });

      page = await browser.newPage();

      // Set longer timeouts and viewport
      await page.setDefaultTimeout(60000);
      await page.setDefaultNavigationTimeout(60000);
      await page.setViewport({ width: 800, height: 1200 });

      // Add page error handlers
      page.on("error", (err) => {
        console.error("Page error during PDF generation:", err.message);
      });

      page.on("pageerror", (err) => {
        console.error("Page script error during PDF generation:", err.message);
      });

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Ticket - ${ticketData.ticketId}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: 'Arial', sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
                color: #333;
              }
              .ticket {
                background: white;
                border-radius: 20px;
                padding: 30px;
                max-width: 600px;
                margin: 0 auto;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                border: 3px solid #ff6500;
                min-height: 900px;
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
              }
              .header {
                text-align: center;
                margin-bottom: 24px;
                border-bottom: 2px dashed #ff6500;
                padding-bottom: 16px;
              }
              .event-title {
                font-size: 32px;
                font-weight: bold;
                color: #ff6500;
                margin-bottom: 8px;
              }
              .event-subtitle {
                font-size: 18px;
                color: #666;
                margin-bottom: 4px;
              }
              .qr-section {
                text-align: center;
                margin: 24px 0 16px 0;
                background: #f8f9fa;
                padding: 20px;
                border-radius: 15px;
              }
              .qr-code {
                margin: 20px 0;
              }
              .qr-code img {
                width: 180px;
                height: 180px;
                border: 3px solid #ff6500;
                border-radius: 10px;
              }
              .details-row {
                display: flex;
                gap: 20px;
                margin: 0 0 16px 0;
              }
              .detail-item {
                flex: 1;
                background: #f8f9fa;
                padding: 15px;
                border-radius: 10px;
                border-left: 4px solid #ff6500;
                min-width: 0;
              }
              .detail-label {
                font-weight: bold;
                color: #333;
                font-size: 14px;
                margin-bottom: 5px;
              }
              .detail-value {
                color: #666;
                font-size: 16px;
                word-break: break-word;
              }
              .instructions {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 10px;
                padding: 20px;
                margin: 24px 0 0 0;
                width: 100%;
              }
              .instructions h3 {
                color: #856404;
                margin-bottom: 10px;
              }
              .instructions ul {
                color: #856404;
                padding-left: 20px;
              }
              .instructions li {
                margin-bottom: 5px;
              }
              .footer {
                text-align: center;
                margin-top: 24px;
                padding-top: 16px;
                border-top: 2px dashed #ff6500;
                color: #666;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="ticket">
              <div class="header">
                <div class="event-title">Garba Rass</div>
                <div class="event-subtitle">${new Date(eventData.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
                <div class="event-subtitle">${eventData.startTime} - ${eventData.endTime}</div>
              </div>
              <div class="qr-section">
                <h3 style="color: #ffb300; margin-bottom: 10px;">🎫 Your Entry Pass</h3>
                <p style="color: #666; font-size: 14px; margin-bottom: 15px;">Present this QR code at the venue entrance</p>
                <div class="qr-code">
                  <img src="${qrCodeDataURL}" alt="QR Code" />
                </div>
                <p style="color: #666; font-size: 12px;">Scan this code for quick entry</p>
              </div>
              <div class="details-row">
                <div class="detail-item">
                  <div class="detail-label">📍 Venue</div>
                  <div class="detail-value">${eventData.venue}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">💰 Price Paid</div>
                  <div class="detail-value">₹${ticketData.price}</div>
                </div>
              </div>
              <div class="instructions">
                <h3>📋 Important Instructions:</h3>
                <ul>
                  <li>Arrive at the venue 30 minutes before the event starts</li>
                  <li>Present this QR code at the entrance for scanning</li>
                  <li>Keep this ticket safe and do not share with others</li>
                  <li>Entry is subject to venue capacity and safety guidelines</li>
                  <li>No outside food or beverages allowed</li>
                  <li>Follow the dress code: Traditional Indian attire preferred</li>
                </ul>
              </div>
              <div class="footer">
                <p>Thank you for choosing Garba Rass 2025! 🎉</p>
                <p>For support, contact us at hyyevents@gmail.com</p>
                <p>This is a computer-generated ticket. No signature required.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      // Set content with better error handling and longer timeout
      await page.setContent(htmlContent, {
        waitUntil: "networkidle0",
        timeout: 60000,
      });

      if (process.env.NODE_ENV === "development") {
        console.log("✅ HTML content loaded successfully");
      }

      // Wait a bit more to ensure everything is fully rendered
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check if page is still connected before generating PDF
      if (page.isClosed()) {
        throw new Error("Page was closed before PDF generation");
      }

      if (browser.isConnected && browser.isConnected() === false) {
        throw new Error("Browser disconnected before PDF generation");
      }

      // Generate PDF with enhanced options and error handling
      let pdfBuffer;
      try {
        pdfBuffer = await Promise.race([
          page.pdf({
            format: "A4",
            printBackground: true,
            preferCSSPageSize: false,
            displayHeaderFooter: false,
            margin: {
              top: "20px",
              right: "20px",
              bottom: "20px",
              left: "20px",
            },
          }),
          new Promise((_, reject) =>
            setTimeout(
              () =>
                reject(new Error("PDF generation timeout after 45 seconds")),
              45000,
            ),
          ),
        ]);
      } catch (pdfError) {
        if (
          pdfError.message.includes("Target closed") ||
          pdfError.message.includes("Session closed")
        ) {
          throw new Error(
            "Browser session closed during PDF generation - this may be due to system resource constraints",
          );
        }
        throw pdfError;
      }

      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error("Generated PDF buffer is empty or invalid");
      }

      if (process.env.NODE_ENV === "development") {
        console.log(
          "✅ PDF generated successfully, size:",
          pdfBuffer.length,
          "bytes",
        );
      }
      return pdfBuffer;
    } catch (error) {
      console.error(
        "Error generating PDF:",
        process.env.NODE_ENV === "development" ? error : error.message,
      );
      throw error;
    } finally {
      // Clean up resources in the correct order
      if (page && !page.isClosed()) {
        try {
          await page.close();
          if (process.env.NODE_ENV === "development") {
            console.log("✅ Page closed successfully");
          }
        } catch (closeError) {
          console.error("Error closing page:", closeError.message);
        }
      }

      if (browser && browser.isConnected && browser.isConnected()) {
        try {
          await browser.close();
          if (process.env.NODE_ENV === "development") {
            console.log("✅ Browser closed successfully");
          }
        } catch (closeError) {
          console.error("Error closing browser:", closeError.message);
        }
      }
    }
  }

  generatePurchaseEmailHTML(
    userData,
    ticketData,
    eventData,
    totalAmount,
    quantity,
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
                    eventData.date,
                  ).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🕐 Time:</span>
                  <span class="detail-value">${eventData.startTime} - ${eventData.endTime}</span>
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
              
              <div class="instructions">
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
            .refund-info {
              background: #d1ecf1;
              border: 1px solid #bee5eb;
              color: #0c5460;
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
              <h1>❌ Ticket Cancellation</h1>
              <p>Your ticket has been cancelled</p>
            </div>
            
            <div class="content">
              <div class="cancellation-message">
                <h2>🚫 Ticket Cancelled</h2>
                <p>Hello ${userData.name}, your ticket for ${eventData.name} has been cancelled.</p>
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
                    eventData.date,
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
                  <span class="detail-value">${new Date().toLocaleDateString("en-US")}</span>
                </div>
              </div>
              
              <div class="refund-info">
                <h3>💳 Refund Information</h3>
                <p><strong>Refund Amount:</strong> ₹${ticketData.price}</p>
                <p><strong>Processing Time:</strong> 5-7 business days</p>
                <p><strong>Refund Method:</strong> Original payment method</p>
                <p>You will receive a separate email confirmation once the refund is processed.</p>
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
    quantity,
  ) {
    try {
      if (process.env.NODE_ENV === "development") {
        console.log("📧 Starting email send process...");
      }

      if (!this.transporter) {
        throw new Error(
          "Email service not initialized - check EMAIL_USER and EMAIL_PASS environment variables",
        );
      }

      if (process.env.NODE_ENV === "development") {
        console.log(
          `📧 Sending purchase confirmation email to ${userData.email}`,
        );
      }

      // Generate PDF attachments for each ticket with better error handling
      const attachments = [];
      const maxRetries = 2;

      for (let i = 0; i < ticketData.length; i++) {
        const ticket = ticketData[i];
        if (process.env.NODE_ENV === "development") {
          console.log(
            `📄 Generating PDF for ticket ${i + 1}/${ticketData.length}: ${ticket.ticketId}`,
          );
        }

        let pdfGenerated = false;
        let retryCount = 0;

        while (!pdfGenerated && retryCount < maxRetries) {
          try {
            const pdfBuffer = await this.generateTicketPDF(ticket, eventData);

            // Validate PDF buffer
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
                `✅ PDF generated for ticket ${ticket.ticketId} (${pdfBuffer.length} bytes)`,
              );
            }

            pdfGenerated = true;
          } catch (pdfError) {
            retryCount++;
            console.error(
              `Failed to generate PDF for ticket ${ticket.ticketId} (attempt ${retryCount}/${maxRetries}):`,
              pdfError.message,
            );

            if (retryCount < maxRetries) {
              // Wait longer before retry, especially for resource-related errors
              const waitTime =
                pdfError.message.includes("Target closed") ||
                pdfError.message.includes("Session closed") ||
                pdfError.message.includes("resource constraints")
                  ? 5000
                  : 2000;

              if (process.env.NODE_ENV === "development") {
                console.log(`⏳ Waiting ${waitTime}ms before retry...`);
              }

              await new Promise((resolve) => setTimeout(resolve, waitTime));
            }
          }
        }

        if (!pdfGenerated) {
          console.error(
            `❌ Failed to generate PDF for ticket ${ticket.ticketId} after ${maxRetries} attempts`,
          );
        }
      }

      // Check PDF generation results
      if (attachments.length === 0) {
        console.error(
          "⚠️ No PDF attachments generated, sending email without attachments",
        );
      } else if (attachments.length < ticketData.length) {
        console.warn(
          `⚠️ Only ${attachments.length}/${ticketData.length} PDF attachments generated successfully`,
        );
      } else {
        if (process.env.NODE_ENV === "development") {
          console.log(
            `✅ All ${attachments.length} PDF attachments generated successfully`,
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
          quantity,
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
          `with ${attachments.length} PDF attachments`,
        );
      }
      return { ...result, attachmentCount: attachments.length };
    } catch (error) {
      console.error(
        "Failed to send purchase confirmation email:",
        process.env.NODE_ENV === "development" ? error : error.message,
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
          "Email service not initialized - check EMAIL_USER and EMAIL_PASS environment variables",
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
          eventData,
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
          result.messageId,
        );
      }
      return result;
    } catch (error) {
      console.error(
        "Failed to send cancellation email:",
        process.env.NODE_ENV === "development" ? error : error.message,
      );
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
        process.env.NODE_ENV === "development" ? error : error.message,
      );
      throw error;
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;