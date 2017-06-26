$(function () {

        var uuid;
        function getCookie(c_name) {
            // console.log(c_name);
              if (document.cookie.length > 0) {
                  c_start = document.cookie.indexOf(c_name + "=");
                  if (c_start != -1) {
                      c_start = c_start + c_name.length + 1;
                      c_end = document.cookie.indexOf(";", c_start);
                      if (c_end == -1) {
                          c_end = document.cookie.length;
                      }
                      return unescape(document.cookie.substring(c_start, c_end));
                  }
              }
              return "";
          }

        function setuuid(){
          uuid = getCookie('uuid');
          $('#uid').val(uuid);
          socket.emit('init', getUserObj());
          return '';
        }

        function getuuid(){
	        if(!getCookie('uuid')){
	          fetch('http://localhost:3000/uuid',{
	              method: 'GET',
	              credentials: 'same-origin'
	            })
	            .then(res => res.json())
	            .then(data => {
	              console.log(data);  

	              setuuid();   
	              // console.log(uuid);
	              console.log('uuid ' + uuid);
	              // document.getElementById('cookie_value').innerHTML = uuid;
	            })
	            .catch(err =>  console.log(err));          
	        } else {
	          setuuid();
	        }        	
        }




        // get uuid from url parsing here
        // const uuid = location.pathname.match(/\/user\/(.*)/)[1];

        // const username = $(val)

        // fetch('http://localhost:3000/uuid')
        //   .then(res => res.json())
        //   .then(uuid => {
        //     uuid = uuid;
        //     $('#uid').val(uuid.uuid)
        //   });


        var socket = io();

        // message form
        $('#fm').submit(function(){
          var msgObj = {
            uuid: uuid,
            msg: $('#m').val()
          }
          socket.emit('chat message', msgObj );
          $('#m').val('');
          return false;
        });

        // chat room join form
        $('#fjoin').submit(function(){
          // const
          const userConnObj = getUserObj();
          userConnObj.ruuid = $('#j').val();
          socket.emit('join', userConnObj, (confirmation) => {
            if (confirmation) {
              $('#messages').empty();;
            }
          });
          // $('#j').val('');
          return false;
        });

        // username form
        $('#fname').submit(function(e){
          e.preventDefault();
          // socket.emit('init', getUserObj());
          socket.emit('setusername', getUserObj());
        });

        $('#name').change(function() {
          // socket.emit('init', getUserObj);
        });

        $('#flr').submit(function(e) {
          e.preventDefault();

          socket.emit('leaveroom', getUserObj());
        });

        socket.on('chat message', function(msgObj){
          // var msgObj = {
          //   uuid: uuid,
          //   msg: $('#m').val()
          // }
          // socket.emit('getusername', msgObj.uuid);
          // socket.on('')
          socket.emit('getusername', msgObj.uuid, (username) => {
            var msg = username + " : " + msgObj.msg; 
            $('#messages').append($('<li>').text(msg));            
          });
        });

        socket.on('connect', () => {
          
          getuuid();
          // socket.emit('setusername', $('#name').val());
          // socket.emit('join', $('#j').val());
          // socket.emit('setUidsocketMap', uuid);
          console.log('socket id created from client: ' + socket.id )
          console.log(socket.rooms);
        });

        socket.on('clearmessages', (condition) => {
          $('#messages').empty();
        });

        socket.on('updateusername', (username) => {
          $('#name').val(username);
        });
        // socket.on()

        // socket.on('rooms', (msg) => console.log(/*'socket id received frmo server: ' +*/ msg));
        // socket.on('disconnect', (msg) => console.log(msg));
        // socket.on('namechange', (msg) => $('#messages').append($('<li>').text(msg)));


        socket.on('newPrivateChat', (msg) => {
          $('#messages').append($('<li>').text(msg));
        });

        socket.on('restoreMessages', (msgArray) => {
          if (msgArray){
            console.log(msgArray.toString());
            msgArray.forEach(msg => $('#messages').append($('<li>').text(msg)));
          }
        });

        socket.on("updateUserName", (username) => {
          // msgArray.forEach(msg => $('#messages').append($('<li>').text(msg)));
          $('#name').val(username);
        });
        
        function getUserObj(){
        	var userObj = { username: $('#name').val(), uuid: uuid };;
          return  userObj;
        }
      }); 