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

// Package Requires
const path = require('path');
const express = require('express');
const exphbs = require('express-handlebars');
//const keys = require('./keys.json');
const MarkovChain = require('markovchain');
const fs = require('fs');
const FCM = require('fcm-node');
const bunyan = require('bunyan'); // a fast happy logging library for node

var bodyParser = require('body-parser')

// Global Variables
const app = express(); // the express application
// setup parsing for express
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

const log = bunyan.createLogger({
    name: 'ugly-fcm-node-server',
    serializers: {
        err: bunyan.stdSerializers.err,
    },
    level: process.env.LOG_LEVEL || bunyan.INFO,
}); // a global bunyan logger
//const serverkey = process.env.FCM_KEY || keys.server;


const testMarkovFile = './corpus/test.txt';
const testMarkov = new MarkovChain(fs.readFileSync(testMarkovFile, 'utf8'));

//Inputs 

const CLIENT_API_KEY = 'clientApiKey'
const SERVER_KEY = 'serverKey'
const ASSER_KEY = 'key_asser'
const CEZANNE_KEY = 'key_cezanne'
const JLIN_KEY = 'key_jlin'
const LYLA_KEY = 'key_lyla'
const NIKITA_KEY = 'key_nikita'
const RANDOM_KEY = 'key_random'
const TEST_KEY = 'key_test'

var courseDevelopersDict = {};

const courseDeveloperKeys = [ ASSER_KEY, CEZANNE_KEY, JLIN_KEY, LYLA_KEY, NIKITA_KEY ];


// Queue
const Q_SIZE = 1000;
const INITIAL_Q_SIZE = 20;

var inMemoryMessageQ = new Array();
inMemoryMessageQ.addMessage = function (message) {
	// Add the message and then removes old messages until it's down to the correct size
	if (this.unshift(message) > Q_SIZE) {
		while (this.length > Q_SIZE) this.pop();
	}
}
inMemoryMessageQ.generateMessage = function(courseDeveloper, time) {
	
	var cdObject =  courseDevelopersDict[courseDeveloper];
	
	log.info("course developer is ", cdObject)

	var author = "TheReal" + cdObject.name;
	var message = cdObject.markovChain.start(useUpperCase).end().process();

	// if the message length is greater than 140, reduce the length of the message to less than that
	if (message.length > 140) {
		message = message.slice(0,message.lastIndexOf(" ",140));
	}

	var messageObject = {
		author : author,
		message : message, 
		date : time,
		authorKey : cdObject.key
	};

	// Add message to the queue
	inMemoryMessageQ.addMessage(messageObject);
	return messageObject;
}

inMemoryMessageQ.addInitialVals = function() {
	for (var i = 0; i < INITIAL_Q_SIZE; i++) {
		// Random time from now till two days before now
		this.generateMessage(getRandomCD(), Date.now() - getRandomInt(0, 1000*60*60*48));
	}

	this.sort(function(a,b){
  		// Turn your strings into dates, and then subtract them
  		// to get a value that is either negative, positive, or zero.
  		return new Date(b.date) - new Date(a.date);
	});
}


// Classes
function CourseDeveloper(key) {
	this.key = key;
	var nameLower = (key.replace("key_", ""))
	var nameUpper = nameLower.charAt(0).toUpperCase() + nameLower.slice(1);
	if (key === JLIN_KEY) {
		nameUpper = "JLin";
	}

	this.name = nameUpper;
	var markovFile = './corpus/' + nameLower + '.txt';
	this.markovChain = 	new MarkovChain(fs.readFileSync(markovFile, 'utf8')); // a markhov chain of all words in the corpus file
}


// Global Functions

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomCD() {
	return courseDeveloperKeys[Math.floor(Math.random()*courseDeveloperKeys.length)];
}

const useUpperCase = function(wordList) {
  var tmpList = Object.keys(wordList).filter(function(word) {
    return word[0] >= 'A' && word[0] <= 'Z'
  });
  return tmpList[~~(Math.random()*tmpList.length)];
}


