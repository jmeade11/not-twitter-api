module.exports = function (req, res, next) {
  Object.values(req.body).forEach(obj => {
    for (const key in obj) {
      if (obj[key] === '') {
        delete obj[key]
      }
    }
  })

  next()
}
