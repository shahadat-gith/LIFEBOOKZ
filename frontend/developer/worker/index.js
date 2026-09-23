export default {
  async fetch(request, env) {
    // env vars are available here, e.g. env.MY_API_KEY
    return env.ASSETS.fetch(request);
  },
};
