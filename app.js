const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the 'frontEnd' folder
app.use(express.static(path.join(__dirname, '../frontEnd')));


const pool = mysql.createPool({
    host: 'localhost',
    user: 'umer',
    password: 'umer1235',
    database: 'eliteDrains',
});

app.post('/api/submit', async (req, res) => {
    const { name, email, phone, age, rate, password, city } = req.body;

    // Validate data (add your own validation logic here)

    // Check if the email is already registered
    const checkEmailQuery = 'SELECT COUNT(*) AS count FROM plumbers WHERE email = ?';
    const checkEmailValues = [email];

    pool.query(checkEmailQuery, checkEmailValues, async (checkError, checkResults) => {
        if (checkError) {
            console.error('Error checking email:', checkError);
            return res.status(500).json({ error: 'Error checking email in the database' });
        }

        const emailAlreadyExists = checkResults[0].count > 0;

        if (emailAlreadyExists) {
            // Email is already registered, send a response with an alert
            return res.status(400).json({ error: 'Email is already registered' });
        }

        // Hash the password using bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);

        // If email is not already registered, proceed with the insert
        const insertQuery = 'INSERT INTO plumbers (name, email, phone, age, rate, password, city) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const insertValues = [name, email, phone, age, rate, hashedPassword, city];

        pool.query(insertQuery, insertValues, (error, results) => {
            if (error) {
                console.error('Error inserting data:', error);
                return res.status(500).json({ error: 'Error inserting data into the database' });
            }

            // Data inserted successfully
            res.json({ message: 'Data inserted successfully!' });
        });
    });
});
//logIn
app.post('/api/signin', (req, res) => {
    const { email, password } = req.body;

    // Validate data (add your own validation logic here)

    // Check if the email exists in the database
    const checkEmailQuery = 'SELECT * FROM plumbers WHERE email = ?';
    const checkEmailValues = [email];

    pool.query(checkEmailQuery, checkEmailValues, async (checkError, checkResults) => {
        if (checkError) {
            console.error('Error checking email:', checkError);
            return res.status(500).json({ error: 'Error checking email in the database' });
        }

        if (checkResults.length === 0) {
            // Email does not exist, send a response with an alert
            return res.status(400).json({ error: 'Email not registered' });
        }

        const user = checkResults[0];

        // Compare the provided password with the hashed password in the database
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            // Password does not match, send a response with an alert
            return res.status(401).json({ error: 'Incorrect password' });
        }
        console.log("Hi", email);
        // Password is correct, user is authenticated
        res.json({ message: 'Sign-in successful!', user: { name: user.name, email: user.email } });
        // // res.sendFile(path.join(__dirname, '../frontEnd/pages/search.html'));
        // res.sendFile(path.join(__dirname, '../frontEnd/search.html'));
        // console.log(../frontEnd/pages / search.html)
    });
});
//searching
app.get('/api/plumbers', (req, res) => {
    // Select all plumbers from the database
    const getAllPlumbersQuery = 'SELECT * FROM plumbers';

    pool.query(getAllPlumbersQuery, (error, results) => {
        if (error) {
            console.error('Error fetching plumbers:', error);
            return res.status(500).json({ error: 'Error fetching plumbers from the database' });
        }

        // Return the plumber data in the response
        res.json(results);
    });
});

// Use 'express-session' middleware
// app.use(session({
//     secret: '7128',  // Replace with a secure, randomly generated key
//     resave: false,
//     saveUninitialized: true
// }));


app.get('/api/userData', (req, res) => {
    const userEmail = req.query.email;

    if (!userEmail) {
        return res.status(400).json({ error: 'Email is required' });
    }

    pool.query('SELECT name, email, phone, age, rate FROM plumbers WHERE email = ?', [userEmail], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        console.log('Fetched data:', results);

        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(results[0]);
    });
});
app.delete('/api/deletePlumber', (req, res) => {
    const userEmail = req.query.email;

    if (!userEmail) {
        return res.status(400).json({ error: 'Email is required' });
    }

    pool.query('DELETE FROM plumbers WHERE email = ?', [userEmail], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'Plumber deleted successfully' });
    });
});

app.put('/api/updatePlumber', (req, res) => {
    const { name, phone, age, rate } = req.body;
    const userEmail = req.query.email;

    if (!userEmail) {
        return res.status(400).json({ error: 'Email is required' });
    }

    if (!name || !phone || !age || !rate) {
        return res.status(400).json({ error: 'All fields are required for update' });
    }

    pool.query(
        'UPDATE plumbers SET name=?, rate=?, age=?, phone=? WHERE email = ?',
        [name, rate, age, phone, userEmail], // Added city and userEmail to parameters
        (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ message: 'Changes are Updated Successfully' });

        }
    );
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

