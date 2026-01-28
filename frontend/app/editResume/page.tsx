import { Suspense } from "react";
import EditResumeClient from "./EditResumeClient";

export default function EditResumePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      Loading editor…
    </div>}>
      <EditResumeClient />
    </Suspense>
  );
}
