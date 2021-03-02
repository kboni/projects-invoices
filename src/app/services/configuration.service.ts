import { ipcRenderer } from "electron";

export function checkAllConfig(): Promise<boolean> {
  return ipcRenderer.invoke("checkAllConfig");
}

export function getDatabasePathConfig(): Promise<string> {
  return ipcRenderer.invoke("getDatabasePathConfig");
}

export function setNewDatabasePathConfig(): Promise<string> {
  return ipcRenderer.invoke("setNewDatabasePathConfig");
}

export function setExistingDatabasePathConfig(): Promise<string[]> {
  return ipcRenderer.invoke("setExistingDatabasePathConfig");
}

export function getInvoiceFilePathConfig(): Promise<string> {
  return ipcRenderer.invoke("getInvoiceFilePathConfig");
}

export function setInvoiceFilePathConfig(): Promise<string[]> {
  return ipcRenderer.invoke("setInvoiceFilePathConfig");
}

export function getDarkMode(): Promise<boolean> {
  return ipcRenderer.invoke("getDarkMode");
}

export function toggleDarkMode(): Promise<boolean> {
  return ipcRenderer.invoke("toggleDarkMode");
}

export function restartApp(): void {
  ipcRenderer.invoke("restartApp");
}