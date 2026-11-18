import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Info,
  CalendarCheck,
  UserPlus,
  UtensilsCrossed,
  Menu,
  CircleAlert,
  ArrowRight,
} from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import { settingsApi } from '../../api/endpoints';
import { NotificationItem } from '../../types';
import { GlobalSearch } from './GlobalSearch';

interface TopbarProps {
  onOpenMenu?: () => void;
  onQuickBooking?: () => void;
  onQuickCheckIn?: () => void;
  onQuickOrder?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenMenu,
  onQuickBooking,
  onQuickCheckIn,
  onQuickOrder,
}) => {
  const { lastMessage } = useSocket();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [regionalTimes, setRegionalTimes] = useState({ bangladesh: '', usa: '' });
  const [selectedRegion, setSelectedRegion] = useState<'usa' | 'bangladesh'>('usa');
  const [latestSignal, setLatestSignal] = useState<NotificationItem | null>(null);
  const [signalActive, setSignalActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const routeForEvent = (eventType: string) => {
    if (eventType.includes('RESERVATION')) return '/reservations';
    if (eventType.includes('CHECK_IN') || eventType.includes('CHECK_OUT')) return '/frontdesk';
    if (eventType.includes('HOUSEKEEPING')) return '/housekeeping';
    if (eventType.includes('INVENTORY')) return '/inventory';
    if (eventType.includes('ORDER') || eventType.includes('RESTAURANT')) return '/restaurant';
    if (eventType.includes('FOLIO') || eventType.includes('PAYMENT')) return '/finance';
    if (eventType.includes('MAINTENANCE')) return '/maintenance';
    if (eventType.includes('ROOM')) return '/rooms';
    return '/';
  };

  const notificationForEvent = (eventType: string): NotificationItem => {
    const labels: Record<string, string> = {
      RESERVATION_CREATED: 'New Reservation Received',
      RESERVATION_CANCELLED: 'Reservation Cancelled',
      CHECK_IN_COMPLETED: 'Guest Check-In Completed',
      CHECK_OUT_COMPLETED: 'Guest Check-Out Completed',
      ROOM_STATUS_CHANGED: 'Room Status Updated',
      ROOM_TRANSFERRED: 'Guest Room Transferred',
      HOUSEKEEPING_TASK_CREATED: 'Housekeeping Task Created',
      HOUSEKEEPING_TASK_UPDATED: 'Housekeeping Task Updated',
      INVENTORY_UPDATED: 'Inventory Level Updated',
      RESTAURANT_ORDER_CREATED: 'New Restaurant Order',
      ORDER_CHARGED_TO_ROOM: 'Order Charged to Room',
      FOLIO_UPDATED: 'Guest Folio Updated',
      PAYMENT_RECORDED: 'Payment Recorded',
      MAINTENANCE_CREATED: 'Maintenance Request Created',
      MAINTENANCE_UPDATED: 'Maintenance Request Updated',
    };
    const title = labels[eventType] || eventType.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
    return {
      id: `live-${Date.now()}`,
      title,
      message: 'A live HotelOS activity requires your attention. Select to view the relevant workspace.',
      type: eventType.includes('CANCELLED') || eventType.includes('MAINTENANCE') ? 'warning' : 'info',
      link: routeForEvent(eventType),
      is_read: false,
      created_at: new Date().toISOString(),
    };
  };

  const playNotificationTone = () => {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      const context = audioContextRef.current || new AudioContextClass();
      audioContextRef.current = context;
      void context.resume();
      const now = context.currentTime;
      [0, 0.13].forEach((delay, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(index === 0 ? 660 : 880, now + delay);
        gain.gain.setValueAtTime(0.0001, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.055, now + delay + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.14);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now + delay);
        oscillator.stop(now + delay + 0.15);
      });
    } catch {
      // Browsers may block audio until the first user interaction; the visual signal remains available.
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatTime = (timeZone: string) => now.toLocaleTimeString('en-US', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
      });
      setRegionalTimes({
        bangladesh: formatTime('Asia/Dhaka'),
        usa: formatTime('America/New_York'),
      });
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    settingsApi.getNotifications().then(setNotifications).catch(() => {});
  }, []);

  useEffect(() => {
    const unlockAudio = () => {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass && !audioContextRef.current) audioContextRef.current = new AudioContextClass();
      void audioContextRef.current?.resume();
    };
    window.addEventListener('pointerdown', unlockAudio, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      void audioContextRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (!lastMessage) return;
    const notification = notificationForEvent(lastMessage.type);
    setNotifications((current) => [notification, ...current.filter((item) => item.id !== notification.id)]);
    setLatestSignal(notification);
    setSignalActive(true);
    playNotificationTone();
    const signalTimer = window.setTimeout(() => setSignalActive(false), 3500);
    const toastTimer = window.setTimeout(() => setLatestSignal(null), 6500);
    return () => {
      window.clearTimeout(signalTimer);
      window.clearTimeout(toastTimer);
    };
  }, [lastMessage]);

  const openNotification = async (notification: NotificationItem) => {
    if (!notification.is_read && !notification.id.startsWith('live-')) {
      await settingsApi.markNotificationRead(notification.id).catch(() => undefined);
    }
    setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, is_read: true } : item));
    setLatestSignal(null);
    setSignalActive(false);
    setShowNotifs(false);
    navigate(notification.link || '/');
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const selectedTime = selectedRegion === 'usa' ? regionalTimes.usa : regionalTimes.bangladesh;

  return (
    <header className="glass-topbar sticky top-0 z-20 flex h-[68px] w-full items-center justify-between border-b border-white/45 px-3 shadow-[0_10px_35px_rgba(8,28,37,.1)] sm:px-5">
      {/* Regional clocks */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button onClick={onOpenMenu} className="rounded-lg border border-hotel-line bg-white p-2 text-[#174b40] lg:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
        <div className="hidden h-11 items-center gap-1.5 rounded-2xl border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,.82),rgba(230,239,237,.65))] p-1.5 shadow-[0_10px_30px_rgba(13,54,47,.11),inset_0_1px_0_rgba(255,255,255,.95)] backdrop-blur-2xl sm:flex">
          <div className="flex min-w-[7rem] items-center gap-2 px-1.5 sm:min-w-[8.25rem]">
            {selectedRegion === 'bangladesh' ? (
              <span aria-label="Bangladesh" role="img" className="relative h-4 w-6 shrink-0 overflow-hidden rounded-[3px] bg-[#006a4e] shadow-sm ring-1 ring-black/10">
                <span className="absolute left-[42%] top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f42a41]" />
              </span>
            ) : (
              <span aria-label="United States" role="img" className="relative h-4 w-6 shrink-0 overflow-hidden rounded-[3px] bg-[repeating-linear-gradient(to_bottom,#b22234_0,#b22234_1.23px,#fff_1.23px,#fff_2.46px)] shadow-sm ring-1 ring-black/10">
                <span className="absolute left-0 top-0 h-[8.6px] w-[10px] bg-[#3c3b6e]" />
              </span>
            )}
            <span className="leading-none">
              <span className="block text-[8px] font-bold uppercase tracking-[.15em] text-[#647b74]">{selectedRegion === 'usa' ? 'USA / ET' : 'Bangladesh'}</span>
              <span className="mt-1 block whitespace-nowrap text-xs font-bold tabular-nums text-[#143c33]">{selectedTime}</span>
            </span>
          </div>
          <div className="flex rounded-xl border border-[#b7c9c3]/55 bg-[#dce7e3]/55 p-0.5" role="group" aria-label="Select time region">
            {(['usa', 'bangladesh'] as const).map((region) => (
              <button
                key={region}
                type="button"
                onClick={() => setSelectedRegion(region)}
                aria-pressed={selectedRegion === region}
                className={`rounded-[9px] px-2 py-1.5 text-[9px] font-extrabold tracking-[.1em] transition-all duration-200 ${selectedRegion === region ? 'bg-[#0d4b3d] text-white shadow-[0_4px_12px_rgba(13,75,61,.2)]' : 'text-[#557069] hover:bg-white/70 hover:text-[#173f36]'}`}
              >
                {region === 'usa' ? 'USA' : 'BD'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="ml-3 flex items-center gap-2 sm:gap-3.5">
        <GlobalSearch
          onQuickBooking={onQuickBooking}
          onQuickCheckIn={onQuickCheckIn}
          onQuickOrder={onQuickOrder}
        />

        {/* Quick Actions Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="flex items-center gap-1.5 rounded-lg border border-[#0d4b3d] bg-[#0d4b3d] px-3 py-2 text-xs font-bold text-white shadow-[0_5px_16px_rgba(13,75,61,.18)] hover:bg-[#083d32] transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Quick Action</span>
          </button>

          {showQuickActions && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-hotel-line bg-white p-1.5 shadow-[0_15px_50px_rgba(18,62,51,.16)]">
              <button
                onClick={() => {
                  setShowQuickActions(false);
                  onQuickBooking?.();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-hotel-text hover:bg-white/5 transition-colors"
              >
                <CalendarCheck className="h-4 w-4 text-hotel-accent" />
                <span>New Reservation</span>
              </button>
              <button
                onClick={() => {
                  setShowQuickActions(false);
                  onQuickCheckIn?.();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-hotel-text hover:bg-white/5 transition-colors"
              >
                <UserPlus className="h-4 w-4 text-emerald-400" />
                <span>Walk-In Check-In</span>
              </button>
              <button
                onClick={() => {
                  setShowQuickActions(false);
                  onQuickOrder?.();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-hotel-text hover:bg-white/5 transition-colors"
              >
                <UtensilsCrossed className="h-4 w-4 text-hotel-gold" />
                <span>New Restaurant Order</span>
              </button>
            </div>
          )}
        </div>

        {/* Notification Center */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
            aria-expanded={showNotifs}
            className={`relative rounded-lg border bg-white p-2 text-hotel-muted transition-all hover:bg-[#f4f6f2] hover:text-hotel-text ${signalActive ? 'border-hotel-accent text-hotel-accent shadow-[0_0_0_4px_rgba(182,138,53,.12)]' : 'border-hotel-line'}`}
          >
            {signalActive && <span className="absolute inset-0 animate-ping rounded-lg border border-hotel-accent/50" />}
            <Bell className={`relative h-4 w-4 ${signalActive ? 'animate-[wiggle_.45s_ease-in-out_2]' : ''}`} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-hotel-accent text-[9px] font-bold text-[#14110f]">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-1rem))] rounded-xl border border-hotel-line bg-white p-3 shadow-[0_20px_60px_rgba(18,62,51,.18)]">
              <div className="flex items-center justify-between border-b border-hotel-line pb-2">
                <span className="font-serif text-sm font-medium text-hotel-text">
                  Notifications
                </span>
                <span className="text-[10px] text-hotel-muted">
                  {unreadCount} Unread
                </span>
              </div>

              <div className="mt-2 max-h-72 space-y-2 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="py-4 text-center text-xs text-hotel-muted">
                    No new notifications
                  </p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => void openNotification(n)}
                      className={`w-full rounded-lg border p-2.5 text-left text-xs transition-all hover:border-[#b9974b]/45 hover:bg-[#f2f5f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9974b]/35 ${n.is_read ? 'border-hotel-line bg-white/40 opacity-75' : 'border-[#cbd7d0] bg-[#f8faf7]'}`}
                    >
                      <div className="flex items-center gap-1.5 font-medium text-hotel-text">
                        {n.type === 'warning' && <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />}
                        {n.type === 'success' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                        {n.type === 'info' && <Info className="h-3.5 w-3.5 text-sky-400" />}
                        {n.type === 'error' && <CircleAlert className="h-3.5 w-3.5 text-rose-500" />}
                        <span>{n.title}</span>
                        {!n.is_read && <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-hotel-accent" aria-label="Unread" />}
                      </div>
                      <p className="mt-1 text-[11px] text-hotel-muted">{n.message}</p>
                      <span className="mt-2 flex items-center justify-end gap-1 text-[10px] font-semibold text-[#315f53]">Open <ArrowRight className="h-3 w-3" /></span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {latestSignal && (
        <button
          type="button"
          onClick={() => void openNotification(latestSignal)}
          className="fixed right-3 top-[76px] z-50 flex w-[min(22rem,calc(100vw-1.5rem))] items-start gap-3 rounded-xl border border-[#c8d6cf] bg-[#fffefb]/96 p-3 text-left shadow-[0_18px_55px_rgba(18,62,51,.2)] backdrop-blur-xl transition hover:-translate-y-0.5 sm:right-5"
        >
          <span className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eaf3ee] text-[#0d6652]">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-bold text-hotel-text">{latestSignal.title}</span>
            <span className="mt-0.5 line-clamp-2 block text-[11px] leading-4 text-hotel-muted">{latestSignal.message}</span>
          </span>
          <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-hotel-accent" />
        </button>
      )}
    </header>
  );
};

