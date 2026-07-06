import { avatarColorFor, initialFor } from "@/lib/avatarColor";

export default function Avatar({
  name,
  userId,
  avatarUrl,
  size = 32,
}: {
  name: string | null | undefined;
  userId: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name || "Profile photo"}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0"
      style={{ width: size, height: size, background: avatarColorFor(userId), fontSize: size * 0.42 }}
    >
      {initialFor(name)}
    </span>
  );
}
