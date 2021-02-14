export interface IInvoice {
  uid: string;
  projectUid: string;
  name: string;
  description: string;
  amount: number;
  attachment: string;
  //TODO: label
  createdAt: Date;
  updatedAt: Date;
}
