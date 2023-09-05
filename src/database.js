const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = async function database(method, tabble, value) {
    if (method === 'get') {
        return (await db.get(tabble));
    } else if (method === 'set') {
        (await db.set(tabble, value));
        return ('OK');
    } else if (method === 'delete') {
        (await db.delete(tabble));
        return ('OK');
    };
};