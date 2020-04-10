const mc = require('mongodb').MongoClient
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

module.exports = { con }