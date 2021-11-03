import { auth } from 'botpress/shared'
import { EventEmitter2 } from 'eventemitter2'
import io from 'socket.io-client'
import { authEvents } from '~/util/Auth'

class EventBus extends EventEmitter2 {
  private adminSocket: SocketIOClient.Socket
  private guestSocket: SocketIOClient.Socket
  private studioSocket: SocketIOClient.Socket
  static default

  constructor() {
    super({
      wildcard: true,
      maxListeners: 100
    })

    this.onAny(this.dispatchClientEvent)
    authEvents.on('new_token', this.setup)
  }

  dispatchSocketEvent = event => {
    this.emit(event.name, event.data, 'server')
  }

  dispatchClientEvent = (name, data, from) => {
    if (from === 'server') {
      // we sent this event ourselves
      return
    }

    const socket = name.startsWith('guest.') ? this.guestSocket : this.adminSocket
    socket && socket.emit('event', { name, data })
  }

  updateVisitorId = (newId: string, userIdScope?: string) => {
    auth.setVisitorId(newId, userIdScope)
  }

  private updateVisitorSocketId() {
    window.__BP_VISITOR_SOCKET_ID = this.guestSocket.id
  }

  setup = (userIdScope?: string) => {
    // TODO: implement this when the studio is executed as a standalone, since the socket is provided by the core
    // if (!window.BP_SERVER_URL) {
    //   console.warn('No server configured, socket is disabled')
    //   return
    // }

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

    closeSocket(this.adminSocket)
    closeSocket(this.guestSocket)
    closeSocket(this.studioSocket)

    const socketUrl = window['BP_SOCKET_URL'] || window.location.origin
    const transports = window.SOCKET_TRANSPORTS

    this.adminSocket = io(`${socketUrl}/admin`, {
      query,
      transports,
      path: `${window['ROOT_PATH']}/socket.io`
    })
    this.adminSocket.on('event', this.dispatchSocketEvent)

    this.guestSocket = io(`${socketUrl}/guest`, { query, transports, path: `${window['ROOT_PATH']}/socket.io` })

    this.guestSocket.on('connect', this.updateVisitorSocketId.bind(this))
    this.guestSocket.on('event', this.dispatchSocketEvent)

    // TODO fix url
    this.studioSocket = io(`http://localhost:${window.STUDIO_PORT}/studio`, {
      query,
      transports,
      path: `${window['ROOT_PATH']}/socket.io`
    })
    this.studioSocket.on('event', this.dispatchSocketEvent)
  }
}

EventBus.default = new EventBus()

export default EventBus
