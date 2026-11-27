"use strict";
// See package.json. Throws only if something actually tries to use it.
module.exports = function critters() {
  throw new Error("critters is stubbed for the Cloudflare build; experimental.optimizeCss is not supported");
};
