'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Bed, Calendar, CircleDollarSign, Home, LogOut, Wallet, XCircle } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { bangkokDateKey } from '@/lib/dates'
import { formatCurrency } from '@/lib/utils'
import PageSpinner from '@/components/PageSpinner'
import DayBookingCard from './_components/DayBookingCard'
import OverviewCards from './_components/OverviewCards'
import PeriodPicker from './_components/PeriodPicker'
import { formatPeriod, type DayField, type Period } from './_components/period'
import { useOwnerDashboard } from './_components/useOwnerDashboard'

const SUMMARY = [
  { key: 'checkIns', label: 'เช็คอิน', icon: Home, color: 'text-green-600' },
  { key: 'checkOuts', label: 'เช็คเอาท์', icon: LogOut, color: 'text-orange-600' },
  { key: 'bookings', label: 'การจองทั้งหมด', icon: Bed, color: 'text-blue-600' },
] as const

export default function OwnerDashboard() {
  const { status } = useSession()
  const [today] = useState(() => bangkokDateKey())
  const [period, setPeriod] = useState<Period>({ from: today, to: today })
  const [by, setBy] = useState<DayField>('createdAt')
  const { data, loading } = useOwnerDashboard(status === 'authenticated', period, by)
  const oneDay = period.from === period.to
  const when = oneDay ? `ในวันที่ ${formatPeriod(period)}` : `ในช่วง ${formatPeriod(period)}`
  const lists = { checkIns: data?.checkIns ?? [], checkOuts: data?.checkOuts ?? [], bookings: data?.bookings ?? [] }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <PageSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">แดชบอร์ดเจ้าของ</h1>
          <p className="text-gray-700 text-sm sm:text-base md:text-lg">ภาพรวมการจัดการและการจองทั้งหมด</p>
        </div>

        <OverviewCards stats={data?.stats ?? null} />
        <PeriodPicker period={period} by={by} today={today} onPeriodChange={setPeriod} onByChange={setBy} />

        {data?.period && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-4 sm:mb-6">
            <PeriodFigure icon={CircleDollarSign} color="text-green-600" label="ยอดจองในช่วงนี้" value={formatCurrency(data.period.revenue)} />
            <PeriodFigure icon={Wallet} color="text-blue-600" label="รับชำระแล้ว" value={formatCurrency(data.period.received)} />
            <PeriodFigure icon={XCircle} color="text-red-600" label="ยกเลิก" value={`${data.period.cancelled} รายการ`} />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8">
          {SUMMARY.map(({ key, label, icon: Icon, color }) => (
            <div key={key} className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 text-center">
              <Icon className={`${color} mx-auto mb-2 sm:mb-3 w-6 h-6 sm:w-8 sm:h-8`} />
              <p className="text-base sm:text-lg font-semibold text-gray-700">{label}</p>
              <p className={`text-2xl sm:text-3xl font-bold ${color}`}>{lists[key].length}</p>
            </div>
          ))}
        </div>

        {loading && !data ? (
          <PageSpinner />
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {lists.checkIns.length > 0 && (
              <DaySection icon={<Home className="text-green-600 flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6" />} title={`การเช็คอิน (${lists.checkIns.length})`}>
                {lists.checkIns.map((booking) => (
                  <DayBookingCard key={booking.id} booking={booking} />
                ))}
              </DaySection>
            )}

            {lists.checkOuts.length > 0 && (
              <DaySection icon={<LogOut className="text-orange-600 flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6" />} title={`การเช็คเอาท์ (${lists.checkOuts.length})`}>
                {lists.checkOuts.map((booking) => (
                  <DayBookingCard key={booking.id} booking={booking} />
                ))}
              </DaySection>
            )}

            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex flex-wrap items-center gap-2">
                <Bed className="text-blue-600 flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6" />
                <span className="break-words">
                  รายการการจอง{by === 'createdAt' ? 'ที่สร้าง' : 'ที่เช็คอิน'}{when} ({lists.bookings.length})
                </span>
              </h2>
              {lists.bookings.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Calendar className="mx-auto text-gray-400 mb-4 w-10 h-10 sm:w-12 sm:h-12" />
                  <p className="text-gray-500 text-base sm:text-lg">
                    ไม่มีการจอง{by === 'createdAt' ? 'ที่ถูกสร้าง' : 'ที่เช็คอิน'}
                    {oneDay ? 'ในวันที่เลือก' : 'ในช่วงที่เลือก'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {lists.bookings.map((booking) => (
                    <DayBookingCard key={booking.id} booking={booking} detailed />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function PeriodFigure({ icon: Icon, color, label, value }: { icon: typeof Bed; color: string; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 flex items-center gap-3">
      <Icon className={`${color} w-7 h-7 flex-shrink-0`} />
      <div className="min-w-0">
        <p className="text-sm text-gray-600">{label}</p>
        <p className={`text-xl sm:text-2xl font-bold ${color} truncate`}>{value}</p>
      </div>
    </div>
  )
}

function DaySection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
        {icon}
        <span>{title}</span>
      </h2>
      <div className="space-y-3 sm:space-y-4">{children}</div>
    </div>
  )
}
