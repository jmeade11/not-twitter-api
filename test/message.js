process.env.TESTENV = true

let Message = require('../app/models/message.js')
let User = require('../app/models/user')

const crypto = require('crypto')

let chai = require('chai')
let chaiHttp = require('chai-http')
let server = require('../server')
chai.should()

chai.use(chaiHttp)

const token = crypto.randomBytes(16).toString('hex')
let userId
let messageId

describe('Messages', () => {
  const messageParams = {
    message: '13 JavaScript tricks WDI instructors don\'t want you to know'
  }

  before(done => {
    Message.remove({})
      .then(() => User.create({
        email: 'jen',
        hashedPassword: '12345',
        token
      }))
      .then(user => {
        userId = user._id
        return user
      })
      .then(() => Message.create(Object.assign(messageParams, {owner: userId})))
      .then(record => {
        messageId = record._id
        done()
      })
      .catch(console.error)
  })

  describe('GET /messages', () => {
    it('should get all the messages', done => {
      chai.request(server.app)
        .get('/messages')
        .set('Authorization', `Token token=${token}`)
        .end((e, res) => {
          res.should.have.status(200)
          res.body.messages.should.be.a('array')
          res.body.messages.length.should.be.eql(1)
          done()
        })
    })
  })

  describe('GET /messages/:id', () => {
    it('should get one message', done => {
      chai.request(server.app)
        .get('/messages/' + messageId)
        .set('Authorization', `Token token=${token}`)
        .end((e, res) => {
          res.should.have.status(200)
          res.body.message.should.be.a('object')
          res.body.message.title.should.eql(messageParams.title)
          done()
        })
    })
  })

  describe('DELETE /messages/:id', () => {
    let messageId

    before(done => {
      Message.create(Object.assign(messageParams, { owner: userId }))
        .then(record => {
          messageId = record._id
          done()
        })
        .catch(console.error)
    })

    it('must be owned by the user', done => {
      chai.request(server.app)
        .delete('/messages/' + messageId)
        .set('Authorization', `Bearer notarealtoken`)
        .end((e, res) => {
          res.should.have.status(401)
          done()
        })
    })

    it('should be succesful if you own the resource', done => {
      chai.request(server.app)
        .delete('/messages/' + messageId)
        .set('Authorization', `Bearer ${token}`)
        .end((e, res) => {
          res.should.have.status(204)
          done()
        })
    })

    it('should return 404 if the resource doesn\'t exist', done => {
      chai.request(server.app)
        .delete('/messages/' + messageId)
        .set('Authorization', `Bearer ${token}`)
        .end((e, res) => {
          res.should.have.status(404)
          done()
        })
    })
  })

  describe('POST /messages', () => {
    it('should not POST an message without a title', done => {
      let untitled = {
        message: 'Untitled'
      }
      chai.request(server.app)
        .post('/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: untitled })
        .end((e, res) => {
          res.should.have.status(422)
          res.should.be.a('object')
          done()
        })
    })

    it('should not POST an message without message', done => {
      let noMessage = {
        owner: 'fakeID'
      }
      chai.request(server.app)
        .post('/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: noMessage })
        .end((e, res) => {
          res.should.have.status(422)
          res.should.be.a('object')
          done()
        })
    })

    it('should not allow a POST from an unauthenticated user', done => {
      chai.request(server.app)
        .post('/messages')
        .send({ message: messageParams })
        .end((e, res) => {
          res.should.have.status(401)
          done()
        })
    })

    it('should POST an message with the correct params', done => {
      let validMessage = {
        message: 'Advice to devs: Don\'t run rm -rf / --no-preserve-root'
      }
      chai.request(server.app)
        .post('/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: validMessage })
        .end((e, res) => {
          res.should.have.status(201)
          res.body.should.be.a('object')
          res.body.should.have.property('message')
          res.body.message.message.should.eql(validMessage.message)
          done()
        })
    })
  })

  describe('PATCH /messages/:id', () => {
    let messageId

    const fields = {
      message: 'Take this 4 question quiz to find out!'
    }

    before(async function () {
      const record = await Message.create(Object.assign(messageParams, { owner: userId }))
      messageId = record._id
    })

    it('must be owned by the user', done => {
      chai.request(server.app)
        .patch('/messages/' + messageId)
        .set('Authorization', `Bearer notarealtoken`)
        .send({ message: fields })
        .end((e, res) => {
          res.should.have.status(401)
          done()
        })
    })

    it('should update fields when PATCHed', done => {
      chai.request(server.app)
        .patch(`/messages/${messageId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ message: fields })
        .end((e, res) => {
          res.should.have.status(205)
          done()
        })
    })

    it('shows the updated resource when fetched with GET', done => {
      chai.request(server.app)
        .get(`/messages/${messageId}`)
        .set('Authorization', `Bearer ${token}`)
        .end((e, res) => {
          res.should.have.status(200)
          res.body.should.be.a('object')
          res.body.message.message.should.eql(fields.message)
          done()
        })
    })

    it('doesn\'t overwrite fields with empty strings', done => {
      chai.request(server.app)
        .patch(`/messages/${messageId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ message: { message: '' } })
        .then(() => {
          chai.request(server.app)
            .get(`/messages/${messageId}`)
            .set('Authorization', `Bearer ${token}`)
            .end((e, res) => {
              res.should.have.status(200)
              res.body.should.be.a('object')
              res.body.message.message.should.eql(fields.message)
              done()
            })
        })
    })
  })
})
