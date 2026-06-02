const emailService = require('../services/emailService');
const fcmService = require('../services/fcmService');
const logger = require('../utils/logger');

function sanitizeHtml(value) {
  if (!value) return '';

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function detectLanguage(value) {
  const normalized = String(value || '').trim().toLowerCase();

  if (!normalized) return 'pt';
  if (normalized.startsWith('en')) return 'en';
  if (normalized.startsWith('pt')) return 'pt';

  const haystack = ` ${normalized} `;
  const portugueseHints = [
    ' documento ',
    ' resumo ',
    ' analise ',
    ' análise ',
    ' processado ',
    ' ficheiro ',
    ' conclu',
    ' sucesso ',
    ' palavras-chave',
  ];
  const englishHints = [
    ' document ',
    ' summary ',
    ' analysis ',
    ' processed ',
    ' file ',
    ' completed ',
    ' success ',
    ' keywords ',
  ];

  const ptScore = portugueseHints.filter((hint) => haystack.includes(hint)).length;
  const enScore = englishHints.filter((hint) => haystack.includes(hint)).length;

  return enScore > ptScore ? 'en' : 'pt';
}

function getLanguagePack(language) {
  if (language === 'en') {
    return {
      language: 'en',
      locale: 'en-US',
      subject: 'Document processed: {{fileName}}',
      fallbackSummary:
        'Processing completed successfully. The document is ready for viewing.',
      fallbackSummaryText: 'Processing completed successfully.',
      title: 'Document Processed',
      subtitle: 'AI analysis completed successfully',
      badge: 'Processing Complete',
      documentLabel: 'Document',
      summaryLabel: 'Analysis Summary',
      ctaLabel: 'View document',
      processedAtLabel: 'Processed at',
      dateLabel: 'Date',
      timeLabel: 'Time',
      footerNote:
        'This is an automated email from the ScriptumAI platform.<br>Access your account to view all document details.',
      bodyTextTitle: 'Document Processed',
      bodyTextIntro: 'Your document "{{fileName}}" was successfully processed by AI.',
      bodyTextSummary: 'Summary',
      bodyTextProcessedAt: 'Processed at',
      bodyTextDocumentLink: 'View document',
    };
  }

  return {
    language: 'pt',
    locale: 'pt-PT',
    subject: 'Documento processado: {{fileName}}',
    fallbackSummary:
      'O processamento foi concluido com sucesso. O documento esta pronto para consulta.',
    fallbackSummaryText: 'Processamento concluido com sucesso.',
    title: 'Documento Processado',
    subtitle: 'Analise IA concluida com sucesso',
    badge: 'Processamento Completo',
    documentLabel: 'Documento',
    summaryLabel: 'Resumo da Analise',
    ctaLabel: 'Ver documento',
    processedAtLabel: 'Processado em',
    dateLabel: 'Data',
    timeLabel: 'Hora',
    footerNote:
      'Este e um email automatico da plataforma ScriptumAI.<br>Acede a tua conta para veres todos os detalhes do documento.',
    bodyTextTitle: 'Documento Processado',
    bodyTextIntro: 'O teu documento "{{fileName}}" foi processado com sucesso por IA.',
    bodyTextSummary: 'Resumo',
    bodyTextProcessedAt: 'Processado em',
    bodyTextDocumentLink: 'Ver documento',
  };
}

function formatSummary(summary, languagePack) {
  return sanitizeHtml(
    (summary || languagePack.fallbackSummary).replace(/\*\*/g, ''),
  ).replace(/\n/g, '<br>');
}

function normalizeDocumentPayload(payload) {
  const data = payload?.data || payload || {};

  return {
    documentId: payload?.documentId || data.documentId,
    organizationId: payload?.organizationId || data.organizationId,
    uploadedBy: payload?.uploadedBy || data.uploadedBy,
    fileName: payload?.fileName || data.documentName || data.fileName,
    summary: payload?.summary || data.summary,
    processedAt: payload?.processedAt || data.processedAt,
    userEmail: payload?.userEmail || data.userEmail,
    language: payload?.language || data.language,
  };
}

function buildDocumentProcessedEmailHtml({
  fileName,
  summaryHtml,
  processedAtDate,
  processedAtTime,
  documentLink,
  languagePack,
}) {
  return `
    <!DOCTYPE html>
    <html lang="${languagePack.language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden;">
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                    ${sanitizeHtml(languagePack.title)}
                  </h1>
                  <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                    ${sanitizeHtml(languagePack.subtitle)}
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <div style="display: inline-block; background-color: #10b981; color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 600;">
                      ${sanitizeHtml(languagePack.badge)}
                    </div>
                  </div>

                  <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                      ${sanitizeHtml(languagePack.documentLabel)}
                    </p>
                    <p style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600;">
                      ${sanitizeHtml(fileName)}
                    </p>
                  </div>

                  <div style="margin-bottom: 30px;">
                    <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                      ${sanitizeHtml(languagePack.summaryLabel)}
                    </h3>
                    <div style="background-color: #fafafa; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                      <div style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.8; white-space: pre-wrap;">
                        ${summaryHtml}
                      </div>
                    </div>
                  </div>

                  <div style="text-align: center; margin-bottom: 30px;">
                    <a href="${sanitizeHtml(documentLink || '#')}" style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">
                      ${sanitizeHtml(languagePack.ctaLabel)}
                    </a>
                  </div>

                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                    <tr>
                      <td style="text-align: center; padding: 15px; background-color: #f0f4ff; border-radius: 8px; width: 50%;">
                        <div style="color: #667eea; font-size: 24px; font-weight: 700; margin-bottom: 5px;">
                          ${processedAtDate}
                        </div>
                        <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                          ${sanitizeHtml(languagePack.dateLabel)}
                        </div>
                      </td>
                      <td style="width: 10px;"></td>
                      <td style="text-align: center; padding: 15px; background-color: #f0fdf4; border-radius: 8px; width: 50%;">
                        <div style="color: #10b981; font-size: 24px; font-weight: 700; margin-bottom: 5px;">
                          ${processedAtTime}
                        </div>
                        <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                          ${sanitizeHtml(languagePack.timeLabel)}
                        </div>
                      </td>
                    </tr>
                  </table>

                  <div style="text-align: center; margin-top: 30px; padding-top: 25px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                      ${languagePack.footerNote}
                    </p>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f9fafb; padding: 25px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; font-weight: 600;">ScriptumAI</p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">Artificial Intelligence for Document Management</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

async function handleDocumentAiCompleted(payload) {
  try {
    const normalizedPayload = normalizeDocumentPayload(payload);

    logger.info('Processing document.ai.completed event', {
      documentId: normalizedPayload.documentId,
    });

    const {
      documentId,
      organizationId,
      uploadedBy,
      fileName,
      summary,
      processedAt,
      userEmail,
      language,
    } = normalizedPayload;

    const recipientEmail = userEmail || 'joao.silva@scriptumai.pt';
    const resolvedLanguage = detectLanguage(language || summary || fileName);
    const languagePack = getLanguagePack(resolvedLanguage);

    logger.info('Sending document processing email', {
      documentId,
      recipientEmail,
      language: resolvedLanguage,
    });

    const processedDate = new Date(processedAt || Date.now());
    const processedAtDate = processedDate.toLocaleDateString(languagePack.locale);
    const processedAtTime = processedDate.toLocaleTimeString(languagePack.locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
    const summaryText = summary || languagePack.fallbackSummaryText;
    const summaryHtml = formatSummary(summary, languagePack);
    const documentLink = `http://localhost/api/documents/${documentId}`;

    const templateVariables = {
      fileName,
      documentId,
      summary: summaryText,
      processedAt: processedDate.toLocaleString(languagePack.locale),
      documentLink,
      emailSubject: languagePack.subject.replace('{{fileName}}', fileName || ''),
      emailTitle: languagePack.title,
      emailSubtitle: languagePack.subtitle,
      emailBadge: languagePack.badge,
      emailDocumentLabel: languagePack.documentLabel,
      emailSummaryLabel: languagePack.summaryLabel,
      emailCtaLabel: languagePack.ctaLabel,
      emailProcessedAtLabel: languagePack.processedAtLabel,
      emailFooterNote: languagePack.footerNote,
      emailLocale: languagePack.language,
    };

    try {
      await emailService.sendEmailWithTemplate({
        userId: uploadedBy,
        organizationId,
        templateName: 'document_processed',
        recipientEmail,
        templateVariables,
        sourceService: 'document-service',
        eventType: 'document.ai.completed',
      });
    } catch (templateError) {
      if (!templateError.message?.includes("Template 'document_processed' not found")) {
        throw templateError;
      }

      logger.warn(
        'Template document_processed not found. Falling back to direct email.',
        {
          organizationId,
          recipientEmail,
        },
      );

      await emailService.sendDirectEmail({
        userId: uploadedBy,
        organizationId,
        recipientEmail,
        subject: languagePack.subject.replace('{{fileName}}', fileName || ''),
        bodyHtml: buildDocumentProcessedEmailHtml({
          fileName,
          summaryHtml,
          processedAtDate,
          processedAtTime,
          documentLink,
          languagePack,
        }),
        bodyText: `${languagePack.bodyTextTitle}\n\n${languagePack.bodyTextIntro.replace('{{fileName}}', fileName || '')}\n\n${languagePack.bodyTextSummary}: ${summaryText}\n\n${languagePack.bodyTextProcessedAt}: ${processedDate.toLocaleString(languagePack.locale)}\n\n${languagePack.bodyTextDocumentLink}: ${documentLink}`,
        sourceService: 'document-service',
        eventType: 'document.ai.completed',
      });
    }

    logger.info('Document processing email sent', { documentId, recipientEmail });

    if (uploadedBy) {
      try {
        await fcmService.sendToUser(uploadedBy, {
          title: languagePack.title,
          body: (languagePack.subtitle || '').replace('{{fileName}}', fileName || ''),
          data: { documentId: documentId || '', type: 'document.ai.completed' },
        });
      } catch (fcmError) {
        logger.warn('FCM push notification failed (non-fatal)', { error: fcmError.message });
      }
    }
  } catch (error) {
    logger.error('Error handling document.ai.completed event', {
      error: error.message,
      payload,
      stack: error.stack,
    });
    throw error;
  }
}

module.exports = handleDocumentAiCompleted;
