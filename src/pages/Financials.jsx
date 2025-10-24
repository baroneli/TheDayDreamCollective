import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  Legend,
  LineChart,
  Line,
  BarChart,
  Bar,
} from 'recharts';

const PASSWORD_STORAGE_KEY = 'ddc_financials_authed';

const revenueProjections = [
  { quarter: 'Q1 FY25', base: 48, stretch: 55 },
  { quarter: 'Q2 FY25', base: 56, stretch: 66 },
  { quarter: 'Q3 FY25', base: 64, stretch: 78 },
  { quarter: 'Q4 FY25', base: 74, stretch: 92 },
  { quarter: 'Q1 FY26', base: 84, stretch: 110 },
];

const cashFlow = [
  { month: 'Jan', inflow: 38, outflow: 26 },
  { month: 'Feb', inflow: 40, outflow: 27 },
  { month: 'Mar', inflow: 44, outflow: 30 },
  { month: 'Apr', inflow: 49, outflow: 32 },
  { month: 'May', inflow: 53, outflow: 33 },
  { month: 'Jun', inflow: 58, outflow: 35 },
];

const membershipMix = [
  { segment: 'Founders', share: 22 },
  { segment: 'Premium', share: 31 },
  { segment: 'Core', share: 37 },
  { segment: 'Corporate', share: 10 },
];

const metricCards = [
  {
    label: 'Run Rate (base)',
    value: '$720K',
    delta: '+38% YoY',
    tone: 'text-emerald-600',
  },
  {
    label: 'EBITDA Margin',
    value: '18%',
    delta: '+6 pts by Q4 FY25',
    tone: 'text-emerald-600',
  },
  {
    label: 'Cash Cushion',
    value: '11.5 months',
    delta: 'post expansion',
    tone: 'text-sky-600',
  },
];

const sectionMotion = {
  hidden: { opacity: 0, translateY: 18 },
  visible: { opacity: 1, translateY: 0 },
};

