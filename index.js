// index.js
const path = require('path')  
const express = require('express')  
const exphbs = require('express-handlebars')
var serverkey = require('server-key.js');
//var fcmMessage = new FCMCode();


var FCM = require('fcm-node');


function sendFCMMessage() {

	console.log(serverkey.serverkey);
	var fcm = new FCM(serverkey.key);

	var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
	    to: 'ccDNmEbbF4k:APA91bEB7H4zwTXrkhHdOWYqxKjJ9aQHu0kIl-RL597y0g7iH77UCMSm05RQ1Llk5Qng0tdnarnwRcDGYXeHj6B5tgOvakU7H_DHt0zVsHXKP-9D-2iuZAOACpjSkL3mRAib8a-FCu2h', 
	    collapse_key: 'ccDNmEbbF4k:APA91bEB7H4zwTXrkhHdOWYqxKjJ9aQHu0kIl-RL597y0g7iH77UCMSm05RQ1Llk5Qng0tdnarnwRcDGYXeHj6B5tgOvakU7H_DHt0zVsHXKP-9D-2iuZAOACpjSkL3mRAib8a-FCu2h',
	    

	    notification: {
	        title: 'Lyla\'s Message', 
	        body: 'Still working' 
	    },
	    
	    data: {  //you can send only notification or only data(or include both)
	        my_key: 'my value',
	        my_another_key: 'my another value'
	    }
	};

	fcm.send(message, function(err, response){
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




