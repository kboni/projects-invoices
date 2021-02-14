import { IElementLabel } from '@/models/element-labels.interface';
import { IInvoice } from '@/models/invoices.interface';
import { IProject } from '@/models/projects.interface';
import { getAllElementLabels } from '@/services/elementLabel.service';
import { getInvoices, insertNewInvoice } from '@/services/invoice.service';
import { formateDateTime, generateEmptyInvoiceObject } from '@/utils/utils';
import React, { ChangeEvent, useEffect, useState } from 'react';
import '../../../../../assets/style/invoice-table.css'

export default function InvoicesTableComponent(props: {
  getSelectedProjects: Function,
  showInvoices: boolean
}) {

  const [selectedProjects, setSelectedProjects] = useState([] as IProject[]);
  const [invoices, setInvoices] = useState([] as IInvoice[]);
  const [elementLabels, setElementLabels] = useState([] as IElementLabel[]);
  const [invoiceToEdit, setInvoiceToEdit] = useState(generateEmptyInvoiceObject());
  const [insertNewRow, setInsertNewRow] = useState(false);

  useEffect(() => {
    const projs: IProject[] = props.getSelectedProjects();
    setSelectedProjects(projs);
    setInvoiceToEdit((prevState: IInvoice) => ({
        ...prevState,
        projectUid: projs[0].uid
    }));
    fetchInvoices(projs);

    getAllElementLabels()
    .then((fetchedElementlabels: IElementLabel[]) => {
      setElementLabels(fetchedElementlabels);
      console.log(fetchedElementlabels);
      setInvoiceToEdit((prevState: IInvoice) => ({
        ...prevState,
        elementLabelUid: fetchedElementlabels[0].uid
    }));
    })
  }, [])
  console.log("INVOICES");

  function fetchInvoices(projs?: IProject[]) {
    console.log("AAAAAAA")
    console.log(projs);
    console.log(selectedProjects);
    getInvoices(projs ? projs : selectedProjects)
    .then((fetchedInvoices: IInvoice[]) => {
      console.log("getting invoices");
      setInvoices(fetchedInvoices);
      console.log(fetchedInvoices);
    })
    .catch((err: Error) => {
      console.error(err);
    });
  }

  function saveNewInvoice() {
    console.log(invoiceToEdit)
    insertNewInvoice(invoiceToEdit)
    .then((insertedInvoice: IInvoice) => {
      resetTextFields();
      setInsertNewRow(false);
      fetchInvoices();
      console.log("INVOICE SAVED");
      console.log(insertedInvoice);
    })
  }

  function onCancelButtonClick() {
    resetTextFields();
    setInsertNewRow(false);
  }

  function resetTextFields () {
    setInvoiceToEdit((prevState: IInvoice) => ({
      ...prevState,
      name: '',
      amount: 0,
      description: '',
      attachment: ''
    }));
  }

  // TODO: Duplicated - put it to shared
  function onChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setInvoiceToEdit((prevState: IInvoice) => ({
        ...prevState,
        [event.target.name]: event.target.value
    }));
  }

  return (
    <table>
      <thead>
        <tr>
          <td>Created on</td>
          <td>Project</td>
          <td>Name</td>
          <td>Amount</td>
          <td>Description</td>
          <td>File</td>
          <td>Label</td>
          <td><button onClick={() => setInsertNewRow((prevState: boolean) => !prevState)}>Add row</button></td>
        </tr>
        { insertNewRow &&
          <tr className="new-row">
            <td></td>
            <td>
              <select name="projectUid" value={selectedProjects[0].uid ? selectedProjects[0].uid : ''} onChange={onChange}>
                {
                  selectedProjects.map(project => (
                    <option key={project.uid} value={project.uid}>{project.name}</option>
                  ))
                }
              </select>
            </td>
            <td><input type="text" name="name" onChange={onChange}/></td>
            <td><input type="number" name="amount" onChange={onChange}/> HRK</td>
            <td><textarea name="description" onChange={onChange}></textarea></td>
            <td>File</td>
            <td>
              <select name="elementLabelUid" value={elementLabels[0].uid ? elementLabels[0].uid : ''} onChange={onChange}>
                {
                  elementLabels.map(label => (
                    <option key={label.uid} value={label.uid}>{label.name}</option>
                  ))
                }
              </select>
            </td>
            <td>
              <button onClick={saveNewInvoice}>Save</button>
              <button onClick={onCancelButtonClick}>Cancel</button>
            </td>
          </tr>
        }
        {
          invoices.map((invoice: IInvoice) => (
            <tr key={invoice.uid}>
              <td>{ formateDateTime(invoice.updatedAt) }</td>
              <td>
                <select disabled={true} value={invoice.projectUid ? invoice.projectUid : ''}>
                  {
                    selectedProjects.map(project => (
                      <option key={project.uid} value={project.uid}>{project.name}</option>
                    ))
                  }
                </select>
              </td>
              <td>{ invoice.name }</td>
              <td>{ invoice.amount } HRK</td>
              <td>{ invoice.description }</td>
              <td>File</td>
              <td>
                <select disabled={true} value={invoice.elementLabelUid ? invoice.elementLabelUid : ''}>
                  {
                    elementLabels.map(label => (
                      <option key={label.uid} value={label.uid}>{label.name}</option>
                    ))
                  }
                </select>
              </td>
              <td><button>Edit</button></td>
            </tr>
          ))
        }
        
      </thead>
    </table>
  )
}