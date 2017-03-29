var express = require('express')
var path = require('path')
var opn = require('opn')

// default port where dev server listens for incoming traffic
var port = process.env.PORT || '9002'
var app = express()
var staticPath = '/dist'

app.use(express.static(path.join(__dirname +staticPath)))

app.get('*', function (req, res) {
  res.redirect('/')
})

module.exports = app.listen(port, function (err) {
  if (err) {
    console.log(err)
    return
  }
  var uri = 'http://localhost:' +port
  console.log('Listening at ' +uri +'\n')
  opn(uri)
})
