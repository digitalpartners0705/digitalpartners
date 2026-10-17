const { query } = require('../config/db')

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const submitContact = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim()
    const email = String(req.body.email || '').trim().toLowerCase()
    const phone = String(req.body.phone || '').trim()
    const message = String(req.body.message || '').trim()

    if (!name) {
      return res.status(400).json({ message: 'Name is required' })
    }
    if (!email || !EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ message: 'A valid email is required' })
    }
    if (!message || message.length < 5) {
      return res.status(400).json({ message: 'Message must be at least 5 characters' })
    }

    const result = await query(
      `INSERT INTO contact_requests (name, email, phone, message)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, phone, message, status, created_at`,
      [name, email, phone || null, message]
    )

    return res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully. Our team will get back to you shortly.',
      contact: result.rows[0],
    })
  } catch (error) {
    console.error('Submit contact error:', error.message)
    return res.status(500).json({ message: 'Could not send your message. Please try again later.' })
  }
}

module.exports = {
  submitContact,
}
