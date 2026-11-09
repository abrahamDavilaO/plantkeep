"use client";

import { Suspense } from "react";
import { Loading } from "@/components/ui";
import { useSearchParams } from "next/navigation";
import { Machines } from "./machines";

function MachinesFromQuery() {
  const sp = useSearchParams();
  const id = sp.get("id");
  return <Machines key={id ?? "none"} initialMachineId={id} />;
}

export default function MaquinasPage() {
  return (
    <Suspense fallback={<Loading />}>
      <MachinesFromQuery />
    </Suspense>
  );
}
