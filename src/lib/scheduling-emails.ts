function buttonHtml(href: string, label: string): string {
  return `<p style="margin:24px 0;"><a href="${href}" style="display:inline-block;background:#4F46E5;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">${label}</a></p>`;
}

function formatWhen(startIso: string): string {
  return new Date(startIso).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" });
}

export function bookingConfirmationEmail(params: {
  doctorName: string;
  appointmentTypeName: string;
  start: string;
  isTelehealth: boolean;
  isNewPatient: boolean;
  cancellationPolicyHours: number;
  manageUrl?: string;
}): { subject: string; html: string } {
  const { doctorName, appointmentTypeName, start, isTelehealth, isNewPatient, cancellationPolicyHours, manageUrl } = params;
  return {
    subject: `Appointment confirmed with ${doctorName}`,
    html: `<p>Your appointment is confirmed.</p>
<p><strong>${appointmentTypeName}</strong> with ${doctorName}<br>${formatWhen(start)}${isTelehealth ? "<br>Telehealth — a video link will be sent closer to your appointment." : ""}</p>
<p>What to bring: insurance card, photo ID${isNewPatient ? ", and any referral paperwork" : ""}.</p>
<p>Please contact the office if you need to cancel or reschedule — at least ${cancellationPolicyHours} hours ahead if you can.</p>
${manageUrl ? buttonHtml(manageUrl, "Manage this appointment →") : ""}
${manageUrl ? `<p style="font-size:13px;"><a href="${manageUrl}/intake">Fill out your pre-visit form →</a></p>` : ""}`,
  };
}

export function doctorNewBookingEmail(params: {
  patientFullName: string;
  appointmentTypeName: string;
  start: string;
  reasonForVisit: string;
  isUrgent: boolean;
}): { subject: string; html: string } {
  const { patientFullName, appointmentTypeName, start, reasonForVisit, isUrgent } = params;
  return {
    subject: `New booking: ${patientFullName} — ${formatWhen(start)}`,
    html: `<p>${isUrgent ? "<strong>Flagged urgent by the intake assistant.</strong> " : ""}New appointment booked.</p>
<p><strong>${patientFullName}</strong> — ${appointmentTypeName}<br>${formatWhen(start)}</p>
<p>Reason for visit: ${reasonForVisit}</p>`,
  };
}

export function appointmentCancelledEmail(params: {
  doctorName: string;
  appointmentTypeName: string;
  start: string;
  rebookUrl: string;
}): { subject: string; html: string } {
  const { doctorName, appointmentTypeName, start, rebookUrl } = params;
  return {
    subject: `Your appointment with ${doctorName} was cancelled`,
    html: `<p>Your <strong>${appointmentTypeName}</strong> appointment with ${doctorName} on ${formatWhen(start)} has been cancelled.</p>
${buttonHtml(rebookUrl, "Book a new time →")}`,
  };
}

export function appointmentReminderEmail(params: {
  doctorName: string;
  appointmentTypeName: string;
  start: string;
  isTelehealth: boolean;
  telehealthRoomUrl: string | null;
  hoursAhead: 24 | 2;
}): { subject: string; html: string } {
  const { doctorName, appointmentTypeName, start, isTelehealth, telehealthRoomUrl, hoursAhead } = params;
  const when = hoursAhead === 24 ? "tomorrow" : "in about 2 hours";
  return {
    subject: `Reminder: ${appointmentTypeName} with ${doctorName} ${when}`,
    html: `<p>This is a reminder about your upcoming appointment.</p>
<p><strong>${appointmentTypeName}</strong> with ${doctorName}<br>${formatWhen(start)}</p>
${isTelehealth
  ? telehealthRoomUrl
    ? buttonHtml(telehealthRoomUrl, "Join video visit →")
    : "<p>This is a telehealth visit — a video link will follow separately.</p>"
  : "<p>Please bring your insurance card and photo ID.</p>"}`,
  };
}

export function noShowReengagementEmail(params: {
  doctorName: string;
  appointmentTypeName: string;
  rebookUrl: string;
}): { subject: string; html: string } {
  const { doctorName, appointmentTypeName, rebookUrl } = params;
  return {
    subject: `We missed you today`,
    html: `<p>We missed you for your ${appointmentTypeName} with ${doctorName} today. If something came up, we'd still like to see you.</p>
${buttonHtml(rebookUrl, "Reschedule →")}`,
  };
}

export function waitlistOfferEmail(params: {
  doctorName: string;
  appointmentTypeName: string;
  start: string;
  confirmUrl: string;
}): { subject: string; html: string } {
  const { doctorName, appointmentTypeName, start, confirmUrl } = params;
  return {
    subject: `A spot opened up with ${doctorName}`,
    html: `<p>Good news — a spot just opened up for the time you were waitlisted for.</p>
<p><strong>${appointmentTypeName}</strong> with ${doctorName}<br>${formatWhen(start)}</p>
<p>This offer holds for 2 hours, then it goes to the next person on the list.</p>
${buttonHtml(confirmUrl, "Confirm this time →")}`,
  };
}

export function reviewRequestEmail(params: { doctorName: string; reviewUrl: string }): { subject: string; html: string } {
  const { doctorName, reviewUrl } = params;
  return {
    subject: `How was your visit with ${doctorName}?`,
    html: `<p>We'd love to hear how your visit went — it only takes a minute and helps other patients find the right doctor.</p>
${buttonHtml(reviewUrl, "Leave a review →")}`,
  };
}
