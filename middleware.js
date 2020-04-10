const mc = require('mongodb').MongoClient;

const con = async (req, res, next) => {
  const client = new mc(process.env.URL, {useNewUrlParser: true, useUnifiedTopology: true})
  client.connect(err => {
    if(err) throw err
    req.db = client.db('test')
    console.log('Connected to database')
    next()
  });
}

module.exports = { con }