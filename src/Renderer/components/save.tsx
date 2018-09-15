const fs = require('fs');
const JSZip = require('jszip');

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

export const saveToDisk = ({ name = 'Untitled', head, snapshots }) => new Promise((resolve, reject) => {
  try {
    const filename = name + '.mds';
    const zip = new JSZip();
    zip.file('VERSION', FILE_FORMAT_VERSION);
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
});

export const loadFromDisk = (path) => new Promise((resolve, reject) => {
  try {
    const zip = new JSZip();
    fs.readFile(path, (err, content) => {
      if (err) {
        reject(err);
        return;
      }
      zip.loadAsync(content)
        .then((midstFile) => {
            // you now have every files contained in the loaded zip
            return midstFile.file('head.json').async('string').then(latestJSON => {
              const latest = JSON.parse(latestJSON);
              const getSnapshots = () => midstFile.file('snapshots.json').async('string');
              resolve({ latest, getSnapshots });
            });
        }).catch(reject);
    })
  }
  catch (error) {
    reject(error)
  }
})

