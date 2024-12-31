const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { sendMessage } = require('./sendMessage');

// Load commands
const commands = new Map();
const prefix = '-';

// Directory for storing image URLs
const imageFilePath = path.join(__dirname, '../data/image.json');

// Ensure the image.json file exists
if (!fs.existsSync(imageFilePath)) {
  fs.writeFileSync(imageFilePath, JSON.stringify({}), 'utf8');
}

fs.readdirSync(path.join(__dirname, '../commands'))
  .filter(file => file.endsWith('.js'))
  .forEach(file => {
    const command = require(`../commands/${file}`);
    commands.set(command.name.toLowerCase(), command);
  });

// Internal API endpoints
const INTERNAL_API_BASE = 'https://fixed-db-autopage-bot2.onrender.com'; //put your own database url here
const ENDPOINT_FIND = `${INTERNAL_API_BASE}/find?json=`;

/**
 * Fetch the page access token from the internal API.
 * @param {string} pageId - The Facebook page ID.
 * @returns {Promise<string>} - The access token for the page.
 */
async function getPageAccessToken(pageId) {
  try {
    const response = await axios.get(`${ENDPOINT_FIND}${encodeURIComponent(pageId)}.json`);
    if (response.data && response.data.token) {
      return response.data.token;
    }
    throw new Error(`Token not found for page ID: ${pageId}`);
  } catch (error) {
    console.error(`Error fetching token for page ID ${pageId}:`, error.message);
    throw new Error('Unable to retrieve token.');
  }
}

/**
 * Handles incoming messages and stores image URLs if an image is sent.
 * @param {Object} event - The event object from the messaging platform.
 */
async function handleMessage(event) {
  const senderId = event?.sender?.id;
  if (!senderId) return console.error('Invalid event object');

  const messageText = event?.message?.text?.trim();
  const messageAttachments = event?.message?.attachments;
  
  if (!messageText && !messageAttachments) return console.log('Received event without message text or attachments');

  // Determine the page ID from the event data (e.g., from the recipient field)
  const pageId = event?.recipient?.id;
  if (!pageId) {
    console.error('Page ID is missing from the event');
    return;
  }

  try {
    // Fetch the access token from the internal API
    const pageAccessToken = await getPageAccessToken(pageId);

    // Check if an image is included in the message
    if (messageAttachments && Array.isArray(messageAttachments)) {
      messageAttachments.forEach(attachment => {
        if (attachment.type === 'image' && attachment.payload && attachment.payload.url) {
          const imageUrl = attachment.payload.url;

          // Read the current data from image.json
          const imageData = JSON.parse(fs.readFileSync(imageFilePath, 'utf8')) || {};

          // Store the image URL with the sender ID as the key
          imageData[senderId] = imageUrl;

          // Write the updated data back to image.json
          fs.writeFileSync(imageFilePath, JSON.stringify(imageData, null, 2), 'utf8');

          console.log(`Stored image URL for user ${senderId}: ${imageUrl}`);
        }
      });
    }

    // Process the message as a command if applicable
    if (messageText) {
      const [commandName, ...args] = messageText.startsWith(prefix)
        ? messageText.slice(prefix.length).split(' ')
        : messageText.split(' ');

      // Check if the command exists
      if (commands.has(commandName.toLowerCase())) {
        await commands.get(commandName.toLowerCase()).execute(senderId, args, pageAccessToken, sendMessage);
      } else {
        // If no command matches, execute the default 'ai' command
        const defaultCommand = commands.get('ai');
        if (defaultCommand) {
          await defaultCommand.execute(senderId, [messageText], pageAccessToken, sendMessage);
        } else {
          console.log('No AI command defined.');
          await sendMessage(senderId, { text: "Sorry, I couldn't understand that. Please try again." }, pageAccessToken);
        }
      }
    }
  } catch (error) {
    console.error(`Error processing message:`, error);
    await sendMessage(senderId, { text: error.message || 'There was an error processing your request.' }, null);
  }
}

module.exports = { handleMessage };
