/**
 * The Midst component.
 */

// ================================================================================
// External
// ================================================================================
import {map, last, get, isEqual, initial} from 'lodash'
import * as classnames from 'classnames'
import * as React from 'react' // LOL typescript
import {Save, Folder, Settings, Eye, Rewind} from 'react-feather'
import {Editor} from 'react-draft-wysiwyg'
import {EditorState, convertToRaw, convertFromRaw} from 'draft-js'
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css'

import { ipcRenderer } from 'electron';

const uuid = require('uuid/v4');


// ================================================================================
// Framework
// ================================================================================
import {IDefaultProps} from './utils'
import {Slider} from './Slider'
import {saveToDisk, loadFromDisk, ISaveToDiskPayload} from './save';

// ================================================================================
// Project
// ================================================================================
const REPLAY_SPEED = 100;

// ================================================================================
// Component
// ================================================================================
import './Midst.css'

// ================================================================================
// Model
// ================================================================================

interface IProps
  extends IDefaultProps, ISaveToDiskPayload {
    classes?: any
}

interface IState {
  actionMode: 'entering' | 'replaying' | 'scrubbing'
  viewMode: 'full' | 'focus'
  snapshots: any[]
  replayIndex: number
  editorState: EditorState
  replayState: EditorState
  heldKeyCode: number
}

// ================================================================================
// Defaults
// ================================================================================
const toolbar = {
  options: ['fontSize', 'fontFamily', 'textAlign'],
  inline: {
    options: ['bold', 'italic', 'underline', 'strikethrough', 'monospace'],
  },
  fontFamily: {
    options: ['Helvetica', 'Courier', 'Georgia', 'Tahoma', 'Times New Roman', 'Verdana'],
  },
  list: {
    dropdownClassName: undefined,
    options: ['unordered', 'ordered'],
  },
}

const noToolbar = {
  options: [],
}

const initialState: IState = {
  actionMode: 'entering',
  viewMode: 'full',
  snapshots: [EditorState.createEmpty().getCurrentContent()],
  replayIndex: 0,
  editorState: EditorState.createEmpty(),
  replayState: EditorState.createEmpty(),
  heldKeyCode: null,
}

// ================================================================================
// Decorate
// ================================================================================
// @saveToDisk()

// ================================================================================
// Init
// ================================================================================
class Midst extends React.Component<IProps, IState> {

  public state: IState = initialState

  private replayTimer: number

// ================================================================================
// Lifecycle
// ================================================================================
  public componentDidMount() {
    document.body.addEventListener('keydown', this.onKeyDown)
    document.body.addEventListener('keyup', this.onKeyUp)

    ipcRenderer.on('parsed-raw-snapshots', (event, { correlationId, snapshots }) => {
      this.handleParsedSnapshots({ correlationId, snapshots });
    })
  }

  public componentDidUpdate(prevProps, prevState) {
    if (this.state.actionMode !== prevState.actionMode) {
      console.log('action mode changed')
    }
  }

  public componentWillUnmount() {
    document.body.removeEventListener('keydown', this.onKeyDown)
    document.body.removeEventListener('keyup', this.onKeyUp)
  }

// ================================================================================
// Render
// ================================================================================
  public render() {
    const {actionMode, viewMode} = this.state

    return (
      <div className='app'>
        <header className={classnames(
          'header',
          viewMode === 'focus' ? 'focus' : null,
        )}>
          <h1>
            Midst – Untitled Project
          </h1>

          {viewMode === 'full' &&
            <div className='controls'>
              <div className='control'
                onClick={this.toggleFocusMode}>
                <Eye />
              </div>

              <div className='control'
                onClick={this.enterReplayMode}>
                <Rewind className={this.state.snapshots.length < 3 ? 'deactivated' : null} />
              </div>

              <div className='control file-input' >
                <Folder />
                <input type='file'
                  accept=".mds" // this doesn't work for some reason (trying to disallow any non-mds files)
                  onChange={this.onFileSelected}
                />
              </div>

              <div className='control'
                onClick={this.save}>
                <Save />
              </div>
            </div>
          }
        </header>
        <div className={classnames(
          'editor',
          viewMode === 'focus' ? 'focus' : null,
        )}>
          {actionMode === 'entering' &&
            <Editor
              editorState={this.state.editorState}
              onEditorStateChange={this.onEditorStateChange}
              toolbar={viewMode === 'full' ? toolbar : noToolbar}
              editorClassName='textarea'
            />
          }
          {(actionMode === 'replaying' || actionMode === 'scrubbing') &&
            <Editor
              editorState={this.state.replayState}
              onEditorStateChange={this.onEditorStateChange}
              toolbar={viewMode === 'full' ? toolbar : noToolbar}
              editorClassName='textarea'
              onFocus={() => {
                this.setState({
                  actionMode: 'entering',
                })
              }}
            />
          }
        </div>
        {(actionMode === 'replaying' || actionMode === 'scrubbing') &&
          <div className='scrubber'
            onClick={() => {
              this.replayTimer && window.clearTimeout(this.replayTimer)
              this.setState({actionMode: 'scrubbing'})
            }}
          >
            <Slider id='scrubber-bar'
              default={1}
              direction='horizontal'
              value={this.state.replayIndex / (this.state.snapshots.length - 1)}
              onChange={(value) => {
                const replayIndex = Math.ceil((this.state.snapshots.length - 1) * value)
                this.setState({
                  replayIndex,
                  replayState: this.createEditorState(this.state.snapshots[replayIndex]),
                })
              }}
            />
          </div>
        }
      </div>
    )
  }

// ================================================================================
// Handlers
// ================================================================================
  private handleParsedSnapshots = (history) => {
    // TODO - check correlation id against last request
    // TODO - logic on how to handle raw snapshot data
    console.debug('parsed raw snapshots:', history)
    const snapshots = [
      // INVESTIGATE - is this map operation expensive? can we batch process async?
      ...map(history, convertFromRaw),
      ...state.snapshots
    ];
    this.setState(state => ({
      snapshots,
      replayIndex: snapshots.length + state.replayIndex
    }), () => {
      console.debug('okay i updated the editor with previous snapshots', this.state);
    });
  }

