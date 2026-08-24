import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface ReportesInventarioViewProps {
  businessId?: string;
}

export function ReportesInventarioView({ businessId }: ReportesInventarioViewProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <CardTitle>Reportes</CardTitle>
        </div>
        <CardDescription>
          Reportes y análisis de inventario
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-8">
          Vista de reportes en desarrollo...
          {businessId && <span className="block text-xs mt-2">Business ID: {businessId}</span>}
        </p>
      </CardContent>
    </Card>
  );
}

