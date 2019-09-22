const express = require('express')
const passport = require('passport')

const removeBlanks = require('../../lib/remove_blank_fields')
const requireToken = passport.authenticate('bearer', { session: false })

const controllers = require('../controllers/message_controller')

const router = express.Router()

router
  .get('/messages', controllers.index)
  .get('/messages/:id', controllers.show)
  .post('/messages', requireToken, controllers.post)
  .patch('/messages/:id', requireToken, removeBlanks, controllers.patch)
  .delete('/messages/:id', requireToken, controllers.destroy)

module.exports = router
