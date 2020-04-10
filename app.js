require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mid = require('./middleware')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const app = express()

app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(mid.con)

app.post('/jwt', (req, res) => {
  const {username, password} = req.body
  //console.log(req.body)
  let c = record => {
    if(record){
      //console.log(password, record.password)
      bcrypt.compare(password, record.password, (err, success) => {
        if(err){ console.log(err); res.send(err);}
        else if(success){
          const token = jwt.sign({ ...record }, process.env.JWT_KEY);
          res.header("auth-token", token).json({ ok: true, token: token, data: record })
        } else res.send("password doesn't match"); 
      });
    }else{ callback(false); }
  }
  
  let collection = req.db.collection('users');
  collection.findOne({username}, (err, record) => {
    if(err) {console.log(err); res.send(err)}
    else{ record==null ? res.send("not found"): c(record); }
  });
})

app.use((err, req, res, next) => {
  if(err) {
    console.error(err)
    res.send(err)
  }else next()
})

app.listen(process.env.PORT, () => console.log(`Listening on port ${process.env.PORT}`))
