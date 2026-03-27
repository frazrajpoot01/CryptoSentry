import nodemailer from 'nodemailer';

// ✅ Create transporter ONCE outside to reuse the connection (prevents Gmail "bot" flagging)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendWelcomeEmail(userEmail: string, name: string) {
  try {
    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const mailOptions = {
      from: `"BitBash Sentry" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      // ✅ Slightly more personal subject line
      subject: `Welcome to BitBash, ${name}: Your Terminal is Ready`,

      // ✅ CRITICAL FIX: Add Plain Text version for spam filters
      text: `Welcome to Terminal One, ${name}. Your real-time crypto intelligence aggregate is now live. Access your dashboard here: ${appUrl}`,

      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #050505; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #050505; padding: 40px 20px;">
            <tr>
              <td align="center">
                
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #0a0a0a; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; text-align: left;">
                  
                  <tr>
                    <td style="padding: 30px 40px; border-bottom: 1px solid #18181b;">
                      <h1 style="margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 24px; color: #ffffff; letter-spacing: 2px;">
                        BITBASH <span style="font-size: 12px; color: #22c55e; vertical-align: middle;">SENTRY V4</span>
                      </h1>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 40px;">
                      
                      <div style="display: inline-block; background-color: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); color: #22c55e; font-family: 'Courier New', Courier, monospace; font-size: 12px; font-weight: bold; padding: 6px 14px; border-radius: 9999px; margin-bottom: 24px; letter-spacing: 1px;">
                        <span style="display: inline-block; width: 8px; height: 8px; background-color: #22c55e; border-radius: 50%; margin-right: 6px;"></span>
                        ACCOUNT INITIALIZED
                      </div>

                      <h2 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 600; color: #ffffff;">
                        Welcome to Terminal One, ${name}.
                      </h2>

                      <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                        Your real-time intelligence aggregate is now live. Your account has been successfully provisioned and secured on our network.
                      </p>

                      <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; margin: 0 0 32px 0;">
                        You can now build your priority watchlist, monitor global market caps, and track asset volatility without interruption.
                      </p>

                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="background-color: #22c55e; border-radius: 6px;">
                            <a href="${appUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-family: 'Courier New', Courier, monospace; font-weight: bold; font-size: 14px; color: #000000; text-decoration: none; letter-spacing: 1px;">
                              ACCESS DASHBOARD
                            </a>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 24px 40px; background-color: #050505; border-top: 1px solid #18181b; text-align: center;">
                      <p style="margin: 0 0 8px 0; color: #52525b; font-size: 11px; font-family: 'Courier New', Courier, monospace; text-transform: uppercase; letter-spacing: 1px;">
                        Automated message from BitBash Protocol
                      </p>
                      <p style="margin: 0; color: #3f3f46; font-size: 11px; font-family: 'Courier New', Courier, monospace;">
                        Do not reply directly to this transmission.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>

        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully!', info.messageId);
    return true;
  } catch (error) {
    console.error('Nodemailer Error:', error);
    return false;
  }
}