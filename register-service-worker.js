"serviceWorker"in navigator&&window.addEventListener("load",(function(){navigator.serviceWorker.register("/fairificator/expo-service-worker.js",{scope:"/fairificator/"}).then((function(e){})).catch((function(e){console.info("Failed to register service-worker",e)}))}));