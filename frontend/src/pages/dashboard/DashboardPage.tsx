import React, { lazy, Suspense, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BedDouble,
  DoorOpen,
  CalendarCheck,
  Sparkles,
  Wrench,
  DollarSign,
  TrendingUp,
  Percent,
  ArrowRight,
  LogOut,
  Calendar,
  ClipboardCheck,
  UserPlus,
  Search,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import { dashboardApi, roomsApi } from '../../api/endpoints';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { DashboardData, Room } from '../../types';
const DashboardCharts = lazy(() => import('./DashboardCharts').then((module) => ({ default: module.DashboardCharts })));

const receptionRoomStyles: Record<string, { label: string; card: string; dot: string }> = {
  available: { label: 'Available', card: 'border-emerald-300 bg-emerald-50 text-emerald-950', dot: 'bg-emerald-500' },
  reserved: { label: 'Reserved', card: 'border-amber-300 bg-amber-50 text-amber-950', dot: 'bg-amber-500' },
  occupied: { label: 'Occupied', card: 'border-red-300 bg-red-50 text-red-950', dot: 'bg-red-500' },
  dirty: { label: 'Dirty', card: 'border-slate-300 bg-slate-100 text-slate-800', dot: 'bg-slate-500' },
  cleaning: { label: 'Cleaning', card: 'border-sky-300 bg-sky-50 text-sky-950', dot: 'bg-sky-500' },
  inspected: { label: 'Inspected', card: 'border-teal-300 bg-teal-50 text-teal-950', dot: 'bg-teal-500' },
  maintenance: { label: 'Maintenance', card: 'border-orange-300 bg-orange-50 text-orange-950', dot: 'bg-orange-500' },
  out_of_order: { label: 'Out of order', card: 'border-zinc-400 bg-zinc-100 text-zinc-900', dot: 'bg-zinc-600' },
};

const ReceptionDashboard: React.FC<{ data: DashboardData; rooms: Room[] }> = ({ data, rooms }) => {
  const { stats, upcoming_arrivals, upcoming_departures } = data;
  const [roomFilter, setRoomFilter] = useState<'all' | 'available' | 'reserved' | 'occupied'>('all');
  const [roomSearch, setRoomSearch] = useState('');
  const visibleRooms = rooms
    .filter((room) => roomFilter === 'all' || room.status === roomFilter)
    .filter((room) => `${room.room_number} ${room.room_type?.name ?? ''} ${room.floor?.name ?? ''}`.toLowerCase().includes(roomSearch.toLowerCase()))
    .sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true }));
  const operationalIssues = stats.dirty_rooms + stats.cleaning_rooms + stats.maintenance_rooms;

  const statusCards = [
    { key: 'available' as const, label: 'Available rooms', value: stats.available_rooms, helper: 'Clean and ready to sell', icon: DoorOpen, style: 'border-emerald-300 bg-emerald-50 text-emerald-950', iconStyle: 'bg-emerald-600 text-white' },
    { key: 'reserved' as const, label: 'Booked / reserved', value: stats.reserved_rooms, helper: `${stats.today_check_ins} arrival${stats.today_check_ins === 1 ? '' : 's'} today`, icon: CalendarCheck, style: 'border-amber-300 bg-amber-50 text-amber-950', iconStyle: 'bg-amber-500 text-white' },
    { key: 'occupied' as const, label: 'Staying now', value: stats.occupied_rooms, helper: `${stats.current_guests} in-house guest${stats.current_guests === 1 ? '' : 's'}`, icon: BedDouble, style: 'border-red-300 bg-red-50 text-red-950', iconStyle: 'bg-red-600 text-white' },
  ];

  return (
    <div className="reception-dashboard space-y-5">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" />Live front desk</div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Reception overview</h1>
            <p className="mt-1 text-sm text-slate-500">Rooms, guests, arrivals and urgent work — everything needed for this shift.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/reservations" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"><CalendarCheck className="h-4 w-4" />New reservation</Link>
            <Link to="/frontdesk" className="inline-flex items-center gap-2 rounded-lg bg-[#12384a] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0c2d3d]"><UserPlus className="h-4 w-4" />Check in guest</Link>
          </div>
        </div>

        <div className="grid gap-3 p-4 md:grid-cols-3">
          {statusCards.map(({ key, label, value, helper, icon: Icon, style, iconStyle }) => (
            <button key={key} onClick={() => setRoomFilter(roomFilter === key ? 'all' : key)} className={`flex min-h-32 items-center justify-between rounded-xl border-2 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${style} ${roomFilter === key ? 'ring-2 ring-slate-900/20 ring-offset-2' : ''}`}>
              <div><p className="text-sm font-bold uppercase tracking-wide opacity-75">{label}</p><p className="mt-1 text-4xl font-black tabular-nums">{value}</p><p className="mt-1 text-xs font-medium opacity-70">{helper}</p></div>
              <span className={`grid h-12 w-12 place-items-center rounded-xl shadow-sm ${iconStyle}`}><Icon className="h-6 w-6" /></span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link to="/frontdesk" className="reception-mini-card"><LogOut className="h-5 w-5 text-indigo-600" /><div><strong>{stats.today_check_outs}</strong><span>Departures today</span></div></Link>
        <Link to="/housekeeping" className="reception-mini-card"><Sparkles className="h-5 w-5 text-sky-600" /><div><strong>{stats.dirty_rooms + stats.cleaning_rooms}</strong><span>Need housekeeping</span></div></Link>
        <Link to="/maintenance" className="reception-mini-card"><Wrench className="h-5 w-5 text-orange-600" /><div><strong>{stats.maintenance_rooms}</strong><span>Maintenance blocks</span></div></Link>
        <Link to="/frontdesk" className="reception-mini-card"><AlertTriangle className={`h-5 w-5 ${operationalIssues ? 'text-red-600' : 'text-emerald-600'}`} /><div><strong>{operationalIssues}</strong><span>Rooms not sellable</span></div></Link>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(330px,.8fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="flex items-center gap-2 text-base font-bold text-slate-900"><Building2 className="h-5 w-5 text-slate-500" />Live room board</h2><p className="text-xs text-slate-500">Select a colour above to filter the board.</p></div>
            <label className="relative block"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={roomSearch} onChange={(event) => setRoomSearch(event.target.value)} placeholder="Find room..." className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 sm:w-48" /></label>
          </div>
          <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 px-4 py-3 text-xs font-semibold text-slate-600">
            {['available', 'reserved', 'occupied', 'dirty', 'cleaning', 'maintenance'].map((status) => <span key={status} className="flex items-center gap-1.5"><i className={`h-2.5 w-2.5 rounded-full ${receptionRoomStyles[status].dot}`} />{receptionRoomStyles[status].label}</span>)}
          </div>
          <div className="grid max-h-[440px] grid-cols-2 gap-2 overflow-y-auto p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {visibleRooms.map((room) => { const roomStyle = receptionRoomStyles[room.status] ?? receptionRoomStyles.out_of_order; return <Link to="/rooms" key={room.id} className={`min-h-24 rounded-xl border-2 p-3 transition hover:-translate-y-0.5 hover:shadow-md ${roomStyle.card}`}><div className="flex items-start justify-between gap-2"><strong className="text-xl leading-none">{room.room_number}</strong><i className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${roomStyle.dot}`} /></div><p className="mt-2 truncate text-[11px] font-semibold opacity-70">{room.room_type?.name ?? 'Guest room'}</p><p className="mt-1 text-xs font-bold">{roomStyle.label}</p></Link>; })}
            {visibleRooms.length === 0 && <div className="col-span-full py-12 text-center text-sm text-slate-500">No rooms match this filter.</div>}
          </div>
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between"><div><h2 className="font-bold text-slate-900">Today's arrivals</h2><p className="text-xs text-slate-500">Guests waiting to check in</p></div><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">{upcoming_arrivals.length}</span></div>
            <div className="space-y-2">{upcoming_arrivals.slice(0, 4).map((arrival) => <Link to="/frontdesk" key={arrival.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 hover:bg-slate-50"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{arrival.guest?.first_name} {arrival.guest?.last_name}</p><p className="truncate text-xs text-slate-500">{arrival.room?.room_number ? `Room ${arrival.room.room_number}` : arrival.room_type?.name ?? 'Room unassigned'}</p></div><ArrowRight className="h-4 w-4 shrink-0 text-slate-400" /></Link>)}{upcoming_arrivals.length === 0 && <p className="rounded-xl bg-slate-50 py-6 text-center text-xs text-slate-500">No arrivals waiting.</p>}</div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between"><div><h2 className="font-bold text-slate-900">Today's departures</h2><p className="text-xs text-slate-500">Check folio before checkout</p></div><span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-800">{upcoming_departures.length}</span></div>
            <div className="space-y-2">{upcoming_departures.slice(0, 4).map((departure) => <Link to="/frontdesk" key={departure.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 hover:bg-slate-50"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{departure.guest?.first_name} {departure.guest?.last_name}</p><p className="truncate text-xs text-slate-500">Room {departure.room?.room_number ?? '—'} · Balance {(departure.total_amount - departure.paid_amount).toLocaleString()} BDT</p></div><ClipboardCheck className="h-4 w-4 shrink-0 text-indigo-500" /></Link>)}{upcoming_departures.length === 0 && <p className="rounded-xl bg-slate-50 py-6 text-center text-xs text-slate-500">No departures scheduled.</p>}</div>
          </section>
        </div>
      </div>
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | 'month'>('today');

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', dateFilter],
    queryFn: dashboardApi.getStats,
    refetchInterval: 15000,
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms', 'reception-dashboard'],
    queryFn: () => roomsApi.getRooms(),
    enabled: user?.role === 'receptionist',
    refetchInterval: 15000,
  });

  if (isLoading || !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-hotel-accent border-t-transparent" />
          <span className="text-xs text-hotel-muted font-medium">Loading HotelOS metrics...</span>
        </div>
      </div>
    );
  }

  const { stats, revenue_trend, source_breakdown, recent_reservations, upcoming_arrivals, upcoming_departures } = data;

  if (user?.role === 'receptionist') {
    return <ReceptionDashboard data={data} rooms={rooms} />;
  }

  return (
    <div className="dashboard-glass space-y-6">
      {/* Page Header */}
      <PageHeader
        kicker="Executive Hotel Control Center"
        title="Operations Dashboard"
        description="Real-time occupancy metrics, live room turnover states, and consolidated financial telemetry for HotelOS Grand Residence."
        actions={
          <div className="flex items-center gap-2 rounded-lg border border-hotel-line bg-white/[0.02] p-1">
            <button
              onClick={() => setDateFilter('today')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                dateFilter === 'today'
                  ? 'bg-hotel-accent text-[#14110f] font-bold shadow'
                  : 'text-hotel-muted hover:text-hotel-text'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter('7days')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                dateFilter === '7days'
                  ? 'bg-hotel-accent text-[#14110f] font-bold shadow'
                  : 'text-hotel-muted hover:text-hotel-text'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDateFilter('month')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                dateFilter === 'month'
                  ? 'bg-hotel-accent text-[#14110f] font-bold shadow'
                  : 'text-hotel-muted hover:text-hotel-text'
              }`}
            >
              This Month
            </button>
          </div>
        }
      />

      {/* Row 1: Primary Key Performance Indicators */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Occupancy Rate"
          value={`${stats.occupancy_percentage.toFixed(1)}%`}
          subtitle={`${stats.occupied_rooms} of ${stats.total_rooms} rooms filled`}
          icon={Percent}
          variant="amber"
          trend={{ value: '4.2% vs last week', isPositive: true }}
        />
        <StatCard
          title="Average Daily Rate (ADR)"
          value={`${Math.round(stats.adr).toLocaleString()} BDT`}
          subtitle="Revenue per sold room"
          icon={TrendingUp}
          variant="gold"
          trend={{ value: '8.5% yield', isPositive: true }}
        />
        <StatCard
          title="RevPAR"
          value={`${Math.round(stats.revpar).toLocaleString()} BDT`}
          subtitle="Revenue per available room"
          icon={DollarSign}
          variant="emerald"
        />
        <StatCard
          title="Today's Revenue"
          value={`${stats.today_revenue.toLocaleString()} BDT`}
          subtitle={`Monthly: ${stats.monthly_revenue.toLocaleString()} BDT`}
          icon={DollarSign}
          variant="emerald"
        />
      </div>

      {/* Row 2: Secondary Operational Statuses */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-hotel-line bg-hotel-panel p-3.5">
          <div className="flex items-center justify-between text-hotel-muted text-[11px]">
            <span>Available</span>
            <DoorOpen className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 font-serif text-2xl font-bold text-emerald-400">
            {stats.available_rooms}
          </div>
          <span className="text-[10px] text-hotel-muted">Ready for booking</span>
        </div>

        <div className="rounded-xl border border-hotel-line bg-hotel-panel p-3.5">
          <div className="flex items-center justify-between text-hotel-muted text-[11px]">
            <span>Occupied</span>
            <BedDouble className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 font-serif text-2xl font-bold text-purple-300">
            {stats.occupied_rooms}
          </div>
          <span className="text-[10px] text-hotel-muted">{stats.current_guests} In-house guests</span>
        </div>

        <div className="rounded-xl border border-hotel-line bg-hotel-panel p-3.5">
          <div className="flex items-center justify-between text-hotel-muted text-[11px]">
            <span>Reserved</span>
            <CalendarCheck className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 font-serif text-2xl font-bold text-sky-400">
            {stats.reserved_rooms}
          </div>
          <span className="text-[10px] text-hotel-muted">Upcoming arrivals</span>
        </div>

        <div className="rounded-xl border border-hotel-line bg-hotel-panel p-3.5">
          <div className="flex items-center justify-between text-hotel-muted text-[11px]">
            <span>Dirty Rooms</span>
            <Sparkles className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 font-serif text-2xl font-bold text-amber-400">
            {stats.dirty_rooms}
          </div>
          <span className="text-[10px] text-hotel-muted">Requires turnover</span>
        </div>

        <div className="rounded-xl border border-hotel-line bg-hotel-panel p-3.5">
          <div className="flex items-center justify-between text-hotel-muted text-[11px]">
            <span>Today's Check-ins</span>
            <Calendar className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 font-serif text-2xl font-bold text-indigo-300">
            {stats.today_check_ins}
          </div>
          <span className="text-[10px] text-hotel-muted">Front desk arrivals</span>
        </div>

        <div className="rounded-xl border border-hotel-line bg-hotel-panel p-3.5">
          <div className="flex items-center justify-between text-hotel-muted text-[11px]">
            <span>Maintenance</span>
            <Wrench className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 font-serif text-2xl font-bold text-rose-400">
            {stats.maintenance_rooms}
          </div>
          <span className="text-[10px] text-hotel-muted">Service work orders</span>
        </div>
      </div>

      <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl border border-white/60 bg-white/55 backdrop-blur-xl" aria-label="Loading analytics" />}>
        <DashboardCharts revenueTrend={revenue_trend} sourceBreakdown={source_breakdown} />
      </Suspense>

      {/* Row 4: Front Desk Quick Glance Panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Arrivals */}
        <div className="rounded-2xl border border-hotel-line bg-hotel-panel p-6">
          <div className="flex items-center justify-between border-b border-hotel-line pb-4">
            <div>
              <span className="kicker">Arrivals Manifest</span>
              <h3 className="font-serif text-lg font-medium text-hotel-text">
                Incoming Guest Arrivals
              </h3>
            </div>
            <Link
              to="/frontdesk"
              className="flex items-center gap-1 text-xs text-hotel-gold hover:text-hotel-accent transition-colors"
            >
              <span>Front Desk</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-hotel-line">
            {upcoming_arrivals.length === 0 ? (
              <p className="py-6 text-center text-xs text-hotel-muted">No pending arrivals today</p>
            ) : (
              upcoming_arrivals.map((arr) => (
                <div key={arr.id} className="flex items-center justify-between py-3 text-xs">
                  <div>
                    <div className="font-semibold text-hotel-text">
                      {arr.guest?.first_name} {arr.guest?.last_name}
                    </div>
                    <div className="text-[11px] text-hotel-muted">
                      {arr.room_type?.name} • {arr.nights} Nights
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-serif text-xs font-semibold text-hotel-gold">
                      {arr.total_amount.toLocaleString()} BDT
                    </span>
                    <div className="text-[10px] text-hotel-muted">
                      {arr.check_in_date.split('T')[0]}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Departures */}
        <div className="rounded-2xl border border-hotel-line bg-hotel-panel p-6">
          <div className="flex items-center justify-between border-b border-hotel-line pb-4">
            <div>
              <span className="kicker">Departures Manifest</span>
              <h3 className="font-serif text-lg font-medium text-hotel-text">
                Scheduled Check-Outs
              </h3>
            </div>
            <Link
              to="/frontdesk"
              className="flex items-center gap-1 text-xs text-hotel-gold hover:text-hotel-accent transition-colors"
            >
              <span>Departures List</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-hotel-line">
            {upcoming_departures.length === 0 ? (
              <p className="py-6 text-center text-xs text-hotel-muted">No departures scheduled</p>
            ) : (
              upcoming_departures.map((dep) => (
                <div key={dep.id} className="flex items-center justify-between py-3 text-xs">
                  <div>
                    <div className="font-semibold text-hotel-text">
                      {dep.guest?.first_name} {dep.guest?.last_name}
                    </div>
                    <div className="text-[11px] text-hotel-muted">
                      Room {dep.room?.room_number || 'TBD'} • Checkout 11:00 AM
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status="occupied" size="sm" />
                    <div className="mt-1 text-[10px] text-hotel-muted">
                      Folio balance: {(dep.total_amount - dep.paid_amount).toLocaleString()} BDT
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 5: Recent Reservations Table */}
      <div className="rounded-2xl border border-hotel-line bg-hotel-panel p-6">
        <div className="flex items-center justify-between border-b border-hotel-line pb-4">
          <div>
            <span className="kicker">Master Ledger</span>
            <h3 className="font-serif text-lg font-medium text-hotel-text">
              Recent Reservations
            </h3>
          </div>
          <Link
            to="/reservations"
            className="flex items-center gap-1 text-xs text-hotel-gold hover:text-hotel-accent transition-colors"
          >
            <span>View All Bookings</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-hotel-line text-[11px] text-hotel-muted uppercase tracking-wider">
                <th className="pb-3 font-medium">Reservation #</th>
                <th className="pb-3 font-medium">Guest</th>
                <th className="pb-3 font-medium">Room Category</th>
                <th className="pb-3 font-medium">Stay Dates</th>
                <th className="pb-3 font-medium">Source</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Total (BDT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hotel-line">
              {recent_reservations.map((res) => (
                <tr key={res.id} className="hover:bg-[#f7f8f4] transition-colors">
                  <td className="py-3 font-medium text-hotel-accent">
                    {res.reservation_number}
                  </td>
                  <td className="py-3">
                    <div className="font-semibold text-hotel-text">
                      {res.guest?.first_name} {res.guest?.last_name}
                    </div>
                    <div className="text-[10px] text-hotel-muted">{res.guest?.email}</div>
                  </td>
                  <td className="py-3 text-hotel-muted">
                    {res.room_type?.name} {res.room && `(Room ${res.room.room_number})`}
                  </td>
                  <td className="py-3 text-hotel-muted">
                    {res.check_in_date.split('T')[0]} → {res.check_out_date.split('T')[0]} ({res.nights}n)
                  </td>
                  <td className="py-3 capitalize text-hotel-muted">
                    {res.booking_source}
                  </td>
                  <td className="py-3">
                    <StatusBadge status={res.status} type="reservation" size="sm" />
                  </td>
                  <td className="py-3 text-right font-serif font-semibold text-hotel-text">
                    {res.total_amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

