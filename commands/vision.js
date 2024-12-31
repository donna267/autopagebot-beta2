const axios = require("axios");
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: "vision",
  description: "Vision AI",
  role: 1,
  author: "Kaizenji",

  async execute(chilli, pogi, kalamansi, event) {
    const kalamansiPrompt = pogi.join(" ").trim();
    const userId = event.senderId || "12"; // Default uid to "12"

    if (!kalamansiPrompt) {
      return sendMessage(chilli, { text: `Please enter your question or image to describe.` }, kalamansi);
    }

    try {
      let imageUrl = "";

      // Check for image attachments or replied images
      if (event.message?.reply_to?.mid) {
        imageUrl = await getRepliedImage(event.message.reply_to.mid, kalamansi);
        console.log("Replied Image URL:", imageUrl); // Debugging the replied image URL
      } else if (event.message?.attachments && event.message.attachments[0]?.type === 'image') {
        imageUrl = event.message.attachments[0].payload.url;
        console.log("Direct Image URL:", imageUrl); // Debugging the direct image URL
      }

      if (!imageUrl) {
        return sendMessage(chilli, { text: `No image found to analyze.` }, kalamansi);
      }

      // Make API request
      const apiUrl = `https://kaiz-apis.gleeze.com/api/gemini-vision`;
      const chilliResponse = await handleImageRecognition(apiUrl, kalamansiPrompt, userId, imageUrl);

      // Process and send response
      const result = chilliResponse.response;
      const visionResponse = `📷 𝗩𝗜𝗦𝗜𝗢𝗡 𝗔𝗡𝗔𝗟𝗬𝗭\n━━━━━━━━━━━━━━━━━━\n${result}`;
      sendLongMessage(chilli, visionResponse, kalamansi);

    } catch (error) {
      console.error("Error in Vision command:", error);
      sendMessage(chilli, { text: `Error: ${error.message || "Something went wrong."}` }, kalamansi);
    }
  }
};

async function handleImageRecognition(apiUrl, prompt, uid, imageUrl) {
  try {
    const { data } = await axios.get(apiUrl, {
      params: {
        q: prompt,
        uid,
        imageUrl: imageUrl || ""
      }
    });
    return data;
  } catch (error) {
    console.error("Error in Image Recognition API:", error);
    throw new Error("Failed to recognize the image.");
  }
}

async function getRepliedImage(mid, kalamansi) {
  try {
    const { data } = await axios.get(`https://graph.facebook.com/v21.0/${mid}/attachments`, {
      params: { access_token: kalamansi }
    });

    console.log("Replied Image Data:", data); // Debugging the entire response from Graph API
    
    if (data?.data?.[0]?.image_data?.url) {
      return data.data[0].image_data.url;
    }
    return "";
  } catch (error) {
    console.error("Error fetching replied image:", error);
    return "";
  }
}

function sendLongMessage(chilli, text, kalamansi) {
  const maxMessageLength = 2000;
  const delayBetweenMessages = 1000;

  if (text.length > maxMessageLength) {
    const messages = splitMessageIntoChunks(text, maxMessageLength);
    sendMessage(chilli, { text: messages[0] }, kalamansi);

    messages.slice(1).forEach((message, index) => {
      setTimeout(() => sendMessage(chilli, { text: message }, kalamansi), (index + 1) * delayBetweenMessages);
    });
  } else {
    sendMessage(chilli, { text }, kalamansi);
  }
}

function splitMessageIntoChunks(message, chunkSize) {
  const regex = new RegExp(`.{1,${chunkSize}}`, 'g');
  return message.match(regex);
}
