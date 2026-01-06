const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export function createSocket(): WebSocket {
  const ws = new WebSocket(
    SOCKET_URL.replace('http', 'ws') + '/socket.io/?transport=websocket'
  );
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return ws;
}
