const bank = require('./questions.json');

const ROLES = Object.freeze(['eng', 'con', 'fin', 'hr', 'del']);

function questionsForRole(role) {
  return bank[role] || null;
}

function isValidRole(role) {
  return ROLES.includes(role);
}

module.exports = { bank, ROLES, questionsForRole, isValidRole };
