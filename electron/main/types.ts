// types.ts
export interface FileResult {
  originalName: string;
  newName?: string;
  success: boolean;
  message: string;
}

export interface SaveResult {
  success: boolean;
  message: string;
  results?: FileResult[];
}