import React from "react";

import "react-loading-skeleton/dist/skeleton.css";
import Skeleton from "react-loading-skeleton";

import { api } from "~/api-client";
import { formatNumber } from "~/utils";

type ExplorerDetailsItemProps = {
  name: React.ReactNode;
  value: React.ReactNode;
  icon?: React.ReactNode;
};

function ExplorerDetailsItem({
  name,
  value,
  icon = null,
}: ExplorerDetailsItemProps) {
  return (
    <div className="flex items-center gap-1">
      {icon}
      <span>{name}:</span>
      {value !== undefined ? (
        <span className="font-semibold">{value}</span>
      ) : (
        <Skeleton width={50} />
      )}
    </div>
  );
}

export function ExplorerDetails() {
  const { data: syncStateData } = api.syncState.getState.useQuery();
  const explorerDetailsItems = [
    // { name: "Network", value: capitalize(env.NEXT_PUBLIC_NETWORK_NAME) },
    {
      name: "Last synced slot",
      value: syncStateData
        ? formatNumber(syncStateData.lastUpperSyncedSlot ?? 0)
        : undefined,
    },
  ];

  return (
    <div className="sm:fle flex w-full flex-wrap items-center justify-center gap-2 align-middle text-xs text-contentSecondary-light dark:text-contentSecondary-dark sm:h-4 sm:justify-start">
      {explorerDetailsItems.map(({ name, value }, i) => {
        return (
          <div key={name} className="flex items-center gap-2">
            <ExplorerDetailsItem name={name} value={value} />
            {i < explorerDetailsItems.length - 1 ? "･" : ""}
          </div>
        );
      })}
    </div>
  );
}
