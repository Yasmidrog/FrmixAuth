const oauth2orize = require('oauth2orize');
const passport = require('passport');
const UserModel = require('../../models/user');
const AccessTokenModel = require('../../models/token');
const RefreshTokenModel = require('../../models/refresh');
const crypto = require('crypto');
const server = oauth2orize.createServer();
const bCrypt = require('bcrypt-nodejs');
const isValidPassword = (user, password) => bCrypt.compareSync(password, user.password);
function genToken() {
    return  crypto.randomBytes(32).toString('base64').replace(new RegExp("[+=\/]", 'g'),"")
}
function sendSchrodingerError(data, done) {
    const GOODERROR=new Error("Allright!");
    GOODERROR.status=200;//shut up, cuz this exchange point doesn't work as middleware
    GOODERROR.data=data;
    done(GOODERROR, false);
}
server.exchange(oauth2orize.exchange.password((client, username, password, scope, done) => {
    UserModel.findOne({username: username}, (err, user) => {
        if (err) {
            return done(err);
        }
        if (!user) {
            let e = new Error("No user");
            e.status = 403;
            return done(e, false);
        }
        if (!isValidPassword(user, password)) {
            let e = new Error("Wrong password");
            e.status = 403;
            return done(e, false);
        }

        const tokenValue = genToken();
        const refreshTokenValue = genToken();
        let token = new AccessTokenModel({
            token: tokenValue,
            clientId: client.clientId,
            u_id: user._id
        });
        let refreshToken = new RefreshTokenModel({
            token: refreshTokenValue,
            clientId: client.clientId,
            u_id: user._id
        });
        refreshToken.save(err => {
            if (err) {

                return done(err);
            } else {
                token.save((err, token) => {
                    if (err) {
                        return done(err);
                    }
                    sendSchrodingerError({
                        access_token:tokenValue, refresh_token:refreshTokenValue
                    }, done)
                });
            }
        });

    })

}));

// Exchange refreshToken for access token.
server.exchange(oauth2orize.exchange.refreshToken((client, refreshToken, scope, done) => {
    RefreshTokenModel.findOne({token: refreshToken}, (err, t) => {
        if (err) {
            return done(err);
        }
        if (!t) {
            let e = new Error("No token");
            e.status = 403;
            return done(e, false);
        }
        UserModel.findById(t.u_id, (err, user) => {

            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false);
            }

            const tokenValue = genToken();
            const refreshTokenValue = genToken();
            let token = new AccessTokenModel({token: tokenValue, clientId: client.clientId, u_id: user._id});
            let refreshToken = new RefreshTokenModel({
                token: refreshTokenValue,
                clientId: client.clientId,
                u_id: user._id
            });
            refreshToken.save(err => {
                if (err) {
                    return done(err);
                } else {
                    token.save((err) => {
                        if (err) {
                            return done(err);
                        }
                        t.remove();
                        sendSchrodingerError({
                            access_token:tokenValue, refresh_token:refreshTokenValue
                        }, done)
                    });
                }
            });
        });
    });
}));


// token endpoint
exports.token = [
    passport.authenticate(['basic', 'oauth2-client-password'], {session: false}),
    server.token(),
];