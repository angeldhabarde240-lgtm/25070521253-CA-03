import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
}

const icons = {
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  lock: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M3 3l18 18" /><path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  logout: <><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><path d="M10 17l-5-5 5-5M5 12h12" /></>,
  shield: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="m9 12 2 2 4-4" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  database: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></>,
  id: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="12" r="2" /><path d="M14 10h4M14 14h4" /></>,
  alert: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>
};

function Icon({ name, size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name]}</svg>;
}

function Background() {
  return <div className="bg" aria-hidden="true"><span className="blob b1" /><span className="blob b2" /><span className="blob b3" /><div className="grid-overlay" /></div>;
}

function Logo() {
  return <div className="logo"><span className="logo-mark">✦</span>Nexus</div>;
}

function App() {
  const [page, setPage] = useState('signin');
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(() => !!localStorage.getItem('token'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    request('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((data) => { setUser(data.user); setPage('dashboard'); })
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setChecking(false));
  }, []);

  const onAuth = ({ token, user }) => { localStorage.setItem('token', token); setUser(user); setPage('dashboard'); };
  const signOut = () => { localStorage.removeItem('token'); setUser(null); setPage('signin'); };

  if (checking) return <div className="screen"><Background /><span className="spinner lg" /></div>;
  if (page === 'dashboard' && user) return <Dashboard user={user} onSignOut={signOut} />;
  return <AuthPage mode={page} onSwitch={setPage} onAuth={onAuth} />;
}

function AuthPage({ mode, onSwitch, onAuth }) {
  const signup = mode === 'signup';
  return <div className="screen">
    <Background />
    <div className="auth-card">
      <aside className="auth-hero">
        <Logo />
        <div>
          <h2>{signup ? 'Start your journey with us.' : 'Welcome back.'}</h2>
          <p>{signup ? 'Create your account in seconds and get instant access to your personal dashboard.' : 'Sign in to pick up right where you left off. Your dashboard is waiting.'}</p>
        </div>
        <ul className="perks">
          <li><Icon name="shield" />Passwords encrypted with bcrypt</li>
          <li><Icon name="lock" />Secure token-based sessions</li>
          <li><Icon name="database" />Your details stored safely in MongoDB</li>
        </ul>
      </aside>
      <section className="auth-form-wrap">
        <div className="mobile-logo"><Logo /></div>
        <div className={`tabs ${mode}`}>
          <span className="tab-indicator" />
          <button type="button" className={signup ? '' : 'active'} onClick={() => onSwitch('signin')}>Sign In</button>
          <button type="button" className={signup ? 'active' : ''} onClick={() => onSwitch('signup')}>Sign Up</button>
        </div>
        <h1>{signup ? 'Create account' : 'Sign in to your account'}</h1>
        <p className="muted">{signup ? 'Fill in your details to get started.' : 'Enter your email and password to continue.'}</p>
        {signup ? <SignUpForm key="signup" onAuth={onAuth} /> : <SignInForm key="signin" onAuth={onAuth} />}
        <p className="switch">
          {signup ? 'Already have an account? ' : "Don't have an account? "}
          <button type="button" className="link" onClick={() => onSwitch(signup ? 'signin' : 'signup')}>{signup ? 'Sign in' : 'Create one'}</button>
        </p>
      </section>
    </div>
  </div>;
}

function useSubmit(action) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try { await action(); } catch (err) { setError(err.message); setLoading(false); }
  };
  return { submit, error, loading };
}

function Field({ icon, label, type = 'text', value, onChange, ...props }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return <label className="field">
    <span className="field-label">{label}</span>
    <div className="field-input">
      <Icon name={icon} />
      <input type={isPassword && show ? 'text' : type} value={value} onChange={(e) => onChange(e.target.value)} required {...props} />
      {isPassword && <button type="button" className="eye" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}><Icon name={show ? 'eyeOff' : 'eye'} /></button>}
    </div>
  </label>;
}

function SubmitButton({ loading, children }) {
  return <button className="btn-primary" disabled={loading}>{loading ? <span className="spinner" /> : <>{children}<span className="arrow">→</span></>}</button>;
}

function ErrorAlert({ message }) {
  return message ? <div className="alert" role="alert"><Icon name="alert" />{message}</div> : null;
}

const strengthLevels = [['Too short', '#ef4444'], ['Weak', '#ef4444'], ['Fair', '#f59e0b'], ['Good', '#3b82f6'], ['Strong', '#22c55e']];
function passwordScore(pw) {
  if (pw.length < 6) return 0;
  return 1 + (pw.length >= 10) + (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) + (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw));
}

