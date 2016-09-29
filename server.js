var express = require('express');
var path = require('path');
var fs = require('fs');
var mongo = require('mongodb').MongoClient;
var app = express();

/*For heroku deployment:*/
var appURL = 'https://shorturl-djmot.herokuapp.com';

/*For cloud9 development:
var appURL = 'https://project-djmot.c9users.io';
*/

var dbURL = 'mongodb://djmot:' + process.env.MONGODB_PASSWORD + '@ds021356.mlab.com:21356/data';

//----------------------------------------------------------------------------
// Helper functions.
//
function verifyURL(URL) {
    // Just check that URL begins with 'http://' or 'https://'.
    if (URL.length < 8) {return false;}
    if (    URL.substring(0, 7) === 'http://'
        ||  URL.substring(0, 8) === 'https://' ) 
        {return true;}
    return false;
}

//-----------------------------------------------------------------------------
// Connect to database and access 'urls' collection.
// 
mongo.connect(dbURL, function(err, db) {
if (err) {
    return console.log("Error: database connect");
}
console.log("Connected to database");

db.createCollection('urls', function(err, collection) {
if (err) {
    return console.log("Error: access 'urls' collection");
}
console.log("Accessed 'urls' collection");

//-----------------------------------------------------------------------------
// Receive URL, check db; if URL already present, return alias; otherwise, 
// create new document/alias and return it.
// Document format:
// { "old_url" : <url>, "new_url" : <alias>, "ending": <ending> }
//
app.get('/new/*', function(request, response) {
        
    // Extract user URL.
    var userURL = request.url.slice(5);
    
    // Verify user URL format.
    if (!verifyURL(userURL)) {
        response.writeHead(200, { 'Content-Type' : 'text/plain' });
        response.end("Invalid URL: " + userURL);
        return console.log("Invalid URL: " + userURL);
    }
    
    // Search db for given URL.
    console.log("Searching: " + userURL);
    collection.find(
        { "old_url" : { $eq : userURL } },
        { _id : 0, "ending" : 0 },
        { limit : 1 }
    ).toArray(function(err, documents) {
        if (err) {
            response.writeHead(400, { 'Content-Type' : 'text/plain' });
            response.end("Error: find error");
            return console.log("Error: find error");
        }
        
        // If document found, send it.
        if (documents.length > 0) {
            response.writeHead(200, { 'Content-Type' : 'application/json' });
            response.end(JSON.stringify(documents[0]));
            return console.log("Found and returned document");
        }
            
        // Otherwise create new alias, attempt to insert, and send to user
        // if all goes well.
        fs.readFile("number.txt", 'utf8', function(err, data) {
            if (err) {
                response.writeHead(400, { 'Content-Type' : 'text/plain' });
                response.end("Error: readFile error");
                return console.log("Error: readFile error");
            }
            var num = parseInt(data);
            num++;
            try {
                fs.writeFileSync("number.txt", num.toString());
            } catch (err) {
                response.writeHead(400, { 'Content-Type' : 'text/plain' });
                response.end("Error: writeFileSync error");
                return console.log("Error: writeFileSync error");
            }
            collection.insert({
                "old_url" : userURL,
                "new_url" : appURL + "/" + num.toString(),
                "ending" : num.toString()
            }, function(err, result) {
                if (err) {
                    response.writeHead(400, { 'Content-Type' : 'text/plain' });
                    response.end("Error: insert error");
                    return console.log("Error: insert error");
                }
                response.writeHead(200, { 'Content-Type' : 'application/json' });
                response.end(JSON.stringify({
                    "old_url" : userURL,
                    "new_url" : appURL + "/" + num.toString()
                }));
                return console.log("Inserted new alias with ending: " + num.toString());
            });
        });
    });
}
);


//-----------------------------------------------------------------------------
// Check to see if URL is an alias; if not found in db, display about page.
app.get('*', function(request, response) {
    
    // Extract user URL, remove the ending '/'.
    var userEnding = request.url.slice(1);
    
    // Search for this ending.
    console.log("Searching: " + userEnding);
    collection.find(
        { "ending" : { $eq : userEnding } },
        { _id : 0 },
        { limit : 1 }
    ).toArray(function(err, documents) {
        if (err) {
            response.writeHead(400, { 'Content-Type' : 'text/plain' });
            response.end("Error: find error");
            return console.log("Error: find error");
        }
        
        // If ending found, then redirect user to the old_url.
        if (documents.length > 0) {
            response.writeHead(301, { 'Location' : documents[0]["old_url"] });
            response.end();
            return console.log("Found alias and redirected");
        }
        
        // Otherwise display about page.
        response.sendFile(path.join(__dirname, '/about.html'));
    });
});


}); // end of createCollection() call.
}); // end of connect() call.

app.listen(process.env.PORT, process.env.IP);
console.log("Listening on port " + process.env.PORT);
