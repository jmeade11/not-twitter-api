const Message = require('../models/message')

const { handle404, requireOwnership } = require('../../lib/custom_errors')
const { broadcastMessage } = require('../../lib/socket_helpers')

const index = (req, res, next) => {
  Message.find()
    .populate({ path: 'owner', select: ['username', 'email'] })
    .then(messages => res.status(200).json({ messages: messages }))
    .catch(next)
}

const show = (req, res, next) => {
  Message.findById(req.params.id)
    .populate({ path: 'owner', select: ['username', 'email'] })
    .then(handle404)
    .then(message => {
      res.status(200).json({ message: message })
    })
    .catch(next)
}

const post = (req, res, next) => {
  Message.create({ ...req.body.message, owner: req.user.id })
    .then(message => {
      return message.populate({ path: 'owner', select: ['username', 'email'] }).execPopulate()
    })
    .then(message => {
      broadcastMessage(req, 'message broadcast', { message: message })
      res.status(201).json({ message: message })
    })
    .catch(next)
}

const patch = (req, res, next) => {
  delete req.body.message.owner

  Message.findById(req.params.id)
    .populate({ path: 'owner', select: ['username', 'email'] })
    .then(handle404)
    .then(message => {
      requireOwnership(req, message)
      return message.set(req.body.message).save()
    })
    .then(message => {
      broadcastMessage(req, 'message update', { message: message })
      res.status(200).json({ message: message })
    })
    .catch(next)
}

const destroy = (req, res, next) => {
  const id = req.params.id
  Message.findById(id)
    .then(handle404)
    .then(message => {
      requireOwnership(req, message)
      message.remove()
    })
    .then(() => {
      broadcastMessage(req, 'message delete', id)
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
