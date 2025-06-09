import { documentApi } from "@/api";
import DocumentItem from "@/components/DocumentItem";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text } from "react-native";

interface DocumentType {
  _id: { $oid: string };
  docCode: string;
  name: string;
  issuer: string;
  issuedAt: { $date: string };
  file: {
    url: string;
    public_id: string;
  };
  scope: string;
  chapterId: { $oid: string };
}

const ListDocument = () => {
  const params = useLocalSearchParams();
  const chapterId = params.id as string;
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await documentApi.getDocuments({ scope: "chapter" });
        const docs = res.data.data.docs || res.data.data || [];
        const filteredDocs = docs.filter((doc: any) => {
          let docChapterId = "";
          if (typeof doc.chapterId === "string") {
            docChapterId = doc.chapterId;
          } else if (doc.chapterId?._id) {
            docChapterId = doc.chapterId._id;
          } else if (doc.chapterId?.$oid) {
            docChapterId = doc.chapterId.$oid;
          }
          return docChapterId === chapterId;
        });
        setDocuments(filteredDocs);
      } catch {
        setError("Không thể tải danh sách tài liệu");
      } finally {
        setLoading(false);
      }
    };
    if (chapterId) fetchDocuments();
  }, [chapterId]);

  if (loading)
    return <ActivityIndicator className='mt-10' size='large' color='#3E4FF5' />;
  if (error)
    return <Text className='text-center text-red-500 mt-10'>{error}</Text>;

  return (
    <ScrollView className='flex-1 bg-white px-4 py-3'>
      {documents.map((document) => (
        <DocumentItem
          key={
            document._id?.$oid ||
            (typeof document._id === "string" ? document._id : "") ||
            document.docCode
          }
          title={document.name}
          code={document.docCode}
          scope={document.scope === "chapter" ? "Chi đoàn" : document.scope}
          createdAt={
            document.issuedAt?.$date
              ? new Date(document.issuedAt.$date).toLocaleDateString("vi-VN")
              : ""
          }
          issuer={document.issuer || "Không có nơi ban hành"}
        />
      ))}
    </ScrollView>
  );
};

export default ListDocument;
