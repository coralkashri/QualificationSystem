// Import dependencies
const express = require('express'),
path = require('path'),
PORT = process.env.PORT || 5000,
body_parser = require('body-parser'),
session = require('client-sessions'),
db = require('./helpers/db_controllers/services/db'),
router = require("./routers/router"),
con_validator = require('./middlewares/validate_connection');

// Setup server
let app = express()

    .use(express.static(path.join(__dirname, 'public')))

    .use('/scripts', express.static(__dirname + '/node_modules/mark.js/dist/'))

    .use(session({
        cookieName: 'session',
        secret: 'asn916ikl;4j32fsda8a4asdfet1d42hjk3@#$#^^%wefrwefwoj5qjhlw112346h!@#$^io5u1ikl5$cbv6effjf\'eer346\'5yttr%^&Y4@asdf##$@34234',
        duration: 30 * 60 * 1000,
        activeDuration: 5 * 60 * 1000,
        httpOnly: true,
        secure: true,
        ephemeral: true
    }))

    .use(body_parser.urlencoded({ extended: false }))

    .use(body_parser.json())

    .set('views', path.join(__dirname, 'views'))

    .set('view engine', 'ejs');

// Setup routes
app
    .use(con_validator.test_session_connection)

    .use("/", router);

// Initialize application
db.initDB(() => {
    app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
});

// Setup errors
//The 404 Route
app.get('/*', function(req, res){
    res.render("errors/404")
});
