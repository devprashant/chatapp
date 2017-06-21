const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const uuidv1 = require('uuid/v1');

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

var uuid ;

var uidSocketMapObj = {};
var userDBArray = [];

var msgDBArray = [];


// var rooms={
//   "test":{
//     messages:[],
//     users:[],
//   }
// };


// var user={

//   uid:{
//     room:"test",

//   }
// };

/*

* If client visit /user directlty, 
* they will get a unique userid
* and if they visit /user/:uid
* they will use that id
*/
app.get('/user/', (req, res) => {
  uuid = uuidv1();
  res.redirect('http://localhost:3000/user/' + uuidv1());
});

// app.get('/uuid/', (req, res) => {
//   res.json({'uuid': uuid});
// });

app.get('/user/:uid', (req, res) => {
  // console.log(req.params.uid);
  res.sendFile(__dirname + '/public/child/index.html');
});

// var msgArray = [];

function saveMessage(roomid,msg){
  // console.log('i was here');
  // console.log(msgArray);
  var updated = false;
  
  for(var i =0; i < msgDBArray.length; i++ ){
     var msgObj = msgArray[i];
     // check if room exited
     // if true add messages to existig message array
    if(msgObj.roomid === roomid){
      if(!msgObj.messages.length) {
        msgObj.messages = []
      }
        msgObj.messages.push(msg);
        // console.log(msgArray);
        updated = true;
        break;
    }
  }

  // if updated is still false,
  // room is new, create a message object
  // and add it to the message db
  if (!updated) {
    const msgObj = {
      roomid: roomid,
      messages: [msg]
    }

    msgDBArray.push(msgObj);
  }  
}


/*
* Here username and room are updated based on uuid
*/
function setUserDB(userObj, socket){
  

  // var userDBObj = { 
  //   username: userObj.username,
  //   uuid: userObj.uuid,
  //   socketid: sokcet
  // }
  var updated = false;

  // check for uuid and update username
  for ( var i =0; i < userDBArray.length; i++){

    // true if user already in DB.
    if (userDBArray[i].uuid == userObj.uuid){
      // if (userDBArray[i].)
          userDBArray[i].username = userObj.username;
          
          // if updated is true, user is already in DB
          // just add room to the DB.
          console.log(socket.rooms);

          Object.keys(socket.rooms).forEach((room) => {
            if(userDBArray[i].rooms.indexOf(room) > -1 ) return;
            userDBArray[i].rooms.push(room);            
          });
          updated = true;
          break;
    }
  }

  // true when user is a new one and 
  // have to make its first entry 
  // to the userDB.
  if(!updated) {
    /*userObj = {
      username: name,
      uuid: uuidFromServer,
      room: roomArray
    }
    */
    const newUserObjToInsert = {
      username: userObj.username,
      uuid: userObj.uuid,
      // extract room id from single element room object
      rooms: [Object.keys(socket.rooms)[0]]  
    } 
    
    userDBArray.push(newUserObjToInsert);
  } 
  
  console.log(userDBArray); 
}

function getUserDB(uuid){

    var userObj = [];

    for ( var i=0; i< userDBArray.length; i++) {
      if(userDBArray[i].uuid === uuid){
        userObj = userDBArray[i];
        break;
      } 
    }

    // returns empty array if no room exist for uuid
    // return room array if room exist for a uuid
    return userObj;
}

io.on('connection', function(socket){

    // console.log(socket.handshake.headers.referer);


    socket.on('init', (userObj) => {
      // when initially connects, user is 
      // connected to only a single room.
      socket.to(socket.id).emit('currentRooms', Object.keys(socket.rooms)[0]);
      setUserDB(userObj, socket);
      // console.log(userObj);
    });

    
    socket.on('join', (userConnObj) => {

      // const newRoom = userConnObj.room;
      const username = userConnObj.username;

      const currentRoom = Object.keys(socket.rooms)[0];

      // socket.leave(currentRoom, () => io.to(socket.id).emit('leaveroom'), 'Joining to room');
      // get rooms array from receivers uuid
      const rUserObj = getUserDB(userConnObj.ruuid); 
      const rRooms = rUserObj.rooms;
      const rUsername = rUserObj.username;
      // fetch socketId for the user connected 
      // and send message to socket to inform him
      socket.join(rRooms, () =>
          rRooms.forEach(room => 
            io.in(room).emit('chat message', username + ': user is connected to ' + rUsername))
       );
    });
    // set username provided by client
    // socket.on('setusername', (username) => {
    //   socket.username = username;
    //   msgArray.push({roomid: socket.id, messages: ''});
    //   // socket.messages = [];
    // });

    // socket.on('setUidsocketMap', (uuid) => uidSocketMap(uuid, socket.id));

    socket.on('chat message', (msg) => {
      var chatMessage = msg;
      console.log(msg);
      // saveMessage(socket.id, chatMessage);
      
      console.log(socket.rooms);

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
    // socket.on('join', (room) => {
    //     socket.join(room, () => socket.emit('rooms', socket.rooms));        
    // });

    socket.on('disconnect', () => {
      console.log(socket.id + 'disconnected');
    });
    // socket.on('changeusername', (username) => {
    //   userDB()
    // });
    // socket.on('namechange', (oldName, newName) => {
    //   for (var room in socket.rooms){
    //     io.in(room).emit('namechange', oldName + ' is now known as ' + newName);
    //   }
    // }) 
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});