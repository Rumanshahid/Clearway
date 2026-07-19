import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, fontFamily: "Helvetica", lineHeight: 1.5, color: "#1A1D24" },
  header: { marginBottom: 18, borderBottom: "1 solid #E2E4E9", paddingBottom: 14 },
  title: { fontSize: 14, fontWeight: 700, marginBottom: 3 },
  meta: { fontSize: 9.5, color: "#5B616E" },
  body: { fontSize: 11 },
});

export function PatientLetterPdfDocument({
  title,
  patientReference,
  content,
}: {
  title: string;
  patientReference: string;
  content: string;
}) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.meta}>Reference {patientReference}</Text>
        </View>
        <View style={styles.body}>
          {content.split("\n").map((line, i) => (
            <Text key={i} style={{ marginBottom: line.trim() === "" ? 6 : 2 }}>
              {line || " "}
            </Text>
          ))}
        </View>
      </Page>
    </Document>
  );
}
