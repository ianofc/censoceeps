export function Button({ children, onClick, variant = "primary", className = "", ...props }) {
    const baseStyle = "font-semibold rounded-lg px-4 py-2.5 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer";

    const variants = {
        primary: "bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md hover:shadow-amber-500/20",
        secondary: "bg-[#232d3f] hover:bg-[#2e3b52] text-gray-200 border border-slate-700",
        danger: "bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-500/40",
    };

    return (
        <button
            onClick={onClick}
            className={`${baseStyle} ${variants[variant] || variants.primary} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}