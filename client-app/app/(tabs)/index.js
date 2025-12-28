import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system';
import { styled } from 'nativewind'; // Nếu dùng NativeWind v4 thì cần, v2 thì không cần dòng này

export default function SpeakingScreen() {
  const [recording, setRecording] = useState();
  const [messages, setMessages] = useState([]); 
  const [loading, setLoading] = useState(false); 

  // --- LOGIC GHI ÂM & GỬI (Giữ nguyên như cũ) ---
  async function startRecording() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
    } catch (err) { console.error('Lỗi mic:', err); }
  }

  async function stopRecording() {
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    sendAudioToServer(uri);
  }

  const sendAudioToServer = async (uri) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', { uri: uri, type: 'audio/m4a', name: 'voice.m4a' });
      // Gửi kèm lịch sử chat để AI nhớ
      const historyToSend = JSON.stringify(messages.map(m => ({role: m.role, content: m.content})));
      formData.append('history', historyToSend);

      // ⚠️ THAY IP MÁY TÍNH CỦA BẠN VÀO ĐÂY (Vd: 192.168.1.5)
      const response = await fetch('http://192.168.1.10:8000/api/chat-speaking', {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = await response.json();
      
      const newMessages = [...messages, { role: 'user', content: data.user_text }, { role: 'assistant', content: data.ai_reply }];
      setMessages(newMessages);

      // Đọc to câu trả lời
      Speech.speak(data.ai_reply, { language: 'en-US', rate: 0.9 });

    } catch (error) {
      alert("Lỗi kết nối Server! Kiểm tra lại IP.");
    } finally {
      setLoading(false);
    }
  };

  // --- PHẦN GIAO DIỆN TAILWIND ---
  return (
    <View className="flex-1 bg-gray-100 p-4 pt-12">
      
      {/* 1. Header */}
      <View className="mb-4 items-center">
        <Text className="text-2xl font-bold text-blue-800">IELTS Speaking AI</Text>
        <Text className="text-sm text-gray-500">Luyện tập đối thoại trực tiếp</Text>
      </View>

      {/* 2. Khu vực Chat (Cuộn được) */}
      <ScrollView 
        className="flex-1 mb-4 bg-white rounded-2xl p-4 shadow-sm" 
        contentContainerStyle={{ paddingBottom: 20 }} // Padding đáy để không bị che bởi nút
      >
        {messages.length === 0 && (
          <Text className="text-center text-gray-400 mt-20">
            Bấm nút đỏ bên dưới để bắt đầu nói chuyện...
          </Text>
        )}

        {messages.map((msg, index) => (
          <View 
            key={index} 
            className={`flex-row mb-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {/* Bong bóng chat */}
            <View 
              className={`p-3 rounded-2xl max-w-[85%] ${
                msg.role === 'user' ? 'bg-blue-500 rounded-br-none' : 'bg-gray-200 rounded-bl-none'
              }`}
            >
              <Text className={`text-base ${msg.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                {msg.role === 'assistant' && '🤖 '} 
                {msg.content}
              </Text>
            </View>
          </View>
        ))}

        {loading && (
          <View className="items-center mt-4">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-gray-500 text-xs mt-2">AI đang suy nghĩ...</Text>
          </View>
        )}
      </ScrollView>

      {/* 3. Nút bấm Ghi âm (Nổi bật) */}
      <View className="items-center justify-center h-20">
        <TouchableOpacity
          onPress={recording ? stopRecording : startRecording}
          className={`w-20 h-20 rounded-full items-center justify-center shadow-lg border-4 ${
            recording ? 'bg-red-500 border-red-200' : 'bg-blue-500 border-blue-200'
          }`}
        >
          {recording ? (
            // Icon hình vuông (Stop)
            <View className="w-8 h-8 bg-white rounded-sm" />
          ) : (
            // Icon Micro (Giả lập bằng CSS hoặc dùng thư viện Icon)
            <View className="w-4 h-10 bg-white rounded-full" /> 
          )}
        </TouchableOpacity>
        
        <Text className="text-gray-500 mt-2 font-medium">
          {recording ? 'Đang nghe...' : 'Bấm để nói'}
        </Text>
      </View>

    </View>
  );
}