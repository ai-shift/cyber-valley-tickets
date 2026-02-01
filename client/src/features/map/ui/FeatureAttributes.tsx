interface FeatureAttributesProps {
  attributes: Record<string, string>;
}

export const FeatureAttributes: React.FC<FeatureAttributesProps> = ({
  attributes,
}) => {
  if (!attributes || Object.keys(attributes).length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground">
        Attributes
      </h3>
      <div className="space-y-1">
        {Object.entries(attributes).map(([key, value]) => (
          <div key={key} className="flex justify-between text-sm">
            <span className="text-muted-foreground capitalize">
              {key.replace(/_/g, " ")}:
            </span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
