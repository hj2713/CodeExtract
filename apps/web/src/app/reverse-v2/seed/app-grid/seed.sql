-- Seed data for testing AppGrid component
-- Creates sample approved code examples with associated requirements

-- Insert sample requirements first
INSERT INTO requirements (id, source_id, title, requirement, status, created_at)
VALUES
  ('req-001', 'src-test', 'Chat Input Component', 'A modern chat input with send button and attachment support', 'completed', datetime('now', '-7 days')),
  ('req-002', 'src-test', 'User Profile Card', 'Responsive user profile card with avatar and stats', 'completed', datetime('now', '-5 days')),
  ('req-003', 'src-test', 'Data Table', 'Sortable data table with pagination controls', 'completed', datetime('now', '-3 days'));

-- Insert approved code examples
INSERT INTO code_examples (id, requirement_id, path, port, review_status, created_at)
VALUES
  ('ce-001', 'req-001', '/created-apps/chat-input', 3001, 'approved', datetime('now', '-6 days')),
  ('ce-002', 'req-002', '/created-apps/user-profile-card', 3002, 'approved', datetime('now', '-4 days')),
  ('ce-003', 'req-003', '/created-apps/data-table', 3003, 'approved', datetime('now', '-2 days'));

-- Also insert some pending ones for testing filter
INSERT INTO requirements (id, source_id, title, requirement, status, created_at)
VALUES
  ('req-004', 'src-test', 'Pending Component', 'A component awaiting review', 'extracting', datetime('now', '-1 day'));

INSERT INTO code_examples (id, requirement_id, path, port, review_status, created_at)
VALUES
  ('ce-004', 'req-004', '/created-apps/pending-comp', 3004, 'pending', datetime('now', '-1 day'));
