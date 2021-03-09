import { DBTableName } from "@reactapp/models/database-table.enum";
import { IFilter } from "@reactapp/models/filters.interface";
import { IInvoice } from "@reactapp/models/invoices.interface";
import { IProject } from "@reactapp/models/projects.interface";
import { ipcRenderer, OpenDialogReturnValue } from "electron";

export function getInvoices(projects: IProject[], dbTableName: DBTableName): Promise<IInvoice[]> {
  return ipcRenderer.invoke("getInvoices", projects, dbTableName);
}

export function getFilteredInvoices(projects: IProject[], filters: IFilter, dbTableName: DBTableName): Promise<IInvoice[]> {
  return ipcRenderer.invoke("getFilteredInvoices", projects, filters, dbTableName);
}

export function insertNewInvoice(invoice: IInvoice, dbTableName: DBTableName): Promise<IInvoice> {
  return ipcRenderer.invoke("insertNewInvoice", invoice, dbTableName);
}

export function updateInvoice(invoice: IInvoice, dbTableName: DBTableName): Promise<number> {
  return ipcRenderer.invoke("updateInvoice", invoice, dbTableName);
}

export function deleteInvoices(invoices: IInvoice[], dbTableName: DBTableName): Promise<number[]> {
  return ipcRenderer.invoke("deleteInvoices", invoices, dbTableName);
}

export function selectAttachment(): Promise<OpenDialogReturnValue> {
  return ipcRenderer.invoke("selectFile");
}

export function openAttachment(invoice: IInvoice): void {
  ipcRenderer.invoke("openFile", invoice.attachment);
}