import type { ReactNode } from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { DayBars, type DayBarData } from '@/components/molecules/DayBars';
import { ProportionBar, type BarSegment } from '@/components/molecules/ProportionBar';
import { StatCard } from '@/components/molecules/StatCard';

type Tone = 'neutral' | 'good' | 'warning' | 'bad';

/** Una tarjeta de «Cómo va tu negocio»: su título y una nota, y debajo una gráfica de barras, una de proporciones, líneas de texto o un aviso de que no hay datos. */
export type InsightCard =
  | { readonly id: string; readonly title: string; readonly note?: string; readonly kind: 'bars'; readonly bars: readonly DayBarData[]; readonly label: string; readonly legendCollected: string; readonly legendExpected: string; readonly showCollected: boolean }
  | { readonly id: string; readonly title: string; readonly note?: string; readonly kind: 'proportion'; readonly segments: readonly BarSegment[]; readonly label: string }
  | { readonly id: string; readonly title: string; readonly kind: 'lines'; readonly lines: readonly string[]; readonly note?: string }
  | { readonly id: string; readonly title: string; readonly kind: 'empty'; readonly note: string };

export interface InsightsSectionProps {
  readonly title: string;
  readonly kpis: readonly { readonly key: string; readonly label: string; readonly value: string; readonly tone: Tone; readonly trend: { readonly label: string; readonly tone: Tone } | null }[];
  readonly cards: readonly InsightCard[];
}

const Note = ({ children }: Readonly<{ children: ReactNode }>) => (
  <AppText variant="small" tone="muted">
    {children}
  </AppText>
);

function CardBody({ card }: Readonly<{ card: InsightCard }>) {
  switch (card.kind) {
    case 'bars':
      return <DayBars bars={card.bars} label={card.label} legendCollected={card.legendCollected} legendExpected={card.legendExpected} showCollected={card.showCollected} />;
    case 'proportion':
      return <ProportionBar segments={card.segments} label={card.label} />;
    case 'lines':
      return card.lines.map((line, index) => (
        <AppText key={line} variant={index === 0 ? 'label' : 'small'} tone={index === 0 ? 'default' : 'muted'}>
          {line}
        </AppText>
      ));
    case 'empty':
      return null;
  }
}

/**
 * «Cómo va tu negocio» en las estadísticas del administrador: indicadores y una lista de tarjetas (cobro día a día,
 * ganancia, medios de pago, colocación, visitas, cuadres y proyección). No conoce el negocio: recibe todo armado.
 */
export function InsightsSection({ title, kpis, cards }: Readonly<InsightsSectionProps>) {
  return (
    <View className="gap-4">
      <AppText variant="title">{title}</AppText>
      <View className="flex-row flex-wrap gap-3">
        {kpis.map((kpi) => (
          <StatCard key={kpi.key} label={kpi.label} value={kpi.value} tone={kpi.tone} trend={kpi.trend} className="min-w-[45%] flex-1" />
        ))}
      </View>
      {cards.map((card) => (
        <View key={card.id} className="gap-3 rounded-md border border-surface-3 bg-surface px-4 py-4">
          <AppText variant="label">{card.title}</AppText>
          {card.note ? <Note>{card.note}</Note> : null}
          <CardBody card={card} />
        </View>
      ))}
    </View>
  );
}
