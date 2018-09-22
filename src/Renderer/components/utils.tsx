import {get, isEqual} from 'lodash'

const diff = (map, coll, nextColl) => {

  for (const path of map) {
    if (!isEqual(get(coll, path), get(nextColl, path))) {
      return true
    }
  }

  return false
}

export const diffComponent = (map, instance, nextProps, nextState) => {

  if (map[0] === '*') {
    return true
  }

  if (map[0] === '-') {
    return false
  }

  if (diff(map, instance.props, nextProps) === true) {
    return true
  }

  if (diff(map, instance.state, nextState) === true) {
    return true
  }

  return false
}

export interface IDefaultProps {
  children?: any
  classes?: any
  className?: string
  hidden?: boolean
  id?: string | number
  key?: any
  location?: any
  onClick?: Function
  params?: any
  route?: any
  router?: any
  style?: any
  match?: any
}

const isMouseIn = (evt, el, invert = false) => {
  const rect = el.getBoundingClientRect()
  const mouseIn =
    evt.clientX > rect.left &&
    evt.clientX < rect.left + rect.width &&
    evt.clientY > rect.top &&
    evt.clientY < rect.top + rect.height

  let percent
  if (invert) {
    percent = {
      x: (rect.left - evt.clientX) / rect.width,
      y: (rect.top - evt.clientY) / rect.height * -1,
    }
  }

  else {
    percent = {
      x: (evt.clientX - rect.left) / rect.width,
      y: (evt.clientY - (rect.top + rect.height)) / rect.height * -1,
    }
  }

  return {
    mouseIn,
    percent,
  }
}

const mouseTheta = (evt, el) => {
  const rect = el.getBoundingClientRect()
  const deltaX = evt.pageX - rect.left - rect.width / 2
  const deltaY = evt.pageY - rect.top - rect.height / 2
  const thetaR = Math.atan2(deltaY, deltaX)
  const thetaD = ((thetaR > 0 ? thetaR : (2 * Math.PI + thetaR)) * 360 / (2 * Math.PI))
  const thetaN = thetaD < 270 ? thetaD + 90 : thetaD - 270
  const thetaNF = thetaN === 0 ? 180 : thetaN === 180 ? 0 : thetaN
  return thetaNF
}

export const coords = (evt, el, inverted = false) => {
  const m = isMouseIn(evt, el, inverted).percent
  return {
    x: m.x >= 0 && m.x <= 1 ? m.x : m.x < 0 ? 0 : m.x > 1 ? 1 : this.value.x,
    y: m.y >= 0 && m.y <= 1 ? m.y : m.y < 0 ? 0 : m.y > 1 ? 1 : this.value.y,
    theta: mouseTheta(evt, el),
  }
}