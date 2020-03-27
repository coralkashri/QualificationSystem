const crypt = require('password-hasher');
const hash_type = 'ssha512', crypt_buffer = new Buffer("tg3d9alu98qf6mcestdsq134d", "hex");

function get_hash_code(text) {
    return crypt.createHash(hash_type, text, crypt_buffer).hash.toString('hex');
}

module.exports = {
    get_hash_code
};