// src/socket.js
import AsyncStorage from '@react-native-async-storage/async-storage'
import { io } from 'socket.io-client';

let socket:any = null;

export const initSocket = async () => {
  if (socket) return socket; // 🔁 Nếu đã tồn tại, trả lại

  const token = await AsyncStorage.getItem('accessToken');

  socket = io('https://be-qldv.onrender.com', {
    path: '/qldv/socket.io',
    transports: ['websocket'],
    auth: {
      token: token || '',
    },
  });

  socket.connect();

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket.id);
  });

  socket.emit('access')

  socket.on('disconnect', () => {
    console.log('⚠️ Socket disconnected');
  });

  return socket;
};

export const getSocket = () => socket;
