const Loading = ({ children }) => {
  return (
    <div className="flex flex-col items-center space-y-4 text-fifa-text">
      <div className="w-10 h-10 border-4 border-fifa-border border-t-fifa-accent rounded-full animate-spin"></div>

      {children}
    </div>
  );
};

export default Loading;