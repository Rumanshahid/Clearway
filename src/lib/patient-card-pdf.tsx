import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import QRCode from "qrcode";
import type { Database } from "@/lib/database.types";

type PatientAccountRow = Database["public"]["Tables"]["patient_accounts"]["Row"];

const styles = StyleSheet.create({
  page: { padding: 0, fontFamily: "Helvetica" },
  card: {
    margin: 48,
    padding: 28,
    border: "1 solid #E2E4E9",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: { flex: 1 },
  brand: { fontSize: 10, color: "#5B616E", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 },
  name: { fontSize: 16, fontWeight: 700, color: "#1A1D24", marginBottom: 4 },
  refLabel: { fontSize: 9, color: "#5B616E", marginTop: 10 },
  refValue: { fontSize: 20, fontWeight: 700, color: "#4F46E5" },
  qr: { width: 90, height: 90 },
  footer: { position: "absolute", bottom: 30, left: 48, right: 48, fontSize: 8, color: "#9AA0AC", textAlign: "center" },
});

export async function renderPatientCardPdf(account: PatientAccountRow) {
  const qrDataUri = await QRCode.toDataURL(account.patient_ref_id, { margin: 1, width: 200 });
  const fullName = `${account.first_name} ${account.last_name}`;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.card}>
          <View style={styles.left}>
            <Text style={styles.brand}>asaanbil.com — Patient Card</Text>
            <Text style={styles.name}>{fullName}</Text>
            <Text style={styles.refLabel}>Patient Reference ID</Text>
            <Text style={styles.refValue}>{account.patient_ref_id}</Text>
          </View>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image has no alt prop, unrelated to HTML <img> */}
          <Image src={{ uri: qrDataUri as `data:image${string}` }} style={styles.qr} />
        </View>
        <Text style={styles.footer} fixed>
          Give this to your doctor&apos;s front desk before any appointment — your information will auto-fill instantly.
        </Text>
      </Page>
    </Document>
  );
}
