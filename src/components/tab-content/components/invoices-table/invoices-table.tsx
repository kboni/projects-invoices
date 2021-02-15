import { IElementLabel } from '@/models/element-labels.interface';
import { IInvoice, IInvoiceCheckboxHelper } from '@/models/invoices.interface';
import { IProject } from '@/models/projects.interface';
import { getAllElementLabels } from '@/services/elementLabel.service';
import { deleteInvoices, getInvoices, insertNewInvoice } from '@/services/invoice.service';
import { formateDateTime, generateEmptyInvoiceObject, removeItemFromArray } from '@/utils/utils';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { confirmAlert } from 'react-confirm-alert';
import '../../../../../assets/style/invoice-table.css'

export default function InvoicesTableComponent(props: {
  getSelectedProjects: Function,
  showInvoices: boolean
}) {

  const [selectedProjects, setSelectedProjects] = useState([] as IProject[]);
  const [invoices, setInvoices] = useState([] as IInvoiceCheckboxHelper[]);
  const [numberOfSelectedInvoices, setNumberOfSelectedInvoices] = useState(0);
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
  function onInputChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setInvoiceToEdit((prevState: IInvoice) => ({
        ...prevState,
        [event.target.name]: event.target.value
    }));
  }

  
  function getSelectedInvoices() {
    return invoices.filter(invoice => !!invoice.checked);
  }

  function toggleAllInvoicesSelection(select: boolean) {
    setNumberOfSelectedInvoices(select ? invoices.length : 0);
    setInvoices((prevState: IInvoiceCheckboxHelper[]) => {
      return prevState.map((invoice: IInvoiceCheckboxHelper) => {
        invoice.checked = select;
        return invoice;
      })
    })
  }
  
  // TODO: Duplicated - put it to shared
  function onDeleteButtonClick() {
    confirmAlert({
      title: 'Confirm to submit',
      message: 'Are you sure you want to delete the selected invoice(s)?',
      buttons: [
        {
          label: 'Yes',
          onClick: () => {
            console.log("Delete")
            deleteInvoices(getSelectedInvoices())
            .then((arrayOfDeletedRowNumbers: number[]) => {
              // TODO: if arrayOfDeletedRowNumbers === [0] then it's an error because nothing got deleted
              fetchInvoices();
              toggleAllInvoicesSelection(false);
              console.log(arrayOfDeletedRowNumbers);
              // TODO: uncheck all checkboxes
            })
            .catch((err: Error) => {
              console.error(err);
              alert(err.message);
            });
          }
        },
        {
          label: 'No',
          onClick: () => {}
        }
      ]
    });
  }

  function onCheckboxChange(event: ChangeEvent<HTMLInputElement>) {
    const option = event.target.name;

    if (option === 'selectAll') {
      toggleAllInvoicesSelection(event.target.checked);
      return;
    } 
    else if (option === 'invoiceUid') {
      console.log('SELECTED')
      setNumberOfSelectedInvoices((prevState: number) => event.target.checked ? ++prevState : --prevState);
      setInvoices((prevState: IInvoiceCheckboxHelper[]) => {
        return prevState.map((invoice: IInvoiceCheckboxHelper) => {
          if(invoice.uid === event.target.value) {
            invoice.checked = event.target.checked;
          }
          return invoice;
        })
      });
    }
  }

  return (
    <div>
      <button disabled={numberOfSelectedInvoices < 1} onClick={onDeleteButtonClick}>Delete selected invoices</button>
      <table>
        <thead>
          <tr>
            <td><input type="checkbox" name="selectAll" value="" checked={numberOfSelectedInvoices === invoices.length} onChange={(e) => onCheckboxChange(e)}/></td>
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
              <td><input type="checkbox" disabled={true} /></td>
              <td></td>
              <td>
                <select name="projectUid" value={selectedProjects[0].uid ? selectedProjects[0].uid : ''} onChange={onInputChange}>
                  {
                    selectedProjects.map(project => (
                      <option key={project.uid} value={project.uid}>{project.name}</option>
                    ))
                  }
                </select>
              </td>
              <td><input type="text" name="name" onChange={onInputChange}/></td>
              <td><input type="number" name="amount" onChange={onInputChange}/> HRK</td>
              <td><textarea name="description" onChange={onInputChange}></textarea></td>
              <td>File</td>
              <td>
                <select name="elementLabelUid" value={elementLabels[0].uid ? elementLabels[0].uid : ''} onChange={onInputChange}>
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
            invoices.map((invoice: IInvoiceCheckboxHelper) => (
              <tr key={invoice.uid}>
                <td><input type="checkbox" name="invoiceUid" value={invoice.uid} checked={invoice.checked || false} onChange={(e) => onCheckboxChange(e)}/></td>
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
    </div>
  )
}