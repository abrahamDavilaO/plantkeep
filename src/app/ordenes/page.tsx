"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loading } from "@/components/ui";
import { WorkOrders } from "./work-orders";

function WorkOrdersFromQuery() {
  const sp = useSearchParams();
  const ot = sp.get("ot");
  return <WorkOrders key={ot ?? "list"} initialOrderId={ot} />;
}

export default function OrdenesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <WorkOrdersFromQuery />
    </Suspense>
  );
}
