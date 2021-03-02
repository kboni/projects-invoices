import { app, BrowserWindow, dialog, ipcMain, OpenDialogReturnValue } from 'electron';
import isDev from 'electron-is-dev'; // New Import
import { Menu } from 'electron';
import Knex from 'knex';
import knexStringcase from 'knex-stringcase';
import path from 'path';
import { IElementLabel } from '@reactapp/models/element-labels.interface';
import { IFilter } from '@reactapp/models/filters.interface';
import { IInvoice } from '@reactapp/models/invoices.interface';
import { IProject } from '@reactapp/models/projects.interface';
import { generateUid } from '@reactapp/utils/utils';
import * as fs from 'fs';
import settings from 'electron-settings';


function checkConfigAndItemExists(config: string): boolean {
  const configPath = settings.getSync(config);
  if (!configPath || !fs.existsSync(configPath ? configPath.toString() : '')) {
    return false;
  }
  return true;
}

function initializeDatabase(dbPath: string) {
  const knex = Knex(knexStringcase({
		client: "sqlite3",
		connection: {
			filename: dbPath
		},
    useNullAsDefault: true
	}));
  knex.raw(`CREATE TABLE "Project" (
    "id"	INTEGER NOT NULL UNIQUE,
    "uid"	TEXT NOT NULL UNIQUE,
    "name"	TEXT NOT NULL,
    "cost"	NUMERIC,
    "description"	TEXT,
    PRIMARY KEY("id" AUTOINCREMENT)
  )`)
  .then(() =>
    knex.raw(`CREATE TABLE "Section" (
      "id"	INTEGER NOT NULL UNIQUE,
      "uid"	TEXT NOT NULL UNIQUE,
      "name"	TEXT NOT NULL,
      "cost"	NUMERIC,
      "description"	TEXT,
      PRIMARY KEY("id" AUTOINCREMENT)
    )`))
  .then(() =>
  knex.raw(`CREATE TABLE "Element_label" (
    "id"	INTEGER NOT NULL,
    "uid"	TEXT NOT NULL UNIQUE,
    "name"	TEXT NOT NULL,
    PRIMARY KEY("id" AUTOINCREMENT)
  )`))
  .then(() =>
    knex.raw(`CREATE TABLE "Invoice" (
      "id"	INTEGER NOT NULL UNIQUE,
      "uid"	TEXT NOT NULL UNIQUE,
      "project_uid"	TEXT NOT NULL,
      "name"	TEXT NOT NULL,
      "description"	TEXT,
      "amount"	NUMERIC NOT NULL,
      "attachment"	TEXT UNIQUE,
      "element_label_uid"	TEXT,
      "created_at"	INTEGER NOT NULL,
      "updated_at"	INTEGER,
      FOREIGN KEY("project_uid") REFERENCES "Project"("uid") ON DELETE CASCADE,
      FOREIGN KEY("element_label_uid") REFERENCES "Element_label"("uid"),
      PRIMARY KEY("id" AUTOINCREMENT)
    )`)
  )
  .then(() => 
    knex.raw(`CREATE TRIGGER Element_label_delete after delete ON Element_label
    BEGIN
      UPDATE Invoice
    SET element_label_uid = (SELECT uid FROM Element_label ORDER BY id ASC LIMIT 1)
    WHERE element_label_uid = OLD.uid ;
    END`))
  .then(() => 
    knex.raw(`INSERT INTO "Element_label" ("uid", "name") VALUES ("${generateUid()}", "")`))
}

