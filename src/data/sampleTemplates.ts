import { TemplateDefinition } from '../types/editor';

export const SAMPLE_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'launch-tech',
    name: 'Lancement Produit & SaaS',
    category: 'Marketing',
    description: 'Template moderne à fort impact avec logo, grand titre, grille de fonctionnalités et bouton CTA optimisé.',
    thumbnail: '🚀',
    metadata: {
      subject: '🚀 Découvrez la nouvelle version 3.0 de notre plateforme',
      preheader: 'Des performances décuplées et une interface repensée pour vos équipes.',
      senderName: 'L\'équipe Produit',
      senderEmail: 'hello@entreprise.io',
    },
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Lancement Produit v3.0</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: 'Segoe UI', Arial, sans-serif; color: #f8fafc;">
  <center style="width: 100%; background-color: #0b0f19; padding: 40px 0;">
    <!--[if (gte mso 9)|(IE)]>
    <table width="600" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td>
    <![endif]-->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #111827; border-radius: 12px; overflow: hidden; border: 1px solid #1f2937;">
      
      <!-- Logo Bar -->
      <tr>
        <td style="padding: 32px 40px 24px 40px; text-align: left; border-bottom: 1px solid #1f2937;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="left">
                <span style="font-size: 20px; font-weight: 800; letter-spacing: -0.03em; color: #ffffff;">VERTEX<span style="color: #6366f1;">.</span>IO</span>
              </td>
              <td align="right">
                <span style="font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Édition Spéciale</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Hero Section -->
      <tr>
        <td style="padding: 44px 40px 24px 40px; text-align: center;">
          <div style="display: inline-block; padding: 6px 14px; background-color: #1e1b4b; border: 1px solid #3730a3; border-radius: 20px; font-size: 12px; font-weight: 600; color: #a5b4fc; margin-bottom: 20px;">
            NOUVELLE MISE À JOUR DISPONIBLE
          </div>
          <h1 style="font-size: 32px; line-height: 40px; font-weight: 800; color: #ffffff; margin: 0 0 16px 0; letter-spacing: -0.02em;">
            La puissance du cloud,<br /><span style="color: #818cf8;">la vitesse de la lumière.</span>
          </h1>
          <p style="font-size: 16px; line-height: 26px; color: #94a3b8; margin: 0 0 32px 0; max-width: 480px; margin-left: auto; margin-right: auto;">
            Après six mois de développement intensif, nous dévoilons aujourd'hui notre nouveau moteur de traitement temps-réel avec synchronisation instantanée.
          </p>
          
          <!-- Primary CTA Button -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 36px auto;">
            <tr>
              <td style="border-radius: 8px; background-color: #4f46e5; text-align: center;">
                <a href="https://example.com/demo" style="background-color: #4f46e5; border: 1px solid #4f46e5; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 34px; color: #ffffff; border-radius: 8px; display: inline-block; letter-spacing: -0.01em;">
                  Tester gratuitement la version 3.0 &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Visual Preview Box -->
      <tr>
        <td style="padding: 0 40px 32px 40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #1a2234; border: 1px solid #2d3748; border-radius: 8px; overflow: hidden;">
            <tr>
              <td style="padding: 24px; text-align: center;">
                <div style="font-size: 14px; font-weight: 600; color: #38bdf8; margin-bottom: 8px;">BENCHMARK OFFICIEL</div>
                <div style="font-size: 40px; font-weight: 900; color: #ffffff; line-height: 44px; margin-bottom: 4px;">+400%</div>
                <div style="font-size: 13px; color: #94a3b8;">de rapidité sur les requêtes volumineuses</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- 2-Column Feature Highlights -->
      <tr>
        <td style="padding: 10px 40px 36px 40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="48%" valign="top" style="background-color: #151d2f; border: 1px solid #243048; border-radius: 8px; padding: 20px;">
                <div style="font-size: 15px; font-weight: 700; color: #ffffff; margin-bottom: 8px;">Synchronisation Zero-Lag</div>
                <div style="font-size: 13px; line-height: 20px; color: #94a3b8;">Vos données sont répliquées sur 14 points de présence mondiaux en moins de 18ms.</div>
              </td>
              <td width="4%">&nbsp;</td>
              <td width="48%" valign="top" style="background-color: #151d2f; border: 1px solid #243048; border-radius: 8px; padding: 20px;">
                <div style="font-size: 15px; font-weight: 700; color: #ffffff; margin-bottom: 8px;">Sécurité Chiffrée de Bout en Bout</div>
                <div style="font-size: 13px; line-height: 20px; color: #94a3b8;">Conformité SOC2 Type II et chiffrement AES-256 garanti sur chaque enregistrement.</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding: 28px 40px; background-color: #0b0f19; border-top: 1px solid #1f2937; text-align: center; font-size: 12px; color: #64748b; line-height: 20px;">
          <p style="margin: 0 0 8px 0; color: #94a3b8;">&copy; 2026 Vertex Technologies Inc. 104 Rue du Faubourg, 75008 Paris.</p>
          <p style="margin: 0;">
            <a href="#" style="color: #6366f1; text-decoration: none;">Préférences</a> &bull; 
            <a href="#" style="color: #6366f1; text-decoration: none;">Documentation</a> &bull; 
            <a href="#" style="color: #64748b; text-decoration: underline;">Se désabonner</a>
          </p>
        </td>
      </tr>

    </table>
    <!--[if (gte mso 9)|(IE)]>
    </td></tr></table>
    <![endif]-->
  </center>
