import { app, BrowserWindow, dialog, ipcMain, OpenDialogReturnValue } from 'electron';
import isDev from 'electron-is-dev'; // New Import
import { Menu } from 'electron';
import Knex from 'knex';
import knexStringcase from 'knex-stringcase';
import path from 'path';
import { IElementLabel } from './models/element-labels.interface';
import { IFilter } from './models/filters.interface';
import { IInvoice } from './models/invoices.interface';
import { IProject } from './models/projects.interface';
import { generateUid } from './utils/utils';

function createWindow(): void {  

  let mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    },
    show: false,
    autoHideMenuBar: true,
    // frame: false
  });
  Menu.setApplicationMenu(null);
  // const b = dialog.showOpenDialogSync(mainWindow, { properties: ['openFile'] });

  // console.log(b)
  // TODO: 
	const knex = Knex(knexStringcase({
		client: "sqlite3",
		connection: {
			// filename: b ? b[0] : path.join(__dirname, 'database.sqlite')
			filename: path.join(__dirname, '../db/database.sqlite')
		},
	}));

  console.log(isDev);
  mainWindow.loadURL(
    isDev // TODO: Replace isDev with ENV vars
      ? 'http://localhost:9000'
      : `file://${path.join(__dirname, 'index.html')}` // OR app.getAppPath()
  );
  mainWindow.once("ready-to-show", () => { mainWindow.show() })

  mainWindow.on('closed', () => app.quit());

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
  });
  
  ipcMain.handle('getFilteredInvoices', function(event, projects: IProject[], filters: IFilter): Promise<IInvoice[]> {
    let result = knex("Invoice")
      .select('uid', 'project_uid', 'name', 'amount', 'description',
        'created_at', 'updated_at', 'attachment', 'element_label_uid')
      .whereIn('project_uid', projects.map((project: IProject) => project.uid))
      if (filters.name) {
        // result = result.andWhere('name', 'like', `%${filters.name}%`)
        result = result.andWhere(
          knex.raw(`LOWER(name) like '%${filters.name}%'`)
        )
      }
      if (filters.description) {
        // result = result.andWhere('description', 'like', `%${filters.description}%`)
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
      
    return result;
    });

  ipcMain.handle('insertNewInvoice', function(event, invoice: IInvoice): Promise<IInvoice>{
    invoice.uid = invoice.uid ? invoice.uid : generateUid();
    return knex('Invoice')
      .insert({
        uid: invoice.uid,
        project_uid: invoice.projectUid,
        name: invoice.name,
        amount: invoice.amount,
        description: invoice.description,
        element_label_uid: invoice.elementLabelUid,
        attachment: invoice.attachment,
        created_at: Date.now(),
        updated_at: Date.now()
      })
      .onConflict('uid')
      .merge({
        uid: generateUid()
      })
      .then((insertedIdsArray: number[]) => {
        return knex('Invoice').first().where('id', insertedIdsArray[0])
      })
  });

  ipcMain.handle('deleteInvoices', function(event, invoices: IInvoice[]): Promise<number[]> {
    const promises = [];

    for (let invoice of invoices) {
      promises.push(knex('Invoice')
        .where('uid', invoice.uid)
        .del());
    }
    return Promise.all(promises);
  });

  ipcMain.handle('updateInvoice', function(event, invoice: IInvoice): Promise<number>{
    return knex('Invoice')
      .where('uid', invoice.uid)
      .update({
        uid: invoice.uid,
        project_uid: invoice.projectUid,
        name: invoice.name,
        amount: invoice.amount,
        description: invoice.description,
        element_label_uid: invoice.elementLabelUid,
        attachment: invoice.attachment,
        updated_at: Date.now()
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