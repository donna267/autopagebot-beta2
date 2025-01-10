const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'pinayflix',
  description: 'Search for video from PinayFlix',
  usage: 'pinaysearch <search title>',
  author: 'Rized',

  async execute(senderId, args, pageAccessToken) {
    const searchQuery = args.join(' ');

    if (!searchQuery) {
      return sendMessage(senderId, {
        text: '❌ Usage: pinaysearch <title>',
      }, pageAccessToken);
    }

    const apiUrl = `http://sgp1.hmvhostings.com:25743/pinay?search=${encodeURIComponent(searchQuery)}&page=1`;

    try {
      const { data } = await axios.get(apiUrl);

      if (!data || data.length === 0) {
        return sendMessage(senderId, {
          text: '❌ No videos found for the given search query.',
        }, pageAccessToken);
      }

      const maxVideos = 2; // Limit the number of videos to send
      const videos = data.slice(0, maxVideos);

      for (const video of videos) {
        const videoMessage = {
          attachment: {
            type: 'video',
            payload: {
              url: video.video,
              is_reusable: true,
            },
          },
        };

        // Send video attachment
        await sendMessage(senderId, videoMessage, pageAccessToken);

        // Send additional message
        const message = `${video.title} 🎥\n\n${video.link}\nEnjoy watching! tigang boy.`;
        await sendMessage(senderId, { text: message }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error:', error.message);
      sendMessage(senderId, {
        text: '❌ An error occurred while processing the request. Please try again later.',
      }, pageAccessToken);
    }
  },
};
