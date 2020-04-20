const mc = require('mongodb').MongoClient
const jwt = require('jsonwebtoken')
const {promisify} = require('util')
const verify = promisify(jwt.verify)
let db

const con = async (req, res, next) => {
  if(db) {req.db = db; next();}
  else{
    const options = {useNewUrlParser: true, useUnifiedTopology: true}
    const client = new mc(process.env.DB_URL, options)
    client.connect(err => {
      if(err) throw err
      db = client.db(process.env.DB_NAME)
      req.db = db
      console.log(`Connected to database ${process.env.DB_NAME}`)
      next()
    });
  }
}

const auth = async (req, res, next) => {
  const key =  process.env.JWT_KEY
  verify(req.get('token'), key).then(d => {
      req.user = d
      next()
  }).catch(e => next(e))
}

module.exports = { con, auth }