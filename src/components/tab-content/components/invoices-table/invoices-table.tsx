import { IElementLabel } from '@/models/element-labels.interface';
import { FilterType } from '@/models/filters.enum';
import { IFilter } from '@/models/filters.interface';
import { InvoiceModeEnum } from '@/models/invoice-mode-enum';
import { IInvoice, IInvoiceCheckboxHelper } from '@/models/invoices.interface';
import { IProject } from '@/models/projects.interface';
import { getAllElementLabels } from '@/services/elementLabel.service';
import * as invoiceService from '@/services/invoice.service';
import { cloneObject, formateDateTime, removeItemFromArrayOnce } from '@/utils/utils';
import { State, useState as hsUseState} from '@hookstate/core';
import { OpenDialogReturnValue } from 'electron';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { confirmAlert } from 'react-confirm-alert';
import '../../../../../assets/style/invoice-table.css';

export default function InvoicesTableComponent(props: {
  selectedProjects: IProject[],
  showInvoices: boolean
}) {

  const hsAllInvoices = hsUseState([] as IInvoiceCheckboxHelper[]);
  const [numberOfSelectedInvoices, setNumberOfSelectedInvoices] = useState(0);
  const [elementLabels, setElementLabels] = useState([] as IElementLabel[]);
  const invoiceToEdit = hsUseState(getEmptyInvoice());
  const [invoiceMode, setInoviceMode] = useState(InvoiceModeEnum.NONE);

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
      setElementLabels(fetchedElementlabels);
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

  function setVisibleInvoices(updatedFilter?: FilterType) {
    if (invoiceMode !== InvoiceModeEnum.FILTER || !updatedFilter) {
      return;
    }

    // switch (updatedFilter) {
    //   case FilterType.NAME:
    //     visibleInvoices.set(
    //       (prevState: IInvoiceCheckboxHelper[]) =>
    //       prevState.filter(
    //         (invoice: IInvoiceCheckboxHelper) => 
    //         invoice.name.includes(hsFilters.value.name)));
    //     return;
    //   case FilterType.DESCRIPTION:
    //     visibleInvoices.set(
    //       (prevState: IInvoiceCheckboxHelper[]) =>
    //       prevState.filter(
    //         (invoice: IInvoiceCheckboxHelper) =>
    //         invoice.description.includes(hsFilters.value.description)));
    //     return;
    //   case FilterType.DATE:
    //     return;
    // };
  }

  function onSaveButtonClick() {
    if (invoiceMode === InvoiceModeEnum.INSERT) {
      invoiceService.insertNewInvoice(invoiceToEdit.value)
      .then((insertedInvoice: IInvoice) => {
        resetInvoiceToEdit();
        setInoviceMode(InvoiceModeEnum.NONE);
        fetchInvoices();
      })
      .catch((err: Error) => {
        console.error(err);
      });
    } else if (invoiceMode === InvoiceModeEnum.EDIT) {
      invoiceService.updateInvoice(invoiceToEdit.value)
      .then((numberOfUpdatedItems: number) => {
        resetInvoiceToEdit();
        setInoviceMode(InvoiceModeEnum.EDIT);
        invoiceToEdit.set({} as IInvoice)
        fetchInvoices();
      })
      .catch((err: Error) => {
        console.error(err);
      });
    }
  }

  function onCancelButtonClick() {
    resetInvoiceToEdit();
    setInoviceMode(InvoiceModeEnum.NONE);
    invoiceMode === InvoiceModeEnum.EDIT && getSelectedInvoiceStates()[0].isInEditMode.set(false);
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
    setNumberOfSelectedInvoices(select ? hsAllInvoices.value.length : 0);
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

  function onSelectAllCheckboxChange(event: ChangeEvent<HTMLInputElement>) {
    const option = event.target.name;

    if (option === 'selectAll') {
      toggleAllInvoicesSelection(event.target.checked);
      return;
    } 
    else if (option === 'invoiceUid') {
      setNumberOfSelectedInvoices((prevState: number) => event.target.checked ? ++prevState : --prevState);
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

    setNumberOfSelectedInvoices((prevState: number) => event.target.checked ? ++prevState : --prevState);
    hsAllInvoices[index].isSelected.set(event.target.checked);
  }

  function getSelectedInvoicesTotal() {
    const invs = numberOfSelectedInvoices < 1 || numberOfSelectedInvoices === hsAllInvoices.value.length
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
    setInoviceMode(InvoiceModeEnum.INSERT);
  }

  function onEditButtonClick() {
    setInoviceMode(InvoiceModeEnum.EDIT);
    const selectedInvoiceState = getSelectedInvoiceStates()[0];
    selectedInvoiceState.isInEditMode.set(true);
    invoiceToEdit.set(cloneObject(selectedInvoiceState.value));
  }

  function onShowFilterButtonClick() {
    setInoviceMode(InvoiceModeEnum.FILTER);
  }

  function onHideFilterButtonClick() {
    // TODO: reset filters and load all invoices
    setInoviceMode(InvoiceModeEnum.NONE);
  }

  function getSelectedProjectsOptions() {
    return (
      props.selectedProjects.map(project => (
        <option key={project.uid} value={project.uid}>{project.name}</option>
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
    hsFilters.elementLabelUid.set(event.target.value);
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
        <div className="column">
           {/*<div className="invoice-filter-container">
            <span>Spremljeni filteri</span><br/>
          </div> */}
        </div>
        <div className="column">
          <div className="invoice-details-container">
            <span>Detalji računa</span><br/>
            <span>Ukupan iznos { numberOfSelectedInvoices < 1 ? '' : 'oznacenih ' }računa: </span><br/>
            <span>{getSelectedInvoicesTotal()} HRK</span>
          </div>
        </div>
      </div>
      { invoiceMode !== InvoiceModeEnum.FILTER && <button disabled={ invoiceMode !== InvoiceModeEnum.NONE } onClick={onShowFilterButtonClick}>Prikazi filtere</button>}
      { invoiceMode === InvoiceModeEnum.FILTER && <button onClick={onHideFilterButtonClick}>Sakrij filtere</button>}
      <button disabled={ invoiceMode === InvoiceModeEnum.EDIT } onClick={onAddButtonClick}>Add row</button>
      <button disabled={numberOfSelectedInvoices < 1} onClick={onDeleteButtonClick}>Delete selected invoices</button>
      <button disabled={numberOfSelectedInvoices !== 1 || invoiceMode === InvoiceModeEnum.INSERT} onClick={ onEditButtonClick }>Edit selected invoices</button>
      { (invoiceMode === InvoiceModeEnum.EDIT || invoiceMode === InvoiceModeEnum.INSERT) &&
        <div>
          <button onClick={ onSaveButtonClick } >Save</button>
          <button onClick={ onCancelButtonClick }>Cancel</button>
        </div>
      }
      <table>
        <thead>
          <tr>
            <td><input type="checkbox" name="selectAll" value="" checked={numberOfSelectedInvoices === hsAllInvoices.value.length} onChange={onSelectAllCheckboxChange}/></td>
            <td>Created on</td>
            <td>Project</td>
            <td>Name</td>
            <td>Amount</td>
            <td>Description</td>
            <td>File</td>
            <td>Label</td>
          </tr>
          { invoiceMode === InvoiceModeEnum.FILTER &&
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
                {
                  elementLabels.map(label => (
                    <option key={label.uid} value={label.uid}>{label.name}</option>
                  ))
                }
              </select>
            </td>
          </tr> }
          { invoiceMode === InvoiceModeEnum.INSERT &&
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
                  {
                    elementLabels.map(label => (
                      <option key={label.uid} value={label.uid}>{label.name}</option>
                    ))
                  }
                </select>
              </td>
            </tr>
          }
          {
            hsAllInvoices.value.map((invoice: IInvoiceCheckboxHelper, index: number) => (
              <tr key={index} >
                <td>
                  <input type="checkbox" name={invoice.uid} value={index} checked={invoice.isSelected || false} onChange={onCheckboxChange}/>
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
                <td>{ invoice.isInEditMode ? <input type="number" name="amount" value={invoiceToEdit.value.amount} onChange={onInputChange}/> : invoice.amount } HRK</td>
                <td>{ invoice.isInEditMode ? <textarea name="description" value={invoiceToEdit.value.description} onChange={onInputChange}></textarea> : invoice.description }</td>
                <td>
                  { invoice.isInEditMode 
                    ? <div>
                        <button onClick={selectFile}>Select new file</button>
                        <br/><span>{invoiceToEdit.attachment.value}</span>
                        {/* <br/><span>{invoiceToEdit.value.attachment ? invoiceToEdit.value.attachment : ''}</span> */}
                      </div>
                    : invoice.attachment 
                      ? <button disabled={invoiceMode === InvoiceModeEnum.FILTER} onClick={() => {openFile(invoice)}}>Open file</button>
                      : <span>No file</span>
                  }
                </td>
                <td>
                  <select 
                    name="elementLabelUid"
                    disabled={!(invoice.isInEditMode)}
                    value={invoice.isInEditMode ? invoiceToEdit.value.elementLabelUid : invoice.elementLabelUid}
                    onChange={onInputChange}>
                    {
                      elementLabels.map(label => ( // TODO: Put labels in an array to avoid maping separately in every single row
                        <option key={label.uid} value={label.uid}>{label.name}</option>
                      ))
                    }
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