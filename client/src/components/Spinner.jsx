export default function Spinner({ full = false }) {
  return (
    <div
      className={`flex items-center justify-center ${
        full ? "min-h-screen" : "py-8"
      }`}
    >
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}