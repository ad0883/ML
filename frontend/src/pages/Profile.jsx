import React, { useEffect, useState, useMemo, useRef } from 'react';
import Threads from '../components/Threads';
import PillNav from '../components/PillNav';
import logo from '../assets/logo.svg';
import Celebration from '../components/Celebration';

const KEY_PROFILE = 'user_profile_v1';
const KEY_ACHIEVEMENTS = 'achievements_v1';

const ACHIEVEMENTS = [
	{ id: 'first_scan', name: 'First Scan', desc: 'Complete your first meal scan', icon: '🍽️', goal: 1 },
	{ id: 'scan_streak_3', name: 'Consistent', desc: 'Scan meals 3 days in a row', icon: '🔥', goal: 3 },
	{ id: 'scan_streak_7', name: 'Dedicated', desc: 'Scan meals 7 days in a row', icon: '⭐', goal: 7 },
	{ id: 'scan_count_10', name: 'Explorer', desc: 'Complete 10 scans', icon: '🗺️', goal: 10 },
	{ id: 'scan_count_50', name: 'Veteran', desc: 'Complete 50 scans', icon: '🏆', goal: 50 },
	{ id: 'hydration_3', name: 'Hydrated', desc: 'Hit hydration goal 3 days', icon: '💧', goal: 3 },
	{ id: 'fasting_14', name: 'Fasting Pro', desc: 'Complete a 14hr+ fast', icon: '⏱️', goal: 14 },
	{ id: 'supplement_streak_7', name: 'Supplement Master', desc: 'Check off supplements 7 days in a row', icon: '💊', goal: 7 }
];

const loadProfile = () => { try { return JSON.parse(localStorage.getItem(KEY_PROFILE) || '{}'); } catch { return {}; } };
const saveProfile = (p) => { try { localStorage.setItem(KEY_PROFILE, JSON.stringify(p)); } catch {} };
const loadAchievements = () => { try { return JSON.parse(localStorage.getItem(KEY_ACHIEVEMENTS) || '{}'); } catch { return {}; } };
const saveAchievements = (a) => { try { localStorage.setItem(KEY_ACHIEVEMENTS, JSON.stringify(a)); } catch {} };

