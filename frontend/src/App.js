import React, { useState, useEffect, createContext, useContext } from 'react';
import './App.css';

// Auth Context
const AuthContext = createContext();

// Custom hook to use auth context
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [sessionToken, setSessionToken] = useState(localStorage.getItem('session_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionToken) {
      fetchUserProfile();
    } else {
      // Check if returning from auth
      const urlParams = new URLSearchParams(window.location.hash.substring(1));
      const sessionId = urlParams.get('session_id');
      
      if (sessionId) {
        handleAuthReturn(sessionId);
      } else {
        setLoading(false);
      }
    }
  }, [sessionToken]);

  const handleAuthReturn = async (sessionId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ session_id: sessionId })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSessionToken(data.session_token);
        localStorage.setItem('session_token', data.session_token);
        setUser(data.user);
        
        // Clear URL hash
        window.location.hash = '';
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Invalid token
        logout();
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    const authUrl = 'https://auth.emergentagent.com/?redirect=https://b14b3b75-ada1-472a-b369-78b0a2ae9404.preview.emergentagent.com/profile';
    window.location.href = authUrl;
  };

  const logout = () => {
    setUser(null);
    setSessionToken(null);
    localStorage.removeItem('session_token');
  };

  return (
    <AuthContext.Provider value={{
      user,
      sessionToken,
      loading,
      login,
      logout,
      setUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Registration Form Component
const RegistrationForm = ({ onComplete }) => {
  const { sessionToken, setUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    weight: '',
    height: '',
    martial_arts_experience: '',
    goals: '',
    medical_conditions: '',
    emergency_contact: '',
    role: 'student'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/complete-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          ...formData,
          age: parseInt(formData.age),
          weight: parseFloat(formData.weight),
          height: parseFloat(formData.height)
        })
      });

      if (response.ok) {
        // Update user state
        const updatedUser = { ...formData, profile_completed: true };
        setUser(updatedUser);
        onComplete();
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Завершение регистрации</h2>
          <p className="text-gray-600">Заполните данные для создания профиля в AIGA Academy</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Полное имя</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Телефон</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Возраст</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Вес (кг)</label>
              <input
                type="number"
                step="0.1"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Рост (см)</label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Роль</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="student">Студент/Спортсмен</option>
                <option value="coach">Тренер</option>
                <option value="parent">Родитель</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Опыт в боевых искусствах</label>
              <select
                name="martial_arts_experience"
                value={formData.martial_arts_experience}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                required
              >
                <option value="">Выберите уровень</option>
                <option value="beginner">Новичок</option>
                <option value="intermediate">Средний уровень</option>
                <option value="advanced">Продвинутый</option>
                <option value="expert">Эксперт</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Цели и ожидания</label>
            <textarea
              name="goals"
              value={formData.goals}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Опишите ваши цели в тренировках..."
              required
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Медицинские особенности (необязательно)</label>
            <textarea
              name="medical_conditions"
              value={formData.medical_conditions}
              onChange={handleChange}
              rows="2"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Укажите любые медицинские ограничения или особенности..."
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Экстренный контакт</label>
            <input
              type="text"
              name="emergency_contact"
              value={formData.emergency_contact}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Имя и телефон для экстренной связи"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold py-4 px-8 rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition duration-300 disabled:opacity-50"
          >
            {loading ? 'Сохранение...' : 'Завершить регистрацию'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('training');
  const [trainingSessions, setTrainingSessions] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTrainingSessions();
    fetchMyBookings();
  }, []);

  const fetchTrainingSessions = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/training-sessions`);
      if (response.ok) {
        const sessions = await response.json();
        setTrainingSessions(sessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchMyBookings = async () => {
    const { sessionToken } = useAuth();
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/bookings/my`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      if (response.ok) {
        const bookings = await response.json();
        setMyBookings(bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const bookSession = async (sessionId) => {
    const { sessionToken } = useAuth();
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          session_id: sessionId,
          student_id: user.user_id,
          booking_date: new Date().toISOString()
        })
      });

      if (response.ok) {
        await fetchTrainingSessions();
        await fetchMyBookings();
        alert('Тренировка успешно забронирована!');
      } else {
        const error = await response.json();
        alert(error.detail || 'Ошибка при бронировании');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Ошибка при бронировании тренировки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <img 
                src="https://images.unsplash.com/photo-1615117972428-28de67cda58e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwxfHxncmFwcGxpbmclMjB0cmFpbmluZ3xlbnwwfHx8fDE3NTMwOTIyNTB8MA&ixlib=rb-4.1.0&q=85"
                alt="AIGA Academy"
                className="h-12 w-12 rounded-full object-cover mr-4"
              />
              <div>
                <h1 className="text-2xl font-bold">AIGA Connect</h1>
                <p className="text-gray-300">Добро пожаловать, {user?.name}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition duration-300"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'training', label: 'Тренировки', icon: '🥋' },
              { id: 'bookings', label: 'Мои записи', icon: '📅' },
              { id: 'profile', label: 'Профиль', icon: '👤' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-3 rounded-lg font-medium transition duration-300 ${
                  activeTab === tab.id
                    ? 'bg-yellow-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Training Sessions Tab */}
        {activeTab === 'training' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Доступные тренировки</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trainingSessions.map((session) => (
                <div key={session.session_id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="h-48 bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                    <img 
                      src="https://images.unsplash.com/photo-1542937307-e90d0cc07237?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwzfHxncmFwcGxpbmclMjB0cmFpbmluZ3xlbnwwfHx8fDE3NTMwOTIyNTB8MA&ixlib=rb-4.1.0&q=85"
                      alt={session.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{session.title}</h3>
                    <p className="text-gray-600 mb-4">{session.description}</p>
                    <div className="space-y-2 text-sm text-gray-500">
                      <p><strong>Тренер:</strong> {session.coach_name}</p>
                      <p><strong>Дата:</strong> {session.date}</p>
                      <p><strong>Время:</strong> {session.time}</p>
                      <p><strong>Длительность:</strong> {session.duration_minutes} мин</p>
                      <p><strong>Участники:</strong> {session.current_participants}/{session.max_participants}</p>
                      <p><strong>Цена:</strong> {session.price} тенге</p>
                    </div>
                    <button
                      onClick={() => bookSession(session.session_id)}
                      disabled={loading || session.current_participants >= session.max_participants}
                      className="w-full mt-4 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {session.current_participants >= session.max_participants ? 'Мест нет' : 'Записаться'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Bookings Tab */}
        {activeTab === 'bookings' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Мои записи на тренировки</h2>
            <div className="space-y-4">
              {myBookings.map((booking) => (
                <div key={booking.booking_id} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{booking.session.title}</h3>
                      <div className="space-y-1 text-gray-600">
                        <p><strong>Тренер:</strong> {booking.session.coach_name}</p>
                        <p><strong>Дата:</strong> {booking.session.date}</p>
                        <p><strong>Время:</strong> {booking.session.time}</p>
                        <p><strong>Место:</strong> {booking.session.location}</p>
                        <p><strong>Цена:</strong> {booking.session.price} тенге</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        booking.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.status === 'confirmed' ? 'Подтверждена' : 'В ожидании'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {myBookings.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">У вас пока нет записей на тренировки</p>
                  <button
                    onClick={() => setActiveTab('training')}
                    className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
                  >
                    Посмотреть тренировки
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Мой профиль</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">{user?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">{user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">{user?.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Возраст</label>
                <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">{user?.age} лет</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Вес</label>
                <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">{user?.weight} кг</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Рост</label>
                <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">{user?.height} см</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
                <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">{user?.role}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Опыт</label>
                <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">{user?.martial_arts_experience}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Цели</label>
                <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">{user?.goals}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Экстренный контакт</label>
                <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">{user?.emergency_contact}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Landing Page Component
const LandingPage = () => {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1615117972428-28de67cda58e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwxfHxncmFwcGxpbmclMjB0cmFpbmluZ3xlbnwwfHx8fDE3NTMwOTIyNTB8MA&ixlib=rb-4.1.0&q=85"
            alt="AIGA Academy Training"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-gray-800/80"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              AIGA <span className="text-yellow-400">Connect</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Ведущий центр грэпплинга в Казахстане. Присоединяйтесь к нашему сообществу спортсменов и тренеров.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={login}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold py-4 px-8 rounded-lg text-lg hover:from-yellow-600 hover:to-yellow-700 transition duration-300"
              >
                Войти / Регистрация
              </button>
              <a
                href="#features"
                className="bg-transparent border-2 border-white text-white font-bold py-4 px-8 rounded-lg text-lg hover:bg-white hover:text-gray-900 transition duration-300"
              >
                Узнать больше
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Возможности платформы</h2>
            <p className="text-xl text-gray-400">Все необходимые инструменты для эффективных тренировок</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-800 rounded-xl p-8 text-center">
              <div className="text-5xl mb-4">🥋</div>
              <h3 className="text-2xl font-bold text-white mb-4">Запись на тренировки</h3>
              <p className="text-gray-400">Удобная система бронирования тренировочных сессий с тренерами</p>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-8 text-center">
              <div className="text-5xl mb-4">📈</div>
              <h3 className="text-2xl font-bold text-white mb-4">Отслеживание прогресса</h3>
              <p className="text-gray-400">Следите за своими достижениями, поясами и участием в соревнованиях</p>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-8 text-center">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-2xl font-bold text-white mb-4">Сообщество</h3>
              <p className="text-gray-400">Общайтесь с другими спортсменами, участвуйте в челленджах</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">О AIGA Academy</h2>
              <p className="text-lg text-gray-300 mb-6">
                Мы - ведущий центр грэпплинга в Казахстане, который объединяет спортсменов, 
                тренеров и любителей боевых искусств в единое сообщество.
              </p>
              <p className="text-lg text-gray-300 mb-8">
                Наша цель - предоставить современную цифровую платформу для эффективного 
                управления тренировочным процессом и развития спортивного сообщества.
              </p>
              <div className="text-center lg:text-left">
                <p className="text-yellow-400 font-bold text-lg">📍 г. Астана, ул. Ахмедьярова, 3</p>
              </div>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1664802273197-7cdd6a6cbc6e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwyfHxtYXJ0aWFsJTIwYXJ0cyUyMGFjYWRlbXl8ZW58MHx8fHwxNzUzMDkyMjU4fDA&ixlib=rb-4.1.0&q=85"
                alt="AIGA Academy Training"
                className="rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-yellow-500 to-yellow-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Готовы начать тренировки?
          </h2>
          <p className="text-xl text-yellow-100 mb-8">
            Присоединяйтесь к нашему сообществу и начните свой путь в мире грэпплинга
          </p>
          <button
            onClick={login}
            className="bg-white text-yellow-600 font-bold py-4 px-8 rounded-lg text-lg hover:bg-gray-100 transition duration-300"
          >
            Зарегистрироваться сейчас
          </button>
        </div>
      </section>
    </div>
  );
};

// Main App Component
const App = () => {
  const { user, loading } = useAuth();
  const [showRegistration, setShowRegistration] = useState(false);

  useEffect(() => {
    if (user && !user.profile_completed) {
      setShowRegistration(true);
    } else {
      setShowRegistration(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white text-xl">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (showRegistration) {
    return <RegistrationForm onComplete={() => setShowRegistration(false)} />;
  }

  return user && user.profile_completed ? <Dashboard /> : <LandingPage />;
};

// Export wrapped with AuthProvider
export default function AppWithAuth() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}