import { getImage } from "@/shared/lib/fileBase64Conveter";
import { CustomModal, CustomModalWindow } from "@/shared/ui/CustomModal";
import { X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type Webcam from "react-webcam";
import WebCam from "react-webcam";

export type CameraProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  onShot: (file: File) => void;
};

type FacingModeType = "environment" | "user";

const videoConstaints = {
  width: 1920,
  height: 1080,
};

export const Camera: React.FC<CameraProps> = ({ open, setOpen, onShot }) => {
  const [flash, setFlash] = useState(false);
  const [mode, setMode] = useState<FacingModeType>("environment");
  const webcamRef = useRef<Webcam | null>(null);
  const capture = useCallback(() => {
    if (webcamRef.current == null) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc == null) return console.error("Failed to get image string");
    const image = getImage(
      JSON.stringify({
        type: "image/jpeg",
        name: `screenshot-${new Date().toISOString()}`,
        base64: imageSrc.split(",")[1],
      }),
    );

    if (!image) return console.error("Failed to extract image");
    onShot(image);
    setOpen(false);
  }, [onShot, setOpen]);

  function toggleMode() {
    setMode((prev) => (prev === "user" ? "environment" : "user"));
  }

  return (
    <CustomModal open={open} setOpen={setOpen}>
      <CustomModalWindow>
        <div className="flex flex-col items-center gap-3">
          <X
            className="h-10 w-10 cursor-pointer text-red-500 self-end"
            onClick={() => setOpen(false)}
          />
          <WebCam
            ref={webcamRef}
            audio={false}
            height={1080}
            width={1920}
            screenshotFormat="image/jpeg"
            videoConstraints={
              {
                ...videoConstaints,
                torch: flash,
                facingMode: mode,
              } as MediaTrackConstraints
            }
          />
          <div className="flex justify-between items-center w-full">
            <div
              className="h-10 w-10 bg-yellow-500"
              onClick={() => setFlash((prev) => !prev)}
            />
            <div className="h-10 w-10 bg-green-500" onClick={capture} />
            <div
              className="h-10 w-10 bg-blue-500"
              onClick={() => toggleMode()}
            />
          </div>
        </div>
      </CustomModalWindow>
    </CustomModal>
  );
};
