import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";

const API_BASE = process.env.REACT_APP_BACKEND_URL; // Must be defined in frontend/.env

function Login({ onLoggedIn }) {
  const [email, setEmail] = useState("demo@realtorspal.ai");
  const [password, setPassword] = useState("Demo123!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password });
      onLoggedIn(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Login</h2>
      <form onSubmit={submit}>
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="demo@realtorspal.ai" />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Demo123!" />
        <button disabled={loading}>{loading ? "Signing in..." : "Sign In"}</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

function Settings({ user }) {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({ openai_api_key: "", anthropic_api_key: "", gemini_api_key: "" });
  useEffect(() => {
    async function load() {
      const { data } = await axios.get(`${API_BASE}/settings`, { params: { user_id: user.id } });
      setSettings(data);
      setForm({
        openai_api_key: data.openai_api_key || "",
        anthropic_api_key: data.anthropic_api_key || "",
        gemini_api_key: data.gemini_api_key || "",
      });
    }
    load();
  }, [user.id]);

  const save = async () => {
    const { data } = await axios.post(`${API_BASE}/settings`, { user_id: user.id, ...form });
    setSettings(data);
    alert("Settings saved");
  };

  return (
    <div className="card">
      <h2>Settings</h2>
      <p className="muted">Enter your LLM provider keys here. If left empty, the system will use the Emergent universal key (when available).</p>
      <div className="grid">
        <label>OpenAI API Key</label>
        <input value={form.openai_api_key} onChange={(e) => setForm({ ...form, openai_api_key: e.target.value })} />
        <label>Anthropic API Key</label>
        <input value={form.anthropic_api_key} onChange={(e) => setForm({ ...form, anthropic_api_key: e.target.value })} />
        <label>Gemini API Key</label>
        <input value={form.gemini_api_key} onChange={(e) => setForm({ ...form, gemini_api_key: e.target.value })} />
      </div>
      <button onClick={save}>Save</button>
    </div>
  );
}

function Kanban({ user }) {
  const stages = ["New", "Contacted", "Appointment", "Onboarded", "Closed"];
  const [leads, setLeads] = useState([]);

  const byStage = useMemo(() => {
    const m = Object.fromEntries(stages.map((s) => [s, []]));
    for (const l of leads) m[l.stage]?.push(l);
    return m;
  }, [leads]);

  useEffect(() => {
    async function load() {
      const { data } = await axios.get(`${API_BASE}/leads`, { params: { user_id: user.id } });
      setLeads(data);
    }
    load();
  }, [user.id]);

  const createLead = async () => {
    const name = prompt("Lead name");
    if (!name) return;
    const { data } = await axios.post(`${API_BASE}/leads`, { name, user_id: user.id });
    setLeads((x) => [...x, data]);
  };

  const move = async (lead, stage) => {
    if (lead.stage === stage) return;
    const { data } = await axios.put(`${API_BASE}/leads/${lead.id}/stage`, { stage });
    setLeads((arr) => arr.map((l) => (l.id === data.id ? data : l)));
  };

  return (
    <div className="kanban">
      <div className="kanban-header">
        <h2>Leads Pipeline</h2>
        <button onClick={createLead}>+ New Lead</button>
      </div>
      <div className="columns">
        {stages.map((s) => (
          <div key={s} className="column">
            <div className="column-title">{s}</div>
            <div className="column-cards">
              {byStage[s].map((l) => (
                <div key={l.id} className="card lead">
                  <div className="lead-name">{l.name}</div>
                  <div className="lead-stage">
                    {stages.map((t) => (
                      <button key={t} className={t === l.stage ? "active" : ""} onClick={() => move(l, t)}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Analytics({ user }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    async function load() {
      const { data } = await axios.get(`${API_BASE}/analytics/dashboard`, { params: { user_id: user.id } });
      setData(data);
    }
    load();
  }, [user.id]);

  if (!data) return <div className="card">Loading analytics...</div>;
  return (
    <div className="card">
      <h2>Analytics</h2>
      <p>Total Leads: {data.total_leads}</p>
      <div className="grid">
        {Object.entries(data.by_stage).map(([k, v]) => (
          <div key={k} className="metric">
            <div className="metric-name">{k}</div>
            <div className="metric-value">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Chat({ user }) {
  const [messages, setMessages] = useState([{ role: "system", content: "You are a helpful assistant for RealtorsPal AI." }]);
  const [input, setInput] = useState("");
  const [provider, setProvider] = useState(""); // empty means auto/emergent
  const [model, setModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post(`${API_BASE}/ai/chat`, {
        user_id: user.id,
        messages: next,
        provider: provider || undefined,
        model: model || undefined,
        temperature: 0.7,
        max_tokens: 512,
      });
      setMessages((arr) => [...arr, { role: "assistant", content: data.content }]);
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || "Chat failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>AI Chat</h2>
      <div className="chat-toolbar">
        <div className="row">
          <div className="col">
            <label>Provider</label>
            <select value={provider} onChange={(e) => setProvider(e.target.value)}>
              <option value="">Auto (Emergent)</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="gemini">Gemini</option>
              <option value="emergent">Emergent</option>
            </select>
          </div>
          <div className="col">
            <label>Model (optional)</label>
            <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. gpt-4o-mini" />
          </div>
        </div>
      </div>
      <div className="chat-window">
        {messages.filter((m) => m.role !== "system").map((m, idx) => (
          <div key={idx} className={`bubble ${m.role}`}>
            <div className="role">{m.role}</div>
            <div className="content">{m.content}</div>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask anything about your leads, follow-ups, or property marketing..."
        />
        <button onClick={send} disabled={loading}>{loading ? "Generating..." : "Send"}</button>
      </div>
      {error && <p className="error" style={{ marginTop: 8 }}>{error}</p>}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState("kanban");

  if (!session) return <Login onLoggedIn={setSession} />;

  return (
    <div className="container">
      <header className="header">
        <h1>RealtorsPal AI</h1>
        <nav>
          <button className={tab === "kanban" ? "active" : ""} onClick={() => setTab("kanban")}>Kanban</button>
          <button className={tab === "analytics" ? "active" : ""} onClick={() => setTab("analytics")}>Analytics</button>
          <button className={tab === "chat" ? "active" : ""} onClick={() => setTab("chat")}>Chat</button>
          <button className={tab === "settings" ? "active" : ""} onClick={() => setTab("settings")}>Settings</button>
        </nav>
      </header>
      {tab === "kanban" && <Kanban user={session.user} />}
      {tab === "analytics" && <Analytics user={session.user} />}
      {tab === "chat" && <Chat user={session.user} />}
      {tab === "settings" && <Settings user={session.user} />}
    </div>
  );
}