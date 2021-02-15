import { IInvoice } from "@/models/invoices.interface";
import { IProject } from "@/models/projects.interface";
import { ipcRenderer } from "electron";

export function getInvoices(projects: IProject[]): Promise<IInvoice[]> {
  return ipcRenderer.invoke("getInvoices", projects);
}

export function insertNewInvoice(invoice: IInvoice): Promise<IInvoice> {
  return ipcRenderer.invoke("insertNewInvoice", invoice);
}

export function updateProject(project: IProject): Promise<number> {
  return ipcRenderer.invoke("updateProject", project);
}

export function deleteInvoices(invoices: IInvoice[]): Promise<number[]> {
  return ipcRenderer.invoke("deleteInvoices", invoices);
}