</body>
</html>`,
  },
  {
    id: 'editorial-newsletter',
    name: 'Newsletter Éditoriale & Insights',
    category: 'Contenu',
    description: 'Design soigné type Substack / Medium, optimisé pour la lecture longue, avec citation mise en valeur et profil auteur.',
    thumbnail: '📰',
    metadata: {
      subject: 'Lettre Hebdomadaire #42 : Le Futur du Design Numérique',
      preheader: 'Comment repenser l\'expérience utilisateur sans tomber dans les pièges de l\'uniformisation.',
      senderName: 'Alexandre de La Revue',
      senderEmail: 'alex@larevue-design.fr',
    },
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>La Revue du Design #42</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: Georgia, 'Times New Roman', serif; color: #1e293b;">
  <center style="width: 100%; background-color: #f8fafc; padding: 36px 0;">
    <!--[if (gte mso 9)|(IE)]>
    <table width="600" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td>
    <![endif]-->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 4px; overflow: hidden; border: 1px solid #e2e8f0;">
      
      <!-- Issue & Date Kicker -->
      <tr>
        <td style="padding: 32px 40px 16px 40px; border-bottom: 2px solid #0f172a; text-align: left;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <div style="font-family: Arial, sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #64748b; margin-bottom: 4px;">ÉDITION DU JEUDI</div>
                <div style="font-size: 26px; font-weight: bold; color: #0f172a; font-family: Georgia, serif; letter-spacing: -0.01em;">LA REVUE DU DESIGN</div>
              </td>
              <td align="right" valign="bottom">
                <span style="font-family: Arial, sans-serif; font-size: 12px; color: #64748b;">N° 42 &bull; 6 min de lecture</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Main Headline -->
      <tr>
        <td style="padding: 32px 40px 16px 40px;">
          <h1 style="font-family: Georgia, serif; font-size: 28px; line-height: 36px; color: #0f172a; margin: 0 0 16px 0; font-weight: 700;">
            L'illusion de la simplicité et la redécouverte du détail artisanal
          </h1>
          <p style="font-family: Arial, sans-serif; font-size: 16px; line-height: 26px; color: #334155; margin: 0 0 20px 0;">
            Chaque époque produit ses propres dogmes visuels. À force de simplifier, d'épurer et d'automatiser nos outils, nous avons parfois sacrifié l'identité sensible au profit d'une conformité rassurante.
          </p>
        </td>
      </tr>

      <!-- Editorial Quote Callout -->
      <tr>
        <td style="padding: 0 40px 24px 40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; border-left: 4px solid #0f172a; border-radius: 0 6px 6px 0;">
            <tr>
              <td style="padding: 20px 24px; font-style: italic; font-size: 17px; line-height: 28px; color: #1e293b;">
                &laquo; Le design ne consiste pas seulement à retirer ce qui est superflu, mais à conférer à l'essentiel une force d'évocation inoubliable. &raquo;
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Body Story -->
      <tr>
        <td style="padding: 0 40px 32px 40px;">
          <p style="font-family: Arial, sans-serif; font-size: 15px; line-height: 25px; color: #475569; margin: 0 0 18px 0;">
            Dans cet essai, nous explorons pourquoi les marques les plus influentes délaissent aujourd'hui les gabarits préfabriqués pour investir dans des compositions sur mesure, où chaque typographie, marge et interaction possède une intention rigoureuse.
          </p>
          <p style="font-family: Arial, sans-serif; font-size: 15px; line-height: 25px; color: #475569; margin: 0 0 28px 0;">
            Cette transition marque le retour d'une culture du web vivant : des emails personnalisés, dynamiques, légers et immédiatement lisibles.
          </p>

          <!-- Read Full Essay Link -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td style="border-radius: 4px; background-color: #0f172a; text-align: center;">
                <a href="https://example.com/essay" style="background-color: #0f172a; border: 1px solid #0f172a; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; text-decoration: none; padding: 12px 24px; color: #ffffff; border-radius: 4px; display: inline-block;">
                  Lire l'article complet en ligne &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Author Bio Footer -->
      <tr>
        <td style="padding: 28px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="48" valign="top">
                <div style="width: 44px; height: 44px; border-radius: 22px; background-color: #0f172a; color: #ffffff; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; line-height: 44px; text-align: center;">AZ</div>
              </td>
              <td style="padding-left: 16px; font-family: Arial, sans-serif; font-size: 13px; line-height: 20px; color: #64748b;">
                <strong style="color: #0f172a;">Rédigé par Alexandre Z.</strong><br />
                Directeur éditorial & chercheur indépendant en typographie numérique.
              </td>
            </tr>
          </table>
        </td>
      </tr>

    </table>
    <!--[if (gte mso 9)|(IE)]>
    </td></tr></table>
    <![endif]-->
  </center>
</body>
</html>`,
  },
  {
    id: 'ecommerce-receipt',
    name: 'E-Commerce Reçu & Suivi Commande',
    category: 'Transactionnel',
    description: 'Reçu de commande clair et conforme avec tableau d\'articles, sous-totaux, TVA, adresse de livraison et bouton de suivi.',
    thumbnail: '📦',
    metadata: {
      subject: 'Confirmation de votre commande #FR-892401',
      preheader: 'Merci pour votre confiance ! Votre colis est en cours de préparation.',
      senderName: 'Boutique Atelier',
      senderEmail: 'commandes@atelier-store.com',
    },
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reçu Commande #FR-892401</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: Arial, Helvetica, sans-serif; color: #1e293b;">
  <center style="width: 100%; background-color: #f4f6f8; padding: 36px 0;">
    <!--[if (gte mso 9)|(IE)]>
    <table width="600" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td>
    <![endif]-->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
      
      <!-- Brand & Status -->
      <tr>
        <td style="padding: 32px 36px 24px 36px; border-bottom: 1px solid #f1f5f9;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <span style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">ATELIER</span>
              </td>
              <td align="right">
                <span style="font-size: 13px; font-weight: bold; color: #16a34a; background-color: #f0fdf4; padding: 4px 10px; border-radius: 12px;">Paiement Validé</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Thank You Message -->
      <tr>
        <td style="padding: 28px 36px 20px 36px;">
          <h1 style="font-size: 22px; line-height: 28px; color: #0f172a; margin: 0 0 10px 0; font-weight: bold;">
            Merci pour votre commande, Claire !
          </h1>
          <p style="font-size: 14px; line-height: 22px; color: #64748b; margin: 0 0 24px 0;">
            Votre commande <strong>#FR-892401</strong> a été enregistrée avec succès. Vous recevrez une notification par email dès la remise au transporteur Colissimo.
          </p>

          <!-- Tracking Button -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td style="border-radius: 6px; background-color: #0f172a; text-align: center;">
                <a href="https://example.com/track/892401" style="background-color: #0f172a; border: 1px solid #0f172a; font-size: 14px; font-weight: bold; text-decoration: none; padding: 12px 24px; color: #ffffff; border-radius: 6px; display: inline-block;">
                  Suivre mon colis en direct &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Items Table -->
      <tr>
        <td style="padding: 10px 36px 24px 36px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid #e2e8f0;">
            <!-- Header Row -->
            <tr>
              <th align="left" style="padding: 12px 0; font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Article</th>
              <th align="center" style="padding: 12px 0; font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Qté</th>
              <th align="right" style="padding: 12px 0; font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Prix</th>
            </tr>
            <!-- Item 1 -->
            <tr>
              <td style="padding: 12px 0; border-top: 1px solid #f1f5f9; font-size: 14px; color: #1e293b; font-weight: 600;">
                Sac Bandoulière Cuir Végétal Noir
                <div style="font-size: 12px; color: #64748b; font-weight: normal;">Réf: AT-582 &bull; Taille Unique</div>
              </td>
              <td align="center" style="padding: 12px 0; border-top: 1px solid #f1f5f9; font-size: 14px; color: #64748b;">1</td>
              <td align="right" style="padding: 12px 0; border-top: 1px solid #f1f5f9; font-size: 14px; color: #0f172a; font-weight: bold;">149,00 &euro;</td>
            </tr>
            <!-- Item 2 -->
            <tr>
              <td style="padding: 12px 0; border-top: 1px solid #f1f5f9; font-size: 14px; color: #1e293b; font-weight: 600;">
                Porte-cartes Minimaliste Anthracite
                <div style="font-size: 12px; color: #64748b; font-weight: normal;">Réf: AT-104 &bull; 6 compartiments</div>
              </td>
              <td align="center" style="padding: 12px 0; border-top: 1px solid #f1f5f9; font-size: 14px; color: #64748b;">1</td>
              <td align="right" style="padding: 12px 0; border-top: 1px solid #f1f5f9; font-size: 14px; color: #0f172a; font-weight: bold;">39,00 &euro;</td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Price Breakdown -->
      <tr>
        <td style="padding: 0 36px 28px 36px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-radius: 6px; padding: 16px;">
            <tr>
              <td style="padding: 4px 16px; font-size: 13px; color: #64748b;">Sous-total :</td>
              <td align="right" style="padding: 4px 16px; font-size: 13px; color: #1e293b;">188,00 &euro;</td>
            </tr>
            <tr>
              <td style="padding: 4px 16px; font-size: 13px; color: #64748b;">Livraison Colissimo Suivi :</td>
              <td align="right" style="padding: 4px 16px; font-size: 13px; color: #16a34a; font-weight: bold;">Offerte</td>
            </tr>
            <tr>
              <td style="padding: 4px 16px; font-size: 13px; color: #64748b;">Dont TVA (20%) :</td>
              <td align="right" style="padding: 4px 16px; font-size: 13px; color: #64748b;">31,33 &euro;</td>
            </tr>
            <tr>
              <td style="padding: 10px 16px 4px 16px; font-size: 16px; font-weight: bold; color: #0f172a; border-top: 1px solid #e2e8f0;">Total payé :</td>
              <td align="right" style="padding: 10px 16px 4px 16px; font-size: 18px; font-weight: 800; color: #0f172a; border-top: 1px solid #e2e8f0;">188,00 &euro;</td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer Help & Guarantees -->
      <tr>
        <td style="padding: 24px 36px; background-color: #ffffff; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; line-height: 18px;">
          <p style="margin: 0 0 6px 0;">Besoin d'aide ? Répondez simplement à ce courriel ou contactez-nous à support@atelier-store.com</p>
          <p style="margin: 0;">Retours gratuits sous 30 jours dans leur emballage d'origine.</p>
        </td>
      </tr>

    </table>
    <!--[if (gte mso 9)|(IE)]>
    </td></tr></table>
    <![endif]-->
  </center>
</body>
</html>`,
  },
  {
    id: 'event-masterclass',
    name: 'Invitation Événement & Masterclass',
    category: 'Événements',
    description: 'Invitation interactive avec date clé, intervenant d\'honneur, programme minute par minute et confirmation de participation.',
    thumbnail: '🎙️',
    metadata: {
      subject: '🎟️ Invitation exclusive : Masterclass Architecture Web 2026',
      preheader: 'Rejoignez-nous le jeudi 18 novembre en direct pour 90 minutes de cas pratiques.',
      senderName: 'Masterclass Academy',
      senderEmail: 'masterclass@academy-tech.eu',
    },
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invitation Masterclass 2026</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: Arial, sans-serif; color: #f8fafc;">
  <center style="width: 100%; background-color: #0f172a; padding: 36px 0;">
    <!--[if (gte mso 9)|(IE)]>
    <table width="600" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td>
    <![endif]-->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
      
      <!-- Top Date Header -->
      <tr>
        <td style="padding: 28px 36px 20px 36px; background-color: #0284c7; text-align: center; color: #ffffff;">
          <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 4px;">SESSION EN DIRECT GRATUITE</div>
          <div style="font-size: 24px; font-weight: 800;">JEUDI 18 NOVEMBRE &bull; 18H00 CET</div>
        </td>
      </tr>

      <!-- Title & Speaker -->
      <tr>
        <td style="padding: 36px 36px 24px 36px;">
          <h1 style="font-size: 26px; line-height: 34px; color: #ffffff; margin: 0 0 16px 0; font-weight: bold;">
            Maîtriser les architectures réactives et l'édition directe de données
          </h1>
          <p style="font-size: 15px; line-height: 24px; color: #cbd5e1; margin: 0 0 24px 0;">
            Découvrez comment orchestrer un canevas temps-réel, synchroniser sans friction le DOM graphique et le code source, et éliminer 80% des bugs de mise en page.
          </p>

          <!-- Register CTA -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td style="border-radius: 6px; background-color: #38bdf8; text-align: center;">
                <a href="https://example.com/register" style="background-color: #38bdf8; border: 1px solid #38bdf8; font-size: 15px; font-weight: bold; text-decoration: none; padding: 14px 28px; color: #0f172a; border-radius: 6px; display: inline-block;">
                  Confirmer ma place en direct &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Agenda Table -->
      <tr>
        <td style="padding: 0 36px 32px 36px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0f172a; border-radius: 8px; border: 1px solid #334155;">
            <tr>
              <td style="padding: 16px 20px; border-bottom: 1px solid #334155;">
                <span style="font-size: 13px; font-weight: bold; color: #38bdf8;">18:00 - 18:25</span>
                <div style="font-size: 14px; color: #f1f5f9; font-weight: 600; margin-top: 4px;">Anatomie d'un moteur de synchronisation 2 voies</div>
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 20px; border-bottom: 1px solid #334155;">
                <span style="font-size: 13px; font-weight: bold; color: #38bdf8;">18:25 - 18:55</span>
                <div style="font-size: 14px; color: #f1f5f9; font-weight: 600; margin-top: 4px;">Démonstration live : manipulation de nœuds sans lag</div>
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 20px;">
                <span style="font-size: 13px; font-weight: bold; color: #38bdf8;">18:55 - 19:30</span>
                <div style="font-size: 14px; color: #f1f5f9; font-weight: 600; margin-top: 4px;">Questions / Réponses en direct avec l'auditoire</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding: 24px 36px; background-color: #0b0f19; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #334155;">
          <p style="margin: 0 0 6px 0;">Le replay sera disponible sous 24h pour toutes les personnes inscrites.</p>
          <p style="margin: 0;"><a href="#" style="color: #38bdf8; text-decoration: underline;">Se désinscrire de la liste événements</a></p>
        </td>
      </tr>

    </table>
    <!--[if (gte mso 9)|(IE)]>
    </td></tr></table>
    <![endif]-->
  </center>
</body>
</html>`,
  },
  {
    id: 'security-alert',
    name: 'Notification Sécurité & Transactionnelle',
    category: 'Transactionnel',
    description: 'Notification épurée et sérieuse pour alertes de sécurité, connexions inhabituelles ou codes de vérification.',
    thumbnail: '🔒',
    metadata: {
      subject: 'Alerte Sécurité : Nouvelle connexion détectée sur votre compte',
      preheader: 'Une connexion depuis un nouvel appareil a été enregistrée à 14h22 CET.',
      senderName: 'Centre de Sécurité',
      senderEmail: 'security@auth-guardian.io',
    },
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Alerte de Sécurité</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: Arial, Helvetica, sans-serif; color: #1e293b;">
  <center style="width: 100%; background-color: #f8fafc; padding: 36px 0;">
    <!--[if (gte mso 9)|(IE)]>
    <table width="600" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td>
    <![endif]-->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
      
      <!-- Alert Top Border -->
      <tr>
        <td height="4" style="background-color: #d97706; line-height: 4px; font-size: 4px;">&nbsp;</td>
      </tr>

      <!-- Header Icon & Title -->
      <tr>
        <td style="padding: 32px 36px 20px 36px;">
          <div style="font-size: 13px; font-weight: 700; color: #d97706; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">
            Avis de Sécurité Important
          </div>
          <h1 style="font-size: 22px; line-height: 28px; color: #0f172a; margin: 0 0 14px 0; font-weight: bold;">
            Nouvelle tentative de connexion détectée
          </h1>
          <p style="font-size: 15px; line-height: 24px; color: #475569; margin: 0 0 20px 0;">
            Bonjour, nous avons détecté une connexion à votre espace membre depuis un navigateur non reconnu.
          </p>

          <!-- Incident Details Box -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; border-radius: 6px; margin-bottom: 24px;">
            <tr>
              <td style="padding: 16px 20px; font-size: 13px; line-height: 22px; color: #334155;">
                <strong>Appareil :</strong> Chrome sur macOS Sonoma<br />
                <strong>Localisation :</strong> Lyon, France (IP: 194.52.88.***)<br />
                <strong>Date & Heure :</strong> Aujourd'hui à 14h22 CET
              </td>
            </tr>
          </table>

          <p style="font-size: 14px; line-height: 22px; color: #475569; margin: 0 0 24px 0;">
            Si vous êtes à l'origine de cette action, vous pouvez ignorer ce message en toute sécurité. Dans le cas contraire, nous vous recommandons de révoquer immédiatement la session.
          </p>

          <!-- Action Button -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td style="border-radius: 6px; background-color: #dc2626; text-align: center;">
                <a href="https://example.com/security/lock" style="background-color: #dc2626; border: 1px solid #dc2626; font-size: 14px; font-weight: bold; text-decoration: none; padding: 12px 24px; color: #ffffff; border-radius: 6px; display: inline-block;">
                  Ce n'était pas moi &mdash; Sécuriser mon compte &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding: 20px 36px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0;">Message généré automatiquement par le service d'authentification Courrier Studio.</p>
        </td>
      </tr>

    </table>
    <!--[if (gte mso 9)|(IE)]>
    </td></tr></table>
    <![endif]-->
  </center>
</body>
</html>`,
  },
];
