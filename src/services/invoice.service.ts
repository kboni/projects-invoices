import { IFilter } from "@/models/filters.interface";
import { IInvoice } from "@/models/invoices.interface";
import { IProject } from "@/models/projects.interface";
import { ipcRenderer, OpenDialogReturnValue } from "electron";

export function getInvoices(projects: IProject[]): Promise<IInvoice[]> {
  return ipcRenderer.invoke("getInvoices", projects);
}

export function getFilteredInvoices(projects: IProject[], filters: IFilter): Promise<IInvoice[]> {
  return ipcRenderer.invoke("getFilteredInvoices", projects, filters);
}

export function insertNewInvoice(invoice: IInvoice): Promise<IInvoice> {
  return ipcRenderer.invoke("insertNewInvoice", invoice);
}

export function updateInvoice(invoice: IInvoice): Promise<number> {
  return ipcRenderer.invoke("updateInvoice", invoice);
}

export function deleteInvoices(invoices: IInvoice[]): Promise<number[]> {
  return ipcRenderer.invoke("deleteInvoices", invoices);
}

export function selectAttachment(): Promise<OpenDialogReturnValue> {
  return ipcRenderer.invoke("selectFile");
}

export function openAttachment(invoice: IInvoice): void {
  ipcRenderer.invoke("openFile", invoice.attachment);
}