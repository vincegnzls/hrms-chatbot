var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
/*var trigger = require('./basetrigger');*/
var app = express();
//Connection for chatbot conversation using API.AI ***INSERT APIAI DASHBOARD URL HERE***
var apiai = require('apiai');
//API.AI Client Access Token
var app2 = apiai("f725e735395240e5a209e7a034ba22c1");
var globalSenderId;
//notifier - indicator used to know whether employees have already been notified
var notified = false;
var register = false;
var intent = "";
//FB Page Access Token
var token = "EAAaA4LJeypQBABay9GkjkbF02ri0qx218cby6M3q6ZBGri2qzm9J1XZBIVgxFcRvBpoZCinySRcptTrACfJEki0e9XXMqDMr83Hc5ZBkAX3LNW1p4yPGpiAeyeoZCVCqVK2LyOOCZA53zpV8WXrQZB7mV0gC7PfNyrNRw6sCIikNAZDZD";
var https = require('https');
var http = require('http');
var fs = require('fs');

// Function that ticks every 1 second.
console.log("Start Timer");
var myVar = setInterval(function () {
    myTimer()
}, 1000);
var ctr = 0;

/* Function being called every second.
 * Calls HRMS method and asks for the list of people to be notified.
 */
function myTimer() {
    var d = new Date();
    if (d.getHours() == 16 && !notified) {
        notified = true;
        console.log("IT'S 4 PM!     " );
    };
}

app.set('port', (process.env.PORT || 443))
app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(bodyParser.json())

app.get('/', function (req, res) {
    res.send('Facebook Bot for HRMS')
}).listen(80);

app.get('/webhook', function (req, res) {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === 'webhooktoken') {
        console.log("Validating webhook");
        res.status(200).send(req.query['hub.challenge']);
    } else {
        console.error("Failed validation. Make sure the validation tokens match.");
        res.sendStatus(403);
    }
});

//Function that connects the FB Chatbot to NodeJS
app.post('/webhook', function (req, res) {
    var data = req.body;
    if (data.object == 'page') {
        data.entry.forEach(function (pageEntry) {
            var pageID = pageEntry.id;
            var timeOfEvent = pageEntry.time;
            pageEntry.messaging.forEach(function (event) {
                if (event.message && event.message.text) {
                    receivedMessage(event);
                }
            });
        });
        res.sendStatus(200);
    }
});

app.get('/notifyusers', function (req, res) {

    // res.send('Notify Users');
    console.log("Notify GET");
    res.sendStatus(200);
});

app.post('/notifyusers', function (req, res) {

    res.send('Notify Users');
    console.log("app post notify");
    res.sendStatus(200);
});

var request = http.get("http://192.168.30.210:8080/opentides/chatbot-leave/get", function(res){
    res.on('data', function (chunk) {
        console.log(chunk.toString('utf8'));

      request({
          url: 'http://23.97.59.113/hrms/chatbot-user/register',
          method: 'POST',
          json: "test message"

      }, function (error, response, body) {
          if (!error && response.statusCode == 200) {
              console.log("error");
          } else {
              console.log("error2");
          }
      });
   });
});


var traverseList = function (list) {
    trigger.start("TRAVERSE LIST");
    //for (var key in list)
    {
        console.log(list[0]);
        trigger.end("for loop");
    }

    for(var i = 0; i < list.length; i++)
    {
        console.log(list[i]);
    }
    trigger.end("TRAVERSE LIST");
}

function receivedMessage(event) {
    var senderID = event.sender.id;
    globalSenderId = senderID;
    var recipientID = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message.text;

    var request = app2.textRequest("hi", {
        sessionId: '<unique session id>'
    });

    request.on('response', function (response) {
        var token = response.result.parameters.token;
        console.log("INTENT NAME: " + response.result.metadata.intentName);

        if (response.result.metadata.intentName === "file_leave" && response.result.parameters.hours !== "") {
            isRegistered(senderID, response);
        }
    });

    request.on('error', function (error) {});
    request.end();
    var messageText = "Echo: " + event.message.text;

    var messageData = {
        recipient: {
            id: senderID
        },
        message: {
            text: messageText
        }
    };
    callSendAPI(messageData);
}
/*
 * Call the Send API. The message data goes in the body. If successful, we'll
 * get the message id in a response
 *
 */
function callSendAPI(messageData) {
    request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: token
        },
        method: 'POST',
        json: messageData

    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var recipientId = body.recipient_id;
            var messageId = body.message_id;
            console.log("Successfully sent generic message with id %s to recipient %s", messageId, recipientId);
            console.log("Successfully sent generic message: %s", messageData.message.text);
        } else {
            console.error("Unable to send message.");
            console.error(response);
            console.error(error);
        }
    });
}

/*
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'));
    console.log("The app is now up and running.");
})*/


/*var Client = require('node-rest-client').Client;

var client = new Client();


var args = {
    headers: { "Content-Type": "application/x-www-form-urlencoded" } // request headers
};

client.get("http://192.168.30.210:8082/services/character/test", function (data, response) {
    // parsed response body as js object
    console.log(data);
});

client.registerMethod("jsonMethod", "http://192.168.30.210:8082/services/character/test", "GET");
client.methods.jsonMethod(args, function (data, response) {
    // parsed response body as js object
    console.log(data);
    console.log(response);
});*/
/*
xhr = new XMLHttpRequest();
var url = "http://192.168.30.210:8082/services/character/test";

xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function() {
    console.log(this);
    console.log(this.getAllResponseHeaders);
    if (this.readyState === 4) {
        console.log("Ready State 4");
        console.log(this.responseText);
    }
    console.log("ReadyState checking done");
});

xhr.open("GET", url, true);
xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

xhr.send();*/
/*
http.get({
        host: 'http://192.168.30.210:8082',
        path: '/services/character/test'
    }, function(response) {
        // Continuously update stream with data
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {

            // Data reception is done, do whatever with it!
            /*var parsed = JSON.parse(body);
            callback({
                email: parsed.email,
                password: parsed.pass
            });

            console.log(body);
        });
    });*/
