import { IInvoice } from '@/models/invoices.interface';
import { getInvoices } from '@/services/invoice.service';
import React, { useEffect, useState } from 'react';
import '../../../../../assets/style/invoice-table.css'

export default function InvoicesTableComponent(props: {
  getSelectedProjects: Function,
  showInvoices: boolean
}) {

  const [invoices, setInvoices] = useState([] as IInvoice[]);
  const [insertNewRow, setInsertNewRow] = useState(false);

  useEffect(() => {
    getInvoices(props.getSelectedProjects())
    .then((invoices: IInvoice[]) => {
      console.log("getting invoices");
      setInvoices(invoices);
      console.log(invoices);
    })
  }, [])
  console.log("INVOICES");

  return (
    <table>
      <thead>
        <tr>
          <td>Last updated</td>
          <td>Name</td>
          <td>Value</td>
          <td>Description</td>
          <td>File</td>
          <td>Label</td>
          <td><button onClick={() => setInsertNewRow((prevState: boolean) => !prevState)}>Add row</button></td>
        </tr>
        { insertNewRow &&
          <tr className="new-row">
            <td>N\A</td>
            <td><input type="text" /></td>
            <td><input type="text" /></td>
            <td><textarea></textarea></td>
            <td>File</td>
            <td>Label</td>
            <td>
              <button>Save</button>
              <button>Cancel</button>
            </td>
          </tr>
        }
        {
          invoices.map((invoice: IInvoice) => (
            <tr key={invoice.uid}>
              <td>{ invoice.updatedAt }</td>
              <td>{ invoice.name }</td>
              <td>{ invoice.amount }</td>
              <td>{ invoice.description }</td>
              <td>File</td>
              <td>Label</td>
              <td><button>Edit</button></td>
            </tr>
          ))
        }
        
      </thead>
    </table>
  )
}