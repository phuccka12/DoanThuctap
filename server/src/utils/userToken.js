const crypto = require("crypto");

const createRawToken = () => crypto.randomBytes(32).toString("hex");

const hashRawToken = (raw) =>
  crypto.createHash("sha256").update(raw).digest("hex");

module.exports = { createRawToken, hashRawToken };
