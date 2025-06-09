import { messageApi } from '@/api';
import { getSocket } from '@/socket';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Message = {
  id: string;
  text: string;
  sender: string;
};

const Conversation = () => {
  const { id: partnerId } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');

  // Lấy tin nhắn lịch sử
  useEffect(() => {
    const fetchMessages = async () => {
      if (!partnerId) return;
      try {
        const res = await messageApi.getMessages(partnerId);
        const formatted = res.data.data.map((item: any) => ({
          id: item._id,
          text: item.text,
          sender: item.sender,
        }));
        setMessages(formatted.reverse()); // đảo lại để tin nhắn mới ở dưới
      } catch (error) {
        console.error('Lỗi khi tải tin nhắn:', error);
      }
    };

    fetchMessages();
  }, [partnerId]);

  // Lắng nghe tin nhắn từ socket
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

     const handleMessage = (data: Message) => {
      console.log('Nhận từ: ', data)
        setMessages((prev) => [ data,...prev]);
      
    };

    socket.on('chat', handleMessage);
    return () => {
      socket.off('chat', handleMessage);
    };
  }, []);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const text = inputText.trim();
    const newMessage = {id:'', text:inputText, sender: 'me'}
     setMessages((prev) => [ newMessage,...prev]);
    setInputText('');

    try {
      const socket = getSocket();
      socket?.emit('chat', {
        partnerId,
        text,
      });

      // Không thêm vào tin nhắn ngay, chỉ hiển thị khi server gửi lại qua socket
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isMe = item.sender !== partnerId;
    return (
      <View
        style={[
          styles.messageBubble,
          isMe ? styles.messageRight : styles.messageLeft,
        ]}
      >
        <Text style={[styles.messageText, isMe && { color: 'white' }]}>
          {item.text}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 150}
      >
        <FlatList
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.messageList}
          inverted
        />

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Nhập tin nhắn..."
            value={inputText}
            onChangeText={setInputText}
            style={styles.textInput}
          />
          <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
            <Text style={{ color: 'white' }}>Gửi</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Conversation;

const styles = StyleSheet.create({
  messageList: {
    padding: 16,
    paddingBottom: 80,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  messageLeft: {
    backgroundColor: '#e5e7eb',
    alignSelf: 'flex-start',
  },
  messageRight: {
    backgroundColor: '#3b82f6',
    alignSelf: 'flex-end',
  },
  messageText: {
    color: 'black',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#d1d5db',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
