// main.js
var React = require('react');
var ReactDOM = require('react-dom');
var Matrix = require('matrix-js-sdk');
var StatusInterface = require("./components/StatusInterface.js");

var hs_url = null;
var hs_access_token = "";
var hs_user_id = "";
var room_id = null;
var name = null;
var concern_interval = null;
function main () {
  document.title = "Status | No connection";
  //Load config


  fetch(new Request("config.json"))
  .then((response) => {
    if (response.status == 200)
    {
      return response.json();
    }
    else
    {
      throw new Error('Could not load config.json. Got a status ' + response.status );
    }
  })
  .then((response) => {
    room_id = response.room_id;
    hs_url = response.homeserver;
    name = response.name || "Status Page";
    concern_interval = response.concern_interval || 30;
    hs_access_token = localStorage.getItem("status_mx_access_token");
    hs_user_id = localStorage.getItem("status_mx_user_id");
    if (hs_access_token == null) {
      //Create a guest account.
      var client = Matrix.createClient({baseUrl: hs_url});
      client.registerGuest().then( (data) => {
        localStorage.setItem("status_mx_access_token", data.access_token);
        localStorage.setItem("status_mx_user_id", data.user_id);
        hs_access_token = data.access_token;
        hs_user_id = data.user_id;
      }).then(startClient).catch( (err) =>{
        console.error("Failed to create guest account.", err);
      })
    }
    else {
      startClient();
    }

  })
  .catch( (error) => {
    console.error(error);
  });
}

function startClient () {
  var client = Matrix.createClient( {baseUrl: hs_url, accessToken: hs_access_token, userId: hs_user_id} );
  client.setGuest(true);//Sometimes it fucks up

  client.on("sync", function (state) {
    if(state == "PREPARED") { //TODO Check to see if we are interested.
      document.title = "Status | " + name;
      var status_room = client.getRoom(room_id);
      ReactDOM.render(
        <StatusInterface concern_interval={concern_interval} name={name} room={status_room} state={state} client={client}></StatusInterface>,
        document.getElementById("rootDOM")
      );
    }
    else if (state == "ERROR") {
      //TODO Show an error
    }
  });
  client.joinRoom(room_id).then(() => {
    client.startClient();
  }).catch((err) =>{
    console.error("Failed to join status room.", err);
  });

}




document.onready = main();
