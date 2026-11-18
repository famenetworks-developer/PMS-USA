import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  BedDouble,
  Boxes,
  Calendar,
  CalendarCheck,
  ConciergeBell,
  FileBarChart2,
  LayoutDashboard,
  LoaderCircle,
  Plus,
  Receipt,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  Truck,
  UserCheck,
  UserPlus,
  Users,
  UtensilsCrossed,
  Wrench,
  X,
} from 'lucide-react';
import { guestsApi, reservationsApi, roomsApi } from '../../api/endpoints';
import { useAuth } from '../../contexts/AuthContext';
import type { Guest, Reservation, Room, UserRole } from '../../types';

type SearchItem = {
  id: string;
  title: string;
  subtitle: string;
  category: 'Page' | 'Action' | 'Room' | 'Reservation' | 'Guest';
  keywords: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  action?: () => void;
};

const pages: SearchItem[] = [
  { id: 'page-dashboard', title: 'Dashboard', subtitle: 'Live hotel overview', category: 'Page', keywords: 'home overview operations occupancy', icon: LayoutDashboard, path: '/' },
  { id: 'page-frontdesk', title: 'Front Desk', subtitle: 'Arrivals, departures and in-house guests', category: 'Page', keywords: 'check in checkout walk in reception staying guest', icon: ConciergeBell, path: '/frontdesk' },
  { id: 'page-calendar', title: 'Booking Calendar', subtitle: 'Room timeline and availability', category: 'Page', keywords: 'dates schedule room availability booking', icon: Calendar, path: '/calendar' },
  { id: 'page-reservations', title: 'Reservations', subtitle: 'Bookings and confirmations', category: 'Page', keywords: 'book reserve confirmation voucher', icon: CalendarCheck, path: '/reservations' },
  { id: 'page-rooms', title: 'Rooms & Floors', subtitle: 'Room status and inventory', category: 'Page', keywords: 'available occupied reserved dirty clean floor maintenance', icon: BedDouble, path: '/rooms' },
  { id: 'page-housekeeping', title: 'Housekeeping', subtitle: 'Cleaning and inspection workflow', category: 'Page', keywords: 'dirty clean inspected linen turnover', icon: Sparkles, path: '/housekeeping' },
  { id: 'page-guests', title: 'Guests & CRM', subtitle: 'Guest profiles and stay history', category: 'Page', keywords: 'customer vip phone email history crm', icon: Users, path: '/guests' },
  { id: 'page-restaurant', title: 'Restaurant & POS', subtitle: 'Tables, menu and orders', category: 'Page', keywords: 'food order room service dining table menu pos', icon: UtensilsCrossed, path: '/restaurant' },
  { id: 'page-finance', title: 'Billing & Folios', subtitle: 'Payments, balances and invoices', category: 'Page', keywords: 'bill payment invoice folio balance refund', icon: Receipt, path: '/finance' },
  { id: 'page-inventory', title: 'Inventory', subtitle: 'Stock and low-stock items', category: 'Page', keywords: 'stock item supplies low reorder', icon: Boxes, path: '/inventory' },
  { id: 'page-procurement', title: 'Procurement', subtitle: 'Suppliers and purchase orders', category: 'Page', keywords: 'supplier vendor purchase po order', icon: Truck, path: '/procurement' },
  { id: 'page-maintenance', title: 'Maintenance', subtitle: 'Work orders and room blocks', category: 'Page', keywords: 'repair issue engineering broken out of order', icon: Wrench, path: '/maintenance' },
  { id: 'page-employees', title: 'Employees & HR', subtitle: 'Team members and shifts', category: 'Page', keywords: 'staff employee payroll shift hr', icon: UserCheck, path: '/employees' },
  { id: 'page-revenue', title: 'Revenue & Rates', subtitle: 'ADR, RevPAR and pricing', category: 'Page', keywords: 'rate price revenue adr revpar yield', icon: TrendingUp, path: '/revenue' },
  { id: 'page-reports', title: 'Reports & Analytics', subtitle: 'Daily business reporting', category: 'Page', keywords: 'report analytics audit performance download', icon: FileBarChart2, path: '/reports' },
  { id: 'page-settings', title: 'Settings & Audit', subtitle: 'Hotel settings, users and logs', category: 'Page', keywords: 'configuration account user audit tax hotel', icon: Settings, path: '/settings' },
];

const managerRoles: UserRole[] = ['super_admin', 'hotel_owner', 'general_manager', 'hotel_manager'];
const reservationRoles: UserRole[] = [...managerRoles, 'receptionist'];
const restaurantRoles: UserRole[] = [...managerRoles, 'restaurant_manager', 'restaurant_staff'];

