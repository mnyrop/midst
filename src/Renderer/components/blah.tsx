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