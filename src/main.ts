import { IElementLabel } from '@reactapp/models/element-labels.interface';
import { IFilter } from '@reactapp/models/filters.interface';
import { IInvoice } from '@reactapp/models/invoices.interface';
import { IProject } from '@reactapp/models/projects.interface';
import { generateUid } from '@reactapp/utils/utils';
import { app, BrowserWindow, dialog, ipcMain, OpenDialogReturnValue } from 'electron';
import isDev from 'electron-is-dev'; // New Import
import settings from 'electron-settings';
import * as fs from 'fs';
import Knex from 'knex';
import knexStringcase from 'knex-stringcase';
import path from 'path';

const currentAppVersion = 'v1.1.0';

function checkConfigAndItemExists(config: string): boolean {
  const configPath = settings.getSync(config);
  if (!configPath || !fs.existsSync(configPath ? configPath.toString() : '')) {
    return false;
  }
  return true;
}

function initializeOrUpdateDatabase(dbPath: string, currentAppVersion: string) {
  const knex = Knex(knexStringcase({
		client: "sqlite3",
		connection: {
			filename: dbPath
		},
    useNullAsDefault: true
	}));
  knex.raw(`CREATE TABLE IF NOT EXISTS "Project" (
    "id"	INTEGER NOT NULL UNIQUE,
    "uid"	TEXT NOT NULL UNIQUE,
    "name"	TEXT NOT NULL,
    "cost"	NUMERIC,
    "description"	TEXT,
    PRIMARY KEY("id" AUTOINCREMENT)
  )`)
  .then(() =>
    knex.raw(`CREATE TABLE IF NOT EXISTS "Section" (
      "id"	INTEGER NOT NULL UNIQUE,
      "uid"	TEXT NOT NULL UNIQUE,
      "name"	TEXT NOT NULL,
      "cost"	NUMERIC,
      "description"	TEXT,
      PRIMARY KEY("id" AUTOINCREMENT)
    )`))
  .then(() =>
  knex.raw(`CREATE TABLE IF NOT EXISTS "Element_label" (
    "id"	INTEGER NOT NULL,
    "uid"	TEXT NOT NULL UNIQUE,
    "name"	TEXT NOT NULL,
    PRIMARY KEY("id" AUTOINCREMENT)
  )`))
  .then(() =>
    knex.raw(`CREATE TABLE IF NOT EXISTS "Invoice" (
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
    knex.raw(`CREATE TABLE IF NOT EXISTS "Section_invoice" (
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
      FOREIGN KEY("project_uid") REFERENCES "Section"("uid") ON DELETE CASCADE,
      FOREIGN KEY("element_label_uid") REFERENCES "Element_label"("uid"),
      PRIMARY KEY("id" AUTOINCREMENT)
    )`)
  )
  .then(() => 
    knex.raw(`CREATE TRIGGER IF NOT EXISTS Element_label_delete after delete ON Element_label
      BEGIN
        UPDATE Invoice
      SET element_label_uid = (SELECT uid FROM Element_label ORDER BY id ASC LIMIT 1)
      WHERE element_label_uid = OLD.uid ;
      END`))
  .then(() => 
    knex.raw(`INSERT INTO "Element_label" ("uid", "name") 
      SELECT "${generateUid()}", ""
      WHERE NOT EXISTS(SELECT 1 FROM "Element_label" WHERE "name" = "");`))
    // knex.raw(`INSERT INTO "Element_label" ("uid", "name") VALUES ("${generateUid()}", "")`))
  .then(() =>
    knex.raw(`CREATE TABLE IF NOT EXISTS "app_version" (
      "id"	INTEGER NOT NULL UNIQUE,
      "label" TEXT,
      PRIMARY KEY("id" AUTOINCREMENT)
    )`))
  .then(() => 
    knex.raw(`INSERT INTO "app_version" ("label") 
      SELECT "${currentAppVersion}"
      WHERE NOT EXISTS(SELECT 1 FROM "app_version" WHERE "label" = "${currentAppVersion}");`))
  .then(() => {
    settings.setSync('config.appVersion', currentAppVersion);
    app.relaunch();
    app.quit();
  })
}

function setAppIpcMainHandlers(mainWindow: BrowserWindow, knex: Knex<any, unknown[]>) {
  // PROJECTS
  ipcMain.handle('getAllProjects', function(event, tableName: string): Promise<IProject[]> {
    return knex
      .select('uid', 'name', 'cost', 'description')
      .from(tableName)
  });

  ipcMain.handle('getTotalSumOfAllProjectCosts', function(event, tableName: string): Promise<Array<{projectCost: number}>> {
    return knex(tableName)
      .sum('cost as totalCost')
  });

  ipcMain.handle('insertNewProject', function(event, project: IProject, tableName: string): Promise<IProject[]>{
    project.uid = project.uid ? project.uid : generateUid();
    return knex(tableName)
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
        return knex(tableName).where('id', insertedIdsArray[0])
      })
  });

  ipcMain.handle('updateProject', function(event, project: IProject, tableName: string): Promise<number>{
    return knex(tableName)
      .where('uid', project.uid)
      .update({
        name: project.name,
        cost: project.cost,
        description: project.description
      });
  });

  ipcMain.handle('deleteProjects', function(event, projects: IProject[], tableName: string): Promise<number[]> {
    const promises = [];

    for (let project of projects) {
      promises.push(knex(tableName)
        .where('uid', project.uid)
        .del());
    }
    return Promise.all(promises);
  });

  // INVOICES
  ipcMain.handle('getInvoices', function(event, projects: IProject[], tableName: string): Promise<IInvoice[]> {
    return knex(tableName)
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

  ipcMain.handle('getFilteredInvoices', function(event, projects: IProject[], filters: IFilter, tableName: string): Promise<IInvoice[]> {
    let result = knex(tableName)
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

  ipcMain.handle('insertNewInvoice', function(event, invoice: IInvoice, tableName: string): Promise<IInvoice>{
    invoice.uid = invoice.uid ? invoice.uid : generateUid();
    const attachment = path.basename(invoice.attachment);

    return knex(tableName)
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
        invoice.attachment && copyFile(invoice.attachment, attachment);
        return knex(tableName).first().where('id', insertedIdsArray[0])
      })
  });

  ipcMain.handle('deleteInvoices', function(event, invoices: IInvoice[], tableName: string): Promise<number[]> {
    const promises = [];

    for (let invoice of invoices) {
      fs.unlink(invoice.attachment, function(err) {console.error(err)})
      promises.push(knex(tableName)
        .where('uid', invoice.uid)
        .del());
    }
    return Promise.all(promises);
  });

  ipcMain.handle('updateInvoice', function(event, invoice: IInvoice, tableName: string): Promise<number>{
    const attachment = path.basename(invoice.attachment);
    return knex(tableName)
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
        invoice.attachment && copyFile(invoice.attachment, attachment);
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
 

// CREATE WINDOW
function createWindow(): void {  

  let mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true
    },
    show: false
  });
  
  // CONFIG
  ipcMain.handle('checkAllConfig', function(event): boolean {
    return checkConfigAndItemExists('config.db')
      && checkConfigAndItemExists('config.fileFolder')
      && settings.getSync('config.appVersion')?.toString() === currentAppVersion;
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
    if (dbPath) {
      const dbLocation = dbPath.toString();
      settings.setSync('config.db', dbLocation);
      fs.writeFileSync(dbLocation.toString(), '');
      initializeOrUpdateDatabase(dbLocation, currentAppVersion);
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
  
  let windowUrl = '';
  if (isDev) {
    windowUrl = 'http://localhost:9000';
  } else {
    windowUrl = `file://${path.join(__dirname, 'index.html')}`;
    mainWindow.setMenu(null);
  }
  mainWindow.loadURL(windowUrl);
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

  console.log('11111111111111')
  knex.schema.hasTable('app_version')
  .then((exists: boolean) => {
    console.log('22222222222222222222222222222222222')
    console.log(exists)
    if (exists) {
      knex('app_version')
      .select('label')
      .where('label', currentAppVersion)
      .then((appVersions: {label: string}[]) => {
        if (appVersions.length <= 0) {
          console.log('DEEEEEEEEEEEEE')
          knex.destroy()
          .then(() => initializeOrUpdateDatabase(dbConfig.toString(), currentAppVersion));
        }
      });
    } else {
      knex.destroy()
      .then(() => initializeOrUpdateDatabase(dbConfig.toString(), currentAppVersion));
    }
    
  })
  .catch((err: Error) => {console.log(err)})

  setAppIpcMainHandlers(mainWindow, knex);
  
}

app.on('ready', createWindow);