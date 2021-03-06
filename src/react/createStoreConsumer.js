//@flow

import * as React from 'react'

import type {Store} from 'effector'

import type {StoreConsumer} from './index.h'

type Unsubscribe = () => void

export function createStoreConsumer<State>(
 store: Store<State>,
): StoreConsumer<State> {
 return class StoreConsumer extends React.Component<
 {
  children: State => React.Node,
 },
 {currentState: State},
> {
  static displayName = `${store.displayName || 'Store'}.Consumer`

  state = {currentState: store.getState()}

  _unsubscribe: Unsubscribe | null = null
  _hasUnmounted: boolean = false

  componentDidMount() {
   this.subscribe()
  }
  componentWillUnmount() {
   this.unsubscribe()
   this._hasUnmounted = true
  }
  render() {
   return this.props.children(this.state.currentState)
  }

  subscribe() {
   const callback = (state: State) => {
    if (this._hasUnmounted) {
     return
    }

    this.setState(prevState => {
     if (state === prevState.currentState) {
      return null
     }
     return {currentState: state}
    })
   }

   const unsubscribe = store.subscribe(callback)

   this._unsubscribe = unsubscribe
  }
  unsubscribe() {
   if (typeof this._unsubscribe === 'function') {
    this._unsubscribe()
   }

   this._unsubscribe = null
  }
 }
}