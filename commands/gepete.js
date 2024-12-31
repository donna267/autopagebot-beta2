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

    const apiUrl = `https://kaiz-apis.gleeze.com/api/gpt-4o?q=${encodeURIComponent(question)}&uid=${senderId}`;

    try {
      const response = await axios.get(apiUrl);

      if (response.data && response.data.response) {
        const reply = response.data.response;

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
          { text: '⚠️ Oops! I couldn\'t get a response from the AI. Please try again later.' },
          pageAccessToken
        );
      }
    } catch (error) {
      console.error('Error fetching AI response:', error);
      await sendMessage(
        senderId,
        { text: '⚠️ Oops! Something went wrong while fetching the response. Please try again later.' },
        pageAccessToken
      );
    }
  }
};
