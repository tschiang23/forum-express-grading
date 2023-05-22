const { Restaurant, Category } = require('../../models')
const { getOffset, getPagination } = require('../../helpers/pagination-helper')
const restaurantController = {
  getRestaurants: async (req, res, next) => {
    try {
      // 設定預設limit
      const DEFAULT_LIMIT = 9

      // 從網址上拿下來的參數是字串，先轉成 Number 再操作
      const categoryId = Number(req.query.categoryId) || ''
      // 取得page
      const page = Number(req.query.page) || 1
      // req.query.limit 預留資料限制數量:每頁顯示 N 筆
      const limit = Number(req.query.limit) || DEFAULT_LIMIT
      const offset = getOffset(limit, page)

      const [restaurants, categories] = await Promise.all([
        Restaurant.findAndCountAll({
          include: Category,
          where: { // 查詢條件
            ...categoryId ? { categoryId } : {} // 檢查 categoryId 是否為空值
          },
          limit,
          offset,
          nest: true,
          raw: true
        }),
        Category.findAll({ raw: true })
      ])

      // const data = restaurants.rows.map(r => {
      //   r.description = r.description.substring(0, 50)
      //   return r
      // })

      // 檢查req.user是否為false 才回傳favorited資料
      const favoritedRestaurantsId = req.user?.FavoritedRestaurants ? req.user.FavoritedRestaurants.map(fr => fr.id) : []

      const likedRestaurantsId = req.user?.LikedRestaurants ? req.user.LikedRestaurants.map(lr => lr.id) : []

      const data = restaurants.rows.map(r => ({
        ...r,
        description: r.description.substring(0, 50),
        isFavorited: favoritedRestaurantsId.includes(r.id),
        isLiked: likedRestaurantsId.includes(r.id)
      }))
      // res.status(status).json(obj)
      return res.status(200).json({
        restaurants: data,
        categories,
        categoryId,
        pagination: getPagination(limit, page, restaurants.count)
      })
    } catch (err) {
      next(err)
    }
  }
}
module.exports = restaurantController