function createWindow(): void {  

  let mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true
    },
    show: false
  });
  // mainWindow.setMenu(null);
  // Menu.setApplicationMenu(null);
  
  // CONFIG
  ipcMain.handle('checkAllConfig', function(event): boolean{
    return checkConfigAndItemExists('config.db') && checkConfigAndItemExists('config.fileFolder');
  });

  ipcMain.handle('getDatabasePathConfig', function(event): string | undefined {
    return settings.getSync('config.db')?.toString();
  });

  ipcMain.handle('setNewDatabasePathConfig', function(event): string | undefined {
    const dbPath = dialog.showSaveDialogSync(
      mainWindow,
      {
        filters: [
          {name: 'SQLite', extensions: ['sqlite', 'sqlite3']}
        ]
      });
    // TODO: Initialize database
    if (dbPath) {
      const dbLocation = dbPath.toString();
      settings.setSync('config.db', dbLocation);
      fs.writeFileSync(dbLocation.toString(), '');
      initializeDatabase(dbLocation);
    }

    return dbPath;
  });

  ipcMain.handle('setExistingDatabasePathConfig', function(event): string[] | undefined{
    const dbPath = dialog.showOpenDialogSync(
      mainWindow,
      {
        filters: [
          {name: 'SQLite', extensions: ['sqlite', 'sqlite3']}
        ],
        properties: [
          'openFile'
        ]
      });
    dbPath && dbPath[0] && settings.setSync('config.db', dbPath[0]);
    return dbPath;
  });

  ipcMain.handle('getInvoiceFilePathConfig', function(event): string | undefined {
    return settings.getSync('config.fileFolder')?.toString();
  });

  ipcMain.handle('setInvoiceFilePathConfig', function(event): string[] | undefined{
    const fileFolderPath = dialog.showOpenDialogSync(
      mainWindow,
      {
        properties: [
          'openDirectory'
        ]
      });
    fileFolderPath && fileFolderPath[0] && settings.setSync('config.fileFolder', fileFolderPath[0]);
    return fileFolderPath;
  });

  ipcMain.handle('getDarkMode', function(event): boolean {
    return !!settings.getSync('config.darkMode');
  });

  ipcMain.handle('toggleDarkMode', function(event): boolean {
    const currentDarkMode = settings.getSync('config.darkMode');
    settings.setSync('config.darkMode', !currentDarkMode);
    return !currentDarkMode;
  });

  ipcMain.handle('restartApp', function(event): void {
    app.relaunch();
    app.quit();
  });

  const darkModeConfig = settings.getSync('config.darkMode');
  if (typeof darkModeConfig !== 'boolean') {
    settings.setSync('config.darkMode', false);
  }
  
  console.log(isDev);
  mainWindow.loadURL(
    isDev // TODO: Replace isDev with ENV vars
      ? 'http://localhost:9000'
      : `file://${path.join(app.getAppPath(), 'index.html')}`
  );
  mainWindow.once("ready-to-show", () => { mainWindow.show() })

  mainWindow.on('closed', () => app.quit());

  const dbConfig = settings.getSync('config.db');
  if (!dbConfig || !fs.existsSync(dbConfig ? dbConfig.toString() : '')) {
    return;
  }

  const knex = Knex(knexStringcase({
		client: "sqlite3",
		connection: {
			filename: dbConfig.toString()
		},
    useNullAsDefault: true
	}));
 

  // PROJECTS
  ipcMain.handle('getAllProjects', function(event): Promise<IProject[]> {
    return knex
      .select('uid', 'name', 'cost', 'description')
      .from("Project")
  });

  ipcMain.handle('getTotalSumOfAllProjectCosts', function(event): Promise<Array<{projectCost: number}>> {
    return knex("Project")
      .sum('cost as projectCost')
  });

  ipcMain.handle('insertNewProject', function(event, project: IProject): Promise<IProject[]>{
    project.uid = project.uid ? project.uid : generateUid();
    return knex('Project')
      .insert({
        uid: project.uid,
        name: project.name,
        cost: project.cost,
        description: project.description
      })
      .onConflict('uid')
      .merge({
        uid: generateUid()
      })
      .then((insertedIdsArray: number[]) => {
        return knex('Project').where('id', insertedIdsArray[0])
      })
  });

  ipcMain.handle('updateProject', function(event, project: IProject): Promise<number>{
    return knex('Project')
      .where('uid', project.uid)
      .update({
        name: project.name,
        cost: project.cost,
        description: project.description
      });
  });

  ipcMain.handle('deleteProjects', function(event, projects: IProject[]): Promise<number[]> {
    const promises = [];

    for (let project of projects) {
      promises.push(knex('Project')
        .where('uid', project.uid)
        .del());
    }
    return Promise.all(promises);
  });

  // INVOICES
  ipcMain.handle('getInvoices', function(event, projects: IProject[]): Promise<IInvoice[]> {
    return knex("Invoice")
      .select('uid', 'project_uid', 'name', 'amount', 'description',
        'created_at', 'updated_at', 'attachment', 'element_label_uid')
      .whereIn('project_uid', projects.map((project: IProject) => project.uid))
      .then((invoices: IInvoice[]) => 
        invoices.map((invoice: IInvoice) => {
          if (invoice.attachment) {
            invoice.attachment = getAbsoluteFilePath(invoice.attachment)
          }
          return invoice;
        }));
  });
  
  ipcMain.handle('getFilteredInvoices', function(event, projects: IProject[], filters: IFilter): Promise<IInvoice[]> {
    let result = knex("Invoice")
      .select('uid', 'project_uid', 'name', 'amount', 'description',
        'created_at', 'updated_at', 'attachment', 'element_label_uid')
      .whereIn('project_uid', projects.map((project: IProject) => project.uid))
      if (filters.name) {
        result = result.andWhere(
          knex.raw(`LOWER(name) like '%${filters.name}%'`)
        )
      }
      if (filters.description) {
        result = result.andWhere(
          knex.raw(`LOWER(description) like '%${filters.description}%'`)
        )
      }
      if (filters?.amount?.from) {
        result = result.andWhere('amount', '>', filters.amount.from)
      }
      if (filters?.amount?.to) {
        result = result.andWhere('amount', '<', filters.amount.to)
      }
      if (filters?.date?.from) {
        result = result.andWhere('created_at', '>', Date.parse(filters.date.from))
      }
      if (filters?.date?.to) {
        result = result.andWhere('created_at', '<', Date.parse(filters.date.to))
      }
      if (filters.elementLabelUid) {
        result = result.andWhere({'element_label_uid': filters.elementLabelUid});
      }
      
    return result
    .then((invoices: IInvoice[]) => 
        invoices.map((invoice: IInvoice) => {
          if (invoice.attachment) {
            invoice.attachment = getAbsoluteFilePath(invoice.attachment)
          }
          return invoice;
        }));
    });

  function getAbsoluteFilePath(fileName: string): string {
    const fileFolderBaseConfig = settings.getSync('config.fileFolder')
    const fileFolderBase = fileFolderBaseConfig ? fileFolderBaseConfig.toString() : '';
    return path.join(fileFolderBase, fileName)
  }

  function copyFile(originalPath: string, newPath: string): void {
    fs.copyFile(originalPath, getAbsoluteFilePath(newPath), function(err) { console.error(err)});
  }

  ipcMain.handle('insertNewInvoice', function(event, invoice: IInvoice): Promise<IInvoice>{
    invoice.uid = invoice.uid ? invoice.uid : generateUid();
    const attachment = path.basename(invoice.attachment);

    return knex('Invoice')
      .insert({
        uid: invoice.uid,
        project_uid: invoice.projectUid,
        name: invoice.name,
        amount: invoice.amount,
        description: invoice.description,
        element_label_uid: invoice.elementLabelUid,
        attachment: attachment,
        created_at: Date.now(),
        updated_at: Date.now()
      })
      .onConflict('uid')
      .merge({
        uid: generateUid()
      })
      .then((insertedIdsArray: number[]) => {
        copyFile(invoice.attachment, attachment);
        return knex('Invoice').first().where('id', insertedIdsArray[0])
      })
  });

  ipcMain.handle('deleteInvoices', function(event, invoices: IInvoice[]): Promise<number[]> {
    const promises = [];

    for (let invoice of invoices) {
      fs.unlink(invoice.attachment, function(err) {console.error(err)})
      promises.push(knex('Invoice')
        .where('uid', invoice.uid)
        .del());
    }
    return Promise.all(promises);
  });

  ipcMain.handle('updateInvoice', function(event, invoice: IInvoice): Promise<number>{
    const attachment = path.basename(invoice.attachment);
    return knex('Invoice')
      .where('uid', invoice.uid)
      .update({
        uid: invoice.uid,
        project_uid: invoice.projectUid,
        name: invoice.name,
        amount: invoice.amount,
        description: invoice.description,
        element_label_uid: invoice.elementLabelUid,
        attachment: attachment,
        updated_at: Date.now()
      })
      .then((numberOfUpdatedItems: number) => {
        copyFile(invoice.attachment, attachment);
        return numberOfUpdatedItems;
      });
  });

  function openPDF(filePath: string){
    let pdfWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            plugins: true
        }
    });

    pdfWindow.loadURL(`file:///${filePath}`);

    pdfWindow.setMenu(null);
}

  ipcMain.handle('selectFile', function(event): Promise<OpenDialogReturnValue> {
    return dialog.showOpenDialog(mainWindow, {
          properties: ['openFile'],
          filters: [
            { name: 'PDF', extensions: ['pdf'] },
            { name: 'Images', extensions: ['jpg'] }
          ]
      })
  });

  ipcMain.handle('openFile', function(event, path: string): void {
    openPDF(path);
  });

  // SECTIONS
  ipcMain.handle('getAllSections', function(event): Promise<IProject[]> {
    return knex
      .select('uid', 'name', 'cost', 'description')
      .from("Section")
  });

  ipcMain.handle('getTotalSumOfAllSectionCosts', function(event): Promise<Array<{sectionCost: number}>> {
    return knex("Section")
      .sum('cost as sectionCost')
  });

  ipcMain.handle('insertNewSection', function(event, project: IProject): Promise<IProject[]>{
    project.uid = project.uid ? project.uid : generateUid();
    return knex('Section')
      .insert({
        uid: project.uid,
        name: project.name,
        cost: project.cost,
        description: project.description
      })
      .onConflict('uid')
      .merge({
        uid: generateUid()
      })
      .then((insertedIdsArray: number[]) => {
        return knex('Section').where('id', insertedIdsArray[0])
      })
  });

  ipcMain.handle('updateSection', function(event, project: IProject): Promise<number>{
    return knex('Section')
      .where('uid', project.uid)
      .update({
        name: project.name,
        cost: project.cost,
        description: project.description
      });
  });

  ipcMain.handle('deleteSections', function(event, projects: IProject[]): Promise<number[]> {
    const promises = [];

    for (let project of projects) {
      promises.push(knex('Section')
        .where('uid', project.uid)
        .del());
    }
    return Promise.all(promises);
  });

  // ELEMENT LABELS
  ipcMain.handle('getAllElementLabels', function(event): Promise<IElementLabel[]> {
    return knex('Element_label')
      .select('uid', 'name')
  });

  ipcMain.handle('insertNewElementLabel', function(event, label: IElementLabel): Promise<IElementLabel[]>{
    label.uid = label.uid ? label.uid : generateUid();
    return knex('Element_label')
      .insert({
        uid: label.uid,
        name: label.name,
      })
      .onConflict('uid')
      .merge({
        uid: generateUid()
      })
      .then((insertedIdsArray: number[]) => {
        return knex('Element_label').where('id', insertedIdsArray[0])
      })
  });

  ipcMain.handle('updateElementLabel', function(event, label: IElementLabel): Promise<number>{
    return knex('Element_label')
      .where('uid', label.uid)
      .update({
        name: label.name
      });
  });

  ipcMain.handle('deleteElementLabel', function(event, label: IElementLabel): Promise<number[]> {
    return knex('Element_label')
        .where('uid', label.uid)
        .del();
  });

}

app.on('ready', createWindow);