\c notification_db

CREATE TABLE IF NOT EXISTS user_device_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    fcm_token TEXT NOT NULL,
    device_info TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(fcm_token)
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON user_device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_active ON user_device_tokens(user_id) WHERE is_active = true;

CREATE TRIGGER update_user_device_tokens_updated_at
    BEFORE UPDATE ON user_device_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE user_device_tokens OWNER TO notification_user;