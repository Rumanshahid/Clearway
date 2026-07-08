import "../../../../landing.css";
import SiteNav from "../../../../SiteNav";
import SiteFooter from "../../../../SiteFooter";
import ConfirmClient from "./ConfirmClient";

export const metadata = { title: "Confirm Your Appointment — asaanbil.com" };

export default async function ConfirmWaitlistOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="landing-root">
      <SiteNav />
      <div className="wrap" style={{ padding: "48px 40px 80px", maxWidth: 480 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Confirm your appointment</h1>
        <ConfirmClient waitlistId={id} />
      </div>
      <SiteFooter />
    </div>
  );
}
