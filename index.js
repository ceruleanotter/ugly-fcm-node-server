// index.js
const path = require('path')  
const express = require('express')  
const exphbs = require('express-handlebars')
var keys = require('keys.js');

var MarkovChain = require('markovchain')
  , fs = require('fs')
  , quotes = new MarkovChain(fs.readFileSync('./corpus/test.txt', 'utf8'))
  
var useUpperCase = function(wordList) {
  var tmpList = Object.keys(wordList).filter(function(word) {
    return word[0] >= 'A' && word[0] <= 'Z'
  })
  return tmpList[~~(Math.random()*tmpList.length)]
}
 


var FCM = require('fcm-node');


function sendFCMMessage() {

	console.log(keys.server);
	var fcm = new FCM(keys.server);
	var markovMessage = quotes.start(useUpperCase).end().process()

	var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
	    to: keys.client, 
	    collapse_key: keys.client,
	    

	    notification: {
	        title: 'Lyla\'s Message', 
	        body: 'New message arrived' 
	    },
	    
	    data: {  //you can send only notification or only data(or include both)
	        author: 'TheRealFCMBot',
	        message: markovMessage,
	        date: Date.now()
	    }
	};

	fcm.send(message, function(err, response){
		console.log("Tried to send message: ", message);
	    if (err) {
	        console.log("Something has gone wrong!");
	    } else {
	        console.log("Successfully sent with response: ", response);
	    }
	});
} 

const app = express()

app.engine('.hbs', exphbs({  
  defaultLayout: 'main',
  extname: '.hbs',
  layoutsDir: path.join(__dirname, 'views/layouts')
}))
app.set('view engine', '.hbs')  
app.set('views', path.join(__dirname, 'views')) 

app.get('/', (request, response) => {  
  response.render('home', {
    name: 'Lyla'
  })
})

app.post('/', function(req, res) {
  console.log(req.body);
  //console.log(fcmMessage);
  sendFCMMessage();

  res.send(200);

});

app.listen(3000)  




