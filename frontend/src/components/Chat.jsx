import { useState, useEffect } from 'react';

const Chat = ({ socket, roomId, username }) => {
  const [msg, setMsg] = useState('');
  const [chat, setChat] = useState([]);

  useEffect(() => {
    socket.on('chat_message', (data) => setChat((prev) => [...prev, data]));
    return () => socket.off('chat_message');
  }, [socket]);

  const send = (e) => {
    e.preventDefault();
    if (msg.trim()) {
      socket.emit('chat_message', { roomId, username, text: msg });
      setChat((prev) => [...prev, { username, text: msg }]);
      setMsg('');
    }
  };

  return (
    <div style={{ width: '280px', background: 'white', borderRadius: '15px', padding: '10px', color: '#333', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: '350px', overflowY: 'auto', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
        {chat.map((c, i) => <div key={i}><b>{c.username}:</b> {c.text}</div>)}
      </div>
      <form onSubmit={send} style={{ display: 'flex', marginTop: '10px' }}>
        <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Guess here..." style={{ flex: 1, padding: '5px' }} />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};
export default Chat;