require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mid = require('./middleware')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const superagent = require('superagent')
const {promisify} = require('util')
const fs = require('fs')

const app = express()

app.use('/users', express.static('../tuba.work/public/users'))
app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(mid.con)

app.post('/jwt', (req, res) => {
  const {username, password} = req.body
  let c = record => {
    if(record){
      bcrypt.compare(password, record.password, (err, success) => {
        if(err){ console.log(err); res.json({ok: false, msg: err});}
        else if(success){
          const token = jwt.sign({ ...record }, process.env.JWT_KEY);
          res.header("auth-token", token).json({ ok: true, token: token, data: record })
        } else res.json({ok: false, msg: "password doesn't match"}); 
      });
    }else{ callback(false); }
  }
  
  let collection = req.db.collection('users');
  collection.findOne({username}, (err, record) => {
    if(err) {console.log(err); res.json({ok: false, msg: err})}
    else{ record==null ? res.json({ok: false, msg: `user ${username} not found`}): c(record); }
  });
})

app.post('/isValid', async (req, res) => {
  let response_json = {};
  try{
    const valid = await superagent.get(req.body.url)
    const isValid = JSON.parse(valid.text).data.is_valid
    if(isValid){
      response_json.isValid = isValid
      const {email, accessToken} = req.body.face_user
      let collection = req.db.collection('users');
      const existingUser = await collection.findOne({email})
      if(existingUser==null){
        const hashfy = promisify(bcrypt.hash);
        const hash = await hashfy(accessToken, 8)
        let d = new Date();
        const nu = {username: email.split('@')[0], password: hash, email: email, date: d.getTime()}
        nu.facebook = req.body.face_user
        const inserted = await collection.insertOne(nu, {w: 1})
        if(inserted){
          response_json.username = nu.username
          response_json.token = jwt.sign({ ...nu }, process.env.JWT_KEY);
        }
      }else{
        response_json.ok = true
        response_json.user = existingUser
        response_json.token = jwt.sign({ ...existingUser }, process.env.JWT_KEY);
      }
    }
  }catch(e){
    response_json.ok = false
    response_json.msg = `Error: ${e}`
  }
  // create the jsonwebtoken and return to client
  res.json(response_json)
})

app.get('/songs', mid.auth, async (req, res) => {
  let dir = `/home/tuba/nodejs/tuba.work/public/users/${req.user}`
      
  if (!fs.existsSync(dir)) {
    res.status(404).json({ok:false, msg: `User ${req.user} has no songs stored in the server!`})
  }else{
    fs.readdir(dir, (err, files) => {
      if(err) res.json({ok:false, msg:`Error: ${err}`})
      else res.json(files)
    })
  }
})

app.use((err, req, res, next) => {
  if(err) {
    console.error(err)
    res.send(err)
  }else next()
})

app.listen(process.env.PORT, () => console.log(`Listening on port ${process.env.PORT}`))
