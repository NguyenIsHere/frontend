import { messageApi } from "@/api";

import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import avatarDefauth from "../../../../assets/images/avatar-placeholder.png";

const Index = () => {
  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => {
    messageApi.getContactList().then((res) => {
      setContacts(res.data.data || []);
    });

  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <Link
      href={{
        pathname: "/(app)/admin/messages/details/[id]",
        params: {
          id: item.id,
          name: item.fullname,
          avatar: item?.avatar?.url,
        },
      }}
      asChild
    >
      <TouchableOpacity style={styles.contactItem}>
        <Image
          source={item?.avatar?.url ? { uri: item.avatar.url } : avatarDefauth}
          style={styles.avatar}
        />
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item?.fullname}</Text>
          {item?.lastMessage && (
            <Text numberOfLines={1} style={styles.lastMessage}>
              {item?.sender !== item.id ? "Bạn: " : ""}
              {item?.lastMessage}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Link>
  );

  return (
    <View style={styles.container}>
       <View className='w-full bg-[#3E4FF5] py-5 px-4 rounded-b-xl'>
              <Text className='text-white text-3xl font-bold text-center mb-4'>
                Danh sách liên hệ
              </Text>
            </View>
      <FlatList
        data={contacts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f9ff",
  },
  header: {
    fontSize: 20,
    marginBottom: 16,
    fontWeight: "600",
    color: "#1a365d",
  },
  contactItem: {
    padding: 12,
    backgroundColor: "white",
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: "#3b82f6",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontWeight: "bold",
    color: "#1e40af",
    fontSize: 16,
  },
  lastMessage: {
    color: "#4b5563",
    fontSize: 14,
    marginTop: 4,
  },
});

export default Index;
