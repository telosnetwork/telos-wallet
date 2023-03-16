import { boot } from "quasar/wrappers";

const nameToUint64 = function(name) {
  let n = BigInt(0);

  let i = 0;
  for (; i < 12 && name[i]; i++) {
    n |=
      BigInt(charToSymbol(name.charCodeAt(i)) & 0x1f) <<
      BigInt(64 - 5 * (i + 1));
  }

  if (i == 12) {
    n |= BigInt(charToSymbol(name.charCodeAt(i)) & 0x0f);
  }

  return n.toString();
};


export default boot(({ app, store }) => {
  app.config.globalProperties.$nameToUint64 = nameToUint64;
  store["$nameToUint64"] = nameToUint64;
});
