/**
 * The Slider Component
 */

// ================================================================================
// Imports: External
// ================================================================================
import * as React from 'react'
import * as classnames from 'classnames'

// ================================================================================
// Imports: Framework
// ================================================================================
import {IDefaultProps, diffComponent, coords} from './utils'

// ================================================================================
// Imports: Project
// ================================================================================
// import {coords} from 'projekt/lib/helpers/browser'

// ================================================================================
// Imports: Component
// ================================================================================
import './Slider.css'

// ================================================================================
// Model
// ================================================================================
interface IProps extends IDefaultProps {
  id: string
  value?: number
  default?: number
  direction?: 'vertical' | 'horizontal'
  onChange?: (value: number) => void
}

interface IState {
  pressed: boolean
  value: any
}

const defaultProps: Partial<IProps> = {
  value: 0,
  default: 0,
  direction: 'vertical',
}

const initialState: IState = {
  pressed: false,
  value: null,
}

// ================================================================================
// Init
// ================================================================================
class Slider extends React.Component<IProps, IState> {

  public static defaultProps: Partial<IProps> = defaultProps

  public state: IState = initialState

  private el: HTMLDivElement

  private controlled: boolean

// ================================================================================
// Lifecycle
// ================================================================================
  public componentDidMount() {
    const {id, value, onChange} = this.props
    this.setState({value: this.props.default})
    window[`slider-${id}-dragging`] = false
    window.addEventListener('mouseup', this.onMouseUp)
    window.addEventListener('mousemove', this.onMouseMove)
    this.controlled = typeof value === 'number' && typeof onChange === 'function'
  }

  public shouldComponentUpdate(nextProps: IProps, nextState: IState) {
    return diffComponent(['value'], this, nextProps, nextState)
  }

  public componentDidUpdate(prevProps: IProps, prevState: IState) {
    const {value} = this.props
    const {value: prevValue} = prevProps

    if (value !== prevValue) {
      this.setState({value})
    }
  }

  public componentWillUnmount() {
    const {id} = this.props
    delete window[`slider-${id}-dragging`]
    window.removeEventListener('mouseup', this.onMouseUp)
    window.removeEventListener('mousemove', this.onMouseMove)
  }

// ================================================================================
// Render
// ================================================================================
  public render() {
    const {className, direction} = this.props

    return (
      <div className={classnames('hem-slider', direction, className)}
        onMouseDown={this.onMouseDown}
        ref={(el: HTMLDivElement) => this.el = el}
      >
        <div className='hem-slider__amount' style={this.amountStyle()}>
          <div className='hem-slider__handle' />
        </div>
      </div>
    )
  }

// ================================================================================
// Custom Methods
// ================================================================================
  private onMouseDown = (evt) => {
    const {id, default: defaultValue} = this.props

    if (evt.metaKey) {
      this.update(defaultValue)
    }

    else {
      window[`slider-${id}-dragging`] = true
      document.body.classList.add('hem-slider-unselectable')
      this.update(this.getValue(evt))
    }
  }

  private onMouseMove = (evt) => {
    const {id} = this.props
    if (window[`slider-${id}-dragging`] === true) {
      this.update(this.getValue(evt))
    }
  }

  private onMouseUp = () => {
    const {id} = this.props
    window[`slider-${id}-dragging`] = false
    document.body.classList.remove('hem-slider-unselectable')
  }

  private getValue = (evt) => {
    const {direction} = this.props
    const mouseCoordinates = coords(evt, this.el)
    return direction === 'horizontal' ? mouseCoordinates.x : mouseCoordinates.y
  }

  private update = (value: number) => {
    const {onChange} = this.props
    this.controlled ? onChange(value) : this.setState({value})
  }

  private amountStyle = () => {
    const {value: propsValue, direction} = this.props
    const {value: stateValue} = this.state
    const percent = (this.controlled ? propsValue : stateValue) * 100
    return direction === 'horizontal' ? {width: percent + '%'} : {height: percent + '%'}
  }
}

// ================================================================================
// Exports
// ================================================================================
export {Slider}
