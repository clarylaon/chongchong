'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Users, Calendar, Activity, Trophy, Plus, 
  Trash2, UserCheck, RefreshCw, Edit2, Save, X, ArrowRightLeft,
  ChevronUp, ChevronDown, Instagram, Youtube, MessageCircle,
  LogIn, LogOut, Star, Clock, Bell, Download, UserPlus,
  PieChart as PieChartIcon, TrendingUp, Settings, Send, Crown, Home,
  ThumbsUp, AlertTriangle
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell
} from 'recharts';

// --------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
// --------------------------------------------------------

const calculateLevel = (stats) => {
  const { balance, passing, dribble, shooting, touch, stamina } = stats;
  const sum = Number(balance) + Number(passing) + Number(dribble) + Number(shooting) + Number(touch) + Number(stamina);
  return Number((sum / 6).toFixed(2));
};

const calculateExpireDate = (type, dateStr) => {
  if (type === '연납형') {
    const nextYear = new Date().getFullYear() + 1;
    return `${nextYear}-02-28`;
  } else if (type === '반납형' && dateStr) {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + 4);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
};

const getDday = (expireDateStr) => {
  if (!expireDateStr) return null;
  const today = new Date();
  today.setHours(0,0,0,0);
  const exp = new Date(expireDateStr);
  exp.setHours(0,0,0,0);
  const diffTime = exp - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const formatDateUI = (dateString, timeStr) => {
  if (!dateString) return '';
  const options = { month: 'numeric', day: 'numeric', weekday: 'short' };
  const d = new Date(dateString).toLocaleDateString('ko-KR', options);
  return timeStr ? `${d} ${timeStr}` : d;
};

const formatTime = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const DdayBadge = ({ dday }) => {
  if (dday === null) return null;
  if (dday < 0) return <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded border border-red-300 font-bold ml-1 shrink-0">만료됨</span>;
  if (dday <= 14) return <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded border border-yellow-400 font-bold ml-1 shrink-0">D-{dday}</span>;
  return null;
};

// --- [추가됨] 선수 업적(뱃지) 계산 함수 ---
const getPlayerBadges = (player, records) => {
  if (!player) return [];
  const pRecords = records.filter(r => r.player_id === player.id);
  const badges = [];
  const totalGoals = pRecords.reduce((s, r) => s + r.goals, 0);
  const totalAssists = pRecords.reduce((s, r) => s + r.assists, 0);
  const attendance = pRecords.length;

  // 1. 출석 관련
  if (attendance > 0 && attendance <= 3) badges.push({ icon: '🌱', name: '새싹', desc: '출석 3회 이하 뉴비' });
  if (attendance >= 10) badges.push({ icon: '👼', name: '단골손님', desc: '10경기 이상 출석' });
  if (attendance >= 20) badges.push({ icon: '🛡️', name: '철강왕', desc: '20경기 이상 출석' });

  // 2. 기록 관련
  if (pRecords.some(r => r.goals >= 3)) badges.push({ icon: '🔥', name: '해트트릭', desc: '한 경기 3골 이상 달성' });
  if (pRecords.some(r => r.assists >= 3)) badges.push({ icon: '🤝', name: '택배기사', desc: '한 경기 3어시 이상 달성' });
  if (totalGoals >= 10) badges.push({ icon: '⚽', name: '골잡이', desc: '누적 10골 달성' });
  if (totalGoals >= 30) badges.push({ icon: '👑', name: '레전드', desc: '누적 30골 달성' });
  if (totalAssists >= 15) badges.push({ icon: '🎯', name: '마에스트로', desc: '누적 15도움 달성' });

  // 3. 스탯 관련
  if (player.shooting >= 8) badges.push({ icon: '🚀', name: '캐논슈터', desc: '슈팅 스탯 8 이상' });
  if (player.dribble >= 8) badges.push({ icon: '🐆', name: '치타', desc: '드리블 스탯 8 이상' });
  if (player.passing >= 8) badges.push({ icon: '🥏', name: '패스마스터', desc: '패스 스탯 8 이상' });
  if (player.stamina >= 8) badges.push({ icon: '🫀', name: '두개의심장', desc: '체력 스탯 8 이상' });

  // 4. 매너 관련
  if ((player.manner_score || 100) >= 120) badges.push({ icon: '😇', name: '매너왕', desc: '매너점수 120점 돌파' });
  if ((player.yellow_cards || 0) >= 1) badges.push({ icon: '⚠️', name: '요주의', desc: '경고 1회 이상 누적' });

  return badges;
};

const PlayerName = ({ player, records = [] }) => {
  const isStar = player.group === '스타즈';
  const isGuest = player.group === '게스트';
  const dday = isStar ? getDday(player.expire_date) : null;
  const badges = records.length > 0 ? getPlayerBadges(player, records) : [];
  // 작은 아이콘으로 보여줄 핵심 뱃지 1개만 추출 (요주의 > 해트트릭 > 레전드 순)
  const topBadge = badges.find(b => b.name === '요주의') || badges.find(b => b.name === '해트트릭') || badges.find(b => b.name === '레전드') || badges[0];

  return (
    <span className="flex items-center gap-1 font-bold">
      {isStar && <Star size={14} className="fill-blue-500 text-blue-500 shrink-0" />}
      {isGuest && <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full shrink-0">G</span>}
      <span className={`whitespace-nowrap ${dday !== null && dday < 0 ? 'text-gray-400 line-through' : ''}`}>
        {player.name}
        {topBadge && <span className="ml-1 text-sm" title={topBadge.desc}>{topBadge.icon}</span>}
        {isGuest && player.stars_type && (
          <span className="text-[10px] text-green-700 font-normal ml-1 bg-green-50 px-1 rounded border border-green-200 shrink-0">
            초대: {player.stars_type}
          </span>
        )}
      </span>
    </span>
  );
};

const Card = ({ title, children, className = "" }) => (
  <div className={`bg-white rounded-lg border-2 border-blue-600 overflow-hidden shadow-sm flex flex-col ${className}`}>
    <div className="bg-blue-600 px-4 py-2 shrink-0">
      <h3 className="text-white font-bold text-lg">{title}</h3>
    </div>
    <div className="p-4 flex-1">{children}</div>
  </div>
);

const MoveTeamModal = ({ player, currentTeam, teamCount, onMove, onClose }) => {
  if (!player) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80] p-4">
      <div className="bg-white rounded-lg w-full max-w-sm p-6 shadow-2xl">
        <h3 className="text-lg font-bold mb-4 text-center">{player.name} 팀 이동</h3>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: teamCount }).map((_, i) => {
            const tNo = i + 1;
            return (
              <button key={tNo} onClick={() => onMove(player.id, tNo)} disabled={tNo === currentTeam}
                className={`p-3 rounded font-bold border ${tNo === currentTeam ? 'bg-gray-200 text-gray-400' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-300'}`}>
                {tNo === currentTeam ? '현재 팀' : `팀 ${tNo}로 이동`}
              </button>
            )
          })}
        </div>
        <button onClick={onClose} className="mt-4 w-full bg-gray-500 text-white py-2 rounded font-bold">취소</button>
      </div>
    </div>
  );
};

