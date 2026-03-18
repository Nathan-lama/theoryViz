// ── Shared UI primitives for ControlPanel ────────────────────────
// Small reusable components + style constants used across all tabs.

export function SectionLabel({ children }) {
    return (
        <div style={{
            fontSize: 10,
            color: '#777',
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 4,
            fontWeight: 600,
        }}>
            {children}
        </div>
    )
}

export function Divider() {
    return <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />
}

export function StatBox({ value, label, color }) {
    return (
        <div style={{
            flex: 1,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 8,
            padding: '6px 8px',
            textAlign: 'center',
        }}>
            <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 9, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {label}
            </div>
        </div>
    )
}

export function ActionBtn({ icon, label, onClick, active, color }) {
    return (
        <button
            onClick={onClick}
            title={label}
            style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                padding: '5px 0',
                border: '1px solid',
                borderColor: active ? `${color}40` : 'rgba(255,255,255,0.08)',
                borderRadius: 6,
                background: active ? `${color}15` : 'rgba(255,255,255,0.04)',
                color: active ? color : 'rgba(255,255,255,0.5)',
                fontSize: 11,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = `${color}20`
                e.currentTarget.style.borderColor = `${color}50`
                e.currentTarget.style.color = color
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = active ? `${color}15` : 'rgba(255,255,255,0.04)'
                e.currentTarget.style.borderColor = active ? `${color}40` : 'rgba(255,255,255,0.08)'
                e.currentTarget.style.color = active ? color : 'rgba(255,255,255,0.5)'
            }}
        >
            <span style={{ fontSize: 12 }}>{icon}</span>
            <span>{label}</span>
        </button>
    )
}

// ── Style constants ──────────────────────────────────────────────

export const tabBtnStyle = {
    flex: 1,
    padding: '6px 0',
    border: 'none',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: "'Inter', sans-serif",
}

export const theoryBtnStyle = {
    padding: '5px 10px',
    border: '1px solid transparent',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
}

export const resetBtnStyle = {
    width: '100%',
    padding: '7px 0',
    border: '1px solid rgba(244,67,54,0.4)',
    borderRadius: 8,
    background: 'rgba(244,67,54,0.15)',
    color: '#EF9A9A',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
}
