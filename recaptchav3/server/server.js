require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const axios = require("axios");
const rateLimit = require("express-rate-limit");

const app = express();
const port = 5001;

//Environment vaiables
const secretKey = process.env.ReCAPTCHA_SECRET_KEY;
const jwtSecret = process.env.JWT_SECRET || "your_default_jwt_secret"; // not for prod, set the env variable through their config settings. Access the hosting service's dashboard or config panel and manually adding the JWT_SECRET environment variable
const refreshTokenSecret =
  process.env.REFRESH_TOKEN_SECRET || "your_default_refresh_token_secret"; // Set a separate secret for refresh tokens

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

console.log("SCERET", secretKey);
console.log("SCERET PROCESS", process.env);

// Rate limit rule
const secureRouteApiLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24hrs
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 24hrs)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message:
    "Too many requests from this IP address, you've exceeded the 100 request limit within 24hrs. Please try again later.",
});

// Middleware
app.use(express.json());
app.use(cookieParser());

// Middleware to authenticate JWT
const authenticate = (req, res, next) => {
  const token = req.cookies.jwt;
  console.log("token auth check in server", token);

  if (!token) return res.status(401).send("Access Denied");

  try {
    const verified = jwt.verify(token, jwtSecret);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).send("Invalid Token");
  }
};

// reCAPTCHA verification route & create new refreshToken
app.post("/verify-recaptcha", async (req, res) => {
  console.log("Request Body:", req.body);

  const responseToken = req.body.token; // The token from the client
  const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${responseToken}`;

  try {
    const result = await axios.post(url);
    console.log("Google reCAPTCHA response:", result.data);

    if (result.data.success) {
      // if (result.data.success && result.data?.score > 0.5) {
      // Verification successful, create a JWT for the user
      const userPayload = { username: "guest" }; // Replace with actual user data if available
      //   const accessToken = jwt.sign(userPayload, jwtSecret, { expiresIn: "1h" }); // 1 hour expiration
      const accessToken = jwt.sign(userPayload, jwtSecret, { expiresIn: "3m" }); // 3mins expiration for test
      const refreshToken = jwt.sign(userPayload, refreshTokenSecret, {
        expiresIn: "7d",
      }); // 7 days expiration for refresh token
      try {
        await pool.query("INSERT INTO refresh_tokens(token) VALUES($1)", [
          refreshToken,
        ]);
        // Set an HTTP-only cookie with the JWT & refreshToken
        res.cookie("jwt", accessToken, { httpOnly: true, sameSite: "strict" });
        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          sameSite: "strict",
        });

        console.log("##New refreshToken added:", refreshToken);
        res.send({
          success: true,
          message: "reCAPTCHA verified and JWT issued",
          score: result.data.score,
        });
      } catch (error) {
        // Verification failed
        console.error("Error inserting refresh token into database:", error);
        res
          .status(500)
          .send({ success: false, message: "reCAPTCHA verification failed" });
      }
    }
  } catch (error) {
    console.log("Error occurred:", error.message);
    res.status(500).send({ success: false });
  }
});

// Endpoint for JWT validation
app.get("/validate-jwt", async (req, res) => {
  const token = req.cookies.jwt;
  // console.log("access token exist", token);
  // console.log("refresh token exist", req.cookies.refreshToken);
  if (token) {
    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) {
        res.json({ isAuthenticated: false });
      } else {
        console.log("token exist and is verfied", token);

        res.json({ isAuthenticated: true, user: decoded });
      }
    });
  } else {
    res.json({ isAuthenticated: false });
  }
});

// protected route with rate limiting
app.get("/secure", secureRouteApiLimiter, authenticate, (req, res) => {
  console.log("#########token auth");
  res.send("Welcome to the secure page");
});

// Endpoint to refresh JWT
app.post("/refresh-token", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  console.log("##server refresh token", refreshToken);
  try {
    const { rows } = await pool.query(
      "SELECT * FROM refresh_tokens WHERE token = $1",
      [refreshToken]
    );
    if (rows.length === 0) {
      console.warn("Refresh token not found in database.");
      return res.status(401).send("Unauthorized");
    }

    jwt.verify(refreshToken, refreshTokenSecret, (err, user) => {
      if (err) {
        console.error("JWT verification error:", err);
        return res.status(403).send("Forbidden");
      }
      const newAccessToken = jwt.sign({ username: user.username }, jwtSecret, {
        expiresIn: "1h",
      }); // Adjust payload and expiration as needed
      console.log("##refresh newAccessToken", newAccessToken);
      // Set the new access token as an HTTP-only cookie
      res.cookie("jwt", newAccessToken, { httpOnly: true, sameSite: "strict" });
      console.log("##refresh newAccessToken  set", newAccessToken);

      res.json({ success: true, accessToken: newAccessToken });
    });
  } catch (error) {
    console.error("Error validating refresh token:", error);
    res.status(500).send("Internal Server Error");
  }
});

//Delete JWT token, remove refresh token and logout
app.post("/logout", (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  // Remove the refresh token from db
  pool.query(
    "DELETE FROM refresh_tokens WHERE token = $1",
    [refreshToken],
    (err, result) => {
      if (err) {
        console.log("Error exists - logging out");
      } else {
        // Set the JWT cookie to expire in the past
        res.cookie("jwt", "", { expires: new Date(0), httpOnly: true });
        res.cookie("refreshToken", "", {
          expires: new Date(0),
          httpOnly: true,
        });
        res.json({ message: "Logged out successfully" });
      }
    }
  );
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
