import AsyncStorage from '@react-native-async-storage/async-storage'
import { io } from 'socket.io-client';

let socket:any = null;

export const initSocket = async () => {
  if (socket) return socket;

  const token = await AsyncStorage.getItem('accessToken');

  socket = io('https://be-qldv.onrender.com', {
    path: '/qldv/socket.io',
    transports: ['websocket'],
    auth: {
      token: token || '',
    },
    reconnection: true,
  });

  socket.connect();

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket.id);
  });

  socket.on('connect_error', (error:any) => {
    console.error('Socket connection error:', error);
  });

  socket.emit('access');

  return socket;
};

export const getSocket = () => socket;