function Financials() {
  const [input, setInput] = useState('');
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState('');

  const requiredPassword = useMemo(() => (import.meta.env.VITE_PROJECTIONS_PASSWORD || '').trim(), []);

  useEffect(() => {
    if (localStorage.getItem(PASSWORD_STORAGE_KEY) === 'true') {
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (authed) {
      localStorage.setItem(PASSWORD_STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(PASSWORD_STORAGE_KEY);
    }
  }, [authed]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!requiredPassword) {
      setAuthed(true);
      return;
    }
    if (input.trim() === requiredPassword) {
      setAuthed(true);
      setError('');
      setInput('');
    } else {
      setError('The passphrase did not match. Try again?');
    }
  };

  return (
    <div className="min-h-screen bg-cream text-taupe">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <a href="/" className="font-serif text-2xl">The Daydream Collective</a>
        <p className="mt-2 text-sm opacity-70">Financial projections • strictly confidential</p>

        <AnimatePresence mode="wait">
          {!authed ? (
            <motion.section
              key="gate"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.28 }}
              className="mt-16 rounded-3xl bg-white/80 backdrop-blur-md shadow-soft border border-white/40 px-8 py-12 max-w-xl"
            >
              <h1 className="font-display text-3xl mb-4">Partner Access</h1>
              <p className="text-sm opacity-70 leading-relaxed">
                For investor eyes only. Enter the projections passphrase shared in your diligence packet.
              </p>
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div>
                  <label htmlFor="passphrase" className="block text-xs uppercase tracking-[0.2em] opacity-60 mb-2">
                    passphrase
                  </label>
                  <input
                    id="passphrase"
                    type="password"
                    className="form-input w-full rounded-pill"
                    placeholder="••••••••"
                    value={input}
                    onChange={(event) => {
                      setInput(event.target.value);
                      setError('');
                    }}
                    autoFocus
                  />
                </div>
                {error && <p className="text-sm text-rose-500">{error}</p>}
                <button type="submit" className="btn btn-primary w-full">Unlock projections</button>
                <p className="text-xs opacity-60">
                  Need access? Email <a className="underline" href="mailto:hello@daydreamcollective.com">hello@daydreamcollective.com</a>.
                </p>
              </form>
            </motion.section>
          ) : (
            <motion.div
              key="content"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
              className="mt-12 space-y-16"
            >
              <motion.section variants={sectionMotion} className="grid gap-6 md:grid-cols-3">
                {metricCards.map((metric) => (
                  <div key={metric.label} className="card p-6">
                    <p className="text-xs uppercase tracking-[0.2em] opacity-60">{metric.label}</p>
                    <p className="mt-4 text-3xl font-serif">{metric.value}</p>
                    <p className={`mt-2 text-sm ${metric.tone}`}>{metric.delta}</p>
                  </div>
                ))}
              </motion.section>

              <motion.section variants={sectionMotion} className="card p-8">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="section-kicker mb-1">Revenue trajectories</p>
                    <h2 className="section-title mb-0">Base vs. Stretch Plan</h2>
                  </div>
                  <span className="rounded-pill bg-baby/50 px-4 py-1 text-xs uppercase tracking-[0.2em]">FY25 – FY26</span>
                </div>
                <div className="mt-8 h-80">
                  <ResponsiveContainer>
                    <AreaChart data={revenueProjections} margin={{ top: 10, right: 12, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="baseGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FFCDE1" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#FFCDE1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="stretchGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#CADBFF" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#CADBFF" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(87,76,67,0.08)" />
                      <XAxis dataKey="quarter" stroke="rgba(87,76,67,0.6)" tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(87,76,67,0.6)" tickFormatter={(value) => `$${value}k`} axisLine={false} tickLine={false} width={64} />
                      <Tooltip
                        contentStyle={{ borderRadius: 16, border: '1px solid rgba(87,76,67,0.1)' }}
                        formatter={(value) => [`$${value}k`, '']}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Area type="monotone" dataKey="base" stroke="#FFCDE1" fillOpacity={1} fill="url(#baseGradient)" />
                      <Area type="monotone" dataKey="stretch" stroke="#CADBFF" fillOpacity={1} fill="url(#stretchGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.section>

              <motion.section variants={sectionMotion} className="grid gap-6 lg:grid-cols-2">
                <div className="card p-6">
                  <h3 className="font-display text-2xl">Monthly cash flow</h3>
                  <p className="text-sm opacity-70">Capex impact baked into April &amp; May for the new reformer pods.</p>
                  <div className="mt-6 h-72">
                    <ResponsiveContainer>
                      <LineChart data={cashFlow}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(87,76,67,0.08)" />
                        <XAxis dataKey="month" stroke="rgba(87,76,67,0.6)" tickLine={false} axisLine={false} />
                        <YAxis stroke="rgba(87,76,67,0.6)" tickFormatter={(value) => `$${value}k`} axisLine={false} tickLine={false} width={64} />
                        <Tooltip formatter={(value) => [`$${value}k`, '']} contentStyle={{ borderRadius: 16, border: '1px solid rgba(87,76,67,0.1)' }} />
                        <Line type="monotone" dataKey="inflow" stroke="#A8B4FF" strokeWidth={3} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="outflow" stroke="#FFCDE1" strokeWidth={3} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card p-6">
                  <h3 className="font-display text-2xl">Membership mix (FY25 exit)</h3>
                  <p className="text-sm opacity-70">Driven by pricing uplift on premium reformer programming.</p>
                  <div className="mt-6 h-72">
                    <ResponsiveContainer>
                      <BarChart data={membershipMix}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(87,76,67,0.08)" />
                        <XAxis dataKey="segment" stroke="rgba(87,76,67,0.6)" tickLine={false} axisLine={false} />
                        <YAxis stroke="rgba(87,76,67,0.6)" tickFormatter={(value) => `${value}%`} axisLine={false} tickLine={false} width={48} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Share']} contentStyle={{ borderRadius: 16, border: '1px solid rgba(87,76,67,0.1)' }} />
                        <Bar dataKey="share" radius={[12, 12, 12, 12]} fill="#B7E2FF" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.section>

              <motion.section variants={sectionMotion} className="card p-6">
                <h3 className="font-display text-2xl">Notes for diligence</h3>
                <ul className="mt-4 space-y-3 text-sm opacity-80 list-disc pl-6">
                  <li>Assumes second studio launch in Q1 FY26 with 12 month ramp to 72% utilization.</li>
                  <li>Payroll burden already reflects instructor compensation increases slated for FY25 Q3.</li>
                  <li>Cap table sensitivity available upon request; current model conservatively prices Series A at 10.5x run-rate revenue.</li>
                </ul>
              </motion.section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Financials;
