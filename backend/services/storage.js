const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')

const isConfigured = () =>
  Boolean(
    process.env.LIGHTSAIL_REGION &&
      process.env.LIGHTSAIL_BUCKET &&
      process.env.LIGHTSAIL_ACCESS_KEY_ID &&
      process.env.LIGHTSAIL_SECRET_ACCESS_KEY
  )

const client = () =>
  new S3Client({
    region: process.env.LIGHTSAIL_REGION,
    endpoint: `https://s3.${process.env.LIGHTSAIL_REGION}.amazonaws.com`,
    credentials: {
      accessKeyId: process.env.LIGHTSAIL_ACCESS_KEY_ID,
      secretAccessKey: process.env.LIGHTSAIL_SECRET_ACCESS_KEY,
    },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  })

const signedGet = async (key, expiresIn = 3600) => {
  if (!key || !isConfigured()) return null
  const command = new GetObjectCommand({
    Bucket: process.env.LIGHTSAIL_BUCKET,
    Key: key,
  })
  return getSignedUrl(client(), command, { expiresIn })
}

const putObject = async (key, body, contentType) => {
  await client().send(
    new PutObjectCommand({
      Bucket: process.env.LIGHTSAIL_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )
}

const signedPut = async (key, contentType, expiresIn = 900) => {
  const command = new PutObjectCommand({
    Bucket: process.env.LIGHTSAIL_BUCKET,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(client(), command, { expiresIn })
}

const removeObject = async (key) => {
  if (!key || !isConfigured()) return
  await client().send(
    new DeleteObjectCommand({
      Bucket: process.env.LIGHTSAIL_BUCKET,
      Key: key,
    })
  )
}

module.exports = { isConfigured, signedGet, signedPut, putObject, removeObject }
