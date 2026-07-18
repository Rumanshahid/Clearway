export default function ProfileProgressBar({ percent }: { percent: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[13px] font-medium text-gray-700">Profile completion: {percent}%</span>
      </div>
      <div className="w-full h-2 rounded-full" style={{ background: "var(--gray-100)" }}>
        <div
          className="h-2 rounded-full"
          style={{ width: `${percent}%`, background: "var(--indigo-600)", transition: "width 0.3s ease" }}
        />
      </div>
      <p className="text-[12.5px] text-gray-500 mt-1.5">
        Complete your profile so your doctor&apos;s office never has to ask for your insurance card again.
      </p>
    </div>
  );
}
