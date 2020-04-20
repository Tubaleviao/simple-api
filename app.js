require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mid = require('./middleware')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const superagent = require('superagent')

const app = express()

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
  const valid = await superagent.get(req.body.url)
  const isValid = JSON.parse(valid.text).data.is_valid
  // create the jsonwebtoken and return to client
  res.json({isValid})
})

app.get('/songs', mid.auth, async (req, res) => {
  let dir = __dirname+'/public/users/'+req.user;
      
  if (!fs.existsSync(dir)) {
    res.status(404).send(`User ${req.me.username} has no songs stored in the server!`)
  }else{
    fs.readdir(dir, (err, files) => {
      if(err) res.send(`Error: ${err}`)
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
