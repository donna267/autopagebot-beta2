const axios = require("axios");
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: "vision",
  description: "Vision Ai",
  role: 1,
  author: "Kaizenji",

  async execute(chilli, pogi, kalamansi, event) {
    const kalamansiPrompt = pogi.join(" ").trim();

    if (!kalamansiPrompt) {
      return sendMessage(chilli, { text: `Please enter your question or image to describe.` }, kalamansi);
    }

    try {
      let imageUrl = "";

      if (event.message?.reply_to?.mid) {
        imageUrl = await getRepliedImage(event.message.reply_to.mid, kalamansi);
      } else if (event.message?.attachments && event.message.attachments[0]?.type === 'image') {
        imageUrl = event.message.attachments[0].payload.url;
      }

      const apiUrl = `https://kaiz-apis.gleeze.com/api/gemini-vision`;

      const chilliResponse = await handleImageRecognition(apiUrl, kalamansiPrompt, imageUrl);
      const result = chilliResponse.response;

      const visionResponse = `📷 𝗩𝗜𝗦𝗜𝗢𝗡 𝗔𝗡𝗔𝗟𝗬𝗭
━━━━━━━━━━━━━━━━━━
${result}`;

      sendLongMessage(chilli, visionResponse, kalamansi);

    } catch (error) {
      console.error("Error in Vision command:", error);
      sendMessage(chilli, { text: `Error: ${error.message || "Something went wrong."}` }, kalamansi);
    }
  }
};

async function handleImageRecognition(apiUrl, prompt, imageUrl) {
  const { data } = await axios.get(apiUrl, {
    params: {
      q: prompt,
      uid: "",
      imageUrl: imageUrl || ""
    }
  });

  return data;
}

async function getRepliedImage(mid, kalamansi) {
  try {
    const { data } = await axios.get(`https://graph.facebook.com/v21.0/${mid}/attachments`, {
      params: { access_token: kalamansi }
    });

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
