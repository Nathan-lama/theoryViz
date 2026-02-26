import { useState, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useNavigate } from 'react-router-dom'
import Terrain from '../world/Terrain'
import Sky from '../world/Sky'
import WorldRenderer from '../world/WorldRenderer'
import { theoryList } from '../theories'

const LIBRE_CARD = {
    id: null,
    title: 'Monde Libre',
    description: 'Sandbox : explore librement sans théorie',
    palette: { primary: '#A5D6A7', accent: '#81C784' },
    icon: '🌍',
    category: 'sandbox',
}

const CATEGORY_LABELS = {
    sandbox: 'Bac à sable',
    science: 'Sciences',
    philosophie: 'Philosophie',
    économie: 'Économie',
    autre: 'Autre',
}

function getTheoryIcon(t) {
    if (!t.id) return '🌍'
    if (t.id === 'evolution') return '🧬'
    if (t.id === 'marxisme') return '⚒️'
    return '📖'
}

export default function HomePage() {
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState(null)

    const cards = useMemo(() => [
        LIBRE_CARD,
        ...theoryList.map((t) => ({
            ...t,
            icon: getTheoryIcon(t),
            category: t.category || 'autre',
        })),
    ], [])

    // All categories present
    const categories = useMemo(() => {
        const cats = new Set(cards.map((c) => c.category))
        return ['sandbox', 'science', 'philosophie', 'économie', 'autre'].filter((k) => cats.has(k))
    }, [cards])

    // Filter
    const filtered = useMemo(() => {
        let result = cards
        if (search.trim()) {
            const q = search.toLowerCase()
            result = result.filter(
                (c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
            )
        }
        if (activeCategory) {
            result = result.filter((c) => c.category === activeCategory)
        }
        return result
    }, [cards, search, activeCategory])

    const handleClick = (card) => {
        if (card.id) navigate(`/world/${card.id}`)
        else navigate('/world')
    }

    return (
        <div style={styles.root}>
            {/* 3D Background */}
            <Canvas
                shadows
                dpr={[1, 2]}
                camera={{ position: [0, 18, 30], fov: 50 }}
                style={{ position: 'absolute', inset: 0 }}
            >
                <ambientLight intensity={0.5} />
                <directionalLight position={[15, 15, 10]} intensity={1.0} castShadow />
                <Sky />
                <Terrain />
                <WorldRenderer />
                <OrbitControls
                    autoRotate autoRotateSpeed={0.4}
                    enableZoom={false} enablePan={false} enableRotate={false}
                    maxPolarAngle={Math.PI / 2.5}
                />
            </Canvas>

            {/* Overlay */}
            <div style={styles.overlay}>
                {/* Header */}
                <header style={styles.header}>
                    <h1 style={styles.title}>TheoryViz</h1>
                    <p style={styles.subtitle}>Explore les grandes théories dans un monde vivant</p>
                </header>

                {/* Toolbar: search + category filters */}
                <div style={styles.toolbar}>
                    <div style={styles.searchWrap}>
                        <span style={styles.searchIcon}>🔍</span>
                        <input
                            className="search-input"
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher…"
                            style={styles.searchInput}
                        />
                    </div>

                    <div style={styles.filters}>
                        <button
                            style={{
                                ...styles.filterBtn,
                                ...(activeCategory === null ? styles.filterBtnActive : {}),
                            }}
                            onClick={() => setActiveCategory(null)}
                        >
                            Tout
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                style={{
                                    ...styles.filterBtn,
                                    ...(activeCategory === cat ? styles.filterBtnActive : {}),
                                }}
                                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                            >
                                {CATEGORY_LABELS[cat]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Card grid — scrollable */}
                <div className="scroll-area" style={styles.scrollArea}>
                    {filtered.length === 0 ? (
                        <p style={styles.noResults}>Aucune théorie trouvée</p>
                    ) : (
                        <div style={styles.grid}>
                            {filtered.map((card) => (
                                <TheoryCard key={card.id || 'libre'} card={card} onClick={() => handleClick(card)} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={styles.footer}>
                    {cards.length} théorie{cards.length > 1 ? 's' : ''} disponible{cards.length > 1 ? 's' : ''}
                </div>
            </div>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .theory-card {
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease !important;
        }
        .theory-card:hover {
          transform: translateY(-5px) scale(1.03) !important;
          border-color: var(--card-color) !important;
          box-shadow: 0 14px 44px rgba(0,0,0,0.4), 0 0 24px var(--card-glow) !important;
        }
        .theory-card:hover .card-arrow { transform: translateX(4px); }
        .theory-card:active { transform: translateY(-1px) scale(1.005) !important; }
        .search-input:focus {
          border-color: rgba(255,255,255,0.3) !important;
          background: rgba(255,255,255,0.12) !important;
        }
        .scroll-area::-webkit-scrollbar { width: 6px; }
        .scroll-area::-webkit-scrollbar-track { background: transparent; }
        .scroll-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
        .scroll-area::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
      `}</style>
        </div>
    )
}

/* ── Card Component ─────────────────────────────────────────── */

function TheoryCard({ card, onClick }) {
    const catLabel = CATEGORY_LABELS[card.category] || card.category
    return (
        <div
            className="theory-card"
            onClick={onClick}
            style={{
                ...styles.card,
                '--card-color': card.palette.primary + '80',
                '--card-glow': card.palette.primary + '30',
                borderColor: card.palette.primary + '20',
            }}
        >
            {/* Category badge */}
            <div style={styles.cardBadge}>{catLabel}</div>

            {/* Icon */}
            <div style={styles.cardIcon}>{card.icon}</div>

            {/* Body grows to push footer */}
            <div style={styles.cardBody}>
                <h3 style={{ ...styles.cardTitle, color: card.palette.primary }}>
                    {card.title}
                </h3>
                <p style={styles.cardDesc}>{card.description}</p>
            </div>

            {/* Footer — always bottom */}
            <div style={{ ...styles.cardFooter, color: card.palette.primary }}>
                <span>EXPLORER</span>
                <span className="card-arrow" style={styles.cardArrow}>→</span>
            </div>
        </div>
    )
}

/* ── Styles ──────────────────────────────────────────────────── */

const styles = {
    root: {
        width: '100vw',
        height: '100vh',
        position: 'relative',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
    },

    overlay: {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'radial-gradient(ellipse at top center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.75) 100%)',
        zIndex: 10,
    },

    header: {
        flexShrink: 0,
        textAlign: 'center',
        paddingTop: 40,
        paddingBottom: 4,
    },

    title: {
        fontSize: 60,
        fontWeight: 800,
        color: '#fff',
        margin: 0,
        letterSpacing: -2,
        textShadow: '0 4px 30px rgba(0,0,0,0.5)',
    },

    subtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.55)',
        margin: '6px 0 0 0',
        fontWeight: 400,
    },

    // ─ Toolbar
    toolbar: {
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: '16px 40px 12px',
        flexWrap: 'wrap',
    },

    searchWrap: {
        position: 'relative',
        width: 240,
    },

    searchIcon: {
        position: 'absolute',
        left: 10,
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: 13,
        pointerEvents: 'none',
    },

    searchInput: {
        width: '100%',
        padding: '8px 12px 8px 32px',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.15)',
        background: 'rgba(255,255,255,0.08)',
        color: '#fff',
        fontSize: 13,
        fontFamily: "'Inter', sans-serif",
        outline: 'none',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box',
    },

    filters: {
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
    },

    filterBtn: {
        padding: '6px 14px',
        borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.15)',
        background: 'rgba(255,255,255,0.06)',
        color: 'rgba(255,255,255,0.55)',
        fontSize: 12,
        fontWeight: 500,
        fontFamily: "'Inter', sans-serif",
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },

    filterBtnActive: {
        background: 'rgba(255,255,255,0.18)',
        color: '#fff',
        borderColor: 'rgba(255,255,255,0.35)',
    },

    // ─ Scroll area
    scrollArea: {
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '8px 40px 20px',
        display: 'flex',
        justifyContent: 'center',
    },

    noResults: {
        textAlign: 'center',
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        marginTop: 40,
    },

    // ─ Grid
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
        gap: 16,
        width: '100%',
        maxWidth: 1100,
        alignContent: 'start',
    },

    // ─ Card
    card: {
        display: 'flex',
        flexDirection: 'column',
        padding: '14px 16px 14px 16px',
        borderRadius: 14,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(14px)',
        border: '1px solid',
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        minHeight: 155,
    },

    cardBadge: {
        alignSelf: 'flex-start',
        fontSize: 9.5,
        fontWeight: 600,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.35)',
        background: 'rgba(255,255,255,0.07)',
        padding: '2px 8px',
        borderRadius: 6,
        marginBottom: 8,
    },

    cardIcon: {
        fontSize: 26,
        marginBottom: 6,
        lineHeight: 1,
    },

    cardBody: {
        flex: 1,
    },

    cardTitle: {
        margin: '0 0 4px 0',
        fontSize: 14.5,
        fontWeight: 700,
        lineHeight: 1.2,
    },

    cardDesc: {
        margin: 0,
        fontSize: 11,
        color: 'rgba(255,255,255,0.45)',
        lineHeight: 1.4,
    },

    cardFooter: {
        marginTop: 10,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 0.8,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
    },

    cardArrow: {
        display: 'inline-block',
        transition: 'transform 0.2s ease',
    },

    footer: {
        flexShrink: 0,
        textAlign: 'center',
        padding: '8px 0',
        fontSize: 11,
        color: 'rgba(255,255,255,0.2)',
        letterSpacing: 0.5,
    },
}
