-- CampusCart Real-Time Messaging System PostgreSQL Schema
-- Phase 1 Implementation

-- 1. Create chat_type enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chat_type') THEN
        CREATE TYPE chat_type AS ENUM ('DIRECT', 'GLOBAL');
    END IF;
END$$;

-- 2. Messages Table Definition
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_type chat_type NOT NULL DEFAULT 'DIRECT',
    sender_id VARCHAR(255) NOT NULL,
    recipient_id VARCHAR(255) NULL, -- NULL for GLOBAL chat messages
    conversation_id VARCHAR(255) NULL, -- Format: chat_userA_userB (NULL for GLOBAL messages)
    content TEXT NOT NULL,
    product_context JSONB NULL, -- Optional product context object e.g. { id, title, price, image }
    status VARCHAR(50) NOT NULL DEFAULT 'SENT', -- SENT, DELIVERED, READ
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Descending Index on created_at for High-Performance Real-Time Fetching
CREATE INDEX IF NOT EXISTS idx_messages_created_at_desc 
ON messages (created_at DESC);

-- 4. Composite Descending Index for Specific Direct Conversation Lookup
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON messages (conversation_id, created_at DESC) 
WHERE conversation_id IS NOT NULL;

-- 5. Index for Global Campus Hub Chat Filtering
CREATE INDEX IF NOT EXISTS idx_messages_global_created 
ON messages (created_at DESC) 
WHERE chat_type = 'GLOBAL';
