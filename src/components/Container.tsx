const Container = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={`space-y-5 w-full mx-auto px-6 lg:px-8 py-8 h-[calc(100vh-90px)] overflow-y-auto ${className} bg-slate-200`}
    >
      {children}
    </div>
  );
};
export default Container;
