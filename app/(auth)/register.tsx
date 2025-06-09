import { authApi } from "@/api";
import CustomDropdown from "@/components/CustomDropdown";
import DatePicker from "@/components/DatePicker";
import PasswordInput from "@/components/PasswordInput";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

const RegisterScreen = () => {
  const router = useRouter();
  const [birthday, setBirthday] = useState<Date>();
  const [gender, setGender] = useState("");
  const [toggleGender, setToggleGender] = useState(false);
  const [password, setPassword] = useState("");

  const [role, setRole] = useState("");
  const [toggleRole, setToggleRole] = useState(false);

  const [chapterId, setChapter] = useState("");
  const [chapterOptions, setChapterOptions] = useState<any>([]);
  const [toggleChapter, setToggleChapter] = useState(false);

  const [position, setPosition] = useState("");
  const [togglePosition, setTogglePosition] = useState(false);

  const [joinedAt, setJoinedAt] = useState<Date>();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [address, setAddress] = useState("");
  const [ethnicity, setEthnicity] = useState("");
  const [religion, setReligion] = useState("");
  const [education, setEducation] = useState("");

  const [isMember, setIsMember] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const genderOptions = [
    { value: "male", label: "Nam" },
    { value: "female", label: "Nữ" },
  ];

  const roleOptions = [
    { value: "manager", label: "Quản lý chi đoàn" },
    { value: "member", label: "Đoàn viên" },
  ];

  const positionOptions = [
    { value: "secretary", label: "Bí thư" },
    { value: "deputy_secretary", label: "Phó Bí thư" },
    { value: "executive_member", label: "Ủy viên BCH" },
    { value: "member", label: "Đoàn viên" },
  ];
  const [avatar, setAvatar] = useState<string | null>(null);
  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Vui lòng cấp quyền truy cập thư viện ảnh");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets.length > 0) {
      setAvatar(result.assets[0].uri);
    }
  };

  useEffect(() => {
    // const chapters = dev_chapters.map((item: any) => ({
    //   label: item.name,
    //   value: item.id,
    // }));
    // setChapterOptions(chapters);
    authApi.getChaptersForRegister()
    .then(res => {
       const chapters = res.data.data.map((item: any) => ({
      label: item.name,
      value: item._id,
    }));
    console.log(chapters)
    setChapterOptions(chapters);
    })
  }, []);

  useEffect(() => {
    if (role == "manager") {
      setIsManager(true);
    } else {
      setIsManager(false);
    }

    if (role == "member") {
      setIsMember(true);
    } else {
      setIsMember(false);
    }
  }, [role]);

  const handleRegister = () => {
    if (!email || !phone || !fullName || !gender || !password || !role) {
      Toast.show({
        type: "error",
        text1: "Đăng ký thất bại",
        text2: "Vui lòng nhập đầy đủ thông tin cơ bản.",
        text1Style: { fontSize: 16 },
        text2Style: { fontSize: 14 },
      });
      return;
    }

    if (role === "manager" && !chapterId) {
      Toast.show({
        type: "error",
        text1: "Đăng ký thất bại",
        text2: "Vui lòng chọn chi đoàn cho người quản lý.",
      });
      return;
    }

    if (role === "member") {
      if (
        !chapterId ||
        !cardNumber ||
        !joinedAt ||
        !position ||
        !address ||
        !ethnicity ||
        !religion ||
        !education
      ) {
        Toast.show({
          type: "error",
          text1: "Đăng ký thất bại",
          text2: "Vui lòng nhập đầy đủ thông tin cho đoàn viên.",
        });
        return;
      }
    }

    const formData = new FormData();

    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("fullname", fullName);
    if (birthday)
      formData.append("birthday", birthday.toISOString().slice(0, 10));
    formData.append("gender", gender);
    formData.append("password", password);
    formData.append("role", role);
    if (role == "manager") {
      formData.append("chapterId", chapterId);
    }

    if (role == "member") {
      formData.append("chapterId", chapterId);
      formData.append("cardNumber", cardNumber);
      if (joinedAt)
        formData.append("joinedAt", joinedAt.toISOString().slice(0, 10));
      formData.append("position", position);
      formData.append("address", address);
      formData.append("ethnicity", ethnicity);
      formData.append("religion", religion);
      formData.append("education", education);
    }
 console.log("Register FormData:", formData);
    formData.forEach((value, key) => {
      if(!value){   Toast.show({
        type: "error",
        text1: "Đăng ký thất bại",
        text1Style: { fontSize: 16 },
        text2: `${key} không được để trống`,
        text2Style: { fontSize: 14 },
      });
      return;}
   
    });

    if (avatar) {
      // For React Native, you need to provide a file object for images
      formData.append("avatar", {
        uri: avatar,
        name: "avatar.jpg",
        type: "image/jpeg",
      } as any);
    }

   
    authApi
      .register(formData)
      .then((res) => {
        console.log(res); // Đây là dữ liệu thực tế
      })
      .catch((err) => {
        // console.error("Đăng ký thất bại:", err.message);
        // Toast.show({
        //   type: "error",
        //   text1: "Đăng ký thất bại",
        //   text1Style: { fontSize: 16 },
        //   text2: err.message,
        //   text2Style: { fontSize: 14 },
        // });
      });
  };

  return (
    <ScrollView
      style={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <Image
        source={require("../../assets/images/banner.png")}
        style={styles.banner}
      />

      <View style={styles.headerContainer}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
        />
        <Text style={styles.headerText}>
          Hệ thống hỗ trợ {"\n"}nghiệp vụ công tác đoàn
        </Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.title}>Đăng ký</Text>

        <View style={styles.avatarContainer}>
          <Image
            source={
              avatar
                ? { uri: avatar }
                : require("../../assets/images/avatar-placeholder.png")
            }
            style={styles.avatar}
          />
          <TouchableOpacity
            style={styles.uploadAvatarBtn}
            onPress={handlePickAvatar}
          >
            <Text style={styles.uploadAvatarText}>Thêm ảnh đại diện</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Nhập email đăng ký"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Nhập số điện thoại"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Họ và tên</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Nhập họ và tên của bạn"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Ngày sinh</Text>
            <DatePicker value={birthday} onChange={setBirthday} />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Giới tính</Text>
            <CustomDropdown
              placeholder="Chọn giới tính"
              options={genderOptions}
              selectedValue={gender}
              onSelect={setGender}
              onToggle={() => setToggleGender((prev) => !prev)}
              isOpen={toggleGender}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mật khẩu</Text>
          <PasswordInput value={password} onChange={setPassword} />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phân quyền</Text>
          <CustomDropdown
            placeholder="Chọn phân quyền"
            options={roleOptions}
            selectedValue={role}
            onSelect={setRole}
            onToggle={() => setToggleRole((prev) => !prev)}
            isOpen={toggleRole}
          />
        </View>
        {(isManager || isMember) && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Chi đoàn</Text>
            <CustomDropdown
              placeholder="Chọn chi đoàn"
              options={chapterOptions}
              selectedValue={chapterId}
              onSelect={setChapter}
              onToggle={() => setToggleChapter((prev) => !prev)}
              isOpen={toggleChapter}
            />
          </View>
        )}

        {isMember && (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Số thẻ đoàn</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Nhập số thẻ đoàn của bạn"
                value={cardNumber}
                onChangeText={setCardNumber}
              />
            </View>
            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Ngày vào đoàn</Text>
                <DatePicker value={joinedAt} onChange={setJoinedAt} />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Chức vụ</Text>
                <CustomDropdown
                  placeholder="Chọn chức vụ"
                  options={positionOptions}
                  selectedValue={position}
                  onSelect={setPosition}
                  onToggle={() => setTogglePosition((prev) => !prev)}
                  isOpen={togglePosition}
                />
              </View>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Địa chỉ</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Nhập địa chỉ của bạn"
                value={address}
                onChangeText={setAddress}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Dân tộc</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Nhập dân tộc của bạn"
                value={ethnicity}
                onChangeText={setEthnicity}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tôn giáo</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Nhập tôn giáo của bạn"
                value={religion}
                onChangeText={setReligion}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Trình độ học vấn</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Nhập trình độ học vấn của bạn"
                value={education}
                onChangeText={setEducation}
              />
            </View>
          </>
        )}

        <TouchableOpacity
          style={styles.registerButton}
          onPress={handleRegister}
        >
          <Text style={styles.registerButtonText}>Đăng ký</Text>
        </TouchableOpacity>

        <View style={styles.loginRedirect}>
          <Text>Bạn đã có tài khoản. </Text>
          <TouchableOpacity onPress={() => router.replace("/(auth)")}>
            <Text style={styles.loginText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    backgroundColor: "#3E4FF5",
    flex: 1,
  },
  banner: {
    width: "100%",
    height: 180,
  },
  headerContainer: {
    top: -46,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    left: 10,
  },
  logo: {
    resizeMode: "contain",
    height: 90,
    width: 90,
  },
  headerText: {
    flex: 7,
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  formContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 40,
    marginHorizontal: 10,
    marginBottom: 90,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 20,
    fontSize: 30,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#3E4FF5",
    marginBottom: 10,
  },

  uploadAvatarBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#e6e6e6",
    borderRadius: 10,
  },

  uploadAvatarText: {
    color: "#333",
    fontWeight: "600",
  },

  inputGroup: {
    flexDirection: "row",
    gap: 20,
  },
  inputContainer: {
    flex: 1,
    marginVertical: 10,
  },
  label: {
    color: "blue",
    marginBottom: 6,
    fontWeight: "600",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    height: 50,
    paddingHorizontal: 10,
  },
  registerButton: {
    backgroundColor: "#3E4FF5",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 20,
  },
  registerButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  loginRedirect: {
    flexDirection: "row",
    justifyContent: "center",
  },
  loginText: {
    color: "#3E4FF5",
    fontWeight: "bold",
    marginLeft: 4,
  },
});

export default RegisterScreen;
