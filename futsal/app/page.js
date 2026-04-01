'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Users, Calendar, Activity, Trophy, Plus, 
  Trash2, UserCheck, RefreshCw, Edit2, Save, X, ArrowRightLeft,
  ChevronUp, ChevronDown, Instagram, Youtube, MessageCircle,
  LogIn, LogOut, Star, Clock, Bell
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, ResponsiveContainer 
} from 'recharts';

// --------------------------------------------------------
// [중요] Supabase 키
// --------------------------------------------------------
const supabaseUrl = 'https://vgbrgrlosalarnszmanm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnYnJncmxvc2FsYXJuc3ptYW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMzE3NzQsImV4cCI6MjA4MjkwNzc3NH0.py9Bw6NMHFOGAI8daiKrU7IQfTrQh3rsQ6L-qkYIBg0';
// --------------------------------------------------------

const supabase = createClient(supabaseUrl, supabaseKey);

// --- 유틸리티 ---
const calculateLevel = (stats) => {
  const { balance, passing, dribble, shooting, touch, stamina } = stats;
  const sum = Number(balance) + Number(passing) + Number(dribble) + Number(shooting) + Number(touch) + Number(stamina);
  return Number((sum / 6).toFixed(2));
};

// 이름 옆에 파란 별을 달아주는 전용 컴포넌트
const PlayerName = ({ player }) => (
  <span className="flex items-center gap-1 font-bold">
    {player.group === '스타즈' && <Star size={14} className="fill-blue-500 text-blue-500" />}
    {player.name}
  </span>
);

const Card = ({ title, children, className = "" }) => (
  <div className={`bg-white rounded-lg border-2 border-blue-600 overflow-hidden shadow-sm flex flex-col ${className}`}>
    <div className="bg-blue-600 px-4 py-2 shrink-0">
      <h3 className="text-white font-bold text-lg">{title}</h3>
    </div>
    <div className="p-4 flex-1">{children}</div>
  </div>
);

