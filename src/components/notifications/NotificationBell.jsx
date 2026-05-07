import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.email) return;

    let cancelled = false;
    let isFetching = false;

    const fetchNotifications = async () => {
      if (cancelled || isFetching) return;
      isFetching = true;
      try {
        const unread = await base44.entities.Notification.filter(
          { user_email: user.email, is_read: false },
          "-created_date",
          50
        );
        if (!cancelled) setNotifications(unread);
      } catch (err) {
        // Silently ignore rate limit and network errors — subscription keeps us updated
        if (!err?.message?.includes("Rate limit")) {
          console.warn("NotificationBell fetch error:", err?.message);
        }
      } finally {
        isFetching = false;
      }
    };

    // Initial fetch with a longer delay to avoid rate limits on page load
    const initialTimer = setTimeout(fetchNotifications, 3000);

    // Poll every 3 minutes — subscription handles real-time updates
    const pollInterval = setInterval(fetchNotifications, 3 * 60 * 1000);

    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (cancelled) return;
      if (event.type === "create" && event.data?.user_email === user.email && !event.data.is_read) {
        setNotifications((prev) => [event.data, ...prev]);
      } else if (event.type === "update" && event.data?.user_email === user.email) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === event.id ? event.data : n)).filter((n) => !n.is_read)
        );
      } else if (event.type === "delete") {
        setNotifications((prev) => prev.filter((n) => n.id !== event.id));
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(initialTimer);
      clearInterval(pollInterval);
      unsubscribe();
    };
  }, [user?.email]);

  const markAsRead = async (notificationId) => {
    await base44.entities.Notification.update(notificationId, { is_read: true });
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const handleNotificationClick = async (notification) => {
    await markAsRead(notification.id);
    
    if (notification.related_entity) {
      let path = "";
      switch (notification.related_entity) {
        case "ServiceRecord":
          path = notification.related_entity_id ? `ServiceRecords?id=${notification.related_entity_id}` : "ServiceRecords";
          break;
        case "Machine":
          path = notification.related_entity_id ? `ServiceRecords?machine=${notification.related_entity_id}` : "Machines";
          break;
        case "Customer":
          path = notification.related_entity_id ? `CustomerDetails?id=${notification.related_entity_id}` : "Customers";
          break;
        case "ServiceContractLead":
          path = "ServiceContractLeads";
          break;
        case "PublicServiceLead":
          path = "PublicServiceLeads";
          break;
      }
      if (path) {
        navigate(createPageUrl(path));
      }
    }
    setOpen(false);
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "success":
        return "border-l-green-500 bg-green-50";
      case "warning":
        return "border-l-yellow-500 bg-yellow-50";
      case "error":
        return "border-l-red-500 bg-red-50";
      default:
        return "border-l-blue-500 bg-blue-50";
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
            <h3 className="font-semibold text-gray-900">Notifieringar</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="h-6 w-6"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              Inga nya notifieringar
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn("p-3 border-l-4 cursor-pointer hover:bg-gray-50 transition-colors", getTypeColor(notification.type))}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">{notification.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.created_date).toLocaleString("sv-SE")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}