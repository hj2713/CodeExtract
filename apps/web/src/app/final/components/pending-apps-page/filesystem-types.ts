/**
 * Types for the FileSystemModal component
 */

export interface FileSystemEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
}

export interface FetchDirectoryResult {
  success: boolean;
  data?: FileSystemEntry[];
  error?: string;
}

export interface FetchFileContentResult {
  success: boolean;
  content?: string;
  error?: string;
}
