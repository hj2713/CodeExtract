-- Seed data for testing MessagesArea component
-- Run this after having at least one source in the database

-- Create a test conversation (replace SOURCE_ID with actual source ID)
INSERT INTO conversations (id, source_id, user_id, title, created_at, updated_at)
VALUES (
  'conv-messages-test-1',
  'SOURCE_ID_HERE',
  'default-user',
  'Test Conversation',
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);

-- Add sample messages
INSERT INTO messages (id, conversation_id, role, content, created_at)
VALUES
  ('msg-1', 'conv-messages-test-1', 'user', 'I want to extract the authentication flow from this codebase.', strftime('%s', 'now') * 1000),
  ('msg-2', 'conv-messages-test-1', 'assistant', 'I can help you extract the authentication flow. Looking at the codebase, I can see there are several authentication-related components:

1. **Login Form** (`src/components/auth/LoginForm.tsx`)
2. **Auth Provider** (`src/contexts/AuthContext.tsx`)
3. **Protected Route Wrapper** (`src/components/auth/ProtectedRoute.tsx`)

Which parts would you like to focus on? Do you need:
- The complete auth flow with session management?
- Just the UI components?
- The API integration layer?', strftime('%s', 'now') * 1000 + 1000),
  ('msg-3', 'conv-messages-test-1', 'user', 'I need the complete auth flow with session management, including the login form UI.', strftime('%s', 'now') * 1000 + 2000),
  ('msg-4', 'conv-messages-test-1', 'assistant', 'I understand you want the complete authentication system. Here''s what I''ll extract:

**Components:**
- Login form with email/password inputs
- Session persistence with JWT tokens
- Auto-refresh mechanism for expired tokens
- Logout functionality

**Dependencies:**
- `jose` for JWT handling
- `react-hook-form` for form state
- `zod` for validation

Would you like me to proceed with extracting these components?', strftime('%s', 'now') * 1000 + 3000);
