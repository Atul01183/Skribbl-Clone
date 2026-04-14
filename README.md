# Skribbl.io Clone 🎨

Hey! This is my take on the classic Skribbl.io drawing game. I built this as a full-stack assignment to wrap my head around real-time WebSockets and the HTML5 Canvas API. It was quite a ride figuring out how to sync the drawing strokes perfectly for everyone!

## 🚀 Live Demo
* **Frontend:** [YOUR_VERCEL_LINK_HERE] 
* **Backend:** [YOUR_RENDER_LINK_HERE] 
*(Note: The backend is hosted on Render's free tier, so it might take 30-40 seconds to wake up if it's been asleep. Please be patient!)*

## 🛠️ Stuff I Used
* **Frontend:** React.js, Vite, HTML5 Canvas API
* **Backend:** Node.js, Express.js
* **Real-time Engine:** Socket.io

## ✨ What it actually does
* **Multiplayer Rooms:** Just enter a name and a room ID, and you're in.
* **Real-time Drawing:** When the drawer moves their mouse, the `(x, y)` coordinates are instantly broadcasted to everyone else in the room.
* **Turns & Words:** The drawer gets 3 random words to choose from. Once they pick, the round starts.
* **Chat & Guessing:** You can type your guesses in the chat. If you guess the exact word, the server hides your message and gives you points instead.
* **Tools:** Basic colors, a clear button, and an Undo button (this one took some array manipulation to get right!).
* **Auto-Hints:** If players are struggling, the game automatically drops a hint (like `C _ _ _ _ _`) when there are 30 seconds left.

## 🧠 The tricky part (How drawing sync works)
The hardest part was making sure everyone sees the same drawing. Basically, I used the `onMouseMove` event on the Canvas. Every time the drawer's mouse moves, I capture the previous and current coordinates, throw them into a small object, and `socket.emit` it to the server. The server then just bounces that data to everyone else in the room so their local canvas draws the exact same line.

## 💻 Want to run it locally?

If you want to test it on your own machine, here's how:

### 1. Clone the repo
```bash
### 2. Start the Backend
cd server
npm install
node server.js

*(Server will start running on port 3001)*

### 3. Start the Frontend
Open a new terminal window:

cd frontend
npm install
npm run dev

*(Make sure to change the socket connection URL in App.jsx back to http://localhost:3001 before running locally!)*

---
*Built with coffee and lots of debugging by Atul* ✌️
git clone [https://github.com/Atul01183/Skribbl-Clone.git](https://github.com/Atul01183/Skribbl-Clone.git)
cd Skribbl-Clone
