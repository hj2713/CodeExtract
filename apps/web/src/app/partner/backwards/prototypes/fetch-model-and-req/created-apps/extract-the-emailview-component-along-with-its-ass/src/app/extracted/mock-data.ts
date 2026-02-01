// Mock email data ported from: source/src/data/demoInbox.ts
import { DemoEmail } from "./types";

export const MOCK_EMAILS: DemoEmail[] = [
  {
    id: "msg_001",
    threadId: "thread_001",
    from: "sarah.chen@techcorp.com",
    fromName: "Sarah Chen",
    to: "you@example.com",
    subject: "Q4 Planning Meeting - Thursday",
    snippet: "Hi! I wanted to confirm our meeting for Thursday at 2pm...",
    body: "Hi!\n\nI wanted to confirm our meeting for Thursday at 2pm to discuss the Q4 planning roadmap. I've prepared some slides covering the main initiatives.\n\nPlease let me know if you need me to adjust the time or add anyone else to the invite.\n\nBest,\nSarah",
    date: "2024-01-15T10:30:00Z",
    unread: true
  },
  {
    id: "msg_002",
    threadId: "thread_002",
    from: "alex.rodriguez@startup.io",
    fromName: "Alex Rodriguez",
    to: "you@example.com",
    subject: "Coffee catch-up next week?",
    snippet: "Hey! It's been a while since we caught up. Are you free...",
    body: "Hey!\n\nIt's been a while since we caught up. Are you free sometime next week for a coffee? I'd love to hear what you've been working on.\n\nI'm flexible on days - just let me know what works for you.\n\nCheers,\nAlex",
    date: "2024-01-15T09:15:00Z",
    unread: true
  },
  {
    id: "msg_003",
    threadId: "thread_003",
    from: "notifications@github.com",
    fromName: "GitHub",
    to: "you@example.com",
    subject: "[echopilot] New pull request: Add voice recognition feature",
    snippet: "johndoe opened a new pull request in echopilot/main...",
    body: "johndoe opened a new pull request #42 in echopilot/main\n\nTitle: Add voice recognition feature\n\nThis PR adds the core voice recognition capability using the Web Speech API as a fallback.\n\nView it on GitHub: https://github.com/echopilot/echopilot/pull/42",
    date: "2024-01-15T08:00:00Z",
    unread: true
  },
  {
    id: "msg_004",
    threadId: "thread_004",
    from: "hr@company.com",
    fromName: "HR Department",
    to: "you@example.com",
    subject: "Reminder: Submit your timesheet by Friday",
    snippet: "This is a friendly reminder to submit your timesheet...",
    body: "This is a friendly reminder to submit your timesheet for the current pay period by Friday at 5pm.\n\nPlease log into the HR portal to complete your submission.\n\nThank you,\nHR Team",
    date: "2024-01-14T16:45:00Z",
    unread: false
  },
  {
    id: "msg_005",
    threadId: "thread_005",
    from: "mom@family.net",
    fromName: "Mom",
    to: "you@example.com",
    subject: "Sunday dinner plans",
    snippet: "Hi sweetie! Are you coming over for dinner on Sunday?...",
    body: "Hi sweetie!\n\nAre you coming over for dinner on Sunday? Dad wants to grill burgers and the weather should be nice.\n\nLet me know if you're bringing anyone!\n\nLove,\nMom",
    date: "2024-01-14T12:00:00Z",
    unread: false
  }
];
