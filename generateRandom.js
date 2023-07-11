const crypto = require('crypto');

function generateRandomString(length) {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomString = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(characters.length);
    randomString += characters.charAt(randomIndex);
  }
  
  return randomString;
}
module.exports={generateRandomString}