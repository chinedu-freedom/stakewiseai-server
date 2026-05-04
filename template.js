export function emailTemplate(content) {
  return `
  <div style="
    max-width: 600px;
    margin: auto;
    font-family: 'Poppins', Arial, sans-serif;
    border: 1px solid #e5e5e5;
    border-radius: 16px;
    overflow: hidden;
    background-color: #ffffff;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  ">
  
    <div style="
      background: linear-gradient(135deg, #4f8cff, #6ee7ff);
      padding: 30px 20px;
      text-align: center;
    ">
      <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 1px;">STAKEWISEAI</h2>
      <p style="color: #ffffff; margin: 8px 0 0; font-size: 13px; opacity: 0.9; text-transform: uppercase; letter-spacing: 2px;">TECH • SECURE • SMART</p>
    </div>

    <div style="
      padding: 35px 30px 20px 30px;
      font-size: 15px;
      line-height: 1.6;
      color: #374151;
    ">
      ${content}
    </div>

    <div style="
      background-color: #f0f4f8;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    ">
      <p style="margin: 0; font-weight: 600;">&copy; ${new Date().getFullYear()} STAKEWISEAI. All rights reserved.</p>
      <p style="margin: 6px 0 0;">Leading the Future of Computing Power.</p>
      <div style="margin-top: 12px;">
        <p style="margin: 0; font-size: 11px; opacity: 0.8;">You are receiving this email because you registered on our platform.</p>
      </div>
    </div>

  </div>
  `;
}