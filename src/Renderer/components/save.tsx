const fs = require('fs');
const JSZip = require('jszip');
const { dialog } = require('electron').remote
const { partial } = require('lodash');

interface ISaveOpts {
  extension: string
  success?: Function
  error?: Function
}

interface ILoadOpts {
  requireExtension: string
  success?: Function
  error?: Function
}

interface INamespace {
  saveDataAsPlainText: (data: any, name: string, opts: ISaveOpts) => void
  loadDataFromPlainText: (file: any, opts: ILoadOpts) => void
  loadedRes: any
}

export interface ISaveToDiskPayload extends IProps {
  saveToDisk?: INamespace
}

const FILE_FORMAT_VERSION = '0.1.0';

// NOTE - `head !== last(snapshots)`... should it ?
export const saveToDisk = ({ head, snapshots }) => new Promise((resolve, reject) => {
  const options = {
    // message: 'This is a message blah blahblah',
    // nameFieldLabel: 'Title'
  };
  dialog.showSaveDialog(options, (path) => {
    try {
      const filename = path.endsWith('.mds') ? path : `${path}.mds`;
      const zip = new JSZip();
      resolve(filename);
      zip.file('VERSION', FILE_FORMAT_VERSION);
      // TODO - move off of main renderer thread
      zip.file('snapshots.json', JSON.stringify(snapshots));
      zip.file('head.json', JSON.stringify(head));
      zip.generateNodeStream({ streamFiles: true })
        .pipe(fs.createWriteStream(filename, { encoding: 'utf-8' }))
        .on('finish', () => {
          // JSZip generates a readable stream with a "end" event,
          // but is piped here in a writable stream which emits a "finish" event.
          resolve(filename);
        })
        .on('error', error => {
          reject(error);
        });
    }
    catch (error) {
      reject(error)
    }
  })
});

export const loadFromDisk = (path) => new Promise((resolve, reject) => {
  try {
    fs.readFile(path, (err, content) => {
      if (err) {
        reject(err);
        return;
      }
      const zip = new JSZip();
      zip.loadAsync(content)
        .then((midstFile) => {
          // Grab the latest snapshot, stored in teh `head.json` file, and parse it
          const getHead = midstFile.file('head.json').async('string').then(partial(JSON.parse));
          // Grab the collection of snapshots, stored in the `snapshots.json` file
          // NOTE - not deserializing the snapshots bc it's too expensive
          const getSnapshots = midstFile.file('snapshots.json').async('string');
          const contentPromises = [getHead, getSnapshots];
          // TODO - find a away to parse JSON off the main thread
          // (1) use a worker
          // (2) devise a newline limited format for snapshots and stream them back to the main thread
          return Promise.all(contentPromises).then(([head, rawSnapshotsJSON]) => resolve({ head, rawSnapshotsJSON }))
        }).catch(reject);
    })
  }
  catch (error) {
    reject(error)
  }
})

