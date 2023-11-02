// root server.js 
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const routes = require('./routes');
const dashBoardRoutes =require('./routes/dashboard-routes')
const postRoutes = require('./routes/post-routes')
const sequelize = require('./config/connection');
const path = require('path');
const methodOverride = require('method-override')
const hbs = exphbs.create({
    helpers: {
        isAuthor: function(postUserId, sessionUserId) {
                return postUserId === sessionUserId
            }
        }
});


const mysql = require('mysql2');
const url = require('url');

let dbConfig;

// Check if JAWSDB_URL is available (indicating we're on Heroku with JAWSDB)
if (process.env.JAWSDB_URL) {
    const jawsdb = url.parse(process.env.JAWSDB_URL);
    const auth = jawsdb.auth.split(':');

    dbConfig = {
        host: jawsdb.hostname,
        user: auth[0],
        password: auth[1],
        database: jawsdb.pathname.substr(1),
        port: jawsdb.port
    };
} else {
    // Local database configuration
    dbConfig = {
        host: 'localhost',
        user: 'root',
        database: 'tb_db',
        password: 'fred1231'
    };
}

// Create a connection pool
const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database');
    
    // Release the connection back to the pool
    connection.release();
});

// Ensure connections close gracefully
process.on('exit', () => {
    pool.end(() => {
        console.log('Closed all database connections');
    });
});

// To use the connection in your app:
// pool.query('YOUR SQL QUERY HERE', (err, results) => {
//     // Handle results here
// });

// const mysql = require('mysql2')
// const connection = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     database: 'tb_db',
//     password: 'fred1231'
// });

// connection.connect();

// process.on('exit', () => {
//     connection.end();
//   });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars')
app.set('views', path.join(__dirname, 'views'));

app.use(methodOverride('_method'));

app.use(bodyParser.urlencoded({ extended: true }));

app.use('/views', express.static('views'));

app.use('/styles', express.static('views/styles'))

app.use(session({
    secret: 'super secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 7200000
    }
}));

app.use((req, res, next) => {
    try {
    console.log(`[DEBUG] ${req.method} ${req.url}`);
    } catch (err) {
        console.error('An error occured:', err)
    }
    next();
});

app.post('/edit/:id', (req, res) => {
    const postId = req.params.id;
    const { title, content } = req.body;

    const query = 'UPDATE post SET title = ?, content = ? WHERE id = ?';
    connection.query(query, [title, content, postId], (error, results) => {
        if (error) {
            console.error('Error updating post:', error);
            res.status(500).send('Error updating post');
        } else {
            res.redirect('/posts/' + postId);
        }
    });
});



app.use(routes);
app.use('/', dashBoardRoutes)
app.use('/posts', postRoutes);

app.get('/', (req, res) => {
    res.render('base')
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.get('/signup', (req, res) => {
    res.render('signup')
})

app.get('/dashboard', (req, res) => {
    res.render('dashboard')
})

app.get('/posts/create', (req, res) => {
    res.render('create-post')
})

app.get('/posts/latest', (req, res) => {
    res.render('view-posts')
})


sequelize.sync({ force: false }).then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});