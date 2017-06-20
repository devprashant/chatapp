const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const uuidv1 = require('uuid/v1');

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

var uuid ;

var uidSocketObj = {};
var userDBArray = [];

app.get('/user/', (req, res) => {
  uuid = uuidv1();
  res.redirect('http://localhost:3000/user/' + uuidv1());
});

app.get('/uuid/', (req, res) => {
  res.json({'uuid': uuid});
});

app.get('/user/:uid', (req, res) => {
  // console.log(req.params.uid);
  res.sendFile(__dirname + '/public/child/index.html');
});

const msgArray = [];

function saveMessage(roomid,msg){
  // console.log('i was here');
  // console.log(msgArray);
  for(var i =0; i < msgArray.length; i++ ){
     var msgObj = msgArray[i];
    if(msgObj.roomid === roomid){
      if(!msgObj.messages.length) {
        msgObj.messages = []
      }
        msgObj.messages.push(msg);
        // console.log(msgArray);
        return;
    }
  }  
}

function userDB(userObj, socketid){
  

  // var userDBObj = { 
  //   username: userObj.username,
  //   uuid: userObj.uuid,
  //   socketid: sokcet
  // }
  var updated = false;

  // check for uuid and update
  for ( var i =0; i < userDBArray.length; i++){

    if (userDBArray[i].uuid == userObj.uuid){
      // if (userDBArray[i].)
          userDBArray[i].username = userObj.username;
          userDBArray[i].uuid = userObj.uuid;
          if(userDBArray[i].socketid.indexOf(socketid)){
            userDBArray[i].socketid.push(socketid);      
          }
          updated = true;
    }
  }

  // This runs when user with uuid is still not in userDB.
  if(!updated) {
    var newUserObjToInsert = {
      username: userObj.username,
      uuid: userObj.uuid,
      socketid: [socketid]
    };

    userDBArray.push(newUserObjToInsert);
  } 
  console.log(userDBArray); 
}


io.on('connection', function(socket){

    // console.log(socket.handshake.headers.referer);


    socket.on('init', (userObj) => userDB(userObj, socket.id));

    // set username provided by client
    socket.on('setusername', (username) => {
      socket.username = username;
      msgArray.push({roomid: socket.id, messages: ''});
      // socket.messages = [];
    });

    // socket.on('setUidsocketMap', (uuid) => uidSocketMap(uuid, socket.id));

    socket.on('chat message', (msg) => {
      var chatMessage = socket.username + ' : ' + msg;

      // saveMessage(socket.id, chatMessage);

      for (var room in socket.rooms){
          // socket.messages.push(msg);
          // console.log(socket.messages);

          // console.log(socket.id + ' : ' + room + " : " + socket.rooms[room]);
          // console.log(socket.rooms[room] === room);
          // console.log(room === socket.id);
          if(room === socket.id) continue;
    	    io.in(room).emit('chat message', chatMessage);
      }      
    });

    // join room based on room id provided by client
    socket.on('join', (room) => {
        socket.join(room, () => socket.emit('rooms', socket.rooms));        
    });

    socket.on('changeusername', (username) => {
      userDB()
    });
    // socket.on('namechange', (oldName, newName) => {
    //   for (var room in socket.rooms){
    //     io.in(room).emit('namechange', oldName + ' is now known as ' + newName);
    //   }
    // })  
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});