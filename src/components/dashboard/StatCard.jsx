import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { createPageUrl } from "@/utils";

export default function StatCard({ to, bg, title, value, icon: Icon, iconBg, iconColor, hFull }) {
  return (
    <Link to={createPageUrl(to)} className={`block ${hFull ? 'h-full' : ''}`}>
      <Card className={`astomed-card cursor-pointer ${hFull ? 'h-full' : ''}`} style={{ background: bg || "#f4f9f9" }}>
        <CardContent className={`p-5 ${hFull ? 'h-full flex flex-col justify-center' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs astomed-muted font-medium uppercase tracking-wide">{title}</p>
              <p className="text-3xl font-bold astomed-title mt-1">{value}</p>
            </div>
            <div className="w-10 h-10 astomed-icon-box" style={{ width: 40, height: 40, ...(iconBg ? { background: iconBg } : {}) }}>
              <Icon className="w-5 h-5" style={iconColor ? { color: iconColor } : { color: "#1b3a3a" }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}