import React from "react";
import {
  FaHome, FaBookOpen, FaCalendarAlt, FaComments,
  FaUser, FaCog, FaClipboardCheck, FaMicrophoneAlt, FaPenFancy,
  FaGraduationCap,
} from "react-icons/fa";

export const navGroups = [
  {
    title: "QUẢN LÝ & LỘ TRÌNH",
    items: [
      { key: "dashboard",    label: "Tổng quan",      icon: <FaHome />,           badge: null    },
      { key: "learn",        label: "Luyện Tập",       icon: <FaGraduationCap />,  badge: "NEW"   },
      { key: "roadmap",      label: "Lộ trình AI",     icon: <FaCalendarAlt />,    badge: "AI"    },
      { key: "topics",       label: "Kho Chủ đề",      icon: <FaBookOpen />,       badge: null    },
    ],
  },
  {
    title: "LUYỆN THI & CHẤM ĐIỂM",
    items: [
      { key: "writing",      label: "Luyện Writing",  icon: <FaPenFancy />,      badge: "Check" },
      { key: "speaking",     label: "Luyện Speaking", icon: <FaMicrophoneAlt />, badge: "Check" },
      { key: "conversation", label: "Hội thoại AI",   icon: <FaComments />,      badge: "1-1"   },
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
