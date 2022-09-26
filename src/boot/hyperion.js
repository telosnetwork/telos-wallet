import { boot } from 'quasar/wrappers';
import axios from "axios";

const hyperion = axios.create({
  baseURL: process.env.HYPERION_ENDPOINT
});

export default boot(({ app }) => {
  app.config.globalProperties.$hyperion = hyperion;
});

export { hyperion };
