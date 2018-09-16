import { ipcRenderer } from 'electron';

ipcRenderer.on('parse-raw-snapshots', (event, { correlationId, rawSnapshotsJSON }) => {
  document.write('hi')
  console.log('yo i got some snapshots to parrseeee');
  const snapshots = JSON.parse(rawSnapshotsJSON);
  event.sender.send('parsed-raw-snapshots', { correlationId, snapshots });
})