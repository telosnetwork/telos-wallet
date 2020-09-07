import axios from "axios";

const hyperion = axios.create({
  baseURL: process.env.HYPERION_ENDPOINT
});

export default ({ Vue }) => {
  Vue.prototype.$hyperion = hyperion;
};

export { hyperion };
