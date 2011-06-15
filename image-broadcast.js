/*********************
*
*   Image broadcast
*   @author: Philip Hayton, @gotbadger
*   @description: image chat esque program more of a concept peice has no real error checking
*   @requires now,multipart
***********************/
var http = require("http");
var url = require("url");
var multipart = require("../lib/multipart");
var sys = require("sys");
var fs = require('fs');
var indexhtml;

//load in the index page that the client will use
fs.readFile('./index.html', function (err, data) {
    if (err) {
        throw err; 
    }
    indexhtml = data;
});

var server = http.createServer(function(req, res) {
    //console.log(res);
    // Simple path-based request dispatcher
    switch (url.parse(req.url).pathname) {
        case '/':
            display_form(req, res);
            break;
        case '/put':
            upload_file(req, res);
            break;
        default:
            show_404(req, res);
            break;
    }
});
//setup now js
var everyone = require('now').initialize(server);

// Server would listen on port 8000
server.listen(8000);


/*
 Stuff that happens when users conect and disconnect from now
*/
everyone.on('connect', function(){
    everyone.now.updateUsers(everyone.count);
});
everyone.on('disconnect', function(){
    everyone.now.updateUsers(everyone.count);
});

/*
 * Display main page
 */
function display_form(req, res) {
    res.writeHead(200, {"Content-Type": "text/html"});
    res.end(indexhtml);
}

/*
 * Create multipart parser to parse given request
 */
function parse_multipart(req) {
    var parser = multipart.parser();

    // Make parser use parsed request headers
    parser.headers = req.headers;

    // Add listeners to request, transfering data to parser

    req.addListener("data", function(chunk) {
        parser.write(chunk);
    });

    req.addListener("end", function() {
        parser.close();
    });

    return parser;
}

/*
 * Handle file upload
 */
function upload_file(req, res) {
    // Request body is binary
    req.setEncoding("binary");

    // Handle request as multipart
    var stream = parse_multipart(req);

    var type = null;
    var prefix = null;
    var body = "";
    //console.log(stream.headers);
    // Set handler for a request part received
    stream.onPartBegin = function(part) {
        sys.debug("Started part, name = " + part.name + ", filename = " + part.filename);
        type = stream.headers["content-type"],
        prefix = "data:" + type + ";base64,",
        body = ""
    };

    // Set handler for a request part body chunk received
    stream.onData = function(chunk) {
        // Pause receiving request data (until current chunk is written)
        req.pause();
        //add chunk to body should we be using buf?
        body += chunk;
        req.resume();
    };

    // Set handler for request completed
    stream.onEnd = function() {
        //encode to base64
        var base64 = new Buffer(body, 'binary').toString('base64');
        //add the header data
        var data = prefix + base64;
        

        upload_complete(res,data);
    };
}

function upload_complete(res,data) {
    // Render response
    res.writeHead(200, {"Content-Type": "text/html"});
    everyone.now.pushimage(data);
    res.end("ok");
    sys.puts("Uploaded");
}

/*
 * Handles page not found error
 */
function show_404(req, res) {
    res.writeHead(404, {"Content-Type": "text/html"});
    res.end("<h1>Problem?</h1>");
}