/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 *
 * @flow
 */
import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import { default as MenuBuilder, DebugWindow } from "@utils/menu";

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === "production") {
  const sourceMapSupport = require("source-map-support");
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === "development" ||
  process.env.DEBUG_PROD === "true"
) {
  require("electron-debug")();
  const path = require("path");
  const p = path.join(__dirname, "..", "node_modules");
  require("module").globalPaths.push(p);
}

const installExtensions = async () => {
  const installer = require("electron-devtools-installer");
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ["REACT_DEVELOPER_TOOLS", "REDUX_DEVTOOLS"];

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload))
  ).catch(console.log);
};

/**
 * Add event listeners...
 */

app.on("window-all-closed", () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("ready", async () => {
  if (
    process.env.NODE_ENV === "development" ||
    process.env.DEBUG_PROD === "true"
  ) {
    await installExtensions();
  }

  let {height} = require('electron').screen.getPrimaryDisplay().size;

  mainWindow = new BrowserWindow({
    show: false,
    // width: 1024,
    // height: 728,
    width: height,
    height,
    resizable: true,
    transparent: true,
    titleBarStyle: 'hidden',
  });

  if (process.env.NODE_ENV === "development") {
    mainWindow!.loadURL(
      `file://${path.resolve(__dirname, "..", "Renderer")}/app.html`
    );
  } else {
    mainWindow.loadURL(`file://${__dirname}/app.html`);
  }

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow!.webContents.on("did-finish-load", () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow!.on("closed", () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow as DebugWindow);
  menuBuilder.buildMenu();

  const ParsingWindows = new Map();

  ipcMain.on('parse-raw-snapshots', (event, { correlationId, rawSnapshotsJSON }) => {
    const bgWindow = new BrowserWindow();
    if (process.env.NODE_ENV === "development") {
      bgWindow!.loadURL(
        `file://${path.resolve(__dirname, "..", "Parser")}/parser.html`
      );
    } else {
      bgWindow.loadURL(`file://${__dirname}/parser.html`);
    }

    ParsingWindows.set(correlationId, bgWindow);

    console.log('Hey i started some stuff');
    bgWindow!.webContents.on("did-finish-load", () => {
      console.log('YOYOYOYOYOYOYOYOO');
      bgWindow.webContents.send('parse-raw-snapshots', { correlationId, rawSnapshotsJSON });
    });

    bgWindow.on('error', () => {
      console.log('bg window error');
    })
  });

  ipcMain.on('parsed-raw-snapshots', (event, { correlationId, snapshots }) => {
    console.log('hooooly shit did this work?')
    mainWindow.webContents.send('parsed-raw-snapshots', { correlationId, snapshots });
    const bgWindow = ParsingWindows.get(correlationId);
    if (bgWindow) {
      bgWindow.close();
    }
  })
});
