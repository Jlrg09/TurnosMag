import { QrReader } from "@blackbox-vision/react-qr-reader";
import { useState, type SetStateAction } from "react";


interface QRScannerProps {
  onScan: (qrCode: string) => void;
}

export default function QRScanner({ onScan }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <QrReader
        constraints={{ facingMode: "environment" }}
        onResult={(result: { getText: () => string; }, error: { message: SetStateAction<string | null>; }) => {
          if (!!result) {
            onScan(result.getText());
          } else if (error) {
            setError(error.message);
          }
        }}
        containerStyle={{ width: "100%" }}
      />
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}