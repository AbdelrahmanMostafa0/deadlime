import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/tags";

type ProfileCardProps = { user: { name: string; email: string; image?: string | null } };

export function ProfileCard({ user }: ProfileCardProps) {
  return (
    <Card className="flex items-center gap-4 p-5">
      {user.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatar from OAuth provider, any host
        <img src={user.image} alt="" className="size-16 shrink-0 rounded-full border-2 border-ink" />
      ) : (
        <span
          aria-hidden
          className="grid size-16 shrink-0 place-items-center rounded-full border-2 border-ink bg-sun text-2xl font-bold"
        >
          {user.name.slice(0, 1)}
        </span>
      )}
      <div className="min-w-0">
        <Label>Signed in as</Label>
        <p className="mt-1 truncate font-display-tight text-xl font-extrabold">{user.name}</p>
        <p className="truncate text-sm text-ink-2">{user.email}</p>
      </div>
    </Card>
  );
}
