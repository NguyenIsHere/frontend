import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';

type PasswordInputProps = {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  placeholder = 'Nhập mật khẩu',
  disabled = false,
}) => {
  const [secure, setSecure] = useState(true);

  return (
    <View>
    
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 6,
          height:50,
          paddingHorizontal: 10,
          backgroundColor: disabled ? '#f0f0f0' : '#fff',
        }}
      >
        <TextInput
          style={{ flex: 1, paddingVertical: 10 }}
          placeholder={placeholder}
          value={value}
          onChangeText={onChange}
          secureTextEntry={secure}
          editable={!disabled}
        />
        <TouchableOpacity onPress={() => setSecure(!secure)}>
          <Feather name={secure ? 'eye' : 'eye-off'} size={20} color="#555" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PasswordInput;