function StrengthMeter({ password }) {
  const score = passwordScore(password);
  const [label, color] = strengthLevels[score];
  return <div className="strength">
    <div className="strength-bars">{[1, 2, 3, 4].map((i) => <span key={i} style={i <= score ? { background: color } : undefined} />)}</div>
    <span className="strength-label" style={{ color }}>{label}</span>
  </div>;
}

function SignUpForm({ onAuth }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const set = (key) => (value) => setForm({ ...form, [key]: value });
  const mismatch = form.confirm && form.password !== form.confirm;
  const { submit, error, loading } = useSubmit(async () => {
    if (form.password !== form.confirm) throw new Error('Passwords do not match');
    const { confirm, ...body } = form;
    onAuth(await request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }));
  });

  return <form className="form" onSubmit={submit}>
    <Field icon="user" label="Full name" placeholder="Jane Doe" value={form.name} onChange={set('name')} autoComplete="name" />
    <Field icon="mail" label="Email address" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} autoComplete="email" />
    <div>
      <Field icon="lock" label="Password" type="password" placeholder="At least 6 characters" minLength={6} value={form.password} onChange={set('password')} autoComplete="new-password" />
      {form.password && <StrengthMeter password={form.password} />}
    </div>
    <div>
      <Field icon="lock" label="Confirm password" type="password" placeholder="Repeat your password" minLength={6} value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
      {mismatch && <span className="hint">Passwords do not match</span>}
    </div>
    <ErrorAlert message={error} />
    <SubmitButton loading={loading}>Create account</SubmitButton>
  </form>;
}

function SignInForm({ onAuth }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const set = (key) => (value) => setForm({ ...form, [key]: value });
  const { submit, error, loading } = useSubmit(async () => onAuth(await request('/auth/signin', { method: 'POST', body: JSON.stringify(form) })));

  return <form className="form" onSubmit={submit}>
    <Field icon="mail" label="Email address" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} autoComplete="email" />
    <Field icon="lock" label="Password" type="password" placeholder="Your password" value={form.password} onChange={set('password')} autoComplete="current-password" />
    <ErrorAlert message={error} />
    <SubmitButton loading={loading}>Sign in</SubmitButton>
  </form>;
}

function Dashboard({ user, onSignOut }) {
  const initials = user.name.split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  const joined = new Date(user.createdAt);
  const days = Math.max(1, Math.ceil((Date.now() - joined) / 86400000));
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return <div className="dash">
    <Background />
    <header className="topbar">
      <Logo />
      <div className="topbar-right">
        <div className="user-chip"><span className="avatar sm">{initials}</span><span className="chip-name">{user.name}</span></div>
        <button className="btn-ghost" onClick={onSignOut}><Icon name="logout" />Sign out</button>
      </div>
    </header>
    <main className="dash-main">
      <section className="hero-card">
        <div className="hero-copy">
          <span className="badge"><span className="dot" />Signed in securely</span>
          <h1>{greeting}, {user.name.split(' ')[0]}!</h1>
          <p>Your account is set up and connected. Here's a quick look at your profile.</p>
        </div>
        <div className="hero-art"><span className="ring r1" /><span className="ring r2" /><span className="avatar xl">{initials}</span></div>
      </section>
      <section className="stats">
        <Stat icon="shield" tone="green" label="Account status" value="Active" />
        <Stat icon="calendar" tone="violet" label="Member since" value={joined.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} />
        <Stat icon="clock" tone="pink" label="Days with us" value={days} />
      </section>
      <section className="profile-card glass">
        <h2>Profile details</h2>
        <div className="profile-rows">
          <Row icon="user" label="Full name" value={user.name} />
          <Row icon="mail" label="Email address" value={user.email} />
          <Row icon="id" label="User ID" value={user.id} mono />
        </div>
      </section>
    </main>
  </div>;
}

function Stat({ icon, tone, label, value }) {
  return <div className={`stat glass ${tone}`}><div className="stat-icon"><Icon name={icon} size={22} /></div><div><small>{label}</small><strong>{value}</strong></div></div>;
}

function Row({ icon, label, value, mono }) {
  return <div className="row"><div className="row-icon"><Icon name={icon} /></div><div><small>{label}</small><span className={mono ? 'mono' : ''}>{value}</span></div></div>;
}

createRoot(document.getElementById('root')).render(<App />);
