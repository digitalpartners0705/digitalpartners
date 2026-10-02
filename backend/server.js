const express = require('express')
const cors = require('cors')
require('dotenv').config()

const {
  initUsersTable,
  initCatalogTables,
  initAffiliateTables,
  initOrderTables,
  initTrainingTables,
} = require('./config/db')
const { seedCatalog, ensureAdmin, seedTrainingDays, backfillOrders } = require('./config/seed')
const healthRoutes = require('./routes/healthRoutes')
const authRoutes = require('./routes/authRoutes')
const courseRoutes = require('./routes/courseRoutes')
const adminRoutes = require('./routes/adminRoutes')
const affiliateRoutes = require('./routes/affiliateRoutes')

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.use('/api', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/affiliate', affiliateRoutes)

const start = async () => {
  try {
    await initUsersTable()
    await initCatalogTables()
    await initAffiliateTables()
    await initOrderTables()
    await initTrainingTables()
    await seedCatalog()
    await seedTrainingDays()
    await ensureAdmin()
    await backfillOrders()
    app.listen(PORT, (err) => {
      if (err) {
        console.error('Failed to start server:', err.message)
        process.exit(1)
      }
      console.log(`Server is running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Database connection failed:', error.message)
    process.exit(1)
  }
}

start()
