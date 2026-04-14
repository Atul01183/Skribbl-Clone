const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Watchman (Cron Job) ke liye route
app.get('/', (req, res) => res.send('Backend is Awake!'));

const rooms = {}; 
const words = ["Laptop", "Pizza", "Guitar", "Mountain", "Candle", "Robot", "Elephant", "Sunglasses", "Burger", "Rocket", "Banana", "Doctor", "Diamond", "Ocean"];

io.on('connection', (socket) => {
  socket.on('join_room', ({ roomId, username }) => {
    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = { players: [], currentDrawer: null, currentWord: "", round: 1, isStarted: false, timeLeft: 60, pickingWord: false };
    }
    rooms[roomId].players = rooms[roomId].players.filter(p => p.username !== username);
    rooms[roomId].players.push({ id: socket.id, username, score: 0 });
    io.to(roomId).emit('player_joined', rooms[roomId].players);
  });

  socket.on('start_game', (roomId) => {
    const room = rooms[roomId];
    if (room && room.players.length >= 2) {
      room.isStarted = true;
      room.round = 1;
      room.players.forEach(p => p.score = 0); // Reset scores if playing again
      io.to(roomId).emit('player_joined', room.players);
      prepareNewRound(roomId);
    }
  });

  function prepareNewRound(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    const drawerIndex = (room.round - 1) % room.players.length;
    room.currentDrawer = room.players[drawerIndex].id;
    room.pickingWord = true;

    const choices = [];
    while(choices.length < 3) {
      let r = words[Math.floor(Math.random() * words.length)];
      if(!choices.includes(r)) choices.push(r);
    }

    io.to(roomId).emit('clear_canvas');
    io.to(roomId).emit('round_start', { drawerId: room.currentDrawer, round: room.round, pickingWord: true });
    io.to(room.currentDrawer).emit('get_word_choices', choices);
  }

  socket.on('word_chosen', ({ roomId, word }) => {
    const room = rooms[roomId];
    if (!room) return;
    room.currentWord = word;
    room.pickingWord = false;
    room.timeLeft = 60;

    if (room.timer) clearInterval(room.timer);
    room.timer = setInterval(() => {
      room.timeLeft--;
      io.to(roomId).emit('timer_update', room.timeLeft);
      
      if (room.timeLeft === 30) {
        let hint = room.currentWord[0] + " _ ".repeat(room.currentWord.length - 1);
        io.to(roomId).emit('chat_message', { username: 'System', text: `Hint: ${hint}` });
      }

      if (room.timeLeft <= 0) endRound(roomId, "Time's up!");
    }, 1000);

    io.to(roomId).emit('word_chosen_broadcast', { drawerId: room.currentDrawer, wordLength: word.length });
  });

  function endRound(roomId, msg) {
    const room = rooms[roomId];
    if (!room) return;
    clearInterval(room.timer);
    io.to(roomId).emit('chat_message', { username: 'System', text: `${msg} Word was: ${room.currentWord}` });
    
    // --- NAYA LOGIC: GAME OVER CHECK --- [cite: 20, 61]
    const totalTurns = room.players.length * 2; // Har player 2 baar draw karega

    if (room.round >= totalTurns) {
      // Game Khatam - Leaderboard Bhejo
      const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
      io.to(roomId).emit('game_over', { winner: sortedPlayers[0], leaderboard: sortedPlayers });
      room.isStarted = false; // Wapas lobby start karne ke liye
    } else {
      room.round++;
      setTimeout(() => { if(rooms[roomId]) prepareNewRound(roomId); }, 3000);
    }
  }

  socket.on('draw_data', (data) => socket.to(data.roomId).emit('draw_data', data));
  socket.on('clear_canvas', (roomId) => socket.to(roomId).emit('clear_canvas'));

  socket.on('chat_message', (data) => {
    const room = rooms[data.roomId];
    if (room?.isStarted && !room.pickingWord && data.text.toLowerCase().trim() === room.currentWord.toLowerCase() && socket.id !== room.currentDrawer) {
      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.score += 100;
        io.to(data.roomId).emit('correct_guess', { username: data.username, players: room.players });
        endRound(data.roomId, `${data.username} guessed it!`);
      }
    } else {
      io.to(data.roomId).emit('chat_message', data);
    }
  });

  socket.on('disconnect', () => {
    for (const rid in rooms) {
      rooms[rid].players = rooms[rid].players.filter(p => p.id !== socket.id);
      io.to(rid).emit('player_joined', rooms[rid].players);
    }
  });
});

server.listen(3001, () => console.log("Final Server running on 3001"));