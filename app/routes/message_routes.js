const express = require('express')
const passport = require('passport')

const Message = require('../models/message')

const customErrors = require('../../lib/custom_errors')

const handle404 = customErrors.handle404
const requireOwnership = customErrors.requireOwnership
const removeBlanks = require('../../lib/remove_blank_fields')
const requireToken = passport.authenticate('bearer', { session: false })

const router = express.Router()

// INDEX
// GET /messages
router.get('/messages', (req, res, next) => {
  Message.find()
    .populate({ path: 'owner', select: ['username', 'email'] })
    .then(messages => {
      return messages.map(message => message.toObject())
    })
    .then(messages => res.status(200).json({ messages: messages }))
    .catch(next)
})

// SHOW
// GET /messages/5a7db6c74d55bc51bdf39793
router.get('/messages/:id', (req, res, next) => {
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
})

// CREATE
// POST /messages
router.post('/messages', requireToken, (req, res, next) => {
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
})

// UPDATE
// PATCH /messages/5a7db6c74d55bc51bdf39793
router.patch('/messages/:id', requireToken, removeBlanks, (req, res, next) => {
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
})

// DESTROY
// DELETE /messages/5a7db6c74d55bc51bdf39793
router.delete('/messages/:id', requireToken, (req, res, next) => {
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
})

module.exports = router
