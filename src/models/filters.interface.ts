import { IElementLabel } from "./element-labels.interface";

export interface IFilter {
  date: {
    from?: string,
    to?: string
  },
  name: string,
  amount: {
    from?: number,
    to?: number
  },
  description: string,
  elementLabelUid: string
}