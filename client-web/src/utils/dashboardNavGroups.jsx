import React from "react";
import {
  FaHome, FaBookOpen, FaCalendarAlt, FaComments,
  FaUser, FaCog, FaClipboardCheck, FaMicrophoneAlt, FaPenFancy,
  FaGraduationCap, FaLayerGroup, FaNewspaper, FaMicrophone, FaHeadphones,
  FaBook,
} from "react-icons/fa";

export const navGroups = [
  {
    title: "TRANG CHỦ & LỘ TRÌNH",
    items: [
      { key: "dashboard",    label: "Tổng quan",      icon: <FaHome />,           badge: null       },
      { key: "roadmap",      label: "Lộ trình AI",     icon: <FaCalendarAlt />,    badge: "AI"       },
    ],
  },
  {
    title: "LUYỆN TẬP KỸ NĂNG",
    items: [
      { key: "listening",         label: "Luyện Listening",   icon: <FaHeadphones />,       badge: "AI"  },
      { key: "reading",              label: "Luyện Reading",     icon: <FaNewspaper />,        badge: "NEW" },
      { key: "speaking-practice", label: "Luyện Speaking",    icon: <FaMicrophone />,       badge: "AI"  },
      { key: "conversation",      label: "Hội thoại AI",      icon: <FaComments />,         badge: "AI"  },
      { key: "speaking",          label: "AI Speaking",       icon: <FaMicrophoneAlt />,    badge: "AI"  },
      { key: "writing-scenarios", label: "Nhiệm vụ Viết",     icon: <FaPenFancy />,         badge: "AI"  },
      { key: "writing",           label: "Luyện Writing",     icon: <FaPenFancy />,         badge: "AI"  },
    ],
  },
  {
    title: "KHO KIẾN THỨC",
    items: [
      { key: "topics",       label: "Kho Chủ đề",      icon: <FaGraduationCap />,  badge: null       },
      { key: "vocabulary",   label: "Từ Vựng",         icon: <FaLayerGroup />,     badge: "NEW"      },
      { key: "grammar",      label: "Ngữ pháp",        icon: <FaBook />,           badge: "NEW"      },
      { key: "stories",      label: "Câu chuyện",      icon: <FaBookOpen />,       badge: null       },
    ],
  },
  {
    title: "CÁ NHÂN",
    items: [
      { key: "profile",  label: "Hồ sơ",              icon: <FaUser />,           badge: null },
      { key: "settings", label: "Cài đặt",             icon: <FaCog />,            badge: null },
    ],
  },
];
