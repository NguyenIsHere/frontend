export interface Chapter {
  id: string;
  status: string | null;
  name: string;
  affiliated: string;
  address: string;
  establishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export const dev_chapters: Chapter[] = [
  {
    id: "684429f7643d08abee566cca",
    status: "actived",
    name: "Chi đoàn Kỹ thuật Phần mềm K17",
    affiliated: "Đoàn khoa Công nghệ Thông tin",
    address: "Trường Đại học XYZ, Khu phố 6, P.Linh Trung, TP.Thủ Đức, TP.HCM",
    establishedAt: "2022-10-20T00:00:00.000Z",
    createdAt: "2025-06-07T12:00:55.300Z",
    updatedAt: "2025-06-07T12:00:55.300Z"
  },
  {
    id: "6844356446d719039344c8ec",
    status: null,
    name: "Chi đoàn khoa K25",
    affiliated: "Đoàn khoa Công nghệ Thông tin",
    address: "Dĩ An, Bình Dương",
    establishedAt: "2004-10-12T00:00:00.000Z",
    createdAt: "2025-06-07T12:49:40.126Z",
    updatedAt: "2025-06-07T12:49:40.126Z"
  },
  {
    id: "6844459f6ea931d5aec2af70",
    status: null,
    name: "Chi đoàn khu phố Đông B",
    affiliated: "Đoàn phường Đông Hòa",
    address: "WQ2G+MP5, Đông Hoà, Dĩ An, Bình Dương, Việt Nam",
    establishedAt: "1990-01-01T00:00:00.000Z",
    createdAt: "2025-06-07T13:58:55.200Z",
    updatedAt: "2025-06-07T13:58:55.200Z"
  }
];
;
