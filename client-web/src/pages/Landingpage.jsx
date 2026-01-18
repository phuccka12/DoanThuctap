import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import catAnimation from '../assets/cat.json';

import {
  FaGraduationCap,
  FaBrain,
  FaGamepad,
  FaUsers,
  FaTrophy,
  FaCertificate,
  FaCheckCircle,
  FaStar
} from 'react-icons/fa';

const Landingpage = () => {
  const navigate = useNavigate();
  const lottieRef = useRef(null);

  // Simple Lottie player using canvas
  useEffect(() => {
    if (lottieRef.current && catAnimation) {
      // For now, we'll use a simple cat emoji instead of complex Lottie setup
      // This ensures the page renders immediately
    }
  }, []);

  // Smooth scroll handler
  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const courses = [
    {
      level: 'A1 Beginner',
      icon: '🌱',
      color: 'bg-green-50 border-green-200',
      buttonColor: 'bg-green-500 hover:bg-green-600',
      description: 'Mới bắt đầu học',
      features: ['Dạy theo chủ đề', 'Từ vựng căn bản', 'Ngữ pháp cơ bản']
    },
    {
      level: 'A2 Elementary',
      icon: '💡',
      color: 'bg-blue-50 border-blue-200',
      buttonColor: 'bg-blue-500 hover:bg-blue-600',
      description: 'Nâng cao từ cơ bản',
      features: ['Hội thoại hàng ngày', 'Từ vựng mở rộng', 'Giao tiếp cơ bản']
    },
    {
      level: 'B1 Intermediate',
      icon: '⚡',
      color: 'bg-purple-50 border-purple-200',
      buttonColor: 'bg-purple-500 hover:bg-purple-600',
      description: 'Trung cấp tiếng Anh',
      features: ['Học từ chủ đề', 'Từ vựng nâng cao', 'Giao tiếp tự tin']
    },
    {
      level: 'B2+ Advanced',
      icon: '👑',
      color: 'bg-orange-50 border-orange-200',
      buttonColor: 'bg-orange-500 hover:bg-orange-600',
      description: 'Thành thạo tiếng Anh',
      features: ['Các chủ đề phức tạp', 'Business English', 'Chuẩn bị IELTS']
    }
  ];

  const benefits = [
    {
      icon: <FaGraduationCap className="text-4xl text-blue-500" />,
      title: 'Giáo viên bản xứ',
      description: 'Học trực tiếp với giáo viên bản xứ kèm cặp tận tâm và nhiệt huyết 5+ năm'
    },
    {
      icon: <FaBrain className="text-4xl text-purple-500" />,
      title: 'AI thông minh',
      description: 'Thực hành luyện nói với AI dễ dàng, nhận phản hồi ngay lập tức, tạo lộ trình riêng'
    },
    {
      icon: <FaGamepad className="text-4xl text-green-500" />,
      title: 'Học vui vẻ',
      description: 'Gamification và bé thông minh thú cưỡng, vui vẻ và tương tác học tập'
    },
    {
      icon: <FaUsers className="text-4xl text-pink-500" />,
      title: 'Cộng đồng',
      description: 'Kết nối với 7 triệu học viên trên thế giới'
    },
    {
      icon: <FaTrophy className="text-4xl text-yellow-500" />,
      title: 'Linh hoạt',
      description: 'Học tập tùy chỉnh, linh hoạt thời gian tùy theo nhu cầu của bạn'
    },
    {
      icon: <FaCertificate className="text-4xl text-red-500" />,
      title: 'Chứng chỉ',
      description: 'Nhận chứng chỉ quốc tế, hệ thống chính thức và đánh giá nghiêm khắc'
    }
  ];

  const features = [
    {
      icon: '🔍',
      title: 'Bài kiểm tra đầu vào',
      description: 'Bài kiểm tra đánh giá vào trình độ và xác định lộ trình học phù hợp với từng bạn'
    },
    {
      icon: '🤖',
      title: 'Nhân phân hỏi từ AI',
      description: 'Nhận phản hồi học thi từ AI về ngữ pháp, từ vựng và cấu trúc câu'
    },
    {
      icon: '🐾',
      title: 'Nuôi thú cưng, chơi ăn, nâng cấp và mua vật phẩm bằng Gold & XP',
      description: 'Nuôi thú cưng, cho ăn, nâng cấp và mua các vật phẩm bằng Gold & XP'
    },
    {
      icon: '🎥',
      title: 'Tham gia lớp học trực tuyến với giáo viên qua Google Meet',
      description: 'Tham gia các lớp học trực tuyến với giáo viên qua Google Meet'
    },
    {
      icon: '🎵',
      title: 'Giáo viên dễ dàng tạo, quản lý lớp và giao bài tập cho học viên',
      description: 'Cho phép giáo viên dễ dàng tạo, quản lý lớp và giao bài tập cho học viên'
    },
    {
      icon: '📊',
      title: 'Xem tiến độ, điểm số và phân tích học tập chi tiết',
      description: 'Xem tiến độ, điểm số và phân tích học tập chi tiết'
    }
  ];

  const userTypes = [
    {
      icon: '🎓',
      title: 'Học viên',
      subtitle: 'Students',
      color: 'bg-blue-500',
      features: [
        'Học trực và kính tự phân',
        'Nhận feedback từ AI',
        'Nuôi thú ảo và nhắc việc nhắc nhở',
        'Tham gia lớp học trực tuyến',
        'Xem bài viết bài tập'
      ]
    },
    {
      icon: '👨‍🏫',
      title: 'Giáo viên',
      subtitle: 'Teachers',
      color: 'bg-green-500',
      features: [
        'Tạo và quản lý lớp học',
        'Giao bài tập và kiếm tra',
        'Tổ chức lớp học qua Google Meet',
        'Điểm đánh học viên',
        'Đánh giá kết quả học tập'
      ]
    },
    {
      icon: '👑',
      title: 'Quản trị viên',
      subtitle: 'Administrators',
      color: 'bg-purple-500',
      features: [
        'Quản lý tài khoản người dùng',
        'Quản lý nội dung học',
        'Cài đặt hệ thống',
        'Phản quỹ và thống kê',
        'Xem báo cáo hệ thống'
      ]
    }
  ];

  const pricingPlans = [
    {
      name: 'Miễn phí',
      subtitle: 'Bắt đầu học tiếng Anh',
      price: '0₫',
      period: '/tháng',
      buttonText: 'Bắt đầu miễn phí',
      buttonColor: 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50',
      features: ['3 bài học/ngày', 'AI feedback cơ bản', 'Gamification', 'Làm bài tập A-1', 'Chứng chỉ'],
      highlight: false
    },
    {
      name: 'Pro',
      subtitle: 'Học chuyên nghiệp',
      price: '99.000₫',
      period: '/tháng',
      buttonText: 'Nâng cấp',
      buttonColor: 'bg-white text-blue-600 hover:bg-blue-50',
      badge: 'PHỔ BIẾN',
      features: [
        'Bài học không giới hạn',
        'AI feedback nâng cao',
        'Lớp học 1-1 (2 buổi/tháng)',
        'Giải đáp nhanh với AI',
        'Chứng chỉ'
      ],
      highlight: true
    },
    {
      name: 'Premium',
      subtitle: 'Học tận cá nhân hóa',
      price: '299.000₫',
      period: '/tháng',
      buttonText: 'Nâng cấp',
      buttonColor: 'bg-white text-purple-600 hover:bg-purple-50',
      features: [
        'Tất cả ở Pro +',
        'Lớp học 1-1 (5 buổi/tháng)',
        'Lộ trình học cá nhân',
        'Ưu tiên hỗ trợ 24/7',
        'Kiểm tra IELTS miễn phí'
      ],
      highlight: false
    }
  ];

  const teachers = [
    {
      name: 'Sarah Johnson',
      title: 'Giáo viên từ Anh',
      description: 'Tốt nghiệp ngành chuyên ngữ tiếng Anh, chuyên IELTS',
      tags: ['IELTS', 'Advanced'],
      color: 'bg-blue-400',
      image: '👨'
    },
    {
      name: 'Michael Brown',
      title: 'Giáo viên từ Mỹ',
      description: '8 năm kinh nghiệm, chuyên dạy Business English',
      tags: ['Business', 'Conversation'],
      color: 'bg-purple-400',
      image: '👨'
    },
    {
      name: 'Emily White',
      title: 'Giáo viên từ Canada',
      description: '6 năm kinh nghiệm, chuyên dạy cơ bản và tối ưu từ vựng',
      tags: ['Kids', 'Beginner'],
      color: 'bg-pink-400',
      image: '👨'
    }
  ];

  const testimonials = [
    {
      name: 'Nguyễn Hà',
      time: 'Học viết 2 tháng',
      text: '"English tốt thực sự giúp cải thiện rất nhiều và tôi đã ra vào mức tốt đã hỗ trợ giúp chính mình học tiếng Anh từ A1 feedback rất hay too!"',
      rating: 5,
      avatar: '👤',
      color: 'bg-blue-500'
    },
    {
      name: 'Trần Minh',
      time: 'Học viết 3 tháng',
      text: '"Phương pháp giảng dạy rất hiệu quả và thú vị. Tôi đã đạt điểm IELTS 7.5 trong 3 tháng. Cảm ơn những giáo viên tận tuyệt vời!"',
      rating: 5,
      avatar: '👤',
      color: 'bg-purple-500'
    },
    {
      name: 'Lê Anh',
      time: 'Học viết 1 tháng',
      text: '"Tôi rất thích gamification, vui học và có việc hơn. Tôi đã nuôi thú thi và XP hết giải thưởng này còn dẫn thêm!"',
      rating: 5,
      avatar: '👤',
      color: 'bg-pink-500'
    }
  ];

  const techStack = {
    frontend: [
      { name: 'React.js', description: 'Web Application', icon: '⚛️' },
      { name: 'React Native', description: 'Mobile App (iOS & Android)', icon: '📱' },
      { name: 'Redux', description: 'State Management', icon: '🔄' }
    ],
    backend: [
      { name: 'Node.js + Express', description: 'RESTful APIs', icon: '🟢' },
      { name: 'MongoDB', description: 'Database', icon: '🍃' },
      { name: 'JWT', description: 'Authentication', icon: '🔐' }
    ],
    ai: [
      { name: 'TensorFlow.js', description: 'AI Feedback Engine', icon: '🧠' },
      { name: 'Google Meet API', description: 'Live Classes', icon: '📹' },
      { name: 'Gamification Engine', description: 'Pet System & Rewards', icon: '🎮' }
    ],
    deployment: [
      { name: 'AWS / Heroku', description: 'Web Hosting', icon: '☁️' },
      { name: 'App Store / Google Play', description: 'Mobile Distribution', icon: '📲' },
      { name: 'Git / CI-CD', description: 'Version Control & Automation', icon: '⚙️' }
    ]
  };

  const timeline = [
    { week: 'Tuần 1-2', phase: 'Phân tích & Thiết kế', description: 'Phân tích yêu cầu, thiết kế hệ thống và lộ trình học tập' },
    { week: 'Tuần 3-4', phase: 'Frontend Development', description: 'Phát triển giao diện Web và Mobile App' },
    { week: 'Tuần 5-6', phase: 'Backend & Database', description: 'Phát triển APIs, xác thực JWT, và cấu hình MongoDB' },
    { week: 'Tuần 7-8', phase: 'AI & Gamification', description: 'Tích hợp AI chatbot đánh giá và hệ thống vật nuôi' },
    { week: 'Tuần 9-10', phase: 'Google Meet & Testing', description: 'Tích hợp Google Meet và kiểm thử chức năng' },
    { week: 'Tuần 11-12', phase: 'Kiểm thử & Triển khai', description: 'Kiểm thử, Tối ưu hóa và triển khai lên production' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* LOGO (Cat emoji as temporary replacement for Lottie) */}
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg overflow-hidden flex items-center justify-center">
                <span ref={lottieRef} className="text-2xl">🐱</span>
              </div>

              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                HIDAY ENGLISH
              </span>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" onClick={(e) => handleSmoothScroll(e, 'features')} className="text-gray-700 hover:text-blue-600 transition cursor-pointer">Tính năng</a>
              <a href="#courses" onClick={(e) => handleSmoothScroll(e, 'courses')} className="text-gray-700 hover:text-blue-600 transition cursor-pointer">Các khóa học</a>
              <a href="#pricing" onClick={(e) => handleSmoothScroll(e, 'pricing')} className="text-gray-700 hover:text-blue-600 transition cursor-pointer">Công nghệ</a>
              <a href="#about" onClick={(e) => handleSmoothScroll(e, 'about')} className="text-gray-700 hover:text-blue-600 transition cursor-pointer">Liên hệ</a>
            </nav>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-blue-600 hover:text-blue-700 transition font-medium"
              >
                🔐 Đăng nhập
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition transform hover:scale-105 font-medium"
              >
                📝 Đăng ký
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
            🎓 Học tiếng Anh toàn câu
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Học tiếng Anh{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              hiệu quả
            </span>{' '}
            &{' '}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              vui vẻ
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Học tiếng Anh với AI, giáo viên bản xứ, và công nghệ toàn câu. Từ
            <br />
            A1 đến C2, chúng tôi đồng hành cùng bạn.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-xl transition transform hover:scale-105 font-medium text-lg"
            >
              🚀 Bắt đầu miễn phí
            </button>
            <button className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition font-medium text-lg">
              📱 Xem bài học mẫu
            </button>
          </div>
          <div className="mt-8 flex items-center justify-center space-x-8 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <FaCheckCircle className="text-green-500" />
              <span>Không cần thẻ tín dụng</span>
            </div>
            <div className="flex items-center space-x-2">
              <FaCheckCircle className="text-green-500" />
              <span>Trải nghiệm lớn học miễn phí</span>
            </div>
          </div>
        </div>
      </section>

      {/* Course Levels */}
      <section id="courses" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Khóa học tiếng Anh</h2>
          <p className="text-gray-600">Từ mức độ beginner đến advanced</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.map((course, index) => (
            <div
              key={index}
              className={`${course.color} border-2 rounded-2xl p-6 hover:shadow-xl transition transform hover:scale-105`}
            >
              <div className="text-5xl mb-4">{course.icon}</div>
              <h3 className="text-xl font-bold mb-2">{course.level}</h3>
              <p className="text-gray-600 mb-4">{course.description}</p>
              <ul className="space-y-2 mb-6">
                {course.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button className={`w-full ${course.buttonColor} text-white py-3 rounded-lg font-medium transition`}>
                Bắt đầu
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Tại sao chọn EnglishLab?</h2>
            <p className="text-gray-600">Những lợi ích mà bạn sẽ nhận được</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-2xl p-8 hover:shadow-xl transition transform hover:scale-105"
              >
                <div className="mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Tính năng chính</h2>
          <p className="text-gray-600">Đủ</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition transform hover:scale-105"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Các hoạt động</h2>
            <p className="text-blue-100">Ba bước đơn giản để bắt đầu học tập</p>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center space-y-8 md:space-y-0 md:space-x-12 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold text-blue-600">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Đăng ký tài khoản</h3>
              <p className="text-blue-100">
                Tạo tài khoản để email và xác thỏa điều trên. Lựa chọn
                <br />
                và học tập hoàn toàn miễn phí hoặc giao được nhiều hơn nữa
              </p>
            </div>
            <div className="text-white text-4xl hidden md:block">→</div>
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold text-purple-600">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Làm bài kiểm tra</h3>
              <p className="text-blue-100">
                Hoàn thành bài kiểm tra yêu cầu để xác định trình độ và tùy
                <br />
                chỉnh học cho phù hợp
              </p>
            </div>
            <div className="text-white text-4xl hidden md:block">→</div>
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold text-pink-600">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Bắt đầu học</h3>
              <p className="text-blue-100">
                Học các bài học, luyện tập viết, nói và tích cực học với
                <br />
                thú cưỡng
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* User Types */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Cho tất cả người dùng</h2>
          <p className="text-gray-600">Một vài tới cớ các chức năng nổi bật</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {userTypes.map((type, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition transform hover:scale-105"
            >
              <div className={`${type.color} h-32 flex items-center justify-center`}>
                <div className="text-6xl text-white">{type.icon}</div>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-1">{type.title}</h3>
                <p className="text-gray-500 mb-4">{type.subtitle}</p>
                <ul className="space-y-2">
                  {type.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-sm text-gray-700">
                      <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Bảng giá</h2>
            <p className="text-gray-600">Chọn gói học phù hợp với nhu cầu của bạn</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`rounded-2xl p-8 ${
                  plan.highlight
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-2xl transform scale-105'
                    : 'bg-gray-50 border-2 border-gray-200'
                } transition hover:shadow-xl`}
              >
                {plan.badge && (
                  <div className="inline-block px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold mb-4">
                    {plan.badge}
                  </div>
                )}
                <h3 className={`text-2xl font-bold mb-2 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <p className={`mb-6 ${plan.highlight ? 'text-blue-100' : 'text-gray-600'}`}>
                  {plan.subtitle}
                </p>
                <div className="mb-6">
                  <span className={`text-4xl font-bold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}
                  </span>
                  <span className={plan.highlight ? 'text-blue-100' : 'text-gray-600'}>{plan.period}</span>
                </div>
                <button className={`w-full py-3 rounded-lg font-medium transition ${plan.buttonColor} mb-6`}>
                  {plan.buttonText}
                </button>
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <FaCheckCircle className={`mt-1 flex-shrink-0 ${plan.highlight ? 'text-blue-200' : 'text-green-500'}`} />
                      <span className={`text-sm ${plan.highlight ? 'text-blue-100' : 'text-gray-700'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Teachers */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Giáo viên của chúng tôi</h2>
          <p className="text-gray-600">Những giáo viên tiếng Anh giỏi kinh nghiệm để hỗ trợ nơi</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {teachers.map((teacher, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition transform hover:scale-105"
            >
              <div className={`${teacher.color} h-48 flex items-center justify-center`}>
                <div className="text-8xl text-white">{teacher.image}</div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-1">{teacher.name}</h3>
                <p className="text-blue-600 font-medium mb-3">{teacher.title}</p>
                <p className="text-gray-600 mb-4">{teacher.description}</p>
                <div className="flex space-x-2">
                  {teacher.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Học viên nói gì</h2>
            <p className="text-gray-600">Những câu chuyện thành công từ học viên thực tế</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FaStar key={i} className="text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">{testimonial.text}</p>
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 ${testimonial.color} rounded-full flex items-center justify-center text-white text-xl`}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-bold">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Công nghệ hiện đại</h2>
          <p className="text-gray-600">Stack công nghệ mạnh mẽ và tin cậy</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold mb-6 flex items-center space-x-2">
              <span className="text-3xl">💻</span>
              <span>Frontend</span>
            </h3>
            <div className="space-y-4">
              {techStack.frontend.map((tech, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <span className="text-2xl">{tech.icon}</span>
                  <div>
                    <p className="font-bold text-gray-900">{tech.name}</p>
                    <p className="text-sm text-gray-600">{tech.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold mb-6 flex items-center space-x-2">
              <span className="text-3xl">🔧</span>
              <span>Backend</span>
            </h3>
            <div className="space-y-4">
              {techStack.backend.map((tech, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <span className="text-2xl">{tech.icon}</span>
                  <div>
                    <p className="font-bold text-gray-900">{tech.name}</p>
                    <p className="text-sm text-gray-600">{tech.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold mb-6 flex items-center space-x-2">
              <span className="text-3xl">🤖</span>
              <span>AI & Tích hợp</span>
            </h3>
            <div className="space-y-4">
              {techStack.ai.map((tech, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <span className="text-2xl">{tech.icon}</span>
                  <div>
                    <p className="font-bold text-gray-900">{tech.name}</p>
                    <p className="text-sm text-gray-600">{tech.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold mb-6 flex items-center space-x-2">
              <span className="text-3xl">🚀</span>
              <span>Triển khai</span>
            </h3>
            <div className="space-y-4">
              {techStack.deployment.map((tech, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                  <span className="text-2xl">{tech.icon}</span>
                  <div>
                    <p className="font-bold text-gray-900">{tech.name}</p>
                    <p className="text-sm text-gray-600">{tech.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Lịch triển khai (12 tuần)</h2>
            <p className="text-gray-600">Từ khởi niệm đến triển khai</p>
          </div>
          <div className="max-w-4xl mx-auto">
            {timeline.map((item, index) => (
              <div key={index} className="flex items-start mb-8">
                <div className="flex-shrink-0 w-32 text-right pr-8">
                  <p className="font-bold text-blue-600">{item.week}</p>
                  <p className="text-sm text-gray-600">{item.phase}</p>
                </div>
                <div className="relative">
                  <div
                    className={`w-4 h-4 rounded-full ${
                      index % 3 === 0 ? 'bg-blue-600' : index % 3 === 1 ? 'bg-purple-600' : 'bg-pink-600'
                    }`}
                  ></div>
                  {index < timeline.length - 1 && <div className="absolute top-4 left-2 w-0.5 h-16 bg-gray-300"></div>}
                </div>
                <div className="flex-1 pl-8">
                  <p className="text-gray-700">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-5xl font-bold text-white mb-2">3</p>
              <p className="text-blue-100">Loại người dùng</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-white mb-2">6+</p>
              <p className="text-blue-100">Tính năng chính</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-white mb-2">2</p>
              <p className="text-blue-100">Nền tảng (Web & Mobile)</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-white mb-2">12</p>
              <p className="text-blue-100">Tuần phát triển</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Sẵn sàng bắt đầu?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Tham gia Hiday English ngay hôm nay và bắt đầu hành trình học tiếng Anh của bạn
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:shadow-xl transition transform hover:scale-105 font-medium text-lg"
            >
              🎓 Đăng ký miễn phí
            </button>
            <button className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition font-medium text-lg">
              📞 Liên hệ chúng tôi
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Hiday English</h3>
              <p className="text-gray-400 text-sm">
                Nền tảng học tiếng Anh trực tuyến với AI và giáo viên bản xứ, giúp bạn học tiếng Anh hiệu quả
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Chức năng</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">Lớ trình học</a></li>
                <li><a href="#" className="hover:text-white transition">AI Feedback</a></li>
                <li><a href="#" className="hover:text-white transition">Gamification</a></li>
                <li><a href="#" className="hover:text-white transition">Lớp học trực tuyến</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Công ty</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">Về chúng tôi</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Tuyển dụng</a></li>
                <li><a href="#" className="hover:text-white transition">Điều khoản sử dụng</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Liên hệ</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Email: contact@hidayenglish.com</li>
                <li>Phone: +84 123 456 789</li>
                <li className="flex space-x-4 pt-2">
                  <a href="#" className="hover:text-white transition">📘</a>
                  <a href="#" className="hover:text-white transition">🐦</a>
                  <a href="#" className="hover:text-white transition">📷</a>
                  <a href="#" className="hover:text-white transition">💼</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>© 2026 Hiday English. Tất cả các quyền được bảo vệ.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landingpage;
