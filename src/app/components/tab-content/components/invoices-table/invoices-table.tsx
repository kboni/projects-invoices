import { IElementLabel } from '@reactapp/models/element-labels.interface';
import { IFilter } from '@reactapp/models/filters.interface';
import { InvoiceModeEnum } from '@reactapp/models/invoice-mode-enum';
import { IInvoice, IInvoiceCheckboxHelper } from '@reactapp/models/invoices.interface';
import { IProject } from '@reactapp/models/projects.interface';
import { getAllElementLabels } from '@reactapp/services/elementLabel.service';
import * as invoiceService from '@reactapp/services/invoice.service';
import { cloneObject, formatCurrency, formateDateTime, removeItemFromArrayOnce } from '@reactapp/utils/utils';
import { State, useState as hsUseState} from '@hookstate/core';
import { OpenDialogReturnValue } from 'electron';
import React, { ChangeEvent, useEffect } from 'react';
import { confirmAlert } from 'react-confirm-alert';
import '@css/invoice-table.css';

export default function InvoicesTableComponent(props: {
  selectedProjects: IProject[],
  showInvoices: boolean
}) {

  const hsAllInvoices = hsUseState([] as IInvoiceCheckboxHelper[]);
  const hsAllElementLabels = hsUseState([] as IElementLabel[]);
  const hsNumberOfSelectedInvoices = hsUseState(0);
  const invoiceToEdit = hsUseState({} as IInvoiceCheckboxHelper);
  const hsInvoiceMode = hsUseState(InvoiceModeEnum.NONE);
  const hsFilters = hsUseState(getEmptyFilter());

  function getEmptyInvoice(elementLabelUid?: string): IInvoiceCheckboxHelper {
    return { 
      uid: '',
      projectUid: props.selectedProjects[0].uid,
      name: '',
      amount: 0,
      description: '',
      attachment: '',
      elementLabelUid: elementLabelUid ? elementLabelUid : hsAllElementLabels[0].uid.value,
      createdAt: 0,
      updatedAt: 0,
      isSelected: false
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
    fetchInvoices();

    getAllElementLabels()
    .then((fetchedElementlabels: IElementLabel[]) => {
      hsAllElementLabels.set(fetchedElementlabels);
      invoiceToEdit.set(getEmptyInvoice(fetchedElementlabels[0].uid));
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

  function afterSaveReset() {
    resetInvoiceToEdit();
        hsInvoiceMode.set(InvoiceModeEnum.NONE);
        hsNumberOfSelectedInvoices.set(0);
        fetchInvoices();
  }

  function onSaveButtonClick() {
    if (hsInvoiceMode.value === InvoiceModeEnum.INSERT) {
      invoiceToEdit.amount.set(Number(invoiceToEdit.amount.value));
      !invoiceToEdit.attachment.value && invoiceToEdit.attachment.set('')
      invoiceService.insertNewInvoice(cloneObject(invoiceToEdit.value))
      .then((insertedInvoice: IInvoice) => {
        afterSaveReset();
      })
      .catch((err: Error) => {
        console.error(err);
      });
    } else if (hsInvoiceMode.value === InvoiceModeEnum.EDIT) {
      !invoiceToEdit.attachment.value && invoiceToEdit.attachment.set('')
      invoiceService.updateInvoice(cloneObject(invoiceToEdit.value))
      .then((numberOfUpdatedItems: number) => {
        afterSaveReset();
      })
      .catch((err: Error) => {
        console.error(err);
      });
    }
  }

  function onCancelButtonClick() {
    if (hsInvoiceMode.value === InvoiceModeEnum.EDIT) {
      getSelectedInvoiceStates()[0].isInEditMode.set(false);
    }
    resetInvoiceToEdit();
    hsInvoiceMode.set(InvoiceModeEnum.NONE);
  }

  function resetInvoiceToEdit () {
    invoiceToEdit.set(getEmptyInvoice());
  }

  // TODO: Duplicated - put it to shared
  function onInputChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    invoiceToEdit.set((prevState: IInvoice) => ({
        ...prevState,
        [event.target.name]: event.target.value
    }));
  }

  
  function getSelectedInvoiceStates(): State<IInvoiceCheckboxHelper>[] {
    // return cloneObject(hsAllInvoices.filter(invoice => !!invoice.value.isSelected));
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
      title: 'Potvrda brisanja',
      message: 'Jeste li sigurni da želite obrisati označen(e) račune(e)?',
      buttons: [
        {
          label: 'Da',
          onClick: () => {
            console.log("Delete")
            invoiceService.deleteInvoices(cloneObject(getSelectedInvoices()))
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
          label: 'Ne',
          onClick: () => {}
        }
      ]
    });
  }

  function onSelectAllCheckboxChange(event: ChangeEvent<HTMLInputElement>) {
    toggleAllInvoicesSelection(event.target.checked);
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
    hsNumberOfSelectedInvoices.set(0);
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
    hsNumberOfSelectedInvoices.set(0);
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
            <span>Detalji računa</span><br/><br/>
            <span>Ukupan iznos { hsNumberOfSelectedInvoices.value < 1 ? 'prikazanih' : 'označenih' } računa: </span><br/>
            <span>{formatCurrency(getSelectedInvoicesTotal())}</span>
          </div>
        </div>
      </div>
      { hsInvoiceMode.value !== InvoiceModeEnum.FILTER && <button disabled={ hsInvoiceMode.value !== InvoiceModeEnum.NONE } onClick={onShowFilterButtonClick}>Prikaži filtere</button>}
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
                checked={hsAllInvoices.value.length > 0 && hsNumberOfSelectedInvoices.value === hsAllInvoices.value.length}
                onChange={onSelectAllCheckboxChange}/>
            </td>
            <td>Kreirano</td>
            <td>Projekt</td>
            <td>Naziv</td>
            <td>Iznos</td>
            <td>Opis</td>
            <td>Fajl</td>
            <td>Oznaka</td>
          </tr>
          { hsInvoiceMode.value === InvoiceModeEnum.FILTER &&
          <tr>
            <td></td>
            <td>
              Od:<input name="from" type="date" onChange={onDateFilterChange}/>
              <br /> Do: <input name="to" type="date" onChange={onDateFilterChange}/>
            </td>
            <td></td>
            <td>
              <input type="text" name="name" onChange={onNameFilterChange} />
            </td>
            <td>
              Od:<input name="from" type="number" onChange={onAmountFilterChange}/>
              <br /> Do: <input name="to" type="number" onChange={onAmountFilterChange}/>
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
                <button onClick={selectFile}>Selektiraj fajl</button>
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
                    disabled={hsInvoiceMode.value === InvoiceModeEnum.EDIT}
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
                      ? <button disabled={hsInvoiceMode.value === InvoiceModeEnum.FILTER} onClick={() => {openFile(invoice)}}>Otvori fajl</button>
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