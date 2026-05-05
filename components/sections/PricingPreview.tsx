"use client";

import Link from "next/link";
import { getPlatformIcon } from "@/components/ui/PlatformIcons";
import { Smartphone, RefreshCw, Zap } from "lucide-react";

interface PricingService {
  id: string;
  name: string;
  ourRate: number;
  min: number;
  max: number;
  refill: boolean;
  platform: { name: string; slug: string; icon: string };
}

export function PricingPreview({ services }: { services: PricingService[] }) {
  if (!services.length) return null;

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {services.map((svc) => {
        const PlatformIcon = getPlatformIcon(svc.platform.slug);
        return (
          <Link
            key={svc.id}
            href="/register"
            className="group bg-white border border-violet-100 hover:border-violet-300 rounded-2xl p-4 flex flex-col gap-3 transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
                  {PlatformIcon ? (
                    <PlatformIcon size={20} />
                  ) : (
                    <Smartphone size={16} className="text-violet-400" />
                  )}
                </div>
                <span className="text-xs font-semibold text-gray-500">{svc.platform.name}</span>
              </div>
              {svc.refill && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <RefreshCw size={10} /> رفيل
                </span>
              )}
            </div>
            <p className="text-sm text-gray-700 font-medium leading-snug line-clamp-2 flex-1">
              {svc.name}
            </p>
            <div className="flex items-end justify-between pt-1 border-t border-gray-50">
              <div>
                <div className="text-xl font-black text-emerald-600" dir="ltr">
                  ${svc.ourRate.toFixed(3)}
                </div>
                <div className="text-xs text-gray-400">/ 1000</div>
              </div>
              <div className="text-xs text-gray-400 text-left">
                <div>Min: {svc.min.toLocaleString()}</div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
