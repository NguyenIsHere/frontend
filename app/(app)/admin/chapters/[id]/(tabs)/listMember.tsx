import { accountApi } from "@/api";
import MemberItem from "@/components/MemberItem";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text } from "react-native";

interface AccountType {
  _id: string;
  fullname: string;
  email: string;
  phone: string;
  role: "admin" | "manager" | "member";
  status: "actived" | "pending" | "locked";
  avatar?: { url: string };
  chapterId?: { name: string };
  cardNumber?: string;
  position?: string;
}

const ListMember = () => {
  const params = useLocalSearchParams();
  const chapterId = params.id as string;
  const [members, setMembers] = useState<AccountType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await accountApi.getAccounts();
        const membersData = res.data.data.docs || res.data.data || [];
        console.log("[DEBUG] chapterId param:", chapterId);
        membersData.forEach((account: any) => {
          console.log(
            "[DEBUG] account._id:",
            account._id,
            "account.chapterId:",
            account.chapterId
          );
        });
        const filteredAccounts = membersData.filter((account: any) => {
          let accountChapterId = "";
          if (typeof account.chapterId === "string") {
            accountChapterId = account.chapterId;
          } else if (account.chapterId?._id) {
            accountChapterId = account.chapterId._id;
          } else if (account.chapterId?.$oid) {
            accountChapterId = account.chapterId.$oid;
          }
          return accountChapterId === chapterId;
        });
        setMembers(
          filteredAccounts.map((account: any) => ({
            _id: account._id,
            fullname: account.fullname,
            email: account.email,
            phone: account.phone,
            role: account.role,
            status: account.status,
            avatar: account.avatar,
            chapterId: account.chapterId,
            cardNumber: account.cardNumber,
            position: account.position,
          }))
        );
      } catch {
        setError("Không thể tải danh sách đoàn viên");
      } finally {
        setLoading(false);
      }
    };
    if (chapterId) fetchMembers();
  }, [chapterId]);

  if (loading)
    return <ActivityIndicator className='mt-10' size='large' color='#3E4FF5' />;
  if (error)
    return <Text className='text-center text-red-500 mt-10'>{error}</Text>;

  return (
    <ScrollView className='flex-1 bg-white px-4 py-3'>
      {members.map((member) => (
        <MemberItem
          key={member._id}
          fullname={member.fullname}
          cardNumber={member.cardNumber}
          position={
            member.role === "manager"
              ? "Bí thư chi đoàn"
              : member.role === "admin"
              ? "Quản trị viên"
              : member.position || ""
          }
          imageUri={
            member.avatar?.url
              ? { uri: member.avatar.url }
              : require("@/assets/images/avatar-placeholder.png")
          }
        />
      ))}
    </ScrollView>
  );
};

export default ListMember;
