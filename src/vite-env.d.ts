/// <reference types="vite/client" />

type DirectoryPickerOptions = {
  id?: string;
  mode?: 'read' | 'readwrite';
  startIn?: string;
};

type FsPermissionDesc = { mode?: 'read' | 'readwrite' };

interface FileSystemDirectoryHandle {
  queryPermission?(descriptor?: FsPermissionDesc): Promise<PermissionState>;
  requestPermission?(descriptor?: FsPermissionDesc): Promise<PermissionState>;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
}

interface Window {
  showDirectoryPicker?: (options?: DirectoryPickerOptions) => Promise<FileSystemDirectoryHandle>;
}
