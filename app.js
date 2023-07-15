// global imports
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var cors = require("cors");
var dotenv = require("dotenv");
// imports for socket
const http = require("http");
const socketIO = require("socket.io");
let socket_app = express();
socket_app.use(cors());
let socket_server = http.createServer(app);
// load env variables
dotenv.config();
// parse env variables
process.env.enable_server = parseInt(process.env.enable_server);
process.env.enable_socket_server = parseInt(process.env.enable_socket_server);
// configure server for logging.
app.use(
    bodyParser.urlencoded({
        extended: false,
    }),
);
app.use(cors());
app.use(bodyParser.json());
app.set("view engine", "ejs");

// accept all requests
app.all("*", async (req, res, func) => {
    const regex = /[/]api[/]/g;
    console.log(`\x1b[35mWeb: Incoming request from ${req.ip} to ${req.url} \x1b[0m`);
    if (regex.test(req.url)) {
        try {
            // middleware
            console.log("\x1b[36mWeb: Loading middleware \x1b[0m");
            const middleware = require("./middleware");
            console.log("\x1b[36mWeb: Running middleware \x1b[0m \x1b[33m");
            req = await middleware(req);
            console.log("\x1b[36mWeb: Unloading middleware \x1b[0m");
            delete require.cache[require.resolve(`./middleware`)];
        } catch (err) {
            console.log("\x1b[36mWeb: Unloading middleware \x1b[0m");
            delete require.cache[require.resolve(`./middleware`)];
            console.log(`\x1b[31mWeb: Middleware error: ${err.message} \x1b[0m`);
            return res.status(500).json({
                status: 500,
                success: false,
                message: err.message,
            });
        }
        try {
            // check for api access
            if (!req.middleware.pass) {
                throw new Error("API endpoint unauthorized.");
            }
            // start executing script
            const pathIndex = req.url.indexOf("?");
            const path = req.url.slice(0, pathIndex === -1 ? req.url.length : pathIndex);
            console.log(`\x1b[36mWeb: Loading .${path} \x1b[0m`);
            var api = require(`.${path}`);
            try {
                console.log(`\x1b[36mWeb: Running .${path} \x1b[0m \x1b[33m`);
                const response = await api(req);
                console.log(`\x1b[36mWeb: Unloading .${path} \x1b[0m`);
                delete require.cache[require.resolve(`.${path}`)];
                // send response
                response.middleware = req.middleware;
                res.status(response.status).json(response);
            } catch (err) {
                console.log(`\x1b[36mWeb: Unloading .${path} \x1b[0m`);
                delete require.cache[require.resolve(`.${path}`)];
                console.log(`\x1b[31mWeb: Error: ${err.message} \x1b[0m`);
            }
        } catch (err) {
            console.log(`\x1b[31mWeb: Failed to load \x1b[4m${req.url}\x1b[0m\x1b[31m ! error: ${err.message} \x1b[0m `);
            return res.status(500).json({
                status: 500,
                success: false,
                message: err.message,
                middleware: req.middleware,
            });
        }
    } else {
        return res.status(404).json({
            status: 404,
            success: false,
            message: "Page not found ! ",
            middleware: req.middleware,
        });
    }
});

// run socket server
const socket_port = process.env.socket_server_port || 4000;
let io = socketIO(socket_server, {
    cors: {
        origin: `*`,
        methods: ["HEAD", "GET", "POST"],
    },
});
async function socket_serve() {
    // if all data is accessible the initialize socket server
    await io.on("connection", (socket) => {
        console.log(`\x1b[35mSocket: Connected: ${socket.id} ( ${socket.request.connection.remoteAddress} )\x1b[0m`);
        socket.on("run", async (req) => {
            try {
                // start executing script
                const path = `/socket/${req.path}`;
                console.log(`\x1b[36mSocket: Loading .${path} \x1b[0m`);
                var api = require(`.${path}`);
                try {
                    console.log(`\x1b[36mSocket: Running .${path} \x1b[0m \x1b[33m`);
                    const response = await api(req);
                    console.log(`\x1b[36mSocket: Unloading .${path} \x1b[0m`);
                    delete require.cache[require.resolve(`.${path}`)];
                    // send response
                    if (req.broadcast) {
                        return socket.broadcast.emit("log", response);
                    } else {
                        return socket.emit("log", response);
                    }
                } catch (err) {
                    console.log(`\x1b[36mSocket: Unloading .${path} \x1b[0m`);
                    delete require.cache[require.resolve(`.${path}`)];
                    console.log(`\x1b[31mSocket: Error: ${err.message} \x1b[0m`);
                }
            } catch (err) {
                console.log(`\x1b[31mSocket: Failed to load \x1b[4m${req.url}\x1b[0m\x1b[31m ! error: ${err.message} \x1b[0m `);
                return socket.emit("error", {
                    status: 500,
                    success: false,
                    message: err.message,
                });
            }
        });
        socket.on("disconnect", async () => {
            console.log(`\x1b[35mSocket: Disconnected : ${socket.id} ( ${socket.request.connection.remoteAddress} )\x1b[0m`);
        });
    });
    // start socket server
    console.log(`\x1b[32mSocket: Server running at port: ${socket_port}\x1b[0m`);
    socket_server.listen(socket_port);
}
if (process.env.enable_socket_server == 1) {
    socket_serve();
}

// run web server.
if (process.env.enable_server == 1) {
    const port = process.env.server_port || 3000;
    app.listen(port, (req, res) => {
        console.log(`\x1b[32mWeb: Server Running at port: ${port} \x1b[0m`);
    });
}

// to prevent server from crashing.
process.on("uncaughtException", (err) => {
    console.log(`\x1b[31mError: ${err.message} \x1b[0m`);
});