// --- 팝업 컴포넌트들 ---
const MoveTeamModal = ({ player, currentTeam, teamCount, onMove, onClose }) => {
  if (!player) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
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

const PlayerDetailModal = ({ player, records, onClose }) => {
  if (!player) return null;
  const history = records.filter(r => r.player_id === player.id).sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalGoals = history.reduce((acc, cur) => acc + cur.goals, 0);
  const totalAssists = history.reduce((acc, cur) => acc + cur.assists, 0);
  const chartData = [
    { subject: '밸런스', A: player.balance, fullMark: 10 },
    { subject: '패스', A: player.passing, fullMark: 10 },
    { subject: '드리블', A: player.dribble, fullMark: 10 },
    { subject: '슈팅', A: player.shooting, fullMark: 10 },
    { subject: '터치', A: player.touch, fullMark: 10 },
    { subject: '체력', A: player.stamina, fullMark: 10 },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="bg-blue-700 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold"><PlayerName player={player}/> 상세 정보</h2>
          <button onClick={onClose}><X size={24} /></button>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 flex flex-col items-center">
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
                <p className="text-gray-600">성별: {player.gender} | 등급: <span className="font-bold text-blue-600">{player.group||'일반'}</span></p>
                <p className="font-bold mt-2">통산 {totalGoals}골 / {totalAssists}어시</p>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2 border-b pb-1">최근 경기 기록</h3>
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
  const [activeTab, setActiveTab] = useState('players');
  const [loading, setLoading] = useState(false);
  
  const [players, setPlayers] = useState([]);
  const [records, setRecords] = useState([]); 
  
  // --- 일정 및 시간 관리 상태 ---
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [matchTimeStart, setMatchTimeStart] = useState('20:00');
  const [matchTimeEnd, setMatchTimeEnd] = useState('22:00');
  const [deadlineDate, setDeadlineDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadlineTime, setDeadlineTime] = useState('18:00');

  const [teamCount, setTeamCount] = useState(2);
  // group 기본값 추가
  const [newPlayer, setNewPlayer] = useState({ name: '', gender: '남성', group: '일반', balance: 5, passing: 5, dribble: 5, shooting: 5, touch: 5, stamina: 5 });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [detailPlayer, setDetailPlayer] = useState(null);
  const [movePlayerTarget, setMovePlayerTarget] = useState(null);
  
  const [tempAttendance, setTempAttendance] = useState([]);
  const [showVoteModal, setShowVoteModal] = useState(false);

  const [filterGender, setFilterGender] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'level', direction: 'desc' });

  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const socialLinks = {
    instagram: "https://www.instagram.com", 
    youtube: "", 
    kakao: ""      
  };

  // --- 카카오 SDK & 매직 링크 감지 ---
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
      if (!window.Kakao.isInitialized()) {
        // [중요] 여기에 복사해 둔 'JavaScript 키'를 넣으세요!
        window.Kakao.init('c83bfe5982c44918880b96c17961d52e'); 
      }
    };
  }, []);

  // 날짜 변환 도우미 함수 (예: "2026-04-15" -> { m: 4, d: 15, day: '수' })
  const formatKakaoDate = (dateStr) => {
    if(!dateStr) return { m: '', d: '', day: '' };
    const dt = new Date(dateStr);
    const days = ['일','월','화','수','목','금','토'];
    return { m: dt.getMonth() + 1, d: dt.getDate(), day: days[dt.getDay()] };
  };

  // --- 1. 투표 알림 보내기 (카카오) ---
  const shareVoteNotice = () => {
    if (window.Kakao && window.Kakao.isInitialized()) {
      const match = formatKakaoDate(selectedDate);
      const dead = formatKakaoDate(deadlineDate);
      const magicLinkUrl = `${window.location.origin}${window.location.pathname}?vote=true&date=${selectedDate}`;
      
      const text = `[🏁 총총 FC 풋살 모임 투표 안내‼️]\n\n안녕하세요 총총FC 여러분\n${match.m}월 ${match.d}일 경기 안내드립니다!\n\n📅 일시\n${match.m}월 ${match.d}일 (${match.day}) ${matchTimeStart}~${matchTimeEnd} 경기\n\n⚽️ 구장위치\n용산 더베이스 풋살장\n서울 용산구 한강대로23길 55 아이파크몰 리빙파크 9층\n\n💰 참가비:\n* 스타즈: 면제\n* 일반회원: 10,000원\n⏰ 마감: ${dead.m}월 ${dead.d}일 ${deadlineTime}까지\n\n* 늦참 시 참석투표 후 도착예정시간 댓글 부탁드립니다!\n* 일반회원은 입금완료 시 참석 확정입니다!`;

      window.Kakao.Share.sendDefault({
        objectType: 'text',
        text: text,
        link: { mobileWebUrl: magicLinkUrl, webUrl: magicLinkUrl },
        buttonTitle: '투표하러 가기 👆',
      });
    } else { alert('카카오톡 기능을 불러오는 중입니다. 잠시 후 시도해주세요.'); }
  };

  // --- 2. 당일 경기 안내(리마인더) 보내기 (카카오) ---
  const shareMatchReminder = () => {
    if (window.Kakao && window.Kakao.isInitialized()) {
      const match = formatKakaoDate(selectedDate);
      const magicLinkUrl = `${window.location.origin}${window.location.pathname}`;
      
      const text = `[🏁 총총 FC 풋살 모임 안내‼️]\n\n안녕하세요 총총FC 여러분\n당일 경기 안내드립니다!\n\n📅 일시\n${match.m}월 ${match.d}일 (${match.day}) ${matchTimeStart}~${matchTimeEnd} 경기\n* 경기 10분전 도착하시어 환복해주시면 원활한 경기진행이 됩니다\n\n⚽️ 구장위치\n용산 더베이스 풋살장\n서울 용산구 한강대로23길 55 아이파크몰 리빙파크 9층`;

      window.Kakao.Share.sendDefault({
        objectType: 'text',
        text: text,
        link: { mobileWebUrl: magicLinkUrl, webUrl: magicLinkUrl },
        buttonTitle: '웹사이트 확인하기',
      });
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
      if (!session && (activeTab === 'teams' || activeTab === 'attendance')) {
        setActiveTab('players');
      }
    });
    return () => authListener.subscription.unsubscribe();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    const { data: pData } = await supabase.from('players').select('*');
    if (pData) setPlayers(pData);
    const { data: rData } = await supabase.from('match_records').select('*');
    if (rData) setRecords(rData);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const currentDayIds = records.filter(r => r.date === selectedDate).map(r => r.player_id);
    setTempAttendance(currentDayIds);
  }, [records, selectedDate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    setLoading(false);
    if (error) { alert('로그인 실패: 이메일과 비밀번호를 확인해주세요.'); } 
    else { alert('운영진으로 로그인되었습니다.'); setShowLoginModal(false); setLoginEmail(''); setLoginPassword(''); }
  };

  const handleLogout = async () => {
    if (window.confirm('로그아웃 하시겠습니까?')) await supabase.auth.signOut();
  };

  const handleToggleAttendance = async (pid) => {
    const isAttending = tempAttendance.includes(pid);
    if (isAttending) {
      setTempAttendance(prev => prev.filter(id => id !== pid));
      await supabase.from('match_records').delete().eq('date', selectedDate).eq('player_id', pid);
    } else {
      setTempAttendance(prev => [...prev, pid]);
      await supabase.from('match_records').insert([{ date: selectedDate, player_id: pid }]);
    }
    fetchData();
  };

  const handleAddPlayer = async () => {
    if (!isAdmin) return alert('운영진만 가능합니다.');
    if (!newPlayer.name) return;
    const level = calculateLevel(newPlayer);
    const { error } = await supabase.from('players').insert([{ ...newPlayer, level }]);
    if (!error) {
      alert('등록되었습니다.'); fetchData();
      setNewPlayer({ name: '', gender: '남성', group: '일반', balance: 5, passing: 5, dribble: 5, shooting: 5, touch: 5, stamina: 5 });
    }
  };

  const handleDeletePlayer = async (id) => {
    if (!isAdmin) return alert('운영진만 가능합니다.');
    if (window.confirm('삭제하시겠습니까?')) { await supabase.from('players').delete().eq('id', id); fetchData(); }
  };

  const startEditing = (player) => { setEditingId(player.id); setEditForm({ ...player }); };
  const cancelEditing = () => { setEditingId(null); setEditForm({}); };
  const saveEditing = async () => {
    const level = calculateLevel(editForm);
    const { error } = await supabase.from('players').update({ ...editForm, level }).eq('id', editingId);
    if (!error) { alert('수정 완료'); setEditingId(null); fetchData(); }
  };

  const generateTeams = async () => {
    const currentDayRecords = records.filter(r => r.date === selectedDate);
    if (!currentDayRecords.length) return alert('참여 인원이 없습니다.');
    if (!window.confirm('팀을 새로 배정하시겠습니까? (기존 배정 초기화)\n*누를 때마다 구성이 조금씩 달라집니다.')) return;

    const currentDayPlayerIds = currentDayRecords.map(r => r.player_id);
    const attendedPlayers = players.filter(p => currentDayPlayerIds.includes(p.id));
    const noise = () => Math.random() * 0.5 - 0.25;

    const males = attendedPlayers.filter(p => p.gender === '남성').sort((a, b) => (b.level + noise()) - (a.level + noise()));
    const females = attendedPlayers.filter(p => p.gender === '여성').sort((a, b) => (b.level + noise()) - (a.level + noise()));
    const teams = Array.from({ length: teamCount }, () => []);

    females.forEach((p, i) => {
      const idx = (Math.floor(i / teamCount) % 2 === 0) ? (i % teamCount) : (teamCount - 1 - (i % teamCount));
      teams[idx].push(p);
    });

    males.forEach((p) => {
      let targetIdx = 0, minSum = Infinity;
      const indices = Array.from({length: teamCount}, (_, i) => i).sort(() => Math.random() - 0.5);
      for (let idx of indices) {
        const sum = teams[idx].reduce((acc, curr) => acc + curr.level, 0);
        if (sum < minSum) { minSum = sum; targetIdx = idx; }
      }
      teams[targetIdx].push(p);
    });

    const updates = [];
    teams.forEach((team, idx) => {
      team.forEach(p => { updates.push({ date: selectedDate, player_id: p.id, team: idx + 1, goals: 0, assists: 0 }); });
    });

    const { error } = await supabase.from('match_records').upsert(updates, { onConflict: 'date, player_id' });
    if (!error) { alert('팀 생성 완료!'); fetchData(); }
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

  const processedPlayers = useMemo(() => {
    let data = [...players];
    if (filterGender !== 'all') data = data.filter(p => p.gender === filterGender);
    data.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [players, filterGender, sortConfig]);

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ colKey }) => {
    if (sortConfig.key !== colKey) return <span className="text-gray-300 ml-1">↕</span>;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="ml-1 inline"/> : <ChevronDown size={14} className="ml-1 inline"/>;
  };

  const rankings = useMemo(() => {
    const stats = {};
    players.forEach(p => { stats[p.id] = { name: p.name, group: p.group, gender: p.gender, goals: 0, assists: 0 }; });
    records.forEach(r => {
      if (stats[r.player_id]) { stats[r.player_id].goals += r.goals; stats[r.player_id].assists += r.assists; }
    });
    const list = Object.values(stats);
    return {
      maleGoals: list.filter(p => p.gender === '남성').sort((a, b) => b.goals - a.goals),
      femaleGoals: list.filter(p => p.gender === '여성').sort((a, b) => b.goals - a.goals),
      maleAssists: list.filter(p => p.gender === '남성').sort((a, b) => b.assists - a.assists),
      femaleAssists: list.filter(p => p.gender === '여성').sort((a, b) => b.assists - a.assists),
    };
  }, [records, players]);

  const RankingTable = ({ title, data, type }) => (
    <Card title={title} className="h-full">
      <table className="w-full text-sm text-left">
        <thead className="bg-blue-50 text-blue-900 font-bold">
          <tr><th className="p-2 text-center w-12">순위</th><th className="p-2 text-center">이름</th><th className="p-2 text-center w-16">{type === 'goals' ? '골' : '어시'}</th></tr>
        </thead>
        <tbody>
          {data.slice(0, 10).map((p, i) => (
            <tr key={i} className="border-b">
              <td className="p-2 text-center text-gray-500">{i+1}</td>
              <td className="p-2 text-center justify-center flex"><PlayerName player={p}/></td>
              <td className="p-2 text-center font-bold text-blue-600">{type==='goals'?p.goals:p.assists}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-20 text-gray-800 relative">
      
      {/* 게스트용 떠다니는 투표 버튼 */}
      {!isAdmin && (
        <button onClick={() => setShowVoteModal(true)}
          className="fixed bottom-8 right-6 bg-blue-600 text-white px-5 py-4 rounded-full shadow-2xl hover:bg-blue-700 hover:scale-105 transition-transform z-40 flex items-center justify-center gap-2 border-2 border-white">
          <Calendar size={24} />
          <span className="font-bold text-lg shadow-sm">투표하기</span>
        </button>
      )}

      {/* 우측 플로팅 소셜 배너 */}
      <div className="hidden lg:flex flex-col gap-4 fixed right-8 top-1/2 -translate-y-1/2 z-30">
        {socialLinks.instagram && (
          <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" 
             className="bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-3 rounded-full text-white shadow-lg hover:scale-110 transition-transform flex items-center justify-center" title="인스타그램">
            <Instagram size={24} />
          </a>
        )}
        {socialLinks.youtube && ( <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="..."> <Youtube size={24} /> </a> )}
        {socialLinks.kakao && ( <a href={socialLinks.kakao} target="_blank" rel="noopener noreferrer" className="..."> <MessageCircle size={24} /> </a> )}
      </div>

      <header className="bg-blue-700 text-white p-4 sticky top-0 z-40 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold flex items-center gap-2"><Activity size={20}/> 총총 FC 매니저</h1>
          <div className="hidden sm:flex items-center gap-3 border-l border-blue-500 pl-4">
            {socialLinks.instagram && <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-pink-300 transition-colors"><Instagram size={18} /></a>}
            {socialLinks.youtube && <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-red-300 transition-colors"><Youtube size={18} /></a>}
            {socialLinks.kakao && <a href={socialLinks.kakao} target="_blank" rel="noopener noreferrer" className="hover:text-yellow-300 transition-colors"><MessageCircle size={18} /></a>}
          </div>
        </div>
        
        {/* 로그인 / 로그아웃 & 새로고침 버튼 */}
        <div className="flex items-center gap-3">
          {isAdmin ? (
            <button onClick={handleLogout} className="flex items-center gap-1 bg-red-500 px-3 py-1.5 rounded text-sm font-bold hover:bg-red-600 transition-colors">
              <LogOut size={16}/> 운영진 로그아웃
            </button>
          ) : (
            <button onClick={() => setShowLoginModal(true)} className="flex items-center gap-1 bg-blue-800 px-3 py-1.5 rounded text-sm font-bold hover:bg-blue-900 transition-colors border border-blue-500">
              <LogIn size={16}/> 운영진 로그인
            </button>
          )}
          <button onClick={fetchData} className="bg-blue-600 p-2 rounded-full hover:bg-blue-500"><RefreshCw size={18} className={loading ? "animate-spin" : ""}/></button>
        </div>
      </header>

      {/* --- 네비게이션 --- */}
      <nav className="flex bg-white border-b overflow-x-auto sticky top-14 z-30">
        {[
          { id: 'players', icon: Users, label: '선수' },
          isAdmin && { id: 'attendance', icon: Calendar, label: '참여(투표) 관리' },
          isAdmin && { id: 'teams', icon: UserCheck, label: '팀/기록 관리' },
          { id: 'scoreboard', icon: Trophy, label: '랭킹' },
        ].filter(Boolean).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex flex-col items-center p-3 text-xs font-bold ${activeTab===tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
            <tab.icon size={20} className="mb-1"/>{tab.label}
          </button>
        ))}
      </nav>

      <main className="p-4 max-w-4xl mx-auto space-y-6">
        
        {/* --- 1. 선수 관리 --- */}
        {activeTab === 'players' && (
          <>
            {isAdmin && (
              <Card title="선수 등록 (운영진 전용)">
                <div className="flex gap-2 mb-2">
                  <input placeholder="이름" className="border p-2 rounded w-24" value={newPlayer.name} onChange={e=>setNewPlayer({...newPlayer, name:e.target.value})}/>
                  <select className="border p-2 rounded" value={newPlayer.gender} onChange={e=>setNewPlayer({...newPlayer, gender:e.target.value})}><option>남성</option><option>여성</option></select>
                  {/* 등급(그룹) 선택 추가 */}
                  <select className="border p-2 rounded bg-yellow-50 text-yellow-900 font-bold" value={newPlayer.group} onChange={e=>setNewPlayer({...newPlayer, group:e.target.value})}>
                    <option value="일반">일반 회원</option>
                    <option value="스타즈">스타즈 ⭐️</option>
                  </select>
                </div>
                <div className="grid grid-cols-6 gap-1 mb-3">
                  {['balance','passing','dribble','shooting','touch','stamina'].map(s=>(
                    <div key={s} className="text-center">
                      <div className="text-[10px] uppercase font-bold text-gray-500">{s.slice(0,3)}</div>
                      <input type="number" min="0" max="10" className="w-full border text-center rounded" value={newPlayer[s]} onChange={e=>{
                          const val = Number(e.target.value);
                          if(val >= 0 && val <= 10) setNewPlayer({...newPlayer, [s]:e.target.value});
                      }}/>
                    </div>
                  ))}
                </div>
                <button onClick={handleAddPlayer} className="w-full bg-green-600 text-white py-2 rounded font-bold flex justify-center items-center gap-1"><Plus size={16}/> 등록하기</button>
              </Card>
            )}

            <div className="bg-white rounded shadow overflow-hidden">
              <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                 <div className="flex gap-1">
                   {['all', '남성', '여성'].map(f => (
                     <button key={f} onClick={()=>setFilterGender(f)}
                       className={`px-3 py-1 text-xs rounded-full font-bold border ${filterGender === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}>
                       {f === 'all' ? '전체' : f}
                     </button>
                   ))}
                 </div>
                 <span className="text-xs text-gray-500">* 더블클릭 상세정보</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-center whitespace-nowrap">
                  <thead className="bg-gray-100 text-gray-700 font-bold border-b">
                    <tr>
                      <th className="p-3 cursor-pointer hover:bg-gray-200" onClick={()=>handleSort('name')}>이름 <SortIcon colKey="name"/></th>
                      <th className="p-3 cursor-pointer hover:bg-gray-200" onClick={()=>handleSort('gender')}>성별 <SortIcon colKey="gender"/></th>
                      <th className="p-3">능력치</th>
                      <th className="p-3 text-blue-600 cursor-pointer hover:bg-gray-200" onClick={()=>handleSort('level')}>Lv <SortIcon colKey="level"/></th>
                      {isAdmin && <th className="p-3">관리</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {processedPlayers.map(p => {
                      const isEditing = editingId === p.id;
                      return (
                      <tr key={p.id} className="border-b hover:bg-gray-50 cursor-pointer" onDoubleClick={() => setDetailPlayer(p)}>
                        {isEditing ? (
                          <>
                            <td className="p-2"><input className="border w-16 text-center" value={editForm.name} onChange={e=>setEditForm({...editForm, name:e.target.value})}/></td>
                            <td className="p-2">
                              <select className="border text-xs" value={editForm.gender} onChange={e=>setEditForm({...editForm, gender:e.target.value})}><option>남성</option><option>여성</option></select>
                              <select className="border text-xs mt-1 bg-yellow-50" value={editForm.group||'일반'} onChange={e=>setEditForm({...editForm, group:e.target.value})}><option value="일반">일반</option><option value="스타즈">스타즈</option></select>
                            </td>
                            <td className="p-2"><div className="flex gap-1 justify-center">{['balance','passing','dribble','shooting','touch','stamina'].map(s => <input key={s} type="number" min="0" max="10" className="border w-8 text-center" value={editForm[s]} onChange={e=>setEditForm({...editForm, [s]:Number(e.target.value)})}/>)}</div></td>
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
                            {/* 스타즈 별 아이콘 적용 */}
                            <td className="p-3 flex justify-center"><PlayerName player={p}/></td>
                            <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${p.gender==='남성'?'bg-blue-100 text-blue-800':'bg-pink-100 text-pink-800'}`}>{p.gender}</span></td>
                            <td className="p-3 text-gray-500 text-xs">{p.balance}/{p.passing}/{p.dribble}/{p.shooting}/{p.touch}/{p.stamina}</td>
                            <td className="p-3 font-bold text-blue-600">{p.level}</td>
                            {isAdmin && (
                              <td className="p-3 flex justify-center gap-2">
                                <button onClick={(e)=>{ e.stopPropagation(); startEditing(p); }} className="text-blue-500"><Edit2 size={16}/></button>
                                <button onClick={(e)=>{ e.stopPropagation(); handleDeletePlayer(p.id); }} className="text-red-500"><Trash2 size={16}/></button>
                              </td>
                            )}
                          </>
                        )}
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* --- 2. 참여 관리 (운영진 전용) --- */}
        {isAdmin && activeTab === 'attendance' && (
          <>
            <Card title="이번 주 투표/경기 관리">
              <div className="flex flex-col gap-4">
                
                {/* 시간 및 마감 설정 */}
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
                </div>
                
                {/* 카카오톡 버튼 2개 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button onClick={shareVoteNotice} className="bg-[#FEE500] text-[#191919] px-4 py-3 rounded-lg font-bold hover:bg-[#e5cf00] flex items-center justify-center gap-2 shadow border border-yellow-400">
                    <MessageCircle size={20} className="fill-current"/> 1. 투표 열기 (카톡 공유)
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
                  {players.filter(p=>p.gender===gender).map(p => {
                    const isChecked = tempAttendance.includes(p.id);
                    return (
                      <div key={p.id} onClick={()=>handleToggleAttendance(p.id)} 
                           className={`p-3 rounded border cursor-pointer flex justify-between items-center transition-all ${isChecked ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500 shadow-sm' : 'bg-white hover:bg-gray-50'}`}>
                        <PlayerName player={p}/>
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

        {/* --- 3. 팀/기록 관리 (운영진 전용) --- */}
        {isAdmin && activeTab === 'teams' && (
          <>
            <div className="bg-white p-4 rounded shadow border-l-4 border-blue-600 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="flex items-center gap-2">
                 <span className="font-bold text-sm">날짜:</span>
                 <input type="date" className="border p-1 rounded font-bold" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)}/>
               </div>
               <div className="flex items-center gap-2">
                 <span className="font-bold text-sm">팀 수:</span>
                 <input type="number" value={teamCount} onChange={e=>setTeamCount(e.target.value)} className="border p-1 w-12 text-center rounded"/>
               </div>
               <button onClick={generateTeams} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold shadow hover:bg-blue-700">팀 생성/초기화</button>
            </div>

            <Card title="대기 명단 (투표 완료 인원)">
               <div className="flex flex-wrap gap-2">
                  {records.filter(r => r.date === selectedDate).map(r => {
                      const p = players.find(pl => pl.id === r.player_id);
                      if (!p) return null;
                      const isAssigned = r.team > 0;
                      return (
                        <div key={r.id} className={`px-3 py-1 rounded border text-sm font-bold flex items-center gap-2 ${isAssigned ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-700 border-blue-300'}`}>
                           <PlayerName player={p}/>
                           <span className="text-xs bg-white px-1 rounded border">Lv.{p.level}</span>
                           {isAssigned && <span className="text-xs text-green-600">→ 팀{r.team}</span>}
                        </div>
                      )
                  })}
                  {records.filter(r => r.date === selectedDate).length === 0 && <span className="text-gray-400">투표한 인원이 없습니다.</span>}
               </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({length: teamCount}).map((_, i) => {
                const teamNo = i + 1;
                const members = records.filter(r => r.date === selectedDate && r.team === teamNo);
                const teamPlayers = members.map(r => players.find(p => p.id === r.player_id)).filter(Boolean);
                const avg = teamPlayers.length ? (teamPlayers.reduce((a,b)=>a+b.level,0)/teamPlayers.length).toFixed(2) : 0;

                return (
                  <Card key={teamNo} title={`TEAM ${teamNo} (평균: ${avg})`}>
                    {members.length === 0 ? <div className="text-center text-gray-400 py-4">팀원이 없습니다.</div> : 
                      <div className="space-y-3">
                        {members.map(record => {
                          const p = players.find(pl => pl.id === record.player_id);
                          if (!p) return null;
                          return (
                            <div key={record.id} className="bg-gray-50 p-2 rounded border flex flex-col gap-2">
                              <div className="flex justify-between items-center">
                                <span className="font-bold flex items-center gap-1">
                                  <span className={`w-2 h-2 rounded-full ${p.gender==='남성'?'bg-blue-500':'bg-pink-500'}`}></span>
                                  <PlayerName player={p}/>
                                </span>
                                <button onClick={()=>setMovePlayerTarget({ p, teamNo: record.team })} 
                                        className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded flex items-center gap-1">
                                    <ArrowRightLeft size={12}/> 이동
                                </button>
                              </div>
                              <div className="flex gap-2">
                                <div className="flex-1 flex items-center bg-white border rounded px-2">
                                  <span className="text-xs font-bold text-gray-500 mr-2">골</span>
                                  <input type="number" min="0" className="w-full text-center font-bold text-blue-600 outline-none" 
                                    value={record.goals} onChange={(e)=>updateStat(p.id, 'goals', e.target.value)}/>
                                </div>
                                <div className="flex-1 flex items-center bg-white border rounded px-2">
                                  <span className="text-xs font-bold text-gray-500 mr-2">어시</span>
                                  <input type="number" min="0" className="w-full text-center font-bold text-green-600 outline-none" 
                                    value={record.assists} onChange={(e)=>updateStat(p.id, 'assists', e.target.value)}/>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    }
                  </Card>
                )
              })}
            </div>
          </>
        )}

        {/* --- 4. 랭킹 --- */}
        {activeTab === 'scoreboard' && (
          <div className="grid grid-cols-2 gap-4 h-full items-start">
             <div className="flex flex-col gap-4">
               <RankingTable title="득점 랭킹 (남성)" data={rankings.maleGoals} type="goals"/>
               <RankingTable title="득점 랭킹 (여성)" data={rankings.femaleGoals} type="goals"/>
             </div>
             <div className="flex flex-col gap-4">
               <RankingTable title="도움 랭킹 (남성)" data={rankings.maleAssists} type="assists"/>
               <RankingTable title="도움 랭킹 (여성)" data={rankings.femaleAssists} type="assists"/>
             </div>
          </div>
        )}
      </main>

      {/* --- 게스트용 투표 팝업 --- */}
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
                <p className="text-xs text-blue-600 mt-1">* 한 번 더 누르면 불참으로 변경됩니다.</p>
                <p className="text-xs text-blue-600 mt-1">* 늦참이나 뒤풀이 여부는 카톡방에 남겨주세요!</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {['남성','여성'].map(gender => (
                  <div key={gender} className="space-y-2">
                    <div className="bg-gray-100 text-center font-bold py-1.5 rounded text-sm text-gray-700 shadow-sm border">{gender}</div>
                    {players.filter(p=>p.gender===gender).map(p => {
                      const isChecked = tempAttendance.includes(p.id);
                      return (
                        <div key={p.id} onClick={()=>handleToggleAttendance(p.id)}
                             className={`p-2.5 rounded border cursor-pointer flex justify-between items-center transition-all ${isChecked ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500 shadow-md' : 'bg-white hover:bg-gray-50'}`}>
                          <PlayerName player={p}/>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isChecked?'bg-blue-600 border-blue-600':'border-gray-300'}`}>
                            {isChecked && <UserCheck size={12} className="text-white"/>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50 shrink-0">
              <button onClick={() => setShowVoteModal(false)} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-700 shadow-lg">
                투표 완료 (창 닫기)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 운영진 로그인 모달 창 --- */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <form onSubmit={handleLogin} className="bg-white rounded-lg w-full max-w-sm p-6 shadow-2xl flex flex-col gap-4">
            <h2 className="text-xl font-bold text-center border-b pb-2">운영진 로그인</h2>
            <p className="text-xs text-gray-500 text-center">Supabase에서 생성한 계정으로 로그인하세요.</p>
            <div>
              <label className="block text-sm font-bold mb-1">이메일</label>
              <input type="email" required className="w-full border p-2 rounded" 
                     value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">비밀번호</label>
              <input type="password" required className="w-full border p-2 rounded" 
                     value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} />
            </div>
            <div className="flex gap-2 mt-2">
              <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">
                {loading ? '로그인 중...' : '로그인'}
              </button>
              <button type="button" onClick={() => setShowLoginModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded font-bold hover:bg-gray-300">
                취소
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
