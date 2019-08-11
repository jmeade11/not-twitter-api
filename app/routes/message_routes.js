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
router.get('/messages', requireToken, (req, res, next) => {
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
router.get('/messages/:id', requireToken, (req, res, next) => {
  Message.findById(req.params.id)
    .then(handle404)
    .then(message => res.status(200).json({ message: message.toObject() }))
    .catch(next)
})

// CREATE
// POST /messages
router.post('/messages', requireToken, (req, res, next) => {
  req.body.message.owner = req.user.id

  Message.create(req.body.message)
    .then(message => {
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
    .then(() => res.sendStatus(204))
    .catch(next)
})

// DESTROY
// DELETE /messages/5a7db6c74d55bc51bdf39793
router.delete('/messages/:id', requireToken, (req, res, next) => {
  Message.findById(req.params.id)
    .then(handle404)
    .then(message => {
      requireOwnership(req, message)
      message.remove()
    })
    .then(() => res.sendStatus(204))
    .catch(next)
})

module.exports = router
