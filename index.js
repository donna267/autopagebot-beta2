const express = require('express');
const path = require('path');
const axios = require('axios');
const { handleMessage } = require('./handles/handleMessage');
const { handlePostback } = require('./handles/handlePostback');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Middleware for parsing URL-encoded data
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' folder

// Route for serving the privacy policy page
app.get('/privacy-policy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'privacy-policy.html'));
});

// Route for the homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const VERIFY_TOKEN = 'pagebot';
const INTERNAL_API_BASE = 'https://fixed-db-autopage-bot2.onrender.com'; // Put your Own Database Url here use https://github.com/wedfhujkkmhhgg233/databasefbpage

// Edit Also the handlemessage Database Url
app.get('/webhook', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  }

  res.sendStatus(400); // Bad request if neither mode nor token are provided
});

// Webhook event handling endpoint
app.post('/webhook', (req, res) => {
  const { body } = req;

  if (body.object === 'page') {
    body.entry?.forEach(entry => {
      entry.messaging?.forEach(event => {
        if (event.message) {
          handleMessage(event);
        } else if (event.postback) {
          handlePostback(event);
        }
      });
    });

    return res.status(200).send('EVENT_RECEIVED');
  }

  res.sendStatus(404); // Not Found if the object is not 'page'
});

// /login endpoint (delegates to the internal server)
app.get('/login', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token is required.' });
  }

  try {
    const response = await axios.get(`${INTERNAL_API_BASE}/create`, { params: { token } });
    res.json(response.data); // Forward the internal server's response
  } catch (error) {
    console.error('Error in /login:', error.message);
    res.status(500).json({ error: 'Internal Server Error.' });
  }
});

// /delete endpoint (delegates to the internal server)
app.get('/delete', async (req, res) => {
  const { token, accesskey } = req.query;

  if (!token || !accesskey) {
    return res.status(400).json({ error: 'Token and AccessKey are required.' });
  }

  try {
    const response = await axios.get(`${INTERNAL_API_BASE}/delete`, { params: { token, accesskey } });
    res.json(response.data);
  } catch (error) {
    console.error('Error in /delete:', error.message);
    res.status(500).json({ error: 'Internal Server Error.' });
  }
});

// /find endpoint (delegates to the internal server)
app.get('/find', async (req, res) => {
  const { json } = req.query;

  if (!json) {
    return res.status(400).json({ error: 'JSON file name is required.' });
  }

  try {
    const response = await axios.get(`${INTERNAL_API_BASE}/find`, { params: { json } });
    res.json(response.data);
  } catch (error) {
    console.error('Error in /find:', error.message);
    res.status(500).json({ error: 'Internal Server Error.' });
  }
});

app.get('/total', async (req, res) => {
  try {
    // Replace 'http://localhost:20422/total' with your actual API URL if needed
    const response = await axios.get(`${INTERNAL_API_BASE}/total`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching /total:', error.message);
    res.status(500).json({ error: 'Failed to fetch total data from /total endpoint.' });
  }
});

// Server initialization
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`External server is running on port ${PORT}`);
});
