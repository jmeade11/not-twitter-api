const setSenderSocket = (req, res, next) => {
  if (req.query && req.query.socket) {
    const socketId = req.query.socket
    const io = req.app.get('socketio')
    req.senderSocket = io.sockets.connected[socketId]
  } else {
    req.senderSocket = null
  }
  next()
}

const broadcastMessage = (req, messageType, message) => {
  if (req.senderSocket) {
    req.senderSocket.broadcast.emit(messageType, message)
  } else {
    req.app.get('socketio').emit(messageType, message)
  }
}

module.exports = {
  setSenderSocket,
  broadcastMessage
}
