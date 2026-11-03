export interface ImageImportOptions {
  fileName: string;
  dataUrl: string;
  width: number;
  height: number;
  imageType: 'hero' | 'logo' | 'creative' | 'card';
  title?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export function reconstructImageToEmailHtml(options: ImageImportOptions): string {
  const { fileName, dataUrl, width, height, imageType, title = 'Nouveau Visuel', ctaText = 'En savoir plus', ctaUrl = 'https://example.com' } = options;

  // Calculate clean display width (max 600px for email)
  const displayWidth = Math.min(width, 560);
  const displayHeight = Math.round((height / width) * displayWidth);

  if (imageType === 'logo') {
    const logoWidth = Math.min(width, 180);
    const logoHeight = Math.round((height / width) * logoWidth);

    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: Arial, Helvetica, sans-serif; color: #1e293b;">
  <center style="width: 100%; background-color: #f8fafc; padding: 36px 0;">
    <!--[if (gte mso 9)|(IE)]>
    <table width="600" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td>
    <![endif]-->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
      <!-- Logo Header -->
      <tr>
        <td style="padding: 32px 36px 20px 36px; text-align: left;">
          <img src="${dataUrl}" alt="Logo" width="${logoWidth}" height="${logoHeight}" style="display: block; max-width: ${logoWidth}px; height: auto; border: 0;" />
        </td>
      </tr>
      <!-- Heading & Text -->
      <tr>
        <td style="padding: 10px 36px 24px 36px;">
          <h1 style="font-size: 24px; line-height: 32px; color: #0f172a; margin: 0 0 16px 0; font-weight: bold;">${title}</h1>
          <p style="font-size: 15px; line-height: 24px; color: #475569; margin: 0 0 20px 0;">
            Voici votre message d'information. Vous pouvez éditer ce texte directement dans le canvas ou modifier ses propriétés dans le panneau latéral.
          </p>
          <!-- CTA Button -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td style="border-radius: 6px; background-color: #2563eb; text-align: center;">
                <a href="${ctaUrl}" style="background-color: #2563eb; border: 1px solid #2563eb; font-family: Arial, sans-serif; font-size: 15px; line-height: 15px; font-weight: bold; text-decoration: none; padding: 14px 28px; color: #ffffff; border-radius: 6px; display: inline-block;">${ctaText} &rarr;</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td style="padding: 24px 36px; background-color: #f1f5f9; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0 0 4px 0;">Logo extrait avec conservation intégrale des proportions.</p>
          <p style="margin: 0;"><a href="#" style="color: #2563eb; text-decoration: underline;">Se désinscrire</a></p>
        </td>
      </tr>
    </table>
    <!--[if (gte mso 9)|(IE)]>
    </td></tr></table>
    <![endif]-->
  </center>
</body>
</html>`;
  }

  // Hero / Banner or Creative Template
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: Arial, Helvetica, sans-serif;">
  <center style="width: 100%; background-color: #0f172a; padding: 32px 0;">
    <!--[if (gte mso 9)|(IE)]>
    <table width="600" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td>
    <![endif]-->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
      <!-- Full-Width Hero Visual -->
      <tr>
        <td style="padding: 0; text-align: center; background-color: #000000;">
          <img src="${dataUrl}" alt="${fileName}" width="${displayWidth}" height="${displayHeight}" style="display: block; width: 100%; max-width: 100%; height: auto; border: 0;" />
        </td>
      </tr>
      <!-- Editorial Copy -->
      <tr>
        <td style="padding: 36px 36px 20px 36px; text-align: center;">
          <h1 style="font-size: 26px; line-height: 34px; color: #0f172a; margin: 0 0 14px 0; font-weight: bold;">${title}</h1>
          <p style="font-size: 15px; line-height: 24px; color: #475569; margin: 0 0 24px 0; max-width: 480px; margin-left: auto; margin-right: auto;">
            Votre visuel importé a été positionné au cœur de cette maquette email. Personnalisez les textes, liens et couleurs avec notre éditeur visuel direct.
          </p>
          <!-- Call to action button -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 10px auto;">
            <tr>
              <td style="border-radius: 6px; background-color: #0f172a; text-align: center;">
                <a href="${ctaUrl}" style="background-color: #0f172a; border: 1px solid #0f172a; font-family: Arial, sans-serif; font-size: 15px; line-height: 15px; font-weight: bold; text-decoration: none; padding: 14px 32px; color: #ffffff; border-radius: 6px; display: inline-block;">${ctaText}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Minimalist Clean Footer -->
      <tr>
        <td style="padding: 24px 36px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0 0 6px 0;">Fidélité visuelle garantie &bull; Image originale préservée à 100%</p>
          <p style="margin: 0;"><a href="#" style="color: #64748b; text-decoration: underline;">Préférences d'envoi</a> &bull; <a href="#" style="color: #64748b; text-decoration: underline;">Désinscription</a></p>
        </td>
      </tr>
    </table>
    <!--[if (gte mso 9)|(IE)]>
    </td></tr></table>
    <![endif]-->
  </center>
</body>
</html>`;
}
