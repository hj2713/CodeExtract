/**
 * Shared types for pending-apps-page components and actions
 */

export interface PendingApp {
  id: string;
  name: string;
  description: string | null;
  path: string;
  port: number;
  createdAt: string;
  requirementTitle: string | null;
}

export interface ApproveResult {
  success: boolean;
  error?: string;
}

export interface DenyResult {
  success: boolean;
  error?: string;
}