  private onKeyUp = (evt) => {
    this.setState({heldKeyCode: null})
  }

  private onKeyDown = (evt) => {
    this.evalKeyCode(evt)
    this.setState({heldKeyCode: evt.keyCode})
  }

  // NOTE - this handles exiting focus mode when escape is pressed
  private evalKeyCode = (evt) => {
    const {heldKeyCode, viewMode} = this.state
    const {keyCode} = evt

    const allowedToRepeat = []

    // NOTE - this always returns early when keyCode is the same as the `heldKeyCode`
    // since `allowedToRepeat` is always empty
    //
    if (keyCode === heldKeyCode && allowedToRepeat.indexOf(keyCode) === -1) {
      return
    }

    if (keyCode === 27 && viewMode === 'focus') {
      evt.preventDefault()
      this.setState({viewMode: 'full'})
    }
  }

  public onEditorStateChange = (editorState: EditorState) => {
    const { snapshots } = this.state
    const latestSnapshot = editorState.getCurrentContent();
    // Only add a snapshot to the history if we actually changed smthg
    if (last(snapshots) !== latestSnapshot) {
      snapshots.push(latestSnapshot);
    }
    this.setState({ editorState, snapshots })
  }

  public enterReplayMode = async (evt) => {
    evt.preventDefault()

    if (!this.state.snapshots.length) {
      return
    }

    this.setState({
      actionMode: 'replaying',
      replayIndex: this.state.snapshots.length - 1,
      replayState: this.createEditorState(last(this.state.snapshots)),
    })
  }

  public startReplay = async (evt) => {
    this.nextFrame()
  }

  private save = (evt) => {
    evt.preventDefault()
    const rawSnapshots = []
    console.debug('all snapshots', this.state.snapshots);
    for (const snapshot of this.state.snapshots) {
      console.debug('hey converting snapshot to raw')
      const rawSnapshot = convertToRaw(snapshot);
      rawSnapshots.push(rawSnapshot)
    }
    saveToDisk({
      snapshots: initial(rawSnapshots),
      head: last(rawSnapshots)
    }).then((filename) => {
      console.debug('Saved file', filename);
    }, error => {
      console.error('Error saving file', error);
    })
  }

  private toggleFocusMode = () => {
    this.setState({viewMode: this.state.viewMode === 'full' ? 'focus' : 'full'})
  }

  private onFileSelected = (evt) => {
    evt.persist()
    const file = evt.target.files[0]
    if (!file) {
      console.debug('no file selected');
      return;
    }
    const { name, path } = file;
    // TODO - is there a way to blur anything that's not an MDS file?
    if (!name.endsWith('.mds')) {
      window.alert('I can only load mds files, silly!');
      return;
    }
    loadFromDisk(path).then(({ head, rawSnapshotsJSON }) => {
      const snapshots = map([head], convertFromRaw)

      console.debug('sending raw snapshots to main thread');
      ipcRenderer.send('parse-raw-snapshots', {
        rawSnapshotsJSON,
        correlationId: uuid()
      });

      const editorState = this.createEditorState(last(snapshots));
      this.setState({
        snapshots,
        editorState,
        actionMode: 'entering',
        replayIndex: snapshots.length - 1,
      });
    }, (error) => {
      console.error('error loading!', error);
    });
  }

// ================================================================================
// Helpers
// ================================================================================
  private nextFrame() {
    const {snapshots} = this.state
    let {replayIndex} = this.state
    this.replayTimer = window.setTimeout(() => {
      window.clearTimeout(this.replayTimer)

      if (replayIndex < snapshots.length) {
        const snapshot = snapshots[replayIndex]
        this.setState({
          replayIndex,
          replayState: this.createEditorState(this.state.snapshots[replayIndex]),
        })

        replayIndex = replayIndex + 1
        this.setState({replayIndex})
        this.nextFrame()
      }

      else {
        this.setState({
          actionMode: 'scrubbing',
          editorState: this.state.replayState,
        } as IState)
      }
    }, REPLAY_SPEED)
  }

  private createEditorState(snapshot) {
    // INVESTIGATE - can we use `createFromBlockArray`
    // return EditorState.createWithContent(ContentState.createFromBlockArray(snapshot))
    return EditorState.createWithContent(snapshot)
  }
}

// ================================================================================
// Export
// ================================================================================
export default Midst