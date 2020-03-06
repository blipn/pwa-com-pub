const path = require('path')
const express = require('express')
const qrcode = require('qrcode-terminal')
const ngrok = require('ngrok')
const port = process.env.PORT || 3000
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const htmlPath = path.join(__dirname, 'public')
const hashtags = {}

app.use('/', express.static(htmlPath));

(async function() {
  const url = await ngrok.connect(port);
  console.log(`Forwarding http://localhost:${port}/ on ${url}`)
  qrcode.generate(url, { small: true }, (qrcode) => {
    console.log(qrcode)
  })
})()

// msg: {
//   hashTag: String,
//   from: String,
//   message: String
// }
io.on('connection', (socket) => {

  function addHashtag(msg) {
    hashtags[msg.hashTag] = []
    io.emit('hashtags', Object.keys(hashtags))
    console.log(`${msg.hashTag} added in hashtags : ${JSON.stringify(hashtags)}`)
  }

  io.emit('hashtags', Object.keys(hashtags))

  socket.on('getMessages', (hashTag) => {
    if(hashtags[hashTag]) {
      socket.emit('getMessages', hashtags[hashTag]) 
    }
  })

  socket.on('message', (msg) => {
    data = { 
      hashTag: msg.hashTag,
      from: socket.request.connection.remoteAddress,
      message: msg.message,
      timeStamp: new Date()
    }
    console.log(data)
    
    if(hashtags[msg.hashTag]) {
      // Hashtag deja existant
    } else {
      // Ajout du hashtag
      addHashtag(msg)
    }
    // Stockage du message
    hashtags[msg.hashTag].push(data)
    console.log(hashtags)

    // Envoi du message
    io.emit(msg.hashTag, data)
  })
})

http.listen(port, function(){
  console.log('listening on *:' + port)
})
