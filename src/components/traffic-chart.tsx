"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useTranslation } from "react-i18next"
import type { TooltipProps } from "recharts"
import { dateUtils } from "@/lib/dateFormatter"
import { localizeDigits, byteUnit, formatBytes as formatBytesLocal } from "@/lib/numerals"

import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart"
import { Spinner } from "@/components/ui/spinner"

const chartConfig = {
  traffic: {
    label: "Traffic",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

interface TrafficDataPoint {
  period_start: string
  total_traffic: number
}

interface TrafficChartProps {
  data: TrafficDataPoint[]
  isLoading?: boolean
  error?: Error | null
  timeRange?: string
  onTimeRangeChange?: (range: string) => void
  /** Try loading the usage history again */
  onRetry?: () => void
}

interface FormattedDataPoint {
  date: string
  traffic: number
  displayTraffic: number
  _bytes: number
  _period_start: string
}

function CustomTrafficTooltip({ active, payload, showTime = false }: TooltipProps<number, string> & { showTime?: boolean }) {
  const { t, i18n } = useTranslation()
  
  if (!active || !payload || !payload.length) return null
  
  const data = payload[0].payload as FormattedDataPoint
  
  const formatBytes = (bytes: number) => formatBytesLocal(bytes, i18n.language)
  
  // Format date using dateUtils
  const d = dateUtils.toDayjs(data._period_start)
  let formattedDate: string
  
  try {
    if (i18n.language === 'fa') {
      formattedDate = d
        .toDate()
        .toLocaleString('fa-IR', {
          month: 'long',
          day: 'numeric',
          // daily points have no meaningful hour
          ...(showTime ? { hour: '2-digit' as const, minute: '2-digit' as const } : {}),
          hour12: false,
        })
        .replace(',', '،')
    } else {
      formattedDate = d.format(showTime ? 'MMM D, HH:mm' : 'MMM D')
    }
  } catch {
    formattedDate = d.format(showTime ? 'MMM D, HH:mm' : 'MMM D')
  }
  
  const isRTL = i18n.language === 'fa'
  
  return (
    <div 
      className={`min-w-[140px] rounded-lg border border-border bg-background p-3 text-sm shadow-xl ${isRTL ? 'text-right' : 'text-left'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className={`mb-2 text-sm font-semibold text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>
        <span dir="auto" className="inline-block">
          {formattedDate}
        </span>
      </div>
      <div className={`text-sm font-bold text-foreground ${isRTL ? 'text-right' : 'text-left'}`}>
        <span>{t('usage.totalUsage')}: </span>
        <span dir="auto" className="inline-block tabular-nums">
          {formatBytes(data._bytes)}
        </span>
      </div>
    </div>
  )
}

export function TrafficChart({ 
  data, 
  isLoading = false, 
  error, 
  timeRange = "7d",
  onTimeRangeChange,
  onRetry,
}: TrafficChartProps) {
  const { t, i18n } = useTranslation()

  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return []

    // Data is already filtered by the API based on timeRange
    // Just format it for the chart
    return data.map((point) => ({
      date: point.period_start,
      traffic: point.total_traffic / (1024 * 1024 * 1024), // Convert to GB
      displayTraffic: parseFloat((point.total_traffic / (1024 * 1024 * 1024)).toFixed(2)),
      _bytes: point.total_traffic,
      _period_start: point.period_start,
    }))
  }, [data])
  const hasChartPoints = filteredData.length > 0
  const reducedMotion = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const totalBytes = React.useMemo(
    () => filteredData.reduce((sum, p) => sum + (p._bytes || 0), 0),
    [filteredData]
  )

  const timeRangeOptions = [
    { value: '24h', label: t('timeRange.24h') || '24h' },
    { value: '7d', label: t('timeRange.7d') || '7d' },
    { value: '30d', label: t('timeRange.30d') || '30d' },
  ]

  return (
    <Card className="overflow-hidden gap-0 py-0 rounded-none border-0 bg-transparent shadow-none ring-0">
      {/* Usage history is secondary for most visitors, so it starts collapsed.
          Same accordion as Advanced and the apps list. */}
      <Accordion type="single" collapsible>
      <AccordionItem value="usage">
      <AccordionTrigger className="items-center min-h-14 px-1 py-4 text-base font-bold hover:no-underline">
        {t('usage.title')}
      </AccordionTrigger>
      <AccordionContent className="border-t p-0">
      <div className="flex flex-col gap-3 px-1 pt-4">
        <div className="grid grid-cols-3 gap-2" role="group" aria-label={t('usage.range')}>
          {timeRangeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={timeRange === option.value}
              onClick={() => onTimeRangeChange?.(option.value)}
              className={`inline-flex h-11 sm:h-9 items-center justify-center px-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                timeRange === option.value
                  ? 'bg-foreground/10 text-foreground ring-1 ring-foreground/25'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {!error && !isLoading && hasChartPoints && (
          <p className="text-sm text-foreground" aria-live="polite">
            {t('usage.total', { value: formatBytesLocal(totalBytes, i18n.language) })}
          </p>
        )}
      </div>
      <CardContent className="px-0 pt-4 sm:pt-6 overflow-x-hidden">
        {error ? (
          <div role="alert" className="h-[250px] w-full flex flex-col items-center justify-center gap-3 text-[15px] text-foreground">
            {t('usage.error')}
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex h-11 items-center rounded-full border border-border bg-background px-5 text-sm font-medium hover:bg-accent transition-colors"
              >
                {t('dashboard.retry')}
              </button>
            )}
          </div>
        ) : (
          <div className="relative h-[250px] w-full">
            {/* Chart Container - Always rendered to maintain DOM structure */}
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[250px] w-full max-w-full"
              aria-hidden="true"
            >
              {hasChartPoints ? (
                <BarChart 
                  data={filteredData}
                  margin={{ top: 10, right: 16, left: 16, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <YAxis
                    orientation={i18n.dir() === 'rtl' ? 'right' : 'left'}
                    width={60}
                    tickLine={false}
                    axisLine={false}
                    tickCount={4}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    tickFormatter={(v: number) => localizeDigits(`${Number(v.toFixed(1))} ${byteUnit('GB', i18n.language)}`, i18n.language)}
                  />
                  <XAxis
                    reversed={i18n.dir() === 'rtl'}
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={16}
                    tick={{ 
                      fill: 'var(--muted-foreground)',
                      fontSize: 12 
                    }}
                    tickFormatter={(value) => {
                      const d = dateUtils.toDayjs(value)
                      // For 24h, show time
                      if (timeRange === "24h") {
                        if (i18n.language === 'fa') {
                          return d.toDate().toLocaleTimeString('fa-IR', {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false
                          })
                        }
                        return d.format('HH:mm')
                      }
                      // For days, show date
                      if (i18n.language === 'fa') {
                        return d.toDate().toLocaleDateString('fa-IR', {
                          month: "short",
                          day: "numeric",
                        })
                      }
                      return d.format('MMM D')
                    }}
                  />
                  <ChartTooltip
                    cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
                    content={<CustomTrafficTooltip showTime={timeRange === '24h'} />}
                  />
                  {/* Bars: each day is a separate total, not a continuous flow */}
                  <Bar
                    dataKey="displayTraffic"
                    fill="var(--color-chart-1)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                    isAnimationActive={!reducedMotion}
                    animationDuration={500}
                  />
                </BarChart>
              ) : !isLoading ? (
                <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
                  <div className="w-10 h-10 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center">
                    <span className="text-xs">—</span>
                  </div>
                  <span>
                    {t('usage.noDataInRange')}
                  </span>
                </div>
              ) : (
                <div className="h-full w-full" />
              )}
            </ChartContainer>
            
            {/* Loading Overlay - Only shown when loading */}
            {isLoading && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-3">
                  <Spinner size="2xl" className="text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {t('common.loading')}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      </AccordionContent>
      </AccordionItem>
      </Accordion>
    </Card>
  )
}

