import AntDesign from '@expo/vector-icons/AntDesign';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
interface DatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({value, onChange }) => {
  const [show, setShow] = useState(false);

  const handleChange = (event:any, selectedDate:any) => {
    setShow(Platform.OS === 'ios');
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  return (
    <View>

      <TouchableOpacity
        onPress={() => setShow(true)}
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
        justifyContent:'space-between',
        alignItems:'center',
        padding:10,
          height:50 ,
          flexDirection:'row',
          
          borderRadius: 6,
          backgroundColor: '#fff',
        }}
        activeOpacity={0.7}
      >
        <Text>{value ? value.toLocaleDateString('vi-VN') : 'Chọn ngày'}</Text>
        <AntDesign name="calendar" size={24} color="black" />
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      )}
    </View>
  );
};

export default DatePicker;
