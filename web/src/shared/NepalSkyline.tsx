// The golden-hour scene: sky, striped retro sun, the Himalaya range and a Kathmandu skyline (pagodas and a stupa).
// Each page positions these pieces with its own CSS (.sky, .glow, .sun, .mtn, .city, .haze).
// With ids, it also adds the dusk and night skies and the stars that the portfolio fades in as you scroll.
const STARS = Array.from({ length: 70 }, (_, i) => ({ left: `${(i * 37.7) % 100}%`, top: `${(i * 53.3) % 100}%`, opacity: +(0.4 + (i % 5) * 0.12).toFixed(2) }));

export function NepalSkyline({ ids = false }: { ids?: boolean }) {
  return (
    <>
      <div className="sky gold" />
      {ids && <div className="sky dusk" id="skyDusk" />}
      {ids && <div className="sky night" id="skyNight" />}
      {ids && (
        <div className="stars" id="stars">
          {STARS.map((s, i) => <i key={i} style={s} />)}
        </div>
      )}
      <div className="glow" />
      <div className="sun" id={ids ? "sun" : undefined} />
      <svg className="mtn" id={ids ? "mtn" : undefined} viewBox="0 0 1440 300" preserveAspectRatio="none" aria-hidden="true">
        <path fill="#6b3f8f" opacity=".78" d="M0,210 L90,150 L160,185 L250,95 L330,160 L420,120 L510,175 L600,70 L700,150 L780,110 L880,170 L960,60 L1060,150 L1150,105 L1240,165 L1330,90 L1440,160 L1440,300 L0,300Z" />
        <path fill="#ffe0ec" opacity=".75" d="M250,95 L276,116 L262,113 L250,124 L238,113 L224,116Z M600,70 L630,94 L614,90 L600,102 L586,90 L570,94Z M960,60 L992,86 L974,82 L960,94 L946,82 L928,86Z M1330,90 L1358,112 L1342,108 L1330,120 L1318,108 L1302,112Z" />
        <path fill="#47286c" d="M0,250 L120,190 L210,230 L320,160 L410,215 L520,150 L640,225 L760,175 L860,230 L980,165 L1100,225 L1210,180 L1320,235 L1440,200 L1440,300 L0,300Z" />
      </svg>
      <svg className="city" id={ids ? "city" : undefined} viewBox="0 0 1440 220" preserveAspectRatio="none" aria-hidden="true">
        <g fill="#1c0d2c">
          <rect x="0" y="186" width="1440" height="34" />
          <rect x="0" y="160" width="70" height="60" /><rect x="70" y="148" width="46" height="72" /><rect x="118" y="166" width="60" height="54" />
          <rect x="300" y="158" width="80" height="62" /><rect x="380" y="170" width="50" height="50" /><rect x="470" y="160" width="56" height="60" /><rect x="560" y="150" width="60" height="70" />
          <rect x="820" y="162" width="70" height="58" /><rect x="890" y="150" width="40" height="70" /><rect x="980" y="168" width="90" height="52" />
          <rect x="1250" y="155" width="70" height="65" /><rect x="1320" y="165" width="60" height="55" /><rect x="1380" y="150" width="60" height="70" />
          {/* pagoda temple */}
          <path d="M180,186 V160 H280 V186Z M168,160 L292,160 L262,140 L198,140Z M200,140 V128 H260 V140Z M188,128 L272,128 L248,110 L212,110Z M216,110 V100 H244 V110Z M204,100 L256,100 L238,86 L222,86Z M228,86 L232,86 L230,68Z" />
          {/* stupa */}
          <path d="M640,188 Q720,92 800,188Z M708,120 H732 V102 H708Z M711,102 L729,102 L723,64 L717,64Z" />
          <circle cx="720" cy="58" r="5" />
          {/* second pagoda */}
          <path d="M1100,186 V160 H1220 V186Z M1086,160 L1234,160 L1200,136 L1120,136Z M1124,136 V124 H1196 V136Z M1108,124 L1212,124 L1186,104 L1134,104Z M1140,104 V92 H1180 V104Z M1126,92 L1194,92 L1172,76 L1148,76Z M1158,76 L1162,76 L1160,56Z" />
        </g>
        {/* the stupa's eyes, in gold */}
        <path d="M709,112 q5,-4 9,0 M722,112 q5,-4 9,0" stroke="#ffc857" strokeWidth={1.6} fill="none" />
      </svg>
      <div className="haze" />
    </>
  );
}
