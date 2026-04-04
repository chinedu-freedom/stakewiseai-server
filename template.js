export function emailTemplate(content) {
  return `
  <div style="
    max-width: 600px;
    margin: auto;
    font-family: Arial, sans-serif;
    border: 1px solid #e5e5e5;
    border-radius: 10px;
    overflow: hidden;
    background-color: #ffffff;
  ">
  
    <div style="
      background-color: #0b132b;
      padding: 20px;
      text-align: center;
    ">
      <h2 style="color: #ffffff; margin: 0; font-size: 24px;">Prime Chain</h2>
      <p style="color: #ffffff; margin: 5px 0 0; font-size: 14px;">Simple. Secure. Smart Investing.</p>
    </div>

    <div style="
      padding: 20px 30px 10px 30px;
      font-size: 14px;
      line-height: 1.5;
      color: #333333;
    ">
      ${content}
    </div>

    <div style="
      background-color: #f9f9f9;
      padding: 15px;
      text-align: center;
      font-size: 12px;
      color: #888888;
    ">
      <p style="margin: 0;">&copy; ${new Date().getFullYear()} Prime Chain. All rights reserved.</p>
      <p style="margin: 4px 0 0;">Your trusted investment partner.</p>
    </div>

  </div>
  `;
}