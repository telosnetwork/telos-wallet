// import something here


const errorNotification = function(error) {
  let errorStr;
  if (error !== undefined) {
    if (error.startsWith("assertion failure with message:")) {
      errorStr = error.split("assertion failure with message:")[1];
    } else {
      errorStr = error;
    }
  } else {
    errorStr = "Cancelled transactoin";
  }
  
  this.$q.notify({
    type: "negative",
    icon: "warning",
    message: `${errorStr}`
  });
};


export default ({ Vue, store }) => {
  Vue.prototype.$errorNotification = errorNotification;
  store["$errorNotification"] = errorNotification;
};
