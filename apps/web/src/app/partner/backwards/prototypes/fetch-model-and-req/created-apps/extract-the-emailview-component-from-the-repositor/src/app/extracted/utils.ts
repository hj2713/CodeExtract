// Ported from: source/src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Mock email data - Ported from: source/src/data/demoInbox.ts
import { DemoEmail } from "./types";

export const MOCK_EMAIL_DATA: DemoEmail[] = [
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
  },
  {
    id: "msg_006",
    threadId: "thread_006",
    from: "newsletter@techdigest.com",
    fromName: "Tech Digest",
    to: "you@example.com",
    subject: "Weekly Tech News: AI Breakthroughs and More",
    snippet: "This week's top stories: New AI models revolutionize...",
    body: "This week's top stories:\n\n1. New AI models revolutionize accessibility tools\n2. Tech giants announce sustainability initiatives\n3. Startup funding reaches record levels\n4. Security update: What you need to know\n\nRead more at techdigest.com",
    date: "2024-01-13T08:00:00Z",
    unread: false
  },
  {
    id: "msg_007",
    threadId: "thread_007",
    from: "mike.johnson@client.co",
    fromName: "Mike Johnson",
    to: "you@example.com",
    subject: "Re: Project proposal feedback",
    snippet: "Thanks for sending over the proposal. I've reviewed it...",
    body: "Thanks for sending over the proposal. I've reviewed it with my team and we have a few questions:\n\n1. Can we extend the timeline by 2 weeks?\n2. Is there flexibility on the budget for phase 2?\n3. Who would be the main point of contact?\n\nLet's schedule a call to discuss.\n\nMike",
    date: "2024-01-12T14:30:00Z",
    unread: false
  },
  {
    id: "msg_008",
    threadId: "thread_008",
    from: "support@cloudservice.io",
    fromName: "Cloud Service Support",
    to: "you@example.com",
    subject: "Your support ticket #1234 has been resolved",
    snippet: "Good news! Your support ticket regarding login issues...",
    body: "Good news! Your support ticket #1234 regarding login issues has been resolved.\n\nSummary: We've reset your account settings and the issue should no longer occur.\n\nIf you experience any further problems, please don't hesitate to reach out.\n\nBest regards,\nCloud Service Support Team",
    date: "2024-01-11T11:00:00Z",
    unread: false
  },
  {
    id: "msg_009",
    threadId: "thread_009",
    from: "jane.doe@partner.com",
    fromName: "Jane Doe",
    to: "you@example.com",
    subject: "Partnership opportunity discussion",
    snippet: "I hope this email finds you well. I'm reaching out...",
    body: "I hope this email finds you well.\n\nI'm reaching out regarding a potential partnership opportunity between our organizations. We've been impressed with your work in the accessibility space and believe there could be synergies.\n\nWould you be open to a 30-minute call next week to explore this further?\n\nBest regards,\nJane Doe\nBusiness Development",
    date: "2024-01-10T09:00:00Z",
    unread: false
  },
  {
    id: "msg_010",
    threadId: "thread_010",
    from: "calendar@google.com",
    fromName: "Google Calendar",
    to: "you@example.com",
    subject: "Reminder: Team standup in 1 hour",
    snippet: "You have an upcoming event: Team standup at 10:00 AM...",
    body: "You have an upcoming event:\n\nTeam standup\nTime: 10:00 AM - 10:30 AM\nLocation: Video call\n\nJoin video call: https://meet.google.com/abc-defg-hij",
    date: "2024-01-09T09:00:00Z",
    unread: false
  }
];
