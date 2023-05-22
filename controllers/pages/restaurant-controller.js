const { Restaurant, Category, Comment, User } = require('../../models')
const restaurantServices = require('../../services/restaurant-services')
const sequelize = require('sequelize')
const restaurantController = {
  getRestaurants: (req, res, next) => {
    restaurantServices.getRestaurants(req, (err, data) => err ? next(err) : res.render('restaurants', data))
  },
  getRestaurant: async (req, res, next) => {
    try {
      const restaurant = await Restaurant.findByPk(req.params.id, {
        include: [
          Category,
          { model: Comment, include: User },
          { model: User, as: 'FavoritedUsers' },
          { model: User, as: 'LikedUsers' }
        ],
        order: [[Comment, 'id', 'DESC']]
      })
      if (!restaurant) throw new Error("Restaurant didn't exist!")
      const incrementResult = await restaurant.increment('viewCounts')
      const isFavorited = restaurant.FavoritedUsers.some(f => f.id === req.user.id)
      const isLiked = restaurant.LikedUsers.some(l => l.id === req.user.id)

      res.render('restaurant', {
        restaurant: incrementResult.toJSON(),
        isFavorited,
        isLiked
      })
    } catch (err) { next(err) }
  },
  getDashboard: async (req, res, next) => {
    try {
      const restaurant = await Restaurant.findByPk(req.params.id, {
        include: [Category, { model: Comment }]
      })

      if (!restaurant) throw new Error("Restaurant didn't exist!")

      res.render('dashboard', { restaurant: restaurant.toJSON() })
    } catch (err) { next(err) }
  },
  getFeeds: async (req, res, next) => {
    try {
      const [restaurants, comments] = await Promise.all([
        Restaurant.findAll({
          limit: 10,
          order: [['createdAt', 'DESC']],
          include: [Category],
          raw: true,
          nest: true
        }),
        Comment.findAll({
          limit: 10,
          order: [['createdAt', 'DESC']],
          include: [User, Restaurant],
          raw: true,
          nest: true
        })
      ])

      res.render('feeds', {
        restaurants,
        comments
      })
    } catch (err) { next(err) }
  },
  getTopRestaurants: async (req, res, next) => {
    try {
      const restaurants = await Restaurant.findAll({
        // include: [{ model: User, as: 'FavoritedUsers' }]
        attributes: {
          include: [
            [
              sequelize.literal(`(
              SELECT COUNT(*)
              FROM favorites AS favorite
              WHERE favorite.restaurant_id = restaurant.id
            )`),
              'favoritedCount'
            ]
          ]
        },
        include: [
          Category
        ],
        order: [[sequelize.literal('favoritedCount'), 'DESC']],
        limit: 10,
        nest: true,
        raw: true
      }
      )
      const topRestaurants = restaurants.map(r => ({
        ...r,
        description: r.description.substring(0, 50),
        // favoritedCount: r.FavoritedUsers.length,
        isFavorited: req.user && req.user.FavoritedRestaurants.some(f => f.id === r.id)
      }))
      // .sort((a, b) => b.favoritedCount - a.favoritedCount).slice(0, 10)

      res.render('top-restaurants', { restaurants: topRestaurants })
    } catch (err) { next(err) }
  }
}
module.exports = restaurantController
