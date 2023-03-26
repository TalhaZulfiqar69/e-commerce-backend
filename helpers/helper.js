const bcrypt = require('bcrypt');
const saltRound = 10;

const generateHashPassword = (password) => {
  const salt = bcrypt.genSaltSync(saltRound);
  const passwordHash = bcrypt.hashSync(password, salt);
  return passwordHash;
};

module.exports = { generateHashPassword };
