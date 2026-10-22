import { initials } from "../utils/format";

export default function Avatar({ user, size = 40 }) {
  if (user && user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.username || "avatar"}
        style={{ width: size, height: size }}
        className="rounded-full object-cover shrink-0"
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      className="rounded-full bg-brand-500 text-white flex items-center justify-center font-semibold shrink-0"
    >
      {initials(user?.full_name || user?.username)}
    </div>
  );
}