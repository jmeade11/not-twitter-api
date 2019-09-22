class OwnershipError extends Error {
  constructor () {
    super()
    this.name = 'OwnershipError'
    this.message = 'The provided token does not match the owner of this document'
  }
}

class UsernameNotUniqueError extends Error {
  constructor () {
    super()
    this.name = 'UsernameNotUniqueError'
    this.message = 'The username you selected is already in use'
  }
}

class DocumentNotFoundError extends Error {
  constructor () {
    super()
    this.name = 'DocumentNotFoundError'
    this.message = 'The provided ID doesn\'t match any documents'
  }
}

class BadParamsError extends Error {
  constructor () {
    super()
    this.name = 'BadParamsError'
    this.message = 'A required parameter was omitted or invalid'
  }
}

class BadCredentialsError extends Error {
  constructor () {
    super()
    this.name = 'BadCredentialsError'
    this.message = 'The provided username or password is incorrect'
  }
}

const requireOwnership = (requestObject, resource) => {
  const owner = resource.owner._id ? resource.owner._id : resource.owner
  if (!requestObject.user._id.equals(owner)) {
    throw new OwnershipError()
  }
}

const handle404 = record => {
  if (!record) {
    throw new DocumentNotFoundError()
  } else {
    return record
  }
}

module.exports = {
  requireOwnership,
  handle404,
  BadParamsError,
  BadCredentialsError,
  UsernameNotUniqueError
}
