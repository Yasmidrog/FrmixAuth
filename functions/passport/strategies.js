const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
const User = require('../../models/user');
const Token = require('../../models/token');
const bCrypt = require('bcrypt-nodejs');
const Client = require('../../models/client');
const BearerStrategy = require('passport-http-bearer').Strategy;
const ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
const isValidPassword = (user, password) => bCrypt.compareSync(password, user.password);

passport.use('login', new LocalStrategy({
        passReqToCallback: true
    },
    (req, username, password, done) => {
        User.findOne({'username': username},
            (err, user) => {
                if (err) {
                    return done(err)
                }
                if (!user) {
                    let e = new Error('No such user');
                    e.status = 403;
                    return done(e, false)
                }
                if (!isValidPassword(user, password)) {
                    let e = new Error('Invalid password');
                    e.status = 403;
                    return done(e, false)
                }
                return done(null, user)
            }
        )
    }))
function reg(newUser, req, username, password, cb) {
    newUser.username = username
    newUser.password = createHash(password)
    newUser.email = req.body.email
    newUser.first_name = req.body.first_name
    newUser.last_name = req.body.last_name
    newUser.save(err => {
        cb(err, newUser)
    })
}

passport.use('signup', new LocalStrategy({
        passReqToCallback: true
    },
    (req, username, password, done) => {
        const findOrCreateUser = () => {
            User.findOne({'username': username}, (err, user) => {
                if (err) {
                    return done(err)
                }
                if (user) {
                    let e = new Error('User exists')
                    e.status = 403
                    return done(e, false)
                } else {
                    const cb = (e, u) => {
                        if (e)
                            done(e, false)
                        else
                            done(null, u)
                    };

                    const nu = new User()

                    if (req.body.refcode) {
                        User.validRef(req.body.refcode, (err, valid) => {
                            if (err)
                                done(err, false);
                            else {
                                if (valid) {
                                    nu.lifetime = 60 * 60 * 24 * 7;
                                }
                                reg(nu, req, username, password, cb)
                            }
                        })
                    } else {
                        reg(nu, req, username, password, cb)
                    }
                }
            })
        };
        process.nextTick(findOrCreateUser)
    })
);

passport.use('bearer', new BearerStrategy({
        passReqToCallback: true
    },
    (req, token, done) => {
        Token.findOne({token: decodeURIComponent(token)}).populate('u_id').exec()
            .then((tk) => {
                if (!tk) {
                    let e = new Error('No token');
                    e.status = 403;
                    throw e
                }
                req.token = tk;
                if (!tk.u_id) {
                    let e = new Error('User does not exist');
                    e.status = 403;
                    throw e
                }
                return done(null, tk.u_id)
            }).catch((e) => done(e, false))
    }
));


passport.use(new ClientPasswordStrategy({
        passReqToCallback: true
    },
    (req, clientId, clientSecret, done) => {
        Client.findOne({clientId: clientId}, (err, client) => {
            if (err) {
                return done(err, false)
            }
            if (!client) {
                let e = new Error('Client does not exist');
                e.status = 403
                return done(e, false)
            }
            if (client.clientSecret !== clientSecret) {
                return done(403, false, req.flash('message', 'Wrong secret'))
            }

            return done(null, client)
        })
    }
));

let createHash = password => bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
