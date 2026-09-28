export function Card({ children, className = "" }) {
    return (
        <div className={`bg-[#161d2a] border border-[#232d3f] rounded-xl p-5 shadow-lg ${className}`}>
            {children}
        </div>
    );
}