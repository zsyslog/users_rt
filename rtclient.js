var server = "http://push.lacopucha.com:443";

var websocket = io.connect(server);

window.onload = function() {

	websocket.emit("newSession", {url:location.href});

    websocket.on("sendEvent", function(data) {

      console.log("event received");
      
   });

};