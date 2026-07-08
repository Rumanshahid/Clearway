// Telehealth video rooms via Daily.co's REST API. Requires a real Daily.co
// account and DAILY_API_KEY set in the environment -- signing up is
// self-serve (unlike Availity below), so this is a working integration once
// that env var is set, not just a stub. Without it, bookings still succeed;
// the appointment simply has no video room and the confirmation/reminder
// emails fall back to "a video link will be sent separately."
export async function createTelehealthRoom(appointmentId: string, expiresAt: string): Promise<string | null> {
  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) {
    console.log(`[telehealth skipped — DAILY_API_KEY not set] appointment=${appointmentId}`);
    return null;
  }

  try {
    const response = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `appt-${appointmentId}`,
        properties: {
          // Room disappears shortly after the appointment ends rather than
          // staying joinable (or listed in the dashboard) indefinitely.
          exp: Math.floor(new Date(expiresAt).getTime() / 1000) + 60 * 60,
        },
      }),
    });
    if (!response.ok) {
      console.error("Daily.co room creation failed", await response.text());
      return null;
    }
    const data = await response.json();
    return data.url || null;
  } catch (err) {
    console.error("Daily.co room creation threw", err);
    return null;
  }
}
