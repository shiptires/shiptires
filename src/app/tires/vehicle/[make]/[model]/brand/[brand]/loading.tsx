import TireSpinner from "@/components/TireSpinner";

export default function Loading() {
  return (
    <div className="min-h-screen bg-label-white">
      <TireSpinner message="Loading brand tires..." />
    </div>
  );
}
