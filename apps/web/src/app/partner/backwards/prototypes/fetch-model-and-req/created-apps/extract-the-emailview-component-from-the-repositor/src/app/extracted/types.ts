// Ported from: source/src/data/demoInbox.ts

export interface DemoEmail {
  id: string;
  threadId: string;
  from: string;
  fromName: string;
  to: string;
  subject: string;
  snippet: string;
  body: string;
  date: string;
  unread: boolean;
}
