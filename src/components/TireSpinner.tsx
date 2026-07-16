export default function TireSpinner({ message = "Loading tires..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5">
      {/* Spinning tire SVG */}
      <div className="relative animate-tire-bounce">
        <svg
          className="h-20 w-20 animate-tire-spin"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer tire */}
          <circle cx="50" cy="50" r="46" stroke="#1c1917" strokeWidth="8" fill="#292524" />
          {/* Tread pattern — notches around the edge */}
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (i * 360) / 16;
            const rad = (angle * Math.PI) / 180;
            const x1 = 50 + 42 * Math.cos(rad);
            const y1 = 50 + 42 * Math.sin(rad);
            const x2 = 50 + 49 * Math.cos(rad);
            const y2 = 50 + 49 * Math.sin(rad);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#44403c"
                strokeWidth="3"
                strokeLinecap="round"
              />
            );
          })}
          {/* Inner sidewall */}
          <circle cx="50" cy="50" r="30" stroke="#44403c" strokeWidth="2" fill="#1c1917" />
          {/* Rim */}
          <circle cx="50" cy="50" r="22" stroke="#a8a29e" strokeWidth="2" fill="#57534e" />
          {/* Rim spokes */}
          {Array.from({ length: 5 }).map((_, i) => {
            const angle = (i * 360) / 5 - 90;
            const rad = (angle * Math.PI) / 180;
            const x = 50 + 18 * Math.cos(rad);
            const y = 50 + 18 * Math.sin(rad);
            return (
              <line
                key={i}
                x1="50"
                y1="50"
                x2={x}
                y2={y}
                stroke="#a8a29e"
                strokeWidth="3"
                strokeLinecap="round"
              />
            );
          })}
          {/* Center hub */}
          <circle cx="50" cy="50" r="6" fill="#78716c" stroke="#a8a29e" strokeWidth="1.5" />
          {/* Lug nuts */}
          {Array.from({ length: 5 }).map((_, i) => {
            const angle = (i * 360) / 5 - 90;
            const rad = (angle * Math.PI) / 180;
            const x = 50 + 12 * Math.cos(rad);
            const y = 50 + 12 * Math.sin(rad);
            return <circle key={i} cx={x} cy={y} r="2" fill="#a8a29e" />;
          })}
          {/* Orange accent — brand ring */}
          <circle cx="50" cy="50" r="35" stroke="#FF5C00" strokeWidth="1" fill="none" opacity="0.5" />
        </svg>
      </div>

      {/* Loading text */}
      <div className="text-center">
        <p className="text-sm font-bold text-gray-900 tracking-wide uppercase font-display">
          {message}
        </p>
        <p className="mt-1 text-xs text-gray-400 font-mono">FREE SHIPPING ON ALL ORDERS</p>
      </div>
    </div>
  );
}
