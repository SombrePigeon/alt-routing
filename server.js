const http = require("http");
const fs = require('fs');

const host = 'web';
const port = 80;

const template = 
"<!DOCTYPE html>"+
"<html lang=\"fr\" is=\"alt-app\">"+
"  <head>"+
"    <meta charset=\"utf-8\">"+
"    <title>Services</title>"+
"    <link rel=\"stylesheet\" href=\"css/style.css\">"+
"  </head>"+
"  <body is=\"alt-router\">"+
"  </body>"+
"  <script type=\"importmap\">"+
"    {"+
"      \"imports\":"+
"        {"+
"          \"/\": \"/js/modules/\","+
"          \"app\": \"/js/modules/app.js\","+
"          \"dev\": \"/js/modules/dev.js\""+
"        }"+
"    }"+
"  </script>"+
"  <script type=\"module\" src=\"/js/main.js\"></script>"+
"</html>";

const requestListener = function (req, res) {
    let body = template;
    let log = "load app"
    let contentType = "text/html"
    console.log("\nurl: " + req.url);
    if(req.url.startsWith("/js/"))
    {
        contentType = "text/javascript";
        log = "load file : " + req.url;
        body =  fs.readFileSync("html" + req.url, 'utf8');
    }
    else if(req.url.startsWith("/css/")
    )
    {
        contentType = "text/css";
        log = "load file : " + req.url;
        body =  fs.readFileSync("html" + req.url, 'utf8');
    }
    else if(req.headers["alt-component"] == true)
    {
        contentType = "text/html";
        log = "load file : " + req.url;
        body =  fs.readFileSync("html" + req.url, 'utf8');
    }
    console.log(log);
    console.log(body);
    res.writeHead(200, {"Content-Type": `${contentType}`});
    res.end(body);
};

const server = http.createServer(requestListener);
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});