import React, { useState, useEffect, useRef } from 'react';
import { Users, Play, Trophy, Clock, Home } from 'lucide-react';
import { db } from './firebaseConfig';
import { ref, set, get, onValue, off, remove } from 'firebase/database';

const CATEGORIES = ['Name', 'Place', 'Animal', 'Thing'];
const GAME_TIME = 60;

export default function NamePlaceAnimalThing() {
  const [screen, setScreen] = useState('home');
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [players, setPlayers] = useState([]);
  const [currentLetter, setCurrentLetter] = useState('');
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [answers, setAnswers] = useState({});
  const [gameStarted, setGameStarted] = useState(false);
  const [scores, setScores] = useState({});
  const [isHost, setIsHost] = useState(false);
  const timerRef = useRef(null);
  
  // 🔥 دمج كود Firebase: لا نحتاج إلى pollRef بعد الآن

  const generateId = () => Math.random().toString(36).substring(2, 15);
  const generateRoomCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  // 🔥 وظائف التخزين باستخدام Firebase Realtime Database
  
  // 1. حفظ حالة اللعبة الرئيسية
  const saveGameData = async (data) => {
  try {
    console.log('🔵 Attempting to save:', data);
    console.log('🔵 Room code:', roomCode);
    console.log('🔵 Database URL:', db.app.options.databaseURL); // تحقق من الرابط
    
    await set(ref(db, `games/${roomCode}`), data);
    console.log('✅ Save successful!');
    return true;
  } catch (error) {
    console.error('❌ Firebase save error:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    alert('Error saving game data to server.');
    return false;
  }
};

  // 2. تحميل حالة اللعبة (للاستخدام لمرة واحدة مثل التحقق من وجود الغرفة)
  const loadGameData = async (code) => {
    try {
      const snapshot = await get(ref(db, `games/${code}`));
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('Firebase load error:', error);
      return null;
    }
  };

  // 3. حفظ إجابات لاعب معين
  const savePlayerAnswers = async (playerAnswers) => {
    try {
      await set(ref(db, `answers/${roomCode}/${playerId}`), playerAnswers);
      alert('Answers submitted! Waiting for other players...');
    } catch (error) {
      console.error('Firebase save answers error:', error);
      alert('Error submitting answers.');
    }
  };

  // 4. تحميل جميع الإجابات لجميع اللاعبين (يتم استدعاؤها في نهاية اللعبة)
  const loadAllAnswers = async () => {
    try {
      const snapshot = await get(ref(db, `answers/${roomCode}`));
      return snapshot.exists() ? snapshot.val() : {};
    } catch (error) {
      console.error('Firebase load all answers error:', error);
      return {};
    }
  };


  // 🔥 الاستماع للتحديثات في الوقت الفعلي (Realtime Listener - استبدال Polling)
  useEffect(() => {
    if (!roomCode || screen === 'home') return;

    const gameRef = ref(db, `games/${roomCode}`);
    
    // دالة الاستماع: يتم استدعاؤها في كل مرة تتغير فيها بيانات اللعبة
    const unsubscribe = onValue(gameRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPlayers(data.players || []);
        
        // الانتقال من اللوبي إلى اللعب
        if (data.gameStarted && !gameStarted) {
          setGameStarted(true);
          setCurrentLetter(data.currentLetter);
          setScreen('game');
        }
        
        // الانتقال من اللعب إلى النتائج
        if (data.gameEnded && screen === 'game') {
          if (timerRef.current) clearInterval(timerRef.current);
          const allAnswers = await loadAllAnswers();
          calculateScores(allAnswers, data.players);
          setScreen('results');
        }
      }
    });

    // دالة التنظيف (Cleanup): توقف الاستماع عند إغلاق أو مغادرة المكون
    return () => off(gameRef, 'value', unsubscribe);
  }, [roomCode, screen, gameStarted]);

  // Timer
  useEffect(() => {
    if (gameStarted && screen === 'game' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            if (isHost) {
              endGame();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      timerRef.current = timer;
      return () => clearInterval(timer);
    }
  }, [gameStarted, screen, timeLeft, isHost]);

  const createRoom = async () => {
  if (!playerName.trim()) {
    alert('Please enter your name');
    return;
  }

  const code = generateRoomCode();
  const pid = generateId();
  
  setRoomCode(code);
  setPlayerId(pid);
  setIsHost(true);

  const newPlayer = {
    id: pid,
    name: playerName.trim(),
    isHost: true
  };

  const gameData = {
    players: [newPlayer],
    gameStarted: false,
    currentLetter: '',
    gameEnded: false
  };

  console.log('🔵 Creating room with code:', code); // للتشخيص
  const success = await saveGameData(gameData);
  if (success) {
    setPlayers([newPlayer]);
    setScreen('lobby');
    console.log('✅ Room created successfully!'); // للتشخيص
  }
};
```

---

## 🔍 اختبار إضافي:

### 1️⃣ تأكد من Firebase Console:

- افتح **Firebase Console** → **Realtime Database**
- لما تعمل غرفة جديدة
- شوف هل ظهر في البيانات حاجة زي كده:
```
games
  └── ABCD12  (أو أي كود تاني)
       ├── players: [...]
       ├── gameStarted: false
       └── ...
```

**لو مش ظاهر حاجة** → معناه Firebase مش بيحفظ البيانات أصلاً

---

### 2️⃣ اختبار مع Console:

لما تعمل غرفة، شوف في Console:
```
🔵 Creating room with code: ABCD12
🔵 Attempting to save: {...}
✅ Save successful!
✅ Room created successfully!
```

ولما صاحبك يحاول يدخل، شوف:
```
🔵 Joining room: ABCD12

    const success = await saveGameData(gameData);
    if (success) {
      setPlayers([newPlayer]);
      setScreen('lobby');
    }
  };

  const joinRoom = async () => {
  const code = roomCode.trim().toUpperCase();
  if (!playerName.trim() || !code) {
    alert('Please enter your name and room code');
    return;
  }

  console.log('🔵 Joining room:', code); // للتشخيص
  
  const data = await loadGameData(code);
  
  console.log('🔵 Room data:', data); // للتشخيص
  
  if (!data) {
    alert('Room not found');
    console.log('❌ Room not found in database'); // للتشخيص
    return;
  }

  if (data.gameStarted) {
    alert('Game already in progress');
    return;
  }

  const pid = generateId();
  setPlayerId(pid);
  setRoomCode(code);

  const newPlayer = {
    id: pid,
    name: playerName.trim(),
    isHost: false
  };

  const updatedPlayers = [...(data.players || []), newPlayer];
  
  await saveGameData({ ...data, players: updatedPlayers });
  
  setPlayers(updatedPlayers);
  setScreen('lobby');
  console.log('✅ Joined room successfully!'); // للتشخيص
};
  const startGame = async () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    
    setCurrentLetter(randomLetter);
    setGameStarted(true);
    setTimeLeft(GAME_TIME);

    const data = await loadGameData(roomCode);
    // يتم إرسال التحديث إلى Firebase
    await saveGameData({
      ...data,
      gameStarted: true,
      currentLetter: randomLetter,
      gameEnded: false
    });

    setScreen('game');
  };

  const submitAnswers = async () => {
    // يتم حفظ الإجابات في Firebase
    await savePlayerAnswers(answers);
  };

  const endGame = async () => {
    const data = await loadGameData(roomCode);
    // يتم إرسال إشارة انتهاء اللعبة إلى Firebase
    await saveGameData({
      ...data,
      gameEnded: true
    });
  };

  const calculateScores = (allAnswers, playersList) => {
    const newScores = {};
    const answerCounts = {};

    // حساب تكرارات كل إجابة
    CATEGORIES.forEach(category => {
      answerCounts[category] = {};
      Object.values(allAnswers).forEach(playerAnswers => {
        const answer = playerAnswers && playerAnswers[category] ? playerAnswers[category].toLowerCase().trim() : '';
        if (answer && currentLetter && answer.startsWith(currentLetter.toLowerCase())) {
          answerCounts[category][answer] = (answerCounts[category][answer] || 0) + 1;
        }
      });
    });

    // حساب النقاط
    Object.entries(allAnswers).forEach(([pid, playerAnswers]) => {
      let score = 0;
      CATEGORIES.forEach(category => {
        const answer = playerAnswers && playerAnswers[category] ? playerAnswers[category].toLowerCase().trim() : '';
        if (answer && currentLetter && answer.startsWith(currentLetter.toLowerCase())) {
          const count = answerCounts[category][answer];
          score += count === 1 ? 10 : 5; // إجابة فريدة: 10، مكررة: 5
        }
      });
      newScores[pid] = score;
    });

    setScores(newScores);
  };

  const handleAnswerChange = (category, value) => {
    setAnswers(prev => ({ ...prev, [category]: value }));
  };

  const resetGame = async () => {
    const data = await loadGameData(roomCode);
    
    // 🔥 مسح الإجابات من Firebase
    try {
      await remove(ref(db, `answers/${roomCode}`));
    } catch (error) {
      console.error('Error clearing answers:', error);
    }

    setGameStarted(false);
    setTimeLeft(GAME_TIME);
    setAnswers({});
    setScores({});
    setCurrentLetter('');
    
    // تحديث حالة اللعبة في Firebase
    await saveGameData({
      ...data,
      gameStarted: false,
      gameEnded: false,
      currentLetter: ''
    });

    setScreen('lobby');
  };

  const leaveRoom = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (roomCode && playerId) {
      try {
        const data = await loadGameData(roomCode);
        if (data && data.players) {
          const updatedPlayers = data.players.filter(p => p.id !== playerId);
          
          if (updatedPlayers.length > 0) {
            // تحديث قائمة اللاعبين في Firebase
            await saveGameData({ ...data, players: updatedPlayers });
          } else {
            // حذف الغرفة بالكامل إذا لم يتبق أحد (تنظيف الخادم)
            await remove(ref(db, `games/${roomCode}`));
            await remove(ref(db, `answers/${roomCode}`));
          }
        }
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    }
    
    // إعادة تعيين الحالة المحلية
    setScreen('home');
    setRoomCode('');
    setPlayerName('');
    setPlayerId('');
    setPlayers([]);
    setAnswers({});
    setScores({});
    setGameStarted(false);
    setIsHost(false);
  };

  // ------------------------------------
  // Home Screen UI (No change)
  // ------------------------------------
  if (screen === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Name Place Animal Thing</h1>
            <p className="text-gray-600">Multiplayer Word Game</p>
          </div>

          <div className="space-y-6">
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
              maxLength={20}
            />

            <button
              onClick={createRoom}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition flex items-center justify-center gap-2"
            >
              <Users size={20} />
              Create Room
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-gray-500 text-sm">OR</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            <input
              type="text"
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none uppercase"
              maxLength={8}
            />

            <button
              onClick={joinRoom}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition"
            >
              Join Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------
  // Lobby Screen UI (No change)
  // ------------------------------------
  if (screen === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Room: {roomCode}</h2>
            <p className="text-gray-600">Share this code with friends!</p>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Users size={20} />
              Players ({players.length})
            </h3>
            <div className="space-y-2">
              {players.map(player => (
                <div
                  key={player.id}
                  className="bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-3 rounded-lg flex items-center justify-between"
                >
                  <span className="font-medium text-gray-800">{player.name}</span>
                  {player.isHost && (
                    <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full font-semibold">
                      HOST
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {isHost && (
              <button
                onClick={startGame}
                disabled={players.length < 2}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Play size={20} />
                Start Game
              </button>
            )}
            {!isHost && (
              <div className="text-center text-gray-600 py-4">
                Waiting for host to start the game...
              </div>
            )}
            <button
              onClick={leaveRoom}
              className="w-full bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition flex items-center justify-center gap-2"
            >
              <Home size={20} />
              Leave Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------
  // Game Screen UI (No change)
  // ------------------------------------
  if (screen === 'game') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 via-teal-500 to-blue-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="flex justify-between items-center mb-6">
            <div className="text-center">
              <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                {currentLetter}
              </div>
              <p className="text-gray-600 text-sm mt-1">Your Letter</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2 text-3xl font-bold text-gray-800">
                <Clock size={32} />
                {timeLeft}s
              </div>
              <p className="text-gray-600 text-sm mt-1">Time Left</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {CATEGORIES.map(category => (
              <div key={category}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {category}
                </label>
                <input
                  type="text"
                  value={answers[category] || ''}
                  onChange={(e) => handleAnswerChange(category, e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                  placeholder={`Enter a ${category.toLowerCase()} starting with ${currentLetter}`}
                  disabled={timeLeft === 0}
                />
              </div>
            ))}
          </div>

          <button
            onClick={submitAnswers}
            disabled={timeLeft === 0}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {timeLeft === 0 ? 'Time\'s Up!' : 'Submit Answers'}
          </button>
        </div>
      </div>
    );
  }

  // ------------------------------------
  // Results Screen UI (No change)
  // ------------------------------------
  if (screen === 'results') {
    const sortedPlayers = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));

    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-600 via-orange-500 to-red-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <Trophy className="mx-auto text-yellow-500 mb-4" size={64} />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Game Results</h2>
            <p className="text-gray-600">Letter: {currentLetter}</p>
          </div>

          <div className="space-y-3 mb-8">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`px-4 py-4 rounded-lg flex items-center justify-between ${
                  index === 0
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
                    : 'bg-gradient-to-r from-gray-200 to-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-700">#{index + 1}</span>
                  <span className="font-semibold text-gray-800">{player.name}</span>
                </div>
                <span className="text-2xl font-bold text-gray-800">{scores[player.id] || 0}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {isHost && (
              <button
                onClick={resetGame}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
              >
                Play Again
              </button>
            )}
            <button
              onClick={leaveRoom}
              className="w-full bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition flex items-center justify-center gap-2"
            >
              <Home size={20} />
              Leave Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;

}

