export interface IInvoice {
  uid: string;
  projectUid: string;
  name: string;
  description: string;
  amount: number;
  attachment: string;
  elementLabelUid: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInvoiceCheckboxHelper extends IInvoice {
  isSelected?: boolean;
  isInEditMode?: boolean;
  isHidden?: boolean;
  hiddenByFilters?: string[];
}
