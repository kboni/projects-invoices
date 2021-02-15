import { app, BrowserWindow, ipcMain } from 'electron';
import isDev from 'electron-is-dev'; // New Import
import Knex, { QueryBuilder } from 'knex';
import path from 'path';
import { IInvoice } from './models/invoices.interface';
import { IProject } from './models/projects.interface';
import { generateUid } from './utils/utils';
import knexStringcase from 'knex-stringcase';
// import { dialog } from 'electron';

function createWindow(): void {  

  let mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    },
    show: false
  });

  // const b = dialog.showOpenDialogSync(mainWindow, { properties: ['openFile'] });

  // console.log(b)
  // TODO: 
	const knex = Knex(knexStringcase({
		client: "sqlite3",
		connection: {
			// filename: b ? b[0] : path.join(__dirname, 'database.sqlite')
			filename: path.join(__dirname, '../db/database.sqlite')
		},
    // postProcessResponse: (result, queryContext) => {
    //   // TODO: add special case for raw results (depends on dialect)
    //   if (Array.isArray(result)) {
    //     return result.map(row => convertToCamel(row));
    //   } else {
    //     return convertToCamel(result);
    //   }
    // }
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
        'created_at', 'updated_at', 'element_label_uid')
      .whereIn('project_uid', projects.map((project: IProject) => project.uid))
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
        //TODO: attachment and label
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

  ipcMain.handle('getAllElementLabels', function(event): Promise<IProject[]> {
    return knex('Element_label')
      .select('uid', 'name')
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
  
}

app.on('ready', createWindow);