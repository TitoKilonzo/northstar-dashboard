"use client";

import { Icons } from "./Icons";

const ORDER_STAGES = ["Processing", "Shipped", "In Transit", "Delivered"];

interface StatusTimelineProps {
  status: string;
}

export function StatusTimeline({ status }: StatusTimelineProps) {
  const current = ORDER_STAGES.indexOf(status);

  return (
    <div className="flex items-center gap-2">
      {ORDER_STAGES.map((stage, i) => (
        <div key={stage} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
              i < current
                ? "bg-blue-600 border-blue-600"
                : i === current
                ? "bg-blue-100 border-blue-600 ring-2 ring-blue-300"
                : "bg-gray-100 border-gray-300"
            }`}
          >
            {i < current ? (
              <span className="text-white">
                <Icons.CheckCircle />
              </span>
            ) : (
              <span className="text-xs font-semibold text-gray-600">{i + 1}</span>
            )}
          </div>
          {i < ORDER_STAGES.length - 1 && (
            <div
              className={`w-12 h-1 mx-1 ${
                i < current ? "bg-blue-600" : "bg-gray-300"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
