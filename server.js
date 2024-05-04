const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const path = require('path');
const cookieParser = require('cookie-parser');
const uuid = require("uuid").v4;
const { isValidJSON } = require('./utils');


const app = express();
const PORT = process.env.PORT || 5000;

const JWT_SECRET = 'my_secret_jwt_test_123';

app.use(bodyParser.json());
app.use(cookieParser());

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    const tokenAge = 60; // In minutes

    const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json')));

    const user = users.find(u => u.username === username);

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = password === user.password;

    if (!isPasswordValid) {
        return res.status(401).json({
            ...req.body,
            message: 'Invalid credentials'
        });
    }

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
    res.cookie('token', token, { maxAge: tokenAge * 60 * 1000, httpOnly: true });
    return res.json({ token });
});

app.post('/api/logout', (_, res) => {
    return res.json({
        message: "Logged Out Successfully"
    });
});

app.post('/api/register', (req, res) => {
    const { last_name, first_name, password, payment_type, address, username } = req.body;
    const usersData = fs.readFileSync(path.join(__dirname, 'users.json'));

    const users = isValidJSON(usersData) || [];

    const id = uuid()

    const existingUser = !!users.find(u => u.username === username);

    if (!existingUser) {
        fs.writeFileSync(path.join(__dirname, 'users.json'), JSON.stringify([
            ...users,
            { id, last_name, first_name, password, payment_type, address, username }
        ]));
        return res.status(200).json({ status: "User Successfully Created" });
    }
    return res.status(409).json({ status: "User Already Exists" });
});

app.post('/api/getusers', (req, res) => {
    const { token } = req.body;

    try {
        const isAuthenticated = !!jwt.verify(token, JWT_SECRET);
        if (isAuthenticated) {
            const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json')));
            return res.status(200).json(users);
        } else {
            throw Error('Unauthorized Request');
        }
    } catch (err) {
        return res.status(401).json({ valid: false, message: 'Unauthorized Request' });
    }
});

app.post('/api/update', (req, res) => {
    const { user, token } = req.body;

    let users = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json')));

    const isValid = jwt.verify(token, JWT_SECRET)

    users = users.map(d => {
        if (d.id === user.id) return {
            ...d,
            ...user
        }
        return d;
    });

    if (!!isValid) {
        fs.writeFileSync(path.join(__dirname, 'users.json'), JSON.stringify(users));
        return res.json(users);
    }

    return res.status(401).json({ message: 'Unauthorized' });
});


app.post('/api/validate', (req, res) => {
    const { token } = req.body;

    try {
        const isValid = !!jwt.verify(token, JWT_SECRET);
        return res.status(200).json({ valid: isValid, message: 'Valid User' });
    } catch (err) {
        return res.status(401).json({ valid: false, message: 'Unauthorized' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
