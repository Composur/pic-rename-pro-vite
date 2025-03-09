// electron.d.ts
export interface RenamedFile {
  newName: string;
  base64Data?: string;
}

export interface ElectronAPI {
  selectImages: () => Promise<string[]>;
  saveRenamedImages: (files: RenamedFile[]) => Promise<SaveResult>;
  readImageFile: (filePath: string) => Promise<string>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}