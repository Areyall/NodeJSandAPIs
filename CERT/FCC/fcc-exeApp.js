const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const mySecret = process.env['MONGO_URI']
const bodyParser = require('body-parser')
require('dotenv').config()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

mongoose.connect(mySecret)
  .then(() => console.log('Connected!'));


app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const userSchema = new mongoose.Schema({
  username: String
})

const User = mongoose.model('User', userSchema)

const schemaDate = new Date().toString().slice(0,15)

const exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date:  {
    type: String,
    default: schemaDate
  }
})
const Exercise = mongoose.model('Exercise', exerciseSchema)

const logSchema = new mongoose.Schema({
 
    userid: String,
    description: String,
    duration: Number,
    date: { type: Date, default: Date.now },
  
})
const Log = mongoose.model('Log', logSchema)
const createUserHandler = async (req,res) => {
 const userName = new User({
   username: req.body.username
 })
  const data = await userName.save()
  res.send({
    username: data.username,
    _id: data._id
  })
}

const getAllUsersHandler = async (req,res) => {
    const data = await User.find({})
  res.send(data)
}

const createExercisesHandler = async (req,res) => {
    const findUserById = await User.findById(req.params._id)
   const logD = new Log({
    userid: req.params._id,
    description: req.body.description,
    duration: Number(req.body.duration),
    date: req.body.date
      ? new Date(req.body.date).toDateString()
      : new Date().toDateString()
    
    });
   await logD.save();
  
  if (!req.body.description || !req.body.duration || (!Date.parse(req.body.date) && req.body.length)) {
    return res.send({
      error: "Fields must be filled"
    });
  } else {
    
    const uExeDate = Date.parse(req.body.date) ? new Date(req.body.date).toDateString() : new Date().toDateString()
    
 const userExcercise = new Exercise({
  username: findUserById.username,
  description: req.body.description,
  duration: req.body.duration,
  date: uExeDate
 })
  
  const data = await userExcercise.save()
  
    res.send({
    _id: findUserById._id,
    username: findUserById.username,
    date: data.date,
    duration: data.duration,
    description: data.description,
    
  })}
}

const getAllUserExcercisesLogHandler = async (req, res) => {
  
  const user = await User.findById(req.params._id);
  const limit = Number(req.query.limit) || 0;
  const from = req.query.from || new Date(0);
  const to = req.query.to || new Date(Date.now())

  const logData = await Log.find()
    .where({userid: req.params._id})
    .where('date').gte(from).lte(to)
    .select("-_id -userid -__v").limit(limit).exec()
  
    const userLog = logData.map((prop) => {
      return {
        description: prop.description,
        duration: prop.duration,
        date: new Date(prop.date).toDateString(),
      };
    })
  console.log(userLog)  
  res.json({
    _id: req.params._id,
    username: user.username,
    count: logData.length,
    log: userLog,
  });
}

app.route('/api/users').post(createUserHandler)
app.route('/api/users').get(getAllUsersHandler)

app.route('/api/users/:_id/exercises').post(createExercisesHandler)
app.route('/api/users/:_id/logs').get(getAllUserExcercisesLogHandler)




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})