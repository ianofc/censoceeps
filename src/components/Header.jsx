export function PageHeader({ title, subtitle, icon: Icon }) {
    return (
        <div className="mb-8 text-center sm:text-left border-b border-[#232d3f] pb-4">
            <div className="flex items-center gap-3 justify-center sm:justify-start">
                {Icon && <Icon className="w-8 h-8 text-amber-500" />}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-amber-500 tracking-wide uppercase">
                    {title}
                </h1>
            </div>
            {subtitle && <p className="text-gray-400 text-sm sm:text-base mt-1">{subtitle}</p>}
        </div>
    );
}