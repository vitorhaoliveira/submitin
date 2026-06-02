import { Check, X } from "lucide-react";

export function ComparisonRow({
  feature,
  free,
  pro,
}: {
  feature: string;
  free: boolean | string;
  pro: boolean | string;
}) {
  const renderValue = (value: boolean | string) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="h-5 w-5 text-green-600 mx-auto" />
      ) : (
        <X className="h-5 w-5 text-red-500 mx-auto" />
      );
    }
    return <span className="text-sm">{value}</span>;
  };

  return (
    <tr className="border-b last:border-b-0 hover:bg-muted/50 transition-colors">
      <td className="p-4 font-medium">{feature}</td>
      <td className="p-4 text-center">{renderValue(free)}</td>
      <td className="p-4 text-center bg-yellow-500/5">{renderValue(pro)}</td>
    </tr>
  );
}
