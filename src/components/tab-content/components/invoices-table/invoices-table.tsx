import { IElementLabel } from '@/models/element-labels.interface';
import { FilterType } from '@/models/filters.enum';
import { IFilter } from '@/models/filters.interface';
import { InvoiceModeEnum } from '@/models/invoice-mode-enum';
import { IInvoice, IInvoiceCheckboxHelper } from '@/models/invoices.interface';
import { IProject } from '@/models/projects.interface';
import { getAllElementLabels } from '@/services/elementLabel.service';
import * as invoiceService from '@/services/invoice.service';
import { cloneObject, formatCurrency, formateDateTime, removeItemFromArrayOnce } from '@/utils/utils';
import { State, useState as hsUseState} from '@hookstate/core';
import { OpenDialogReturnValue } from 'electron';
import React, { ChangeEvent, useEffect } from 'react';
import { confirmAlert } from 'react-confirm-alert';
import '../../../../../assets/style/invoice-table.css';

export default function InvoicesTableComponent(props: {
  selectedProjects: IProject[],
  showInvoices: boolean
}) {

  const hsAllInvoices = hsUseState([] as IInvoiceCheckboxHelper[]);
  const hsAllElementLabels = hsUseState([] as IElementLabel[]);
  const hsNumberOfSelectedInvoices = hsUseState(0);
  const invoiceToEdit = hsUseState(getEmptyInvoice());
  const hsInvoiceMode = hsUseState(InvoiceModeEnum.NONE);
  const hsFilters = hsUseState(getEmptyFilter());

  function getEmptyInvoice(): IInvoiceCheckboxHelper {
    return { 
      uid: '',
      projectUid: '',
      name: '',
      amount: 0,
      description: '',
      attachment: '',
      elementLabelUid: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      isSelected: false,
      isHidden: false,
      hiddenByFilters: []
    }
  }

  function getEmptyFilter(): IFilter {
    return {
      date: {},
      name: '',
      amount: {from: 0},
      description: '',
      elementLabelUid: ''
    }
  }

  useEffect(() => {
    invoiceToEdit.projectUid.set(props.selectedProjects[0].uid);
    fetchInvoices();

    getAllElementLabels()
    .then((fetchedElementlabels: IElementLabel[]) => {
      hsAllElementLabels.set(fetchedElementlabels);
      invoiceToEdit.elementLabelUid.set(fetchedElementlabels[0].uid);
    })
  }, [])

  function fetchInvoices() {
    invoiceService.getInvoices(props.selectedProjects)
    .then((fetchedInvoices: IInvoice[]) => {
      hsAllInvoices.set(fetchedInvoices);
    })
    .catch((err: Error) => {
      console.error(err);
    });
  } 

  function onSaveButtonClick() {
    if (hsInvoiceMode.value === InvoiceModeEnum.INSERT) {
      invoiceService.insertNewInvoice(invoiceToEdit.value)
      .then((insertedInvoice: IInvoice) => {
        resetInvoiceToEdit();
        hsInvoiceMode.set(InvoiceModeEnum.NONE);
        fetchInvoices();
      })
      .catch((err: Error) => {
        console.error(err);
      });
    } else if (hsInvoiceMode.value === InvoiceModeEnum.EDIT) {
      invoiceService.updateInvoice(cloneObject(invoiceToEdit.value))
      .then((numberOfUpdatedItems: number) => {
        resetInvoiceToEdit();
        fetchInvoices();
      })
      .catch((err: Error) => {
        console.error(err);
      });
    }
  }

  function onCancelButtonClick() {
    resetInvoiceToEdit();
    hsInvoiceMode.set(InvoiceModeEnum.NONE);
    hsInvoiceMode.value === InvoiceModeEnum.EDIT && getSelectedInvoiceStates()[0].isInEditMode.set(false);
  }

  function resetInvoiceToEdit () {
    invoiceToEdit.set((prevState: IInvoice) => ({
      ...prevState,
      name: '',
      amount: 0,
      description: '',
      attachment: ''
    }));
  }

  // TODO: Duplicated - put it to shared
  function onInputChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    invoiceToEdit.set((prevState: IInvoice) => ({
        ...prevState,
        [event.target.name]: event.target.value
    }));
  }

  
  function getSelectedInvoiceStates(): State<IInvoiceCheckboxHelper>[] {
    return hsAllInvoices.filter(invoice => !!invoice.value.isSelected);
  }

  function getSelectedInvoices(): IInvoiceCheckboxHelper[] {
    return hsAllInvoices.value.filter(invoice => !!invoice.isSelected);
  }

  function toggleAllInvoicesSelection(select: boolean) {
    hsNumberOfSelectedInvoices.set(select ? hsAllInvoices.value.length : 0);
    hsAllInvoices.set((prevState: IInvoiceCheckboxHelper[]) => {
      return prevState.map((invoice: IInvoiceCheckboxHelper) => {
        invoice.isSelected = select;
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
            invoiceService.deleteInvoices(getSelectedInvoices())
            .then((arrayOfDeletedRowNumbers: number[]) => {
              // TODO: if arrayOfDeletedRowNumbers === [0] then it's an error because nothing got deleted
              fetchInvoices();
              toggleAllInvoicesSelection(false);
              console.log(arrayOfDeletedRowNumbers);
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

  function onSelectAllCheckboxChange(event: ChangeEvent<HTMLInputElement>) {
    const option = event.target.name;

    if (option === 'selectAll') {
      toggleAllInvoicesSelection(event.target.checked);
      return;
    } 
    else if (option === 'invoiceUid') {
      hsNumberOfSelectedInvoices.set((prevState: number) => event.target.checked ? ++prevState : --prevState);
      hsAllInvoices.set((prevState: IInvoiceCheckboxHelper[]) => {
        return prevState.map((invoice: IInvoiceCheckboxHelper) => {
          if(invoice.uid === event.target.value) {
            invoice.isSelected = event.target.checked;
          }
          return invoice;
        })
      });
    }
  }

  function onCheckboxChange(event: ChangeEvent<HTMLInputElement>) {
    const index = Number(event.target.value);

    hsNumberOfSelectedInvoices.set((prevState: number) => event.target.checked ? ++prevState : --prevState);
    hsAllInvoices[index].isSelected.set(event.target.checked);
  }

  function getSelectedInvoicesTotal() {
    const invs = hsNumberOfSelectedInvoices.value < 1 || hsNumberOfSelectedInvoices.value === hsAllInvoices.value.length
      ? hsAllInvoices.value
      : getSelectedInvoices();
    
      return invs.reduce((total: number, invoice: IInvoice) => total + (invoice.amount || 0), 0 )
  }

  function selectFile() {
    invoiceService.selectAttachment()
    .then((file: OpenDialogReturnValue) => {
      console.log(file);
      if (!file.canceled) {
        invoiceToEdit.attachment.set(file.filePaths[0])
      }
    })
  }

  function openFile(invoice: IInvoice) {
    invoiceService.openAttachment(invoice);
  }

  function onAddButtonClick() {
    hsInvoiceMode.set(InvoiceModeEnum.INSERT);
  }

  function onEditButtonClick() {
    hsInvoiceMode.set(InvoiceModeEnum.EDIT);
    const selectedInvoiceState = getSelectedInvoiceStates()[0];
    selectedInvoiceState.isInEditMode.set(true);
    invoiceToEdit.set(cloneObject(selectedInvoiceState.value));
  }

  function onShowFilterButtonClick() {
    hsInvoiceMode.set(InvoiceModeEnum.FILTER);
  }

  function onHideFilterButtonClick() {
    hsFilters.set(getEmptyFilter())
    fetchInvoices()
    hsInvoiceMode.set(InvoiceModeEnum.NONE);
  }

  function getSelectedProjectsOptions() {
    return (
      props.selectedProjects.map(project => (
        <option key={project.uid} value={project.uid}>{project.name}</option>
      ))
    );
  }

  function getElementLabelOptions() {
    return (
      hsAllElementLabels.value.map(label => (
        <option key={label.uid} value={label.uid}>{label.name}</option>
      ))
    );
  }

  // FILTERS
  function onNameFilterChange(event: ChangeEvent<HTMLInputElement>) {
    hsFilters.name.set(event.target.value);
    fetchFilteredInvoices()
  }
  
  function onDescriptionFilterChange(event: ChangeEvent<HTMLInputElement>) {
    hsFilters.description.set(event.target.value);
    fetchFilteredInvoices()
  }
  
  function onDateFilterChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.name === 'from') {
      hsFilters.date.set(prevState => ({...prevState, from: event.target.value}));
    } else {
      hsFilters.date.set(prevState => ({...prevState, to: event.target.value}));
    }
    fetchFilteredInvoices()
  }
  
  function onAmountFilterChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.name === 'from') {
      hsFilters.amount.set(prevState => ({...prevState, from: Number(event.target.value)}));
    } else {
      hsFilters.amount.set(prevState => ({...prevState, to: Number(event.target.value)}));
    }
    fetchFilteredInvoices()
  }

  function onElementLabelFilterChange(event: ChangeEvent<HTMLSelectElement>) {
    hsFilters.elementLabelUid.set(event.target.value ? event.target.value : '');
    fetchFilteredInvoices()
  }

  function fetchFilteredInvoices() {
    // TODO: Take care of selection when filters are on
    console.log(filterToSerializable())
    invoiceService.getFilteredInvoices(props.selectedProjects, filterToSerializable())
    .then((fetchedInvoices: IInvoice[]) => {
      hsAllInvoices.set(fetchedInvoices);
    })
    .catch((err: Error) => {
      console.error(err);
    });
  }

  function filterToSerializable(): IFilter {
    return cloneObject(hsFilters.value)
  }

  return (
    <div>
      <div className="row">
        <div className="column"></div>
        <div className="column">
          <div className="invoice-details-container">
            <span>Detalji računa</span><br/>
            <span>Ukupan iznos { hsNumberOfSelectedInvoices.value < 1 ? '' : 'oznacenih ' }računa: </span><br/>
            <span>{formatCurrency(getSelectedInvoicesTotal())}</span>
          </div>
        </div>
      </div>
      { hsInvoiceMode.value !== InvoiceModeEnum.FILTER && <button disabled={ hsInvoiceMode.value !== InvoiceModeEnum.NONE } onClick={onShowFilterButtonClick}>Prikazi filtere</button>}
      { hsInvoiceMode.value === InvoiceModeEnum.FILTER && <button onClick={onHideFilterButtonClick}>Sakrij filtere</button>}
      <button
        disabled={ hsInvoiceMode.value === InvoiceModeEnum.INSERT || hsInvoiceMode.value === InvoiceModeEnum.EDIT }
        onClick={onAddButtonClick}>
          Add row
      </button>
      <button
        disabled={hsNumberOfSelectedInvoices.value < 1}
        onClick={onDeleteButtonClick}>
          Delete selected invoices
      </button>
      <button 
        disabled={hsNumberOfSelectedInvoices.value !== 1 || hsInvoiceMode.value === InvoiceModeEnum.INSERT || hsInvoiceMode.value === InvoiceModeEnum.EDIT} 
        onClick={ onEditButtonClick }>
          Edit selected invoices
      </button>
      { (hsInvoiceMode.value === InvoiceModeEnum.EDIT || hsInvoiceMode.value === InvoiceModeEnum.INSERT) &&
        <div>
          <button onClick={ onSaveButtonClick } >Save</button>
          <button onClick={ onCancelButtonClick }>Cancel</button>
        </div>
      }
      <table>
        <thead>
          <tr>
            <td>
              <input 
                type="checkbox"
                name="selectAll"
                disabled={hsInvoiceMode.value === InvoiceModeEnum.INSERT || hsInvoiceMode.value === InvoiceModeEnum.EDIT}
                checked={hsNumberOfSelectedInvoices.value === hsAllInvoices.value.length}
                onChange={onSelectAllCheckboxChange}/>
            </td>
            <td>Created on</td>
            <td>Project</td>
            <td>Name</td>
            <td>Amount</td>
            <td>Description</td>
            <td>File</td>
            <td>Label</td>
          </tr>
          { hsInvoiceMode.value === InvoiceModeEnum.FILTER &&
          <tr>
            <td></td>
            <td>
              From:<input name="from" type="date" onChange={onDateFilterChange}/>
              <br /> To: <input name="to" type="date" onChange={onDateFilterChange}/>
            </td>
            <td></td>
            <td>
              <input type="text" name="name" onChange={onNameFilterChange} />
            </td>
            <td>
              From:<input name="from" type="number" onChange={onAmountFilterChange}/>
              <br /> To: <input name="to" type="number" onChange={onAmountFilterChange}/>
            </td>
            <td>
              <input type="text" name="name" onChange={onDescriptionFilterChange} />
            </td>
            <td></td>
            <td>
              <select name="elementLabelUid" value={hsFilters.elementLabelUid.value} onChange={onElementLabelFilterChange}>
                {getElementLabelOptions()}
              </select>
            </td>
          </tr> }
          { hsInvoiceMode.value === InvoiceModeEnum.INSERT &&
            <tr className="new-row">
              <td><input type="checkbox" disabled={true} /></td>
              <td></td>
              <td>
                <select name="projectUid" value={invoiceToEdit.value.projectUid} onChange={onInputChange}>
                  {getSelectedProjectsOptions()}
                </select>
              </td>
              <td>
                <input type="text" name="name" onChange={onInputChange}/>
              </td>
              <td><input type="number" name="amount" onChange={onInputChange}/> HRK</td>
              <td><textarea name="description" onChange={onInputChange}></textarea></td>
              <td>
              <div>
                <button onClick={selectFile}>Select file</button>
                <br /><span>{invoiceToEdit.value.attachment}</span>
              </div>
              </td>
              <td>
                <select name="elementLabelUid" value={invoiceToEdit.value.elementLabelUid} onChange={onInputChange}>
                {getElementLabelOptions()}
                </select>
              </td>
            </tr>
          }
          {
            hsAllInvoices.value.map((invoice: IInvoiceCheckboxHelper, index: number) => (
              <tr key={index} >
                <td>
                  <input
                    type="checkbox"
                    name={invoice.uid}
                    value={index}
                    disabled={hsInvoiceMode.value === InvoiceModeEnum.INSERT || hsInvoiceMode.value === InvoiceModeEnum.EDIT}
                    checked={invoice.isSelected || false}
                    onChange={onCheckboxChange}/>
                </td>
                <td>
                  { formateDateTime(invoice.createdAt) }
                </td>
                <td>
                  <select 
                    name="projectUid"
                    disabled={invoiceToEdit.value.uid !== invoice.uid}
                    value={ invoice.isInEditMode ? invoiceToEdit.value.projectUid : invoice.projectUid }
                    onChange={onInputChange}>
                      {getSelectedProjectsOptions()}
                  </select>
                </td>
                <td>
                  { invoice.isInEditMode ? <input type="text" name="name" value={invoiceToEdit.value.name} onChange={onInputChange}/> : invoice.name }
                </td>
                <td>{ invoice.isInEditMode ? <div><input type="number" name="amount" value={invoiceToEdit.value.amount} onChange={onInputChange}/>HRK</div> : formatCurrency(invoice.amount) } </td>
                <td>{ invoice.isInEditMode ? <textarea name="description" value={invoiceToEdit.value.description} onChange={onInputChange}></textarea> : invoice.description }</td>
                <td>
                  { invoice.isInEditMode 
                    ? <div>
                        <button onClick={selectFile}>Select new file</button>
                        <br/><span>{invoiceToEdit.attachment.value}</span>
                      </div>
                    : invoice.attachment 
                      ? <button disabled={hsInvoiceMode.value === InvoiceModeEnum.FILTER} onClick={() => {openFile(invoice)}}>Open file</button>
                      : <span>No file</span>
                  }
                </td>
                <td>
                  <select 
                    name="elementLabelUid"
                    disabled={!(invoice.isInEditMode)}
                    value={invoice.isInEditMode ? invoiceToEdit.value.elementLabelUid : invoice.elementLabelUid}
                    onChange={onInputChange}>
                    {getElementLabelOptions()}
                  </select>
                </td>
              </tr>
            ))
          }
          
        </thead>
      </table>
    </div>
  )
}