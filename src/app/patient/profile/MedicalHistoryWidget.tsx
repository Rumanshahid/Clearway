export default function MedicalHistoryWidget({
  knownDrugAllergies,
  currentMedications,
  medicalHistory,
}: {
  knownDrugAllergies?: string | null;
  currentMedications?: string | null;
  medicalHistory?: string | null;
}) {
  const hasAny = knownDrugAllergies || currentMedications || medicalHistory;

  return (
    <div className="card p-5">
      <h2 className="text-[13.5px] font-semibold mb-3">Medical History</h2>
      {hasAny ? (
        <div className="flex flex-col gap-2" style={{ fontSize: 12.5 }}>
          {knownDrugAllergies && (
            <div>
              <span className="text-gray-400">Allergies: </span>
              <span className="text-gray-700">{knownDrugAllergies}</span>
            </div>
          )}
          {currentMedications && (
            <div>
              <span className="text-gray-400">Medications: </span>
              <span className="text-gray-700">{currentMedications}</span>
            </div>
          )}
          {medicalHistory && <p className="text-gray-700">{medicalHistory}</p>}
        </div>
      ) : (
        <p className="text-gray-400" style={{ fontSize: 12.5 }}>Nothing on file yet.</p>
      )}
    </div>
  );
}
