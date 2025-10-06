import { APIProvider } from "@vis.gl/react-google-maps";

export const GoogleMapsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <APIProvider apiKey={import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY}>
      {children}
    </APIProvider>
  );
};
