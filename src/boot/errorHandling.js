import { boot } from 'quasar/wrappers';


const errorNotification = function(error) {
  let errorStr;
  if (error !== undefined) {
    if (typeof error.startsWith !== "function") {
      errorStr = error;
    } else if (error.startsWith("assertion failure with message:")) {
      errorStr = error.split("assertion failure with message:")[1];
    } else {
      errorStr = error;
    }
  } else {
    errorStr = "Cancelled transaction";
  }

  this.$q.notify({
    color: "negative",
    icon: "error",
    message: `${errorStr}`
  });
};

const unexpectedErrorNotification = function(error) {
  this.$q.notify({
    color: "dark",
    icon: "warning",
    message: `${error}`
  });
};

const successNotification = function(message) {
  this.$q.notify({
    color: "primary",
    icon: "done",
    message: `${message}`
  });
};



export default boot(({ app, store }) => {
  app.config.globalProperties.$errorNotification = errorNotification;
  store["$errorNotification"] = errorNotification;
  app.config.globalProperties.$unexpectedErrorNotification = unexpectedErrorNotification;
  store["$unexpectedErrorNotification"] = unexpectedErrorNotification;
  app.config.globalProperties.$successNotification = successNotification;
  store["$successNotification"] = successNotification;
});



