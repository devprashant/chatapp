const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const uuidv1 = require('uuid/v1');
var cookieParser = require('cookie-parser');
var path = require('path');

const PORT = process.env.PORT || 3000;


app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


var hostname;
app.get('/', (req, res) => {
  hostname = ( req.headers.host.match(/:/g) ) ? req.headers.host.slice( 0, req.headers.host.indexOf(":") ) : req.headers.host;
  res.redirect('http://' + hostname + ':' + PORT + '/chat/');
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
// app.get('/user/', (req, res) => {
//   uuid = uuidv1();
//   res.redirect('http://'+ hostname + ":" + PORT + '/user/' + uuidv1());
// });

// app.get('/uuid/', (req, res) => {
//   res.json({'uuid': uuid});
// });

// app.get('/user/:uid', (req, res) => {
//   // console.log(req.params.uid);
//   res.sendFile(__dirname + '/public/child/index.html');
// });

app.get('/chat', (req, res) => {
  // console.log(req.params.uid);
  res.sendFile(__dirname + '/public/child/index.html');
});

app.get('/uuid', (req, res) => {
  uuid = uuidv1();
  res.cookie('uuid', uuid).send({msg: 'uuid received'});
});

// var msgArray = [];

function saveMessage(roomid,msgObj){
  // console.log('i was here');
  // console.log(msgArray);


  /* structure of msg object to be inserted in DB
  *  msgObj = {
  *     uuid: uuid,
  *      msg: msg
  *  }
  */

  /* structure of msg object in DB
  * msgObjDB = {
  *   room: roomid,
  *   messages: [{uuid:uuid, msg: msg}]
  * }
  */
  var updated = false;

  for(var i =0; i< msgDBArray.length; i++){
    // check if room exited
    // if true add messages to existig message array
    if(msgDBArray[i].roomid == roomid){
      msgDBArray[i].messages.push(msgObj);
      updated = true;
      break;
    }
  }

  // if updated is still false,
  // room is new, create a message object
  // and add it to the message db
  if(!updated) {
    const msgObjDB = {
      roomid: roomid,
      messages: [msgObj]
    };

    msgDBArray.push(msgObjDB);
  }

  console.log("msgDBArray " + JSON.stringify(msgDBArray));
}
  
//   for(var i =0; i < msgDBArray.length; i++ ){
//      var msgObj = msgDBArray[i];
     
//     if(msgObj.roomid === roomid){
//       // this if block should never run
//       if(!msgObj.messages.length) {
//         msgObj.messages = []
//       }
//         msgObj.messages.push(msg);
//         // console.log(msgArray);
//         updated = true;
//         break;
//     }
//   }

//   /
//   if (!updated) {
//     const msgObj = {
//       roomid: roomid,
//       messages: [msg]
//     }

//     msgDBArray.push(msgObj);
//   }
//   // console.log("msgDBArray " + JSON.stringify(msgDBArray));  
// }

function getMessage(roomid){
  
  var msgObjDB = {};
  for (var i = 0; i < msgDBArray.length; i++){
    
    if(msgDBArray[i].roomid === roomid){
      
      
      msgObjDB = msgDBArray[i];
      break;
    }
  }
  // console.log("message obj");
  // console.log(msgObj);
  return msgObjDB;
}

/*
* Here username and room are updated based on uuid
* returns roomid
*/
function setUserDB(userObj, socket){  

      /*userObj = {
      *username: name,
      *uuid: uuidFromServer,
      *room: roomid
      * //room: roomArray
      *}
      */
  var updated = false;

  var room ;
  for ( var i = 0; i < userDBArray.length; i++ ){

    // true if user already in DB.
    if (userDBArray[i].uuid == userObj.uuid){
      // if (userDBArray[i].)
          userDBArray[i].username = userObj.username;
          userDBArray[i].sockets.push(socket.id);
          
          // if updated is true, user is already in DB
          // just add room to the DB.
          // console.log(socket.rooms);
          room = userDBArray[i].rooms;
          // Object.keys(socket.rooms).forEach((room) => {
          //   if(userDBArray[i].rooms.indexOf(room) > -1 ) return;
          //   userDBArray[i].rooms.push(room);            
          // });
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
    room = Object.keys(socket.rooms)[0];

    // console.log(userObj.username);

    const newUserObjToInsert = {
      username: userObj.username,
      uuid: userObj.uuid,
      // extract room id from single element room object
      rooms: room,
      sockets: [socket.id]
      // rooms: [Object.keys(socket.rooms)[0]]  
    } 
    
    userDBArray.push(newUserObjToInsert);
  } 
  
  // console.log("==================== userdbarray :" + JSON.stringify(userDBArray)); 

  return room;
}

function getUserDB(uuid){

    var userObj = {};

    for (var i=0; i< userDBArray.length; i++) {
      if(userDBArray[i].uuid === uuid){
        userObj = userDBArray[i];
        break;
      } 
    }

    // returns empty array if no room exist for uuid
    // return room array if room exist for a uuid
    return userObj;
}

function updateRoomForUser(uuid, room){

  // var room;

  for (var i=0; i< userDBArray.length; i++) {
      if(userDBArray[i].uuid === uuid){
        userDBArray[i].rooms = room;
          console.log("====" + JSON.stringify(userDBArray[i]));
        break;
      }
  }

  return userDBArray[i].rooms;
}

function updateUserName(userObj) {

  var uuid = userObj.uuid;
  var username = userObj.username;

  for (var i=0; i< userDBArray.length; i++) {
      if(userDBArray[i].uuid === uuid){
        userDBArray[i].username = username;
          console.log("====" + JSON.stringify(userDBArray[i]));
        break;
      } 
  }

  return userDBArray[i];
}

io.on('connection', function(socket){

    // console.log(socket.handshake.headers.referer);


    //===========================================init===========================================
    socket.on('init', (userObj) => {
      // when initially connects, user is 
      // connected to only a single room.
      // socket.to(socket.id).emit('currentRooms', Object.keys(socket.rooms)[0]);

      // if user refreshes the web page he needs username 
      // that he previously entered in DB.
      // if user is new, use username provided by him

      var username;
      var uuid = userObj.uuid;

      // console.log(userObj.username.length);

      if(userObj.username.length > 0) {
        username = userObj.username;       
      } else  {
        // if username not set check for existence of user
        // this will run on refresh
        var userObjFromDB = getUserDB(uuid);

        // if true user exists in db
        // if false user does not exist in db
        // and user doesn't have given his name
        // so set username to guest
        // console.log("object key length: " + Object.keys(userObjFromDB).length );
        
        if(Object.keys(userObjFromDB).length) {
          username = userObjFromDB.username;
          // console.log('in if ' + username);
        } else {
            username = 'guest';
            // console.log(' in else ' + username);
        }
      }

      // console.log("username from init: " + username); 

      var updatedUserObj = {
        username: username,
        uuid: uuid
      };

      socket.emit('updateUserName', updatedUserObj.username);

      // if user already have a room joined earlier 
      // user will leave current room and join
      // previous room and if user is new he will have curRoom == preRoom
      var preRoom = setUserDB(updatedUserObj, socket); 
      var curRoom = Object.keys(socket.rooms)[0];
      // console.log(" rooms before leaving " + JSON.stringify(socket.rooms));
      
      // var msgObj = {
      //     uuid: updatedUserObj.uuid,
      //     msg: ' is connecting'
      // };
      //   // console.log("socket id before leaving " + socket.id);
      //   io.to(socket.id).emit('chat message', msgObj);
        console.log(" room for " + updatedUserObj.username + " : " + preRoom )
        var preMessagesObjDB = getMessage(preRoom);
        // console.log('typeof ' + typeof(preMessagesObjDB.messages));
        if (preMessagesObjDB.messages != null){
          // console.log("previous messages " + JSON.stringify(preMessagesObjDB.messages));
          if(preMessagesObjDB.messages.length){
              // console.log("i was here");
              // console.log("previous messages")
              preMessagesObjDB.messages.forEach((preMessagesObj) => {
              socket.emit('chat message', preMessagesObj);
            });              
          }            
        }

      socket.leave(curRoom, () => {
        // console.log(' leaving room for user: ' + username + ' is ' + curRoom);
        // console.log(" rooms when leaving " + JSON.stringify(socket.rooms));
        var msgObj = {
          uuid: updatedUserObj.uuid,
          msg: ' is connecting'
        };
        // console.log("socket id after leaving " + socket.id);
        // io.in(socket.id).emit('chat message', msgObj);

        socket.join(preRoom, () => {
          var msgObj = {
            uuid: updatedUserObj.uuid,
            msg: ' is connected'
          };
          // console.log("socket id after joining " + socket.id);
          // console.log(" preRoom for " + updatedUserObj.username + " " + preRoom);
          // console.log(" curRoom for " + updatedUserObj.username + " " + curRoom);
          // console.log(" socket room for " + updatedUserObj.username + " " + JSON.stringify(socket.rooms));
          var test = {};
          console.log( ' current room for user: ' + username + ' is ' + preRoom);
          // io.in(preRoom).emit('chat message', msgObj);
          // io.in(preRoom).emit('setusername', user)
        });
      });      

  // console.log("preroom before requesting message read " + preRoom);
  //   var preMessagesObj = getMessage(preRoom);
      // console.log("check condition for roomid equal to msg array roomid");
      // console.log(room === preMessagesObj.roomid);
      // console.log("actual message object");
  //console.log("previous Messages: " + JSON.stringify(preMessagesObj));
      // if(preMessagesObj) && preMessages.length) {
        // if(preMessagesObj.messages) 
  //io.in(preRoom).emit('restoreMessages',preMessagesObj.messages);
      // }
      // console.log(userObj);
    });
  //==================================init//////////////////////////////////////////////////////

  //====================================join================================================

    
    socket.on('join', (userConnObj, fn) => {

      // const newRoom = userConnObj.room;
      const username = userConnObj.username;

      // const currentRoom = Object.keys(socket.rooms)[0];
      /*
      * var userConnObj = {
      *   username: username,
      *   uuid: uuid, // sender uuid
      *   ruuid: ruuid // receiver uuid
      *}
      *
      */
      var userObj = {
        username: userConnObj.username,
        uuid: userConnObj.uuid     
      }      

      // socket.leave(currentRoom, () => io.to(socket.id).emit('leaveroom'), 'Joining to room');
      // get rooms array from receivers uuid
      const rUserObj = getUserDB(userConnObj.ruuid);
      var rRooms;
      var rUsername;
      if(Object.keys(rUserObj).length){
        rRooms = rUserObj.rooms;
        rUsername = rUserObj.username;
      } /*else {
        rRooms = userConnObj.uuid;
      }*/
      
      // var room = setUserDB(userObj, socket);
      var newRoom = updateRoomForUser(userObj.uuid, rRooms);
      console.log("updated room " + newRoom );
      console.log("current room in DB " + userObj.username + " is " + getUserDB(userObj.uuid).rooms);
        // leave current room
      // console.log("previous room for " + userObj + room);
      var curRoom = Object.keys(socket.rooms)[0];
      // socket.leave(, () => {
      //   // updateRoomForUser(userObj.uuid, rRooms);
      //   io.to(socket.id).emit('chat message', username + ': connecting to ' + rUsername)
      // });
      // fetch socketId for the user connected 
      // and send message to socket to inform him
      // socket.join(rRooms, () =>
      //     rRooms.forEach(room => 
      //       io.in(room).emit('chat message', username + ': user is connected to ' + rUsername))
      //  );
      var msgObjForAll = {
        uuid : userObj.uuid,
        msg: userObj.username + ' is connected ' // + userConnObj.username
      }

      // io.in(preRoom).emit('chat message', msgObj, () => {
      io.in(newRoom).emit('chat message', msgObjForAll);

      var preMessagesObjDB = getMessage(newRoom);
      
      var allSocketForUser = getUserDB(userObj.uuid).sockets; // this is an array
                 
        allSocketForUser.forEach(socketid => {
          const socket = io.sockets.connected[socketid];
          if(socket) {
            socket.leave(curRoom, () => {
              socket.join(newRoom, () => {
                // var roomsNow = socket.rooms;
                // var test = 'i';
                // socket.emit('clearMessages', 'true');
                var msgObj = {
                  uuid: userObj.uuid,
                  msg: ' is connected to ' + rUsername
                };
                socket.emit('chat message', msgObj);
                if (preMessagesObjDB.messages != null){
                  // console.log("previous messages " + JSON.stringify(preMessagesObjDB.messages));
                  if(preMessagesObjDB.messages.length){
                      preMessagesObjDB.messages.forEach((preMessagesObj) => {
                      socket.emit('chat message', preMessagesObj);
                    });              
                  }            
                }
              })
            });
          }
        });

      // fn(true);
      
      // console.log('typeof ' + typeof(preMessagesObjDB.messages));
      
      // socket.leave(curRoom, () => {
      //   // console.log(' leaving room for user: ' + username + ' is ' + curRoom);
      //   // console.log(" rooms when leaving " + JSON.stringify(socket.rooms));
      //   var msgObj = {
      //     uuid: userObj.uuid,
      //     msg: ' is connecting'
      //   };

      //   io.to(socket.id).emit('chat message', msgObj);

      //   socket.join(newRoom, () => {
      //     var msgObj = {
      //       uuid: userObj.uuid,
      //       msg: ' is connected to ' + rUsername
      //     };

      //     // updateRoomForUser(userObj, newRoom);

      //     console.log(" rooms after leaving for "+ userObj.username + " " + JSON.stringify(socket.rooms));
      //     // console.log( ' current room for user: ' + username + ' is ' + preRoom);
      //     // io.in(newRoom).emit('chat message', msgObj);
      //     // io.in(preRoom).emit('setusername', user)

      //   });
      // });
      // console.log( ' cuurent room for user: through join ' + userObj.username + " is " + JSON.stringify(socket.rooms));
      // socket.join(rRooms, () => io.in(rRooms).emit('chat message', username + ': user is connected to ' + rUsername));
    });
    //=========================================join///////////////////////////////////////////////
    // set username provided by client
    // socket.on('setusername', (username) => {
    //   socket.username = username;
    //   msgArray.push({roomid: socket.id, messages: ''});
    //   // socket.messages = [];
    // });

    // socket.on('setUidsocketMap', (uuid) => uidSocketMap(uuid, socket.id));

    //=================================chat message====================================================
    socket.on('chat message', (msgObj) => {
      // var chatMessage = msg;
      console.log("msg obj received" + JSON.stringify(msgObj));

      // a user currently can have only one room
      // so sockets.rooms can contain only one entry at a time
      // console.log("================user room for " + getUserDB(msgObj.uuid).username 
      //             + " is "  + getUserDB(msgObj.uuid).rooms + " and sockets rooms are"
      //             + JSON.stringify(socket.rooms));
      console.log("====socket rooms in chat message " + JSON.stringify(socket.rooms));
      Object.keys(socket.rooms).forEach(room => saveMessage(room, msgObj));
      // saveMessage(socket.id, chatMessage);
      
      // console.log(socket.rooms);

           for (var room in socket.rooms){
          // socket.messages.push(msg);
          // console.log(socket.messages);

          // console.log(socket.id + ' : ' + room + " : " + socket.rooms[room]);
          // console.log(socket.rooms[room] === room);
          // console.log(room === socket.id);

          // this condition is important as 
          // when user sends message it is broadcasted to all
          // rooms and if a user is connected to multiple rooms
          // it broadcast to all rooms and user have multiple messages
          // *here if condition handles this issue
          // if(room === socket.id) continue;
          io.in(room).emit('chat message', msgObj);
      }
    });

    //===============================chat message///////////////////////////////////////////////

    //===============================getusername================================================
    socket.on('getusername', (uuid, fn) => {
      var username = getUserDB(uuid).username;
      fn(username);
      // socket.emit('changeusername', username);     
    });
    //================================getusername///////////////////////////////////////////////

    //===============================setusername===============================================
    socket.on('setusername', (userObj) => {
      var oldUserName = getUserDB(userObj.uuid).username;
      var updatedUserObj = updateUserName(userObj);
      var userRoom = getUserDB(updatedUserObj.uuid).rooms;

      var msgObj ={
        uuid: updatedUserObj.uuid,
        msg: oldUserName + ' is now known as ' + updatedUserObj.username
      };

      socket.emit('updateusername', updatedUserObj.username);

      io.in(userRoom).emit('chat message', msgObj)
    });
    //=====================================setusername/////////////////////////////////////////

    //==================================leaveroom=============================================
    socket.on('leaveroom', (userObj) => {
      var newRoom = uuidv1();
      var uuid = userObj.uuid;
      var userObjFromDB = getUserDB(uuid);
      var preRoom = userObjFromDB.rooms;
      var username = userObjFromDB.username;
      
      var msgObjForAll = {
        uuid : uuid,
        msg: username + ' left the room '
      }

      // io.in(preRoom).emit('chat message', msgObj, () => {
      io.in(preRoom).emit('chat message', msgObjForAll);

      var allSocketForUser = userObjFromDB.sockets; // this is an array
        

      updateRoomForUser(userObjFromDB.uuid, newRoom);
        
        allSocketForUser.forEach(socketid => {
          const socket = io.sockets.connected[socketid];
          if(socket) {
            socket.leave(preRoom, () => {
              socket.join(newRoom, () => {
                // var roomsNow = socket.rooms;
                // var test = 'i';
                var msgObjForUser = {
                  uuid: uuid,
                  msg: username + ' joined new room'
                };
                socket.emit('chat message', msgObjForUser);
              })
            });
          }
        });
      // });
      // socket.emit('chat message', msgObj)
    });

    //=====================================leaveroom/////////////////////////////////////////////

    // join room based on room id provided by client
    // socket.on('join', (room) => {
    //     socket.join(room, () => socket.emit('rooms', socket.rooms));        
    // });

    // socket.on('disconnect', () => {
    //   console.log(socket.id + 'disconnected');
    // });
    // socket.on('changeusername', (username) => {
    //   userDB()
    // });
    // socket.on('namechange', (oldName, newName) => {
    //   for (var room in socket.rooms){
    //     io.in(room).emit('namechange', oldName + ' is now known as ' + newName);
    //   }
    // }) 
});

http.listen(PORT, function(){
  console.log('listening on *:' + PORT );
});