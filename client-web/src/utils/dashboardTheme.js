export const cn = (...c) => c.filter(Boolean).join(" ");

export const theme = {
  // Page — soft indigo-tinted background, not pure white
  page:        "bg-[#EFECFB]",
  // Sidebar — slightly deeper indigo tint with a purple-soft border
  sidebar:     "bg-[#F3F0FD] border-r border-indigo-100",
  // Cards — near-white with a warm indigo border
  card:        "bg-white/80 shadow-sm border border-indigo-100 hover:shadow-md hover:border-indigo-200 transition-all duration-200",
  border:      "border-indigo-100",
  text:        "text-slate-800",
  sub:         "text-slate-400",
  accent:      "text-[#6C5CE7]",
  accentBg:    "bg-linear-to-r from-[#6C5CE7] to-[#a78bfa]",
  accentSoft:  "bg-[#6C5CE7]/10",
  input:       "bg-white border-indigo-100 text-slate-800 placeholder-slate-400",
  hover:       "hover:bg-indigo-50",
};

export const darkTheme = {
  page:        "bg-[#0F1117]",
  sidebar:     "bg-[#16181F] border-r border-white/5",
  card:        "bg-[#1C1E28] border border-white/5 hover:border-white/10 transition-colors duration-200",
  border:      "border-white/5",
  text:        "text-white",
  sub:         "text-slate-400",
  accent:      "text-[#A29BFE]",
  accentBg:    "bg-linear-to-r from-[#6C5CE7] to-[#00CEC9]",
  accentSoft:  "bg-[#A29BFE]/10",
  input:       "bg-white/5 border-white/10 text-white placeholder-slate-500",
  hover:       "hover:bg-white/5",
};
