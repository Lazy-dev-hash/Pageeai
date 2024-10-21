// index.js

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { Configuration, OpenAIApi } = require('openai');

// Replace these with your actual tokens
const PAGE_ACCESS_TOKEN = 'EAAZAla0AZCCdUBO3ZAF6EZAHoeHb2FI3tXq2PkwJhEiXpEGjbMUWBKYQnOrguZBGc2DsZBXhUD20KRqEnpvzpPYvnAWtxWbdu1jUMQ2o9rzZBh7PiNNnZAj3siIGas796XnKWn0OyfKLAauAZBjbwQmbcr4GlW1uE33JrcdKWOxMM3ZCSonwZBTWU91G1DNndgpTY9TBAZDZD';
const VERIFY_TOKEN = 'pagebot';
const OPENAI_API_KEY = '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';

// Initialize OpenAI API client
const configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Create Express app
const app = express();
app.use(bodyParser.json());

// Greeting message setup
const GREETING_MESSAGE = "Hello! I'm your AI assistant. You can send me text or images, and I'll do my best to help!";

// Webhook verification for Facebook
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Handle incoming messages
app.post('/webhook', async (req, res) => {
    const body = req.body;

    if (body.object === 'page') {
        body.entry.forEach(async (entry) => {
            const webhookEvent = entry.messaging[0];
            const senderId = webhookEvent.sender.id;

            if (webhookEvent.message) {
                if (webhookEvent.message.text) {
                    // Handle text message
                    const userMessage = webhookEvent.message.text;
                    const botResponse = await getAIResponse(userMessage);
                    sendMessage(senderId, botResponse);
                } else if (webhookEvent.message.attachments && webhookEvent.message.attachments[0].type === 'image') {
                    // Handle image message
                    const imageUrl = webhookEvent.message.attachments[0].payload.url;
                    const botResponse = await getAIImageResponse(imageUrl);
                    sendMessage(senderId, botResponse);
                }
            } else if (webhookEvent.postback && webhookEvent.postback.payload === 'GET_STARTED') {
                // Send greeting message
                sendMessage(senderId, GREETING_MESSAGE);
            }
        });

        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// Function to get a response from OpenAI for text
async function getAIResponse(userMessage) {
    try {
        const response = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: userMessage }],
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('OpenAI API Error:', error);
        return 'Sorry, I could not process your request at the moment.';
    }
}

// Function to generate a response for an image
async function getAIImageResponse(imageUrl) {
    // You can replace this with a custom image processing approach or integrate with DALL-E for image generation
    return `I received your image: ${imageUrl}. However, I'm currently configured for text-based tasks.`;
}

// Function to send message back to Facebook Messenger
function sendMessage(senderId, message) {
    axios.post(
        `https://graph.facebook.com/v13.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
        {
            recipient: { id: senderId },
            message: { text: message },
        }
    )
    .then(response => {
        console.log('Message sent!');
    })
    .catch(error => {
        console.error('Unable to send message:', error);
    });
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
