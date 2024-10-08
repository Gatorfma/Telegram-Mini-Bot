import fetch from 'node-fetch';

//Bot's API token from BotFather
const BOT_TOKEN = '7091749954:AAG0EzWnR2ytafrPupunTWtvnUJ8bHEj03Q';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// To store user session data (temporary storage for numbers)
let userSessions = {};

// Function to send a message to the user
async function sendMessage(chatId, text) {
  const url = `${TELEGRAM_API_URL}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
    }),
  });
}

// Function to handle user input and the bot's sequential prompts
async function handleUserInput(chatId, text) {
    let session = userSessions[chatId] || { step: 0, numbers: [] };
  
    // If the user sends the /start command at any point, reset the session
    if (text === '/start') {
      session = { step: 0, numbers: [] };  // Clear any existing session state
      await sendMessage(chatId, 'Welcome! I will help you randomly select a number from three inputs.');
      await sendMessage(chatId, 'Please enter the first number.');
      session.step = 1;  // Move to the first input step
      userSessions[chatId] = session;  // Save the session state
      return;  // Exit the function early to prevent further processing
    }
  
    // Step 1: Ask for the first number
    if (session.step === 1) {
      if (isNaN(text)) {
        await sendMessage(chatId, 'Invalid input. Please enter a valid number.');
        return; // Don't increment step; ask again for the first number
      }
      session.numbers.push(Number(text));
      await sendMessage(chatId, 'Please enter the second number.');
      session.step = 2;
    }
    // Step 2: Ask for the second number after receiving the first
    else if (session.step === 2) {
      if (isNaN(text)) {
        await sendMessage(chatId, 'Invalid input. Please enter a valid number.');
        return; // Don't increment step; ask again for the second number
      }
      session.numbers.push(Number(text));
      await sendMessage(chatId, 'Please enter the third number.');
      session.step = 3;
    }
    // Step 3: Ask for the third number after receiving the second
    else if (session.step === 3) {
      if (isNaN(text)) {
        await sendMessage(chatId, 'Invalid input. Please enter a valid number.');
        return; // Don't increment step; ask again for the third number
      }
      session.numbers.push(Number(text));
  
      // Randomly select one of the three numbers
      const randomNumber = session.numbers[Math.floor(Math.random() * session.numbers.length)];
      
      // Send the selected number back to the user
      await sendMessage(chatId, `The selected number is: ${randomNumber}`);
  
      // Ask the user if they want to continue
      await sendMessage(chatId, 'Do you want to continue? (yes/no)');
      
      // Move to the confirmation step
      session.step = 4;
    }
    // Step 4: Handle the user's decision (yes or no)
    else if (session.step === 4) {
      if (text.toLowerCase() === 'yes') {
        // Immediately start over and prompt for the first number again
        session.step = 1;  // Reset the step to ask for the first number
        session.numbers = [];  // Clear the previous numbers
        await sendMessage(chatId, 'Starting over! Please enter the first number.');
      } else if (text.toLowerCase() === 'no') {
        // End the session and wait for /start to restart
        await sendMessage(chatId, 'Okay! If you want to play again, type /start or "yes".');
        delete userSessions[chatId];  // Clear session data
      } else {
        // If input is not "yes" or "no", ask again
        await sendMessage(chatId, 'Invalid response. Please type "yes" or /start to restart, "no" to terminate.');
      }
    }
  
    // Save the current state of the session
    userSessions[chatId] = session;
  }

// Function to fetch updates (messages sent to your bot)
async function getUpdates(offset) {
  const url = `${TELEGRAM_API_URL}/getUpdates?offset=${offset}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.ok) {
    for (const update of data.result) {
      // Ensure the update contains a message object before accessing it
      if (update.message) {
        const chatId = update.message.chat.id;
        const text = update.message.text;

        // Handle all incoming messages through handleUserInput
        await handleUserInput(chatId, text);

        // Update the offset to avoid processing the same update again
        offset = update.update_id + 1;
      }
    }
  }

  return offset;
}

// Main loop to keep fetching updates from Telegram
async function main() {
  let offset = 0;

  while (true) {
    offset = await getUpdates(offset);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Poll every 1 second
  }
}

// Start the bot
main().catch((err) => console.error('Error:', err));
