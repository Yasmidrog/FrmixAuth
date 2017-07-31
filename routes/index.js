const express = require('express');
const router = express.Router();
const oauth2 = require('../functions/auth/oauth2');

router.post('/oauth/token', oauth2.token);
router.use("/oauth/token/introspect",
    (req, res, next) => {
        passport.authenticate('bearer', {session: false}, (err, user) => {


        })(req, res, next);
});

module.exports = router;
