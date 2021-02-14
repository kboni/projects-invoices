import { IElementLabel } from "@/models/element-labels.interface";
import { ipcRenderer } from "electron";

export function getAllElementLabels(): Promise<IElementLabel[]> {
  return ipcRenderer.invoke("getAllElementLabels");
}