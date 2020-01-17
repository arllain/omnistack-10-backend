const socketio = require('socket.io');

exports.setupWebsocket = server => {
  const io = socketio(server);

  io.on('connection', server => {
    console.log(socket.id);
  });
};