interface GlobalSearchProps {
  onQuickBooking?: () => void;
  onQuickCheckIn?: () => void;
  onQuickOrder?: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ onQuickBooking, onQuickCheckIn, onQuickOrder }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState<{ rooms: Room[]; reservations: Reservation[]; guests: Guest[] }>({ rooms: [], reservations: [], guests: [] });
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const role = user?.role;
  const canReserve = !!role && reservationRoles.includes(role);
  const canOrder = !!role && restaurantRoles.includes(role);

  const actions = useMemo<SearchItem[]>(() => [
    ...(canReserve && onQuickBooking ? [{ id: 'action-reservation', title: 'Create new reservation', subtitle: 'Open the reservation form', category: 'Action' as const, keywords: 'new book booking reserve add', icon: Plus, action: onQuickBooking }] : []),
    ...(canReserve && onQuickCheckIn ? [{ id: 'action-checkin', title: 'Check in a guest', subtitle: 'Open front desk arrivals', category: 'Action' as const, keywords: 'arrival walk in staying room assign', icon: UserPlus, action: onQuickCheckIn }] : []),
    ...(canOrder && onQuickOrder ? [{ id: 'action-order', title: 'Create restaurant order', subtitle: 'Open restaurant POS', category: 'Action' as const, keywords: 'food dining room service pos new', icon: UtensilsCrossed, action: onQuickOrder }] : []),
  ], [canOrder, canReserve, onQuickBooking, onQuickCheckIn, onQuickOrder]);

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    const search = query.trim();
    if (!open || search.length < 2) return;
    let current = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      const [roomsResult, reservationsResult, guestsResult] = await Promise.allSettled([
        roomsApi.getRooms(),
        reservationsApi.getReservations({ search }),
        guestsApi.getGuests({ search }),
      ]);
      if (!current) return;
      setRecords({
        rooms: roomsResult.status === 'fulfilled' ? roomsResult.value : [],
        reservations: reservationsResult.status === 'fulfilled' ? reservationsResult.value : [],
        guests: guestsResult.status === 'fulfilled' ? guestsResult.value : [],
      });
      setLoading(false);
    }, 250);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [open, query]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [...actions, ...pages].slice(0, 8);
    const matches = (item: SearchItem) => `${item.title} ${item.subtitle} ${item.keywords}`.toLowerCase().includes(normalized);
    const staticResults = [...actions, ...pages].filter(matches);
    if (normalized.length < 2) return staticResults.slice(0, 12);
    const roomResults: SearchItem[] = records.rooms
      .filter((room) => `${room.room_number} ${room.status} ${room.room_type?.name ?? ''} ${room.floor?.name ?? ''}`.toLowerCase().includes(normalized))
      .slice(0, 6)
      .map((room) => ({ id: `room-${room.id}`, title: `Room ${room.room_number}`, subtitle: `${room.room_type?.name ?? 'Guest room'} · ${room.status.replaceAll('_', ' ')}`, category: 'Room', keywords: '', icon: BedDouble, path: '/rooms' }));
    const reservationResults: SearchItem[] = records.reservations.slice(0, 6).map((reservation) => ({
      id: `reservation-${reservation.id}`,
      title: reservation.reservation_number,
      subtitle: `${reservation.guest?.first_name ?? ''} ${reservation.guest?.last_name ?? ''} · ${reservation.status.replaceAll('_', ' ')}`.trim(),
      category: 'Reservation', keywords: '', icon: CalendarCheck, path: '/reservations',
    }));
    const guestResults: SearchItem[] = records.guests.slice(0, 6).map((guest) => ({
      id: `guest-${guest.id}`,
      title: `${guest.first_name} ${guest.last_name}`,
      subtitle: guest.phone || guest.email || 'Guest profile',
      category: 'Guest', keywords: '', icon: Users, path: '/guests',
    }));
    return [...staticResults, ...roomResults, ...reservationResults, ...guestResults].slice(0, 18);
  }, [actions, query, records]);

  const close = () => {
    setOpen(false);
    setQuery('');
    setActiveIndex(0);
    setLoading(false);
    setRecords({ rooms: [], reservations: [], guests: [] });
  };

  const select = (item: SearchItem) => {
    close();
    if (item.action) item.action();
    else if (item.path) navigate(item.path);
  };

  const handleKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault();
      select(results[activeIndex]);
    }
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="global-search-trigger" aria-label="Search everything">
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">Search anything…</span>
        <kbd className="hidden lg:inline-flex">Ctrl K</kbd>
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/55 px-3 py-5 backdrop-blur-[3px] sm:pt-[8vh]" role="dialog" aria-modal="true" aria-label="Search HotelOS" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
          <div className="w-full max-w-[720px] overflow-hidden rounded-[20px] border border-white/70 bg-white shadow-[0_32px_100px_rgba(2,12,27,.38)] ring-1 ring-slate-950/10">
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 sm:px-5">
              {loading ? <LoaderCircle className="h-5 w-5 animate-spin text-emerald-600" /> : <Search className="h-5 w-5 text-slate-400" />}
              <input ref={inputRef} type="search" value={query} onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }} onKeyDown={handleKeys} placeholder="Search rooms, guests, reservations, pages or actions…" className="global-search-input h-16 min-w-0 flex-1 border-0 bg-transparent text-base text-slate-950 outline-none placeholder:text-slate-400" aria-label="Search rooms, guests, reservations, pages or actions" aria-controls="global-search-results" aria-activedescendant={results[activeIndex]?.id} />
              <button type="button" onClick={close} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close search"><X className="h-4 w-4" /></button>
            </div>

            <div id="global-search-results" className="max-h-[min(64vh,560px)] overflow-y-auto p-2 sm:p-2.5" role="listbox">
              {!query && <p className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">Quick access</p>}
              {results.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button id={item.id} key={item.id} type="button" role="option" aria-selected={index === activeIndex} onMouseEnter={() => setActiveIndex(index)} onClick={() => select(item)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${index === activeIndex ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'hover:bg-slate-50'}`}>
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.category === 'Action' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'}`}><Icon className="h-4.5 w-4.5" /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-900">{item.title}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{item.subtitle}</span></span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{item.category}</span>
                  </button>
                );
              })}
              {!loading && query && results.length === 0 && <div className="px-6 py-12 text-center"><Search className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-700">Nothing found</p><p className="mt-1 text-xs text-slate-500">Try a room number, guest name, reservation number, page or action.</p></div>}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-1 border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] text-slate-500 sm:px-5"><span>↑↓ Navigate · Enter Open · Esc Close</span><span className="hidden sm:inline">Live records appear after 2 characters</span></div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
};
