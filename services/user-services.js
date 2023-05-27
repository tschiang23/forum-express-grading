const bcrypt = require('bcryptjs')
const { User } = require('../models')

const userServices = {
  signUp: async (req, cb) => {
    try {
      if (req.body.password !== req.body.passwordCheck) throw new Error('Password dot not match!')

      const user = await User.findOne({ where: { email: req.body.email } })

      if (user) throw new Error('Email already exists!')

      const hash = await bcrypt.hash(req.body.password, 10)
      const createdUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: hash
      })

      const userData = createdUser.toJSON()
      delete userData.password
      return cb(null, {
        user: userData
      })
    } catch (err) {
      // 接住前面拋出的錯誤，呼叫專門做錯誤處理的 middleware
      cb(err)
    }
  }
}

module.exports = userServices
