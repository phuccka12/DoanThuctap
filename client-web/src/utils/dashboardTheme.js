export const cn = (...c) => c.filter(Boolean).join(" ");

export const theme = {
  page: "bg-linear-to-br from-purple-50 via-white to-violet-50",
  sidebar: "bg-white shadow-lg",
  card: "bg-white shadow-md",
  border: "border-purple-100",
  text: "text-gray-800",
  sub: "text-gray-600",
  accent: "text-[#6C5CE7]",
  accentBg: "bg-linear-to-r from-[#6C5CE7] to-[#00CEC9]",
  accentSoft: "bg-[#A29BFE]/20",
  input: "bg-white border-purple-200",
  hover: "hover:bg-purple-50",
};

export const darkTheme = {
  page: "bg-linear-to-br from-gray-900 via-gray-800 to-gray-900",
  sidebar: "bg-gray-800 shadow-2xl border-gray-700",
  card: "bg-gray-800 shadow-xl",
  border: "border-gray-700",
  text: "text-white",
  sub: "text-gray-400",
  accent: "text-[#A29BFE]",
  accentBg: "bg-linear-to-r from-[#6C5CE7] to-[#00CEC9]",
  accentSoft: "bg-[#A29BFE]/10",
  input: "bg-gray-700 border-gray-600 text-white placeholder-gray-400",
  hover: "hover:bg-gray-700",
};
