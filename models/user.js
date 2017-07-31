const mongoose = require('mongoose')
const Schema = mongoose.Schema
const Token = require('./token')
const friends = require('mongoose-friends')
const bcrypt = require('bcrypt')
const crypto = require('crypto')

const notification = new Schema({
    text: String,
    time: Date,
    read: Boolean,
    type: String,
    verified: Boolean,
    serviceName:String,
    data: Schema.Types.Mixed
});
const user = new Schema({
  username: {type: String, index: {unique: true}},
  password: String,
  email: {
    type: String,
    required: true
  },
  first_name: {
    type: String,
    required: true
  },
  last_name: {
    type: String,
    required: true
  },
  verified: {type: Boolean, default: false},
    notifications: [notification],
});

user.methods.sendNotification = function (text, type, data, serviceName, cb) {
    const nfn = {text: text, time: Date.now(), read: false, type: type, data: data}
    this.notifications.push(nfn);
    this.save(cb)
};

user.methods.generate_token = function (cb) {
  const tokenValue = crypto.randomBytes(32).toString('base64');
  let token = new Token({token: tokenValue, clientId: 'email12345', u_id: this._id});
  token.save((err, token) => {
    if (err) {
      cb(err)
    }else{
      cb(null, token)
    }

  });

};


user.index({first_name: 'text', last_name: 'text', username: 'text'})
user.plugin(friends());
user.methods.isFriend = function (user, cb) {
  this.getFriends({}, (e, fs) => {
    if (e) {
      cb(e, false);
      return
    }
    for (let i = 0; i < fs.length; i++) {
      if ('' + user._id === '' + fs[i].friend._id) {
        cb(null, fs[i].status);
        return
      }
    }
    cb(null, false)
  })
};


user.methods.getInfo = function () {
  return {
    username: this.username,
    first_name: this.first_name,
    last_name: this.last_name,
    language: this.language,
    _id: this._id
  }
};


user.methods.addFriendCustom = function (identifier, pusher, cb) {
  const self = this;
  this.model('User').findOne({
    [mongoose.Types.ObjectId.isValid(identifier) ? '_id' : 'username']: identifier
  }).exec().then((u) => {
    if (!u) {
      const er = new Error('Ns such user');
      er.status = 400;
      throw er
    }
    if (u._id+"" === self._id+"") {
      const er = new Error('That\'s you')
      er.status = 400
      throw  er
    }
    self.requestFriend(u, e => {
      if (e) {
        cb(e);
        return
      }
      self.isFriend(u, (e, t) => {
        if (e) {
          cb(e);
          return
        }
        if (t !== 'accepted') {
          u.sendNotification('New friend request', 'friend', pusher,
            {user: self.getInfo()},
            e => {
              cb(e)
            })
        }
      })
    })
  }).catch((e) => cb(e))
};
user.methods.removeFriendCustom = function (identifier, cb) {
  const m = this.model('User')
  this.model('User').findOne({
    [mongoose.Types.ObjectId.isValid(identifier) ? '_id' : 'username']: identifier
  }).exec().then((u) => {
    m.removeFriend(this, u, e => {
      cb(e)
    })
  }).catch((e) => cb(e))
};
user.methods.verify = function (tk, cb) {
  this.verified = true
  this.save().then(() => {
    return Token.findOneAndRemove({token: tk}).exec()
  }).then(() => {
    cb()
  }).catch((e) => {
    cb(e)
  })
};

user.statics.info = function (identifier, self, cb) {
  this.model('User').findOne({
    [mongoose.Types.ObjectId.isValid(identifier) ? '_id' : 'username']: identifier
  }).exec().then((user) => {
    if (!user) {
      const e = new Error('No user')
      e.status = 400;
      throw e
    }
    let info = {
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      _id: user._id
    };
    return new Promise((re, rej) => {
        if (self) {
          self.isFriend(user, (e, s) => {
            if (e) {
              e.status = 500
              rej(e)
            }
            info.friend_status = s
            re(info)
          })
        } else {
          re(info)
        }
      }
    )
  }).then((info) => cb(null, info)).catch(e => cb(e))
};
user.statics.findUser = function (text, user, cb) {
  let query = {
    $text: {
      $search: text
    },
  };
  if (user) {
    query._id = {$ne: user._id}
  }
  this.model('User').find(query).exec().then((found) => {
    if (user) {
      return Promise.all(found.map((u) => {
        return new Promise((r, rj) => {
          user.isFriend(u, (e, s) => {
            if (e) {
              rj(e)
            }
            r(Object.assign({}, {is_friend: s}, u.getInfo()))
          })
        })
      }))
    } else {
      return Promise.resolve(found)
    }
  }).then((f) => cb(null, f)).catch((e) => cb(e))
};

user.methods.updateProfile = function (body, cb) {
  if (body.old_password) {
    if (!bcrypt.compareSync(this.password, body.old_password)) {
      let e = new Error('Wrong password');
      e.status = 400;
      cb(e)
    }
    this.password = bcrypt.hashSync(body.password || this.password, bcrypt.genSaltSync(10), null)
  }
  if(body.email) {
    this.email = body.email;
    this.verified=false;
  }
  this.first_name = body.first_name || this.first_name;
  this.last_name = body.last_name || this.last_name;
  this.save((e) => cb(e))
};

user.methods.read=function ( cb) {
      this.notifications.forEach(n => {
          n.read = true
      });
      this. save(e => {
          if (e) {
             cb(new Error('Error in saving user'))
          }
          cb(null)
      })
};

module.exports = mongoose.model('User', user);
