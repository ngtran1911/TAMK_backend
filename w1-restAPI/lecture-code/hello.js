// This is a javascript file to be ran with node interpretor. Does not
// support html or ui:s by nature. So what do we have in pure node?
 
// We have a HTTP module in node by default for making backends. Let's do a simple one
// and run it
 
console.log("Let's implement a minimal backend with node and call it from a browser")
const http = require("node:http")
 
// Let's create (define) a server by using http module (no express at this point)
const server = http.createServer((req, res) =>{
  console.log(req.method, req.url);
 
  // Let's serve the movies path
  if( req.method === "GET" && req.url === "/movies"){
    // just return local movie data
    const movies = [
        { id: 24, name: "Inception", year: 2010},
        { id: 2, name: "Forrest Gump", year: 1994},
    ];
    res.writeHead(200, {
        "Content-Type": "application/json; charset=utf=8",
    });
    return res.end(JSON.stringify(movies))
  }
  // lets respond to the client by sending OK (200) and some text
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
  });
  res.end("Hello from the Back-End")
});
 
// Start the server
server.listen(3000, () => {
    console.log("Server listening at http://localhost:3000")
});
 
 
 
// Testing of Backend
// 1. Front-end app (in the end)
// 2. Rest Client VS Extension
// 3. Postman
 