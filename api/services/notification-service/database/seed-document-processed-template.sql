INSERT INTO notification_templates (
    id,
    organization_id,
    template_name,
    template_type,
    subject,
    body_html,
    body_text,
    variables,
    is_active,
    created_at,
    updated_at
) VALUES (
    uuid_generate_v4(),
    '00000000-0000-0000-0000-000000000000',
    'document_processed',
    'email',
    '{{emailSubject}}',
    $$<!DOCTYPE html>
<html lang="{{emailLocale}}">
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 40px 30px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:600;letter-spacing:-0.5px;">{{emailTitle}}</h1>
              <p style="margin:10px 0 0;color:rgba(255,255,255,0.9);font-size:16px;">{{emailSubtitle}}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <div style="text-align:center;margin-bottom:30px;">
                <div style="display:inline-block;background-color:#10b981;color:#ffffff;padding:8px 20px;border-radius:20px;font-size:14px;font-weight:600;">{{emailBadge}}</div>
              </div>
              <div style="background-color:#f8f9fa;border-left:4px solid #667eea;padding:20px;border-radius:8px;margin-bottom:30px;">
                <p style="margin:0 0 8px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">{{emailDocumentLabel}}</p>
                <p style="margin:0;color:#1f2937;font-size:18px;font-weight:600;">{{fileName}}</p>
              </div>
              <div style="margin-bottom:30px;">
                <h3 style="margin:0 0 15px;color:#1f2937;font-size:18px;font-weight:600;border-bottom:2px solid #e5e7eb;padding-bottom:10px;">{{emailSummaryLabel}}</h3>
                <div style="background-color:#fafafa;padding:20px;border-radius:8px;border:1px solid #e5e7eb;">
                  <div style="margin:0;color:#4b5563;font-size:15px;line-height:1.8;white-space:pre-wrap;">{{summary}}</div>
                </div>
              </div>
              <div style="text-align:center;margin-bottom:30px;">
                <a href="{{documentLink}}" style="display:inline-block;background-color:#667eea;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">{{emailCtaLabel}}</a>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:30px;">
                <tr>
                  <td style="text-align:center;padding:15px;background-color:#f0f4ff;border-radius:8px;">
                    <div style="color:#667eea;font-size:16px;font-weight:700;margin-bottom:5px;">{{processedAt}}</div>
                    <div style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">{{emailProcessedAtLabel}}</div>
                  </td>
                </tr>
              </table>
              <div style="text-align:center;margin-top:30px;padding-top:25px;border-top:1px solid #e5e7eb;">
                <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;">{{{emailFooterNote}}}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb;padding:25px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 10px;color:#6b7280;font-size:14px;font-weight:600;">ScriptumAI</p>
              <p style="margin:0;color:#9ca3af;font-size:12px;">Artificial Intelligence for Document Management</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>$$,
    E'{{emailTitle}}\n\n{{emailDocumentLabel}}: {{fileName}}\n\n{{emailSummaryLabel}}:\n{{summary}}\n\n{{emailProcessedAtLabel}}: {{processedAt}}\n\n{{emailCtaLabel}}: {{documentLink}}',
    '["fileName", "summary", "processedAt", "documentLink", "emailSubject", "emailTitle", "emailSubtitle", "emailBadge", "emailDocumentLabel", "emailSummaryLabel", "emailCtaLabel", "emailProcessedAtLabel", "emailFooterNote", "emailLocale"]'::jsonb,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (organization_id, template_name)
DO UPDATE SET
    subject = EXCLUDED.subject,
    body_html = EXCLUDED.body_html,
    body_text = EXCLUDED.body_text,
    variables = EXCLUDED.variables,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;
