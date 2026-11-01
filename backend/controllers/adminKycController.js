const { query } = require('../config/db')

const mapKycRow = (row) => ({
  id: row.id,
  userId: row.user_id,
  fullName: row.full_name || '',
  email: row.email || '',
  phone: row.phone || '',
  country: row.country || '',
  knowledgePackage: row.knowledge_package || '',
  referralCode: row.referral_code || '',
  accountHolderName: row.account_holder_name,
  bankAccountNumber: row.bank_account_number,
  ifscCode: row.ifsc_code,
  bankName: row.bank_name,
  branch: row.branch,
  upi: row.upi || '',
  aadhaarNumber: row.aadhaar_number,
  panNumber: row.pan_number,
  submittedAt: row.submitted_at,
  updatedAt: row.updated_at,
})

const listKycSubmissions = async (req, res) => {
  try {
    const search = String(req.query.search || '').trim().toLowerCase()
    const upiFilter = String(req.query.upi || 'all').trim().toLowerCase()
    const exportAll = req.query.all === 'true' || req.query.export === 'true'
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 20))

    const params = []
    const clauses = []

    if (search) {
      params.push(`%${search}%`)
      const idx = params.length
      clauses.push(`(
        LOWER(COALESCE(u.full_name, '')) LIKE $${idx} OR
        LOWER(COALESCE(u.email, '')) LIKE $${idx} OR
        LOWER(COALESCE(u.phone, '')) LIKE $${idx} OR
        LOWER(COALESCE(u.referral_code, '')) LIKE $${idx} OR
        LOWER(k.account_holder_name) LIKE $${idx} OR
        LOWER(k.bank_name) LIKE $${idx} OR
        LOWER(k.ifsc_code) LIKE $${idx} OR
        LOWER(COALESCE(k.upi, '')) LIKE $${idx} OR
        LOWER(k.pan_number) LIKE $${idx} OR
        LOWER(k.aadhaar_number) LIKE $${idx} OR
        LOWER(k.bank_account_number) LIKE $${idx}
      )`)
    }

    if (upiFilter === 'with') {
      clauses.push(`(k.upi IS NOT NULL AND TRIM(k.upi) <> '')`)
    } else if (upiFilter === 'without') {
      clauses.push(`(k.upi IS NULL OR TRIM(k.upi) = '')`)
    }

    const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : ''

    const countResult = await query(
      `SELECT COUNT(*)::int AS count
       FROM user_kyc k
       LEFT JOIN users u ON u.id = k.user_id
       ${whereClause}`,
      params,
    )
    const total = countResult.rows[0]?.count || 0

    const statsResult = await query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE upi IS NOT NULL AND TRIM(upi) <> '')::int AS with_upi,
        COUNT(*) FILTER (WHERE upi IS NULL OR TRIM(upi) = '')::int AS without_upi,
        COUNT(*) FILTER (
          WHERE (submitted_at AT TIME ZONE 'Asia/Kolkata')::date =
                (NOW() AT TIME ZONE 'Asia/Kolkata')::date
        )::int AS today
      FROM user_kyc
    `)
    const stats = statsResult.rows[0] || { total: 0, with_upi: 0, without_upi: 0, today: 0 }

    let rowsQuery = `
      SELECT
        k.id,
        k.user_id,
        k.account_holder_name,
        k.bank_account_number,
        k.ifsc_code,
        k.bank_name,
        k.branch,
        k.upi,
        k.aadhaar_number,
        k.pan_number,
        k.submitted_at,
        k.updated_at,
        u.full_name,
        u.email,
        u.phone,
        u.country,
        u.knowledge_package,
        u.referral_code
      FROM user_kyc k
      LEFT JOIN users u ON u.id = k.user_id
      ${whereClause}
      ORDER BY k.submitted_at DESC
    `

    let rows
    if (exportAll) {
      const result = await query(rowsQuery, params)
      rows = result.rows
    } else {
      const offset = (page - 1) * pageSize
      const queryParams = [...params]
      queryParams.push(pageSize)
      const limitIdx = queryParams.length
      queryParams.push(offset)
      const offsetIdx = queryParams.length
      rowsQuery += ` LIMIT $${limitIdx} OFFSET $${offsetIdx}`
      const result = await query(rowsQuery, queryParams)
      rows = result.rows
    }

    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    return res.json({
      submissions: rows.map(mapKycRow),
      stats: {
        total: Number(stats.total) || 0,
        withUpi: Number(stats.with_upi) || 0,
        withoutUpi: Number(stats.without_upi) || 0,
        today: Number(stats.today) || 0,
      },
      pagination: exportAll
        ? { page: 1, pageSize: rows.length, total, totalPages: 1 }
        : { page, pageSize, total, totalPages },
    })
  } catch (error) {
    console.error('List KYC error:', error.message)
    return res.status(500).json({ message: 'Could not load KYC submissions' })
  }
}

module.exports = { listKycSubmissions }
