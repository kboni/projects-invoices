import { IElementLabel } from '@/models/element-labels.interface';
import * as elementLabelService from '@/services/elementLabel.service';
import { cloneObject } from '@/utils/utils';
import { useState } from '@hookstate/core';
import React from 'react';
import { confirmAlert } from 'react-confirm-alert';

export default function LabelEditorComponent() {

  const elementLabelsState = useState([] as IElementLabel[]);
  const newLabelNameState = useState(getEmptyElementLabel());

  React.useEffect(() => {
    getAllElementLabels()
  }, []);
  
  function getEmptyElementLabel(): IElementLabel {
    return {uid: '', name: ''}
  }

  function getAllElementLabels() {
    elementLabelService.getAllElementLabels()
    .then((elementLabels) => {
      elementLabelsState.set(elementLabels);
    })
    .catch((error: Error) => {
      console.error(error);
    });
  }

  function insertNewElementLabel() {
    elementLabelService.insertNewElementLabel(cloneObject(newLabelNameState.value))
    .then(() => {
      resetEelementLabels()
    })
    .catch((error: Error) => {
      console.error(error);
    });
  }

  function updateElementLabel(elementLabelIndex: number) {
    elementLabelService.updateElementLabel(cloneObject(elementLabelsState[elementLabelIndex].value))
    .then(() => {
      resetEelementLabels();
    })
    .catch((error: Error) => {
      console.error(error);
    });
  }

  function deleteElementLabel(elementLabelIndex: number) {
    confirmAlert({
      title: 'Confirm to submit',
      message: 'Are you sure you want to delete the label?',
      buttons: [
        {
          label: 'Yes',
          onClick: () => {
            elementLabelService.deleteElementLabel(cloneObject(elementLabelsState[elementLabelIndex].value))
            .then(() => {
              resetEelementLabels();
            })
            .catch((error: Error) => {
              console.error(error);
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

  function resetEelementLabels() {
    newLabelNameState.set(getEmptyElementLabel());
    getAllElementLabels();
  }
  
  return (
    <div>
      Elementi:<br />
      {
        elementLabelsState.value.map((label: IElementLabel, index: number) => 
          (index > 0 && 
          <div key={index}>
            <input 
              type="text"
              value={label.name}
              onChange={(e) => elementLabelsState[index].name.set(e.target.value)}
            />
            <button onClick={() => updateElementLabel(index)}>Save changes</button>
            <button onClick={() => deleteElementLabel(index)}>Delete</button>
            <br />
          </div>
          ))
      }
      <input
        type="text"
        placeholder="New label"
        value={newLabelNameState.name.value}
        onChange={(e) => newLabelNameState.name.set(e.target.value)}
      />
      <button onClick={insertNewElementLabel}>Save</button>
      <br />
      <button onClick={resetEelementLabels}>Reset</button>
    </div>
  )
}