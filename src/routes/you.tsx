import { YouProfile } from "@/components/insights/you-profile";
import { TopBar } from "@/components/top-bar";
import { useAppAccount, useHabitEntries } from "@/data/hooks";
import { todayKey } from "@/lib/days";

export function You() {
  const account = useAppAccount();
  const { personal, shared } = useHabitEntries(account);

  if (!account.$isLoaded) return null;

  const myId = account.$jazz.id;
  const myName = account.profile.name ?? "You";

  return (
    <>
      <TopBar title="You" progress={null} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 pt-4 pb-24 md:pb-8">
        <YouProfile
          account={account}
          entries={[...personal, ...shared]}
          myId={myId}
          myName={myName}
          today={todayKey()}
        />
      </main>
    </>
  );
}
