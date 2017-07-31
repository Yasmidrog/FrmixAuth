const express = require('express');
const passport = require('passport');
const app= express.Router();
const func = require("../controllers/user");
const authgen = require("../functions/auth/auth_func");
const auth=authgen('normal', true, true);
app.get('/', auth,
    (req, res) => {
        res.json({message: req.flash("message")[0], user: req.user.getInfo(), status: "done"});
    });
app.post('/edit',auth, func.update);
app.post('/friends/:identifier', auth, func.add_friend);//identifier -- id or username
app.delete('/friends/:identifier', auth, func.remove_friend);
app.get('/friends', auth, func.get_friends);
app.get('/notifications', auth, func.notifications_get);
app.post('/notifications/read', auth, func.read);
app.get('/info/:identifier', authgen('optional'), func.user_info);
app.get('/find', authgen('optional'), func.find);
app.get('/exists', func.exists);