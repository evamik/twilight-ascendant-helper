/**
 * Type definitions for Electron IPC in renderer process
 */

export interface IpcRenderer {
  send(channel: string, ...args: any[]): void;
  sendSync(channel: string, ...args: any[]): any;
  invoke(channel: string, ...args: any[]): Promise<any>;
  on(channel: string, listener: (event: any, ...args: any[]) => void): this;
  once(channel: string, listener: (event: any, ...args: any[]) => void): this;
  removeListener(channel: string, listener: (...args: any[]) => void): this;
  removeAllListeners(channel: string): this;
}

declare global {
  interface Window {
    require?: (module: "electron") => {
      ipcRenderer: IpcRenderer;
    };
  }
}

export {};
