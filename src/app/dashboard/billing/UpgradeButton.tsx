import { createCheckoutSessionAction } from "./actions";

export default function UpgradeButton({
  practiceId,
  email,
}: {
  practiceId: string;
  email: string;
}) {
  return (
    <form action={createCheckoutSessionAction}>
      <input type="hidden" name="practice_id" value={practiceId} />
      <input type="hidden" name="email" value={email} />
      <button className="btn btn-primary" type="submit">Upgrade to Practice — $249/mo</button>
    </form>
  );
}
