import mammoth from 'mammoth';

export async function convertDocxToEmailHtml(arrayBuffer: ArrayBuffer, fileName = 'document.docx'): Promise<string> {
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const rawBody = result.value || '<p>Document Word vide</p>';

  const docTitle = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

  // Wrap in a bulletproof, responsive 600px email container
  const emailHtml = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${docTitle}</title>
  <style type="text/css">
    body { margin: 0; padding: 0; min-width: 100%; font-family: Arial, Helvetica, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #f4f6f8; color: #1e293b; }
    table { border-collapse: collapse; }
    img { border: 0; outline: none; text-decoration: none; max-width: 100%; height: auto; }
    a { color: #2563eb; text-decoration: underline; }
    h1 { font-size: 26px; line-height: 32px; margin-top: 0; margin-bottom: 16px; color: #0f172a; font-weight: 700; }
    h2 { font-size: 20px; line-height: 26px; margin-top: 24px; margin-bottom: 12px; color: #1e293b; font-weight: 600; }
    h3 { font-size: 16px; line-height: 22px; margin-top: 18px; margin-bottom: 8px; color: #334155; font-weight: 600; }
    p { font-size: 15px; line-height: 24px; margin-top: 0; margin-bottom: 14px; color: #475569; }
    ul, ol { margin-top: 0; margin-bottom: 14px; padding-left: 24px; color: #475569; font-size: 15px; line-height: 24px; }
    li { margin-bottom: 6px; }
    blockquote { border-left: 3px solid #cbd5e1; margin: 16px 0; padding-left: 14px; color: #64748b; font-style: italic; }
    table.content-table { width: 100%; border: 1px solid #e2e8f0; margin-bottom: 16px; }
    table.content-table td, table.content-table th { padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 14px; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8;">
  <center style="width: 100%; background-color: #f4f6f8; padding: 30px 0;">
    <!--[if (gte mso 9)|(IE)]>
    <table width="600" align="center" cellpadding="0" cellspacing="0" border="0">
      <tr><td>
    <![endif]-->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
      <!-- Header Banner / Document Title -->
      <tr>
        <td style="padding: 28px 36px 20px 36px; border-bottom: 1px solid #f1f5f9; background-color: #ffffff;">
          <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6366f1; margin-bottom: 4px;">Document Importé (Word DOCX)</div>
          <div style="font-size: 20px; font-weight: bold; color: #0f172a;">${docTitle}</div>
        </td>
      </tr>
      <!-- Main Content Area -->
      <tr>
        <td style="padding: 32px 36px 36px 36px; line-height: 24px;">
          ${rawBody}
        </td>
      </tr>
      <!-- Email Footer -->
      <tr>
        <td style="padding: 24px 36px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; line-height: 18px;">
          <p style="margin: 0 0 6px 0; color: #64748b; font-size: 13px;">Généré avec précision par Courrier Studio</p>
          <p style="margin: 0;">Vous recevez cet email car vous êtes inscrit sur notre plateforme. <a href="#" style="color: #6366f1; text-decoration: underline;">Se désabonner</a></p>
        </td>
      </tr>
    </table>
    <!--[if (gte mso 9)|(IE)]>
      </td></tr>
    </table>
    <![endif]-->
  </center>
</body>
</html>`;

  return emailHtml;
}
