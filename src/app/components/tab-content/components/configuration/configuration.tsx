import '@css/shared.css';
import { useState } from '@hookstate/core';
import * as configurationService from '@reactapp/services/configuration.service';
import React, { useEffect } from 'react';

export function ConfigurationComponent() {

  const noDatabase = 'No Database selected';
  const selectedDatabasePathState = useState(noDatabase);
  const noInvoiceFileLocation = 'No Invoice file location selected';
  const selectedFileLocationPathState = useState(noInvoiceFileLocation);

  // TODO: Add error handlers

  useEffect(() => {
    configurationService.getDatabasePathConfig()
    .then((databasePathConfig: string) => {
      databasePathConfig && selectedDatabasePathState.set(databasePathConfig);
    });
    configurationService.getInvoiceFilePathConfig()
    .then((invoiceFilePathConfig: string) => {
      invoiceFilePathConfig && selectedFileLocationPathState.set(invoiceFilePathConfig);
    });
  }, []);

  function setDarkMode(darkMode: boolean) {
    document.body.style.backgroundColor = darkMode ? '#252525' : 'white';
  }

  function onNewDatabaseButtonClick() {
    configurationService.setNewDatabasePathConfig()
    .then((databasePathConfig: string) => {
      databasePathConfig && selectedDatabasePathState.set(databasePathConfig);
    });
  }
  
  function onExistingDatabaseButtonClick() {
    configurationService.setExistingDatabasePathConfig()
    .then((databasePathConfig: string[]) => {
      databasePathConfig && selectedDatabasePathState.set(databasePathConfig[0]);
    });
  }

  function onFileFolderButtonClick() {
    configurationService.setInvoiceFilePathConfig()
    .then((fileFolderPathConfig: string[]) => {
      fileFolderPathConfig && selectedFileLocationPathState.set(fileFolderPathConfig[0]);
    });
  }

  function onDarkModeButtonClick() {
    configurationService.toggleDarkMode()
    .then((darkMode: boolean) => {
      setDarkMode(darkMode);
    });
  }

  function onRestartAppButtonClick() {
    configurationService.restartApp()
  }

  return (
    <div  className="inner-tabcontent">
      <span className="blue-text">
        {selectedDatabasePathState.value}
      </span>
      <br />
      <button type="button" onClick={onNewDatabaseButtonClick}>Odaberi mjesto nove baze podataka</button>
      <button type="button" onClick={onExistingDatabaseButtonClick}>Odaberi postojeću bazu podataka</button>
      <br />
      <br />
      <span className="blue-text">
        {selectedFileLocationPathState.value}
      </span>
      <br />
      <button type="button" onClick={onFileFolderButtonClick}>Odaberi mjesto za spremanje fajlova računa</button>
      <br />
      <br />
      <button type="button" onClick={onDarkModeButtonClick}>Uključi/isključi Dark mode</button>
      <br />
      <br />
      <br />
      <br />
      <button type="button" onClick={onRestartAppButtonClick}>Ponovo pokreni aplikaciju</button>
    </div>
  )
}