import { requireCtx } from "@/lib/session";
import { NoAccess, PageHeader } from "@/ui/kit";
import { directory, listChannels } from "@/modules/chat/service";
import { photoVersions } from "@/modules/people/photos";
import { Chat } from "./Chat";

export default async function ChatPage() {
  const ctx = await requireCtx();
  if (ctx.roles.includes("patient_portal_user")) return <NoAccess what="staff chat" />;
  const [channels, people] = await Promise.all([listChannels(ctx), directory(ctx)]);
  const photos = await photoVersions(ctx.orgId, people.map((p) => p.userId));
  const initial = JSON.parse(JSON.stringify({ me: ctx.userId, channels, people: people.map((p) => ({ ...p, photo: photos.get(p.userId) ?? null })) }));
  return (
    <div>
      <PageHeader title="Team chat" sub="Talk to colleagues in channels or one to one. Keep patient details to the patient record, not here." />
      <Chat initial={initial} />
    </div>
  );
}
