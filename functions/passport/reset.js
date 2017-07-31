const Token = require('../../../models/token');
const User = require('../../../models/user');
const bCrypt = require('bcrypt-nodejs');

module.exports=(req, res) => {
    User.findOne({'username': req.user.username}).exec(
        (err, user) => {
            if (err) {
                res.json({status:"err", found:false, message:err.message});
                return;
            }
            if (!user) {
                res.json({status:"err", found: false, message: "No user"});
                return;
            }
            user.password=bCrypt.hashSync(req.body.password, bCrypt.genSaltSync(10), null);
            user.save(err => {
                if (err) {
                    throw err;
                }
            });
            Token.find({token: req.body.access_token}).remove().exec();
        });
    res.redirect('/');
};