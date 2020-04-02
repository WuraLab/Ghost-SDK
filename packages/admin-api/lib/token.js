const jwt = require('jsonwebtoken');

module.exports = function token(version, key) {
    // exporting the token object
    // it takes two object , version and version  and your admin api key
    // The split() method is used to split a string into an array of substrings, and returns the new array

    // Destructuring has made extracting data from an array very simple and readable. 
    // 
    const [id, secret] = key.split(':');
    // payload is empty
    // Buffer.from(secret, 'hex')
    // The Buffer.from() method creates a new buffer filled with the specified string, array, or buffer.
    // Buffer.from(obj, encoding); - syntax

    // Sign synchronously
    // set the "payload"
    // set the "private key"
    // set the {options}
    return jwt.sign({}, Buffer.from(secret, 'hex'), { // eslint-disable-line no-undef
        keyid: id,
        algorithm: 'HS256',
        expiresIn: '5m',
        audience: `/${version}/admin/`
    });
};
