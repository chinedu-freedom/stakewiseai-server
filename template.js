export function emailTemplate(content) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blockvextrade</title>
  </head>
  <body style="margin: 0; padding: 24px 12px; background-color: #040605; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <div style="
      max-width: 580px;
      margin: 0 auto;
      border: 1px solid #00ff00;
      border-radius: 16px;
      overflow: hidden;
      background-color: #000000;
      box-shadow: 0 8px 32px rgba(0, 255, 0, 0.18);
    ">
    
      <!-- HEADER (GREEN & BLACK) -->
      <div style="
        background: #000000;
        padding: 32px 20px;
        text-align: center;
        border-bottom: 2px solid #00ff00;
      ">
        <h1 style="color: #00ff00; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 2.5px; text-transform: uppercase;">
          BLOCKVEXTRADE
        </h1>
        <p style="color: #ffffff; margin: 8px 0 0; font-size: 11px; opacity: 0.85; text-transform: uppercase; letter-spacing: 3px; font-weight: 600;">
          TECH &bull; SECURE &bull; SMART
        </p>
      </div>

      <!-- BODY CONTENT -->
      <div style="
        padding: 35px 28px;
        font-size: 15px;
        line-height: 1.6;
        color: #d1d5db;
        background-color: #000000;
      ">
        ${content}
      </div>

      <!-- FOOTER -->
      <div style="
        background-color: #080c09;
        padding: 24px 20px;
        text-align: center;
        font-size: 12px;
        color: #9ca3af;
        border-top: 1px solid #14241a;
      ">
        <p style="margin: 0; font-weight: 600; color: #ffffff;">
          &copy; ${new Date().getFullYear()} <span style="color: #00ff00;">Blockvextrade</span>. All rights reserved.
        </p>
        <p style="margin: 6px 0 0; color: #6b7280; font-size: 12px;">
          Leading the Future of AI-Powered Computing & Staking.
        </p>
        <div style="margin-top: 12px;">
          <p style="margin: 0; font-size: 11px; color: #4b5563;">
            You are receiving this email because you registered on our platform.
          </p>
        </div>
      </div>

    </div>
  </body>
  </html>
  `;
}
