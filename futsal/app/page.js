'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Users, Calendar, Activity, Trophy, Plus, 
  Trash2, UserCheck, RefreshCw, Edit2, Save, X, ArrowRightLeft,
  ChevronUp, ChevronDown 
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, ResponsiveContainer 
} from 'recharts';

// --------------------------------------------------------
// [중요] Supabase 키 (기존 것 그대로 유지!)
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

const Card = ({ title, children, className = "" }) => (
  <div className={`bg-white rounded-lg border-2 border-blue-600 overflow-hidden shadow-sm flex flex-col ${className}`}>
    <div className="bg-blue-600 px-4 py-2 shrink-0">
      <h3 className="text-white font-bold text-lg">{title}</h3>
    </div>
    <div className="p-4 flex-1">{children}</div>
  </div>
);

// --- 팀 이동 팝업 컴포넌트 ---
const MoveTeamModal = ({ player, currentTeam, teamCount, onMove, onClose }) => {
  if (!player) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-sm p-6 shadow-2xl">
        <h3 className="text-lg font-bold mb-4 text-center">{player.name} 팀 이동</h3>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: teamCount }).map((_, i) => {
            const tNo = i + 1;
            return (
              <button
                key={tNo}
                onClick={() => onMove(player.id, tNo)}
                disabled={tNo === currentTeam}
                className={`p-3 rounded font-bold border ${tNo === currentTeam ? 'bg-gray-200 text-gray-400' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-300'}`}
              >
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

// --- 선수 상세 정보 모달 ---
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="bg-blue-700 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">{player.name} 상세 정보</h2>
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
                <p className="text-gray-600">성별: {player.gender}</p>
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
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [teamCount, setTeamCount] = useState(2);
  const [newPlayer, setNewPlayer] = useState({ name: '', gender: '남성', balance: 5, passing: 5, dribble: 5, shooting: 5, touch: 5, stamina: 5 });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  
  const [detailPlayer, setDetailPlayer] = useState(null);
  const [movePlayerTarget, setMovePlayerTarget] = useState(null);
  const [tempAttendance, setTempAttendance] = useState([]);

  // [신규] 필터 및 정렬 상태
  const [filterGender, setFilterGender] = useState('all'); // all, 남성, 여성
  const [sortConfig, setSortConfig] = useState({ key: 'level', direction: 'desc' });

  // --- 데이터 불러오기 ---
  const fetchData = async () => {
    setLoading(true);
    const { data: pData } = await supabase.from('players').select('*');
    if (pData) setPlayers(pData);

    const { data: rData } = await supabase.from('match_records').select('*');
    if (rData) setRecords(rData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const currentDayIds = records
      .filter(r => r.date === selectedDate)
      .map(r => r.player_id);
    setTempAttendance(currentDayIds);
  }, [records, selectedDate]);

  // --- 핸들러들 ---
  const handleAddPlayer = async () => {
    if (!newPlayer.name) return;
    const level = calculateLevel(newPlayer);
    const { error } = await supabase.from('players').insert([{ ...newPlayer, level }]);
    if (!error) {
      alert('등록되었습니다.');
      fetchData();
      setNewPlayer({ name: '', gender: '남성', balance: 5, passing: 5, dribble: 5, shooting: 5, touch: 5, stamina: 5 });
    } else {
      alert('등록 실패: 키 확인 필요');
    }
  };

  const handleDeletePlayer = async (id) => {
    if (window.confirm('삭제하시겠습니까?')) {
      await supabase.from('players').delete().eq('id', id);
      fetchData();
    }
  };

  const startEditing = (player) => { setEditingId(player.id); setEditForm({ ...player }); };
  const cancelEditing = () => { setEditingId(null); setEditForm({}); };
  const saveEditing = async () => {
    const level = calculateLevel(editForm);
    const { error } = await supabase.from('players').update({ ...editForm, level }).eq('id', editingId);
    if (!error) { alert('수정 완료'); setEditingId(null); fetchData(); }
  };

  const handleToggleTemp = (pid) => {
    if (tempAttendance.includes(pid)) setTempAttendance(tempAttendance.filter(id => id !== pid));
    else setTempAttendance([...tempAttendance, pid]);
  };

  const handleSaveAttendance = async () => {
    const currentDayRecords = records.filter(r => r.date === selectedDate);
    const currentIds = currentDayRecords.map(r => r.player_id);
    const toAdd = tempAttendance.filter(id => !currentIds.includes(id));
    const toRemove = currentIds.filter(id => !tempAttendance.includes(id));

    if (toRemove.length > 0) await supabase.from('match_records').delete().eq('date', selectedDate).in('player_id', toRemove);
    if (toAdd.length > 0) {
      const newRows = toAdd.map(id => ({ date: selectedDate, player_id: id }));
      await supabase.from('match_records').insert(newRows);
    }
    alert('참여 명단 저장 완료!');
    fetchData();
  };

  const generateTeams = async () => {
    const currentDayRecords = records.filter(r => r.date === selectedDate);
    if (!currentDayRecords.length) return alert('참여 인원이 없습니다.');
    if (!window.confirm('팀을 새로 배정하시겠습니까? (기존 배정 초기화)\n*누를 때마다 구성이 조금씩 달라집니다.')) return;

    const currentDayPlayerIds = currentDayRecords.map(r => r.player_id);
    const attendedPlayers = players.filter(p => currentDayPlayerIds.includes(p.id));
    
    const noise = () => Math.random() * 0.5 - 0.25;

    const males = attendedPlayers.filter(p => p.gender === '남성')
      .sort((a, b) => (b.level + noise()) - (a.level + noise()));
    
    const females = attendedPlayers.filter(p => p.gender === '여성')
      .sort((a, b) => (b.level + noise()) - (a.level + noise()));
    
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
      team.forEach(p => {
        updates.push({ date: selectedDate, player_id: p.id, team: idx + 1, goals: 0, assists: 0 });
      });
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
    if (!error) {
      alert('이동되었습니다.');
      setMovePlayerTarget(null);
      fetchData();
    }
  };

  // [신규] 필터 및 정렬 로직 처리
  const processedPlayers = useMemo(() => {
    let data = [...players];
    // 1. 필터
    if (filterGender !== 'all') {
      data = data.filter(p => p.gender === filterGender);
    }
    // 2. 정렬
    data.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [players, filterGender, sortConfig]);

  const handleSort = (key) => {
    let direction = 'desc'; // 기본 내림차순
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ colKey }) => {
    if (sortConfig.key !== colKey) return <span className="text-gray-300 ml-1">↕</span>;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="ml-1 inline"/> : <ChevronDown size={14} className="ml-1 inline"/>;
  };

  const rankings = useMemo(() => {
    const stats = {};
    players.forEach(p => { stats[p.id] = { name: p.name, gender: p.gender, goals: 0, assists: 0 }; });
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
            <tr key={i} className="border-b"><td className="p-2 text-center text-gray-500">{i+1}</td><td className="p-2 text-center">{p.name}</td><td className="p-2 text-center font-bold text-blue-600">{type==='goals'?p.goals:p.assists}</td></tr>
          ))}
        </tbody>
      </table>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-20 text-gray-800">
      <header className="bg-blue-700 text-white p-4 sticky top-0 z-50 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold flex items-center gap-2"><Activity size={20}/> 풋살 매니저</h1>
        <button onClick={fetchData} className="bg-blue-600 p-2 rounded-full hover:bg-blue-500"><RefreshCw size={18} className={loading ? "animate-spin" : ""}/></button>
      </header>

      <nav className="flex bg-white border-b overflow-x-auto sticky top-14 z-40">
        {[
          { id: 'players', icon: Users, label: '선수' },
          { id: 'attendance', icon: Calendar, label: '참여' },
          { id: 'teams', icon: UserCheck, label: '팀/기록' },
          { id: 'scoreboard', icon: Trophy, label: '랭킹' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex flex-col items-center p-3 text-xs font-bold ${activeTab===tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
            <tab.icon size={20} className="mb-1"/>{tab.label}
          </button>
        ))}
      </nav>

      <main className="p-4 max-w-4xl mx-auto space-y-6">
        
        {/* --- 1. 선수 관리 --- */}
        {activeTab === 'players' && (
          <>
            <Card title="선수 등록">
              <div className="flex gap-2 mb-2">
                <input placeholder="이름" className="border p-2 rounded w-24" value={newPlayer.name} onChange={e=>setNewPlayer({...newPlayer, name:e.target.value})}/>
                <select className="border p-2 rounded" value={newPlayer.gender} onChange={e=>setNewPlayer({...newPlayer, gender:e.target.value})}><option>남성</option><option>여성</option></select>
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

            <div className="bg-white rounded shadow overflow-hidden">
              <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                 {/* [신규] 필터 버튼 */}
                 <div className="flex gap-1">
                   {['all', '남성', '여성'].map(f => (
                     <button 
                       key={f} 
                       onClick={()=>setFilterGender(f)}
                       className={`px-3 py-1 text-xs rounded-full font-bold border ${filterGender === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}
                     >
                       {f === 'all' ? '전체' : f}
                     </button>
                   ))}
                 </div>
                 <span className="text-xs text-gray-500">* 더블클릭 상세정보</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-center whitespace-nowrap">
                  <thead className="bg-gray-100 text-gray-700 font-bold border-b">
                    {/* [신규] 정렬 가능한 헤더 */}
                    <tr>
                      <th className="p-3 cursor-pointer hover:bg-gray-200" onClick={()=>handleSort('name')}>이름 <SortIcon colKey="name"/></th>
                      <th className="p-3 cursor-pointer hover:bg-gray-200" onClick={()=>handleSort('gender')}>성별 <SortIcon colKey="gender"/></th>
                      <th className="p-3">능력치</th>
                      <th className="p-3 text-blue-600 cursor-pointer hover:bg-gray-200" onClick={()=>handleSort('level')}>Lv <SortIcon colKey="level"/></th>
                      <th className="p-3">관리</th>
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
                            <td className="p-2"><select className="border" value={editForm.gender} onChange={e=>setEditForm({...editForm, gender:e.target.value})}><option>남성</option><option>여성</option></select></td>
                            <td className="p-2"><div className="flex gap-1 justify-center">{['balance','passing','dribble','shooting','touch','stamina'].map(s => <input key={s} type="number" min="0" max="10" className="border w-8 text-center" value={editForm[s]} onChange={e=>setEditForm({...editForm, [s]:Number(e.target.value)})}/>)}</div></td>
                            <td className="p-2 font-bold text-blue-600">-</td>
                            <td className="p-2 flex justify-center gap-2">
                               <button onClick={saveEditing} className="text-green-600"><Save size={18}/></button>
                               <button onClick={cancelEditing} className="text-gray-500"><X size={18}/></button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-3 font-medium">{p.name}</td>
                            <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${p.gender==='남성'?'bg-blue-100 text-blue-800':'bg-pink-100 text-pink-800'}`}>{p.gender}</span></td>
                            <td className="p-3 text-gray-500 text-xs">{p.balance}/{p.passing}/{p.dribble}/{p.shooting}/{p.touch}/{p.stamina}</td>
                            <td className="p-3 font-bold text-blue-600">{p.level}</td>
                            <td className="p-3 flex justify-center gap-2">
                              <button onClick={()=>startEditing(p)} className="text-blue-500"><Edit2 size={16}/></button>
                              <button onClick={()=>handleDeletePlayer(p.id)} className="text-red-500"><Trash2 size={16}/></button>
                            </td>
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

        {/* --- 2. 참여 관리 --- */}
        {activeTab === 'attendance' && (
          <>
            <Card title="참여 및 저장">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="font-bold">날짜:</span>
                    <input type="date" className="border p-2 rounded font-bold bg-gray-50" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)}/>
                </div>
                <button onClick={handleSaveAttendance} className="w-full md:w-auto bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 flex items-center justify-center gap-2 shadow-lg">
                    <Save size={18}/> 참여 명단 저장 (DB반영)
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">* [저장] 버튼을 눌러야 팀 생성 탭에서 인원이 보입니다.</p>
            </Card>
            
            <div className="grid grid-cols-2 gap-4">
              {['남성','여성'].map(gender => (
                <Card key={gender} title={gender}>
                  <div className="space-y-2">
                  {players.filter(p=>p.gender===gender).map(p => {
                    const isChecked = tempAttendance.includes(p.id);
                    return (
                      <div key={p.id} onClick={()=>handleToggleTemp(p.id)} 
                           className={`p-3 rounded border cursor-pointer flex justify-between items-center transition-all ${isChecked ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white hover:bg-gray-50'}`}>
                        <span className="font-bold">{p.name} <span className="text-xs text-gray-400 font-normal">({p.level})</span></span>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${isChecked?'bg-blue-600 border-blue-600':''}`}>
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

        {/* --- 3. 팀/기록 관리 --- */}
        {activeTab === 'teams' && (
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

            <Card title="대기 명단 (팀 배정 전)">
               <div className="text-xs text-gray-500 mb-2">* '참여 관리'에서 저장된 인원입니다. 팀이 생성되면 팀 번호가 부여됩니다.</div>
               <div className="flex flex-wrap gap-2">
                  {records.filter(r => r.date === selectedDate).map(r => {
                      const p = players.find(pl => pl.id === r.player_id);
                      if (!p) return null;
                      const isAssigned = r.team > 0;
                      return (
                        <div key={r.id} className={`px-3 py-1 rounded border text-sm font-bold flex items-center gap-2 ${isAssigned ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-700 border-blue-300'}`}>
                           <span>{p.name}</span>
                           <span className="text-xs bg-white px-1 rounded border">Lv.{p.level}</span>
                           {isAssigned && <span className="text-xs text-green-600">→ 팀{r.team}</span>}
                        </div>
                      )
                  })}
                  {records.filter(r => r.date === selectedDate).length === 0 && <span className="text-gray-400">대기 인원이 없습니다.</span>}
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
                                  {p.name}
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

      {/* 팝업들 */}
      <PlayerDetailModal player={detailPlayer} records={records} onClose={() => setDetailPlayer(null)} />
      {movePlayerTarget && (
        <MoveTeamModal 
           player={movePlayerTarget.p} 
           currentTeam={movePlayerTarget.teamNo} 
           teamCount={teamCount} 
           onMove={handleMoveTeam} 
           onClose={()=>setMovePlayerTarget(null)} 
        />
      )}
    </div>
  );
}