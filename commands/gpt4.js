const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'ai',
  description: 'Interact with the GPT-4 model to receive AI-generated responses.',
  usage: '-gpt4 [your question]',
  author: 'Jerome',

  async execute(senderId, args, pageAccessToken) {
    const question = args.join(' ').trim();
    if (!question) {
      return sendMessage(
        senderId,
        { text: '🤖 Please provide a question for GPT-4 (e.g., "-gpt4 What is the weather today?").' },
        pageAccessToken
      );
    }

    const apiUrl = `https://chat-gpt-master33.onrender.com/api/hercai?question=${encodeURIComponent(question)}`;

    try {
      const response = await axios.get(apiUrl);

      if (response.data && response.data.reply) {
        const reply = response.data.reply;

        // Split the reply into chunks of 2000 characters or less
        const chunkSize = 2000;
        const chunks = [];
        for (let i = 0; i < reply.length; i += chunkSize) {
          chunks.push(reply.slice(i, i + chunkSize));
        }

        // Send each chunk as a separate message
        for (const chunk of chunks) {
          await sendMessage(senderId, { text: chunk }, pageAccessToken);
        }
      } else {
        await sendMessage(
          senderId,
          { text: '⚠️ Oops! I couldn\'t get a response from GPT-4. Please try again later.' },
          pageAccessToken
        );
      }
    } catch (error) {
      console.error('Error fetching GPT-4 response:', error);
      await sendMessage(
        senderId,
        { text: '⚠️ Oops! Something went wrong while fetching the response. Please try again later.' },
        pageAccessToken
      );
    }
  }
};