const PlayerDetailModal = ({ player, records, totalMatches, onClose }) => {
  if (!player) return null;
  const history = records.filter(r => r.player_id === player.id).sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalGoals = history.reduce((acc, cur) => acc + cur.goals, 0);
  const totalAssists = history.reduce((acc, cur) => acc + cur.assists, 0);
  const attendanceCount = history.length;
  const attendanceRate = totalMatches > 0 ? Math.round((attendanceCount / totalMatches) * 100) : 0;
  
  const dday = player.group === '스타즈' ? getDday(player.expire_date) : null;
  const badges = getPlayerBadges(player, records);
  
  const chartData = [
    { subject: '밸런스', A: player.balance, fullMark: 10 },
    { subject: '패스', A: player.passing, fullMark: 10 },
    { subject: '드리블', A: player.dribble, fullMark: 10 },
    { subject: '슈팅', A: player.shooting, fullMark: 10 },
    { subject: '터치', A: player.touch, fullMark: 10 },
    { subject: '체력', A: player.stamina, fullMark: 10 },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80] p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="bg-blue-700 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold"><PlayerName player={player}/> 상세 정보</h2>
          <button onClick={onClose}><X size={24} /></button>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 flex flex-col items-center">
              
              {/* --- [추가됨] 수집한 뱃지 리스트 --- */}
              {badges.length > 0 && (
                <div className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl mb-4">
                  <p className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">🎖️ 획득한 업적 도장</p>
                  <div className="flex flex-wrap gap-2">
                    {badges.map(b => (
                      <div key={b.name} className="flex items-center gap-1.5 bg-white border border-gray-300 px-2 py-1 rounded-lg shadow-sm" title={b.desc}>
                        <span className="text-base">{b.icon}</span>
                        <span className="text-xs font-extrabold text-gray-700">{b.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="w-full h-64 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} />
                    <Radar name={player.name} dataKey="A" stroke="#2563EB" fill="#3B82F6" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-8 text-xs font-bold text-blue-800 bg-white/80 px-2 rounded">
                  Lv.{player.level}
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-2xl font-bold text-blue-700">Level {player.level}</p>
                <p className="text-sm text-gray-600 mb-2">성별: {player.gender} | 등급: <span className="font-bold text-blue-600">{player.group||'일반'}</span></p>

                <div className="flex justify-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600 border border-gray-200">
                    매너점수 {player.manner_score ?? 100}점
                  </span>
                  {(player.yellow_cards || 0) > 0 && (
                    <span className="px-3 py-1 bg-red-50 rounded-full text-xs font-bold text-red-600 border border-red-200">
                      옐로카드 {player.yellow_cards}장
                    </span>
                  )}
                </div>
                
                {player.group === '스타즈' && (
                  <div className="mt-2 bg-blue-50 border border-blue-200 p-2 rounded text-sm text-left inline-block">
                     <p><b>유형:</b> {player.stars_type}</p>
                     <p><b>가입일:</b> {player.payment_date || '미등록'}</p>
                     <p className="flex items-center gap-1"><b>만료일:</b> {player.expire_date || '미등록'} <DdayBadge dday={dday}/></p>
                  </div>
                )}
                {player.group === '게스트' && player.stars_type && (
                  <div className="mt-2 bg-green-50 border border-green-200 p-2 rounded text-sm text-left inline-block text-green-800">
                     <p><b>초대자:</b> {player.stars_type}</p>
                  </div>
                )}
                
                <div className="mt-3 bg-gray-100 p-3 rounded-lg border inline-block text-sm text-left w-full max-w-xs">
                  <p className="font-bold border-b pb-1 mb-1 text-gray-700">🏆 통합 통계</p>
                  <p><b>출석:</b> {attendanceCount}회 <span className="text-xs text-gray-500">(출석률 {attendanceRate}%)</span></p>
                  <p><b>공격:</b> {totalGoals}골 / {totalAssists}어시</p>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2 border-b pb-1 mt-4 md:mt-0">최근 경기 기록</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {history.length === 0 ? <p className="text-gray-400">기록이 없습니다.</p> : 
                  history.map(h => (
                    <div key={h.id} className="bg-gray-50 p-2 rounded border flex justify-between items-center text-sm">
                      <span className="font-bold text-gray-700">{h.date}</span>
                      <span>팀{h.team}</span>
                      <span className="font-bold text-blue-600">{h.goals}골</span>
                      <span className="font-bold text-green-600">{h.assists}어시</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function FutsalCloudApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  
  const [players, setPlayers] = useState([]);
  const [records, setRecords] = useState([]); 
  const [schedules, setSchedules] = useState([]);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [matchTimeStart, setMatchTimeStart] = useState('20:00');
  const [matchTimeEnd, setMatchTimeEnd] = useState('22:00');
  const [deadlineDate, setDeadlineDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadlineTime, setDeadlineTime] = useState('18:00');
  const [isInitialized, setIsInitialized] = useState(false);

  const [showMvpModal, setShowMvpModal] = useState(false);
  const [todayMvps, setTodayMvps] = useState({ scorer: null, assister: null });
  const [hasParty, setHasParty] = useState(false);
  const [partyLocation, setPartyLocation] = useState('');
  const [partyGuestsText, setPartyGuestsText] = useState('');
  const [partyGuestInput, setPartyGuestInput] = useState('');
  const [showPartyListModal, setShowPartyListModal] = useState(false);
  const [teamCount, setTeamCount] = useState(2);
  
  // --- 전광판 및 타이머 상태 ---
  const [scoreTeam1, setScoreTeam1] = useState(0);
  const [scoreTeam2, setScoreTeam2] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(900); // 15분
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // --- [추가됨] 미니 포메이션 보드 상태 ---
  // 구조: { [teamNo]: { [playerId]: { x: 50, y: 50 } } }
  const [formations, setFormations] = useState({});

  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds(prev => prev - 1), 1000);
    } else if (isTimerRunning && timerSeconds === 0) {
      setIsTimerRunning(false);
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        const playRealWhistle = (startTime, duration) => {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gainNode = ctx.createGain();
          osc1.connect(gainNode);
          osc2.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          const baseFreq = 2600; 
          osc1.type = 'triangle';
          osc2.type = 'sine';
          osc1.frequency.setValueAtTime(baseFreq - 300, startTime);
          osc1.frequency.linearRampToValueAtTime(baseFreq, startTime + 0.05);
          osc2.frequency.setValueAtTime(baseFreq - 300, startTime);
          osc2.frequency.linearRampToValueAtTime(baseFreq + 50, startTime + 0.05); 
          
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05); 
          gainNode.gain.setValueAtTime(0.3, startTime + duration - 0.05); 
          gainNode.gain.linearRampToValueAtTime(0, startTime + duration); 
          
          osc1.start(startTime);
          osc2.start(startTime);
          osc1.stop(startTime + duration);
          osc2.stop(startTime + duration);
        };

        const now = ctx.currentTime;
        playRealWhistle(now, 0.2);           
        playRealWhistle(now + 0.3, 0.2);     
        playRealWhistle(now + 0.6, 1.2);     
      } catch (e) {
        console.error("오디오 재생 오류", e);
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const defaultNewPlayer = { 
    name: '', gender: '남성', group: '일반', 
    stars_type: '연납형', payment_date: new Date().toISOString().split('T')[0], expire_date: '',
    balance: 5, passing: 5, dribble: 5, shooting: 5, touch: 5, stamina: 5, manner_score: 100, yellow_cards: 0 
  };
  const [newPlayer, setNewPlayer] = useState(defaultNewPlayer);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [detailPlayer, setDetailPlayer] = useState(null);
  const [movePlayerTarget, setMovePlayerTarget] = useState(null);
  
  const [starsModalConfig, setStarsModalConfig] = useState({ isOpen: false, target: null, previousGroup: '일반' });
  const [starsModalData, setStarsModalData] = useState({ option: '연납형', startDate: new Date().toISOString().split('T')[0] });

  const [tempAttendance, setTempAttendance] = useState([]);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTemplate, setShareTemplate] = useState('기본형');
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestForm, setGuestForm] = useState({ name: '', gender: '남성', inviter: '', level: 5 });
  const [showGuestsInList, setShowGuestsInList] = useState(false);

  const [filterGender, setFilterGender] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'level', direction: 'desc' });

  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const socialLinks = { instagram: "https://www.instagram.com", youtube: "", kakao: "" }; 

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('vote') === 'true') {
        const d = params.get('date');
        if (d) setSelectedDate(d);
        setShowVoteModal(true);
      }
    }
    const script = document.createElement('script');
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
    script.async = true;
    document.head.appendChild(script);
    script.onload = () => {
      if (!window.Kakao.isInitialized()) window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_APP_KEY); 
    };
  }, []);

  const formatKakaoDate = (dateStr) => {
    if(!dateStr) return { m: '', d: '', day: '' };
    const dt = new Date(dateStr);
    const days = ['일','월','화','수','목','금','토'];
    return { m: dt.getMonth() + 1, d: dt.getDate(), day: days[dt.getDay()] };
  };

  const getShareText = (type) => {
    const match = formatKakaoDate(selectedDate);
    const dead = formatKakaoDate(deadlineDate);
    const partyText = hasParty ? `\n\n🍻 뒷풀이 안내\n장소: ${partyLocation || '추후 공지'}\n* 링크에서 뒷풀이 참석 여부도 꼭 함께 체크해 주세요!` : '';
    
    if (type === '게스트용') {
      return `[🏁 총총 FC 게스트초청데이‼️]\n\n안녕하세요 총총FC 여러분~\n${match.m}월 ${match.d}일 경기는 “게스트초청데이” 입니다\n우리 주변에 축구를 사랑하는 지인들을 초대하여 (축잘알,선출환영) 총총FC를 홍보하고, 함께 뛰고 친목할 수 있는 시간을 가지려 합니다! 타대학/대학원 상관없이 초청가능하니 많은 참여 부탁드립니다\n\n📅 일시\n${match.m}월 ${match.d}일 (${match.day}) ${matchTimeStart}~${matchTimeEnd} 경기\n* 경기 10분전 도착하시어 환복해주시면 원활한 경기진행이 됩니다.\n\n⚽️ 구장위치\n용산 더베이스 풋살장\n서울 용산구 한강대로23길 55 아이파크몰 리빙파크 9층${partyText}\n\n💰 참가비:\n* 스타즈: 면제\n* 일반회원: 10,000원\n* 게스트: 10,000원\n\n⏰ 마감: ${dead.m}월 ${dead.d}일 ${deadlineTime}까지\n\n\n* 일반회원은 입금완료 시 참석 확정입니다!\n* 게스트 비용은 미리 입금해주시면 감사하겠습니다!`;
    }
    return `[🏁 총총 FC 풋살 모임 투표 안내‼️]\n\n안녕하세요 총총FC 여러분\n${match.m}월 ${match.d}일 경기 안내드립니다!\n\n📅 일시\n${match.m}월 ${match.d}일 (${match.day}) ${matchTimeStart}~${matchTimeEnd} 경기\n\n⚽️ 구장위치\n용산 더베이스 풋살장\n서울 용산구 한강대로23길 55 아이파크몰 리빙파크 9층${partyText}\n\n💰 참가비:\n* 스타즈: 면제\n* 일반회원: 10,000원\n\n⏰ 마감: ${dead.m}월 ${dead.d}일 ${deadlineTime}까지\n\n* 일반회원은 입금완료 시 참석 확정입니다!`;
  };

  const executeKakaoShare = () => {
    if (window.Kakao && window.Kakao.isInitialized()) {
      const magicLinkUrl = `${window.location.origin}${window.location.pathname}?vote=true&date=${selectedDate}`;
      const text = getShareText(shareTemplate);
      window.Kakao.Share.sendDefault({ objectType: 'text', text: text, link: { mobileWebUrl: magicLinkUrl, webUrl: magicLinkUrl }, buttonTitle: '투표하러 가기 👆' });
      setShowShareModal(false);
    } else { alert('카카오톡 기능을 불러오는 중입니다. 잠시 후 시도해주세요.'); }
  };

  const shareMatchReminder = () => {
    if (window.Kakao && window.Kakao.isInitialized()) {
      const match = formatKakaoDate(selectedDate);
      const magicLinkUrl = `${window.location.origin}${window.location.pathname}`;
      const text = `[🏁 총총 FC 당일 경기 안내‼️]\n\n안녕하세요 총총FC 여러분\n오늘 경기 안내드립니다!\n\n📅 일시\n${match.m}월 ${match.d}일 (${match.day}) ${matchTimeStart}~${matchTimeEnd} 경기\n* 경기 10분전 도착하시어 환복해주시면 원활한 경기진행이 됩니다.\n\n⚽️ 구장위치\n용산 더베이스 풋살장\n서울 용산구 한강대로23길 55 아이파크몰 리빙파크 9층`;
      window.Kakao.Share.sendDefault({ objectType: 'text', text: text, link: { mobileWebUrl: magicLinkUrl, webUrl: magicLinkUrl }, buttonTitle: '웹사이트 확인하기' });
    } else { alert('카카오톡 기능을 불러오는 중입니다. 잠시 후 시도해주세요.'); }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAdmin(!!session);
    };
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAdmin(!!session);
      if (!session && (activeTab === 'attendance' || activeTab === 'members')) setActiveTab('dashboard'); 
    });
    return () => authListener.subscription.unsubscribe();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    const { data: pData } = await supabase.from('players').select('*');
    if (pData) setPlayers(pData);
    const { data: rData } = await supabase.from('match_records').select('*');
    if (rData) setRecords(rData);
    const { data: sData } = await supabase.from('match_schedules').select('*').order('date', { ascending: true });
    if (sData) setSchedules(sData);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (isInitialized || schedules.length === 0) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const upcoming = schedules.filter(s => s.date >= todayStr && !s.is_completed);
    
    if (upcoming.length > 0) {
      setSelectedDate(upcoming[0].date);
      setMatchTimeStart(upcoming[0].start_time || '20:00');
      setMatchTimeEnd(upcoming[0].end_time || '22:00');
      setDeadlineDate(upcoming[0].deadline_date || upcoming[0].date);
      setDeadlineTime(upcoming[0].deadline_time || '18:00');
      setHasParty(upcoming[0].has_party || false);
      setPartyLocation(upcoming[0].party_location || '');
      setPartyGuestsText(upcoming[0].party_guests || ''); 
      setIsInitialized(true); 
    }
  }, [schedules, isInitialized]);

  useEffect(() => {
    const currentDayIds = records.filter(r => r.date === selectedDate).map(r => r.player_id);
    setTempAttendance(currentDayIds);
  }, [records, selectedDate]);

  const getRankings = (playersArr, type) => [...playersArr].sort((a, b) => b[type] !== a[type] ? b[type] - a[type] : b.attendance - a.attendance);

  const handleSaveSchedule = async () => {
    if (!isAdmin) return;
    const { error } = await supabase.from('match_schedules').upsert({
      date: selectedDate, start_time: matchTimeStart, end_time: matchTimeEnd,
      deadline_date: deadlineDate, deadline_time: deadlineTime,
      has_party: hasParty, party_location: partyLocation, party_guests: partyGuestsText
    });
    if (!error) { alert(`${selectedDate} 경기 및 뒷풀이 일정이 등록되었습니다!`); fetchData(); } 
    else { alert('일정 등록에 실패했습니다.'); }
  };

  const playerStats = useMemo(() => {
    const stats = {};
    players.forEach(p => { 
      stats[p.id] = { id: p.id, name: p.name, group: p.group, expire_date: p.expire_date, gender: p.gender, goals: 0, assists: 0, attendance: 0 }; 
    });
    records.forEach(r => {
      if (stats[r.player_id]) { 
        stats[r.player_id].goals += r.goals; 
        stats[r.player_id].assists += r.assists; 
        stats[r.player_id].attendance += 1;
      }
    });
    return stats;
  }, [players, records]);

  const allTimePlayersArray = useMemo(() => Object.values(playerStats).filter(p => p.group !== '게스트'), [playerStats]);

  const previousGameMVPs = useMemo(() => {
    const completedMatches = schedules.filter(s => s.is_completed).sort((a, b) => a.date.localeCompare(b.date));
    if (completedMatches.length === 0) return null;
    
    const prevDate = completedMatches[completedMatches.length - 1].date;
    const prevRecords = records.filter(r => r.date === prevDate);
    const playersWithStats = prevRecords.map(r => {
      const pStat = playerStats[r.player_id] || { attendance: 0, name: 'Unknown' };
      return { ...pStat, goals: r.goals || 0, assists: r.assists || 0 };
    });

    const topScorers = getRankings(playersWithStats, 'goals');
    const topAssists = getRankings(playersWithStats, 'assists');

    if (!topScorers[0] || !topAssists[0]) return null;
    return { date: prevDate, topScorer: topScorers[0], topAssist: topAssists[0] };
  }, [records, playerStats, schedules]);

  const upcomingSchedules = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return schedules.filter(s => s.date >= todayStr && !s.is_completed);
  }, [schedules]);

  const upcomingMatch = upcomingSchedules.length > 0 ? upcomingSchedules[0] : null;
  const nextUpcomingMatch = upcomingSchedules.length > 1 ? upcomingSchedules[1] : null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    setLoading(false);
    if (error) { alert('로그인 실패: 이메일과 비밀번호를 확인해주세요.'); } 
    else { alert('운영진으로 로그인되었습니다.'); setShowLoginModal(false); setLoginEmail(''); setLoginPassword(''); }
  };
  const handleLogout = async () => { if (window.confirm('로그아웃 하시겠습니까?')) await supabase.auth.signOut(); };

  const handleToggleAttendance = async (pid) => {
    const isVoteClosed = new Date() > new Date(`${deadlineDate}T${deadlineTime}:00`);
    if (isVoteClosed && !isAdmin) return alert('⏰ 투표 시간이 마감되었습니다!\n지각이나 불참 등 변동 사항은 카톡방이나 운영진에게 문의해주세요.');
    
    const isAttending = tempAttendance.includes(pid);
    const playerInfo = players.find(p => p.id === pid);
    const playerName = playerInfo ? playerInfo.name : '알수없음';
    
    if (isAttending) {
      setTempAttendance(prev => prev.filter(id => id !== pid));
      setRecords(prev => prev.filter(r => !(r.date === selectedDate && r.player_id === pid)));
      const { error } = await supabase.from('match_records').delete().eq('date', selectedDate).eq('player_id', pid);
      if (!error) await supabase.from('vote_logs').insert([{ match_date: selectedDate, player_name: playerName, action: '투표 취소' }]);
    } else {
      setTempAttendance(prev => [...prev, pid]);
      setRecords(prev => [...prev, { date: selectedDate, player_id: pid, team: 0, goals: 0, assists: 0, party_attendance: false }]);
      const { error } = await supabase.from('match_records').insert([{ date: selectedDate, player_id: pid, party_attendance: false }]);
      if (!error) await supabase.from('vote_logs').insert([{ match_date: selectedDate, player_name: playerName, action: '경기 참석' }]);
    }
  };

  const handleToggleParty = async (pid) => {
    const isVoteClosed = new Date() > new Date(`${deadlineDate}T${deadlineTime}:00`);
    if (isVoteClosed && !isAdmin) return alert('⏰ 투표 시간이 마감되었습니다!\n지각이나 불참 등 변동 사항은 카톡방이나 운영진에게 문의해주세요.');
    
    const isMatchAttending = tempAttendance.includes(pid);
    if (!isMatchAttending) return alert('경기 투표를 먼저 완료해주세요!');

    const recordIndex = records.findIndex(r => r.date === selectedDate && r.player_id === pid);
    if (recordIndex === -1) return;
    
    const newStatus = !(records[recordIndex].party_attendance || false);
    const newRecords = [...records];
    newRecords[recordIndex].party_attendance = newStatus;
    setRecords(newRecords);

    const { error } = await supabase.from('match_records').update({ party_attendance: newStatus }).eq('date', selectedDate).eq('player_id', pid);
    if (!error) {
      const pName = players.find(p => p.id === pid)?.name || '알수없음';
      await supabase.from('vote_logs').insert([{ match_date: selectedDate, player_name: pName, action: newStatus ? '뒷풀이 참석' : '뒷풀이 취소' }]);
    }
  };

  const handleAddPartyGuest = async () => {
    const isVoteClosed = new Date() > new Date(`${deadlineDate}T${deadlineTime}:00`);
    if (isVoteClosed && !isAdmin) return alert('⏰ 투표 시간이 마감되었습니다!\n지각이나 불참 등 변동 사항은 카톡방이나 운영진에게 문의해주세요.');
    
    if (!partyGuestInput.trim()) return;
    const currentGuests = partyGuestsText ? partyGuestsText.split(',').filter(Boolean) : [];
    currentGuests.push(partyGuestInput.trim());
    const newGuestsText = currentGuests.join(',');

    const { error } = await supabase.from('match_schedules').update({ party_guests: newGuestsText }).eq('date', selectedDate);
    if (!error) {
      setPartyGuestsText(newGuestsText); setPartyGuestInput('');
      await supabase.from('vote_logs').insert([{ match_date: selectedDate, player_name: partyGuestInput.trim(), action: '뒷풀이 전용 참석' }]);
      fetchData(); 
    }
  };

  const handleRemovePartyGuest = async (guestName) => {
    const currentGuests = partyGuestsText ? partyGuestsText.split(',').filter(Boolean) : [];
    const newGuestsText = currentGuests.filter(g => g !== guestName).join(',');

    const { error } = await supabase.from('match_schedules').update({ party_guests: newGuestsText }).eq('date', selectedDate);
    if (!error) {
      setPartyGuestsText(newGuestsText);
      await supabase.from('vote_logs').insert([{ match_date: selectedDate, player_name: guestName, action: '뒷풀이 전용 취소' }]);
      fetchData();
    }
  };

  const handleAddGuest = async (e) => {
    e.preventDefault();
    const isVoteClosed = new Date() > new Date(`${deadlineDate}T${deadlineTime}:00`);
    if (isVoteClosed && !isAdmin) return alert('⏰ 투표 시간이 마감되었습니다!');
    if (!guestForm.name) return;
    setLoading(true);

    const { data: existingGuests } = await supabase.from('players').select('*').eq('group', '게스트').eq('name', guestForm.name);
    let guestId = null;

    if (existingGuests && existingGuests.length > 0) {
      guestId = existingGuests[0].id;
      await supabase.from('players').update({ payment_date: selectedDate, stars_type: guestForm.inviter || existingGuests[0].stars_type }).eq('id', guestId);
    } else {
      const newGuestPayload = {
        name: guestForm.name, gender: guestForm.gender, group: '게스트',
        stars_type: guestForm.inviter || null, payment_date: selectedDate,
        level: guestForm.level, balance: guestForm.level, passing: guestForm.level, dribble: guestForm.level,
        shooting: guestForm.level, touch: guestForm.level, stamina: guestForm.level,
        manner_score: 100, yellow_cards: 0 // 디폴트 값 
      };
      const { data: newGuestData } = await supabase.from('players').insert([newGuestPayload]).select();
      if (newGuestData) guestId = newGuestData[0].id;
    }

    if (guestId) {
      const { error } = await supabase.from('match_records').insert([{ date: selectedDate, player_id: guestId, team: 0, goals: 0, assists: 0, party_attendance: false }]);
      if (!error) {
         alert('게스트가 성공적으로 투표 명단에 올라갔습니다!');
         await supabase.from('vote_logs').insert([{ match_date: selectedDate, player_name: guestForm.name, action: '게스트 투표(경기)' }]);
      }
    }
    setShowGuestModal(false); setGuestForm({ name: '', gender: '남성', inviter: '', level: 5 }); fetchData();
  };

  const handleClearGuests = async () => {
    if (!window.confirm('저장된 모든 [게스트] 데이터를 영구 삭제하시겠습니까?')) return;
    setLoading(true);
    const { error } = await supabase.from('players').delete().eq('group', '게스트');
    setLoading(false);
    if (!error) { alert('게스트가 일괄 삭제되었습니다.'); fetchData(); }
  };

  // --- [추가됨] 매너 점수 & 옐로카드 핸들러 ---
  const handleManner = async (pid, amount) => {
    const player = players.find(p => p.id === pid);
    const newScore = (player.manner_score || 100) + amount;
    const { error } = await supabase.from('players').update({ manner_score: newScore }).eq('id', pid);
    if (!error) { alert(`${player.name} 선수의 매너 점수가 ${amount > 0 ? '+'+amount : amount}점 되었습니다!`); fetchData(); }
  };

  const handleYellowCard = async (pid) => {
    const player = players.find(p => p.id === pid);
    if(!window.confirm(`${player.name} 선수에게 옐로카드를 부여하시겠습니까?\n(매너점수 10점이 깎이고 경고 1회가 누적됩니다.)`)) return;
    const newYc = (player.yellow_cards || 0) + 1;
    const newScore = (player.manner_score || 100) - 10;
    const { error } = await supabase.from('players').update({ yellow_cards: newYc, manner_score: newScore }).eq('id', pid);
    if (!error) { alert(`${player.name} 선수에게 옐로카드가 부여되었습니다!`); fetchData(); }
  };

  // --- [추가됨] 포메이션 보드 드래그 앤 드롭 함수 ---
  const handleDragStart = (e, playerId, teamNo) => {
    e.dataTransfer.setData('playerId', playerId);
    e.dataTransfer.setData('teamNo', teamNo);
  };
  const handleDrop = (e, teamNo) => {
    const playerId = e.dataTransfer.getData('playerId');
    const sourceTeam = e.dataTransfer.getData('teamNo');
    if (sourceTeam != teamNo) return; // 본인 팀 전술판에만 놓을 수 있음
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setFormations(prev => ({
      ...prev, [teamNo]: { ...(prev[teamNo] || {}), [playerId]: { x, y } }
    }));
  };


  const openStarsModal = (target, prevGroup) => {
    setStarsModalConfig({ isOpen: true, target, previousGroup: prevGroup });
    setStarsModalData({
        option: target === 'new' ? (newPlayer.stars_type || '연납형') : (editForm.stars_type || '연납형'),
        startDate: target === 'new' ? (newPlayer.payment_date || new Date().toISOString().split('T')[0]) : (editForm.payment_date || new Date().toISOString().split('T')[0])
    });
  };

  const closeStarsModal = () => {
      if (starsModalConfig.target === 'new') {
          if (newPlayer.group === '스타즈' && !newPlayer.expire_date) setNewPlayer({...newPlayer, group: starsModalConfig.previousGroup});
      } else if (starsModalConfig.target === 'edit') {
          if (editForm.group === '스타즈' && !editForm.expire_date) setEditForm({...editForm, group: starsModalConfig.previousGroup});
      }
      setStarsModalConfig({ isOpen: false, target: null, previousGroup: '' });
  };

  const confirmStarsModal = () => {
      const { option, startDate } = starsModalData;
      if (option === '반납형' && !startDate) return alert('기준 날짜를 선택해주세요.');
      const expDate = calculateExpireDate(option, startDate || new Date().toISOString().split('T')[0]);

      if (starsModalConfig.target === 'new') {
          setNewPlayer({ ...newPlayer, group: '스타즈', stars_type: option, payment_date: startDate, expire_date: expDate });
      } else if (starsModalConfig.target === 'edit') {
          setEditForm({ ...editForm, group: '스타즈', stars_type: option, payment_date: startDate, expire_date: expDate });
      }
      setStarsModalConfig({ isOpen: false, target: null, previousGroup: '' });
  };

  const handleNewPlayerChange = (field, value) => {
    if (field === 'group') {
      if (value === '스타즈') { openStarsModal('new', newPlayer.group); return; } 
      else { setNewPlayer({ ...newPlayer, group: value, stars_type: null, payment_date: null, expire_date: null }); return; }
    }
    setNewPlayer(prev => ({ ...prev, [field]: value }));
  };

  const handleAddPlayer = async () => {
    if (!isAdmin) return alert('운영진만 가능합니다.');
    if (!newPlayer.name) return;
    const level = calculateLevel(newPlayer);
    const payload = { ...newPlayer, level };
    if (payload.group === '일반') { payload.stars_type = null; payload.payment_date = null; payload.expire_date = null; }

    const { error } = await supabase.from('players').insert([payload]);
    if (!error) { alert('등록되었습니다.'); fetchData(); setNewPlayer(defaultNewPlayer); }
  };

  const handleDeletePlayer = async (id) => {
    if (!isAdmin) return alert('운영진만 가능합니다.');
    if (window.confirm('삭제하시겠습니까?')) { await supabase.from('players').delete().eq('id', id); fetchData(); }
  };

  const startEditing = (player) => { 
    setEditingId(player.id); 
    setEditForm({ ...player, payment_date: player.payment_date || '', expire_date: player.expire_date || '' }); 
  };
  const cancelEditing = () => { setEditingId(null); setEditForm({}); };
  
  const handleEditChange = (field, value) => {
    if (field === 'group') {
      if (value === '스타즈') { openStarsModal('edit', editForm.group); return; } 
      else { setEditForm({ ...editForm, group: value, stars_type: null, payment_date: null, expire_date: null }); return; }
    }
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const saveEditing = async () => {
    const level = calculateLevel(editForm);
    const payload = { ...editForm, level };
    if (payload.group === '일반' || payload.group === '게스트') {
      payload.stars_type = payload.group === '게스트' ? payload.stars_type : null; 
      payload.payment_date = null; payload.expire_date = null;
    }
    const { error } = await supabase.from('players').update(payload).eq('id', editingId);
    if (!error) { alert('수정 완료'); setEditingId(null); fetchData(); }
  };

  const totalMatchCount = useMemo(() => new Set(records.map(r => r.date)).size, [records]);

  const attendanceTrendData = useMemo(() => {
    const trend = {};
    records.forEach(r => {
      if (!trend[r.date]) trend[r.date] = 0;
      trend[r.date]++;
    });
    return Object.keys(trend).sort().slice(-10).map(date => ({ date: date.slice(5), '참석 인원': trend[date] }));
  }, [records]);

  const pieColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
  
  const groupPieData = useMemo(() => {
    let stars = 0, regular = 0, guests = 0;
    players.forEach(p => {
      if (p.group === '스타즈') stars++; else if (p.group === '게스트') guests++; else regular++;
    });
    return [ { name: '스타즈', value: stars }, { name: '일반 회원', value: regular }, { name: '게스트 기록', value: guests }].filter(d => d.value > 0);
  }, [players]);

  const genderPieData = useMemo(() => {
    let m = 0, f = 0;
    players.filter(p => p.group !== '게스트').forEach(p => { if (p.gender === '남성') m++; else f++; });
    return [{ name: '남성', value: m }, { name: '여성', value: f }].filter(d => d.value > 0);
  }, [players]);

  const starsTypePieData = useMemo(() => {
    let yearly = 0, half = 0;
    players.forEach(p => {
      if (p.group === '스타즈') { if (p.stars_type === '연납형') yearly++; else if (p.stars_type === '반납형') half++; }
    });
    return [ { name: '연납형', value: yearly }, { name: '반납형', value: half } ].filter(d => d.value > 0);
  }, [players]);

  const exportToCSV = () => {
    const headers = ['이름', '성별', '등급', '가입유형/초대자', '기준일', '만료일', '남은기간', '총출석(회)', '출석률(%)'];
    const rows = players.filter(p => p.group !== '게스트').map(p => {
      const dday = p.group === '스타즈' ? getDday(p.expire_date) : null;
      let ddayStr = '';
      if (dday !== null) ddayStr = dday < 0 ? '만료됨' : `D-${dday}`;
      const att = playerStats[p.id]?.attendance || 0;
      const rate = totalMatchCount > 0 ? Math.round((att / totalMatchCount) * 100) : 0;
      return [p.name, p.gender, p.group || '일반', p.stars_type || '-', p.payment_date || '-', p.expire_date || '-', ddayStr, att, rate].join(',');
    });
    const csvContent = "\uFEFF" + headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `총총FC_회원장부_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const generateTeams = async () => {
    const currentDayRecords = records.filter(r => r.date === selectedDate);
    if (!currentDayRecords.length) return alert('참여 인원이 없습니다.');
    if (!window.confirm('팀을 새로 배정하시겠습니까? (기존 배정 초기화)\n* 초대자와 게스트는 무조건 같은 팀으로 배정됩니다.')) return;

    const currentDayPlayerIds = currentDayRecords.map(r => r.player_id);
    const attendedPlayers = players.filter(p => currentDayPlayerIds.includes(p.id));
    const noise = () => Math.random() * 0.5 - 0.25; 

    const bundles = [];
    const processedIds = new Set();
    const regulars = attendedPlayers.filter(p => p.group !== '게스트');
    const guests = attendedPlayers.filter(p => p.group === '게스트');

    regulars.forEach(inviter => {
        const myGuests = guests.filter(g => g.stars_type === inviter.name);
        if (myGuests.length > 0) {
            const bundle = [inviter, ...myGuests];
            bundles.push(bundle);
            bundle.forEach(b => processedIds.add(b.id)); 
        }
    });

    const singles = attendedPlayers.filter(p => !processedIds.has(p.id));
    const singleFemales = singles.filter(p => p.gender === '여성').sort((a,b) => (b.level+noise()) - (a.level+noise()));
    const singleMales = singles.filter(p => p.gender === '남성').sort((a,b) => (b.level+noise()) - (a.level+noise()));

    const teams = Array.from({ length: teamCount }, () => []);
    bundles.sort((a, b) => b.reduce((s,p)=>s+p.level,0) - a.reduce((s,p)=>s+p.level,0));
    
    bundles.forEach(bundle => {
        let targetIdx = 0; let minSum = Infinity;
        const minSize = Math.min(...teams.map(t => t.length));
        const candidates = teams.map((t, i) => t.length === minSize ? i : -1).filter(i => i !== -1);
        for (let idx of (candidates.length > 0 ? candidates : [0])) {
            const sum = teams[idx].reduce((acc, curr) => acc + curr.level, 0);
            if (sum < minSum) { minSum = sum; targetIdx = idx; }
        }
        teams[targetIdx].push(...bundle);
    });

    singleFemales.forEach(p => {
        const minSize = Math.min(...teams.map(t => t.length));
        const candidates = teams.map((t, i) => t.length === minSize ? i : -1).filter(i => i !== -1);
        let targetIdx = candidates[0]; let minSum = Infinity;
        for (let idx of candidates) {
            const sum = teams[idx].reduce((acc, curr) => acc + curr.level, 0);
            if (sum < minSum) { minSum = sum; targetIdx = idx; }
        }
        teams[targetIdx].push(p);
    });

    singleMales.forEach(p => {
        const minSize = Math.min(...teams.map(t => t.length));
        const candidates = teams.map((t, i) => t.length === minSize ? i : -1).filter(i => i !== -1);
        let targetIdx = candidates[0]; let minSum = Infinity;
        for (let idx of candidates) {
            const sum = teams[idx].reduce((acc, curr) => acc + curr.level, 0);
            if (sum < minSum) { minSum = sum; targetIdx = idx; }
        }
        teams[targetIdx].push(p);
    });

    const updatePromises = [];
    teams.forEach((team, idx) => {
      team.forEach(p => { 
        const promise = supabase.from('match_records').update({ team: idx + 1 }).eq('date', selectedDate).eq('player_id', p.id);
        updatePromises.push(promise);
      });
    });

    await Promise.all(updatePromises);
    setFormations({}); // 팀 섞으면 전술판 초기화
    alert('팀 배정 완료!'); fetchData();
  };

  const handleCompleteMatch = async () => {
    if (!window.confirm('기록 입력을 마치고 경기를 종료하시겠습니까?\n종료 시 홈 화면 메인에 오늘의 MVP가 즉시 공개됩니다! 🏆')) return;
    const { error } = await supabase.from('match_schedules').update({ is_completed: true }).eq('date', selectedDate);
    if (!error) { alert('경기가 종료되었습니다! 홈 화면에서 MVP를 확인하세요.'); fetchData(); } 
    else { alert('경기 종료 처리 중 오류가 발생했습니다.'); }
  };

  const handleShowTodayMVP = () => {
    const currentRecords = records.filter(r => r.date === selectedDate);
    if (currentRecords.length === 0) return alert('오늘 투표/참석 인원이 없습니다.');

    const playerStats = currentRecords.map(r => {
      const p = players.find(pl => pl.id === r.player_id) || { name: '알수없음' };
      return { name: p.name, goals: r.goals || 0, assists: r.assists || 0 };
    });

    const topScorer = [...playerStats].sort((a, b) => b.goals - a.goals)[0];
    const topAssist = [...playerStats].sort((a, b) => b.assists - a.assists)[0];

    if (topScorer.goals === 0 && topAssist.assists === 0) return alert('아직 등록된 골/어시스트가 없습니다!');

    setTodayMvps({ scorer: topScorer.goals > 0 ? topScorer : null, assister: topAssist.assists > 0 ? topAssist : null });
    setShowMvpModal(true);
  };

  const updateStat = async (pid, field, value) => {
    if (value < 0) return; 
    const { error } = await supabase.from('match_records').update({ [field]: value }).eq('date', selectedDate).eq('player_id', pid);
    if (!error) fetchData();
  };

  const handleMoveTeam = async (pid, newTeamNo) => {
    const { error } = await supabase.from('match_records').update({ team: newTeamNo }).eq('date', selectedDate).eq('player_id', pid);
    if (!error) { alert('이동되었습니다.'); setMovePlayerTarget(null); fetchData(); }
  };

  const sortedPlayersForVote = useMemo(() => {
    const regulars = players.filter(p => p.group !== '게스트').sort((a, b) => a.name.localeCompare(b.name));
    const guests = players.filter(p => p.group === '게스트' && (p.payment_date === selectedDate || records.some(r => r.player_id === p.id && r.date === selectedDate)));

    const result = [];
    const unassignedGuests = [...guests];

    regulars.forEach(reg => {
      result.push(reg);
      const myGuests = guests.filter(g => g.stars_type === reg.name).sort((a, b) => a.name.localeCompare(b.name));
      result.push(...myGuests);
      myGuests.forEach(mg => {
        const idx = unassignedGuests.findIndex(ug => ug.id === mg.id);
        if (idx > -1) unassignedGuests.splice(idx, 1);
      });
    });

    unassignedGuests.sort((a, b) => a.name.localeCompare(b.name));
    result.push(...unassignedGuests);
    return result;
  }, [players, selectedDate, records]);

  const processedPlayers = useMemo(() => {
    let data = [...players].map(p => ({ ...p, group: (p.group === '스타즈' || p.group === '게스트') ? p.group : '일반' }));
    if (!showGuestsInList) data = data.filter(p => p.group !== '게스트');
    if (filterGender !== 'all') data = data.filter(p => p.gender === filterGender);
    
    data.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [players, filterGender, sortConfig, showGuestsInList]);

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ colKey }) => {
    if (sortConfig.key !== colKey) return <span className="text-gray-300 ml-1">↕</span>;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="ml-1 inline"/> : <ChevronDown size={14} className="ml-1 inline"/>;
  };

  const rankingLists = useMemo(() => {
    const list = Object.values(playerStats).filter(p => p.group !== '게스트');
    return {
      maleGoals: list.filter(p => p.gender === '남성').sort((a, b) => b.goals - a.goals),
      femaleGoals: list.filter(p => p.gender === '여성').sort((a, b) => b.goals - a.goals),
      maleAssists: list.filter(p => p.gender === '남성').sort((a, b) => b.assists - a.assists),
      femaleAssists: list.filter(p => p.gender === '여성').sort((a, b) => b.assists - a.assists),
      maleAttendance: list.filter(p => p.gender === '남성').sort((a, b) => b.attendance - a.attendance),
      femaleAttendance: list.filter(p => p.gender === '여성').sort((a, b) => b.attendance - a.attendance),
    };
  }, [playerStats]);

  const RankingTable = ({ title, data, type }) => (
    <Card title={title} className="h-full">
      <table className="w-full text-sm text-left">
        <thead className="bg-blue-50 text-blue-900 font-bold">
          <tr>
            <th className="p-2 text-center w-12">순위</th>
            <th className="p-2 text-center">이름</th>
            <th className="p-2 text-center w-16">{type === 'goals' ? '골' : type === 'assists' ? '어시' : '출석'}</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 10).map((p, i) => (
            <tr key={i} className="border-b">
              <td className="p-2 text-center text-gray-500">{i+1}</td>
              <td className="p-2 text-center justify-center flex items-center">
                <PlayerName player={p} records={records}/>
                {i === 0 && <Crown size={16} className="ml-1 text-yellow-500 fill-yellow-400 shrink-0" />}
                {i === 1 && <Crown size={16} className="ml-1 text-gray-400 fill-gray-300 shrink-0" />}
                {i === 2 && <Crown size={16} className="ml-1 text-amber-700 fill-amber-600 shrink-0" />}
              </td>
              <td className="p-2 text-center font-bold text-blue-600">
                {type==='goals' ? p.goals : type==='assists' ? p.assists : `${p.attendance}회`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-20 text-gray-800 relative">
      
      {!isAdmin && (
        (() => {
          const isVoteClosed = new Date() > new Date(`${deadlineDate}T${deadlineTime}:00`);
          return (
            <button 
              onClick={() => {
                if (isVoteClosed) alert('투표 시간이 마감되었습니다! 늦참 및 변동 사항은 카톡방이나 운영진에게 문의해주세요.');
                else setShowVoteModal(true);
              }}
              className={`fixed bottom-8 right-6 text-white px-5 py-4 rounded-full shadow-2xl hover:scale-105 transition-transform z-40 flex items-center justify-center gap-2 border-2 border-white 
                ${isVoteClosed ? 'bg-gray-500 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              <Calendar size={24} />
              <span className="font-bold text-lg shadow-sm">{isVoteClosed ? '투표 마감됨' : '투표하기'}</span>
            </button>
          );
        })()
      )}

      <div className="hidden lg:flex flex-col gap-4 fixed right-8 top-1/2 -translate-y-1/2 z-30">
        {socialLinks.instagram && ( <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-3 rounded-full text-white shadow-lg hover:scale-110 transition-transform flex items-center justify-center" title="인스타그램"><Instagram size={24} /></a>)}
        {socialLinks.youtube && ( <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="bg-red-600 p-3 rounded-full text-white shadow-lg hover:scale-110 transition-transform flex items-center justify-center" title="유튜브"> <Youtube size={24} /> </a> )}
        {socialLinks.kakao && ( <a href={socialLinks.kakao} target="_blank" rel="noopener noreferrer" className="bg-yellow-400 p-3 rounded-full text-black shadow-lg hover:scale-110 transition-transform flex items-center justify-center" title="카카오톡"> <MessageCircle size={24} /> </a> )}
      </div>

      <header className="bg-blue-700 text-white p-3 sm:p-4 sticky top-0 z-40 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-2 sm:gap-6">
          <h1 className="text-base sm:text-xl font-bold flex items-center gap-1 sm:gap-2 whitespace-nowrap">
            <Activity size={20} className="shrink-0"/> 총총 FC
          </h1>
          <div className="flex items-center gap-2 sm:gap-3 border-l border-blue-500 pl-2 sm:pl-4">
            {socialLinks.instagram && <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-pink-300 transition-colors"><Instagram size={18} /></a>}
            {socialLinks.youtube && <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-red-300 transition-colors"><Youtube size={18} /></a>}
            {socialLinks.kakao && <a href={socialLinks.kakao} target="_blank" rel="noopener noreferrer" className="hover:text-yellow-300 transition-colors"><MessageCircle size={18} /></a>}
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          {isAdmin ? (
            <button onClick={handleLogout} className="flex items-center gap-1 bg-red-500 px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm font-bold hover:bg-red-600 transition-colors whitespace-nowrap">
              <LogOut size={16}/> <span className="hidden sm:inline">운영진 </span>로그아웃
            </button>
          ) : (
            <button onClick={() => setShowLoginModal(true)} className="flex items-center gap-1 bg-blue-800 px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm font-bold hover:bg-blue-900 transition-colors border border-blue-500 whitespace-nowrap">
              <LogIn size={16}/> <span className="hidden sm:inline">운영진 </span>로그인
            </button>
          )}
          <button onClick={fetchData} className="bg-blue-600 p-1.5 sm:p-2 rounded-full hover:bg-blue-500 shrink-0"><RefreshCw size={18} className={loading ? "animate-spin" : ""}/></button>
        </div>
      </header>

      <nav className="flex bg-white border-b overflow-x-auto sticky top-12 sm:top-[60px] z-30">
        {[
          { id: 'dashboard', icon: Home, label: '홈' }, 
          { id: 'live_board', icon: Clock, label: '전광판' },
          { id: 'players', icon: Users, label: '선수 목록' },
          isAdmin && { id: 'members', icon: Download, label: '회원 장부' }, 
          isAdmin && { id: 'attendance', icon: Calendar, label: '투표 관리' },
          { id: 'teams', icon: UserCheck, label: '팀/기록' }, 
          { id: 'scoreboard', icon: Trophy, label: '랭킹' },
          { id: 'statistics', icon: PieChartIcon, label: '통계' },
        ].filter(Boolean).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex flex-col items-center p-3 text-xs font-bold whitespace-nowrap ${activeTab===tab.id ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}>
            <tab.icon size={20} className="mb-1"/>{tab.label}
          </button>
        ))}
      </nav>

      <main className="p-4 max-w-4xl mx-auto space-y-6">
        
        {/* --- 0. 홈 (대시보드) --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {previousGameMVPs && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
                <h3 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-1">🎉 {formatDateUI(previousGameMVPs.date)} 경기 최고의 활약</h3>
                <div className="flex gap-4">
                  <p className="text-sm">🔥 득점왕: <strong>{previousGameMVPs.topScorer.name}</strong> ({previousGameMVPs.topScorer.goals}골)</p>
                  <p className="text-sm">👟 도움왕: <strong>{previousGameMVPs.topAssist.name}</strong> ({previousGameMVPs.topAssist.assists}도움)</p>
                </div>
              </div>
            )}

            <div className="p-6 bg-white rounded-2xl shadow-md border-2 border-blue-500 relative overflow-hidden">
              {upcomingMatch && (() => {
                const isVoteClosed = new Date() > new Date(`${upcomingMatch.deadline_date}T${upcomingMatch.deadline_time}:00`);
                return (
                  <div className={`absolute top-0 right-0 text-white px-3 py-1 rounded-bl-lg font-bold text-xs shadow-sm transition-colors ${isVoteClosed ? 'bg-gray-500' : 'bg-red-500'}`}>
                    {isVoteClosed ? '투표 마감됨' : '투표 진행 중'}
                  </div>
                );
              })()}
              <h2 className="text-xl font-extrabold text-gray-800 mb-4">다가오는 경기</h2>
              
              {upcomingMatch ? (
                <>
                  <div className="space-y-2 mb-6">
                    <p className="text-xl font-bold flex items-center gap-2">📅 {formatDateUI(upcomingMatch.date, `${upcomingMatch.start_time} ~ ${upcomingMatch.end_time}`)}</p>
                    <p className="text-md text-gray-600 flex items-center gap-2">🏟️ 용산 더베이스 풋살장</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl mb-4 text-center border shadow-sm">
                    <p className="text-lg">🔥 현재 <strong className="text-blue-600 text-3xl mx-1">{tempAttendance.length}</strong>명 투표 완료</p>
                    {upcomingMatch.has_party && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm font-bold text-purple-700 flex justify-center items-center gap-1">🍻 뒷풀이: {upcomingMatch.party_location || '장소 추후 공지'}</p>
                        {(() => {
                          const matchPartyCount = records.filter(r => r.date === upcomingMatch.date && r.party_attendance).length;
                          const onlyPartyCount = upcomingMatch.party_guests ? upcomingMatch.party_guests.split(',').filter(Boolean).length : 0;
                          const totalPartyCount = matchPartyCount + onlyPartyCount;
                          return (
                            <div className="flex flex-col items-center">
                              <p className="text-xs text-gray-500 mt-1">현재 <span className="font-bold text-purple-600 text-sm">{totalPartyCount}</span>명 참석 예정 {onlyPartyCount > 0 && ` (경기인원 ${matchPartyCount}명 + 뒷풀이만 ${onlyPartyCount}명)`}</p>
                              <button onClick={() => setShowPartyListModal(true)} className="mt-2 text-[11px] bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full font-bold hover:bg-purple-200 transition-colors">👀 참석 명단 확인하기</button>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-sm text-red-500 font-bold flex justify-end items-center gap-1">⏰ 마감: {formatDateUI(upcomingMatch.deadline_date, upcomingMatch.deadline_time)} 까지</div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 font-bold text-lg mb-2">🤷‍♂️ 아직 등록된 일정이 없습니다.</p>
                  <p className="text-gray-400 text-sm">운영진이 경기 일정을 조율 중입니다. (미정)</p>
                </div>
              )}
            </div>

            <div className="p-5 bg-gray-200 rounded-2xl shadow-sm opacity-60">
              <h2 className="text-md font-bold text-gray-500 mb-3 flex items-center gap-1">🔜 다음 경기 예정</h2>
              {nextUpcomingMatch ? (
                <><p className="text-sm font-medium text-gray-600">📅 {formatDateUI(nextUpcomingMatch.date)}</p><p className="text-sm text-gray-600 mt-1">🏟️ 용산 더베이스 풋살장</p></>
              ) : (<p className="text-sm font-medium text-gray-500">일정 미정</p>)}
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-md border">
              <h2 className="text-lg font-extrabold mb-4 border-b pb-2 flex items-center gap-2">🏆 명예의 전당 (누적 탑 3)</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="pr-2">
                  <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1">⚽ 누적 득점 순위</h3>
                  <ul className="text-sm space-y-2">
                    {getRankings(allTimePlayersArray, 'goals').slice(0, 3).map((player, index) => (
                      <li key={player.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <span className="flex items-center gap-1 font-bold text-gray-700">
                          {index === 0 ? <Crown size={16} className="text-yellow-500 fill-yellow-400"/> : index === 1 ? <Crown size={16} className="text-gray-400 fill-gray-300"/> : <Crown size={16} className="text-amber-700 fill-amber-600"/>} {player.name}
                        </span>
                        <span className="font-extrabold text-blue-600">{player.goals}골</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pl-2 border-l border-gray-200">
                  <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1">👟 누적 도움 순위</h3>
                  <ul className="text-sm space-y-2">
                    {getRankings(allTimePlayersArray, 'assists').slice(0, 3).map((player, index) => (
                      <li key={player.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <span className="flex items-center gap-1 font-bold text-gray-700">
                          {index === 0 ? <Crown size={16} className="text-yellow-500 fill-yellow-400"/> : index === 1 ? <Crown size={16} className="text-gray-400 fill-gray-300"/> : <Crown size={16} className="text-amber-700 fill-amber-600"/>} {player.name}
                        </span>
                        <span className="font-extrabold text-green-600">{player.assists}개</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- [새로 추가됨] 실전 전광판 탭 --- */}
        {activeTab === 'live_board' && (
          <div className="flex flex-col gap-6">
            <div className="bg-gray-900 text-white p-6 rounded-3xl shadow-2xl border-4 border-gray-700 flex flex-col items-center relative overflow-hidden">
              <p className="text-gray-400 font-bold mb-2">🔥 LIVE SCOREBOARD 🔥</p>
              
              <div className="text-[5rem] sm:text-[7rem] font-black leading-none tracking-tighter tabular-nums text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] mb-4">
                {formatTime(timerSeconds)}
              </div>
              
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                <button onClick={() => setTimerSeconds(prev => Math.max(0, prev - 60))} className="px-4 py-2 bg-gray-800 rounded-lg font-bold hover:bg-gray-700">-1분</button>
                <button onClick={() => setTimerSeconds(prev => prev + 60)} className="px-4 py-2 bg-gray-800 rounded-lg font-bold hover:bg-gray-700">+1분</button>
                <button onClick={() => setTimerSeconds(900)} className="px-4 py-2 bg-gray-800 rounded-lg font-bold hover:bg-gray-700 text-gray-400">15분 리셋</button>
                <div className="w-4"></div>
                <button onClick={() => setIsTimerRunning(!isTimerRunning)} 
                        className={`px-8 py-2 rounded-lg font-black text-lg border-2 ${isTimerRunning ? 'bg-red-600 border-red-500 hover:bg-red-700 text-white' : 'bg-green-500 border-green-400 hover:bg-green-600 text-gray-900'}`}>
                  {isTimerRunning ? '일시정지' : '타이머 시작'}
                </button>
              </div>

              <div className="w-full flex justify-between items-center px-4 sm:px-10">
                <div className="flex flex-col items-center">
                  <span className="text-xl sm:text-2xl font-bold mb-2 text-blue-400">TEAM 1</span>
                  <div className="text-[6rem] sm:text-[8rem] font-black leading-none mb-4">{scoreTeam1}</div>
                  <div className="flex gap-2">
                    <button onClick={() => setScoreTeam1(Math.max(0, scoreTeam1 - 1))} className="w-12 h-12 bg-gray-800 rounded-full font-bold text-xl hover:bg-gray-700">-</button>
                    <button onClick={() => setScoreTeam1(scoreTeam1 + 1)} className="w-16 h-12 bg-blue-600 rounded-full font-black text-2xl hover:bg-blue-700 shadow-[0_0_15px_rgba(37,99,235,0.5)]">+</button>
                  </div>
                </div>
                <div className="text-4xl font-black text-gray-600">VS</div>
                <div className="flex flex-col items-center">
                  <span className="text-xl sm:text-2xl font-bold mb-2 text-red-400">TEAM 2</span>
                  <div className="text-[6rem] sm:text-[8rem] font-black leading-none mb-4">{scoreTeam2}</div>
                  <div className="flex gap-2">
                    <button onClick={() => setScoreTeam2(Math.max(0, scoreTeam2 - 1))} className="w-12 h-12 bg-gray-800 rounded-full font-bold text-xl hover:bg-gray-700">-</button>
                    <button onClick={() => setScoreTeam2(scoreTeam2 + 1)} className="w-16 h-12 bg-red-600 rounded-full font-black text-2xl hover:bg-red-700 shadow-[0_0_15px_rgba(220,38,38,0.5)]">+</button>
                  </div>
                </div>
              </div>
              <button onClick={() => { if(window.confirm('점수를 0:0으로 초기화할까요?')) { setScoreTeam1(0); setScoreTeam2(0); } }} className="mt-10 text-sm text-gray-500 hover:text-gray-300 underline">스코어 리셋</button>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-blue-800 text-sm font-bold text-center shadow-sm">
              💡 꿀팁: 구장에서 스마트폰을 <b>가로로 눕혀두고</b> 사용하시면 완벽한 실전 전광판이 됩니다!
            </div>
          </div>
        )}

        {/* --- 1. 선수 관리 --- */}
        {activeTab === 'players' && (
          <>
            {isAdmin && (
              <Card title="회원 등록 (운영진 전용)">
                <div className="flex flex-wrap gap-2 mb-2 items-center">
                  <input placeholder="이름" className="border p-2 rounded w-24" value={newPlayer.name} onChange={e=>handleNewPlayerChange('name', e.target.value)}/>
                  <select className="border p-2 rounded" value={newPlayer.gender} onChange={e=>handleNewPlayerChange('gender', e.target.value)}><option>남성</option><option>여성</option></select>
                  <select className="border p-2 rounded bg-yellow-50 text-yellow-900 font-bold" value={newPlayer.group} onChange={e=>handleNewPlayerChange('group', e.target.value)}>
                    <option value="일반">일반 회원</option><option value="스타즈">스타즈 ⭐️</option>
                  </select>
                </div>
                
                {newPlayer.group === '스타즈' && (
                  <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg border border-blue-200 mb-3 shadow-inner">
                    <span className="font-bold text-sm text-blue-800 shrink-0"><Star size={16} className="inline mr-1"/>스타즈 설정:</span>
                    <span className="text-sm font-bold bg-white px-2 py-1 rounded border">{newPlayer.stars_type}</span>
                    <span className="text-xs text-gray-600">만료일: {newPlayer.expire_date || '-'}</span>
                    <button onClick={() => openStarsModal('new', '스타즈')} className="text-xs bg-blue-600 text-white px-2 py-1 rounded ml-auto flex items-center gap-1">
                      <Settings size={12}/> 설정 변경
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-6 gap-1 mb-3">
                  {['balance','passing','dribble','shooting','touch','stamina'].map(s=>(
                    <div key={s} className="text-center">
                      <div className="text-[10px] uppercase font-bold text-gray-500">{s.slice(0,3)}</div>
                      <input type="number" min="0" max="10" className="w-full border text-center rounded" value={newPlayer[s]} onChange={e=>{
                          const val = Number(e.target.value);
                          if(val >= 0 && val <= 10) handleNewPlayerChange(s, e.target.value);
                      }}/>
                    </div>
                  ))}
                </div>
                <button onClick={handleAddPlayer} className="w-full bg-green-600 text-white py-2 rounded font-bold flex justify-center items-center gap-1"><Plus size={16}/> 명단에 추가하기</button>
              </Card>
            )}

            <div className="bg-white rounded shadow overflow-hidden">
              <div className="p-3 border-b bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-3">
                 <div className="flex gap-1">
                   {['all', '남성', '여성'].map(f => (
                     <button key={f} onClick={()=>setFilterGender(f)} className={`px-3 py-1 text-xs rounded-full font-bold border ${filterGender === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}>{f === 'all' ? '전체' : f}</button>
                   ))}
                 </div>
                 <div className="flex items-center gap-2">
                   <button onClick={() => setShowGuestsInList(!showGuestsInList)} className={`text-xs px-2 py-1 border rounded font-bold transition-colors ${showGuestsInList ? 'bg-green-100 text-green-800 border-green-300' : 'bg-white text-gray-500 border-gray-300'}`}>
                     {showGuestsInList ? '✔️ 게스트 포함해서 보는 중' : '게스트 숨기기'}
                   </button>
                   {isAdmin && showGuestsInList && (
                     <button onClick={handleClearGuests} className="text-xs px-2 py-1 bg-red-100 text-red-600 border border-red-300 rounded hover:bg-red-200">🧹 게스트 일괄 삭제</button>
                   )}
                 </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-center whitespace-nowrap">
                  <thead className="bg-gray-100 text-gray-700 font-bold border-b">
                    <tr>
                      <th className="p-3 cursor-pointer hover:bg-gray-200" onClick={()=>handleSort('name')}>이름/회원 <SortIcon colKey="name"/></th>
                      <th className="p-3">성별</th>
                      <th className="p-3 text-blue-600 cursor-pointer hover:bg-gray-200" onClick={()=>handleSort('level')}>Lv <SortIcon colKey="level"/></th>
                      <th className="p-3 cursor-pointer hover:bg-gray-200" onClick={()=>handleSort('manner_score')}>매너 <SortIcon colKey="manner_score"/></th>
                      {isAdmin && <th className="p-3">관리 (더블클릭 상세)</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {processedPlayers.map(p => {
                      const isEditing = editingId === p.id;
                      return (
                      <tr key={p.id} className={`border-b hover:bg-gray-50 cursor-pointer ${p.group === '게스트' ? 'bg-green-50/30' : ''}`} onDoubleClick={() => setDetailPlayer(p)}>
                        {isEditing ? (
                          <>
                            <td className="p-2 flex flex-col gap-1 items-center">
                              <input className="border w-20 text-center text-sm" value={editForm.name} onChange={e=>handleEditChange('name',e.target.value)}/>
                              <select className="border text-xs bg-yellow-50" value={editForm.group||'일반'} onChange={e=>handleEditChange('group',e.target.value)}>
                                <option value="일반">일반</option><option value="스타즈">스타즈</option><option value="게스트">게스트</option>
                              </select>
                              {editForm.group === '스타즈' && (
                                <button onClick={(e) => { e.stopPropagation(); openStarsModal('edit', '스타즈'); }} className="text-[10px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded w-full border border-blue-300 hover:bg-blue-200">
                                  {editForm.stars_type} 설정 ⚙️
                                </button>
                              )}
                            </td>
                            <td className="p-2"><select className="border text-sm" value={editForm.gender} onChange={e=>handleEditChange('gender',e.target.value)}><option>남성</option><option>여성</option></select></td>
                            <td className="p-2"><div className="flex gap-1 justify-center">{['balance','passing','dribble','shooting','touch','stamina'].map(s => <input key={s} type="number" min="0" max="10" className="border w-8 text-center" value={editForm[s]} onChange={e=>handleEditChange(s,Number(e.target.value))}/>)}</div></td>
                            <td className="p-2 font-bold text-blue-600">-</td>
                            {isAdmin && (
                              <td className="p-2 flex justify-center gap-2">
                                 <button onClick={saveEditing} className="text-green-600"><Save size={18}/></button>
                                 <button onClick={cancelEditing} className="text-gray-500"><X size={18}/></button>
                              </td>
                            )}
                          </>
                        ) : (
                          <>
                            <td className="p-3"><div className="flex flex-col items-center justify-center"><PlayerName player={p} records={records}/></div></td>
                            <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${p.gender==='남성'?'bg-blue-100 text-blue-800':'bg-pink-100 text-pink-800'}`}>{p.gender}</span></td>
                            <td className="p-3 font-bold text-blue-600">{p.level}</td>
                            
                            {/* --- [추가됨] 매너점수 및 경고 표시 --- */}
                            <td className="p-3">
                              <div className="flex flex-col items-center">
                                <span className={`font-bold ${(p.manner_score||100) >= 120 ? 'text-blue-600' : (p.manner_score||100) < 90 ? 'text-red-600' : 'text-gray-700'}`}>
                                  {p.manner_score ?? 100}점
                                </span>
                                {(p.yellow_cards || 0) > 0 && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded border border-red-300 mt-0.5">경고 {p.yellow_cards}</span>}
                              </div>
                            </td>

                            {isAdmin && (
                              <td className="p-3 flex justify-center gap-1.5 items-center">
                                <button onClick={(e)=>{ e.stopPropagation(); handleManner(p.id, 5); }} className="text-blue-500 bg-blue-50 p-1 rounded hover:bg-blue-100" title="매너 칭찬 (+5점)"><ThumbsUp size={14}/></button>
                                <button onClick={(e)=>{ e.stopPropagation(); handleYellowCard(p.id); }} className="text-red-500 bg-red-50 p-1 rounded hover:bg-red-100" title="옐로카드 (매너-10점)"><AlertTriangle size={14}/></button>
                                <span className="text-gray-300 mx-1">|</span>
                                <button onClick={(e)=>{ e.stopPropagation(); startEditing(p); }} className="text-gray-500 hover:text-blue-500"><Edit2 size={16}/></button>
                                <button onClick={(e)=>{ e.stopPropagation(); handleDeletePlayer(p.id); }} className="text-gray-500 hover:text-red-500"><Trash2 size={16}/></button>
                              </td>
                            )}
                          </>
                        )}
                      </tr>
                    )})}
                    {processedPlayers.length === 0 && (<tr><td colSpan="6" className="p-4 text-gray-400">명단이 비어있습니다.</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* --- 2. 회원 장부 관리 (운영진 전용) --- */}
        {isAdmin && activeTab === 'members' && (
          <Card title="회원 장부 (운영진 전용)">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
              <p className="text-sm text-gray-600 font-medium">전체 회원의 멤버십 상태와 출석을 확인하고 엑셀로 다운로드합니다.</p>
              <button onClick={exportToCSV} className="w-full md:w-auto bg-green-600 text-white px-5 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-green-700 shadow border-2 border-green-700">
                <Download size={18} /> 엑셀(CSV) 내보내기
              </button>
            </div>
            <div className="overflow-x-auto bg-white border rounded shadow-sm">
              <table className="w-full text-sm text-center whitespace-nowrap">
                <thead className="bg-gray-100 text-gray-700 font-bold border-b">
                  <tr>
                    <th className="p-3">이름</th>
                    <th className="p-3">등급</th>
                    <th className="p-3">가입유형</th>
                    <th className="p-3 text-red-600">만료일</th>
                    <th className="p-3 text-blue-700">총 출석(회)</th>
                    <th className="p-3">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {players.filter(p => p.group !== '게스트').map(p => {
                    const isStar = p.group === '스타즈';
                    const dday = isStar ? getDday(p.expire_date) : null;
                    const att = playerStats[p.id]?.attendance || 0;
                    
                    return (
                      <tr key={p.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium"><PlayerName player={p} records={records}/></td>
                        <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold ${isStar ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>{p.group || '일반'}</span></td>
                        <td className="p-3 text-gray-600">{p.stars_type || '-'}</td>
                        <td className="p-3 font-bold text-red-600">{p.expire_date || '-'}</td>
                        <td className="p-3 font-bold text-blue-700 bg-blue-50/50">{att}회</td>
                        <td className="p-3"><DdayBadge dday={dday}/></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* --- 3. 참여 관리 (운영진 전용) --- */}
        {isAdmin && activeTab === 'attendance' && (
          <>
            <Card title="이번 주 투표/경기 관리">
              <div className="flex flex-col gap-4">
                <div className="bg-gray-50 p-4 rounded border space-y-3">
                  <div className="flex flex-col md:flex-row items-center gap-4">
                      <div className="flex items-center gap-2 w-full md:w-1/2">
                          <span className="font-bold text-blue-800 w-20">경기 날짜:</span>
                          <input type="date" className="border border-blue-300 p-2 rounded font-bold flex-1" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)}/>
                      </div>
                      <div className="flex items-center gap-2 w-full md:w-1/2">
                          <span className="font-bold text-blue-800 w-20">경기 시간:</span>
                          <input type="time" className="border border-blue-300 p-2 rounded w-24" value={matchTimeStart} onChange={e=>setMatchTimeStart(e.target.value)}/>
                          <span>~</span>
                          <input type="time" className="border border-blue-300 p-2 rounded w-24" value={matchTimeEnd} onChange={e=>setMatchTimeEnd(e.target.value)}/>
                      </div>
                  </div>
                  <div className="flex flex-col md:flex-row items-center gap-4 border-t pt-3">
                      <div className="flex items-center gap-2 w-full md:w-1/2">
                          <span className="font-bold text-red-600 w-20">마감 날짜:</span>
                          <input type="date" className="border border-red-300 p-2 rounded flex-1" value={deadlineDate} onChange={e=>setDeadlineDate(e.target.value)}/>
                      </div>
                      <div className="flex items-center gap-2 w-full md:w-1/2">
                          <span className="font-bold text-red-600 w-20">마감 시간:</span>
                          <input type="time" className="border border-red-300 p-2 rounded w-24" value={deadlineTime} onChange={e=>setDeadlineTime(e.target.value)}/>
                      </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-center gap-4 border-t pt-3">
                    <div className="flex items-center gap-2 w-full md:w-1/3">
                      <span className="font-bold text-purple-700 w-20">뒷풀이:</span>
                      <label className="flex items-center cursor-pointer">
                        <input type="checkbox" className="w-5 h-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500" checked={hasParty} onChange={e => setHasParty(e.target.checked)} />
                        <span className="ml-2 text-sm font-bold">{hasParty ? '있음' : '없음'}</span>
                      </label>
                    </div>
                    {hasParty && (
                      <div className="flex items-center gap-2 w-full md:w-2/3">
                        <span className="font-bold text-purple-700 w-20 shrink-0">장소:</span>
                        <input placeholder="뒷풀이 장소를 입력하세요" className="border border-purple-300 p-2 rounded flex-1 text-sm" value={partyLocation} onChange={e => setPartyLocation(e.target.value)} />
                      </div>
                    )}
                  </div>
                </div>
                
                <button onClick={handleSaveSchedule} className="w-full bg-indigo-600 text-white py-2 rounded font-bold shadow hover:bg-indigo-700 flex justify-center items-center gap-2 mt-2">
                  <Calendar size={18} /> 이 날짜로 경기/뒷풀이 공식 일정 저장하기
                </button>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button onClick={() => setShowShareModal(true)} className="bg-[#FEE500] text-[#191919] px-4 py-3 rounded-lg font-bold hover:bg-[#e5cf00] flex items-center justify-center gap-2 shadow border border-yellow-400">
                    <MessageCircle size={20} className="fill-current"/> 1. 투표 열기 (템플릿 선택)
                  </button>
                  <button onClick={shareMatchReminder} className="bg-blue-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2 shadow">
                    <Bell size={20} /> 2. 당일 경기 안내 (카톡 공유)
                  </button>
                </div>
              </div>
            </Card>
            
            <div className="grid grid-cols-2 gap-4">
              {['남성','여성'].map(gender => (
                <Card key={gender} title={gender}>
                  <div className="space-y-2">
                  {sortedPlayersForVote.filter(p=>p.gender===gender).map(p => {
                    const isChecked = tempAttendance.includes(p.id);
                    return (
                      <div key={p.id} onClick={()=>handleToggleAttendance(p.id)} 
                           className={`p-3 rounded border cursor-pointer flex justify-between items-center transition-all ${isChecked ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500 shadow-sm' : 'bg-white hover:bg-gray-50'}`}>
                        <PlayerName player={p} records={records}/>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isChecked?'bg-blue-600 border-blue-600':'border-gray-300'}`}>
                          {isChecked && <UserCheck size={14} className="text-white"/>}
                        </div>
                      </div>
                    )
                  })}
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* --- 4. 팀/기록 관리 (모두 볼 수 있음) --- */}
        {activeTab === 'teams' && (
          <>
            <div className="bg-white p-4 rounded shadow border-l-4 border-blue-600 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="flex items-center gap-2">
                 <span className="font-bold text-sm">경기 날짜:</span>
                 <input type="date" className="border p-2 rounded font-bold bg-gray-50" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)}/>
               </div>
               
               {isAdmin && (
                 <div className="flex flex-wrap items-center gap-3">
                   <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded">
                     <span className="font-bold text-sm">생성할 팀 수:</span>
                     <input type="number" value={teamCount} onChange={e=>setTeamCount(e.target.value)} className="border p-1 w-12 text-center rounded bg-white"/>
                   </div>
                   <button onClick={generateTeams} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold shadow hover:bg-blue-700 flex items-center gap-1">
                     <RefreshCw size={14}/> 팀 자동 배정
                   </button>
                   <button onClick={handleShowTodayMVP} className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded text-sm font-bold shadow hover:bg-yellow-500 flex items-center gap-1">
                     <Trophy size={16}/> 오늘 경기 MVP 보기 🏆
                   </button>
                   <button onClick={handleCompleteMatch} className="bg-white text-red-600 border-2 border-red-600 px-4 py-2 rounded text-sm font-black shadow-sm hover:bg-red-50 flex items-center gap-1">
                     <Trophy size={14}/> 모든 기록 마감 및 경기 종료
                   </button>
                 </div>
               )}
            </div>

            {isAdmin && (
              <Card title="대기 명단 (투표 완료 인원)">
                {(() => {
                  const currentDayRecords = records.filter(r => r.date === selectedDate);
                  const attendedPlayers = currentDayRecords.map(r => ({ ...players.find(pl => pl.id === r.player_id), record: r })).filter(p => p.id); 

                  if (attendedPlayers.length === 0) return <span className="text-gray-400 text-sm">투표한 인원이 없습니다.</span>;

                  const starsPlayers = attendedPlayers.filter(p => p.group === '스타즈');
                  const regularPlayers = attendedPlayers.filter(p => p.group !== '스타즈' && p.group !== '게스트');
                  const guestPlayers = attendedPlayers.filter(p => p.group === '게스트');
                  const totalCount = attendedPlayers.length;

                  const renderPlayerBadge = (p) => {
                    const isAssigned = p.record.team > 0;
                    return (
                      <div key={p.id} className={`px-3 py-1 rounded border text-sm font-bold flex items-center gap-2 ${isAssigned ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-700 border-blue-300'}`}>
                         <PlayerName player={p} records={records}/>
                         <span className="text-xs bg-white px-1 rounded border ml-1">Lv.{p.level}</span>
                         {isAssigned && <span className="text-xs text-green-600 ml-1">→ 팀{p.record.team}</span>}
                      </div>
                    );
                  };

                  return (
                    <div className="flex flex-col gap-4">
                      <div className="text-xs text-gray-600 pb-2 border-b font-medium bg-gray-50 p-2 rounded">
                        스타즈: <span className="font-bold">{starsPlayers.length}명</span> | 
                        일반 회원: <span className="font-bold">{regularPlayers.length}명</span>
                        {guestPlayers.length > 0 && <span> | 게스트: <span className="font-bold">{guestPlayers.length}명</span></span>}
                        <span className="mx-2">/</span>
                        <span className="font-bold text-blue-700">총합: {totalCount}명</span>
                      </div>
                      <div className="space-y-4">
                        {starsPlayers.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1"><Star size={12}/> 스타즈</h4>
                            <div className="flex flex-wrap gap-2">{starsPlayers.map(renderPlayerBadge)}</div>
                          </div>
                        )}
                        {regularPlayers.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1"><Users size={12}/> 일반 회원</h4>
                            <div className="flex flex-wrap gap-2">{regularPlayers.map(renderPlayerBadge)}</div>
                          </div>
                        )}
                        {guestPlayers.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1"><UserPlus size={12}/> 게스트</h4>
                            <div className="flex flex-wrap gap-2">{guestPlayers.map(renderPlayerBadge)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(() => {
                const maxTeamInDB = records.filter(r => r.date === selectedDate).reduce((max, r) => Math.max(max, r.team || 0), 0);
                const displayCount = Math.max(Number(teamCount) || 2, maxTeamInDB, 2);

                return Array.from({ length: displayCount }).map((_, i) => {
                  const teamNo = i + 1;
                  const members = records.filter(r => r.date === selectedDate && r.team === teamNo);
                  const teamPlayers = members.map(r => players.find(p => p.id === r.player_id)).filter(Boolean);
                  
                  const avg = teamPlayers.length ? (teamPlayers.reduce((a,b)=>a+b.level,0)/teamPlayers.length).toFixed(2) : 0;
                  const maleCount = teamPlayers.filter(p => p.gender === '남성').length;
                  const femaleCount = teamPlayers.filter(p => p.gender === '여성').length;

                  return (
                    <Card key={teamNo} title={`TEAM ${teamNo}`}>
                      <div className="text-xs text-gray-500 mb-3 flex justify-between border-b pb-2">
                        <span className="font-bold">총 {teamPlayers.length}명 <span className="font-normal">(남{maleCount} / 여{femaleCount})</span></span>
                        <span>평균 Lv.{avg}</span>
                      </div>

                      {members.length === 0 ? <div className="text-center text-gray-400 py-4">팀원이 없습니다.</div> : 
                        <div className="space-y-3">
                          {members.map(record => {
                            const p = players.find(pl => pl.id === record.player_id);
                            if (!p) return null;
                            return (
                              <div key={record.id} className="bg-gray-50 p-2 rounded border flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold flex items-center gap-1 text-sm md:text-base">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${p.gender==='남성'?'bg-blue-500':'bg-pink-500'}`}></span>
                                    <PlayerName player={p} records={records}/>
                                    <span className="text-xs text-gray-400 font-normal shrink-0 ml-1">({p.level})</span>
                                  </span>
                                  
                                  {isAdmin && (
                                    <button onClick={()=>setMovePlayerTarget({ p, teamNo: record.team })} 
                                            className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded flex items-center gap-1 shrink-0">
                                        <ArrowRightLeft size={12}/> 이동
                                    </button>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <div className="flex-1 flex items-center bg-white border rounded px-2 py-1">
                                    <span className="text-xs font-bold text-gray-500 mr-2">골</span>
                                    {isAdmin ? (
                                      <input type="number" min="0" className="w-full text-center font-bold text-blue-600 outline-none" 
                                        value={record.goals} onChange={(e)=>updateStat(p.id, 'goals', e.target.value)}/>
                                    ) : (
                                      <span className="w-full text-center font-bold text-blue-600">{record.goals}</span>
                                    )}
                                  </div>
                                  <div className="flex-1 flex items-center bg-white border rounded px-2 py-1">
                                    <span className="text-xs font-bold text-gray-500 mr-2">어시</span>
                                    {isAdmin ? (
                                      <input type="number" min="0" className="w-full text-center font-bold text-green-600 outline-none" 
                                        value={record.assists} onChange={(e)=>updateStat(p.id, 'assists', e.target.value)}/>
                                    ) : (
                                      <span className="w-full text-center font-bold text-green-600">{record.assists}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      }

                      {/* --- [추가됨] 포메이션 전술판 --- */}
                      <div className="mt-4 border-t pt-4">
                        <p className="text-sm font-bold text-gray-600 mb-2 flex items-center gap-1">📋 포메이션 전술판 <span className="font-normal text-[10px] sm:text-xs text-gray-400">(이름표를 드래그해서 구장에 올리세요!)</span></p>
                        <div 
                          className="w-full h-48 sm:h-64 bg-green-600 rounded-lg relative overflow-hidden border-2 border-white shadow-inner"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleDrop(e, teamNo)}
                          style={{ backgroundImage: 'linear-gradient(to right, #15803d 50%, #16a34a 50%)', backgroundSize: '20% 100%' }}
                        >
                          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/50 -translate-x-1/2 pointer-events-none"></div>
                          <div className="absolute top-1/2 left-1/2 w-16 h-16 sm:w-24 sm:h-24 border-2 border-white/50 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                          <div className="absolute top-1/2 left-0 w-8 sm:w-12 h-20 sm:h-32 border-2 border-white/50 -translate-y-1/2 border-l-0 pointer-events-none"></div>
                          <div className="absolute top-1/2 right-0 w-8 sm:w-12 h-20 sm:h-32 border-2 border-white/50 -translate-y-1/2 border-r-0 pointer-events-none"></div>

                          {members.map(record => {
                            const p = players.find(pl => pl.id === record.player_id);
                            if(!p) return null;
                            const pos = formations[teamNo]?.[p.id];
                            if(!pos) return null; 
                            return (
                              <div 
                                key={p.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, p.id, teamNo)}
                                className="absolute w-8 h-8 sm:w-10 sm:h-10 bg-blue-800 text-white text-[10px] sm:text-xs font-bold rounded-full flex items-center justify-center border-2 border-white shadow-lg cursor-grab transform -translate-x-1/2 -translate-y-1/2 z-10 hover:scale-110 transition-transform"
                                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                                title={p.name}
                              >
                                {p.name.slice(0, 2)}
                              </div>
                            )
                          })}
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-3 min-h-[30px] p-2 bg-gray-50 rounded border border-dashed border-gray-300">
                          {members.filter(record => {
                            const p = players.find(pl => pl.id === record.player_id);
                            return p && !formations[teamNo]?.[p.id];
                          }).map(record => {
                            const p = players.find(pl => pl.id === record.player_id);
                            return (
                              <div 
                                key={p.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, p.id, teamNo)}
                                className="px-2 py-1 bg-white border border-blue-300 rounded text-xs font-bold cursor-grab shadow-sm hover:bg-blue-50 text-blue-800"
                              >
                                {p.name}
                              </div>
                            )
                          })}
                          {members.every(r => formations[teamNo]?.[r.player_id]) && <span className="text-xs text-gray-400 m-auto">모든 선수가 배치되었습니다.</span>}
                        </div>
                        <button onClick={() => setFormations(prev => ({...prev, [teamNo]: {}}))} className="mt-2 text-[11px] text-gray-500 underline hover:text-gray-800">배치 초기화</button>
                      </div>

                    </Card>
                  )
                });
              })()}
            </div>
          </>
        )}

        {/* --- 5. 랭킹 --- */}
        {activeTab === 'scoreboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full items-start">
             <div className="flex flex-col gap-4">
               <RankingTable title="득점 랭킹 (남성)" data={rankingLists.maleGoals} type="goals"/>
               <RankingTable title="득점 랭킹 (여성)" data={rankingLists.femaleGoals} type="goals"/>
             </div>
             <div className="flex flex-col gap-4">
               <RankingTable title="도움 랭킹 (남성)" data={rankingLists.maleAssists} type="assists"/>
               <RankingTable title="도움 랭킹 (여성)" data={rankingLists.femaleAssists} type="assists"/>
             </div>
             <div className="flex flex-col gap-4">
               <RankingTable title="출석 랭킹 (남성)" data={rankingLists.maleAttendance} type="attendance"/>
               <RankingTable title="출석 랭킹 (여성)" data={rankingLists.femaleAttendance} type="attendance"/>
             </div>
          </div>
        )}

        {/* --- 6. 통계 탭 --- */}
        {activeTab === 'statistics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-lg border-l-4 border-blue-500 shadow flex items-center justify-between">
                 <div>
                   <p className="text-gray-500 text-sm font-bold">진행된 총 경기수</p>
                   <p className="text-2xl font-black text-blue-900 mt-1">{totalMatchCount}회</p>
                 </div>
                 <div className="bg-blue-100 p-3 rounded-full text-blue-600"><Calendar size={24}/></div>
              </div>
              <div className="bg-white p-5 rounded-lg border-l-4 border-green-500 shadow flex items-center justify-between">
                 <div>
                   <p className="text-gray-500 text-sm font-bold">정식 회원 수 (게스트 제외)</p>
                   <p className="text-2xl font-black text-green-900 mt-1">{players.filter(p=>p.group!=='게스트').length}명</p>
                 </div>
                 <div className="bg-green-100 p-3 rounded-full text-green-600"><Users size={24}/></div>
              </div>
              <div className="bg-white p-5 rounded-lg border-l-4 border-yellow-500 shadow flex items-center justify-between">
                 <div>
                   <p className="text-gray-500 text-sm font-bold">터진 총 골수</p>
                   <p className="text-2xl font-black text-yellow-900 mt-1">
                     {records.reduce((acc, cur) => acc + cur.goals, 0)}골
                   </p>
                 </div>
                 <div className="bg-yellow-100 p-3 rounded-full text-yellow-600"><Activity size={24}/></div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title={<span className="flex items-center gap-2"><TrendingUp size={18}/> 최근 경기 참석 트렌드 (10경기)</span>}>
                <div className="h-[200px] md:h-[280px] w-full mt-2">
                  {attendanceTrendData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400 font-bold">데이터가 없습니다.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={attendanceTrendData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{fontSize: 12}} />
                        <YAxis tick={{fontSize: 12}} allowDecimals={false} />
                        <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="참석 인원" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>

              <Card title={<span className="flex items-center gap-2"><PieChartIcon size={18}/> 회원 구성 비율</span>}>
                <div className="w-full flex flex-col md:flex-row gap-6 py-4">
                  <div className="flex-1 flex flex-col items-center justify-center relative h-[200px] md:h-[240px] w-full">
                    <p className="absolute top-0 text-sm font-bold text-gray-500 z-10">회원 등급</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={groupPieData} innerRadius={35} outerRadius={55} paddingAngle={5} dataKey="value" stroke="none">
                          {groupPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '11px', fontWeight: 'bold'}}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center relative h-[200px] md:h-[240px] w-full">
                    <p className="absolute top-0 text-sm font-bold text-gray-500 z-10">성비 (정식회원)</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={genderPieData} innerRadius={35} outerRadius={55} paddingAngle={5} dataKey="value" stroke="none">
                          <Cell fill="#3B82F6" />
                          <Cell fill="#EC4899" />
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '11px', fontWeight: 'bold'}}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center relative h-[200px] md:h-[240px] w-full">
                    <p className="absolute top-0 text-sm font-bold text-gray-500 z-10">스타즈 유형</p>
                    {starsTypePieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={starsTypePieData} innerRadius={35} outerRadius={55} paddingAngle={5} dataKey="value" stroke="none">
                            <Cell fill="#8B5CF6" />
                            <Cell fill="#F59E0B" />
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '11px', fontWeight: 'bold'}}/>
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full mt-4 text-xs text-gray-400 font-bold">데이터 없음</div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* --- 각종 모달(팝업창) --- */}
      {starsModalConfig.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border-2 border-blue-500">
            <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2"><Star size={20}/> 스타즈 가입유형 설정</h2>
              <button onClick={closeStarsModal}><X size={24} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex gap-4 p-1 bg-gray-100 rounded-lg">
                <label className={`flex-1 text-center py-2 rounded-md cursor-pointer font-bold text-sm transition-colors ${starsModalData.option === '연납형' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:bg-gray-200'}`}>
                  <input type="radio" name="starsOption" value="연납형" className="hidden" checked={starsModalData.option === '연납형'} onChange={(e) => setStarsModalData({...starsModalData, option: e.target.value})} /> 연납형 (12만원)
                </label>
                <label className={`flex-1 text-center py-2 rounded-md cursor-pointer font-bold text-sm transition-colors ${starsModalData.option === '반납형' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:bg-gray-200'}`}>
                  <input type="radio" name="starsOption" value="반납형" className="hidden" checked={starsModalData.option === '반납형'} onChange={(e) => setStarsModalData({...starsModalData, option: e.target.value})} /> 반납형 (6만원)
                </label>
              </div>
              {starsModalData.option === '반납형' && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <label className="block text-sm font-bold mb-2 text-blue-900">기준 날짜 선택</label>
                  <input type="date" className="w-full border-blue-200 p-2.5 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500" value={starsModalData.startDate} onChange={(e) => setStarsModalData({...starsModalData, startDate: e.target.value})} />
                </div>
              )}
            </div>
            <div className="p-4 bg-gray-50 border-t flex gap-2">
              <button onClick={closeStarsModal} className="flex-1 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-100">취소</button>
              <button onClick={confirmStarsModal} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-bold shadow-md hover:bg-blue-700">설정 적용하기</button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#FEE500] text-[#191919] p-4 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold flex items-center gap-2"><MessageCircle size={20} className="fill-current"/> 투표 공유 템플릿 선택</h2>
              <button onClick={() => setShowShareModal(false)}><X size={24} /></button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="flex gap-2">
                {['기본형', '게스트용'].map(type => (
                  <button key={type} onClick={() => setShareTemplate(type)} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all border ${shareTemplate === type ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm ring-1 ring-blue-500' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}>{type}</button>
                ))}
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <span className="text-xs font-bold text-gray-400 mb-2 block">미리보기</span>
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">{getShareText(shareTemplate)}</pre>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t flex gap-2 shrink-0">
              <button onClick={executeKakaoShare} className="flex-1 py-2.5 bg-[#FEE500] text-[#191919] rounded-lg font-bold shadow flex justify-center items-center gap-2"><Send size={18}/> 카카오톡으로 공유하기</button>
            </div>
          </div>
        </div>
      )}

      {showGuestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[80] p-4">
          <form onSubmit={handleAddGuest} className="bg-white rounded-lg w-full max-w-sm flex flex-col shadow-2xl overflow-hidden border-2 border-green-500">
            <div className="bg-green-600 text-white p-4 flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2"><UserPlus size={20}/> 당일 게스트 1초 추가</h2>
              <button type="button" onClick={() => setShowGuestModal(false)}><X size={24} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1 text-gray-700">이름 <span className="text-red-500">*</span></label>
                <input required type="text" className="w-full border p-2 rounded" placeholder="예: 홍길동" value={guestForm.name} onChange={e=>setGuestForm({...guestForm, name:e.target.value})}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">성별</label>
                  <select className="w-full border p-2 rounded" value={guestForm.gender} onChange={e=>setGuestForm({...guestForm, gender:e.target.value})}><option>남성</option><option>여성</option></select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">기본 실력(1~10)</label>
                  <input type="number" min="1" max="10" className="w-full border p-2 rounded text-center" value={guestForm.level} onChange={e=>setGuestForm({...guestForm, level:Number(e.target.value)})}/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-blue-700">누가 초대했나요?</label>
                <select className="w-full border-2 border-blue-300 p-2 rounded bg-blue-50 text-blue-900 font-bold" value={guestForm.inviter} onChange={e=>setGuestForm({...guestForm, inviter:e.target.value})}>
                  <option value="">-- 본인 이름 선택 --</option>
                  {players.filter(p => p.group !== '게스트').sort((a,b)=>a.name.localeCompare(b.name)).map(p => (<option key={p.id} value={p.name}>{p.name}</option>))}
                </select>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50">
               <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-2.5 rounded font-bold shadow hover:bg-green-700">{loading ? '추가 중...' : '추가 + 바로 투표 반영'}</button>
            </div>
          </form>
        </div>
      )}

      {showVoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="bg-blue-600 text-white p-4 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold flex items-center gap-2"><Calendar size={20}/> {selectedDate} 투표</h2>
              <button onClick={() => setShowVoteModal(false)}><X size={24} /></button>
            </div>
            <div className="p-4 overflow-y-auto space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-center shadow-sm">
                <p className="text-sm text-blue-800 font-medium">본인 이름을 누르면 <b>즉시 투표(자동 저장)</b> 됩니다.</p>
              </div>
              {hasParty && (
                 <div className="bg-purple-50 border border-purple-200 p-2 rounded-lg text-center shadow-sm">
                    <p className="text-xs text-purple-800 font-bold flex items-center justify-center gap-1">🍻 오늘 뒷풀이가 있습니다! 참석 시 맥주 버튼을 눌러주세요.</p>
                 </div>
              )}
              <div className="grid grid-cols-1 gap-4">
                {['남성','여성'].map(gender => (
                  <div key={gender} className="space-y-2">
                    <div className="bg-gray-100 text-center font-bold py-1.5 rounded text-sm text-gray-700 shadow-sm border">{gender}</div>
                    <div className="grid grid-cols-2 gap-2">
                      {sortedPlayersForVote.filter(p=>p.gender===gender).map(p => {
                        const isChecked = tempAttendance.includes(p.id);
                        const isPartyChecked = records.find(r => r.player_id === p.id && r.date === selectedDate)?.party_attendance;
                        return (
                          <div key={p.id} className="flex items-stretch h-[44px]">
                            <div onClick={()=>handleToggleAttendance(p.id)} className={`flex-1 min-w-0 px-2 flex justify-between items-center rounded border cursor-pointer transition-all duration-300 ease-in-out ${isChecked ? 'bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-500' : 'bg-white hover:bg-gray-50'}`}>
                              <div className="truncate pr-1"><PlayerName player={p} records={records}/></div>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isChecked?'bg-blue-600 border-blue-600':'border-gray-300'}`}>{isChecked && <UserCheck size={10} className="text-white"/>}</div>
                            </div>
                            {hasParty && (
                              <div className={`overflow-hidden transition-all duration-300 ease-in-out flex items-stretch ${isChecked ? 'w-10 ml-1.5 opacity-100' : 'w-0 ml-0 opacity-0'}`}>
                                <button onClick={(e) => { e.stopPropagation(); handleToggleParty(p.id); }} className={`w-full flex flex-col items-center justify-center rounded border transition-colors ${isPartyChecked ? 'bg-yellow-400 border-yellow-500 text-white shadow-inner' : 'bg-gray-100 border-gray-300 text-gray-500 opacity-80 hover:opacity-100'}`}>
                                  <span className="text-[9px] font-bold leading-none mb-0.5">뒷풀이</span><span className="text-sm leading-none">🍺</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {hasParty && (
              <div className="p-4 border-t bg-purple-50 shrink-0">
                <p className="text-sm font-bold text-purple-800 mb-2 flex items-center gap-1">🍻 뒷풀이만 참석하는 인원 (경기 X)</p>
                <div className="flex gap-2 mb-2">
                  <input type="text" placeholder="이름 입력 (예: 홍길동)" className="flex-1 border border-purple-200 p-2 rounded text-sm" value={partyGuestInput} onChange={e => setPartyGuestInput(e.target.value)} />
                  <button onClick={handleAddPartyGuest} className="bg-purple-600 text-white px-4 py-2 rounded font-bold text-sm shadow">추가</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {partyGuestsText.split(',').filter(Boolean).map((g, idx) => (
                    <span key={idx} className="bg-white border border-purple-300 text-purple-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                      {g} <button onClick={() => handleRemovePartyGuest(g)} className="text-red-500 hover:text-red-700"><X size={12}/></button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="p-4 border-t bg-gray-50 shrink-0 space-y-2">
              <button onClick={() => setShowGuestModal(true)} className="w-full bg-green-50 text-green-700 border-2 border-green-500 py-2.5 rounded-lg font-bold hover:bg-green-100 flex items-center justify-center gap-2 border-dashed">
                <UserPlus size={18}/> ⚽️ 내 지인(게스트) 투표 명단에 추가하기
              </button>
              <button onClick={() => setShowVoteModal(false)} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-700 shadow-lg">투표 완료 (창 닫기)</button>
            </div>
          </div>
        </div>
      )}

      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[90] p-4">
          <form onSubmit={handleLogin} className="bg-white rounded-lg w-full max-w-sm p-6 shadow-2xl flex flex-col gap-4">
            <h2 className="text-xl font-bold text-center border-b pb-2">운영진 로그인</h2>
            <div><label className="block text-sm font-bold mb-1">이메일</label><input type="email" required className="w-full border p-2 rounded" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} /></div>
            <div><label className="block text-sm font-bold mb-1">비밀번호</label><input type="password" required className="w-full border p-2 rounded" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} /></div>
            <div className="flex gap-2 mt-2">
              <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">로그인</button>
              <button type="button" onClick={() => setShowLoginModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded font-bold hover:bg-gray-300">취소</button>
            </div>
          </form>
        </div>
      )}

      {detailPlayer && (
        <PlayerDetailModal player={detailPlayer} records={records} totalMatches={totalMatchCount} onClose={() => setDetailPlayer(null)} />
      )}

      {movePlayerTarget && (() => {
        const maxTeamInDB = records.filter(r => r.date === selectedDate).reduce((max, r) => Math.max(max, r.team || 0), 0);
        const actualTeamCount = Math.max(Number(teamCount) || 2, maxTeamInDB, 2);
        return (
          <MoveTeamModal player={movePlayerTarget.p} currentTeam={movePlayerTarget.teamNo} teamCount={actualTeamCount} onMove={handleMoveTeam} onClose={() => setMovePlayerTarget(null)} />
        );
      })()}

      {showPartyListModal && upcomingMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]">
            <div className="bg-purple-600 text-white p-4 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold flex items-center gap-2">🍻 뒷풀이 전체 명단</h2>
              <button onClick={() => setShowPartyListModal(false)}><X size={24} /></button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {(() => {
                const matchPartyRecords = records.filter(r => r.date === upcomingMatch.date && r.party_attendance);
                const matchPartyPlayers = matchPartyRecords.map(r => players.find(p => p.id === r.player_id)).filter(Boolean);
                const partyOnlyGuests = upcomingMatch.party_guests ? upcomingMatch.party_guests.split(',').filter(Boolean) : [];
                return (
                  <>
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 mb-2 border-b pb-1">⚽ 경기 뛰고 참석 ({matchPartyPlayers.length}명)</h3>
                      <div className="flex flex-wrap gap-2">
                        {matchPartyPlayers.map(p => (<span key={p.id} className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded text-xs font-bold">{p.name}</span>))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 mb-2 border-b pb-1">🍺 경기 안 뛰고 참석 ({partyOnlyGuests.length}명)</h3>
                      <div className="flex flex-wrap gap-2">
                        {partyOnlyGuests.map((name, idx) => (<span key={idx} className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-1 rounded text-xs font-bold">{name}</span>))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="p-4 bg-gray-50 border-t shrink-0"><button onClick={() => setShowPartyListModal(false)} className="w-full bg-gray-200 text-gray-800 py-2.5 rounded-lg font-bold hover:bg-gray-300">닫기</button></div>
          </div>
        </div>
      )}

      {showMvpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border-4 border-yellow-400">
            <div className="bg-yellow-400 text-yellow-900 p-5 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black flex items-center gap-2"><Trophy size={24} className="fill-current"/> {selectedDate} 오늘의 MVP</h2>
              <button onClick={() => setShowMvpModal(false)}><X size={24} /></button>
            </div>
            <div className="p-8 text-center space-y-6 bg-gradient-to-b from-yellow-50 to-white">
              {todayMvps.scorer && (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-yellow-200">
                  <p className="text-sm font-bold text-gray-500 mb-1">🔥 오늘의 득점왕</p>
                  <p className="text-3xl font-black text-blue-700 mb-1">{todayMvps.scorer.name}</p>
                  <p className="text-lg font-bold text-gray-700">{todayMvps.scorer.goals} GOALS ⚽️</p>
                </div>
              )}
              {todayMvps.assister && (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-yellow-200">
                  <p className="text-sm font-bold text-gray-500 mb-1">👟 오늘의 도움왕</p>
                  <p className="text-3xl font-black text-green-700 mb-1">{todayMvps.assister.name}</p>
                  <p className="text-lg font-bold text-gray-700">{todayMvps.assister.assists} ASSISTS 🤝</p>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-4 font-bold">* 이 화면을 캡처해서 단톡방에 공유해보세요! 📸</p>
            </div>
            <div className="p-4 bg-gray-50 border-t shrink-0">
              <button onClick={() => setShowMvpModal(false)} className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold text-lg hover:bg-gray-900 shadow-md">멋져요! (닫기)</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
