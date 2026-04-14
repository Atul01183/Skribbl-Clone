# 🎨 Skribbl.io Clone (Multiplayer Drawing & Guessing Game)

Hey! Welcome to my Skribbl.io clone project. This is a real-time multiplayer web game where one person draws a given word, and the others try to guess it to score points. 

I built this project to learn about WebSockets, real-time data syncing, and managing game states across multiple users.

### 🌐 Live Demo
Play the game here: **[https://skribbl-clone-mu.vercel.app](https://skribbl-clone-mu.vercel.app)** *(No sign-up required, just enter a name and a room ID to play with friends!)*

---

### 🚀 Tech Stack Used
* **Frontend:** React.js, Vite, HTML5 Canvas API (for drawing)
* **Backend:** Node.js, Express.js
* **Real-time Communication:** Socket.io
* **Deployment:** Vercel (Frontend), Render (Backend)

---

### 🎮 Features
1. **Multiplayer Rooms:** Join private rooms using a custom Room ID.
2. **Real-time Drawing:** See the drawer's strokes instantly using WebSockets.
3. **Turn-based Logic:** Everyone gets a turn to pick a word and draw.
4. **Drawing Tools:** Colors palette, brush size adjustment, eraser, and clear canvas.
5. **Live Chat & Auto-Referee:** Server automatically checks chat messages for correct guesses and awards points.
6. **Game Over & Leaderboard:** Shows the final winner and scores after everyone has drawn twice.

---

### 🏗️ Architecture & How It Works (Simple Explanation)

If you're wondering how the magic happens behind the scenes, here is the breakdown:

**1. The Real-time Connection (Socket.io)**
Instead of regular HTTP requests (which are slow for games), I used Socket.io. Think of it like an open phone line between the Frontend and the Backend. When a user joins, they are placed in a specific "Room" so their drawing and chat only stay within that group.

**2. The Drawing Sync (Canvas API)**
When the Drawer clicks and moves their mouse on the screen, the HTML5 Canvas captures the exact `(X, Y)` coordinates of the pen, along with the color. 
* Frontend sends these coordinates to the Backend -> `socket.emit('draw_data', ...)`
* Backend immediately broadcasts these coordinates to everyone else in the room.
* Everyone else's Canvas uses those coordinates to draw the exact same line on their screen.

**3. The Game Referee (Backend Logic)**
The Node.js server acts as the game referee. It keeps track of:
* Whose turn it is (using an array index of players).
* The secret word (sent only to the drawer).
* The 60-second timer.
When a guesser types in the chat, the server secretly compares their text with the `secretWord`. If it matches, the server stops the chat from showing the actual word, awards 100 points to the guesser, and tells everyone "Player guessed the word!".

---

### 💻 How to run this locally on your PC

**1. Clone the repository:**
\`git clone <your-github-repo-link>\`

**2. Start the Backend:**
\`cd backend\`
\`npm install\`
\`node server.js\` (Runs on localhost:3001)

**3. Start the Frontend:**
\`cd frontend\`
\`npm install\`
\`npm run dev\` (Runs on localhost:5173)

Enjoy the game! 🚀
