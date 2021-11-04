import { auth } from 'botpress/shared'
import { EventEmitter2 } from 'eventemitter2'
import io from 'socket.io-client'

class EventBus extends EventEmitter2 {
  private studioSocket: SocketIOClient.Socket
  static default

  constructor() {
    super({
      wildcard: true,
      maxListeners: 100
    })

    this.onAny(this.dispatchClientEvent)
  }

  dispatchSocketEvent = event => {
    this.emit(event.name, event.data, 'server')
  }

  dispatchClientEvent = (name, data, from) => {
    if (from === 'server') {
      // we sent this event ourselves
      return
    }

    this.studioSocket.emit('event', { name, data })
  }

  updateVisitorId = (newId: string, userIdScope?: string) => {
    auth.setVisitorId(newId, userIdScope)
  }

  private updateVisitorSocketId() {
    window.__BP_VISITOR_SOCKET_ID = this.studioSocket.id
  }

  setup = (userIdScope?: string) => {
    const query = {
      visitorId: auth.getUniqueVisitorId(userIdScope)
    }

    const token = auth.getToken()
    if (token) {
      Object.assign(query, { token })
    }

    const closeSocket = (socket: SocketIOClient.Socket) => {
      if (!socket) {
        return
      }

      socket.off('event', this.dispatchSocketEvent)
      socket.off('connect', this.updateVisitorSocketId)
      socket.disconnect()
    }

    closeSocket(this.studioSocket)

    const socketUrl = window['BP_SOCKET_URL'] || window.location.origin
    const transports = window.SOCKET_TRANSPORTS

    this.studioSocket = io(`${socketUrl}/studio`, {
      query,
      transports,
      path: '/socket.io'
    })
    this.studioSocket.on('event', this.dispatchSocketEvent)
  }
}

EventBus.default = new EventBus()

export default EventBus
