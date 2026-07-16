import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 48, fontFamily: "Helvetica", color: "#1A1D24" },
  card: { border: "1 solid #E2E4E9", borderRadius: 12, padding: 28, alignItems: "center" },
  brand: { fontSize: 12, fontWeight: 700, color: "#5B616E", marginBottom: 16, textTransform: "uppercase" },
  name: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  refLabel: { fontSize: 9, color: "#5B616E", marginTop: 12, textTransform: "uppercase" },
  refId: { fontSize: 22, fontWeight: 700, color: "#4F46E5", marginBottom: 16 },
  qr: { width: 120, height: 120, marginTop: 8 },
  footer: { fontSize: 9, color: "#9AA0AC", marginTop: 16, textAlign: "center" },
});

export function PatientAccountPdfDocument({
  fullName,
  patientRefId,
  qrDataUrl,
}: {
  fullName: string;
  patientRefId: string;
  qrDataUrl: string;
}) {
  return (
    <Document>
      <Page size="A6" style={styles.page}>
        <View style={styles.card}>
          <Text style={styles.brand}>Asaanbil Patient Card</Text>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.refLabel}>Patient Reference ID</Text>
          <Text style={styles.refId}>{patientRefId}</Text>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image, not next/image */}
          <Image src={qrDataUrl} style={styles.qr} />
          <Text style={styles.footer}>Present this card at your doctor&apos;s front desk to auto-fill your information.</Text>
        </View>
      </Page>
    </Document>
  );
}
