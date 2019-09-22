const Message = require('../models/message')

const { handle404, requireOwnership } = require('../../lib/custom_errors')

const index = (req, res, next) => {
  Message.find()
    .populate({ path: 'owner', select: ['username', 'email'] })
    .then(messages => res.status(200).json({ messages: messages }))
    .catch(next)
}

const show = (req, res, next) => {
  const socketId = req.query ? req.query.socket : ''
  const io = req.app.get('socketio')
  const senderSocket = socketId ? io.sockets.connected[socketId] : null

  Message.findById(req.params.id)
    .populate({ path: 'owner', select: ['username', 'email'] })
    .then(handle404)
    .then(message => {
      if (senderSocket) {
        senderSocket.broadcast.emit('message update', message.toObject())
      } else {
        io.emit('message update', message.toObject())
      }
      res.status(200).json(message.toObject())
    })
    .catch(next)
}

const post = (req, res, next) => {
  req.body.message.owner = req.user.id
  const socketId = req.query ? req.query.socket : ''
  const io = req.app.get('socketio')
  const senderSocket = socketId ? io.sockets.connected[socketId] : null

  Message.create(req.body.message)
    .then(message => {
      return message.populate({ path: 'owner', select: ['username', 'email'] }).execPopulate()
    })
    .then(message => {
      if (senderSocket) {
        senderSocket.broadcast.emit('message broadcast', { message })
      } else {
        io.emit('message broadcast', { message })
      }
      res.status(201).json({ message: message.toObject() })
    })
    .catch(next)
}

const patch = (req, res, next) => {
  delete req.body.message.owner

  Message.findById(req.params.id)
    .then(handle404)
    .then(message => {
      requireOwnership(req, message)
      return message.update(req.body.message)
    })
    .then(() => {
      res.sendStatus(205)
    })
    .catch(next)
}

const destroy = (req, res, next) => {
  const socketId = req.query ? req.query.socket : ''
  const io = req.app.get('socketio')
  const senderSocket = socketId ? io.sockets.connected[socketId] : null

  const id = req.params.id
  Message.findById(id)
    .then(handle404)
    .then(message => {
      requireOwnership(req, message)
      message.remove()
    })
    .then(() => {
      if (senderSocket) {
        senderSocket.broadcast.emit('message delete', id)
      } else {
        io.emit('message delete', id)
      }
      res.sendStatus(204)
    })
    .catch(next)
}

module.exports = {
  index,
  show,
  post,
  patch,
  destroy
}