export default function Profile() {
	const [profile, setProfile] = useState(loadProfile());
	const [achievements, setAchievements] = useState(loadAchievements());
	const [name, setName] = useState(profile.name || localStorage.getItem('username') || 'User');
	const [goal, setGoal] = useState(profile.dailyCalorieGoal || 2000);
	const fileInputRef = useRef(null);
	const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '/images/avatar.png');

	useEffect(() => {
		const next = { ...profile, name, dailyCalorieGoal: goal, avatarUrl };
		setProfile(next);
		saveProfile(next);
		localStorage.setItem('username', name);
	}, [name, goal, avatarUrl]);

	const handleAvatarPick = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => { if (typeof reader.result === 'string') setAvatarUrl(reader.result); };
		reader.readAsDataURL(file);
	};

	const stats = useMemo(() => {
		const userId = (()=>{
			try { const p = JSON.parse(localStorage.getItem(KEY_PROFILE) || '{}'); return (p?.name || localStorage.getItem('username') || 'guest').trim().toLowerCase() || 'guest'; }
			catch { return (localStorage.getItem('username') || 'guest').trim().toLowerCase() || 'guest'; }
		})();
		const scans = JSON.parse(localStorage.getItem(`meal_history:${userId}`) || '[]');
		const hydration = JSON.parse(localStorage.getItem('hydration_fasting_state_v1') || '{}');
		const totalScans = scans.length;
		const totalCalories = scans.reduce((sum, s) => sum + (s.totals?.calories || 0), 0);
		const avgCalories = totalScans > 0 ? Math.round(totalCalories / totalScans) : 0;
		const hydrationGoal = hydration.goalMl || 2000;
		const waterDays = Object.keys(hydration.daily || {}).filter(k => (hydration.daily[k]?.waterMl || 0) >= hydrationGoal).length;
		const fastHistory = hydration.fastHistory || [];
		const longestFast = fastHistory.length > 0 ? Math.max(...fastHistory.map(f => f.hours || 0)) : 0;
		return { totalScans, avgCalories, waterDays, longestFast };
	}, []);

	useEffect(() => {
		const unlocked = { ...achievements };
		let changed = false;
		if (stats.totalScans >= 1 && !unlocked.first_scan) { unlocked.first_scan = Date.now(); changed = true; }
		if (stats.totalScans >= 10 && !unlocked.scan_count_10) { unlocked.scan_count_10 = Date.now(); changed = true; }
		if (stats.totalScans >= 50 && !unlocked.scan_count_50) { unlocked.scan_count_50 = Date.now(); changed = true; }
		if (stats.waterDays >= 3 && !unlocked.hydration_3) { unlocked.hydration_3 = Date.now(); changed = true; }
		if (stats.longestFast >= 14 && !unlocked.fasting_14) { unlocked.fasting_14 = Date.now(); changed = true; }
		if (changed) { setAchievements(unlocked); saveAchievements(unlocked); }
	}, [stats, achievements]);

	return (
		<div style={{ position:'relative', minHeight:'100dvh', overflow:'hidden' }}>
			<Celebration />
			<Threads amplitude={1} distance={0} enableMouseInteraction={false} style={{ top: -60, height: 'calc(100% + 60px)' }} />
			<PillNav
				logo={logo}
				items={[
					{ label:'Home', href:'/landing' },
					{ label:'Scan', href:'/scan' },
					{ label:'Chat', href:'/chat' },
					{ label:'Hydration', href:'/hydration' },
					{ label:'Supplements', href:'/supplements' },
					{ label:'Profile', href:'/profile' }
				]}
				activeHref="/profile"
				baseColor="#000000"
				pillColor="#ffffff"
				hoveredPillTextColor="#ffffff"
				pillTextColor="#000000"
			/>

			<section style={{ position:'relative', height: 520 }}>
				<div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'0 16px', gap:12 }}>
					<div style={{ position:'relative' }}>
						<img src={avatarUrl} alt="Avatar" style={{ width:88, height:88, borderRadius:'50%', objectFit:'cover', boxShadow:'0 10px 30px rgba(0,0,0,0.35)', border:'3px solid rgba(255,255,255,0.8)' }} />
						<button onClick={() => fileInputRef.current?.click()} style={{ position:'absolute', right:-8, bottom:-8, padding:'6px 10px', borderRadius:999, border:'1px solid rgba(255,255,255,0.35)', background:'#fff', color:'#111', fontWeight:700, cursor:'pointer', fontSize:12 }}>Change</button>
						<input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarPick} style={{ display:'none' }} />
					</div>
					<h2 style={{ color:'#eaf0ff', margin:0, fontSize:28, fontWeight:800 }}>{name}</h2>
					<p style={{ color:'rgba(234,240,255,0.85)', margin:0 }}>@{name.toLowerCase().replace(' ', '')}</p>
				</div>
			</section>

			<section style={{ width:'min(1100px,92vw)', margin:'32px auto', color:'#eaf0ff', display:'grid', gap:16, gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))' }}>
				<div style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:16, padding:16 }}>
					<h3>Streak</h3>
					<p>{stats.totalScans} days</p>
				</div>
				<div style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:16, padding:16 }}>
					<h3>Average calories</h3>
					<p>{stats.avgCalories}</p>
				</div>
				<div style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:16, padding:16 }}>
					<h3>Daily calorie goal</h3>
					<div style={{ display:'flex', gap:8 }}>
						<input type="number" value={goal} onChange={e=>setGoal(parseInt(e.target.value||'0',10))} style={{ flex:1, padding:'8px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,0.25)', background:'rgba(255,255,255,0.1)', color:'#fff' }} />
						<button onClick={()=>saveProfile({ ...profile, dailyCalorieGoal: goal })} className="btn primary">Save</button>
					</div>
				</div>
				<div style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:16, padding:16 }}>
					<h3>Display name</h3>
					<div style={{ display:'flex', gap:8 }}>
						<input value={name} onChange={e=>setName(e.target.value)} style={{ flex:1, padding:'8px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,0.25)', background:'rgba(255,255,255,0.1)', color:'#fff' }} />
						<button onClick={()=>saveProfile({ ...profile, name })} className="btn primary">Save</button>
					</div>
				</div>
			</section>

			<section style={{ width:'min(1100px,92vw)', margin:'32px auto', color:'#eaf0ff' }}>
				<h2>Achievements</h2>
				<div style={{ display:'grid', gap:16, gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))' }}>
					{ACHIEVEMENTS.map(a => {
						const unlocked = !!achievements[a.id];
						return (
							<div key={a.id} style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:16, padding:16 }}>
								<div style={{ fontSize:22, opacity: unlocked ? 1 : 0.45 }}>{unlocked ? a.icon : '🔒'}</div>
								<h3 style={{ margin:'8px 0 4px' }}>{a.name}</h3>
								<p style={{ margin:0, color:'rgba(234,240,255,0.85)' }}>{a.desc}</p>
								{unlocked && <small style={{ color:'rgba(234,240,255,0.65)' }}>Unlocked {new Date(achievements[a.id]).toLocaleDateString()}</small>}
							</div>
						);
					})}
				</div>
			</section>
		</div>
	);
}