// controllers/admin-controller.js
const adminServices = require('../../services/admin-services')
const { Restaurant, User, Category } = require('../../models')
const { imgurFileHandler } = require('../../helpers/file-helpers')

const adminController = {
  getUsers: async (req, res, next) => {
    try {
      const users = await User.findAll({ raw: true })
      res.render('admin/users', { users })
    } catch (err) {
      next(err)
    }
  },
  patchUser: async (req, res, next) => {
    try {
      const user = await User.findByPk(req.params.id)
      if (!user) throw new Error("User didn't exist!")
      if (user.email === 'root@example.com') {
        req.flash('error_messages', '禁止變更 root 權限')
        return res.redirect('back')
      }
      await user.update({
        isAdmin: !user.isAdmin
      })
      req.flash('success_messages', '使用者權限變更成功')
      res.redirect('/admin/users')
    } catch (err) {
      next(err)
    }
  },
  getRestaurants: (req, res, next) => {
    adminServices.getRestaurants(req, (err, data) => err ? next(err) : res.render('admin/restaurants', data))
  },
  createRestaurant: async (req, res, next) => {
    try {
      const categories = await Category.findAll({
        raw: true
      })

      res.render('admin/create-restaurant', { categories })
    } catch (err) {
      next(err)
    }
  },
  postRestaurant: (req, res, next) => {
    adminServices.postRestaurant(req, (err, data) => {
      if (err) return next(err)
      req.flash('success_messages', 'restaurant was successfully created')
      req.session.createdData = data
      return res.redirect('/admin/restaurants')
    })
  },
  getRestaurant: async (req, res, next) => {
    try {
      const restaurant = await Restaurant.findByPk(req.params.id, {
        raw: true,
        nest: true,
        include: [Category]
      })
      if (!restaurant) throw new Error("Restaurant didn't exist!")

      res.render('admin/restaurant', { restaurant })
    } catch (err) { next(err) }
  },
  editRestaurant: async (req, res, next) => {
    try {
      const [restaurant, categories] = await Promise.all([
        Restaurant.findByPk(req.params.id, { raw: true }),
        Category.findAll({ raw: true })
      ])
      if (!restaurant) throw new Error("Restaurant didn't exist!")

      res.render('admin/edit-restaurant', { restaurant, categories })
    } catch (err) { next(err) }
  },
  putRestaurant: async (req, res, next) => {
    try {
      const { name, tel, address, openingHours, description, categoryId } = req.body
      if (!name) throw new Error('Restaurant name is required!')
      const { file } = req
      const [restaurant, filePath] = await Promise.all([Restaurant.findByPk(req.params.id),
        imgurFileHandler(file)
      ])

      if (!restaurant) throw new Error("Restaurant didn't exist!")

      await restaurant.update({
        name,
        tel,
        address,
        openingHours,
        description,
        image: filePath || restaurant.image,
        categoryId
      })
      req.flash('success_messages', 'restaurant was successfully to update')
      res.redirect('/admin/restaurants')
    } catch (err) { next(err) }
  },
  deleteRestaurant: (req, res, next) => {
    adminServices.deleteRestaurant(req, (err, data) => {
      if (err) return next(err)
      req.session.deletedData = data
      return res.redirect('/admin/restaurants')
    })
  }
}
module.exports = adminController