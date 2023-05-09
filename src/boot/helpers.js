import { boot } from 'quasar/wrappers';

const charToSymbol = function(char) {
    let c = char;

    if (typeof c === 'string') {
        c = c.charCodeAt(0);
    }

    if (c >= 'a'.charCodeAt(0) && c <= 'z'.charCodeAt(0)) {
        return c - 'a'.charCodeAt(0) + 6;
    }

    if (c >= '1'.charCodeAt(0) && c <= '5'.charCodeAt(0)) {
        return c - '1'.charCodeAt(0) + 1;
    }

    return 0;
};

const nameToUint64 = function(name) {
    let n = BigInt(0);
    if (!name) {
        return n.toString();
    }

    let i = 0;
    for (; i < 12 && name[i]; i++) {
        n |=
      BigInt(charToSymbol(name.charCodeAt(i)) & 0x1f) <<
      BigInt(64 - 5 * (i + 1));
    }

    if (i === 12) {
        n |= BigInt(charToSymbol(name.charCodeAt(i)) & 0x0f);
    }

    return n.toString();
};


export default boot(({ app, store }) => {
    app.config.globalProperties.$nameToUint64 = nameToUint64;
    store['$nameToUint64'] = nameToUint64;
});
