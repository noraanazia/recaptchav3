

require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const app = express();
const port = 5001;
const secretKey = process.env.ReCAPTCHA_SECRET_KEY;
const jwtSecret = process.env.JWT_SECRET || 'your_default_jwt_secret'; // not for prod, set the env variable through their config settings. Access the hosting service's dashboard or config panel and manually adding the JWT_SECRET environment variable

console.log('SCERET', secretKey)
console.log('SCERET PROCESS', process.env)

app.use(express.json());
app.use(cookieParser());

  // Middleware to authenticate JWT
  const authenticate = (req, res, next) => {
	const token = req.cookies.jwt;
	console.log('token auth check in server', token)

	if (!token) return res.status(401).send('Access Denied');
  
	try {
	  const verified = jwt.verify(token, jwtSecret);
	  req.user = verified;
	  next();
	} catch (err) {
	  res.status(400).send('Invalid Token');
	}
  };

//   Example of a protected route
app.get('/secure', authenticate, (req, res) => {
	console.log('#########token auth')
	res.send('Welcome to the secure page');
  });

  // Endpoint for JWT validation
  app.get('/validate-jwt', (req, res) => {
    const token = req.cookies.jwt;
	console.log('token exist', token)
    if (token) {
        jwt.verify(token, jwtSecret, (err, decoded) => {
            if (err) {
                res.json({ isAuthenticated: false });
            } else {
				console.log('token exist and is verfied', token)

                res.json({ isAuthenticated: true, user: decoded });
            }
        });
    } else {
        res.json({ isAuthenticated: false });
    }
});

// reCAPTCHA verification route
app.post('/verify-recaptcha', async (req, res) => {
	console.log("Request Body:", req.body);

	const responseToken = req.body.token; // The token from the client
	const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${responseToken}`;
  
	try {
	  const result = await axios.post(url);
	  console.log('Google reCAPTCHA response:', result.data)

	  if (result.data.success) {
		// if (result.data.success && result.data?.score > 0.5) {
		// Verification successful, create a JWT for the user
		const userPayload = { username: 'guest' }; // Replace with actual user data if available
        const token = jwt.sign(userPayload, jwtSecret, { expiresIn: '1h' }); // 1 hour expiration

		// Set an HTTP-only cookie with the JWT
        res.cookie('jwt', token, { httpOnly: true, sameSite: 'strict' });

		res.send({ success: true, message: 'reCAPTCHA verified and JWT issued' });
		} else {
		// Verification failed
			res.send({ success: false, message: 'reCAPTCHA verification failed' });
		}
	} catch (error) {
		console.log("Error occurred:", error.message);
	  	res.status(500).send({ success: false });
	}
  });

//Delete JWT token and logout
  app.post('/logout', (req, res) => {
    // Set the JWT cookie to expire in the past
    res.cookie('jwt', '', { expires: new Date(0), httpOnly: true });

    res.json({ message: 'Logged out successfully' });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});