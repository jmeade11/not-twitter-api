'use strict'
require('dotenv').config()

const AWS = require('aws-sdk')
const s3 = new AWS.S3()

const s3Upload = file => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: `${Date.now()}_${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    }
    s3.upload(params, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

const s3Delete = params => (
  new Promise((resolve, reject) => {
    s3.deleteObject(params, (err) => {
      if (err) {
        console.log(err)
        reject(err)
      }
      resolve('success')
    })
  })
)

module.exports = {
  s3Upload,
  s3Delete
}
