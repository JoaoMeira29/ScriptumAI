-- Notification Service Database Schema
-- Database per Service pattern - PostgreSQL

-- Criar database se não existir
SELECT 'CREATE DATABASE notification_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'notification_db')\gexec

-- Criar user se não existir
DO
$$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'notification_user') THEN
    CREATE USER notification_user WITH PASSWORD 'notification_pass_secret';
  END IF;
END
$$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE notification_db TO notification_user;

-- Conectar à database
\c notification_db

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO notification_user;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE notification_status AS ENUM ('PENDING', 'SENT', 'FAILED');
CREATE TYPE notification_channel AS ENUM ('EMAIL', 'SMS', 'PUSH');

-- Tabela: notification_templates
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    template_type VARCHAR(50) DEFAULT 'email',
    subject VARCHAR(255),
    body_html TEXT NOT NULL,
    body_text TEXT,
    variables JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, template_name)
);

-- Tabela: notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    organization_id UUID,
    template_id UUID REFERENCES notification_templates(id),
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_html TEXT,
    body_text TEXT,
    channel notification_channel DEFAULT 'EMAIL',
    status notification_status DEFAULT 'PENDING',
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP,
    metadata JSONB,
    sent_at TIMESTAMP,
    failed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: notification_logs
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    source_service VARCHAR(100),
    event_type VARCHAR(100),
    recipient VARCHAR(255) NOT NULL,
    channel notification_channel DEFAULT 'EMAIL',
    status notification_status NOT NULL,
    error_message TEXT,
    error_code VARCHAR(50),
    smtp_response TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_next_retry ON notifications(next_retry_at) WHERE status = 'PENDING';

CREATE INDEX idx_templates_org_id ON notification_templates(organization_id);
CREATE INDEX idx_templates_active ON notification_templates(is_active) WHERE is_active = true;

CREATE INDEX idx_logs_notification_id ON notification_logs(notification_id);
CREATE INDEX idx_logs_created_at ON notification_logs(created_at DESC);
CREATE INDEX idx_logs_status ON notification_logs(status);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notification_templates_updated_at 
    BEFORE UPDATE ON notification_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Templates padrão
INSERT INTO notification_templates (organization_id, template_name, subject, body_html, variables) VALUES
('00000000-0000-0000-0000-000000000000', 'invite', 'Convite - {{organizationName}}', 
 '<h1>Olá!</h1><p>Foi convidado para <strong>{{organizationName}}</strong>.</p><a href="{{inviteLink}}">Aceitar Convite</a>',
 '{"organizationName": "string", "inviteLink": "string"}'),
('00000000-0000-0000-0000-000000000000', 'welcome', 'Bem-vindo ao ScriptumAI!',
 '<h1>Bem-vindo, {{userName}}!</h1><p>A sua conta foi criada com sucesso.</p>',
 '{"userName": "string"}')
ON CONFLICT (organization_id, template_name) DO NOTHING;

INSERT INTO notification_templates (organization_id, template_name, subject, body_html, body_text, variables) VALUES
('00000000-0000-0000-0000-000000000000', 'document_processed', '{{emailSubject}}',
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
 '{"fileName": "string", "summary": "string", "processedAt": "string", "documentLink": "string", "emailSubject": "string", "emailTitle": "string", "emailSubtitle": "string", "emailBadge": "string", "emailDocumentLabel": "string", "emailSummaryLabel": "string", "emailCtaLabel": "string", "emailProcessedAtLabel": "string", "emailFooterNote": "string", "emailLocale": "string"}')
ON CONFLICT (organization_id, template_name) DO UPDATE SET
  subject = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  body_text = EXCLUDED.body_text,
  variables = EXCLUDED.variables;

-- Ownership 
ALTER TABLE notification_templates OWNER TO notification_user;
ALTER TABLE notifications OWNER TO notification_user;
ALTER TABLE notification_logs OWNER TO notification_user;
