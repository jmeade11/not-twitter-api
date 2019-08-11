// Create custom error types by extending `Error.prototype`
// using ES6 class syntax. Set `name` and `message` in the
// constructor method to match the pattern that
// Express and Mongoose use for custom errors.

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

// Helper method to check if the user trying to modify a
// resource is the owner of it. Throws an error if not.
// `requestObject` must be the actual `req` object
const requireOwnership = (requestObject, resource) => {
  // `requestObject.user` is defined with `requireToken`
  // `requireToken` MUST be passed to the route as
  // the second argument
  if (!requestObject.user._id.equals(resource.owner)) {
    throw new OwnershipError()
  }
}

// If the record returned from a find operation is null
// it doesn't produce an error so we'll return 404
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
