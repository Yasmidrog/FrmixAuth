const User = require('../models/user')

module.exports.add_friend = (req, res, next) => {
    req.user.addFriendCustom(req.params.identifier, req.pusher, (e) => {
            console.log(req.params.identifier + '\n' + req.user.username)
            if (e)
                next(e)
            else
                res.json({status: 'done'})
        }
    )
}
module.exports.remove_friend = (req, res, next) => {
    req.user.removeFriendCustom(req.params.identifier,
        (e) => {
            if (e) next(e)
            else res.json({status: 'done'})
        })
}
module.exports.find = (req, res, next) => {
    User.findUser(req.query.search_for, req.user, (e, found) => {
        if (e)
            next(e)
        else res.json({status: 'done', found})
    })
}

module.exports.get_friends = (req, res, next) => {
    function f(e, fs) {
        if (e) {
            next(e)
            return
        }
        const friends = []
        fs.forEach(f => {
            const a = f
            a.allow = req.user.allowed(f.friend._id)
            a.allows = f.friend.allowed(req.user._id)
            a.friend = f.friend.getInfo()
            friends.push(a)
        })
        res.json({status: 'done', friends: friends})
    }

    const s = req.param('status')

    if (s === 'accepted') {
        req.user.getAcceptedFriends({}, f)
    } else if (s === 'pending') {
        f = req.user.getPendingFriends({}, f)
    } else if (s === 'requested') {
        f = req.user.getRequestedFriends({}, f)
    } else if (s === 'all') {
        f = req.user.getFriends({}, f)
    } else {
        const e = new Error('Wrong friendship status')
        e.status = 400
        next(e)
    }
}

module.exports.read = (req, res, next) => {
    req.user.read((e) => next(e))
};
module.exports.notifications_get = (req, res, next) => {
    const not = req.query.service_name ?
        req.user.notifications.filter((n) => n.serviceName === req.query.serviceName) :
        req.user.notifications;
    not.sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0))
    res.json({status: 'done', notifications: not})
};
module.exports.user_info = (req, res, next) => {
    User.info(req.params.id, req.user, (e, info) => {
        if (e) next(e)
        else res.json({status: 'done', info})
    })
}
module.exports.verify = (req, res, next) => {
    req.user.verify(decodeURIComponent(req.param('access_token')), (err) => {
        res.json({status: "done", verified: true})
    })
}
module.exports.update = (req, res, next) => {
    req.user.updateProfile(req.body, (e) => {
        if (e) {
            if (req.param('redir'))
                e.redir = req.param('redir')
            next(e)
        } else {
            res.json({status: 'done'})
        }
    })
}
module.exports.exists = (req, res, next) => {
    User.findOne({username: req.param('username')}, (e, u) => {
        if (e) {
            next(e)
            return
        }
        res.json({status: 'done', exists: !!u})
    })
}

module.exports.send_sotification = (req, res, next) => {
    req.user.sendNotification(req.body.text, req.body.type, req.body.data, req.body.serviceName, (e) => {
        if (e)
            next(e)
        else
            res.json({status: 'done'})
    })
}
module.exports.generate_token = (req, res, next) => {
    req.user.generate_token((e, token) => {
        if (e)
            next(e)
        else
            res.json({status: 'done', token})
    })
};