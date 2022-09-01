import { boot } from 'quasar/wrappers';


const errorNotification = function(error) {
  let errorStr;
  if (error !== undefined) {
    if (error.startsWith("assertion failure with message:")) {
      errorStr = error.split("assertion failure with message:")[1];
    } else {
      errorStr = error;
    }
  } else {
    errorStr = "Cancelled transaction";
  }

  this.$q.notify({
    type: "negative",
    icon: "warning",
    message: `${errorStr}`
  });
};


export default boot(({ app, store }) => {
  app.config.globalProperties.$errorNotification = errorNotification;
  store["$errorNotification"] = errorNotification;
});
