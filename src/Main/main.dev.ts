/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 *
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
  ).catch(console.error);
};

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

  const { size } = require('electron').screen.getPrimaryDisplay()
  const { height } = size;

  mainWindow = new BrowserWindow({
    height,
    width: height,
    show: false,
    resizable: true,
    transparent: true,
    titleBarStyle: 'hidden', // NOTE this logs an error in dev on macOS, but it's not an error. see: https://github.com/electron/electron/issues/11150
  });

  if (process.env.NODE_ENV === "development") {
    mainWindow!.loadURL(
      `file://${path.resolve(__dirname, "..", "Renderer")}/app.html`
    );
  } else {
    mainWindow.loadURL(`file://${__dirname}/app.html`);
  }

  mainWindow!.once("ready-to-show", () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    mainWindow.show();
    mainWindow.focus();
  });

  // TODO - allow reopening windows...?
  mainWindow!.on("closed", () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow as DebugWindow);
  menuBuilder.buildMenu();

  const ParsingWindows = new Map();

  const parseRawSnapshots = ({ correlationId, rawSnapshotsJSON }) => {
    const bgWindow = new BrowserWindow();
    if (process.env.NODE_ENV === "development") {
      bgWindow!.loadURL(
        `file://${path.resolve(__dirname, "..", "Parser")}/parser.html`
      );
    } else {
      bgWindow.loadURL(`file://${__dirname}/parser.html`);
    }

    ParsingWindows.set(correlationId, bgWindow);

    bgWindow!.webContents.on("did-finish-load", () => {
      console.debug('Sending raw snapshots to background window');
      bgWindow.webContents.send('parse-raw-snapshots', { correlationId, rawSnapshotsJSON });
    });

    bgWindow.on('error', () => {
      console.error('bg window error');
    })    
  };

  const handleParsedSnapshots = ({ correlationId, snapshots }) => {
    mainWindow.webContents.send('parsed-raw-snapshots', { correlationId, snapshots });
    const bgWindow = ParsingWindows.get(correlationId);
    if (bgWindow) {
      bgWindow.close();
    }
  };

  ipcMain.on('parse-raw-snapshots', (event, { correlationId, rawSnapshotsJSON }) => {
    parseRawSnapshots({ correlationId, rawSnapshotsJSON });
  });

  ipcMain.on('parsed-raw-snapshots', (event, { correlationId, snapshots }) => {
    handleParsedSnapshots({ correlationId, snapshots });
  })
});