function setupCDObjects() {
	log.info("course dev keys is %o ", courseDeveloperKeys)
	log.info("length is " + courseDeveloperKeys.length)
	for (var i = 0; i < courseDeveloperKeys.length; i++) {
		var key = courseDeveloperKeys[i];
		log.info("on key " + key)
		courseDevelopersDict[key] = new CourseDeveloper(key);
	}

	// need to add a bunch of initial Q messages
	inMemoryMessageQ.addInitialVals();

	//log.info("Object setup run and finished with the following dict " + JSON.stringify(courseDevelopersDict));
}





const sendTestFCMMessage = function(clientToken, serverKey) {
	var testMessage = testMarkov.start(useUpperCase).end().process();

	const message = {
	    to: clientToken,
	    data: {  //you can send only notification or only data(or include both)
	        author: 'TestAccount',
	        message: testMessage,
	        date: Date.now(),
	        authorKey: TEST_KEY
	    }
	};

	//log.debug('creating an fcm connection using key %s', serverkey);
	const fcm = new FCM(serverKey); // the Firebase Cloud Messaging connection
	fcm.send(message, function(err, response){
		log.debug('Tried to send message: %s', message);
	    if (err) {
	        log.error({err:err}, 'Operation went boom: %s', err);
	    } else {
	        log.info({response:response}, 'Successfully sent with response: %s', response);
	    }
	});
	return message


}




const sendFCMMessage = function(courseDeveloper, serverKey) {

// check who the course developer is, if it's random, then send to the api key

	if (courseDeveloper === RANDOM_KEY) {
		//get a random course developer
		courseDeveloper = getRandomCD();
	}
	var sendTo = "/topics/" + courseDeveloper;

	var markovMessage = inMemoryMessageQ.generateMessage(courseDeveloper, Date.now())

	log.info("sendTo is " + sendTo)
	log.info("markovMessage is " + markovMessage)
	var shortMessage = markovMessage.message;
	if (shortMessage.length > 30) {
		shortMessage.slice(0,30) +  "&#8230;"
	}

	const message = {
	    to: sendTo,

	    data: {  //you can send only notification or only data(or include both)
	        author: markovMessage.author,
	        message: markovMessage.message,
	        date: markovMessage.date,
	        authorKey: markovMessage.authorKey
	    }
	};

	//log.debug('creating an fcm connection using key %s', serverkey);
	const fcm = new FCM(serverKey); // the Firebase Cloud Messaging connection
	fcm.send(message, function(err, response){
		log.debug('Tried to send message: %s', message);
	    if (err) {
	        log.error({err:err}, 'Operation went boom: %s', err);
	    } else {
	        log.info({response:response}, 'Successfully sent with response: %s', response);
	    }
	});
	return message
}



// CD object configuration
setupCDObjects();

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
    clientToken: CLIENT_API_KEY,
    serverKey: SERVER_KEY,
    asser_key: ASSER_KEY,
    cezanne_key: CEZANNE_KEY,
    jlin_key: JLIN_KEY,
    lyla_key: LYLA_KEY,
    nikita_key: NIKITA_KEY,
    random_key: RANDOM_KEY
  })
})

app.get('/messages', (req, res) => {
	res.json(inMemoryMessageQ)
});


app.post('/dm', function(req, res) {
  log.debug({req:req}, 'Request body was %s', req.body.serverKey);
  var message = sendTestFCMMessage(req.body.clientApiKey, req.body.serveryKey) // How can I set this to CLIENT_API_KEY's value instead of hardcoding?
  res.send(message);
});

app.post('/cd', function(req, res) {
  log.debug({req:req}, 'Request body was %s', req.body);
  var message = sendFCMMessage(req.body.groupCD, req.body.serverKey) // How can I set this to CLIENT_API_KEY's value instead of hardcoding?
  res.send(message);
});




const port = process.env.PORT || 3000;

app.listen(port, function(err) {
  console.log('logging at level ' + bunyan.nameFromLevel[log.level()]);
  if (log.level()  >= bunyan.DEBUG) {
    log.warn('At logging levels debug or higher, API keys will be logged.   You have been warned')
  }
  log.info('Server started on ' + port);
});
