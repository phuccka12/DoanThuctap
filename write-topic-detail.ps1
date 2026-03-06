$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$content = @"
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { cn, theme, darkTheme } from '../utils/dashboardTheme';
import { getLessonsForTopic } from '../services/learningService';
import LearnLayout from '../components/learn/LearnLayout';
import { FaLock, FaCheckCircle, FaSpinner, FaPlay, FaChevronRight, FaTrophy } from 'react-icons/fa';

const SKILL_META = {
  reading:    { icon: '`u{1F4D6}', label: '`u{0110}o`u{0323}c',      color: 'text-blue-400',    bg: 'bg-blue-500/15    border-blue-400/30'    },
  listening:  { icon: '`u{1F3A7}', label: 'Nghe',     color: 'text-purple-400',  bg: 'bg-purple-500/15  border-purple-400/30'  },
  vocabulary: { icon: '`u{1F4DD}', label: 'T`u{1EEB} v`u{1EF1}ng',  color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-400/30' },
  writing:    { icon: '`u{270D}`u{FE0F}',  label: 'Vi`u{1EBF}t',     color: 'text-yellow-400',  bg: 'bg-yellow-500/15  border-yellow-400/30'  },
  speaking:   { icon: '`u{1F399}`u{FE0F}', label: 'N`u{00F3}i',      color: 'text-rose-400',    bg: 'bg-rose-500/15    border-rose-400/30'    },
  quiz:       { icon: '`u{1F9E9}', label: 'Quiz',     color: 'text-orange-400',  bg: 'bg-orange-500/15  border-orange-400/30'  },
  video:      { icon: '`u{1F3AC}', label: 'Video',    color: 'text-sky-400',     bg: 'bg-sky-500/15     border-sky-400/30'     },
  general:    { icon: '`u{1F4DA}', label: 'H`u{1ECD}c',      color: 'text-gray-400',    bg: 'bg-gray-500/10    border-gray-400/20'    },
};
"@
[System.IO.File]::WriteAllText("d:\`u{0110}`u{1ED2} `u{00C1}N TH`u{1EF0}C T`u{1EAC}P\Doantotnghiep\client-web\src\pages\TopicDetail.jsx", $content, $utf8NoBom)
Write-Host "Done"
