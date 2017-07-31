const bauth = require('basic-auth')
const auth = function auth (req, res, next, strats, cb, check_verified) {
  if (!req.user) {
    const credentials = bauth(req) || {pass: req.param('password'), name: req.param('username')}
    if (credentials.pass && credentials.name) {
      req.query.password = credentials.pass
      req.query.username = credentials.name
    }
    passport.authenticate(strats, {session: false}, (err, user, info) => {
      if (err) {
        return next(err)
      }
      const e = check_access(user, check_verified)
      if (e) {
        cb(e)
        return
      }
      req.logIn(user, err => {
        if (err) {
          next(err)
        } else {
          next()
        }

      })
    })(req, res, next)
  } else {
    cb(check_access(req.user, check_verified))
  }
}
module.exports = function (type, check_valid, check_verified) {
  let types
  if (['normal', 'optional'].includes(type))
    types = ['login', 'bearer']
  else if (type === 'basic')
    types = ['login']
  else if (type === 'oauth')
    types = ['basic', 'oauth2-client-password']
  else if(type==="token")
    types=['bearer']
  else
    throw new Error('wrong auth type!')
  return function (req, res, next) {
    auth(req, res, next, types, e => {
      next(type !== 'optional' ? e : null)
    }, check_valid, check_verified)
  }
}
