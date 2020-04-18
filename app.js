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

    .use('/uploads_dir', express.static(__dirname + '/helpers/db_controllers/uploads'))

    .use('/viewer', express.static(__dirname + '/node_modules/node-viewerjs/release'))

    .use(session({
        cookieName: 'session',
        secret: 'as#*&*(asf4334@21#$@#1\t2ikl;4j\'32fsda8a4asd\5fet1d42hjk3@#$#\P^\"^%wefrwe19a3f2sED75*^&*5qj$!@#$!#12\+34#\'$!@joUILvxcxcuXds1ik\\laD5$cbv6ef\\\\\fjDASrA87\"345\'yttr%@asdf##$@34234',
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
