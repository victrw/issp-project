const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// local testing
const dbPath = path.join(__dirname, '../db.json');

const getUsers = () => {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data).users;
};

const saveUsers = (users) => {
    const data = JSON.stringify({ users }, null, 2);
    fs.writeFileSync(dbPath, data, 'utf8');
};

exports.displayForgotPasswordPage = (req, res) => {
    res.render('forgot_password', { title: 'Forgot Password', sitename: 'ASLSTEAMHUB', loginUrl: '/users/login' });
};

exports.changePassword = async (req, res) => {
    try {
        const { password, confirmPassword, token } = req.body;
        if (!password || !confirmPassword) {
            return res.status(400).render('recovery-password', {
                title: 'Recovery Password',
                sitename: 'ASLSTEAMHUB',
                loginUrl: '/users/login',
                message: 'Please provide all required information',
                token
            });
        }
        if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
            return res.status(400).render('recovery-password', {
                title: 'Recovery Password',
                sitename: 'ASLSTEAMHUB',
                loginUrl: '/users/login',
                message: 'Password must be at least 8 characters long and contain at least one letter and one number',
                token
            });
        }
        if (password !== confirmPassword) {
            return res.status(400).render('recovery-password', {
                title: 'Recovery Password',
                sitename: 'ASLSTEAMHUB',
                loginUrl: '/users/login',
                message: 'Passwords do not match',
                token
            });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const users = getUsers();
        const user = users.find(user => user.id === decoded.id);
        if (!user) {
            return res.status(400).send("User not found.");
        }
        const hashedPassword = await bcrypt.hash(password, 8);
        user.password = hashedPassword;
        saveUsers(users);
        res.status(200).render('signin', {
            title: 'Sign In',
            sitename: 'ASLSTEAMHUB',
            loginUrl: '/users/login',
            message: "Password successfully updated."
        });
    } catch (err) {
        console.log(err);
        res.status(500).send("An error occurred during change.");
    }
};

exports.verifyEmailForResetPassword = async (req, res) => {
    const { token } = req.params;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const users = getUsers();
        const user = users.find(user => user.id === decoded.id);
        if (!user || user.resetToken !== token) {
            return res.status(400).send("Invalid token.");
        } else if (new Date() > user.resetTokenExpiry) {
            return res.status(400).send("Your verification token has expired. Please request a new one.");
        }
        res.render('recovery-password', {
            title: 'Recovery Password',
            sitename: 'ASLSTEAMHUB',
            loginUrl: '/users/login',
            message: "You've been verified. Please continue to change your password",
            token
        });
        user.resetToken = null;
        user.resetTokenExpiry = null;
        saveUsers(users);
    } catch (err) {
        console.log(err);
        if (err.name === 'TokenExpiredError') {
            return res.status(400).send("Your verification token has expired. Please request a new one.");
        }
        res.status(400).send("Invalid or expired token.");
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).render('forgot_password', {
                title: 'Forgot Password',
                sitename: 'ASLSTEAMHUB',
                loginUrl: '/users/login',
                message: 'Please provide all required information'
            });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).render('forgot_password', {
                title: 'Forgot Password',
                sitename: 'ASLSTEAMHUB',
                loginUrl: '/users/login',
                message: 'Please provide a valid email address'
            });
        }
        const users = getUsers();
        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            try {
                const resetToken = jwt.sign({ id: existingUser.id }, process.env.JWT_SECRET, {
                    expiresIn: '1d'
                });
                const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
                const verificationLink = `http://localhost:3000/users/forgot-password/${resetToken}`;
                existingUser.resetToken = resetToken;
                existingUser.resetTokenExpiry = resetTokenExpiry;
                saveUsers(users);
                await sgMail.send({
                    to: email,
                    from: process.env.SENDGRID_FROM_EMAIL,
                    templateId: process.env.SENDGRID_TEMPLATE_ID2,
                    dynamic_template_data: {
                        username: existingUser.username,
                        verificationLink: verificationLink
                    }
                });
                res.status(200).render('forgot_password', {
                    title: 'Forgot Password',
                    sitename: 'ASLSTEAMHUB',
                    loginUrl: '/users/login',
                    message: "Check your email to reset your password."
                });
            } catch (err) {
                console.error('Error sending email:', err);
                res.status(500).render('forgot_password', {
                    title: 'Forgot Password',
                    sitename: 'ASLSTEAMHUB',
                    loginUrl: '/users/login',
                    message: "An error occurred while sending the email."
                });
            }
        } else {
            res.status(400).render('forgot_password', {
                title: 'Forgot Password',
                sitename: 'ASLSTEAMHUB',
                loginUrl: '/users/login',
                message: "Your email doesn't exist."
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).send("An error occurred during the password reset process.");
    }
};