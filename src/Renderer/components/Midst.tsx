/**
 * The Midst component.
 */

// ================================================================================
// External
// ================================================================================
import {map, last, get, isEqual} from 'lodash'
import * as classnames from 'classnames'
import * as React from 'react'
import {Save, Folder, Settings, Eye, Rewind} from 'react-feather'
import {Editor} from 'react-draft-wysiwyg'
import {EditorState, convertToRaw, convertFromRaw} from 'draft-js'
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css'

// ================================================================================
// Framework
// ================================================================================
// import {IDefaultProps} from 'projekt/lib/interfaces'
import {IDefaultProps} from './blah'
import {Slider} from './Slider'
// import {saveToDisk, ISaveToDiskPayload} from 'projekt/lib/components'
import {saveToDisk, ISaveToDiskPayload} from './save';

// ================================================================================
// Project
// ================================================================================
// import {REPLAY_SPEED} from '../config'
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
  snapshots: [],
  replayIndex: 0,
  editorState: EditorState.createEmpty(),
  replayState: EditorState.createEmpty(),
  heldKeyCode: null,
}

// ================================================================================
// Decorate
// ================================================================================
@saveToDisk()

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
    // TODO - check if this includes undo stack
    console.group('%cState change snapshot', 'font-weight: bold; color: #0A2F51;');
    console.log('latestSnapshot', latestSnapshot);
    snapshots.push(latestSnapshot);
    const lastChangeType = editorState.getLastChangeType();
    // NOTE - this could be null, and we could ignore
    console.log('state change, lastChangeType:', lastChangeType);

    if (snapshots.length) {
      console.group('%cCompare last state', 'font-weight: light; color: #0A2F51;');
      console.log('last editor snapshot', this.state.editorState.getCurrentContent().toJSON().blockMap);
      console.log('this editor state', latestSnapshot.toJSON().blockMap);
      console.groupEnd();
    }

    // const undoStack = editorState.getUndoStack();
    // console.log('state change, undoStack:', undoStack);
    // const latestUndoableOp = undoStack.get(0); // could also do undoStack._head.value;
    // console.log('state change, undoStack head:', latestUndoableOp);
    // if (latestUndoableOp) {
    //   // TODO - check if this is serializable to record individual characters,
    //   // or if using this would undo non existent content blocks
    //   console.log('state change, undoStack head value:', latestUndoableOp);      
    //   console.log('state change, undoStack head value, json', latestUndoableOp.toJSON());      

    // }
    console.groupEnd();
    this.setState({editorState, snapshots})
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
    let rawSnapshots = []
    for (const snapshot of this.state.snapshots) {
      const rawSnapshot = convertToRaw(snapshot);
      console.log('raw snapshot:', rawSnapshot);
      rawSnapshots.push(rawSnapshot)
    }
    this.props.saveToDisk.saveDataAsPlainText(
      rawSnapshots,
      'Untitled',
      {extension: 'mds'},
    )
  }

  private toggleFocusMode = () => {
    this.setState({viewMode: this.state.viewMode === 'full' ? 'focus' : 'full'})
  }

  private onFileSelected = (evt) => {
    evt.persist()
    const file = evt.target.files[0]
    this.props.saveToDisk.loadDataFromPlainText(
      file, {
        requireExtension: 'mds',
        success: (rawSnapshots) => {
          const snapshots = map(rawSnapshots, convertFromRaw)
          this.setState({
            snapshots,
            actionMode: 'entering',
            replayIndex: snapshots.length,
            editorState: this.createEditorState(last(snapshots)),
          })
        },
        error: () => console.error('File error!'),
      },
    )
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
    // return EditorState.createWithContent(ContentState.createFromBlockArray(snapshot))
    return EditorState.createWithContent(snapshot)
  }
}

// ================================================================================
// Export
// ================================================================================
export default Midst