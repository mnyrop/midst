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

export const saveToDisk = () => {
  // window.alert("lol i'm not gonna save");
  console.log('lol not gonn a save')
}