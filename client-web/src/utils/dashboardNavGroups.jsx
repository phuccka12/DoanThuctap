import React from "react";
import {
  FaHome, FaBookOpen, FaCalendarAlt, FaComments,
  FaUser, FaCog, FaClipboardCheck, FaMicrophoneAlt, FaPenFancy,
  FaGraduationCap, FaLayerGroup, FaNewspaper, FaMicrophone, FaHeadphones,
  FaBook,
} from "react-icons/fa";

export const navGroups = [
  {
    title: "QUẢN LÝ & LỘ TRÌNH",
    items: [
      { key: "dashboard",    label: "Tổng quan",      icon: <FaHome />,           badge: null       },
      { key: "roadmap",      label: "Lộ trình AI",     icon: <FaCalendarAlt />,    badge: "AI"       },
      { key: "topics",       label: "Kho Chủ đề",      icon: <FaGraduationCap />,  badge: null       },
      { key: "vocabulary",   label: "Từ Vựng",         icon: <FaLayerGroup />,     badge: "NEW"      },
      { key: "reading",      label: "Bài Đọc",          icon: <FaNewspaper />,      badge: "NEW"      },
      { key: "grammar",      label: "Ngữ pháp",        icon: <FaBook />,           badge: "NEW"      },
      { key: "stories",      label: "Câu chuyện",      icon: <FaBookOpen />,       badge: null       },
    ],
  },
  {
    title: "LUYỆN THI & CHẤM ĐIỂM",
    items: [
      { key: "writing",           label: "Luyện Writing",     icon: <FaPenFancy />,         badge: "AI"  },
      { key: "listening",         label: "Luyện Listening",   icon: <FaHeadphones />,       badge: "AI"  },
      { key: "speaking-practice", label: "Luyện Speaking",    icon: <FaMicrophone />,       badge: "AI"  },
      { key: "speaking",          label: "AI Speaking",       icon: <FaMicrophoneAlt />,    badge: "AI"  },
      { key: "conversation",      label: "Hội thoại AI",      icon: <FaComments />,         badge: "AI"  },
    ],
  },
  {
    title: "CÁ NHÂN & KẾT QUẢ",
    items: [
      { key: "feedback", label: "Kết quả & Sửa lỗi", icon: <FaClipboardCheck />, badge: null },
      { key: "profile",  label: "Hồ sơ",              icon: <FaUser />,           badge: null },
      { key: "settings", label: "Cài đặt",             icon: <FaCog />,            badge: null },
    ],
  },
];
