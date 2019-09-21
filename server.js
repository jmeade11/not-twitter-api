const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const messageRoutes = require('./app/routes/message_routes')
const userRoutes = require('./app/routes/user_routes')

const errorHandler = require('./lib/error_handler')

const db = require('./config/db')

const auth = require('./lib/auth')

mongoose.Promise = global.Promise

mongoose.connect(db, { useMongoClient: true })

const app = express()

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:7165' }))

const port = process.env.PORT || 4741

app.use((req, res, next) => {
  if (req.headers.authorization) {
    const auth = req.headers.authorization
    req.headers.authorization = auth.replace('Token token=', 'Bearer ')
  }
  next()
})

app.use(auth)

app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.use(messageRoutes)
app.use(userRoutes)

app.use(errorHandler)

const server = app.listen(port, () => {
  console.log('connected to port: ' + port)
})

const io = require('socket.io')(server)

app.set('socketio', io)

io.on('connect', socket => {
  socket.emit('id', socket.id)
})

module.exports = app
