var express = require('express');
var path = require('path');
var mongo = require('mongodb').MongoClient;
var app = express();

// Note: this URL may be unique to the Cloud9 IDE.
var dbURL = 'mongodb://' + process.env.IP + ':27017/data';

//-----------------------------------------------------------------------------
// Receive URL, check db; if URL already present, return alias; otherwise, 
// create new document/alias and return it.
app.get('/new/*', function(request, response) {
    
    // Connect to database.
    mongo.connect(dbURL, function(err, db) {
        if (err) {
            response.writeHead(400, { 'Content-Type' : 'text/plain' });
            response.end("Error: database connect");
        }
        response.writeHead(200, { 'Content-Type' : 'text/plain' });
        response.end("Connected to database");
    });
    
});


//-----------------------------------------------------------------------------
// Check to see if URL is an alias; if not found in db, display about page.
app.get('*', function(request, response) {
    //TODO: search for url in db
    response.sendFile(path.join(__dirname, '/about.html'));
});


app.listen(process.env.PORT, process.env.IP);
console.log("Listening on port " + process.env.PORT);
