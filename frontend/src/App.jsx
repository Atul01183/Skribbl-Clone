import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import Board from './components/Board';
import Chat from './components/Chat';

const socket = io('https://skribbl-backend-lofb.onrender.com');

function App() {
  const [isJoined, setIsJoined] = useState(false);
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [players, setPlayers] = useState([]);
  const [drawerId, setDrawerId] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const [secretWord, setSecretWord] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [wordChoices, setWordChoices] = useState([]);
  
  // Naye States Leaderboard ke liye
  const [isGameOver, setIsGameOver] = useState(false);
  const [finalLeaderboard, setFinalLeaderboard] = useState([]);

  const audioRef = useRef(new Audio("https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3"));

  useEffect(() => {
    socket.on('player_joined', (p) => setPlayers(p));
    socket.on('round_start', (data) => { 
      setIsStarted(true); 
      setIsGameOver(false); // Game shuru hone par game over screen hatao
      setDrawerId(data.drawerId); 
      setWordChoices([]); 
      setSecretWord('');
    });
    socket.on('get_word_choices', (choices) => setWordChoices(choices));
    socket.on('word_chosen_broadcast', (data) => { setWordChoices([]); });
    socket.on('secret_word', (word) => setSecretWord(word));
    socket.on('timer_update', (t) => setTimeLeft(t));
    socket.on('correct_guess', (data) => setPlayers(data.players));
    
    // NAYA: Game Over Event
    socket.on('game_over', (data) => {
      setIsGameOver(true);
      setIsStarted(false);
      setFinalLeaderboard(data.leaderboard);
      setWordChoices([]);
    });

    return () => { 
      socket.off('player_joined'); socket.off('round_start'); socket.off('timer_update'); socket.off('game_over'); 
    };
  }, []);

  const selectWord = (word) => {
    socket.emit('word_chosen', { roomId, word });
    setSecretWord(word);
    setWordChoices([]);
  };

  return (
    <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', minHeight: '100vh', color: 'white', padding: '20px', fontFamily: '"Comic Sans MS", cursive' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 50px' }}>
        <h1>Skribbl Clone 🎨</h1>
        <button onClick={() => audioRef.current.paused ? audioRef.current.play() : audioRef.current.pause()} style={{ fontSize: '24px', cursor: 'pointer', border: 'none', background: 'none' }}>🔊</button>
      </div>

      {/* GAME OVER SCREEN (Overlay) */}
      {isGameOver && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200, flexDirection: 'column' }}>
          <div style={{ background: 'white', padding: '40px', borderRadius: '20px', color: 'black', textAlign: 'center', minWidth: '400px' }}>
            <h1 style={{ fontSize: '40px', margin: '0 0 20px 0' }}>🏆 GAME OVER!</h1>
            <h2 style={{ color: '#2ed573' }}>Winner: {finalLeaderboard[0]?.username}</h2>
            
            <div style={{ background: '#f1f2f6', borderRadius: '10px', padding: '15px', marginTop: '20px' }}>
              <h3 style={{ borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>Final Scoreboard</h3>
              {finalLeaderboard.map((p, index) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', padding: '8px 0', fontWeight: index === 0 ? 'bold' : 'normal' }}>
                  <span>{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤'} {p.username}</span>
                  <span>{p.score} pts</span>
                </div>
              ))}
            </div>

            <button onClick={() => setIsGameOver(false)} style={{ marginTop: '30px', padding: '15px 30px', background: '#ffa502', border: 'none', color: 'white', borderRadius: '8px', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>
              Back to Lobby 🔄
            </button>
          </div>
        </div>
      )}

      {!isJoined ? (
        <form onSubmit={(e) => { e.preventDefault(); socket.emit('join_room', { roomId, username }); setIsJoined(true); }} style={{ marginTop: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <input placeholder="Name" onChange={e => setUsername(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', width: '250px', marginBottom: '15px' }} />
          <input placeholder="Room ID" onChange={e => setRoomId(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', width: '250px', marginBottom: '15px' }} />
          <button type="submit" style={{ padding: '12px 40px', background: '#2ed573', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', border: 'none', width: '275px' }}>JOIN GAME</button>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ background: 'rgba(0,0,0,0.6)', padding: '15px', borderRadius: '15px', display: 'flex', gap: '50px', marginBottom: '20px', minWidth: '850px', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '24px', color: '#ffa502' }}>⏱ {timeLeft}s</div>
            <div style={{ fontSize: '22px' }}>{isStarted ? (socket.id === drawerId ? (secretWord ? `DRAW: ${secretWord}` : "CHOOSE A WORD!") : "GUESS THE WORD!") : "WAITING..."}</div>
            <div>Room: {roomId}</div>
          </div>

          {/* Word Selection Overlay for Drawer */}
          {wordChoices.length > 0 && socket.id === drawerId && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
              <div style={{ background: 'white', padding: '30px', borderRadius: '20px', color: 'black' }}>
                <h2>Pick a word to draw:</h2>
                <div style={{ display: 'flex', gap: '15px' }}>
                  {wordChoices.map(w => <button key={w} onClick={() => selectWord(w)} style={{ padding: '10px 20px', cursor: 'pointer', background: '#ffa502', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}>{w}</button>)}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ width: '220px', background: 'rgba(0,0,0,0.6)', padding: '15px', borderRadius: '15px' }}>
              <h3>Players</h3>
              {players.map(p => <div key={p.id} style={{ background: p.id === drawerId ? '#ffa502' : 'transparent', color: p.id === drawerId ? 'black' : 'white', padding: '8px', borderRadius: '5px' }}>{p.id === drawerId ? '✏️' : '👤'} {p.username}: {p.score}</div>)}
              {!isStarted && players.length >= 2 && <button onClick={() => socket.emit('start_game', roomId)} style={{ marginTop: '20px', padding: '10px', background: '#2ed573', border: 'none', color: 'white', borderRadius: '8px', width: '100%', cursor: 'pointer', fontWeight: 'bold' }}>START GAME</button>}
            </div>
            <Board socket={socket} roomId={roomId} isDrawer={socket.id === drawerId && secretWord !== ''} />
            <Chat socket={socket} roomId={roomId} username={username} />
          </div>
        </div>
      )}
    </div>
  );
}
export default App;