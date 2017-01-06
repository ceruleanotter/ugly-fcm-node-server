// index.js

/* Log Configuration
Logging is configured at INFO level by default
To increase the log level start the server with:
  LOG_LEVEL=DEBUG npm start
or export a value
  export LOG_LEVEL=DEBUG
  npm start
*/

/* Optional Environment Variables

You can add any of the following environment variables to startup or export TheRealFCMBot

LOG_LEVEL Can be set to any value in [TRACE, DEBUG, INFO, WARN, ERROR, FATAL] the application currently logs on the debug, info, error channels (warning api keys are logged at debug level)
FCM_KEY Setting this env variable allows you to set the FCM Server Key, overriding what is in keys.server
PORT Setting the port variable will start the server on a port other than 3000, useful for deployment to places like Heroku

A full launch with all options set might look like:
LOG_LEVEL=INFO FCK_KEY=12345 PORT=8080 npm start
*/

// Packge Requires
const path = require('path');
const express = require('express');
const exphbs = require('express-handlebars');
const keys = require('keys.js');
const MarkovChain = require('markovchain');
const fs = require('fs');
const FCM = require('fcm-node');
const bunyan = require('bunyan'); // a fast happy logging library for node

// Global Variables
const app = express(); // the express application
const log = bunyan.createLogger({
    name: 'ugly-fcm-node-server',
    serializers: {
        err: bunyan.stdSerializers.err,
    },
    level: process.env.LOG_LEVEL || bunyan.INFO,
}); // a global bunyan logger
const serverkey = process.env.FCM_KEY || keys.server;
const quotes = new MarkovChain(fs.readFileSync('./corpus/test.txt', 'utf8')); // a markhov chain of all words in the corpus file

// Global Functions
const useUpperCase = function(wordList) {
  var tmpList = Object.keys(wordList).filter(function(word) {
    return word[0] >= 'A' && word[0] <= 'Z'
  });
  return tmpList[~~(Math.random()*tmpList.length)];
}

const sendFCMMessage = function() {

	const message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
	    to: keys.client,
	    collapse_key: keys.client,


	    notification: {
	        title: 'Lyla\'s Message',
	        body: 'New message arrived'
	    },

	    data: {  //you can send only notification or only data(or include both)
	        author: 'TheRealFCMBot',
	        message: quotes.start(useUpperCase).end().process(),
	        date: Date.now()
	    }
	};

  log.debug('creating an fcm connection using key %s', serverkey);
  const fcm = new FCM(keys.server); // the Firebase Cloud Messaging connection
	fcm.send(message, function(err, response){
		log.debug('Tried to send message: %s', message);
	    if (err) {
	        log.error({err:err}, 'Operation went boom: %s', err);
	    } else {
	        log.info({response:response}, 'Successfully sent with response: %s', response);
	    }
	});
}

// ExpressJS Configuration
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
  log.debug({req:req}, 'Request body was %s', req.body);
  sendFCMMessage();
  res.send(200);
});

const port = process.env.PORT || 3000;

app.listen(port, function(err) {
  console.log('logging at level ' + bunyan.nameFromLevel[log.level()]);
  if (log.level()  >= bunyan.DEBUG) {
    log.warn('At logging levels debug or higher, API keys will be logged.   You have been warned')
  }
  log.info('Server started on ' + port);
});
